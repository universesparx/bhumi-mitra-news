# भू-अलर्ट बिहार — Policy Findings (2026-10-31)

**Scope:** Official public policy research, not a legal clearance or source-by-source scraping authorization. **No automated collection or publication is enabled.**

## Verified official requirements

### Google Play: News & Magazines

- Google Play's News & Magazines policy applies to in-scope news/magazine apps and news aggregators, including AI-generated content. Whether Bhumi Mitra's **news subsection** causes the *whole app* to fall in scope depends on app classification, descriptions and implementation; do not assume exemption.
- In-scope apps must complete the Play Console declaration, identify original news sources, display accessible current contact details, and update content regularly.
- For current-events news apps, Google guidance expects regularly updated content not more than 30 days old; show publication dates.
- Do not make advertising or affiliate revenue the primary purpose of a news app.
- The Google Play documentation notes additional Indian regulatory obligations may apply to news/current-affairs publishers; get legal review if becoming a news publisher.

Official references:
- https://support.google.com/googleplay/android-developer/answer/9935326
- https://support.google.com/googleplay/android-developer/answer/10523915
- https://support.google.com/googleplay/android-developer/answer/16189314

### GitHub Actions

GitHub's additional terms restrict hosted runners used for unrelated activities, disproportionately burdensome activity and certain service offerings. A scheduled third-party news scraper is **not cleared** merely because the repository contains source code. Keep any workflow limited to tests/development until a suitable collection model is approved.

Official reference: https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features

### GitHub Pages

GitHub Pages is not permitted as free hosting for an online business or a site primarily facilitating commercial SaaS. A production news API/feed hosted for a monetized mobile app needs a separate suitability review; **not cleared**.

Official reference: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

### Indian copyright

The Copyright Office explains that factual news is distinct from copyright-protected reporting/expression. Use original short summaries and links, and seek rights before reproducing publisher text, translations, images or substantial extracts.

Official reference: https://copyright.gov.in/documents/handbook.html

## Unresolved source-specific checks

| Source | Terms / reuse / robots / API rights | Current decision |
| --- | --- | --- |
| Bihar Revenue & Land Reforms circulars | Not fully verified | No automated collection |
| DLRS survey websites | Not fully verified | No automated collection |
| Bihar Bhumi | Not fully verified | No automated collection |
| Each news publisher / RSS | Not fully verified | No automated collection |

## Prototype verification

On 2026-10-31, 8 regression tests were executed successfully in an isolated Python 3 environment using a local copy of the repository's prototype logic and test cases. This is **not a GitHub Actions run** and does not validate production authentication, scraping or hosting.

## Next gate

Identify precise source URLs, verify publisher-specific rights, then choose a lawful and policy-compatible collection and delivery architecture. Maintain manual approval and no-unapproved-publication requirements.
