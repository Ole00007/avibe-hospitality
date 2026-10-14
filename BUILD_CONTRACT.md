# HOSPITALITY-AGENTIC SITE — BUILD CONTRACT (single source of truth for all agents)

## 1. Project & working path
- Product (working name): **Hospitality Identity & Agentic Service Network** (short "Hospitality Agentic").
- Build into: `/Users/olesiarasing/projects/HOSPITALITY/site/` (already created; a git repo is NOT required).
- Deploy README targets **Netlify** (drag-drop or git) + optional Cloudflare. NO build step. Plain HTML/CSS/vanilla JS. **NO external fonts/JS/CSS** (system fonts only; fast, dependency-free).
- Contacts (use EXACTLY, from config): display `+39 345 023 4084`, tel `+393450234084`, WhatsApp `https://wa.me/393450234084`, email `alegra_007@proton.me`, mailto `mailto:alegra_007@proton.me`.

## 2. Design system (see detailed tokens) — premium, calm hospitality tech
Palette (CSS vars):
```
--ink:#0B1623 (deep navy, primary dark)
--ivory:#F6F2EA (warm light background)
--olive:#66704A (secondary accent)
--gold:#B08D57 (muted gold accent)
--slate:#52606D (muted text)
--white:#FFFFFF
--red:#9E3B32 (regulatory/alert only)
```
Typography: headings serif stack `Georgia,'Times New Roman',serif`; body `system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif`. Large calm headings, generous whitespace. Mobile-first, WCAG AA contrast, keyboard focus states, `prefers-reduced-motion` respected. NO cyberpunk, NO glassmorphism, NO generic AI gradients, NO "Lexwell" style. Layout: max-width ~1140px centered `.container`, generous section padding.

## 3. File tree (create exactly)
```
site/
  index.html          (one-page landing, all sections, static form shells)
  styles.css
  app.js
  content.json        (ALL user-facing text, 3 langs)
  config.js           (contacts, formEndpoint, images, meta defaults)
  README.md
  assets/hero-liguria.jpg   (ALREADY EXISTS, do not recreate)
  assets/og-preview.svg     (optional simple OG placeholder)
  legal/privacy.html
  legal/cookies.html
  legal/disclaimer.html
  thank-you.html
  _redirects
```

## 4. i18n scheme (single most important contract)
- `config.js` defines `window.SITE_CONFIG` (contacts, formEndpoint="" placeholder, images, meta base, defaultLang="ru"). Phone/email live ONLY here.
- `content.json` is **language-major**: `{ "ru": {...}, "it": {...}, "en": {...} }`. Each language object has nested keys. **RU is default.**
- HTML elements use `data-i18n="path.to.key"` (textContent), `data-i18n-ph` (placeholder), `data-i18n-aria` (aria-label), `data-i18n-title`. `app.js` fills them from `content.json[activeLang][path]`, toggling `document.documentElement.lang`, and updating `<title>`/`meta`/`og` from a `seo` block.
- Language switcher buttons RU/IT/EN in header (`button[data-lang]`). Persist choice in `localStorage` ("lang"). Default ru.
- **All visible text must come from content.json — no hardcoded sentences in index.html.** (Form field STRUCTURE is static HTML for Netlify Forms; their LABELS/placeholders/errors/consent come from content.json via JS.)

## 5. Exact content.json key tree (Agent A fills all three languages; Agents B/C reference these exact keys)
Language object `L` (L = ru | it | en):
```
L.seo.title, L.seo.description, L.seo.ogTitle, L.seo.ogDesc
L.nav.{about,architecture,modules,journey,hardware,vape,liguria,financial,risks,forms}   (short strings)
L.header.{langLabel,cta}                 (cta = "Request a pilot" translated)
L.hero.{eyebrow,h1,h1Em,lede,sub,cta1,cta2,deviceLabel,deviceNote,stat1,stat2,stat3}
L.problem.{title,sub,items:[{t,d} x5]}   (5: staff shortage; multilingual; fragmented PMS/IoT; instant guest support; underused physical space)
L.architecture.{title,sub,layers:[{label,name,desc} x5],note}   (5 layers: Hardware, Identity, Agent layer, Integrations, Fulfilment)
L.modules.{title,sub,items:[{id,name,short,desc} x6]}  (ids: guestnode, travelwall, agentos, energyiot, smartaccess, compliance)
L.modules.details.{<id>:{body,points[] x4,ctaTitle,ctaText}}    (detail modal long text)
L.journey.{title,sub,intro,stages:[{stage,name,agent[],human[]} x5],legendAgent,legendHuman}  (5 stages: Pre-arrival, Arrival/identity, In-stay, Request/commerce, Checkout/review)
L.hardware.{title,sub,items:[{id,name,role,value,fit,implementation,compliance} x9]}  (compliance values: "Assessment required" where applicable)
L.vape.{title,badge,sub,scope,why,model,age,optin,disclaimer,note,nonew}   (regulatory; see §7)
L.liguria.{title,sub,cities:[{name,note} x4],pilotTitle,pilot:[{t,d} x5],gatesTitle,gates:[{t,d} x4],dataNote}
   cities: Genova, Savona/Riviera, Imperia/Sanremo, La Spezia/Cinque Terre
L.financial.{title,sub,catTitle,items:[{name,desc} x9],ctaTitle,cta,disc}   (9 categories: startup investment, CAPEX, SaaS revenue, transaction/rental revenue, working capital, P&L, cash flow, break-even, risk register)
L.risks.{title,sub,items:[{area,cat,mitigation} x8],legalNote}   (GDPR, CE/RED/EMC/RoHS, CRA, Italian identity, payment security, vape licensing, etc.)
L.forms.{title,sub,intro,consent,privacy,submit,success,required,opt,errors:{name,email,required,consent,date},forms:[
   {id:"pilot", title, fields:[{name,type,label,ph}...]},      // see §6 for exact fields
   {id:"call", title, fields:[...]},
   {id:"oem", title, fields:[...]},
   {id:"investor", title, fields:[...]}
]}
L.footer.{about,contactTitle,nav,legal,privacy,cookies,disclaimer,rights,backToTop,credit,contactNote}
L.ctaBand.{title,sub,cta}
L.cookie.{title,text,accept,decline,privacy}
L.legal.{privacy:{title,updated,body:[{h,p}...]}, cookies:{... body{h,p}}, disclaimer:{... body{h,p}}}   // placeholder legal bodies
L.thankyou.{title,text,back,contactLine}
L.langNAme  (e.g. "Русский"/"Italiano"/"English")
```

## 6. Four forms — exact static fields (Agents B: static `<form data-netlify="true">`; Agent A: labels/options/errors in content.json; Agent C: validation+submit)
Common to EVERY form: hidden `form-name` (matches id), hidden `lang`, hidden `form_id` (id), UTM hidden fields `utmsource, utmmedium, utmcampaign`, honeypot `<input class="hp" name="website_url" tabindex="-1" autocomplete="off">`, GDPR required checkbox, submit button.
1) **pilot** "Request a pilot / Richiedi un pilot / Запросить пилот":
   property_name(text,req), contact_name(text,req), email(email,req), phone(tel), city(text,req), property_type(select: Hotel/B&B/Residence/Boutique hotel/Other; req), rooms(number,req), pms(text), interests(multiselect/checkboxes: Agent OS/GuestNode/Smart Travel Wall/Lockers/IoT energy/Smart access/Check-in kiosk/Regulated vending (licensed partner)), lang_pref(select: Italiano/English/Русский), notes(textarea), consent(checkbox req).
2) **call** "Book a 20-minute discovery call":
   name(text,req), hotel(text,req), email(email,req), phone(tel), date(date,req), time(time,req), lang(select), challenge(textarea,req), consent(req).
3) **oem** "Hardware & OEM partnership":
   company(text,req), country(text,req), category(text,req), moq(text), docs(select: CE/RED/EMC/RoHS available — Yes/Partial/No; req), api(select: API/local control Yes/No), contact_person(text,req), email(email,req), website(url), message(textarea), consent(req).
4) **investor** "Investor / strategic partner":
   name(text,req), organisation(text,req), role(text,req), email(email,req), phone(tel), interest(select: Financial/Strategic/Distribution/Other; req), note(textarea), consent(req).

Submit flow (app.js): on submit → validate (native + custom consent) → if `window.SITE_CONFIG.formEndpoint` non-empty: POST JSON to it (Content-Type application/json) and show success on 2xx. Else (endpoint absent): build `mailto:` with JSON body in subject/body and open it; show the success/"thank-you" note. **Do NOT auto-send to any real endpoint by default** (default endpoint is empty → mailto fallback). Success state per form (inline div) + link to thank-you.html. Accessible errors via `aria-invalid` + `role=alert`. Netlify Forms compatible: `data-netlify="true"` + `netlify-honeypot="website_url"`; JSON payload shape documented in README.

## 7. Vape vertical — mandatory rules (Agent A copy + Agent B section + everywhere)
- Keep it as a SEPARATE, restrained risk-controlled section (id `vape`), NOT the hero.
- The exact English line MUST be present (all langs translate it consistently): "Available only through authorised licensed partners, subject to Italian regulation, age verification and property approval."
- Add an age-gate placeholder (e.g. button "I am 18+ / legal age" to view) and a separate explicit disclaimer ("not legal advice", ADM, advertising ban, excise, property written consent, licensed operator only).
- No checkout for vape products. No medical/health claims. Never the hero proposition.

## 8. Financial model — no invented numbers
Financial section shows model CATEGORIES only (startup investment, CAPEX, SaaS, transaction/rental revenue, working capital, P&L, cash flow, break-even, risk register) as cards. NO numeric valuations, no specific revenue/growth numbers, no "verified" claims. Include a clear note: inputs are placeholders, not a promise of result. CTA "request a private model discussion" → forms (mailto/investor).

## 9. Compliance badges (hardware + risks)
Use status badge "Assessment required" (with `--red`/amber styling) wherever CE/RED/EMC/RoHS/CRA is not assured. Do not claim certification. Legal note "not legal advice" in risks + disclaimer.

## 10. Class/component conventions (Agents B & C agree)
- `.container`, `.section`, `.eyebrow`, `.h1/.h2/.h3`, `.btn` (`.btn--gold`, `.btn--ghost`), `.nav`, `.lang-switch`, `.grid`, `.card`, `.badge` (`.badge--warn`), `.arch-dia`, `.timeline`, `.modal`/`.modal-backdrop`, `.form`, `.form-field`, `.hp` (honeypot), `.cookie-banner`, `.error-text`, `.success-box`, `[data-reveal]` (IntersectionObserver attach `is-in`), `prefers-reduced-motion` disables `.is-in` animation.
- Architecture diagram: build with HTML/CSS + inline `<svg>` connectors (layered), NOT a raster image.
- Modals: `.modal` opened by `[data-open-modal]`, close on backdrop/Escape/`.modal-close`; focus trap; `aria-modal="true"`.
- Forms rendered statically (see §6) for Netlify detection; JS only enhances.

## 11. Hero visual
Use `assets/hero-liguria.jpg` inside a **conceptual device mockup** (CSS frame: a screen with the image + an overlaid "agent UI" card showing greeting/booking/energy chips + a caption "Concept"). Not a standalone fake product photo.

## 12. SEO/schema (Agent B head + Agent C inject)
- Per-language SEO title/description/OG in content.json. `index.html` `<head>` holds base title/meta; `app.js` swaps on lang change.
- JSON-LD placeholders in index.html: Organization, LocalBusiness, SoftwareApplication — with placeholders (no ratings, no fictitious claims). LocalBusiness name in schema + SoftwareApplication name/applicationCategory="BusinessApplication".
- `legal/privacy.html`, `legal/cookies.html`, `legal/disclaimer.html` + `thank-you.html` each minimal, load app.js + content.json, render `legal.<page>` / `thankyou` key, back link, contacts. Include `_redirects`: Netlify-style `/* /index.html 200` splash is NOT wanted — instead include a simple `_redirects` with `/privacy  /legal/privacy.html 200` style aliases (Agent C).

## 13. README.md (Agent C)
Local preview (`python3 -m http.server` note / `npx serve`), Netlify deploy (drag-drop `site/` or git, Netlify Forms attr auto-detect), webhook integration TODO (Netlify Form → webhook → n8n → CRM/email/Telegram), where to edit contacts/translations/images, JSON payload example, known legal/compliance TODOs, cross-check checklist.
