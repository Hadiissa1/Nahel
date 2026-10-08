# Spec : Suite de tests automatisés pour Nahel

## Objectif

Nahel n'a aujourd'hui **aucun test automatisé** et pas de script `test` dans
`package.json`. Les seules vérifications sont `npm run lint` et deux scripts
manuels contre un site lancé (`check:security`, `check:load`).

On veut un filet de sécurité qui permette de modifier le code (commandes,
stock, promos, caisse, finance, comptes staff…) sans casser silencieusement ce
qui marche déjà.

**Utilisateurs de la suite :** le propriétaire/développeur du projet et les
agents IA qui modifient le code.

**Ce qu'on teste en priorité (là où une erreur coûte de l'argent ou de la
confiance) :**

1. Calculs d'argent : prix, remises (`computeDiscount`), frais de livraison
   (`deliveryFee`), totaux de commande, rapports finance.
2. Stock : une commande ne réduit pas le stock à la création, seulement au
   passage de statut (`setOrderStatus`) ; la caisse (`recordCounterSale`) le
   réduit tout de suite ; pas de stock négatif ; remise en stock à
   l'annulation.
3. Validation côté serveur : `placeOrder` reprend noms et prix depuis la base,
   jamais depuis le navigateur ; produits masqués ou inconnus refusés ;
   quantités plafonnées (`MAX_CART_QTY`, `MAX_ORDER_LINES`).
4. Authentification et droits : hachage des mots de passe, longueur minimale,
   blocage après trop d'essais, staff limité aux commandes/stock/alertes.
5. Fonctions pures utilitaires : dates de la boutique (fuseau `Asia/Beirut`),
   codes promo / lots / slugs normalisés, `escapeHtml`, `parseBody`.
6. Parcours clés dans un vrai navigateur (E2E) : parcourir → panier →
   commande ; connexion admin → changement de statut → stock mis à jour ;
   bascule EN ⇄ AR (RTL).

## Hypothèses

1. On garde la stack actuelle : Next.js 16.4, React 19.3, TypeScript strict,
   SQLite via `node:sqlite` (`DatabaseSync`), Node 24.
2. **Vitest** pour les tests unitaires et d'intégration (recommandé par le
   guide Next.js du projet : `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`).
3. **Playwright** pour les E2E (guide `.../testing/playwright.md`), car Vitest
   ne sait pas tester les Server Components `async`.
4. Les tests d'intégration utilisent une **vraie base SQLite temporaire**
   (via la variable `DATA_DIR` déjà prise en charge par `lib/db.ts`), pas de
   mock de la base.
5. Aucun appel réseau réel : Brevo (emails) est simulé ; `BREVO_API_KEY` n'est
   jamais défini pendant les tests.
6. Pas de CI pour l'instant (pas de dossier `.github/`) : la suite tourne en
   local. La CI fera l'objet d'une étape séparée.

## Tech Stack (ajouts en devDependencies uniquement)

| Paquet | Rôle |
|---|---|
| `vitest` | Lanceur de tests unitaires/intégration |
| `@vitest/coverage-v8` | Couverture de code |
| `vite-tsconfig-paths` | Résolution de l'alias `@/*` |
| `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom` | Tests de composants client (phase 2, optionnelle) |
| `@playwright/test` | Tests E2E dans Chromium |

Versions : dernières stables compatibles au moment de l'installation,
épinglées dans `package-lock.json`.

## Commandes

```bash
npm test                    # vitest run — toute la suite unitaire + intégration, une fois
npm run test:watch          # vitest — mode surveillance pendant le développement
npm run test:coverage       # vitest run --coverage — rapport dans /coverage
npm run test:e2e            # playwright test — build + serveur de test + navigateur
npx playwright install chromium   # une seule fois, installe le navigateur
npm run lint                # inchangé
npm run build               # inchangé ; doit rester vert
```

`npm test` doit passer **sans** variable d'environnement à définir et sans
serveur lancé.

## Structure du projet

```
vitest.config.mts          → config Vitest (environnement node, alias, setup)
playwright.config.ts       → config Playwright (webServer, DATA_DIR temporaire)
tests/
  setup/
    server-only.ts         → module vide qui remplace "server-only" sous Vitest
    next-cache.ts          → bouchons de next/cache (cacheTag, cacheLife, revalidateTag…)
    next-headers.ts        → bouchon de cookies()/headers() pour lib/auth.ts
    db.ts                  → crée un DATA_DIR temporaire par fichier de test, nettoie après
    fixtures.ts            → aides : créer un produit, une taille, un code promo, une zone…
  unit/                    → fonctions pures, sans base (≈ un fichier par module lib/)
    promo-types.test.ts
    delivery-types.test.ts
    catalog-types.test.ts
    shop-time.test.ts
    article-types.test.ts
    lot-types.test.ts
    mail.test.ts           (escapeHtml, layout)
    analytics.test.ts      (normalizePath)
  integration/             → modules lib/ contre une vraie base SQLite temporaire
    orders.test.ts
    counter-sale.test.ts
    promo.test.ts
    products.test.ts
    finance.test.ts
    auth.test.ts
    staff.test.ts
    stock-alerts.test.ts
    low-stock.test.ts
    reviews.test.ts
e2e/                       → Playwright
  shop-order.spec.ts
  admin-order-stock.spec.ts
  language-rtl.spec.ts
```

Les fichiers de test ne vont pas à côté du code source : `lib/` reste propre.

## Style de code

On suit le style du projet : TypeScript strict, imports `@/…`, noms en
anglais, commentaires courts qui expliquent le *pourquoi*. Un test = un
comportement, nommé par ce qui doit arriver.

```ts
import { describe, expect, it } from "vitest";
import { computeDiscount } from "@/lib/promo-types";

describe("computeDiscount", () => {
  it("caps a percentage discount at the subtotal", () => {
    const rule = { code: "RAMADAN10", kind: "percent", value: 10 } as const;
    expect(computeDiscount(rule, 5000)).toBe(500);
  });

  it("never returns more than the subtotal for a fixed amount", () => {
    const rule = { code: "BIG", kind: "fixed", value: 9000 } as const;
    expect(computeDiscount(rule, 5000)).toBe(5000);
  });
});
```

(Les champs exacts de `PromoRule` seront repris de `lib/promo-types.ts` lors de
l'implémentation.)

Conventions :

- Montants en **centimes entiers**, comme dans le code (`formatPrice(cents)`).
- Pas de `sleep` : les dates sont fixées avec `vi.useFakeTimers()` /
  `vi.setSystemTime()`.
- Chaque test d'intégration part d'une base neuve (aucun test ne dépend de
  l'ordre d'exécution).
- Données de test créées via `tests/setup/fixtures.ts`, jamais en dépendant du
  catalogue de démarrage (`lib/data.ts`) qui peut changer.

## Stratégie de test

| Niveau | Outil | Cible | Environnement |
|---|---|---|---|
| Unitaire | Vitest | fonctions pures de `lib/*-types.ts`, `shop-time.ts`, `mail.ts`… | node, sans base |
| Intégration | Vitest | `lib/orders.ts`, `promo.ts`, `products.ts`, `finance.ts`, `auth.ts`, `staff.ts`, `stock-alerts.ts`, `low-stock.ts`, `reviews.ts` | node, SQLite temporaire |
| Composant (phase 2, optionnelle) | Vitest + Testing Library | composants client simples (`CartProvider`, `Stars`, `SaleBadge`) | jsdom |
| E2E | Playwright | 3 parcours clés listés plus haut | `next build` + `next start` sur un port de test, `DATA_DIR` temporaire, `ADMIN_PASSWORD` de test |

Points techniques à régler (déjà repérés) :

- **`import "server-only"`** est en tête de presque tous les modules `lib/` :
  sous Vitest, alias vers `tests/setup/server-only.ts` (module vide).
- **`"use cache"` / `cacheTag` / `cacheLife`** (`lib/products.ts`, etc.) :
  `next/cache` est remplacé par des bouchons ; les fonctions marquées
  `"use cache"` sont testées comme des fonctions normales.
- **`cookies()`** dans `lib/auth.ts` : `next/headers` est simulé avec un
  magasin de cookies en mémoire.
- **Connexion unique** : `db()` garde la connexion dans
  `globalThis.__nahelDb` et `DATA_DIR` est lu au chargement du module. Le setup
  définit `DATA_DIR` **avant** d'importer `lib/db.ts`, et Vitest isole chaque
  fichier (`pool: "forks"`), donc une base par fichier. Pour une base neuve par
  test, le setup ferme la connexion et vide `globalThis.__nahelDb` entre les
  tests.
- **Emails** : `fetch` vers Brevo est simulé (`vi.stubGlobal`) ; on vérifie
  qu'un email *serait* envoyé, sans rien envoyer.

**Couverture attendue** (mesurée sur `lib/**`, hors `lib/data.ts`,
`lib/starter-articles.ts`, `lib/translations.ts`, `lib/admin-i18n.ts`) :

- ≥ 90 % des lignes pour `orders.ts`, `promo.ts`, `promo-types.ts`,
  `delivery-types.ts`, `finance.ts`, `auth.ts`.
- ≥ 70 % des lignes sur l'ensemble de `lib/`.
- Seuils configurés dans `vitest.config.mts` pour que `test:coverage` échoue
  en dessous.

## Limites

**Toujours :**
- Lancer `npm test` et `npm run lint` avant chaque commit.
- Utiliser un `DATA_DIR` temporaire ; nettoyer après les tests.
- Écrire des tests qui décrivent le comportement voulu, pas l'implémentation.
- Si un test révèle un bug : le noter dans `tasks/todo.md` et le signaler,
  avec le test marqué `it.fails` ou `it.todo` et un commentaire, **sans
  corriger le code de production dans la même tâche**.

**Demander d'abord :**
- Toute modification du code de production (`lib/`, `app/`, `components/`),
  même pour le rendre plus testable (ex. exporter une fonction interne).
- Ajouter une dépendance autre que celles listées dans « Tech Stack ».
- Ajouter une CI (GitHub Actions…).
- Monter ou baisser les seuils de couverture.

**Jamais :**
- Toucher `data/nahel.db` ni `data/uploads` (les vraies données de la
  boutique).
- Appeler de vrais services (Brevo, WhatsApp) ou mettre de vraies clés dans
  les tests.
- Supprimer ou désactiver un test qui échoue pour faire passer la suite.
- Committer `/coverage`, `/test-results`, `/playwright-report`.

## Critères de réussite

1. `npm test` existe, passe au vert sur une copie propre du dépôt après
   `npm install`, sans variable d'environnement ni serveur lancé, en moins de
   30 s.
2. `npm run test:coverage` produit un rapport et respecte les seuils
   ci-dessus.
3. `npm run test:e2e` lance les 3 parcours dans Chromium et passe au vert,
   sans toucher `data/`.
4. Les cas de la section « Objectif » sont couverts, dont au minimum :
   - commande avec un produit masqué ou une taille inconnue → refusée ;
   - prix envoyé par le navigateur ignoré, prix de la base utilisé ;
   - stock inchangé à la création d'une commande, réduit à la confirmation,
     rendu à l'annulation ;
   - vente en caisse → stock réduit immédiatement, refus si stock insuffisant ;
   - code promo expiré / épuisé / sous le minimum → erreur correspondante ;
   - frais de livraison gratuits au-dessus du seuil de la zone ;
   - rapport finance : total ventes − dépenses = bénéfice sur une période ;
   - mot de passe admin < 12 caractères → admin désactivé ; staff sans accès
     aux fonctions réservées à l'admin.
5. `npm run lint` et `npm run build` restent verts.
6. Le README contient une section « Tests » avec les commandes.
7. `.gitignore` ignore `/test-results` et `/playwright-report` (`/coverage`
   l'est déjà).

## Questions ouvertes

1. **E2E dans ce lot ou plus tard ?** Proposition : oui, mais en dernière
   étape, après unitaires + intégration.
2. **Tests de composants (jsdom)** : les inclure maintenant ou les laisser en
   phase 2 ? Proposition : phase 2, la valeur est surtout dans `lib/`.
3. **Bugs trouvés pendant l'écriture des tests** : les signaler seulement
   (proposition) ou les corriger au fil de l'eau ?
4. **CI GitHub Actions** : la prévoir juste après (étape séparée) ?
5. **Langue des noms de tests** : anglais (comme le code, proposition) ou
   français ?
