# Tâches : Suite de tests automatisés

Spec : [`SPEC.md`](../SPEC.md) · Plan : [`plan.md`](plan.md)

Vérification commune à chaque tâche (Definition of Done) : `npm test` vert,
`npm run lint` vert, aucun fichier modifié dans `lib/`, `app/`, `components/`,
`data/`.

---

## Phase 1 : Fondations

### T1 : Infrastructure Vitest

**Description :** Installer Vitest et configurer l'environnement pour charger
les modules `lib/` (alias `@/`, `server-only`, bouchons `next/*`) avec une base
SQLite temporaire neuve par test. Un test de fumée prouve que ça marche.

**Critères d'acceptation :**
- [x] `npm test` lance Vitest une fois (`vitest run`) ; `test:watch` et `test:coverage` existent
- [x] Un test de fumée importe `@/lib/db`, appelle `db()`, lit la table `products` (données de démarrage présentes) et prouve que le fichier est dans un dossier temporaire, pas `data/`
- [x] Deux tests consécutifs voient chacun une base neuve (une écriture dans le 1er n'apparaît pas dans le 2e)

**Vérification :**
- [x] `npm test` vert ; `data/nahel.db` non modifié (date inchangée)
- [x] Temps de la suite noté (repli transactions si fermer/rouvrir est trop lent sous Windows)

**Dépendances :** aucune

**Fichiers :** `package.json`, `vitest.config.mts`, `tests/setup/{server-only,next-cache,next-headers,next-navigation,next-server,db}.ts`, `tests/integration/db-smoke.test.ts`

**Taille :** M

---

### T2 : Unitaires argent & dates

**Description :** Couvrir les fonctions pures qui calculent de l'argent ou des
jours de boutique.

**Critères d'acceptation :**
- [x] `computeDiscount` (pourcentage, montant fixe, plafond au sous-total, `MAX_PERCENT`), `normalizeCode` (casse, espaces, motif invalide)
- [x] `deliveryFee` (frais normal, gratuit au-dessus du seuil, `goods` nul)
- [x] `formatPrice`, `discountPercent`, `bestDiscount`, `isOutOfStock` ; `shopDay` / `dayStartUtc` / `addDays` autour de minuit à Beyrouth et des changements d'heure

**Vérification :** `npx vitest run tests/unit`

**Dépendances :** T1

**Fichiers :** `tests/unit/{promo-types,delivery-types,catalog-types,shop-time}.test.ts`

**Taille :** M

---

### T3 : Unitaires texte & validation

**Description :** Couvrir les fonctions pures de nettoyage et validation de texte.

**Critères d'acceptation :**
- [x] `slugify`, `parseBody` (h2 / p / ul), `SLUG_RE` ; `normalizeLotCode` / `LOT_CODE_RE`
- [x] `escapeHtml` échappe `& < > " '` ; `layout` n'injecte pas de HTML brut
- [x] `normalizePath` rejette les chemins admin, externes, trop longs ou invalides

**Vérification :** `npx vitest run tests/unit`

**Dépendances :** T1

**Fichiers :** `tests/unit/{article-types,lot-types,mail,analytics}.test.ts`

**Taille :** S

---

### ✅ Checkpoint A
- [x] `npm test`, `npm run lint`, `npm run build` verts
- [x] Revue humaine avant la phase 2

---

## Phase 2 : Intégration

### T4 : Fixtures + produits & codes promo

**Description :** Créer les aides de test (produit, taille, zone, code promo)
et tester la gestion des produits et la recherche d'un code promo utilisable.

**Critères d'acceptation :**
- [x] `tests/setup/fixtures.ts` : `makeProduct({ visible, variants })`, `makeZone({ fee, freeFrom })`, `makePromo({ … })`
- [x] `createProduct` / `updateProduct` / `setVisible` / `setStock` / `deleteProduct` ; `getCatalog` n'inclut pas les produits masqués
- [x] `findUsablePromo` : `not_found`, `expired`, `used_up`, code désactivé ; `createPromoCode` → `taken` si doublon (dates fixées avec `vi.setSystemTime`)

**Vérification :** `npx vitest run tests/integration/products tests/integration/promo`

**Dépendances :** T1

**Fichiers :** `tests/setup/fixtures.ts`, `tests/integration/{products,promo}.test.ts`

**Taille :** M

---

### T5 : Commandes web

**Description :** Tester `placeOrder` et le cycle de vie des statuts, cœur de
la boutique.

**Critères d'acceptation :**
- [x] `placeOrder` refuse produit inconnu / masqué / taille inconnue / rupture (résultat `Shortage`) ; prix et noms pris dans la base ; lignes dupliquées fusionnées ; plafonds `MAX_CART_QTY` et `MAX_ORDER_LINES` ; promo appliquée ; frais de zone ajoutés
- [x] Stock inchangé à la création ; réduit au passage à `confirmed` ; rendu à `cancelled` ; pas de double réduction (`confirmed` → `delivered`)
- [x] Confirmation refusée si le stock est devenu insuffisant entre-temps ; aucun stock négatif

**Vérification :** `npx vitest run tests/integration/orders`

**Dépendances :** T4

**Fichiers :** `tests/integration/orders.test.ts` (+ fixtures si besoin)

**Taille :** M

---

### T6 : Caisse + finance

**Description :** Tester la vente en personne et les rapports d'argent.

**Critères d'acceptation :**
- [x] `recordCounterSale` réduit le stock tout de suite, enregistre le paiement (`cash` / `card` / `whish`), refuse si stock insuffisant
- [x] `buildReport` sur une période : total ventes, meilleures ventes, dépenses, bénéfice = ventes − dépenses ; commandes annulées exclues ; ventes web et caisse comptées
- [x] `periodDays` pour chaque `PeriodKey` (date fixée) ; `addExpense` / `deleteExpense` ; `salesRows` (contenu de l'export CSV)

**Vérification :** `npx vitest run tests/integration/counter-sale tests/integration/finance`

**Dépendances :** T5

**Fichiers :** `tests/integration/{counter-sale,finance}.test.ts`

**Taille :** M

---

### T7 : Stock bas + alertes « prévenez-moi »

**Description :** Tester les alertes de stock bas pour le propriétaire et les
demandes de retour en stock des clients.

**Critères d'acceptation :**
- [x] `listLowStock` / `countLowStock` respectent le seuil réglé (`saveStockSettings`)
- [x] `requestAlert` : `in_stock`, `unavailable`, `too_many` (`MAX_ALERTS_PER_CONTACT`), `ok` ; `listReadyAlerts` après remise en stock
- [x] `sendRestockEmails` avec `fetch` simulé : un appel par alerte prête, rien envoyé sans clé Brevo

**Vérification :** `npx vitest run tests/integration/low-stock tests/integration/stock-alerts`

**Dépendances :** T5

**Fichiers :** `tests/integration/{low-stock,stock-alerts}.test.ts`

**Taille :** S

---

### T8 : Authentification + staff

**Description :** Tester la connexion propriétaire/staff, le blocage et les droits.

**Critères d'acceptation :**
- [x] `ADMIN_PASSWORD` absent ou < 12 caractères → `isAdminConfigured()` faux, `login` → `not_configured` ; bon mot de passe → `ok` + cookie posé ; 5 échecs → `blocked`
- [x] Staff : `createStaff` (`taken` si doublon), `hashPassword` salé (deux hachages différents), compte désactivé ne peut pas se connecter, `setStaffPassword` coupe ses sessions
- [x] `requireAdmin` refuse une session staff ; `requireStaff` accepte staff et propriétaire ; sans session → redirection vers la connexion

**Vérification :** `npx vitest run tests/integration/auth tests/integration/staff`

**Dépendances :** T1 (bouchons `next/headers`, `next/navigation`)

**Fichiers :** `tests/integration/{auth,staff}.test.ts`, éventuellement `tests/setup/next-headers.ts`

**Taille :** M

---

### T9 : Avis + seuils de couverture

**Description :** Tester les avis clients puis activer les seuils de
couverture de la spec.

**Critères d'acceptation :**
- [x] `submitReview` → en attente ; non visible avant `setReviewApproved` ; `ratingSummaries` (moyenne, nombre) ignore les avis non approuvés
- [x] Seuils dans `vitest.config.mts` : ≥ 90 % lignes pour `orders`, `promo`, `promo-types`, `delivery-types`, `finance`, `auth` ; ≥ 70 % sur `lib/**` (exclusions de la spec)
- [x] Si un seuil n'est pas atteignable sans toucher au code : s'arrêter et demander

**Vérification :** `npm run test:coverage` vert

**Dépendances :** T4–T8

**Fichiers :** `tests/integration/reviews.test.ts`, `vitest.config.mts`

**Taille :** S

---

### ✅ Checkpoint B
- [x] `npm run test:coverage` vert ; `npm run lint` et `npm run build` verts
- [x] Section « Bugs trouvés » ci-dessous à jour
- [x] Revue humaine avant la phase 3

---

## Phase 3 : E2E et finition

### T10 : Infra Playwright + parcours boutique → commande

**Description :** Installer Playwright, lancer un serveur de test isolé, et
tester le parcours d'achat.

**Critères d'acceptation :**
- [x] `playwright.config.ts` : `webServer` = `next build && next start -p 3100`, `DATA_DIR` temporaire, `ADMIN_PASSWORD` de test, Chromium seulement
- [x] `e2e/shop-order.spec.ts` : accueil → ajout d'un produit au panier → quantité → zone → formulaire → commande enregistrée (numéro affiché, lien WhatsApp préparé, sans l'ouvrir)
- [x] `npm run test:e2e` existe ; `data/` non touché

**Vérification :** `npm run test:e2e`

**Dépendances :** T1

**Fichiers :** `package.json`, `playwright.config.ts`, `e2e/shop-order.spec.ts`, `.gitignore`

**Taille :** M

---

### T11 : Parcours admin → stock

**Description :** Vérifier dans le navigateur que confirmer une commande met
le stock à jour.

**Critères d'acceptation :**
- [x] Connexion `/admin` avec le mot de passe de test ; mauvais mot de passe → message d'erreur
- [x] Une commande passée côté boutique apparaît ; la passer à « confirmée » réduit le stock affiché dans les produits

**Vérification :** `npx playwright test e2e/admin-order-stock.spec.ts`

**Dépendances :** T10

**Fichiers :** `e2e/admin-order-stock.spec.ts`

**Taille :** S

---

### T12 : Parcours langue EN ⇄ AR

**Description :** Vérifier la bascule de langue et le sens d'écriture.

**Critères d'acceptation :**
- [x] Bascule vers l'arabe → `<html dir="rtl" lang="ar">` et textes arabes visibles ; retour à l'anglais → `ltr`
- [x] Le choix de langue est conservé après rechargement

**Vérification :** `npx playwright test e2e/language-rtl.spec.ts`

**Dépendances :** T10

**Fichiers :** `e2e/language-rtl.spec.ts`

**Taille :** XS

---

### T13 : README + vérification finale

**Description :** Documenter et vérifier les 7 critères de réussite de la spec.

**Critères d'acceptation :**
- [x] Section « Tests » dans `README.md` (commandes, `npx playwright install chromium`, ce qui est testé)
- [x] `.gitignore` : `/test-results`, `/playwright-report`
- [x] Les 7 critères de réussite de `SPEC.md` cochés, avec les sorties de commandes

**Vérification :** `npm test && npm run test:coverage && npm run test:e2e && npm run lint && npm run build`

**Dépendances :** T9, T11, T12

**Fichiers :** `README.md`, `.gitignore`

**Taille :** XS

---

### ✅ Checkpoint C (fin)
- [x] Tous les critères de réussite de la spec remplis
- [ ] Revue humaine avant le commit final

---

## Bugs trouvés

| # | Module | Comportement observé | Impact | Test |
|---|---|---|---|---|
| B1 | `lib/shop-time.ts` → `dayStartUtc` | Le jour du passage à l'heure d'été (ex. 2026-03-29), minuit n'existe pas à Beyrouth (on saute à 01:00 = 22:00 UTC). La fonction renvoie 21:00 UTC, qui est encore 23:00 le 28. | `lib/finance.ts` (`buildReport`, `salesRows`) : le rapport du 29 mars compte aussi la dernière heure du 28, et le rapport du 28 la perd. 1 jour par an, faible. | `tests/unit/shop-time.test.ts` (`it.fails`) |

## Résultats

**Checkpoint A (2026-10-08)** : 9 fichiers, 111 tests verts + 1 échec attendu (B1), ~0,5 s. `npm run lint` vert. `npm run build` vert (lancé avec un `DATA_DIR` temporaire). `data/` inchangé.

**Checkpoint B (2026-10-08)** : 20 fichiers, 251 tests verts + 1 échec attendu (B1), ~9 s (dont ~6 s d'attentes volontaires de 0,4 s après chaque mauvais mot de passe dans `auth.test.ts`). `npm run test:coverage` vert : 73,2 % des lignes sur `lib/` (seuil 70 %) ; par fichier : `orders` 98,6 %, `finance` 93,9 %, `auth` 100 %, `promo`, `promo-types`, `delivery-types` 100 % (seuil 90 % par fichier, vérifié en le montant à 99 % : la commande échoue bien). `npm run lint` et `npm run build` verts. Aucun nouveau bug trouvé en phase 2.

Non couverts (hors périmètre de la spec, prévus pour plus tard si besoin) : `articles.ts`, `lots.ts`, `subscribers.ts`, `doc-store.ts`, `photo-store.ts`, `prepare-photo.ts`, le comptage de visites de `analytics.ts`.

Ajouts phase 2 : `tests/setup/fixtures.ts` (produits, zones, codes promo), `tests/setup/mail.ts` (faux Brevo : aucun email ne sort), `tests/integration/delivery.test.ts` et `tests/unit/rate-limit.test.ts` (non prévus, ajoutés pour la marge de couverture). Le bouchon `next/headers` garde les options des cookies (vérification `httpOnly`/`secure`). `eslint.config.mjs` ignore désormais `coverage/`, `test-results/`, `playwright-report/` (le rapport de couverture généré faisait un avertissement de lint).

**Checkpoint C (2026-10-08)** : `npm run test:e2e` : 6 tests Playwright verts en ~27 s (build compris), Chromium, serveur `next start` sur le port 3100 avec `DATA_DIR` = `%TEMP%/nahel-e2e` (effacé à chaque lancement). `npm test` 251 verts + 1 échec attendu (B1), 9,6 s ; `npm run test:coverage` vert ; `npm run lint` et `npm run build` verts ; `data/` inchangé ; port 3100 libéré après les tests.

Critères de réussite de `SPEC.md` : 1 ✓ (`npm test` sans variable ni serveur, < 30 s) · 2 ✓ (seuils respectés) · 3 ✓ (3 parcours E2E, `data/` intact) · 4 ✓ (tous les cas listés couverts) · 5 ✓ · 6 ✓ (section « Tests » du README) · 7 ✓ (`.gitignore`).

Ajouts phase 3 : Playwright 1.64 ; `e2e/server.mjs` (efface la base de test, build, `next start`) ; `e2e/helpers.ts` ; un 2e test boutique (numéro de téléphone invalide) et un test « mauvais mot de passe admin » en plus des parcours prévus. Note : `npm run test:e2e` refait le build dans `.next/`, comme `npm run build`.

Écarts par rapport au plan : Vitest 5.0.3 ; `vite-tsconfig-paths` retiré (Vite gère `@/` nativement via `resolve.tsconfigPaths`) ; bouchons supplémentaires `next/navigation` et `next/server` ; le setup vide aussi `MAIL_FROM_EMAIL` et `SITE_URL`.
