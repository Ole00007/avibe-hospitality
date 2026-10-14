# Hospitality Agentic — Site

**Hospitality Identity & Agentic Service Network** — a premium, calm hospitality-tech (B2B)
landing page. Pure HTML/CSS/vanilla JS, no build step, no external fonts or scripts.
Deploy target: **Netlify** (drag-drop or git). Optional: Cloudflare Pages.

Default language: **RU** (`content.json` is language-major `{ ru, it, en }`).

---

## Files

| File | Purpose |
| --- | --- |
| `index.html` | One-page landing with all sections + 4 static Netlify form shells |
| `styles.css` | Design system + layout (see `BUILD_CONTRACT.md` §10 class conventions) |
| `app.js` | All behaviour: i18n, UTM capture, form validation/submit, modals, reveal, cookie banner, age gate, legal/thank-you rendering |
| `content.json` | **Every** user-facing string, 3 languages (`ru` default, `it`, `en`) |
| `config.js` | `window.SITE_CONFIG`: contacts, `formEndpoint`, images, `defaultLang="ru"` |
| `assets/hero-liguria.jpg` | Hero visual inside a conceptual device mockup |
| `legal/privacy.html`, `legal/cookies.html`, `legal/disclaimer.html` | Minimal legal pages; body rendered from `content.json` `legal.<page>` |
| `thank-you.html` | Post-submit page; body rendered from `content.json` `thankyou` |
| `_redirects` | Netlify aliases: `/privacy`, `/cookies`, `/disclaimer`, `/thank-you` |

**Compliance badges** use `"Assessment required"` (`--red`/amber) wherever CE/RED/EMC/RoHS/CRA
is not assured. No certifications are claimed. See `BUILD_CONTRACT.md`.

---

## Local preview

```bash
cd site
python3 -m http.server 8080
# open http://localhost:8080
```

Or: `npx serve site` then open the printed URL.

> `app.js` loads `./content.json` and `config.js` relative to the page. Always serve over HTTP
> (a plain `file://` open may block the fetch).

---

## Netlify deploy

1. **Drag & drop** the whole `site/` folder into the Netlify dashboard, **or**
2. **Connect git** (repo with this folder as publish directory — no build command needed), or
3. `npx netlify deploy --prod --dir site`

**Netlify Forms** are auto-detected from `data-netlify="true"` on each `<form>` plus a hidden
`form-name` field. By default `app.js` **intercepts** submissions and uses the `mailto:`
fallback (see below) so **no real endpoint is called and nothing is sent anywhere** until you
configure `formEndpoint` in `config.js`.

---

## Form webhook integration (TODO)

To route real submissions into your stack:

1. Keep `data-netlify="true"` on the forms (Netlify receives them).
2. In `config.js` set `formEndpoint` to your webhook URL. When non-empty, `app.js`
   POSTs the form as **JSON** (`Content-Type: application/json`) and shows success on `2xx`.
3. On the webhook side, build an **n8n** workflow: **Webhook** node
   → branch → **CRM** (HubSpot/Dynamics), **Email** (SMTP), **Telegram** bot, and/or a
   **Google Sheet**.
4. Confirm the success state renders on `2xx`; on error `app.js` shows an inline error.

Netlify's own submission notifications can also forward to the same webhook as a second path
(stage/backup). Update this README once the endpoint is live.

---

## Where to edit things

- **Contacts** (phone, `tel:`, WhatsApp, email, mailto): `config.js` → `window.SITE_CONFIG.CONTACT`.
- **Form endpoint / images / meta / defaultLang**: top of `config.js`.
- **All copy + translations** (RU/IT/EN, form field labels, errors, consent, legal bodies): `content.json`
  — language-major `{ ru, it, en }`. **RU is default.** Any visible sentence must live here, not in the HTML.
- **Images**: paths in `config.js` (and `assets/`).

---

## JSON payload sent when `formEndpoint` is configured

```json
{
  "property_name": "Villa Margherita",
  "contact_name": "Anna Rossi",
  "email": "anna@example.com",
  "phone": "+39 ...",
  "city": "Genova",
  "property_type": "Boutique hotel",
  "rooms": "24",
  "interests": ["Agent OS", "Smart Travel Wall"],
  "lang_pref": "Italiano",
  "notes": "...",
  "consent": "on",
  "utmsource": "google",
  "utmmedium": "cpc",
  "utmcampaign": "launch",
  "lang": "it",
  "form_id": "pilot",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

Delivery: POST `application/json` to `formEndpoint`. Repeated fields (e.g. multi-select
`interests`) are sent as an array. `timestamp` is ISO-8601.

---

## `mailto:` fallback (default — no endpoint)

When `formEndpoint` is empty (the default), `app.js` does **not** send anything.
On submit it:

1. Validates the form (native + required GDPR consent), shows accessible per-field errors.
2. Builds a `mailto:` link to `SITE_CONFIG.CONTACT.email` with a `subject` and a human-readable
   JSON body (`form_id`, `lang`, `fields`, `timestamp`).
3. Opens it via `window.location` and shows the localized success box + link to `thank-you.html`.

The honeypot field (`website_url`, hidden) is checked first — a filled honeypot silently drops
the submission.

---

## Known legal / compliance TODOs

- [ ] **CE / RED / EMC / RoHS** certification for any shipped device hardware.
- [ ] **CRA** (Cyber Resilience Act) assessment where applicable.
- [ ] **Alloggiati Web** (guest data reporting to the Italian Ministry of the Interior).
- [ ] **GDPR / DPA** — evidence-gathering & retention, consent wording, processor agreements.
- [ ] Vape vertical **only via a licensed partner**, with property written consent and age
      verification; **no public promotion** of vapes.
- [ ] Native **RU / IT copy review** by a human fluent reviewer (all three languages).
- [ ] Final legal review of `legal/privacy.html`, `legal/cookies.html`, `legal/disclaimer.html`
      bodies (currently placeholder text in `content.json`).

---

## Cross-check checklist

- [ ] Anchors: every nav link jumps to an existing section id; smooth scroll; modal closes on anchor click.
- [ ] Language switching RU/IT/EN: title, meta, og, `[data-i18n]`, placeholders, aria, errors all swap; persisted in `localStorage.lang`.
- [ ] All **4 forms** validate: required, email format, GDPR consent; errors shown with `role="alert"` + `aria-invalid`; honeypot silently drops.
- [ ] Responsive at **320 / 375 / 768 / 1024 / desktop** — no horizontal scroll, touch targets ≥ 44px.
- [ ] Keyboard & focus: full tab order, visible focus states, modal focus trap + Escape.
- [ ] `tel:`, `mailto:`, `wa.me` links point to the correct numbers/email.
- [ ] Vape disclaimer is **always present** and the exact required line (in all 3 langs) is visible; age gate works.
- [ ] **No invented financial claims** (financial section is categories/placeholders only, with a "not a promise" note).
- [ ] **No false compliance claims** (badges read `Assessment required`; no certifications asserted).
- [ ] No console errors; `app.js` logs nothing in normal operation.

---

See `BUILD_CONTRACT.md` in this folder for the single source of truth (design tokens, i18n key
tree, form field definitions, class conventions).
