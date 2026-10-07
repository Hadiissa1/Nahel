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
Navigateur ──▶ Site 100 % statique (Next.js, pré-rendu au build)
                 │  catalogue + filtres + recherche (côté navigateur)
                 │  panier (localStorage, validé contre le catalogue)
                 ▼
            Commande envoyée par WhatsApp (message pré-rempli)
            Paiement : espèces / carte / Whish Money, réglé avec le vendeur
```

- **Pas de serveur ni de base de données** : rien à pirater côté serveur, aucune donnée client stockée chez nous.
- **Pré-rendu statique** : chaque visiteur reçoit le même fichier HTML déjà prêt, servi depuis un CDN. C'est ce qui permet de tenir des milliers de visiteurs simultanés (voir `docs/SECURITY.md`).
- **Contenu** : `lib/data.ts` (produits, prix optionnels) et `lib/translations.ts` (textes anglais/arabe).

### Ce qui a été appliqué à partir de la recherche

1. **Recherche + filtres** par catégorie sur tout le catalogue.
2. **Variantes de poids** (250 g / 500 g / 1 kg) pour le miel, transmises dans le panier et le message WhatsApp.
3. **Bandeau de confiance** : origine directe apiculteur, miel cru, paiement flexible, commande WhatsApp.
4. **FAQ** : cristallisation, conservation, commande et livraison.
5. **Formulaire de contact réel** : il ouvre WhatsApp avec le message (avant, il affichait « merci » sans rien envoyer).

## 3. Étape suivante (quand vous voudrez payer en ligne)

Pour accepter le paiement par carte directement sur le site, il faudra ajouter :

1. Un **prestataire de paiement** (ex. Stripe, ou celui de votre banque au Liban / Whish Money Business) avec une page de paiement hébergée chez lui.
2. Une **API de commande** (route serveur Next.js) qui recalcule toujours le total côté serveur à partir des prix du catalogue. Ne jamais faire confiance au prix envoyé par le navigateur.
3. Une **base de données** (commandes, stock) et un **back-office**.
4. Les **prix** dans `lib/data.ts` (champ `price`).

Tant que la commande passe par WhatsApp, rien de cela n'est nécessaire, et le site reste très simple et très robuste.
