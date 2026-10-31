from pathlib import Path
import unittest

HTML = (Path(__file__).resolve().parents[1] /
        "prototype/editorial-workspace.html").read_text(encoding="utf-8")


class WorkspacePrototypeTests(unittest.TestCase):
    def test_responsive_and_accessible(self):
        self.assertIn('name="viewport"', HTML)
        self.assertIn("@media(max-width:760px)", HTML)
        self.assertIn('aria-live="polite"', HTML)

    def test_local_only_no_network_or_persistence(self):
        for forbidden in ("fetch(", "XMLHttpRequest", "localStorage",
                          "sessionStorage", "indexedDB", "Authorization"):
            self.assertNotIn(forbidden, HTML)
        self.assertIn("const items=[]", HTML)

    def test_safe_user_content_rendering(self):
        self.assertIn("el.textContent=value", HTML)
        self.assertNotIn("innerHTML", HTML)
        self.assertIn('link.rel="noopener noreferrer"', HTML)

    def test_pending_review_and_preview(self):
        for expected in ('status:"pending"', '"approved"', '"rejected"',
                         'item.status==="approved"', 'parsed.protocol!=="https:"'):
            self.assertIn(expected, HTML)


if __name__ == "__main__":
    unittest.main()
