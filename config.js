/* avibe-hospitality
   Global site configuration (single source of truth for contacts/assets).
   No secrets or API keys here. Form endpoint is intentionally EMPTY by
   default → app.js falls back to a mailto: draft. */

window.SITE_CONFIG = {
  defaultLang: "ru",
  languages: ["ru", "it", "en"],

  logo: {
    name: "avibe-hospitality",
    tagline: "Integrated hardware + software · deployed on Cloudflare"
  },

  CONTACT: {
    phoneDisplay: "+39 345 023 4084",
    phoneTel: "+393450234084",
    whatsapp: "https://wa.me/393450234084",
    email: "alegra_007@proton.me",
    mailto: "mailto:alegra_007@proton.me",
    altPhone: null
  },

  /* Empty string = use mailto fallback (no auto-send). To enable an API
     endpoint later, set e.g. "https://your-worker.example/api/lead". */
  formEndpoint: "",

  images: {
    hero: "assets/hero-liguria.jpg",
    og: "assets/og-preview.svg"
  },

  meta: {
    ru: {
      title: "avibe-hospitality — оборудование снимает боль и продаёт ПО (модульное «железо + софт») для гостиничного бизнеса B2B",
      description: "Hardware which eases the pain and sells software (modular hardware + software) for hospitality (B2B). Further projected to be built and integrated — avibe hospitality harness. / Оборудование, снимающее боль отелей, и модульное программное обеспечение для гостиничного бизнеса B2B."
    },
    it: {
      title: "avibe-hospitality — hardware che allevia il dolore e vende software (modulare) per l'ospitalità B2B",
      description: "Hardware which eases the pain and sells software (modular hardware + software) for hospitality (B2B). Further projected to be built and integrated — avibe hospitality harness."
    },
    en: {
      title: "avibe-hospitality — hardware that eases the pain and sells software for hospitality (B2B)",
      description: "Hardware which eases the pain and sells software (modular hardware + software) for hospitality (B2B). Further projected to be built and integrated — avibe hospitality harness."
    }
  }
};
