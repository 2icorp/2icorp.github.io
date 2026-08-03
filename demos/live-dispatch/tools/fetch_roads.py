#!/usr/bin/env python3
"""One-time build script: fetch OSM road geometry for 4 demo regions from the
Overpass API and bake it down to small static JSON files the live-dispatch
page reads at runtime (no network calls happen in the browser -- this script
is the only thing that talks to the internet).

Run once (or whenever the baked data needs refreshing):
    python3 tools/fetch_roads.py

Writes data/roads-{region}.json, each capped near ~300KB by (a) restricting
to primary/secondary/tertiary/residential highways, (b) rounding coordinates
to 5 decimal places (~1.1m precision, plenty for a schematic city map), and
(c) stride-decimating residential ways (the highest-volume class) if the
raw pull is too big.

Attribution requirement (ODbL): any page rendering this data must show
"지도 데이터 (c) OpenStreetMap contributors (ODbL)" -- the live-dispatch
page footer does this; do not strip that credit if you touch the renderer.
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OUT_DIR = Path(__file__).resolve().parent.parent / "data"

# bbox = (south, west, north, east) i.e. (lat_min, lon_min, lat_max, lon_max)
REGIONS = {
    "gangnam": {"label": "강남", "bbox": (37.49, 127.02, 37.53, 127.07)},
    "yeoksam": {"label": "역삼", "bbox": (37.49, 127.03, 37.51, 127.06)},
    "jamsil": {"label": "잠실", "bbox": (37.50, 127.07, 37.53, 127.12)},
    "pangyo": {"label": "판교", "bbox": (37.38, 127.08, 37.42, 127.13)},
}

HIGHWAY_CLASSES = "primary|secondary|tertiary|residential"
MAX_BYTES = 300_000
ROUND_DECIMALS = 5


def build_query(bbox: tuple[float, float, float, float]) -> str:
    south, west, north, east = bbox
    return (
        "[out:json][timeout:90];\n"
        f'(way["highway"~"^({HIGHWAY_CLASSES})$"]({south},{west},{north},{east}););\n'
        "out geom;"
    )


def fetch_overpass(query: str, retries: int = 3) -> dict:
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    req = urllib.request.Request(OVERPASS_URL, data=body, headers={"User-Agent": "2i-live-dispatch-demo/1.0"})
    last_err = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=100) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError) as e:
            last_err = e
            print(f"  attempt {attempt + 1} failed: {e}, retrying in 5s...")
            time.sleep(5)
    raise RuntimeError(f"overpass fetch failed after {retries} attempts: {last_err}")


def simplify_ways(elements: list[dict]) -> list[dict]:
    roads = []
    for el in elements:
        if el.get("type") != "way" or "geometry" not in el:
            continue
        highway = el.get("tags", {}).get("highway", "unknown")
        coords = [[round(pt["lon"], ROUND_DECIMALS), round(pt["lat"], ROUND_DECIMALS)] for pt in el["geometry"]]
        # collapse consecutive duplicate points from rounding
        dedup = [coords[0]] if coords else []
        for c in coords[1:]:
            if c != dedup[-1]:
                dedup.append(c)
        if len(dedup) >= 2:
            roads.append({"highway": highway, "coords": dedup})
    return roads


def decimate_residential(roads: list[dict], stride: int) -> list[dict]:
    """Keep every Nth residential way's points at full density is not the
    lever here -- instead thin the *number of vertices* on residential ways
    (they carry the most points of the four classes) while keeping every
    way (so the road network shape/connectivity stays intact)."""
    out = []
    for r in roads:
        if r["highway"] != "residential" or stride <= 1:
            out.append(r)
            continue
        coords = r["coords"]
        if len(coords) <= 2:
            out.append(r)
            continue
        thinned = [coords[0]] + coords[1:-1:stride] + [coords[-1]]
        out.append({"highway": r["highway"], "coords": thinned})
    return out


def payload_size(obj: dict) -> int:
    return len(json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for region_id, meta in REGIONS.items():
        print(f"=== {region_id} ({meta['label']}) bbox={meta['bbox']} ===")
        query = build_query(meta["bbox"])
        result = fetch_overpass(query)
        elements = result.get("elements", [])
        roads = simplify_ways(elements)
        print(f"  raw ways: {len(roads)}")

        out = {
            "region": region_id,
            "label": meta["label"],
            "bbox": {"south": meta["bbox"][0], "west": meta["bbox"][1], "north": meta["bbox"][2], "east": meta["bbox"][3]},
            "attribution": "지도 데이터 (c) OpenStreetMap contributors (ODbL)",
            "source": "Overpass API (overpass-api.de), highway=" + HIGHWAY_CLASSES + ", 빌드타임 1회 수집",
            "roads": roads,
        }
        size = payload_size(out)
        print(f"  size before decimation: {size} bytes")

        stride = 2
        while size > MAX_BYTES and stride <= 12:
            out["roads"] = decimate_residential(roads, stride)
            size = payload_size(out)
            print(f"  decimated residential stride={stride} -> {size} bytes")
            stride += 2

        # last resort: if still too big, drop residential entirely (keep
        # the arterial network which is what the sim actually routes on)
        if size > MAX_BYTES:
            out["roads"] = [r for r in out["roads"] if r["highway"] != "residential"]
            size = payload_size(out)
            print(f"  dropped residential entirely -> {size} bytes")

        out_path = OUT_DIR / f"roads-{region_id}.json"
        out_path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"  wrote {out_path} ({size} bytes, {len(out['roads'])} roads)")
        print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
