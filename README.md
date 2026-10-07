# Nahel — Artisanal Honey & Beekeeping / نحّال

Bilingual (English ⇄ العربية, RTL) shop for Lebanese and Egyptian honey, hive
products and beekeeping equipment. Built with Next.js 16, TypeScript,
Tailwind CSS v4 and SQLite.

- Searchable catalog with category filters (Arabic-aware search)
- Sizes (e.g. 250 g / 500 g / 1 kg) with their own price and stock
- Cart saved in the browser, checked against the live catalog and stock
- Orders and contact messages sent through WhatsApp
- **Store management at `/admin`**: add, edit, hide or delete products; set
  prices and stock; add photos from the phone camera or gallery

## Run

```bash
npm install
ADMIN_PASSWORD='a-long-password-here' npm run dev   # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint
```

## Server settings (environment variables)

| Variable | Required | Meaning |
|---|---|---|
| `ADMIN_PASSWORD` | yes, for `/admin` | Password for the store management. **At least 12 characters.** Without it, admin sign-in is disabled. |
| `DATA_DIR` | no | Folder for the database (`nahel.db`) and uploaded photos. Default: `./data`. **Must be on persistent storage** and backed up. |

## Managing the store

Open `https://<your-site>/admin`, sign in with `ADMIN_PASSWORD`, then:

| Task | How |
|---|---|
| Add a product | **+ Add a product** → photo (📷 camera or 🖼️ gallery), names, sizes with price and stock → **Save** |
| Change price / sizes / photo | **Edit** on the product |
| Update stock after a sale | Type the new number in the stock box on the list → **Save** |
| Take a product off the shop temporarily | **Hide from shop** (it stays in the admin) |
| Remove a product for good | **Delete** (asks for confirmation) |

Empty price = "price on request". Empty stock = not tracked (always available).
Stock `0` = "out of stock": customers can't add that size to their cart.
Changes appear in the shop immediately for you, and for all visitors within a
minute.

The first start fills the database once with the starter catalog from
`lib/data.ts`; after that, products live only in the database.

## Edit site text

| What | Where |
|---|---|
| Interface text (en/ar) | `lib/translations.ts`, admin text in `lib/admin-i18n.ts` |
| WhatsApp number, phone, email | `lib/config.ts` |

## Docs

- `docs/ARCHITECTURE.md`: how honey e-shops are structured and how Nahel applies it
- `docs/SECURITY.md`: security measures, test and load-test results, hosting advice
