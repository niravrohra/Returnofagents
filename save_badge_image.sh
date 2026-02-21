#!/usr/bin/env bash
# Usage:
#   ./save_badge_image.sh badge_raw.txt [out_file]
#   cat badge_raw.txt | ./save_badge_image.sh - out.jpg

set -euo pipefail

IN="${1:-}"
OUT="${2:-badge.jpg}"

if [[ -z "$IN" ]]; then
  echo "Usage: $0 <badge_raw.txt|-> [out_file]" >&2
  exit 1
fi

# Feed either the file or STDIN into Python
IMG_URL="$(
  ( [[ "$IN" == "-" ]] && cat - || cat "$IN" ) | python3 - <<'PY' 2>/dev/null || true
import sys, re, json, html as h

data = sys.stdin.read()

# 1) Extract JSONP payload: LIBadgeCallback("...HTML...", uid)
m = re.search(r'LIBadgeCallback\(\s*([\'"])(.*?)\1\s*,\s*\d+\s*\)', data, re.S)
payload = None
if m:
    raw = m.group(2)
    try:
        payload = json.loads('"%s"' % raw.replace('"', '\\"'))  # unescape JS string via JSON
    except Exception:
        payload = raw

html = payload if payload else data

# 2) Extract the image src URL
m2 = re.search(r'class="profile-badge__content-profile-image"[^>]*src="([^"]+)"', html)
if not m2:
    sys.exit(0)

url = h.unescape(m2.group(1))  # decode &amp; to &
print(url)
PY
)"

if [[ -z "$IMG_URL" ]]; then
  echo "Could not find image URL in the input. Ensure the file contains the full LIBadgeCallback(...)." >&2
  exit 2
fi

echo "Image URL: $IMG_URL"

# Choose default extension if user didn’t pass one
if [[ "$OUT" == "badge.jpg" ]]; then
  case "$IMG_URL" in
    *.png*|*format=png*) OUT="badge.png" ;;
    *.webp*|*format=webp*) OUT="badge.webp" ;;
    *) OUT="badge.jpg" ;;
  esac
fi

# Download the image
curl -L \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari' \
  -o "$OUT" \
  "$IMG_URL"

echo "Saved image to: $OUT"
