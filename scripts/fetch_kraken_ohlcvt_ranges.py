#!/usr/bin/env python3
"""Fetch selected official Kraken OHLCVT CSV via verified HTTP Range reads.

Read-only. No credentials, no trading API, no engine/state/decisions.
Uses 5 concatenated Kraken official ZIP parts as a virtual seekable file.
"""
import argparse
import bisect
import hashlib
import io
import json
import re
import urllib.request
import zipfile
from collections import OrderedDict
from pathlib import Path

ROOT = "https://assets.kraken.com/marketing/institutions"
PARTS = [f"{ROOT}/Kraken_OHLCVT_Full.zip.part{i:02d}" for i in range(5)]
USER_AGENT = "Mozilla/5.0 (compatible; KrakenPaperResearch/1.0)"
CHUNK = 1024 * 1024
MAX_MEMBER = 40 * 1024 * 1024
WANTED = re.compile(r"^(XBT|BTC|ETH|SOL)(USDC|USD)_(60|240)\.CSV$")


def request(url, method="GET", headers=None):
    return urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT, "Accept": "*/*", **(headers or {}),
    }, method=method)


class MultipartHttpRange(io.RawIOBase):
    def __init__(self, urls, cache_chunks=16):
        super().__init__()
        self.urls = urls
        self.ends = []
        self.sizes = []
        self.etags = []
        total = 0
        for url in urls:
            with urllib.request.urlopen(request(url, method="HEAD"), timeout=30) as response:
                if response.status != 200:
                    raise OSError(f"Unexpected HEAD status {response.status} for {url}")
                size = int(response.headers["Content-Length"])
                self.etags.append(response.headers.get("ETag"))
            self.sizes.append(size)
            total += size
            self.ends.append(total)
            print(f"PART {url.rsplit('/',1)[-1]} size={size} etag={self.etags[-1]}", flush=True)
        self.total = total
        self.position = 0
        self.cache = OrderedDict()
        self.max_chunks = cache_chunks

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=io.SEEK_SET):
        if whence == io.SEEK_CUR:
            offset += self.position
        elif whence == io.SEEK_END:
            offset += self.total
        elif whence != io.SEEK_SET:
            raise ValueError("Bad seek mode")
        if offset < 0:
            raise ValueError("Negative seek")
        self.position = offset
        return self.position

    def _chunk(self, part, index):
        key = (part, index)
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        begin = index * CHUNK
        end = min(begin + CHUNK, self.sizes[part]) - 1
        with urllib.request.urlopen(request(self.urls[part], headers={
            "Range": f"bytes={begin}-{end}"
        }), timeout=60) as response:
            if response.status != 206:
                raise OSError("Remote server ignored Range request")
            header = response.headers.get("Content-Range", "")
            if not header.startswith(f"bytes {begin}-{end}/"):
                raise OSError(f"Invalid Content-Range: {header}")
            payload = response.read()
        if len(payload) != end-begin+1:
            raise OSError("Truncated Range response")
        self.cache[key] = payload
        if len(self.cache) > self.max_chunks:
            self.cache.popitem(last=False)
        return payload

    def read(self, n=-1):
        if n is None or n < 0:
            n = self.total-self.position
        n = min(n, self.total-self.position)
        if n <= 0:
            return b""
        pieces = []
        while n:
            part = bisect.bisect_right(self.ends, self.position)
            offset = self.position-(self.ends[part-1] if part else 0)
            index = offset//CHUNK
            fragment = self._chunk(part, index)
            start = offset%CHUNK
            size = min(n, len(fragment)-start)
            pieces.append(fragment[start:start+size])
            self.position += size
            n -= size
        return b"".join(pieces)


def main():
    p = argparse.ArgumentParser(description="Range-only Kraken OHLCVT extractor")
    p.add_argument("--output", type=Path, default=Path("/tmp/kraken-ohlcvt"))
    p.add_argument("--list-only", action="store_true")
    a = p.parse_args()
    with MultipartHttpRange(PARTS) as stream:
        with zipfile.ZipFile(stream, "r") as archive:
            matches = [info for info in archive.infolist()
                       if WANTED.fullmatch(Path(info.filename).name.upper())]
            print(f"ZIP central directory {len(archive.infolist())} entries; "
                  f"{len(matches)} matching spot OHLCVT CSVs", flush=True)
            if not matches:
                raise ValueError("No BTC/ETH/SOL OHLCVT CSV filenames in Kraken ZIP")
            for info in matches:
                print("MATCH", info.filename, "size", info.file_size,
                      "compressed", info.compress_size, "crc32", f"{info.CRC:08x}", flush=True)
            if a.list_only:
                return
            a.output.mkdir(parents=True, exist_ok=True)
            manifest = {
                "origin": "Kraken historical OHLCVT FULL multipart official CDN",
                "source_urls": PARTS, "part_sizes": stream.sizes,
                "part_etags": stream.etags,
                "archive_sha256": "NOT COMPUTED; archive accessed by HTTP byte ranges",
                "csv": [],
                "official_manifest": None,
            }
            official_manifests = [item for item in archive.infolist()
                                  if Path(item.filename).name.upper() == "MANIFEST.JSON"]
            if official_manifests:
                info = official_manifests[-1]
                if info.file_size > 2 * 1024 * 1024:
                    raise ValueError("Unexpected size of Kraken official MANIFEST")
                raw_manifest = archive.read(info)
                manifest["official_manifest"] = {
                    "source_entry": info.filename,
                    "size": len(raw_manifest),
                    "zip_crc32": f"{info.CRC:08x}",
                    "sha256": hashlib.sha256(raw_manifest).hexdigest(),
                }
                (a.output / "KRAKEN_OFFICIAL_MANIFEST.json").write_bytes(raw_manifest)
                print("OFFICIAL_MANIFEST", info.filename,
                      manifest["official_manifest"]["sha256"], flush=True)
            else:
                print("OFFICIAL_MANIFEST missing in official ZIP", flush=True)
            for info in matches:
                if info.file_size > MAX_MEMBER:
                    raise ValueError(f"Unexpectedly large CSV: {info.filename}")
                raw = archive.read(info)  # zipfile verifies central-directory CRC32
                name = Path(info.filename).name
                target = a.output / name
                if target.exists() and target.read_bytes() != raw:
                    raise ValueError(f"Conflicting filenames: {name}")
                target.write_bytes(raw)
                fingerprint = hashlib.sha256(raw).hexdigest()
                manifest["csv"].append({
                    "name": name, "source_entry": info.filename,
                    "size": len(raw), "zip_crc32": f"{info.CRC:08x}",
                    "sha256": fingerprint,
                })
                print("EXTRACTED", name, len(raw), fingerprint, flush=True)
            manifest_path = a.output / "KRAKEN_SOURCE_MANIFEST.json"
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
            print("MANIFEST", manifest_path, flush=True)


if __name__ == "__main__":
    main()
