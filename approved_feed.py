"""Validate a manually curated, approved-only news feed in memory.

No network, filesystem writes, authentication, or publishing.
"""
from __future__ import annotations

from datetime import date
from urllib.parse import urlsplit

CATEGORIES = {"survey", "circular", "policy", "service", "incident", "other"}
PUBLIC_FIELDS = ("id", "headline_hi", "summary_hi", "source_name",
                 "source_url", "source_publication_date", "category", "district")


def validate_public_item(item: dict, today: date | None = None) -> dict:
    today = today or date.today()
    if not isinstance(item, dict) or item.get("status") != "approved":
        raise ValueError("Only explicitly approved entries are eligible")
    for field in ("id", "headline_hi", "summary_hi", "source_name", "source_url",
                  "source_publication_date"):
        if not isinstance(item.get(field), str) or not item[field].strip():
            raise ValueError(f"Missing public field: {field}")
    parts = urlsplit(item["source_url"])
    if (parts.scheme != "https" or not parts.hostname or
            parts.username is not None or parts.password is not None):
        raise ValueError("Source URL must be HTTPS without credentials")
    if item.get("category") not in CATEGORIES:
        raise ValueError("Invalid category")
    try:
        published = date.fromisoformat(item["source_publication_date"])
    except ValueError as exc:
        raise ValueError("Invalid publication date") from exc
    if published > today:
        raise ValueError("Future publication date")
    if item.get("retracted") is True:
        raise ValueError("Retracted item")
    if item.get("source_verified") is not True:
        raise ValueError("Source not verified")
    if item.get("rights_checked") is not True:
        raise ValueError("Content rights not checked")
    district = item.get("district", "")
    if not isinstance(district, str):
        raise ValueError("Invalid district")
    return {key: (district if key == "district" else item[key]) for key in PUBLIC_FIELDS}


def build_feed(items: list[dict], today: date | None = None) -> dict:
    """Fail closed on any unsafe entry; do not silently publish partial data."""
    if not isinstance(items, list):
        raise ValueError("Expected list of reviewed entries")
    public = [validate_public_item(item, today) for item in items]
    ids = [item["id"] for item in public]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate item IDs")
    return {"schema_version": 1, "items": public}
