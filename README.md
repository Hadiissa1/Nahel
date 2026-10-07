# Nahel — Artisanal Honey & Beekeeping / نحّال

Bilingual (English ⇄ العربية, RTL) shop for Lebanese and Egyptian honey, hive
products and beekeeping equipment. Built with Next.js 16, TypeScript,
Tailwind CSS v4 and SQLite.

- Searchable catalog with category filters (Arabic-aware search)
- Sizes (e.g. 250 g / 500 g / 1 kg) with their own price and stock
- Cart saved in the browser, checked against the live catalog and stock
- Orders recorded on the site (order number, customer details), then sent through WhatsApp
- **Sales and promo codes**: a sale price per size (old price crossed out,
  "-20 %" badge) and codes like `RAMADAN10` that customers type in their cart
- **Tips** (`/blog`): articles in Arabic and English (3 starter articles),
  shown on the home page and listed for Google
- **Traceability**: lot numbers with harvest date, origin and lab analysis
  (PDF), a QR code per lot for the jar label, and a "check your jar" page
- **Customer reviews** (1–5 stars) that you approve before they appear;
  stars on product cards and in Google results
- **Floating WhatsApp button** on every shop page (on a product page, the
  message already names the product)
- **"Notify me when it's back" on sold-out sizes: automatic email, or a
  ready WhatsApp message for the owner, as soon as stock is added
- **Delivery areas** (Beirut, Mount Lebanon…) with their fee, optionally free
  from a cart total, chosen by the customer at checkout
- **A page per product** (`/product/<id>`) to share on WhatsApp, Facebook or
  Instagram, with a photo preview, and found by Google (product data, sitemap)
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
| `SITE_URL` | **yes, in production** | Public address of the site, e.g. `https://nahel.com`. Used in email links (confirm, unsubscribe), share previews and the Google sitemap. **Set it before `npm run build`** too: share previews are built with it. |
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
| Put a size on sale | **Edit** → fill **Sale price** (lower than the price) → **Save**. Empty it to end the sale |
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

### Tips (articles)

**Tips** tab → **Write an article**: titles, short summaries and texts in
Arabic and/or English, a photo, up to 6 related products, published or draft.

Writing the text: leave an **empty line** between paragraphs, start a line
with `## ` for a heading and with `- ` for a list item. That's all; no HTML.

- The web address (e.g. `/blog/how-to-store-honey`) is made from the English
  title; you can change it.
- Published articles appear on `/blog` (menu **Tips**), the latest three on
  the home page, and in the sitemap for Google. Drafts are visible only here.
- Three starter articles are created the first time (crystallization,
  storage, choosing real honey): edit or delete them as you like.

### Lots & traceability

**Lots** tab: one entry per batch of jars.

| Field | Meaning |
|---|---|
| Lot number | Printed on the jar, e.g. `OAK-2026-01` (letters, digits, dashes; upper-cased automatically) |
| Product, harvest date, region / apiary | What the customer sees |
| Notes (AR/EN) | Optional, e.g. "Raw, cold-extracted" |
| Lab analysis | Optional PDF (4 MB max); customers can download it |
| Show on the product page | Tick for lots currently on sale; untick to archive (still checkable) |

- Each lot has a **QR code** (Download QR → SVG, for your label printer or
  designer). It opens `https://<your-site>/lot/<number>`; `SITE_URL` must be set.
- Customers can also type the number at **/lot** (link in the footer).
- Product pages show a **Traceability** block with their current lots.
- Deleting a lot deletes its PDF, and its QR code stops working.

### Customer reviews

Customers write a review on a product page (**Write a review**: stars, name,
text). Nothing is published until you approve it:

- **Reviews** tab (red badge = reviews waiting) → **✓ Approve**, or **Delete**
  for spam. Published reviews can be **hidden** or deleted at any time.
- Approved reviews show on the product page (average and list) and as stars
  on the product cards, and are sent to Google so the stars can appear in
  search results.
- Only the name the customer typed is shown, never any contact details.

### Back-in-stock alerts

On a sold-out size (crossed out, still selectable), customers tap **🔔 Notify
me when it's back** and leave an email or a WhatsApp number.

- **Email**: as soon as you add stock (stock box, product form, or a cancelled
  order), the email goes out **by itself**, in the customer's language, with a
  link to the product page. It's sent once, then the request is deleted.
- **WhatsApp**: the **Stock alerts** tab shows a red badge; tap **Open
  WhatsApp** (message ready), then **Done**.
- The same tab lists **who is waiting** for each sold-out size: handy to plan
  your next harvest or purchase.
- Without email set up on the server, email requests are kept and appear in
  the tab; they are sent automatically once email works.

### Delivery areas

**Delivery** tab: one line per area, with its name (Arabic/English), its
**fee** and optionally **Free from** (free delivery from that order total,
after any promo code). Five starter areas are created the first time (Beirut,
Mount Lebanon, North, South, Bekaa) **without a fee**: fill in yours.

- Empty fee = "fee confirmed on WhatsApp": the customer can still order.
- Untick **Offered** to stop offering an area without deleting it.
- At checkout the customer must choose an area; the fee is added to the total
  (with a hint like "Add $20 more for free delivery"). The server computes the
  fee itself, and the order and WhatsApp message show the area and fee.
- With **no** offered area, customers aren't asked (as before).

### Sales and promo codes

**Sale price**: in a product's sizes, fill **Sale price**. The shop then shows
the new price with the normal one crossed out and a red "-20 %" badge, and
orders use the sale price. Empty the field to end the sale.

**Promo codes** (**Promo codes** tab):

| Field | Meaning |
|---|---|
| Code | What the customer types (letters/numbers, e.g. `RAMADAN10`; upper or lower case both work) |
| Discount | A percent (1–90 %) or an amount in $ off the cart |
| Minimum order | Optional: the code only works from this cart total |
| Last day | Optional: the code stops at the end of that day (Beirut time) |
| Max uses | Optional: how many confirmed orders can use it |

The customer types the code in the cart and sees the discount at once. The
server checks the code again when the order is placed, and the order and the
WhatsApp message show the code and discount. A use is counted when **you
confirm** the order, and given back if you cancel it. **Pause** stops a code
without deleting it. Tip: put the code in a promotion (Promotions tab).
Prices in an order are those of the site at the time of ordering.

### Promotions

| Task | How |
|---|---|
| See who subscribed | **Subscribers** tab: email, WhatsApp, language, confirmed or not; **Export (CSV)** |
| Send a promotion by email | **Promotions** tab → write it in Arabic and/or English → **Send test** to yourself → **Send to all** |
| Send by WhatsApp | Same tab: tap **Open WhatsApp** next to each number; the message opens ready, in the customer's language |

Emails only go to people who **confirmed** their address (a link sent when they
sign up). Each email has an unsubscribe link; unsubscribing deletes the person.

### Product pages and sharing

Every visible product has its own page, e.g. `https://nahel.com/product/oak`
(the address uses the product's id). Open it from the **Open product page**
link in the quick view, or share it:

- **Share** / **WhatsApp** / **Facebook** / **Copy link** buttons on the page
  (on phones, **Share** opens the phone's share menu, including Instagram).
- When the link is pasted in WhatsApp or Facebook, a preview appears with the
  product photo, name and price. After you change the photo, new shares show
  the new photo (apps may keep an old preview for links already sent).
- Google: each page carries the product's prices and stock in Google's format,
  and `/sitemap.xml` lists all visible products. Submit
  `https://<your-site>/sitemap.xml` in
  [Google Search Console](https://search.google.com/search-console) once the
  site is online. Hidden products disappear from the sitemap and their page
  shows "not found".

## Edit site text

| What | Where |
|---|---|
| Interface text (en/ar) | `lib/translations.ts`, admin text in `lib/admin-i18n.ts` |
| WhatsApp number, phone, email (also used by the floating WhatsApp button) | `lib/config.ts` |
| Floating WhatsApp button messages | `lib/translations.ts` → `whatsappButton` |

## Docs

- `docs/ARCHITECTURE.md`: how honey e-shops are structured and how Nahel applies it
- `docs/SECURITY.md`: security measures, test and load-test results, hosting advice
