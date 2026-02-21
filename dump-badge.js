// parse-badge.js
const fs = require('fs');
const raw = fs.readFileSync(process.env.HOME + '/Desktop/badge_raw.txt', 'utf8');
const m = raw.match(/LIBadgeCallback\(\s*(['"])([\s\S]*?)\1\s*,\s*(\d+)\s*\)/);
if (!m) { console.error('No LIBadgeCallback(...) found'); process.exit(1); }
let html = m[2];
try { html = JSON.parse(`"${html.replace(/"/g, '\\"')}"`); } catch {}
const uid = m[3];

const name = (html.match(/class="profile-badge__content-profile-name"[^>]*>[\s\S]*?>([\s\S]*?)<\/a>/) || [,''])[1].trim();
const headline = (html.match(/class="profile-badge__content-profile-headline"[^>]*>\s*([\s\S]*?)\s*<\/h4>/) || [,''])[1].trim();
const orgs = (html.match(/class="profile-badge__content-profile-company-school-info"[^>]*>\s*([\s\S]*?)\s*<\/h4>/) || [,''])[1]
  .replace(/<[^>]+>/g, '').replace(/\s+\|\s+/g, ' | ').trim();
const img = (html.match(/class="profile-badge__content-profile-image"[^>]*src="([^"]+)"/) || [,''])[1];

const out = { uid, name, headline, orgs, img };
fs.writeFileSync(process.env.HOME + '/Desktop/badge_parsed.json', JSON.stringify(out, null, 2));
console.log('Wrote Desktop/badge_parsed.json'); console.log(out);
