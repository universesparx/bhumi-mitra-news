"""Fail-closed source eligibility checks. Does not fetch or publish news."""
from __future__ import annotations

from datetime import date
from urllib.parse import urlsplit

REQUIRED_EVIDENCE = (
    "permission_basis",
    "permission_reference",
    "reviewed_by",
    "reviewed_on",
)


def check_source(source: dict, today: date | None = None) -> list[str]:
    """Return reasons a source must remain disabled; empty list means metadata passes.

    Passing this check is not legal clearance and does not enable collection.
    """
    today = today or date.today()
    reasons = []
    url = source.get("url", "")
    parsed = urlsplit(url) if isinstance(url, str) else None
    if not parsed or parsed.scheme != "https" or not parsed.hostname:
        reasons.append("valid HTTPS source URL required")
    if source.get("automation_permission") != "verified":
        reasons.append("automation permission not verified")
    if source.get("republication_permission") != "verified":
        reasons.append("republication permission not verified")
    evidence = source.get("evidence")
    if not isinstance(evidence, dict):
        evidence = {}
    for key in REQUIRED_EVIDENCE:
        if not isinstance(evidence.get(key), str) or not evidence[key].strip():
            reasons.append(f"missing evidence: {key}")
    reviewed_on = evidence.get("reviewed_on")
    if isinstance(reviewed_on, str) and reviewed_on.strip():
        try:
            d = date.fromisoformat(reviewed_on)
            if d > today:
                reasons.append("review date is in the future")
            elif (today - d).days > 180:
                reasons.append("permission review older than 180 days")
        except ValueError:
            reasons.append("invalid review date")
    if source.get("collection_enabled") is not True:
        reasons.append("source collection disabled")
    return reasons


def can_collect(registry: dict, source_id: str, today: date | None = None) -> bool:
    """Explicit global and source-level switches, with evidence gate."""
    if registry.get("collection_enabled") is not True:
        return False
    sources = registry.get("sources")
    if not isinstance(sources, list):
        return False
    matches = [s for s in sources if isinstance(s, dict) and s.get("id") == source_id]
    if len(matches) != 1:
        return False
    return not check_source(matches[0], today=today)
