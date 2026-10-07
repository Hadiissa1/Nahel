# Architecture d'une boutique de miel en ligne — et comment Nahel l'applique

## 1. Ce que font les boutiques européennes

Boutiques étudiées (recherche web) :

- **Heimathonig.de** (Allemagne) : environ 300 miels de différents apiculteurs, plus hydromel, pollen et miel en rayon.
- **Baltic Honey Shop** (UK/Lituanie) : miel cru d'apiculteurs artisanaux, non pasteurisé et non filtré.
- **Landwirt.com** : miels de ruchers de toute l'Europe, vendus en direct du producteur avec traçabilité.
- Matériel apicole : **Thomas Apiculture** (France, depuis 1905, 5 centres d'expertise), **Lyson** (Pologne), **Holtermann** (Allemagne), **La Tienda del Apicultor** (multi-pays).
- Traçabilité : numéro de lot sur chaque pot (Airborne), QR code menant aux analyses de laboratoire (Zealandia), certification d'origine (True Source, HoneyTrace).

Le schéma est presque toujours le même :

```
                ┌──────────────── Visiteur ────────────────┐
                │                                          │
        ┌───────▼────────┐                       ┌─────────▼─────────┐
        │  CDN (cache)   │  pages statiques,     │  Paiement externe │
        │  HTML/CSS/JS   │  images optimisées    │  (carte, wallet)  │
        └───────┬────────┘                       └─────────▲─────────┘
                │                                          │
   ┌────────────▼─────────────┐                 ┌──────────┴──────────┐
   │ 1. CATALOGUE              │                 │ 4. COMMANDE          │
   │  - catégories (miel /     │   ┌─────────┐   │  - checkout          │
   │    matériel / ruche)      │──▶│2. PANIER│──▶│  - livraison         │
   │  - filtres + recherche    │   └─────────┘   │  - mode de paiement  │
   │  - fiche produit :        │                 │  - confirmation      │
   │    variantes (250g/500g/  │                 └──────────┬──────────┘
   │    1kg), origine, goût    │                            │
   └────────────┬─────────────┘                 ┌──────────▼──────────┐
                │                               │ 5. BACK-OFFICE       │
   ┌────────────▼─────────────┐                 │  - stock, commandes  │
   │ 3. CONFIANCE              │                 │  - CMS (textes,      │
   │  - origine / apiculteur   │                 │    produits, prix)   │
   │  - lot, analyses          │                 └─────────────────────┘
   │  - livraison, paiement    │
   │  - avis clients, FAQ      │
   └──────────────────────────┘
```

| Bloc | Rôle | Pourquoi c'est important pour le miel |
|---|---|---|
| Catalogue + filtres | Trouver vite (type, origine, catégorie) | Beaucoup de variétés, le client cherche « Sidr » ou « Liban » |
| Variantes de poids | 250 g / 500 g / 1 kg | Standard dans toutes les boutiques de miel |
| Confiance | Origine, cru, lot, livraison | Le miel est un produit très fraudé : la preuve fait vendre |
| Panier | Regrouper les produits | Commandes multi-produits (miel + pollen + matériel) |
| Commande + paiement | Encaisser | Toujours via un prestataire externe, jamais les données de carte sur notre serveur |
| FAQ | Répondre avant la question | Cristallisation, conservation, livraison |
| Back-office | Gérer stock/prix | Indispensable dès qu'il y a des prix et du stock en ligne |

## 2. Comment Nahel fonctionne aujourd'hui

```
Visiteur ──▶ (CDN, cache 60 s) ──▶ Boutique Next.js : page pré-générée, rafraîchie chaque minute
                                      │  catalogue + filtres + recherche (dans le navigateur)
                                      │  panier (localStorage, vérifié contre catalogue et stock)
                                      ▼
                                 Commande enregistrée (n°, client) puis envoyée par WhatsApp
                                 Paiement : espèces / carte / Whish Money, réglé avec le vendeur

Gérant ──▶ /admin (mot de passe) ──▶ actions serveur ──▶ SQLite (DATA_DIR/nahel.db)
                                          │                photos (DATA_DIR/uploads, WebP)
                                          └──▶ invalide le cache : la boutique se met à jour
```

- **Base de données SQLite** (intégrée à Node, rien à installer) : produits, tailles (prix, stock), sessions
  d'administration. Les photos sont des fichiers WebP à côté de la base.
- **Espace de gestion** (`/admin`) : ajouter, modifier, masquer, supprimer des produits ; prix et stock
  par taille ; photo par appareil photo ou galerie. Détails de sécurité : `docs/SECURITY.md`.
- **Boutique pré-générée** : tous les visiteurs reçoivent la même page déjà prête, gardée en cache
  (60 s par un CDN). Une modification dans l'admin vide le cache aussitôt.
- **Commandes** : enregistrées dans la base (statut nouveau → confirmé → livré, ou annulé) ;
  le stock baisse à la confirmation et revient en cas d'annulation. Données clients visibles dans l'admin seulement.
- **Contenu** : produits dans la base (gérés dans `/admin`), textes dans `lib/translations.ts`.
  `lib/data.ts` ne sert qu'au premier démarrage, pour remplir la base.

### Ce qui a été appliqué à partir de la recherche

1. **Recherche + filtres** par catégorie sur tout le catalogue.
2. **Tailles** (250 g / 500 g / 1 kg…) avec leur propre prix et stock, transmises dans le panier et le message WhatsApp.
3. **Bandeau de confiance** : origine directe apiculteur, miel cru, paiement flexible, commande WhatsApp.
4. **FAQ** : cristallisation, conservation, commande et livraison.
5. **Formulaire de contact réel** : il ouvre WhatsApp avec le message (avant, il affichait « merci » sans rien envoyer).

## 3. Étape suivante (quand vous voudrez payer en ligne)

Pour accepter le paiement par carte directement sur le site, il faudra ajouter :

1. Un **prestataire de paiement** (ex. Stripe, ou celui de votre banque au Liban / Whish Money Business) avec une page de paiement hébergée chez lui.
2. Une **API de commande** (route serveur Next.js) qui recalcule toujours le total côté serveur à partir des prix du catalogue. Ne jamais faire confiance au prix envoyé par le navigateur.
3. Relier le paiement aux **commandes** déjà enregistrées (le stock et le back-office existent déjà).

Tant que la commande passe par WhatsApp, rien de cela n'est nécessaire, et le site reste très simple et très robuste.
