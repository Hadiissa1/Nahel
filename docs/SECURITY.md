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

### Caisse, finances et visiteurs

| Risque | Protection | Où |
|---|---|---|
| Prix ou remise trafiqués à la caisse | Le navigateur n'envoie que produits, quantités et remise demandée ; prix (soldes compris) et total recalculés par le serveur, remise bornée (≤ 100 % et ≤ total). Stock vérifié tout ou rien (testé). | `lib/orders.ts` |
| Employé qui consulte les finances | Onglet Finances et export CSV réservés au propriétaire (testé : redirection et 401). La caisse est ouverte aux employés, avec leur nom sur chaque vente. | `app/admin/finance/` |
| Formule piégée dans l'export | Cellules commençant par `=`, `+`, `-`, `@` neutralisées. | `app/admin/finance/export/route.ts` |
| Vie privée des visiteurs | Aucun cookie, aucune adresse IP enregistrée : empreinte hachée avec un secret du jour, effacé le lendemain ; numéros de lot non enregistrés ; robots, admin et « Do Not Track / GPC » ignorés (testé). | `lib/analytics.ts` |
| Saturer la base avec le compteur | Comptes regroupés en mémoire et écrits toutes les 10 s ; 120 signaux / min par adresse au plus. | `lib/analytics.ts`, `app/api/visit/route.ts` |

### Comptes employés

| Risque | Protection | Où |
|---|---|---|
| Un employé accède à ce qui ne le concerne pas | **Tout est réservé au propriétaire par défaut** (`requireAdmin`) ; seuls commandes, stock et alertes de stock sont ouverts aux employés (`requireStaff`). Testé : 7 pages interdites, export des abonnés refusé (401), action du propriétaire rejouée avec une session employé sans effet. | `lib/auth.ts` |
| Mot de passe volé dans la base | Mots de passe des employés hachés avec scrypt et un sel unique par compte ; jamais stockés en clair (testé). | `lib/auth.ts` |
| Deviner un nom d'utilisateur | Même message et même durée de réponse que le nom existe ou non ; même limite d'essais que la connexion du propriétaire. | `lib/auth.ts` |
| Ancien employé encore connecté | Désactiver, changer le mot de passe ou supprimer le compte ferme ses sessions immédiatement ; chaque requête revérifie que le compte est actif (testé). | `lib/staff.ts`, `lib/auth.ts` |
| Qui a fait quoi | Le nom de l'employé est enregistré sur chaque changement de statut de commande. | `lib/orders.ts` |

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

### Soldes et codes promo

| Risque | Protection | Où |
|---|---|---|
| Remise inventée par le client | Le navigateur n'envoie que le **nom du code**. Le serveur relit le code dans la base au moment de la commande (actif, date, nombre d'utilisations, minimum) et **calcule lui-même** la remise (testé : un code mis en pause entre-temps est refusé). | `lib/orders.ts`, `lib/promo.ts` |
| Prix soldé falsifié | Le prix soldé vient de la base ; il doit être inférieur au prix normal (vérifié à l'enregistrement). | `app/admin/actions.ts` |
| Deviner des codes en essayant | 15 essais / 10 min par IP, 3000 / 10 min au total (testé). Un code en pause répond comme un code inexistant. | `app/orders/actions.ts` |
| Épuiser un code avec de fausses commandes | Une utilisation n'est comptée qu'à la **confirmation** de la commande par vous, et rendue en cas d'annulation (testé). | `lib/orders.ts` |
| Remise supérieure au panier | Pourcentage limité à 90 % ; un montant fixe ne dépasse jamais le total. | `lib/promo-types.ts` |
| Gestion des codes | Création, pause et suppression réservées à l'administrateur (vérifié côté serveur). | `app/admin/actions.ts` |

### Conseils (articles)

| Risque | Protection | Où |
|---|---|---|
| Code injecté dans un article | Le texte n'est jamais interprété comme du HTML : seuls les intertitres (`## `) et les listes (`- `) sont reconnus (testé avec `<script>` et `<img onerror>`) ; échappé dans les données Google. | `lib/article-types.ts`, `components/BlogViews.tsx` |
| Brouillon visible | Un brouillon n'est ni affiché, ni listé, ni dans le plan du site (testé). | `lib/articles.ts` |
| Photos | Même traitement que les photos produit (réencodage, sans GPS) ; supprimées avec l'article (testé). | `lib/photo-store.ts` |
| Gestion des articles | Réservée à l'administrateur (vérifié côté serveur). | `app/admin/actions.ts` |

### Traçabilité (lots et PDF)

| Risque | Protection | Où |
|---|---|---|
| Faux PDF (script ou autre fichier renommé) | Le contenu est vérifié (signature `%PDF-`), pas le nom du fichier ; 4 Mo au plus (testé avec un faux PDF). | `lib/doc-store.ts` |
| PDF piégé ouvert dans le site | Les PDF sont **téléchargés** (`Content-Disposition: attachment`) et s'ouvrent dans l'application PDF de l'appareil, jamais dans les pages du site ; `nosniff`. | `app/docs/[file]/route.ts` |
| Lire d'autres fichiers du serveur (`../nahel.db`) | Seuls les noms aléatoires générés par le serveur sont acceptés (testé : 404). | `lib/doc-store.ts` |
| Gestion des lots | Réservée à l'administrateur (vérifié côté serveur). Lots d'un produit masqué non affichés. | `app/admin/actions.ts`, `lib/lots.ts` |

### Avis clients

| Risque | Protection | Où |
|---|---|---|
| Faux avis, spam, insultes | **Rien n'est publié sans votre validation** ; 5 avis / heure par IP, 200 / heure au total (testé) ; champ piège anti-robots. | `app/reviews/actions.ts` |
| Code injecté dans un avis | Affiché comme du texte, dans la boutique comme dans l'admin (testé avec `<img onerror>` et `</script>`) ; échappé dans les données Google. | `components/ProductReviews.tsx`, page produit |
| Note truquée (0, 9…) ou avis sur un produit inexistant / masqué | Refusés par le serveur (testé). | `app/reviews/actions.ts`, `lib/reviews.ts` |
| Données personnelles | Seul le prénom saisi est publié ; aucune adresse ni téléphone demandés. | — |

### Alertes de retour en stock

| Risque | Protection | Où |
|---|---|---|
| Inscrire l'adresse de quelqu'un d'autre | Un seul message, une seule fois, puis l'adresse est supprimée. 20 alertes au plus par adresse ; 10 demandes / heure par IP, 500 / heure au total (testé) ; champ piège anti-robots. | `app/alerts/actions.ts`, `lib/stock-alerts.ts` |
| Alerte sur un produit masqué, en stock ou inventé | Refusée par le serveur (testé). | `lib/stock-alerts.ts` |
| Savoir si quelqu'un a déjà demandé une alerte | Même réponse dans tous les cas. | `lib/stock-alerts.ts` |
| E-mail envoyé deux fois | Chaque alerte est « réservée » avant l'envoi, même avec plusieurs processus ; supprimée après envoi (testé : pas de doublon). | `lib/stock-alerts.ts` |
| Données personnelles | Liste visible seulement dans l'admin ; supprimées après le message, ou avec le produit. | `app/admin/alerts/` |

### Livraison par zone

| Risque | Protection | Où |
|---|---|---|
| Frais de livraison modifiés par le client | Le navigateur n'envoie que l'**identifiant de la zone** ; le serveur relit la zone dans la base et calcule les frais lui-même (testé : des frais envoyés à la main sont ignorés). | `lib/orders.ts` |
| Zone désactivée ou inventée | Refusée à la commande (testé). | `lib/orders.ts` |
| Gestion des zones | Réservée à l'administrateur (vérifié côté serveur). Supprimer une zone ne change pas les anciennes commandes (nom gardé dans la commande). | `app/admin/actions.ts` |

### Pages produit et partage

| Risque | Protection | Où |
|---|---|---|
| Code injecté via un nom de produit dans les données Google (JSON-LD) | Les `<` sont échappés : un nom contenant `</script><script>…` reste du texte (testé). | `app/(shop)/product/[id]/page.tsx` |
| Produit masqué encore visible | Sa page répond « introuvable » et il sort du sitemap (testé). | `lib/products.ts` |
| Pages privées indexées par Google | `robots.txt` exclut `/admin`, `/offers/` et `/og/` ; l'admin n'est jamais dans le sitemap. | `app/robots.ts` |
| Liens de partage falsifiés | Adresses des aperçus et du sitemap construites avec `SITE_URL`, jamais avec l'en-tête `Host`. | `lib/site.ts` |
| Image de partage abusée | Générée seulement pour un produit visible, à partir de la photo déjà nettoyée (sans GPS), mise en cache 24 h. | `app/og/[id]/route.ts` |

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

**Soldes et codes promo : 45 vérifications, toutes réussies** (prix soldé refusé s'il n'est pas inférieur,
prix barré et badge, données Google au prix soldé, codes invalides refusés, minimum de commande,
calcul de la remise, message WhatsApp, code mis en pause pendant la commande, utilisations comptées
à la confirmation et rendues à l'annulation, limite d'essais, mobile en arabe).

**Caisse, finances et visiteurs : 31 vérifications, toutes réussies** (commande du site livrée avec ses dates,
ticket 2 × 18 $ + 8 $ − 10 % = 39,60 $, vente enregistrée et stock retiré, vente au-delà du stock refusée, badge Caisse
dans les commandes, ventes du jour 59,60 $, panier moyen, répartition site / caisse et par paiement, meilleures ventes,
remises, 2 visiteurs et 5 pages (robot, « Do Not Track » et admin ignorés), aucune IP enregistrée, dépenses et bénéfice,
hier / ce mois / dates au choix (heure de Beyrouth), export CSV, employé : caisse oui, finances non, arabe sur mobile).

**Comptes employés : 36 vérifications, toutes réussies** (création et validations, mot de passe haché, nom en double,
mauvais mot de passe / nom inconnu, onglets limités, 7 pages interdites, export refusé, pas de boutons de gestion,
stock modifiable, action rejouée sans effet, confirmation de commande avec le nom, suppression de commande interdite,
désactivation / changement de mot de passe / suppression qui déconnectent, ancien mot de passe refusé, arabe sur mobile).

**Alerte stock bas : 19 vérifications, toutes réussies** (réglages invalides refusés, adresse normalisée, pas d'e-mail
au-dessus du seuil, un seul e-mail au passage du seuil en arabe et en anglais avec le lien vers l'admin, pas de
répétition, nouvel e-mail après réassort, déclenché par la confirmation d'une commande et pas par la commande
elle-même, épuisé en premier, produit masqué ignoré, sans adresse : bandeau seulement, arabe sur mobile).

**Conseils : 26 vérifications, toutes réussies** (bloc sur l'accueil, lien du menu, page article avec intertitres
et listes, produits liés, données Google, adresse canonique, plan du site, article en arabe de droite à gauche
sur mobile, titre obligatoire, adresse créée depuis le titre anglais et nettoyée, adresse en double refusée,
photo, code injecté affiché comme du texte, article le plus récent en premier, brouillon invisible partout,
suppression avec les fichiers photo).

**Traçabilité : 27 vérifications, toutes réussies** (n° de lot invalide ou en double refusé, faux PDF refusé,
PDF stocké sous un nom aléatoire, QR code pointant vers la bonne page, lot actuel sur la page produit
et lot archivé absent, téléchargement du PDF, recherche « oak 2025 09 », lot inconnu, adresse malformée,
pages de lot non indexées, tentatives d'accès à d'autres fichiers refusées, remplacement et suppression
du PDF (fichier effacé), produit masqué, suppression, arabe sur mobile).

**Avis clients : 24 vérifications, toutes réussies** (étoiles obligatoires, texte trop court refusé, avis en attente
invisibles dans la page et les données Google, note et produit falsifiés refusés, validation dans l'admin,
moyenne 4,5 sur 2 avis, code injecté affiché comme du texte, données Google avec note, étoiles sur la carte,
masquer et supprimer, arabe sur mobile, limite anti-abus).

**Bouton WhatsApp flottant : 18 vérifications, toutes réussies** (anglais et arabe, coin bas droit / bas gauche,
message dans la langue du visiteur, nom du produit sur sa page, ouverture sûre dans un nouvel onglet,
reste en place au défilement, caché par le panier ouvert, absent de l'admin, mobile sans défilement horizontal).

**Alertes de retour en stock : 28 vérifications, toutes réussies** (taille épuisée sélectionnable mais
pas ajoutable, e-mail ou WhatsApp, contact invalide refusé, pas de doublon, page produit en arabe sur mobile,
alerte refusée pour une taille en stock ou un autre produit, liste d'attente, e-mails envoyés tout seuls
au réassort en anglais et en arabe, sans doublon, lien WhatsApp prêt, suppression avec le produit, limite anti-abus).

**Livraison : 32 vérifications, toutes réussies** (zones de départ, frais invalides refusés, zone ajoutée,
désactivée, supprimée, choix obligatoire, total avec frais, livraison gratuite à partir d'un montant,
message WhatsApp, zone inactive ou inventée refusée, frais falsifiés ignorés, sans zone = pas de question,
mobile en arabe).

**Pages produit : 29 vérifications, toutes réussies** (page en arabe puis en anglais, ajout au panier,
copie du lien, WhatsApp, aperçu de partage 1200×630 qui change avec la photo, prix et stock dans
les données Google, nom piégé échappé, sitemap, robots.txt, produit masqué → 404, mobile).

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

### Nouveau test (site complet : 11 étapes, base de données, 1 processus, sans CDN)

Visite réaliste : accueil, pages produit, conseils, vérification de lot, plan du site.
Chaque « personne » enchaîne les pages **sans aucune pause** (un vrai visiteur lit entre deux pages),
donc 100 connexions ici représentent bien plus de 100 vrais visiteurs.

| Scénario | Pages servies | Réussies | Erreurs | Temps médian | 99 % sous |
|---|---|---|---|---|---|
| **100 personnes en même temps, 30 s** | 22 255 (742 / s) | **100 %** | 0 | 0,12 s | 0,22 s |
| 500 personnes en même temps, 30 s | 25 527 (851 / s) | **100 %** | 0 | 0,52 s | 1,1 s |
| 1 000 personnes en même temps, 30 s | 23 247 | 96,6 % | 825 (dont 701 attentes > 20 s) | — | — |
| **100 commandes passées dans la même seconde** | 100 / 100 enregistrées en 0,55 s | **100 %** | 0 | 0,52 s | — |

- **Commandes simultanées** : 100 commandes → 100 numéros différents, 200 lignes de panier, base de données intacte
  (`PRAGMA integrity_check` = ok). SQLite en mode WAL + transactions : pas de commande perdue ni en double.
- **Anti-spam** : 15 commandes depuis la même adresse → 10 acceptées, 5 bloquées.
- **Un vrai visiteur pendant 500 connexions** : tout fonctionne (pages, panier, aucune erreur), mais lentement sur cette
  machine partagée avec l'outil de charge (accueil complet en ~15 s, page produit ~5 s).
- **Le site n'est jamais tombé** : après chaque test, il répond normalement.
- **Limite d'un seul processus** : environ 800 pages par seconde. Au-delà (1 000 connexions sans pause), une partie
  des demandes attend trop. Remèdes, dans l'ordre : **Cloudflare devant le site** (les pages portent
  `s-maxage=60`, le CDN répond à la place du serveur), puis plusieurs processus (voir §3).

### Test de sécurité (attaques simulées) : 23 vérifications, toutes réussies

En-têtes de protection (CSP, anti-iframe, HSTS, nosniff…), 13 pages d'admin sans connexion → page de connexion
sans aucune donnée, faux cookie de session refusé, 14 tentatives de lire des fichiers du serveur (`nahel.db`, `.env`,
`.git`, astuces `../`) → rien, 7 injections SQL / script dans les adresses → sans effet, base intacte,
envoi de 12 Mo refusé (limite 5 Mo) sans faire tomber le site, 5 mauvais mots de passe → connexion bloquée
(et chaque essai ralenti à ~0,4 s), même le bon mot de passe refusé pendant le blocage.

### Refaire ces tests vous-même (après la mise en ligne)

```bash
BASE_URL=https://votre-site.com npm run check:security   # lecture seule, ne change rien
BASE_URL=https://votre-site.com npm run check:load -- 100 30   # 100 personnes pendant 30 s
```

Lancez le test de charge depuis un autre ordinateur que le serveur, et plutôt la nuit.

## 3. Mise en ligne recommandée

La base de données (`nahel.db`) et les photos sont des **fichiers sur le disque** (`DATA_DIR`).
Il faut donc un hébergement avec **disque permanent** :

- **Un petit serveur (VPS)** chez Hetzner, OVH, DigitalOcean… avec Node 22, ou
- **Railway / Render / Fly.io** avec un **volume persistant** monté sur `DATA_DIR`.

⚠️ **Vercel « standard » ne convient plus** : son disque est effacé à chaque déploiement, ce qui ferait
perdre les produits et les photos.

Dans tous les cas :
1. Mettre **Cloudflare** (gratuit) devant le site : HTTPS automatique et cache des pages de la boutique.
2. Définir `ADMIN_PASSWORD` (long, unique), `DATA_DIR` et `SITE_URL` (adresse publique, en HTTPS)
   dans les réglages de l'hébergeur. `SITE_URL` doit aussi être présent **au moment du build**.
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
