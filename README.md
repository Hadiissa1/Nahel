# Nahel — Artisanal Honey & Beekeeping / نحّال

Bilingual (English ⇄ العربية, RTL) shop for Lebanese and Egyptian honey, hive
products and beekeeping equipment. Built with Next.js 16, TypeScript,
Tailwind CSS v4 and SQLite.

- Searchable catalog with category filters (Arabic-aware search)
- Sizes (e.g. 250 g / 500 g / 1 kg) with their own price and stock
- Cart saved in the browser, checked against the live catalog and stock
- Orders recorded on the site (order number, customer details), then sent through WhatsApp
- **Store management at `/admin`**: orders with automatic stock; add, edit,
  hide or delete products; set prices and stock; photos from the phone camera
  or gallery
- **Offers & sales subscription**: customers leave an email and/or WhatsApp
  number (with consent); the owner sends promotions from `/admin/promotions`

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
| `SITE_URL` | for emails | Public address of the site, e.g. `https://nahel.com`. Used in email links (confirm, unsubscribe). |
| `BREVO_API_KEY` | for emails | API key from [Brevo](https://www.brevo.com) (free plan: 300 emails/day). |
| `MAIL_FROM_EMAIL` | for emails | Sender address, verified in Brevo (e.g. `offers@nahel.com`). |
| `MAIL_FROM_NAME` | no | Sender name. Default: `Nahel`. |
| `MAIL_DRIVER` | no | `log` writes emails to `DATA_DIR/outbox.log` instead of sending them (testing only). |

Without the email settings, everything else works: email sign-ups are kept,
and WhatsApp promotions work. Once email is set up, use **Subscribers →
Re-send confirmation emails** for people who signed up before.

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

### Orders

How an order works:
1. The customer fills the cart, taps **Continue to order**, enters name, phone,
   and optionally address and note, then **Place order**.
2. The order is **recorded** (status **New**) and gets a number; the customer then
   sends it to you on WhatsApp with one tap (the message includes the number).
3. In **Orders**, a red badge shows new orders. Call or WhatsApp the customer,
   then:

| Button | Effect |
|---|---|
| **Confirm (take from stock)** | Status **Confirmed**; the quantities are **taken out of stock** (refused, with details, if there isn't enough) |
| **Mark delivered** | Status **Delivered**; counted in "Delivered this month" |
| **Cancel** | Status **Cancelled**; if it was confirmed, the quantities **go back into stock** |
| **Re-open** / **Delete** | For cancelled orders (e.g. delete spam) |

Placing an order never changes stock by itself: fake orders can't empty it.
Prices in an order are those of the site at the time of ordering.

### Promotions

| Task | How |
|---|---|
| See who subscribed | **Subscribers** tab: email, WhatsApp, language, confirmed or not; **Export (CSV)** |
| Send a promotion by email | **Promotions** tab → write it in Arabic and/or English → **Send test** to yourself → **Send to all** |
| Send by WhatsApp | Same tab: tap **Open WhatsApp** next to each number; the message opens ready, in the customer's language |

Emails only go to people who **confirmed** their address (a link sent when they
sign up). Each email has an unsubscribe link; unsubscribing deletes the person.

## Edit site text

| What | Where |
|---|---|
| Interface text (en/ar) | `lib/translations.ts`, admin text in `lib/admin-i18n.ts` |
| WhatsApp number, phone, email | `lib/config.ts` |

## Docs

- `docs/ARCHITECTURE.md`: how honey e-shops are structured and how Nahel applies it
- `docs/SECURITY.md`: security measures, test and load-test results, hosting advice
