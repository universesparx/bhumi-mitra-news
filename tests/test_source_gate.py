import copy
import json
import unittest
from datetime import date
from pathlib import Path

from source_gate import can_collect, check_source

TODAY = date(2026, 10, 31)
VALID = {
    "id": "fictional",
    "url": "https://example.org/allowed",
    "automation_permission": "verified",
    "republication_permission": "verified",
    "collection_enabled": True,
    "evidence": {
        "permission_basis": "Written permission for testing",
        "permission_reference": "https://example.org/permission",
        "reviewed_by": "owner",
        "reviewed_on": "2026-10-30",
    },
}


class SourceGateTests(unittest.TestCase):
    def test_real_registry_denied(self):
        registry = json.loads((Path(__file__).resolve().parents[1] /
                               "source_registry.json").read_text(encoding="utf-8"))
        for source in registry["sources"]:
            with self.subTest(source=source["id"]):
                self.assertFalse(can_collect(registry, source["id"], TODAY))

    def test_valid_evidence_still_needs_global_switch(self):
        self.assertFalse(can_collect({"collection_enabled": False,
                                      "sources": [VALID]}, "fictional", TODAY))

    def test_verified_synthetic_fixture(self):
        self.assertTrue(can_collect({"collection_enabled": True,
                                     "sources": [VALID]}, "fictional", TODAY))

    def test_unverified_permission_denied(self):
        s = dict(VALID, automation_permission="unverified")
        self.assertTrue(check_source(s, TODAY))

    def test_missing_evidence_denied(self):
        s = dict(VALID, evidence={})
        self.assertTrue(check_source(s, TODAY))

    def test_stale_review_denied(self):
        s = copy.deepcopy(VALID)
        s["evidence"]["reviewed_on"] = "2025-01-01"
        self.assertTrue(check_source(s, TODAY))

    def test_future_review_denied(self):
        s = copy.deepcopy(VALID)
        s["evidence"]["reviewed_on"] = "2027-01-01"
        self.assertTrue(check_source(s, TODAY))

    def test_invalid_date_denied(self):
        s = copy.deepcopy(VALID)
        s["evidence"]["reviewed_on"] = "tomorrow"
        self.assertTrue(check_source(s, TODAY))

    def test_http_denied(self):
        s = dict(VALID, url="http://example.org/allowed")
        self.assertTrue(check_source(s, TODAY))

    def test_duplicate_source_id_denied(self):
        self.assertFalse(can_collect({"collection_enabled": True,
                                      "sources": [VALID, VALID]}, "fictional", TODAY))

    def test_unknown_source_denied(self):
        self.assertFalse(can_collect({"collection_enabled": True,
                                      "sources": [VALID]}, "unknown", TODAY))


if __name__ == "__main__":
    unittest.main()
