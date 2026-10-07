# Sécurité et tenue en charge — Nahel

## 1. Mesures de sécurité en place

| Risque | Protection | Où |
|---|---|---|
| Vol de données clients | Aucune base de données ni compte : rien à voler côté serveur. La commande part par WhatsApp. | architecture |
| Injection de script (XSS) | React échappe tout le texte affiché. En-tête **Content-Security-Policy** : seuls nos propres scripts s'exécutent, et les images ne viennent que du site ou d'Unsplash. | `next.config.ts` |
| Panier falsifié | Le panier ne stocke que `{id, poids, quantité}`. Au chargement, chaque ligne est vérifiée contre le catalogue : produit inconnu, poids inexistant ou donnée corrompue, la ligne est supprimée. Quantité limitée de 1 à 99, 100 lignes au maximum. Noms et prix viennent **toujours** du catalogue. | `components/CartProvider.tsx` |
| Site affiché dans une iframe pirate (clickjacking) | `X-Frame-Options: DENY` + `frame-ancestors 'none'` | `next.config.ts` |
| Rétrogradation vers HTTP | `Strict-Transport-Security` (HSTS, 2 ans) | `next.config.ts` |
| Fuite d'informations | `poweredByHeader: false` (la technologie n'est pas annoncée), `Referrer-Policy` stricte | `next.config.ts` |
| Accès caméra/micro/position | `Permissions-Policy` les désactive | `next.config.ts` |
| Saisie abusive dans le formulaire | Longueurs limitées (nom 80, téléphone 30, message 1000), format du téléphone vérifié | `components/Contact.tsx` |
| Dépendances vulnérables | `npm audit --omit=dev` : **0 vulnérabilité** dans ce qui tourne en production. Les 5 alertes restantes concernent uniquement l'outil ESLint sur le poste du développeur. | `package.json` |

Tests automatiques effectués dans un vrai navigateur (Chromium) sur le serveur de production :
catalogue, filtres, recherche anglais/arabe, poids, panier, message WhatsApp, panier falsifié
(produit inexistant, quantité 1 000 000 000, nom contenant du code), mode arabe RTL et mobile.
**Tous réussis, aucune erreur console ni blocage CSP.**

## 2. Résultats des tests de charge

Machine de test : 4 processeurs, 16 Go. L'outil de charge (autocannon) tourne **sur la même machine**
et lui prend du processeur, donc les chiffres sont pessimistes. Aucun CDN devant le serveur.

| Scénario | Pages servies | Erreurs serveur | Requêtes abandonnées (>10 s) | Temps médian | Pire temps |
|---|---|---|---|---|---|
| **1 000 visiteurs arrivent au même instant** (1 serveur) | 1 000 / 1 000 | 0 | 0 | 1,1 s | 1,9 s |
| 3 000 visiteurs au même instant (1 serveur) | 3 000 / 3 000 | 0 | 0 | 3,3 s | 5,6 s |
| 3 000 visiteurs au même instant (**3 processus**) | 3 000 / 3 000 | 0 | 0 | 1,7 s | 2,5 s |
| Extrême : 1 000 connexions qui rechargent sans pause pendant 30 s (1 serveur) | 17 156 (≈ 570 pages/s) | 0 | 1 437 (8 %) | 0,85 s | 10 s |
| Extrême, **3 processus** | 40 522 (≈ 1 450 pages/s) | 0 | 928 (2 %) | 0,42 s | 9,8 s |

**À retenir :**

- Avec **1 000 visiteurs simultanés**, le site répond à tout le monde, sans aucune erreur.
- Le scénario « extrême » (1 000 personnes qui rechargent la page en continu sans pause)
  représente beaucoup plus de trafic que 1 000 vrais visiteurs : un vrai visiteur charge la page
  une fois, puis tout (filtres, recherche, panier) se passe dans son navigateur, sans requête au
  serveur. Même dans ce cas, aucune erreur serveur, mais des pages lentes. Ajouter des processus
  multiplie la capacité (×2,5 avec 3 processus).
- La page d'accueil est **pré-générée** (statique) et envoyée avec
  `Cache-Control: s-maxage=31536000`, ce qui permet à un CDN de la garder en cache.

## 3. Mise en ligne recommandée

Pour des milliers de visiteurs, **hébergez derrière un CDN** :

- **Vercel** (le plus simple pour Next.js) ou **Cloudflare** devant votre serveur.
  Le CDN sert la page depuis le cache, au plus près du visiteur, et le serveur n'est presque plus sollicité.
  C'est ce qui rend le site insensible aux pics de trafic.
- Toujours en **HTTPS** (fourni automatiquement par Vercel ou Cloudflare).
- Si vous hébergez vous-même : un processus par cœur de processeur
  (par ex. PM2 en mode cluster) derrière Nginx ou Cloudflare.

## 4. Avant la mise en ligne (à faire par vous)

1. Remplacer le numéro WhatsApp de démonstration dans `lib/config.ts`.
2. Remplacer les liens réseaux sociaux (`href="#"`) dans `components/Footer.tsx`.
3. Si vous ajoutez un jour le paiement en ligne : le total doit être recalculé **côté serveur**
   à partir du catalogue, et la page de paiement doit être celle du prestataire
   (voir `docs/ARCHITECTURE.md`, section 3).
