# भू-अलर्ट बिहार — Source Activation Checklist

**Status:** Safety design only. No source is authorized or activated.

The `source_gate.py` module is a fail-closed metadata checker. It is **not connected to any crawler**, and passing its checks does not grant legal rights.

## Required before requesting activation

1. Identify the precise official source URL and the content category to be collected.
2. Record the source's own copyright/terms/robots/automation policy and any official API/RSS permission.
3. Confirm that collection and the proposed reuse of headlines, summaries and metadata are separately permitted.
4. Keep a verifiable permission reference, permission basis, named reviewer and review date.
5. Recheck evidence at least every 180 days, or sooner if the source changes terms.
6. Obtain explicit owner approval for the selected architecture, hosting, security and collection rate.
7. Implement independent safeguards in the eventual fetcher: domain allowlist, request limits, no CAPTCHA bypass, no credentials, and no public pending queue.
8. Run tests for permission denial, duplicate IDs, stale approvals, unauthorized publication and retraction.

## Current safety state

The global `collection_enabled` flag and all per-source flags in `source_registry.json` remain false. No actual Bihar government source has verified automation or republication permissions. The synthetic `example.org` fixture in tests only checks logic and is **not an approved real source**.

## Testing

`python -m unittest discover -s tests -v`

GitHub Actions runs these tests on relevant changes. The gate tests use a fixed date for reproducibility; production code must use the current date.
