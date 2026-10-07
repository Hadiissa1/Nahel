# Sécurité et tenue en charge — Nahel

## 1. Mesures de sécurité en place

### Boutique (visiteurs)

| Risque | Protection | Où |
|---|---|---|
| Vol de données clients | Aucun compte client ni paiement en ligne. Les seules données clients (commandes, abonnés) sont réservées à l'admin. | architecture |
| Injection de script (XSS) | React échappe tout le texte affiché. En-tête **Content-Security-Policy** : seuls nos propres scripts s'exécutent, et les images ne viennent que du site lui-même. | `next.config.ts` |
| Panier falsifié | Le panier ne stocke que `{produit, taille, quantité}`. Chaque ligne est vérifiée contre le catalogue **et le stock** en direct : produit ou taille inconnus, rupture de stock ou donnée corrompue, la ligne est supprimée. La quantité ne dépasse jamais le stock (ni 99). Noms et prix viennent **toujours** du catalogue. | `components/CartProvider.tsx` |
| Site affiché dans une iframe pirate (clickjacking) | `X-Frame-Options: DENY` + `frame-ancestors 'none'` | `next.config.ts` |
| Rétrogradation vers HTTP | `Strict-Transport-Security` (HSTS, 2 ans) | `next.config.ts` |
| Fuite d'informations | `poweredByHeader: false`, `Referrer-Policy` stricte | `next.config.ts` |
| Saisie abusive dans le formulaire de contact | Longueurs limitées, format du téléphone vérifié | `components/Contact.tsx` |

### Espace de gestion (`/admin`)

| Risque | Protection | Où |
|---|---|---|
| Accès sans autorisation | Mot de passe défini **sur le serveur** (`ADMIN_PASSWORD`, 12 caractères minimum), jamais dans le code. **Chaque page et chaque action** vérifie la session côté serveur, pas seulement l'affichage. | `lib/auth.ts`, `app/admin/actions.ts` |
| Vol de session | Jeton aléatoire de 256 bits dans un cookie `HttpOnly` (illisible par un script), `Secure` (HTTPS seulement) et `SameSite=Strict`. La base ne garde que son empreinte SHA-256. Session de 12 h. **La déconnexion supprime la session sur le serveur** : un cookie copié ne marche plus. | `lib/auth.ts` |
| Devinette du mot de passe | Comparaison en temps constant ; 5 essais ratés par adresse IP = blocage 15 min ; plafond global de 100 échecs / 15 min ; 0,4 s de délai à chaque échec. | `lib/auth.ts` |
| Requête forgée depuis un autre site (CSRF) | Next.js refuse les actions dont l'origine n'est pas le site, et le cookie `SameSite=Strict` n'est jamais envoyé depuis un autre site. | Next.js + `lib/auth.ts` |
| Données invalides ou piégées | Toutes les valeurs sont revérifiées sur le serveur : catégorie, longueurs, prix (format `12` ou `12.50`), stock (entier), tailles (10 max, pas de doublons). Caractères de contrôle supprimés. | `app/admin/actions.ts` |
| Faux fichier image / image piégée | Le serveur **décode et ré-encode** chaque photo (WebP). Un fichier qui n'est pas une vraie image est refusé. 4 Mo maximum, 50 mégapixels maximum. Le nom de fichier est aléatoire : aucune possibilité de choisir un chemin. | `lib/photo-store.ts` |
| Fuite de la position GPS de vos photos | Le ré-encodage **supprime toutes les métadonnées** (EXIF, GPS, modèle du téléphone). | `lib/photo-store.ts` |
| Lecture de fichiers du serveur via l'adresse des photos | Seuls les noms au format exact `<uuid>-800.webp` / `-1600.webp` sont servis ; tout le reste répond 404. | `app/media/[file]/route.ts` |
| Pages admin dans Google ou en cache | `noindex`, et `Cache-Control: private, no-store`. | `app/admin/layout.tsx` |

### Commandes

| Risque | Protection | Où |
|---|---|---|
| Prix modifié par le client | Le navigateur n'envoie que `{produit, taille, quantité}`. Noms et **prix viennent de la base**, au moment de la commande (testé : un faux prix est ignoré). | `lib/orders.ts` |
| Commander plus que le stock / un produit masqué | Chaque ligne est revérifiée côté serveur : produit visible, taille existante, quantité ≤ stock (sinon refus détaillé). | `lib/orders.ts` |
| Fausses commandes pour vider le stock | Passer commande **ne touche pas au stock** : il baisse seulement quand **vous confirmez**. 10 commandes / heure par IP, 300 / heure au total ; champ piège anti-robots. | `app/orders/actions.ts` |
| Stock décompté deux fois | Confirmer / annuler se fait dans une transaction, avec un indicateur « stock déjà appliqué » : le stock ne bouge qu'une fois par commande (testé). Confirmation « tout ou rien » si un produit manque. | `lib/orders.ts` |
| Code injecté dans un nom ou une adresse | Affiché comme du texte (testé avec `<img onerror=…>`). Longueurs limitées, caractères de contrôle supprimés. | `app/orders/actions.ts` |
| Données clients (nom, téléphone, adresse) | Visibles **uniquement** dans l'admin (page et actions vérifiées côté serveur ; testé après déconnexion). | `app/admin/orders/` |

### Abonnements aux offres (e-mail / WhatsApp)

| Risque | Protection | Où |
|---|---|---|
| Inscrire l'adresse de quelqu'un d'autre | **Double confirmation** : aucun e-mail promotionnel avant que la personne clique sur le lien reçu. | `lib/subscribers.ts` |
| Spam de confirmations vers une victime | Au plus 1 e-mail de confirmation toutes les 10 min par abonné ; 10 inscriptions / heure par IP, 300 / heure au total ; champ piège invisible contre les robots. | `app/offers/actions.ts` |
| Savoir si quelqu'un est client | Réponse identique que l'adresse soit nouvelle ou déjà inscrite. | `lib/subscribers.ts` |
| Liens piégés dans les e-mails | Les liens sont construits avec `SITE_URL` (réglage serveur), **jamais** avec l'en-tête `Host` de la requête, falsifiable. | `lib/mail.ts` |
| Confirmation ou désinscription par un robot de messagerie | Ouvrir le lien ne fait rien : il faut **cliquer sur le bouton** (requête POST). Jetons aléatoires de 192 bits, jamais envoyés à la page d'administration. | `app/offers/` |
| Désinscription impossible | Lien dans chaque e-mail + en-têtes `List-Unsubscribe` (désinscription en un clic depuis Gmail, Apple Mail…) + « توقف / STOP » sur WhatsApp. **Se désinscrire supprime la personne.** | `lib/subscribers.ts` |
| Code injecté dans un e-mail | Le texte de la promotion est échappé (`<script>` devient du texte). | `lib/mail.ts` |
| Formule piégée dans l'export Excel | Les cellules commençant par `=`, `+`, `-`, `@` sont neutralisées. | `app/admin/subscribers/export/route.ts` |
| Données personnelles exposées | Liste, export et envoi réservés à l'administrateur (vérifié côté serveur, testé : export refusé sans connexion). | `app/admin/` |

**Dépendances :** `npm audit --omit=dev` = **0 vulnérabilité** dans ce qui tourne en production
(les alertes restantes concernent seulement l'outil ESLint du développeur).

### Tests automatiques (vrai navigateur Chromium, serveur de production)

**Espace de gestion : 27 vérifications, toutes réussies.** Dont :
- accès à `/admin` sans connexion → renvoyé vers la connexion ; mauvais mot de passe refusé ;
- ajout d'un produit avec photo, deux tailles, prix et stock → visible **immédiatement** dans la boutique ;
- photo stockée en 1600 px et 800 px, **sans aucune métadonnée GPS** (la photo de test en contenait) ;
- faux fichier image refusé ; nom vide refusé ;
- taille en rupture de stock non sélectionnable ; panier bloqué au stock disponible ;
- modification rapide du stock, masquer, modifier, retirer la photo (fichiers supprimés du disque), supprimer ;
- **une vraie requête d'administration rejouée après déconnexion ne change rien** dans la base ;
- l'ancien cookie ne fonctionne plus après déconnexion ;
- blocage après plusieurs mauvais mots de passe, y compris pour le bon mot de passe pendant le blocage.

**Commandes : 29 vérifications, toutes réussies** (passage de commande, validation, prix falsifié ignoré, quantité au-delà du stock refusée, confirmation qui retire le stock, refus si stock insuffisant, double confirmation sans effet, annulation qui remet le stock, livraison, accès admin seulement, limite anti-abus).

**Promotions : 40 vérifications, toutes réussies.**

**Boutique : 14 + 16 vérifications, toutes réussies** (catalogue, filtres, recherche anglais/arabe,
tailles, panier, WhatsApp, panier falsifié, vue produit, arabe RTL, mobile). Aucune erreur console
ni blocage CSP.

## 2. Résultats des tests de charge

Machine de test : 4 processeurs, 16 Go. L'outil de charge tourne **sur la même machine** et lui prend
du processeur, donc les chiffres sont pessimistes. **Aucun CDN** devant le serveur : c'est le pire cas.

Avec la base de données (version actuelle, 1 processus) :

| Scénario | Pages servies | Erreurs | Abandonnées (>10 s) | Temps médian | Pire temps |
|---|---|---|---|---|---|
| **1 000 visiteurs arrivent au même instant** | 1 000 / 1 000 | 0 | 0 | 1,8 s | 3,2 s |
| Idem, page compressée (comme un vrai navigateur) | 1 000 / 1 000 | 0 | 0 | 3,5 s | 3,7 s |
| Extrême : 1 000 connexions qui rechargent sans pause pendant 30 s | 11 172 (≈ 370 pages/s) | 0 | 12 | 2,5 s | 7,8 s |

**À retenir :**
- **1 000 visiteurs simultanés : tout le monde est servi, aucune erreur.**
- La page pèse 162 Ko, mais seulement **18 Ko compressée** : c'est ce que télécharge un visiteur.
  Elle contient tout le catalogue, d'où la recherche et le panier instantanés, sans aller-retour au serveur.
- Le serveur compresse chaque page lui-même, ce qui limite le débit. **Avec un CDN, ce travail disparaît** :
  la page est envoyée avec `Cache-Control: s-maxage=60`, donc le CDN la garde 60 s
  et le serveur ne la refabrique qu'environ une fois par minute, quel que soit le nombre de visiteurs.
- Les tests précédents (sans base de données) montraient que 3 processus multiplient la capacité par 2,5.

## 3. Mise en ligne recommandée

La base de données (`nahel.db`) et les photos sont des **fichiers sur le disque** (`DATA_DIR`).
Il faut donc un hébergement avec **disque permanent** :

- **Un petit serveur (VPS)** chez Hetzner, OVH, DigitalOcean… avec Node 22, ou
- **Railway / Render / Fly.io** avec un **volume persistant** monté sur `DATA_DIR`.

⚠️ **Vercel « standard » ne convient plus** : son disque est effacé à chaque déploiement, ce qui ferait
perdre les produits et les photos.

Dans tous les cas :
1. Mettre **Cloudflare** (gratuit) devant le site : HTTPS automatique et cache des pages de la boutique.
2. Définir `ADMIN_PASSWORD` (long, unique) et `DATA_DIR` dans les réglages de l'hébergeur.
3. **Sauvegarder `DATA_DIR`** régulièrement (base + photos), par exemple une copie chaque nuit.
4. Toujours servir le site en **HTTPS** : le cookie d'administration ne fonctionne qu'en HTTPS
   (sauf en test sur `localhost`).

## 4. Avant la mise en ligne (à faire par vous)

1. Remplacer le numéro WhatsApp de démonstration dans `lib/config.ts`.
2. Remplacer les liens réseaux sociaux (`href="#"`) dans `components/Footer.tsx`.
3. Choisir un `ADMIN_PASSWORD` long et ne le donner à personne.
4. Si vous ajoutez un jour le paiement en ligne : le total doit être recalculé **côté serveur**
   à partir du catalogue, et la page de paiement doit être celle du prestataire
   (voir `docs/ARCHITECTURE.md`).
