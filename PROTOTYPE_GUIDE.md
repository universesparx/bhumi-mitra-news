# भू-अलर्ट बिहार — Offline Prototype Guide

## Scope

This is a **local-only Python standard-library prototype**. It makes no network requests, has no crawler, has no scheduled workflows, and does not publish data to GitHub Pages or the mobile app. The example is entirely fictional.

## Files

- `news_review.py` — local editorial queue and manual review commands.
- `examples/synthetic_candidate.json` — fictional test candidate only.
- `tests/test_news_review.py` — automated regression tests.
- `.gitignore` — excludes `local_queue.json` from accidental commits.
- `COMPLIANCE_REVIEW.md` — preliminary policy safeguards; not legal clearance.

## Run locally (Python 3.10+)

```bash
python -m unittest discover -s tests -v
python news_review.py add examples/synthetic_candidate.json
python news_review.py list
python news_review.py review <ITEM_ID_FROM_LIST> approved --reviewer owner
```

The queue is written to `local_queue.json`, which is ignored by Git. **Do not commit real pending review data to this public repository.** The reviewer's name is recorded locally; this is not an authentication mechanism. `approved_only()` filters data in memory but does not publish it.

## Current limitations

- No user login, authorization server, multi-user review or tamper-proof audit trail.
- No automated news discovery, external source access, live news, PDF processing, or mobile app integration.
- Duplicate detection uses normalized source URLs; different URLs for the same story may still be duplicates.
- The automated tests are included but have **not yet been executed in a runtime** as part of this repository update.
- The prototype is not suitable for production or public deployment.

## Next gate

Verify source-specific rights and access, choose policy-compatible collection and hosting, then request explicit approval before any production integration or automated publishing.
