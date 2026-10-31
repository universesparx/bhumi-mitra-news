import sqlite3
import unittest
from pathlib import Path

SQL = (Path(__file__).resolve().parents[1] / "cloudflare" /
       "migrations" / "0001_news_schema.sql").read_text(encoding="utf-8")


class NewsSchemaTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.executescript(SQL)

    def tearDown(self):
        self.db.close()

    def test_tables_created(self):
        tables = {r[0] for r in self.db.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertTrue({"editorial_items", "review_events",
                         "rights_evidence"}.issubset(tables))

    def test_pending_default(self):
        self.db.execute("""INSERT INTO editorial_items
          (id, headline_hi, summary_hi, source_name, source_url,
           source_publication_date, category, created_at, updated_at)
           VALUES ('a','शीर्षक','विवरण','स्रोत','https://example.org/a',
                   '2026-10-30','circular','2026-10-31','2026-10-31')""")
        self.assertEqual(self.db.execute(
            "SELECT status FROM editorial_items WHERE id='a'").fetchone()[0],
            "pending")

    def test_invalid_status_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("""INSERT INTO editorial_items
              (id,headline_hi,summary_hi,source_name,source_url,
               source_publication_date,category,status,created_at,updated_at)
               VALUES ('a','x','y','s','https://example.org/a',
                       '2026-10-30','circular','published','now','now')""")

    def test_duplicate_url_rejected(self):
        values = ('x','title','summary','source','https://example.org/a',
                  '2026-10-30','circular','now','now')
        sql = """INSERT INTO editorial_items
            (id,headline_hi,summary_hi,source_name,source_url,
             source_publication_date,category,created_at,updated_at)
             VALUES (?,?,?,?,?,?,?,?,?)"""
        self.db.execute(sql, values)
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(sql, ('y',)+values[1:])

    def test_review_requires_existing_item(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("""INSERT INTO review_events
              (id,item_id,action,reviewer_id,occurred_at)
              VALUES ('r','nonexistent','approve','owner','now')""")


if __name__ == "__main__":
    unittest.main()
