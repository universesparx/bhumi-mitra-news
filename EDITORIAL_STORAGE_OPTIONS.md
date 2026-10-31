# भू-अलर्ट बिहार — Private editorial storage and delivery options

**Decision status:** Options under review. No live storage, authentication provider, publishing service, or app integration is authorized by this document.

## Security requirement

Pending news and reviewer history must be private. A public GitHub repository cannot safely store unpublished allegations, private notes, or owner credentials. The current offline HTML demo is intentionally ephemeral; it is not a secure editorial database.

## Options to evaluate before deployment

| Option | Benefit | Constraint | Status |
| --- | --- | --- | --- |
| Owner's local encrypted database + manual approved export | Minimal ongoing hosting; drafts stay local | Device loss, backups, encryption/key recovery, safe manual publication, authentication | Candidate; not implemented |
| Private hosted database + authenticated moderation | Easier multi-device review | Provider pricing, data location, credentials, privacy, free-tier limits, operational complexity | Not approved |
| Private GitHub repository for editorial files | Existing GitHub access | Git history retains past content; repo collaborators and integrations can access data; unsuitable for sensitive drafts without careful assessment | Not recommended as default |
| Public static feed with approved metadata only | Read-only mobile access | Must confirm hosting terms, rate limits, monetization compatibility, correction/removal workflow | Not approved |

## Proposed separation

1. **Private intake** — manually created original summaries and source links, never pushed to the public repo.
2. **Owner review** — authenticated decision with audit and correction/retraction controls.
3. **Public contract** — only minimal approved fields, HTTPS source link, publication date and source label; no reviewer names or notes.
4. **Mobile read-only UI** — cannot approve, edit, or publish.

The offline `approved_feed.py` module tests the public contract. It never publishes or writes files. Its test flags (`source_verified` and `rights_checked`) are **assertions supplied by a caller, not proof**; production must verify them using authenticated, auditable evidence.

## Required decision before production work

Choose a storage and feed-hosting model only after evaluating provider terms, privacy/security, copyright, costs and Google Play news requirements. Do not enable any automated collection.
