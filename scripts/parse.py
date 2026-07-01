#!/usr/bin/env python3
"""Build the mock dataset from bunnysave.com's server-rendered body.

Output:
  data/deals.json       - canonical deals (id, title, description, brand, image, ...)
  data/brands.json      - canonical brands (id, name, logo, ...)
  public/images/...     - already populated by scrape.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import unquote, urlparse

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def main() -> int:
    html = (DATA / "homepage.html").read_text(encoding="utf-8")
    m = re.search(r"<body[^>]*>(.*)", html, re.S)
    body = m.group(1) if m else html
    soup = BeautifulSoup(body, "lxml")

    # ---------- image -> canonical asset URL mapping ----------
    img_map: dict[str, dict] = {}
    for img in soup.find_all("img"):
        raw = img.get("src", "")
        if raw.startswith("/_next/image"):
            q = re.search(r"[?&]url=([^&]+)", raw)
            if not q:
                continue
            url = unquote(q.group(1))
        else:
            url = raw
        if "assets.dealselected.com" not in url:
            continue
        parts = [x for x in urlparse(url).path.split("/") if x]
        if len(parts) < 2:
            continue
        bucket, filename = parts[-2], parts[-1]
        img_map.setdefault(bucket + "/" + filename, {"bucket": bucket, "filename": filename, "url": url})

    # ---------- collect deal cards ----------
    # Card structure (observed in SSR body): <h3>title</h3> surrounded by image + optional link
    deals: list[dict] = []
    seen_ids: set[str] = set()
    for h3 in soup.find_all("h3"):
        title = h3.get_text(" ", strip=True)
        if not title or len(title) < 4:
            continue
        # find nearest enclosing <article> or <a>
        card = h3.find_parent("a") or h3.find_parent("article")
        # collect images in the card area (current and previous siblings until next h3)
        scope = card or h3.parent
        imgs: list[dict] = []
        cur = h3
        for _ in range(40):
            cur = cur.find_previous(["img"])
            if cur is None or (scope is not None and cur.find_parent() is not None and scope.find_parent() is not None):
                # only break if we leave the scope container
                pass
            if cur is None:
                break
            src = cur.get("src", "")
            if src.startswith("/_next/image"):
                q = re.search(r"[?&]url=([^&]+)", src)
                if q:
                    src = unquote(q.group(1))
            if "assets.dealselected.com" in src:
                key = "/".join([x for x in urlparse(src).path.split("/") if x][-2:])
                meta = img_map.get(key)
                if meta and meta not in imgs:
                    imgs.append(meta)
            if len(imgs) >= 3:
                break
        # title contains both title + optional description (separated by !) — keep raw for now
        # Use slug-style id from first image filename (without ext) when available
        first_deal_img = next((i for i in imgs if i["bucket"] == "deals"), None)
        if not first_deal_img:
            continue
        deal_id = first_deal_img["filename"].rsplit(".", 1)[0]
        if deal_id in seen_ids:
            continue
        seen_ids.add(deal_id)

        # Try to find an external CTA link near the title. bunnysave uses internal
        # /deals/<slug> routes that point back at itself, so promote anything else to
        # the homepage domain.
        cta = None
        if card and card.name == "a":
            cta = card.get("href")
        else:
            nxt = h3.find_next("a")
            if nxt:
                cta = nxt.get("href")
        if cta and cta.startswith("/") and not cta.startswith("/deals/"):
            cta = "https://www.bunnysave.com" + cta
        if cta and cta.startswith("/deals/"):
            cta = None  # self-referential route; show generic CTA instead

        # Brand = first brands/* image inside scope
        brand_img = next((i for i in imgs if i["bucket"] == "brands"), None)

        deals.append(
            {
                "id": deal_id,
                "title": title,
                "brandLogo": brand_img["url"] if brand_img else None,
                "cover": first_deal_img["url"],
                "cta": cta,
                "source": "bunnysave.com",
            }
        )

    # ---------- brands (dedupe logos, derive name from filename heuristics) ----------
    brands_seen: set[str] = set()
    brands: list[dict] = []
    for img in img_map.values():
        if img["bucket"] != "brands":
            continue
        bid = img["filename"].rsplit(".", 1)[0]
        if bid in brands_seen:
            continue
        brands_seen.add(bid)
        # friendly name: just title-case filename without hash
        name = re.sub(r"[-_]+", " ", bid).title() if re.fullmatch(r"[a-f0-9]+", bid) else bid
        brands.append({"id": bid, "name": name, "logo": img["url"]})

    # ---------- write outputs ----------
    (DATA / "deals.json").write_text(
        json.dumps(deals, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (DATA / "brands.json").write_text(
        json.dumps(brands, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"deals:  {len(deals)}")
    print(f"brands: {len(brands)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
