# भू-अलर्ट बिहार — Zero-budget architecture decision

**Status: proposed design; not approved for production.** This document compares implementation choices, not a grant of scraping, copyright, hosting, or Google Play permission.

## Architecture candidates

| Approach | Advantages | Critical limitations | Current decision |
| --- | --- | --- | --- |
| Manually entered links and original summaries, reviewed locally | No scraping; straightforward editorial control | Owner must enter each item; publishing still needs approved delivery infrastructure | Preferred first live-content pilot, subject to content rights and hosting review |
| Official RSS/API from a source with documented reuse rights | Potentially automatable; source attribution | Terms, rate limits, copyright and API permissions vary per source | Not enabled; source evidence required |
| Scraping government portal pages | Broad coverage | Public access does not establish automation or redistribution rights; changes and anti-bot controls | Not approved |
| Scraping third-party news articles | Broad news coverage | Copyright, terms, accuracy, privacy and defamation risks | Not approved |

## Data boundaries

- **Public app feed:** Only reviewed, original headlines/summaries, source name, source URL, source publication date, category, district, and correction status.
- **Private editorial queue:** Pending drafts, reviewer decisions, editorial notes, and audit history. Never store in this public GitHub repository.
- **Application:** Read-only consumer of an approved feed. No publishing token or private editorial data inside the Android app.
- **Compliance evidence:** Exact source-specific permission references and review dates. The registry is currently disabled.

## First production decision to obtain from owner

Choose whether to start with a **manual-curation pilot** (recommended for zero-budget and reduced scraping risk). Then independently select and validate an affordable hosting and private-review approach. Avoid treating GitHub Pages or GitHub Actions as approved commercial hosting or general-purpose scraping services by default.

## Implementation order after approval

1. Finish source-rights and Google Play classification checks.
2. Implement a private, authenticated approval service with server-side authorization.
3. Implement an approved-only, versioned public feed with rollback/retraction support.
4. Add a Hindi-first, read-only mobile feed with date/source labels and offline/empty/error states.
5. Add automated regression tests for unauthorized publication, expired content, malicious URLs, and retractions.

**No network collector, feed hosting, login provider, or mobile integration has been implemented.**
