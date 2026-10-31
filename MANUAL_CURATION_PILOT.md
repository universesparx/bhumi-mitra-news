# भू-अलर्ट बिहार — Manual Curation Pilot

**Status:** Owner approved manual curation as the first approach. This is an **offline-only pilot**, not a live publishing system.

Open `prototype/manual-curation.html` locally in a browser. It needs no installation, login, paid service, external libraries, or network calls.

## Workflow

1. Enter an original Hindi headline and short summary, source name, HTTPS URL, publication date, category, and optional district.
2. Add to the local pending list. Duplicate URLs are blocked.
3. Approve or reject each pending item. Only approved items appear in the local preview.
4. Reloading the page discards all data. The pilot never sends, stores remotely, or publishes anything.

## Important limitations

- **Not production security:** Browser-only approval is not authenticated or tamper-resistant.
- **No persistence:** Nothing is saved, exported, or synchronized. Do not use it to manage real editorial records.
- **No copyright clearance:** Original summaries and source links still require an appropriate rights and accuracy review.
- **No source collection:** The pilot never fetches source pages.
- **No mobile integration:** Existing Bhumi Mitra app files are untouched.

## Acceptance checks

- New items begin pending; only explicit approval puts an item in the local preview.
- Rejected items do not appear in the approved preview.
- Duplicate URLs, non-HTTPS URLs, and future publication dates are rejected.
- Headline/summary are inserted as text, not executable HTML.
- Reload removes all entries; no network requests or local storage occur.

## Next production decision

A real manual curation service needs private storage, authenticated owner review, correction/retraction support, and a suitable approved-only feed host. These services must be selected after compliance and cost review, and **before** integrating the React Native module.
