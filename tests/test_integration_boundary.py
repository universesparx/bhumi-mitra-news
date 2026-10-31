from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
BOUNDARY = ROOT / "cloudflare/INTEGRATION_VERIFICATION_BOUNDARY.md"
WORKFLOW = ROOT / ".github/workflows/offline-tests.yml"
CONFIG = ROOT / "cloudflare/wrangler.jsonc"


class IntegrationBoundaryTests(unittest.TestCase):
    def test_documentation_does_not_claim_end_to_end(self):
        text = BOUNDARY.read_text(encoding="utf-8")
        self.assertIn("not", text.lower())
        self.assertIn("real D1 binding", text)
        self.assertIn("have **not** been exercised", text)

    def test_local_d1_checks_remain_in_ci(self):
        self.assertIn("node scripts/local-d1-check.mjs",
                      WORKFLOW.read_text(encoding="utf-8"))

    def test_production_flags_stay_off(self):
        text = CONFIG.read_text(encoding="utf-8")
        for flag in ("NEWS_PUBLISHING_ENABLED", "NEWS_COLLECTION_ENABLED",
                     "EDITORIAL_WRITES_ENABLED", "AUTH_ENABLED"):
            self.assertIn(f'"{flag}": "false"', text)
        self.assertIn('"workers_dev": false', text)


if __name__ == "__main__":
    unittest.main()
