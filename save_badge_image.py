# save_badge_image.py
# Usage:
#   python3 save_badge_image.py badge_raw.txt nirav-linkedin.jpg
#   cat badge_raw.txt | python3 save_badge_image.py - nirav-linkedin.jpg

import sys, re, json, html, urllib.request

def read_input(path: str) -> str:
    if path == "-":
        return sys.stdin.read()
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def extract_img_url(text: str) -> str:
    # Pull JSONP payload: LIBadgeCallback("...HTML...", uid)
    m = re.search(r'LIBadgeCallback\(\s*([\'"])(.*?)\1\s*,\s*\d+\s*\)', text, re.S)
    payload = None
    if m:
        raw = m.group(2)
        try:
            payload = json.loads('"%s"' % raw.replace('"', '\\"'))  # unescape JS string via JSON
        except Exception:
            payload = raw
    html_str = payload if payload is not None else text

    # Extract the image src from the badge HTML
    m2 = re.search(r'class="profile-badge__content-profile-image"[^>]*src="([^"]+)"', html_str)
    if not m2:
        return ""
    return html.unescape(m2.group(1))  # decode &amp;

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 save_badge_image.py <badge_raw.txt|-> <out_file>", file=sys.stderr)
        sys.exit(1)

    src_path = sys.argv[1]
    out_path = sys.argv[2]

    data = read_input(src_path)
    url = extract_img_url(data)
    if not url:
        print("Could not find image URL in input. Make sure the file contains the full LIBadgeCallback(...).", file=sys.stderr)
        sys.exit(2)

    print("Image URL:", url)

    # Download
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari"}
    )
    with urllib.request.urlopen(req) as resp, open(out_path, "wb") as out:
        out.write(resp.read())

    print("Saved image to:", out_path)

if __name__ == "__main__":
    main()
