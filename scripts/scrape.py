#!/usr/bin/env python3
"""Scrape bunnysave.com homepage deals.

Outputs:
  data/deals.json         - normalized deal data
  public/images/site/*    - site logos
  public/images/brands/*  - brand logos
  public/images/deals/*   - deal cover images
"""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse, unquote

import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
PUB = ROOT / "public" / "images"

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)


def fetch(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def fetch_text(url: str) -> str:
    return fetch(url).decode("utf-8", errors="replace")


def download(url: str, dest: Path) -> bool:
    try:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(fetch(url))
        print(f"  saved {dest.relative_to(ROOT)}  ({dest.stat().st_size} bytes)")
        return True
    except Exception as e:
        print(f"  ! failed {url}: {e}", file=sys.stderr)
        return False


def extract_image_urls(html: str) -> list[str]:
    """Pull every image URL Next.js emitted on the page."""
    urls: set[str] = set()

    # 1) <img src=...> raw
    for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html):
        src = m.group(1)
        if src.startswith("/_next/image"):
            inner = re.search(r"[?&]url=([^&]+)", src)
            if inner:
                src = unquote(inner.group(1))
        urls.add(src)

    # 2) imageSrcSet=...
    for m in re.finditer(r'imageSrcSet=["\']([^"\']+)["\']', html):
        for part in m.group(1).split(","):
            u = part.strip().split(" ")[0]
            if u.startswith("/_next/image"):
                inner = re.search(r"[?&]url=([^&]+)", u)
                if inner:
                    u = unquote(inner.group(1))
            urls.add(u)

    return sorted(urls)


def bucket_for(url: str) -> tuple[Path, str] | None:
    p = urlparse(url)
    parts = [x for x in p.path.split("/") if x]
    if len(parts) < 2:
        return None
    folder, filename = parts[-2], parts[-1]
    if folder not in {"site", "brands", "deals"}:
        return None
    return PUB / folder, filename


def extract_deals(html: str) -> list[dict[str, Any]]:
    """Very lightweight: pull cards from RSC payload hints in the HTML.

    bunnysave is a Next.js App Router RSC page. Deal fields like titles,
    discounts, prices live inside the Flight stream. We harvest anything
    that looks like a deal record from the JSON-ish segments.
    """
    deals: list[dict[str, Any]] = []
    # Look for deal objects — they show up as Flight stream lines starting with a digit colon
    # e.g.  "title":"..."  "discount":"..."  "brandName":"..."
    title_re = re.compile(r'"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"')
    discount_re = re.compile(r'"discount"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"')
    price_re = re.compile(r'"price"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"')
    brand_re = re.compile(r'"brandName"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"')
    slug_re = re.compile(r'"slug"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"')
    id_re = re.compile(r'"id"\s*:\s*"([a-f0-9]{16,})"')
    desc_re = re.compile(r'"description"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"')

    # Pull a window around every id occurrence, then look for the other fields
    for m in id_re.finditer(html):
        start = max(0, m.start() - 1500)
        end = min(len(html), m.end() + 1500)
        window = html[start:end]
        tm = title_re.search(window)
        if not tm:
            continue
        deals.append(
            {
                "id": m.group(1),
                "title": unescape(tm.group(1)),
                "discount": (dm := discount_re.search(window)) and unescape(dm.group(1)),
                "price": (pm := price_re.search(window)) and unescape(pm.group(1)),
                "brand": (bm := brand_re.search(window)) and unescape(bm.group(1)),
                "slug": (sm := slug_re.search(window)) and unescape(sm.group(1)),
                "description": (dm2 := desc_re.search(window)) and unescape(dm2.group(1)),
            }
        )

    # Dedup by id, keep order
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for d in deals:
        if d["id"] in seen:
            continue
        seen.add(d["id"])
        out.append(d)
    return out


def unescape(s: str) -> str:
    return s.encode().decode("unicode_escape").encode("latin-1", errors="ignore").decode("utf-8", errors="ignore")


def main() -> int:
    DATA.mkdir(parents=True, exist_ok=True)
    print("Fetching homepage…")
    html = fetch_text("https://www.bunnysave.com/")
    (DATA / "homepage.html").write_text(html, encoding="utf-8")
    print(f"  HTML: {len(html):,} bytes")

    print("Extracting image URLs…")
    image_urls = extract_image_urls(html)
    print(f"  {len(image_urls)} images")
    (DATA / "image_urls.json").write_text(json.dumps(image_urls, indent=2, ensure_ascii=False))

    print("Downloading images…")
    for url in image_urls:
        slot = bucket_for(url)
        if not slot:
            continue
        folder, filename = slot
        download(url, folder / filename)

    print("Extracting deals…")
    deals = extract_deals(html)
    print(f"  {len(deals)} candidate deals")
    (DATA / "deals_raw.json").write_text(json.dumps(deals, indent=2, ensure_ascii=False))

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
