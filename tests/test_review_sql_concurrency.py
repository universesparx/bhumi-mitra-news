"""SQLite regression for D1-style guarded updates and audit insertion.

This validates SQL behavior in SQLite, NOT Cloudflare D1 concurrency guarantees.
"""
import sqlite3
import unittest
from pathlib import Path

SCHEMA = (Path(__file__).resolve().parents[1] / "cloudflare" /
          "migrations" / "0001_news_schema.sql").read_text(encoding="utf-8")

UPDATE = """UPDATE editorial_items SET status=?, retracted=?,
    version=version+1, updated_at=?
    WHERE id=? AND version=? AND status=?"""
AUDIT = """INSERT INTO review_events
    (id,item_id,action,reviewer_id,reason,occurred_at)
    SELECT ?,id,?,?,?,? FROM editorial_items
    WHERE id=? AND version=? AND status=?"""


class ReviewConcurrencySQLTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.executescript(SCHEMA)
        self.db.execute("""INSERT INTO editorial_items
          (id,headline_hi,summary_hi,source_name,source_url,
           source_publication_date,category,created_at,updated_at,
           source_verified,rights_checked)
          VALUES ('a','शीर्षक','विवरण','source','https://example.org/a',
                  '2026-10-30','circular','now','now',1,1)""")
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def apply(self, event_id, old_version=1, old_status="pending",
              next_status="approved"):
        with self.db:
            updated = self.db.execute(UPDATE, (
                next_status, 0, "later", "a", old_version, old_status))
            audited = self.db.execute(AUDIT, (
                event_id, "approve", "owner", "checked", "later",
                "a", old_version+1, next_status))
            return updated.rowcount, audited.rowcount

    def test_approved_transition_has_one_audit(self):
        self.assertEqual(self.apply("event1"), (1, 1))
        self.assertEqual(self.db.execute(
            "SELECT status,version FROM editorial_items").fetchone(),
            ("approved", 2))
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM review_events").fetchone()[0], 1)

    def test_stale_duplicate_review_cannot_create_audit(self):
        self.assertEqual(self.apply("event1"), (1, 1))
        self.assertEqual(self.apply("event2"), (0, 0))
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM review_events").fetchone()[0], 1)

    def test_wrong_status_cannot_create_audit(self):
        self.assertEqual(self.apply("event1", old_status="rejected"), (0, 0))
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM review_events").fetchone()[0], 0)

    def test_failed_audit_rolls_back_update_when_transactional(self):
        self.db.execute("""INSERT INTO review_events
          (id,item_id,action,reviewer_id,occurred_at)
          VALUES ('duplicate','a','create','owner','now')""")
        with self.assertRaises(sqlite3.IntegrityError):
            with self.db:
                self.db.execute(UPDATE, ("approved",0,"later","a",1,"pending"))
                self.db.execute(AUDIT, (
                    "duplicate","approve","owner","checked","later",
                    "a",2,"approved"))
        self.assertEqual(self.db.execute(
            "SELECT status,version FROM editorial_items").fetchone(),
            ("pending",1))


if __name__ == "__main__":
    unittest.main()
