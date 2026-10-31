import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "cloudflare" / "wrangler.jsonc"
WORKER = ROOT / "cloudflare" / "src" / "index.js"


class CloudflareScaffoldTests(unittest.TestCase):
    def test_separate_worker_name(self):
        text = CONFIG.read_text(encoding="utf-8")
        self.assertIn('"name": "bhumi-mitra-news"', text)
        self.assertNotIn("land-advisor", text.lower())

    def test_no_public_workers_dev_deployment(self):
        self.assertIn('"workers_dev": false', CONFIG.read_text(encoding="utf-8"))

    def test_no_database_or_r2_bindings_yet(self):
        text = CONFIG.read_text(encoding="utf-8")
        for key in ('"d1_databases"', '"r2_buckets"', '"routes"'):
            self.assertNotIn(key, text)

    def test_no_publishing_or_collection_enabled(self):
        text = CONFIG.read_text(encoding="utf-8")
        self.assertIn('"NEWS_PUBLISHING_ENABLED": "false"', text)
        self.assertIn('"NEWS_COLLECTION_ENABLED": "false"', text)

    def test_only_health_and_closed_routes(self):
        text = WORKER.read_text(encoding="utf-8")
        self.assertIn('url.pathname === "/health"', text)
        self.assertIn('status: 404', text)
        self.assertNotIn('env.DB', text)
        self.assertNotIn('env.R2', text)
        self.assertNotIn('request.json()', text)


if __name__ == "__main__":
    unittest.main()
