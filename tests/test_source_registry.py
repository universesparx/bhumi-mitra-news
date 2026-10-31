import json
import unittest
from pathlib import Path

class SourceRegistryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((Path(__file__).resolve().parents[1] / 'source_registry.json').read_text(encoding='utf-8'))

    def test_global_disabled(self):
        self.assertIs(self.data['collection_enabled'], False)

    def test_every_source_disabled(self):
        self.assertTrue(all(s['collection_enabled'] is False for s in self.data['sources']))

    def test_permission_unverified(self):
        self.assertTrue(all(s['automation_permission'] == 'unverified' for s in self.data['sources']))

    def test_https(self):
        self.assertTrue(all(s['url'].startswith('https://') for s in self.data['sources']))

if __name__ == '__main__':
    unittest.main()
