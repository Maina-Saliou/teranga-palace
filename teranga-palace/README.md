# 🏨 Teranga Palace — Plateforme de réservation hôtelière

Site complet de réservation d'hôtels (façon Booking.com / Airbnb) en **HTML / CSS / JavaScript pur**, connecté à **Supabase** (base de données + authentification), prêt à héberger sur **GitHub Pages**.

Construit à partir de ton rapport UML : les tables reprennent exactement les entités identifiées (Client, Chambre, Réservation, Séjour, Facture, Paiement) enrichies de Pays / Villes / Hôtels / Avis pour un vrai site multi-destinations.

---

## 📁 Structure du projet

```
teranga-palace/
├── index.html          → Page d'accueil (hero, recherche, destinations, hôtels vedettes)
├── hotels.html          → Résultats de recherche + filtres
├── hotel.html            → Fiche hôtel (galerie, chambres, avis, moteur de réservation)
├── auth.html             → Connexion / inscription
├── account.html          → Espace client (réservations, historique, factures PDF, profil)
├── admin.html            → Tableau de bord admin (hôtels, chambres, réservations, revenus)
├── css/style.css         → Design system (charte or & blanc / ébène / émeraude)
├── js/
│   ├── config.js          → Clés Supabase à renseigner
│   ├── supabaseClient.js  → Initialisation + helpers partagés
│   ├── nav.js, main.js, hotels.js, hotel-detail.js, auth.js, account.js, admin.js
└── supabase/
    ├── schema.sql         → Toutes les tables + sécurité (RLS)
    └── seed.sql           → Données de démonstration (6 pays, 7 hôtels, chambres)
```

---

## 🚀 Mise en route (10 minutes)

### 1. Créer les tables dans Supabase

1. Va sur [supabase.com](https://supabase.com) → ton projet → **SQL Editor** → *New query*
2. Colle le contenu de `supabase/schema.sql` → **Run**
3. Fais de même avec `supabase/seed.sql` pour avoir des données de démo (hôtels au Sénégal, Maroc, France, Turquie, Dubaï, Espagne)

### 2. Connecter le site à ta base

Ouvre `js/config.js` et remplace les deux valeurs par celles de **Project Settings → API** dans Supabase :

```js
window.TERANGA_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIs...",
  TAX_RATE: 0.18
};
```

⚠️ La clé "anon" est publique par design (elle est protégée par les règles de sécurité RLS déjà écrites dans `schema.sql`) — c'est la clé normale à utiliser côté site.

### 3. Créer ton premier compte admin

1. Ouvre le site → **Connexion** → **Inscription**, crée un compte normal
2. Dans Supabase → **Table Editor → utilisateurs**, trouve ta ligne et change la colonne `role` de `client` à `admin`
3. Reconnecte-toi : le lien **Admin** apparaît dans le menu, et `admin.html` devient accessible

### 4. Héberger sur GitHub Pages

```bash
git init
git add .
git commit -m "Teranga Palace — site complet"
git branch -M main
git remote add origin https://github.com/TON-PSEUDO/TON-DEPOT.git
git push -u origin main
```

Puis sur GitHub : **Settings → Pages → Branch: main → Save**. Le site sera en ligne à `https://ton-pseudo.github.io/ton-depot/` en 1-2 minutes.

---

## 🗄️ Modèle de données (Supabase / PostgreSQL)

| Table | Rôle |
|---|---|
| `utilisateurs` | Profil client/staff, lié à l'authentification Supabase |
| `pays`, `villes` | Référentiel géographique des destinations |
| `hotels` | Fiche hôtel : services, photos, étoiles |
| `chambres` | Types de chambres, prix, capacité |
| `reservations` | Réservation : dates, personnes, prix — **empêche les doubles réservations** via une contrainte d'exclusion PostgreSQL |
| `sejours` | Suivi arrivée/départ réel |
| `factures` | Facture générée à la réservation |
| `paiements` | Paiements liés à une facture (carte, Mobile Money…) |
| `avis` | Avis clients par hôtel |

La sécurité **Row Level Security (RLS)** est activée sur toutes les tables : un client ne voit que ses propres réservations/factures, le catalogue (hôtels, chambres) est public en lecture, et seuls les rôles `admin` / `gestionnaire` / `receptionniste` peuvent modifier le catalogue.

---

## ✨ Fonctionnalités livrées

- Page d'accueil avec recherche (pays, ville, dates, voyageurs)
- 6 destinations avec nombre d'hôtels et prix "à partir de" calculés en direct
- Liste d'hôtels avec filtres (pays, étoiles, services, budget)
- Fiche hôtel : galerie, description, services, chambres, avis clients (+ dépôt d'avis)
- Moteur de réservation avec calcul automatique du prix, des taxes (18%) et du total
- Protection anti-double-réservation au niveau base de données
- Compte client : réservations à venir, historique, annulation, **facture PDF téléchargeable**
- Authentification complète (inscription / connexion / déconnexion)
- Tableau de bord admin : CRUD hôtels, ajout de chambres, vue de toutes les réservations, revenus par hôtel, chambres les plus réservées

## 🎨 Design

Charte "Teranga" : ébène `#14120F`, ivoire `#F7F2E9`, or `#C89B4A`, émeraude `#0E3B36`, touche terracotta `#B5502E`. Typographie Fraunces (display) + Manrope (texte). Un liseré géométrique inspiré des tissus wax sénégalais sert de signature visuelle entre les sections.

## 🔜 Pistes d'évolution (issues de ton rapport UML, section 10)

- Application mobile (le site est déjà 100% responsive, une PWA est un bon premier pas)
- Paiement en ligne réel (Stripe / CinetPay pour le Mobile Money)
- Module de fidélité
- Chatbot d'assistance
