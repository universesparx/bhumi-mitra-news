import copy
import unittest
from datetime import date

from approved_feed import build_feed, validate_public_item

TODAY = date(2026, 10, 31)
ITEM = {
    "id": "fictional-1",
    "headline_hi": "काल्पनिक परीक्षण सूचना",
    "summary_hi": "यह वास्तविक समाचार नहीं है।",
    "source_name": "काल्पनिक स्रोत",
    "source_url": "https://example.org/fictional",
    "source_publication_date": "2026-10-20",
    "category": "circular",
    "district": "काल्पनिक",
    "status": "approved",
    "source_verified": True,
    "rights_checked": True,
    "reviewer": "private-owner",
    "editor_notes": "private notes",
}


class ApprovedFeedTests(unittest.TestCase):
    def test_approved_fixture(self):
        feed = build_feed([ITEM], TODAY)
        self.assertEqual(feed["schema_version"], 1)
        self.assertEqual(len(feed["items"]), 1)

    def test_no_private_fields(self):
        output = validate_public_item(ITEM, TODAY)
        self.assertNotIn("reviewer", output)
        self.assertNotIn("editor_notes", output)
        self.assertNotIn("status", output)

    def test_pending_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, status="pending"), TODAY)

    def test_rejected_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, status="rejected"), TODAY)

    def test_retracted_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, retracted=True), TODAY)

    def test_unverified_source_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, source_verified=False), TODAY)

    def test_unchecked_rights_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, rights_checked=False), TODAY)

    def test_http_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, source_url="http://example.org"), TODAY)

    def test_credentials_in_url_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, source_url="https://u:p@example.org"), TODAY)

    def test_future_date_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, source_publication_date="2026-11-01"), TODAY)

    def test_invalid_date_denied(self):
        with self.assertRaises(ValueError):
            validate_public_item(dict(ITEM, source_publication_date="yesterday"), TODAY)

    def test_duplicate_ids_denied(self):
        with self.assertRaises(ValueError):
            build_feed([ITEM, copy.deepcopy(ITEM)], TODAY)

    def test_unsafe_item_blocks_entire_feed(self):
        with self.assertRaises(ValueError):
            build_feed([ITEM, dict(ITEM, id="fictional-2", status="pending")], TODAY)

    def test_empty_feed(self):
        self.assertEqual(build_feed([], TODAY)["items"], [])


if __name__ == "__main__":
    unittest.main()
