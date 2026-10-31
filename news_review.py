"""Local-only editorial review prototype. No network access or publishing."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

STATUSES = {"pending", "approved", "rejected"}
CATEGORIES = {"survey", "circular", "policy", "service", "incident", "other"}


def normalize_url(url: str) -> str:
    parts = urlsplit(url.strip())
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise ValueError("Source URL must be http(s) with a hostname")
    query = urlencode(sorted((k, v) for k, v in parse_qsl(parts.query)
                             if not k.lower().startswith("utm_")))
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(),
                       parts.path.rstrip("/") or "/", query, ""))


def item_id(source_url: str) -> str:
    return hashlib.sha256(normalize_url(source_url).encode()).hexdigest()[:16]


def validate(candidate: dict) -> dict:
    for field in ("source_url", "source_name", "headline_hi", "summary_hi"):
        if not isinstance(candidate.get(field), str) or not candidate[field].strip():
            raise ValueError(f"Missing field: {field}")
    category = candidate.get("category", "other")
    if category not in CATEGORIES:
        raise ValueError("Unknown category")
    url = normalize_url(candidate["source_url"])
    return {
        "id": item_id(url),
        "source_url": url,
        "source_name": candidate["source_name"].strip(),
        "headline_hi": candidate["headline_hi"].strip(),
        "summary_hi": candidate["summary_hi"].strip(),
        "category": category,
        "district": candidate.get("district", "").strip(),
        "source_publication_date": candidate.get("source_publication_date"),
        "status": "pending",
        "reviewed_at": None,
        "reviewer": None,
    }


def load_queue(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Queue must be a JSON array")
    return data


def save_queue(path: Path, queue: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")


def add(queue: list[dict], candidate: dict) -> dict:
    item = validate(candidate)
    if any(x["id"] == item["id"] for x in queue):
        raise ValueError("Duplicate source URL")
    queue.append(item)
    return item


def review(queue: list[dict], identifier: str, decision: str,
           reviewer: str) -> dict:
    if decision not in ("approved", "rejected"):
        raise ValueError("Decision must be approved or rejected")
    if not reviewer.strip():
        raise ValueError("Reviewer is required")
    for item in queue:
        if item["id"] == identifier:
            if item["status"] != "pending":
                raise ValueError("Item already reviewed")
            item["status"] = decision
            item["reviewer"] = reviewer.strip()
            item["reviewed_at"] = datetime.now(timezone.utc).isoformat()
            return item
    raise ValueError("Unknown item ID")


def approved_only(queue: list[dict]) -> list[dict]:
    """Returns approved entries in memory; does not publish anywhere."""
    return [{k: v for k, v in item.items() if k not in ("reviewer",)}
            for item in queue if item["status"] == "approved"]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--queue", type=Path, default=Path("local_queue.json"))
    sub = parser.add_subparsers(dest="command", required=True)
    p_add = sub.add_parser("add", help="Add a manually prepared JSON candidate")
    p_add.add_argument("file", type=Path)
    sub.add_parser("list", help="List queue entries")
    p_review = sub.add_parser("review", help="Approve or reject one pending item")
    p_review.add_argument("id")
    p_review.add_argument("decision", choices=("approved", "rejected"))
    p_review.add_argument("--reviewer", required=True)
    args = parser.parse_args()
    queue = load_queue(args.queue)
    if args.command == "add":
        item = add(queue, json.loads(args.file.read_text(encoding="utf-8")))
        save_queue(args.queue, queue)
        print("Added pending item:", item["id"])
    elif args.command == "review":
        item = review(queue, args.id, args.decision, args.reviewer)
        save_queue(args.queue, queue)
        print("Reviewed:", item["id"], item["status"])
    else:
        for item in queue:
            print(item["id"], item["status"], item["headline_hi"])


if __name__ == "__main__":
    main()
