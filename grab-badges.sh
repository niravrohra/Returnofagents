#!/usr/bin/env bash
set -euo pipefail

LINKS_FILE="${1:-links.txt}"
OUT_DIR="raw"
mkdir -p "$OUT_DIR"

if [[ ! -f "$LINKS_FILE" ]]; then
  echo "Missing $LINKS_FILE"; exit 1
fi

echo "Reading URLs from: $LINKS_FILE"
echo "Writing raw outputs to: $OUT_DIR"

# Optional throttle between requests (seconds)
SLEEP="${SLEEP:-2}"

i=0
while IFS= read -r url; do
  [[ -z "$url" ]] && continue
  ((i++))
  # stable filename from URL
  hash="$(printf '%s' "$url" | md5)"
  out="$OUT_DIR/$hash.txt"

  echo "[$i] Fetching -> $out"

  # Call AppleScript: open in Safari, wait readyState, extract innerText, return via stdout
  content="$(osascript - "$url" <<'APPLESCRIPT'
on run argv
  set theURL to item 1 of argv

  tell application "Safari"
    activate
    if (count of documents) = 0 then make new document
    set URL of front document to theURL
  end tell

  -- wait for load to complete (up to ~20s)
  set t0 to (current date)
  repeat
    delay 0.5
    try
      tell application "Safari"
        set rs to do JavaScript "document.readyState" in front document
      end tell
      if rs is "complete" then exit repeat
    end try
    if ((current date) - t0) > 20 then exit repeat
  end repeat

  -- get visible text
  set pageText to ""
  try
    tell application "Safari"
      set pageText to do JavaScript "document.body ? document.body.innerText : ''" in front document
      if pageText is "" then set pageText to do JavaScript "document.documentElement ? document.documentElement.innerText : ''" in front document
    end tell
  end try

  return pageText
end run
APPLESCRIPT
  )"

  # Save even if empty (helps you diagnose authwall/blocked cases)
  printf "%s" "$content" > "$out"
  bytes=$(wc -c < "$out" | tr -d '[:space:]')
  echo "   wrote ${bytes} bytes"
  sleep "$SLEEP"
done < "$LINKS_FILE"

echo "Done. Raw files in $OUT_DIR/"
