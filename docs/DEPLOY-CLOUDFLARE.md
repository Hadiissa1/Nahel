# Mise en ligne sur Cloudflare

Nahel tourne sur **Cloudflare Workers** grâce à l'adaptateur
[OpenNext](https://opennext.js.org/cloudflare). Tout est chez Cloudflare :

| Quoi | Service Cloudflare | Nom | Réglé dans |
|---|---|---|---|
| Le site (pages, admin, caisse) | Workers | `nahel` | `wrangler.jsonc` → `name` |
| Les données (produits, commandes, finances…) | D1 (base de données) | `nahel-db` | `wrangler.jsonc` → `d1_databases` |
| Les photos et les PDF d'analyse | R2 (fichiers) | `nahel-files` | `wrangler.jsonc` → `r2_buckets` |
| Redimensionnement des photos | Images | — | `wrangler.jsonc` → `images` |
| Cache des pages | R2 + D1 (mêmes espaces) | — | `open-next.config.ts` |

La base D1 et l'espace R2 existent déjà (créés le 10/10/2026). Les tables sont
créées **toutes seules** au premier passage du site (voir `lib/db.ts`), et les
produits de départ, les zones de livraison et les 3 articles sont ajoutés une
seule fois.

En local (`npm run dev`, tests), le même code utilise un fichier SQLite et le
dossier `DATA_DIR` : rien à configurer.

## Ce qu'il faut une seule fois

1. **Une clé API Cloudflare** (My Profile → API Tokens → modèle « Edit
   Cloudflare Workers », plus `D1 : Edit`), rangée dans l'environnement sous
   `CLOUDFLARE_API_TOKEN`, avec `CLOUDFLARE_ACCOUNT_ID`.
2. **Le mot de passe du gérant** comme secret Cloudflare (jamais dans le code) :

   ```bash
   npx wrangler secret put ADMIN_PASSWORD      # au moins 12 caractères
   ```

3. Pour les e-mails (facultatif) : `npx wrangler secret put BREVO_API_KEY`, et
   `MAIL_FROM_EMAIL` dans `vars` de `wrangler.jsonc`.

## Mettre en ligne (et à chaque mise à jour)

```bash
SITE_URL=https://nahel.<votre-sous-domaine>.workers.dev npm run cf:deploy
```

- `SITE_URL` = l'adresse publique du site. Elle sert aux liens des e-mails, aux
  aperçus de partage et au plan du site Google. Au tout premier déploiement,
  Wrangler affiche l'adresse `…workers.dev` : refaire alors le déploiement avec
  cette adresse (ou votre nom de domaine).
- Mettre aussi `SITE_URL` dans `vars` de `wrangler.jsonc`, pour que le site la
  connaisse pendant qu'il tourne.

Tester d'abord sur l'ordinateur, dans le même moteur que Cloudflare :

```bash
npm run cf:preview     # http://localhost:8787 (base et fichiers locaux, dans .wrangler/)
```

## Nom de domaine (facultatif)

Dans le tableau de bord Cloudflare : **Workers & Pages → nahel → Settings →
Domains & Routes → Add → Custom domain** (par exemple `nahel.com`). Le HTTPS est
automatique. Mettre ensuite `SITE_URL=https://nahel.com` et redéployer.

## Sauvegardes

- **D1** garde automatiquement un historique (« Time Travel » : 7 jours en plan
  gratuit, 30 jours en plan payant) : on peut revenir à n'importe quelle minute
  avec `npx wrangler d1 time-travel restore nahel-db --timestamp=…`.
- Copie complète de la base dans un fichier :
  `npx wrangler d1 export nahel-db --remote --output=nahel-backup.sql`.
- **R2** : les photos ne sont jamais modifiées (un nouveau fichier à chaque
  envoi) ; une copie peut être faite avec `rclone` si besoin.

## Coûts

- **Plan Workers gratuit** : 100 000 pages par jour, mais seulement 10 ms de
  calcul par page. Assez pour essayer ; certaines pages (finances, caisse)
  peuvent dépasser et afficher « Error 1102 ».
- **Plan Workers Paid (5 $/mois)** : recommandé pour ouvrir la boutique.
- D1, R2 et Images restent gratuits aux volumes d'une boutique de miel
  (R2 : 10 Go ; Images : 5 000 photos redimensionnées par mois).

## Deux réglages propres à Cloudflare (à connaître)

- **Pas de « Cache Components »** (`cacheComponents` dans `next.config.ts`) : avec
  Next.js 16.4, cette option bloque les pages sur Workers (« Worker's code had
  hung »). La correction est en cours chez OpenNext
  ([opennextjs-cloudflare#1318](https://github.com/opennextjs/opennextjs-cloudflare/pull/1318)).
  En attendant, les données de la boutique sont mises en cache avec
  `unstable_cache` (`lib/cache.ts`) : même résultat pour les visiteurs (pages en
  cache, mises à jour à la minute ou aussitôt après une modification dans l'admin).
- **Correctif de l'adaptateur** (`patches/@opennextjs+cloudflare+1.20.10.patch`,
  appliqué tout seul par `npm install`) : il embarque `preview-props.json`, un
  fichier de Next.js 16.4 que l'adaptateur oubliait (erreur « Unexpected
  loadManifest »). À retirer quand une version corrigée sortira.

## Ce qui a été vérifié dans le moteur Cloudflare (local)

`npm run cf:preview`, base D1 et fichiers R2 locaux :
- toutes les pages répondent (boutique, produits, articles, lots, admin, plan du site) ;
- parcours de commande complet (panier → commande → confirmation par le gérant →
  stock retiré, annulation, codes promo, tentatives de fraude refusées) ;
- test de sécurité : tout passe ; 50 visiteurs en même temps pendant 15 s :
  2 392 pages, aucune erreur, médiane 0,3 s.

## Différences avec un serveur classique

- **Photos** : redimensionnées par Cloudflare Images. Si le service n'est pas
  disponible, la photo est gardée telle que le téléphone l'a envoyée (déjà
  réduite et sans données GPS, l'admin le fait dans le navigateur).
- **Limites anti-spam** (commandes, avis, abonnements, connexion) : comptées
  dans la base D1, donc communes à tous les serveurs Cloudflare. L'adresse IP
  vient de `CF-Connecting-IP` (posée par Cloudflare, impossible à falsifier) et
  n'est jamais enregistrée en clair.
- **Écritures en plusieurs étapes** (commande, confirmation, vente en caisse) :
  envoyées en un seul lot « tout ou rien » ; si le stock ou la commande a changé
  entre-temps, le lot est annulé et l'opération recommence avec les vrais
  chiffres (`guard()` dans `lib/db.ts`).
