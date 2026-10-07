# Nahel — Artisanal Honey & Beekeeping / نحّال

Bilingual (English ⇄ العربية, RTL) shop for Lebanese and Egyptian honey, hive
products and beekeeping equipment. Built with Next.js 16, TypeScript and
Tailwind CSS v4.

- Searchable catalog with category filters (Arabic-aware search)
- Weight options (250 g / 500 g / 1 kg) for honey
- Cart saved in the browser and validated against the catalog
- Orders and contact messages sent through WhatsApp
- Payment methods: cash, bank card, Whish Money

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint
```

## Edit content

| What | Where |
|---|---|
| Products, prices (optional `price`) | `lib/data.ts` |
| All interface text (en/ar) | `lib/translations.ts` |
| WhatsApp number, phone, email | `lib/config.ts` |

## Docs

- `docs/ARCHITECTURE.md`: how honey e-shops are structured and how Nahel applies it
- `docs/SECURITY.md`: security measures, load-test results, deployment advice
