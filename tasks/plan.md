# Plan d'implémentation : Suite de tests automatisés

Spec de référence : [`SPEC.md`](../SPEC.md) (validée le 2026-10-08).
Tâches détaillées : [`tasks/todo.md`](todo.md).

## Vue d'ensemble

Ajouter Vitest (unitaires + intégration sur SQLite temporaire) puis Playwright
(3 parcours E2E), sans modifier le code de production. On commence par
l'infrastructure la plus risquée (faire charger `lib/db.ts` et les modules
`server-only` sous Vitest), puis on couvre les modules par ordre de
criticité : argent → stock → droits → le reste. Les E2E arrivent en dernier.

## Décisions retenues (questions ouvertes de la spec)

| Question | Décision |
|---|---|
| E2E dans ce lot ? | Oui, en dernière phase |
| Tests de composants (jsdom) ? | Non, phase 2 ultérieure : pas de jsdom ni Testing Library dans ce lot |
| Bugs trouvés ? | Signalés dans `todo.md` + test `it.fails`, pas de correction |
| CI GitHub Actions ? | Étape séparée, après ce lot |
| Langue des noms de tests | Anglais |

## Décisions d'architecture

- **Environnement `node`** pour Vitest (pas jsdom) : tout ce qu'on teste dans
  ce lot est du code serveur.
- **`pool: "forks"`** : `node:sqlite` est un module natif de Node. Chaque
  fichier de test a son propre processus, donc son propre `globalThis.__nahelDb`
  et son propre `DATA_DIR`.
- **Une base neuve par test** : `tests/setup/db.ts` crée un dossier temporaire,
  définit `DATA_DIR`, puis, en `beforeEach`, ferme la connexion, supprime le
  dossier et vide `globalThis.__nahelDb`. Comme `DATA_DIR` est figé au
  chargement de `lib/db.ts`, on garde **un dossier fixe par fichier** et on
  supprime/recrée son contenu entre les tests (pas un nouveau chemin).
- **La base neuve contient les données de démarrage** (`seed()` : catalogue,
  3 articles, zones de livraison). Les fixtures créent leurs propres produits
  et ne dépendent jamais de ces données. Les zones de démarrage existent, donc
  `placeOrder` exige une zone : les fixtures en fournissent une.
- **Bouchons Next** via `resolve.alias` dans `vitest.config.mts` :
  `server-only` → module vide ; `next/cache` (`cacheTag`, `cacheLife`,
  `revalidateTag`, `updateTag`, `revalidatePath`) → fonctions vides ;
  `next/headers` (`cookies`, `headers`) → magasin en mémoire réglable par
  test ; `next/navigation` (`redirect`, `notFound`) → lèvent une erreur
  reconnaissable ; `next/server` (`connection`) → no-op.
  La liste exacte des exports utilisés sera relevée par `grep` en tâche 1.
- **`"use cache"`** : sans le compilateur Next, la directive est une simple
  chaîne ignorée, donc la fonction s'exécute normalement.
- **Emails** : `BREVO_API_KEY` non défini ⇒ `mailConfigured()` faux. Pour les
  tests qui vérifient un envoi, on définit une fausse clé et
  `vi.stubGlobal("fetch", …)`.
- **E2E** : `playwright.config.ts` lance `next build && next start -p 3100`
  avec `DATA_DIR` = dossier temporaire et un `ADMIN_PASSWORD` de test. Le build
  E2E écrit dans `.next/`, comme d'habitude.

## Graphe de dépendances

```
T1 Infra Vitest + bouchons + base temporaire (risque max)
 ├── T2 Unitaires : argent & dates (promo-types, delivery-types, catalog-types, shop-time)
 ├── T3 Unitaires : texte & validation (article-types, lot-types, mail, analytics)
 └── T4 Fixtures + intégration : produits & promo
       └── T5 Intégration : commandes web (placeOrder, setOrderStatus)
             ├── T6 Intégration : caisse + finance
             ├── T7 Intégration : stock bas + alertes de retour en stock
             └── T8 Intégration : auth + staff
                   └── T9 Intégration : avis + seuils de couverture
T10 Infra Playwright + parcours boutique → commande (dépend de T1 pour le .gitignore/scripts)
 ├── T11 E2E admin → stock
 └── T12 E2E langue / RTL
T13 README « Tests » + vérification finale
```

T2, T3 et T4 peuvent se faire dans n'importe quel ordre après T1. T6, T7 et T8
sont indépendants entre eux.

## Liste des tâches

### Phase 1 : Fondations
- [x] T1 : Infrastructure Vitest (config, bouchons Next, base temporaire, un test de fumée)
- [x] T2 : Tests unitaires argent & dates
- [x] T3 : Tests unitaires texte & validation

### Checkpoint A
- [ ] `npm test` vert, `npm run lint` vert, `npm run build` vert ; revue humaine

### Phase 2 : Intégration (logique métier sur SQLite)
- [ ] T4 : Fixtures + produits & codes promo
- [ ] T5 : Commandes web
- [ ] T6 : Vente en caisse + rapports finance
- [ ] T7 : Stock bas + alertes « prévenez-moi »
- [ ] T8 : Authentification + comptes staff
- [ ] T9 : Avis + seuils de couverture activés

### Checkpoint B
- [ ] `npm run test:coverage` vert avec les seuils de la spec ; liste des bugs trouvés ; revue humaine

### Phase 3 : E2E et finition
- [ ] T10 : Infra Playwright + parcours boutique → commande
- [ ] T11 : Parcours admin → confirmation → stock
- [ ] T12 : Parcours langue EN ⇄ AR (RTL)
- [ ] T13 : README + `.gitignore` + vérification finale

### Checkpoint C (fin)
- [ ] Les 7 critères de réussite de la spec sont remplis ; revue humaine avant commit final

## Risques et parades

| Risque | Impact | Parade |
|---|---|---|
| `lib/db.ts` ne se charge pas sous Vitest (`server-only`, `node:sqlite`, alias `@/`) | Élevé | Traité en T1 avec un test de fumée avant tout le reste |
| Fermer/rouvrir la connexion SQLite entre tests est lent ou bloque les fichiers WAL sous Windows | Moyen | Mesurer en T1 ; repli : une base par fichier + transactions annulées (`BEGIN`/`ROLLBACK`) autour de chaque test |
| Un module importe un export Next non bouchonné | Moyen | `grep "from \"next/"` dans `lib/` en T1 ; bouchons complets dès le départ |
| Rate-limit de connexion en mémoire de processus partagé entre tests | Faible | Un fichier `auth.test.ts` = un processus ; IP différente par test via le bouchon `headers()` |
| `next build` E2E lent (~1-2 min) | Faible | Accepté ; `reuseExistingServer` en local |
| Seuils de couverture trop hauts pour certains modules (ex. `auth.ts` dépend de cookies) | Moyen | Mesurer au checkpoint B ; changer un seuil = demander d'abord (spec) |
| Le code a un vrai bug (ex. stock négatif) | — | C'est le but : `it.fails` + signalement, pas de correction |

## Hors périmètre

Tests de composants React, CI, correction de bugs, modifications de `lib/`,
`app/` ou `components/`.
