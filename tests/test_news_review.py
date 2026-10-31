"""Offline regression tests: python -m unittest discover -s tests -v"""
import copy
import unittest

from news_review import add, approved_only, item_id, normalize_url, review, validate

EXAMPLE = {
    "source_url": "https://example.org/sample-notice?utm_source=test",
    "source_name": "काल्पनिक उदाहरण स्रोत",
    "headline_hi": "यह केवल परीक्षण के लिए काल्पनिक सूचना है",
    "summary_hi": "इस उदाहरण का किसी वास्तविक सरकारी सूचना से संबंध नहीं है।",
    "category": "circular",
    "district": "काल्पनिक",
    "source_publication_date": None,
}


class NewsReviewTests(unittest.TestCase):
    def test_candidate_starts_pending(self):
        self.assertEqual(validate(EXAMPLE)["status"], "pending")

    def test_deduplicate_tracking_parameters(self):
        queue = []
        add(queue, EXAMPLE)
        duplicate = copy.deepcopy(EXAMPLE)
        duplicate["source_url"] = "https://example.org/sample-notice"
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            add(queue, duplicate)

    def test_invalid_source_url_rejected(self):
        bad = dict(EXAMPLE, source_url="file:///etc/passwd")
        with self.assertRaises(ValueError):
            validate(bad)

    def test_no_unapproved_items_in_export(self):
        queue = []
        item = add(queue, EXAMPLE)
        self.assertEqual(approved_only(queue), [])
        review(queue, item["id"], "rejected", "owner")
        self.assertEqual(approved_only(queue), [])

    def test_approved_only_after_manual_review(self):
        queue = []
        item = add(queue, EXAMPLE)
        review(queue, item["id"], "approved", "owner")
        result = approved_only(queue)
        self.assertEqual(len(result), 1)
        self.assertNotIn("reviewer", result[0])

    def test_double_review_prevented(self):
        queue = []
        item = add(queue, EXAMPLE)
        review(queue, item["id"], "approved", "owner")
        with self.assertRaisesRegex(ValueError, "already reviewed"):
            review(queue, item["id"], "rejected", "owner")

    def test_reviewer_required(self):
        queue = []
        item = add(queue, EXAMPLE)
        with self.assertRaisesRegex(ValueError, "Reviewer"):
            review(queue, item["id"], "approved", " ")

    def test_normalization(self):
        self.assertEqual(normalize_url("HTTPS://EXAMPLE.ORG/a/?utm_medium=x&b=2"),
                         "https://example.org/a?b=2")
        self.assertEqual(item_id(EXAMPLE["source_url"]),
                         item_id("https://example.org/sample-notice"))


if __name__ == "__main__":
    unittest.main()
