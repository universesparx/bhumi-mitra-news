# भू-अलर्ट बिहार — Local-first editorial storage design

**Status:** Proposed design, not deployed. The owner has authorized continued prototype work, but no production encryption, publishing, hosting, or Bhumi Mitra integration is authorized by this document.

## Scope

The owner prepares original Hindi news summaries, adds source URLs, reviews accuracy and rights, then explicitly approves individual items. Pending/rejected drafts and editorial history must never enter the public repository or public mobile feed.

## Proposed storage model

- **Private workspace:** local SQLite database stored outside the Git repository, with a device-specific application data directory.
- **Protection:** encrypted database or encrypted container using a maintained, audited library and operating-system-protected key storage. Standard SQLite alone is **not encryption**. No home-grown encryption or silent plaintext fallback.
- **Key recovery:** separately evaluate how the owner restores data on a new device. A lost local key must not be misrepresented as recoverable.
- **Device support:** first design for one trusted laptop. Phone-to-laptop synchronization is out of scope until a secure, reviewed method exists.
- **Backup:** explicit encrypted export, verified restore tests, versioning, and corruption handling. No backup is implemented yet.
- **Audit:** append-only logical events for create/edit/approve/reject/retract with UTC timestamps. Local-only audit is not tamper-proof.
- **Public projection:** export only the approved public schema after validating rights, source evidence, and retraction status. Never export private reviewer notes.
- **Publication:** export does not imply deployment. Public hosting and a mobile read-only feed remain separate decisions.

## Data model proposal

`editorial_item`: immutable UUID, headline_hi, summary_hi, source_name, source_url, source_publication_date, category, district, status, source_verified, rights_checked, retracted, created_at, updated_at.

`review_event`: UUID, item UUID, action, timestamp, reviewer identifier, reason. Keep private.

`rights_evidence`: UUID, item UUID, source policy/permission reference, reviewed_at, scope, notes. Keep private.

## Threat model

| Threat | Mitigation before deployment |
| --- | --- |
| Laptop lost or stolen | Encryption at rest, OS account protection, no plaintext backups |
| Malware on unlocked laptop | OS updates, least privilege, avoid storing secrets in source code |
| Wrong story approved | Explicit approval, rights evidence, visible source and date |
| Previously approved story corrected | Retraction/correction workflow and versioned feed |
| Private notes leaked | Public-field allowlist and export regression tests |
| Lost key or damaged DB | Tested encrypted backup/restore and clear recovery policy |
| Malicious link | HTTPS validation, no credentials in URLs, safe link handling |
| Unapproved automation | Collection remains disabled in registry and source gate |

## Acceptance criteria for future implementation

1. No pending or rejected items in public export.
2. No plaintext private DB or backup on disk.
3. Correct key unlocks; wrong key fails closed.
4. Restart preserves edits, review state and audit events.
5. Export omits reviewer identifiers, private notes, and evidence details.
6. Retracted items disappear from the current approved feed.
7. Backup restore passes corruption, wrong-key and interrupted-write tests.
8. All checks run automatically in CI without network or paid services.

## Open decisions

- Encryption library and licensing, Android/Windows key management, recovery method, and backup location.
- Whether a single-device laptop workflow is acceptable for the initial pilot.
- Approved public feed hosting, including terms and commercial-use restrictions.

**No new storage code or cloud service has been introduced.**
