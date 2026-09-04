# 🏨 Teranga Palace — Plateforme de réservation hôtelière

Site de réservation d'hôtels (façon Booking.com / Airbnb) développé en **HTML / CSS / JavaScript**, connecté à **Supabase** (base de données + authentification), hébergé sur **GitHub Pages**.

Ce projet a été réalisé dans le cadre du module UML (Licence 2, SUP'INFO Dakar), en prolongement de l'analyse et de la modélisation UML du système de gestion de l'hôtel Teranga Palace. Le modèle de données (entités Client, Chambre, Réservation, Séjour, Facture, Paiement identifiées dans le diagramme de classes) a été repris et implémenté sous forme de base de données relationnelle, puis étendu (Pays, Villes, Hôtels, Avis) pour proposer un vrai site multi-destinations.

**Dépôt GitHub :** https://github.com/Maina-Saliou/teranga-palace

---

## 📁 Structure du projet

```
teranga-palace/
├── index.html          → Page d'accueil (hero, recherche, destinations, hôtels vedettes)
├── hotels.html         → Résultats de recherche + filtres
├── hotel.html           → Fiche hôtel (galerie, carte, chambres, avis, moteur de réservation)
├── auth.html            → Connexion / inscription
├── account.html         → Espace client (réservations, historique, factures PDF, profil)
├── admin.html           → Tableau de bord admin (hôtels, chambres, réservations, revenus)
├── css/style.css        → Design system (charte or / ébène / émeraude)
├── js/
│   ├── config.js          → Configuration Supabase
│   ├── supabaseClient.js  → Initialisation + helpers partagés
│   ├── demoData.js, dataLayer.js → Données de démonstration et couche d'accès aux données
│   ├── nav.js, main.js, hotels.js, hotel-detail.js, auth.js, account.js, admin.js
└── supabase/
    ├── schema.sql         → Toutes les tables + sécurité (RLS)
    └── seed.sql           → Données de démonstration (6 pays, 13 hôtels, chambres)
```

---

## 🗄️ Modèle de données (Supabase / PostgreSQL)

Le schéma reprend directement les entités et cardinalités du diagramme de classes UML (Client 1—0..* Réservation, Chambre 1—0..* Réservation, Réservation 1—0..1 Séjour, Séjour 1—1 Facture, Facture 1—1..* Paiement).

| Table | Rôle |
|---|---|
| `utilisateurs` | Profil client/staff, lié à l'authentification Supabase |
| `pays`, `villes` | Référentiel géographique des destinations |
| `hotels` | Fiche hôtel : services, photos, étoiles, position GPS |
| `chambres` | Types de chambres, prix, capacité |
| `reservations` | Réservation : dates, personnes, prix — empêche les doubles réservations via une contrainte d'exclusion PostgreSQL |
| `sejours` | Suivi arrivée/départ réel |
| `factures` | Facture générée à la réservation |
| `paiements` | Paiements liés à une facture (carte, Mobile Money…) |
| `avis` | Avis clients par hôtel |

La sécurité **Row Level Security (RLS)** est activée sur toutes les tables : un client ne voit que ses propres réservations/factures, le catalogue (hôtels, chambres) est public en lecture, et seuls les rôles `admin` / `gestionnaire` / `receptionniste` peuvent modifier le catalogue — ce qui correspond au package transversal « Sécurité » identifié dans l'analyse UML.

---

## ✨ Fonctionnalités

- Page d'accueil avec recherche (pays, ville, dates, voyageurs)
- Destinations avec nombre d'hôtels et prix "à partir de" calculés en direct
- Liste d'hôtels avec filtres (pays, ville, étoiles, services, budget)
- Fiche hôtel : galerie, description, services, **carte interactive de localisation**, chambres, avis clients
- Moteur de réservation avec calcul automatique du prix, des taxes et du total, et vérification de disponibilité (cas d'utilisation « Effectuer une réservation »)
- Compte client : réservations à venir, historique, annulation, facture PDF téléchargeable
- Authentification complète (inscription / connexion / déconnexion)
- Tableau de bord admin : gestion des hôtels et chambres, vue de toutes les réservations, revenus, statistiques (chambres les plus réservées)

## 🎨 Design

Charte visuelle "Teranga" : ébène `#14120F`, ivoire `#F7F2E9`, or `#C89B4A`, émeraude `#0E3B36`, touche terracotta `#B5502E`. Typographie Fraunces (titres) + Manrope (texte). Un liseré géométrique inspiré des tissus wax sénégalais sert de signature visuelle entre les sections.

## 🔧 Mise en route

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter `supabase/schema.sql` puis `supabase/seed.sql` dans l'éditeur SQL du projet
3. Renseigner `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans `js/config.js`
4. Ouvrir le site, créer un compte, puis passer son rôle à `admin` dans la table `utilisateurs` pour accéder au tableau de bord

## 🔜 Pistes d'évolution

En cohérence avec les axes d'amélioration dégagés lors de l'analyse (section « Réflexion et amélioration ») :
- Application mobile (PWA, le site étant déjà responsive)
- Paiement en ligne réel (Stripe / CinetPay pour le Mobile Money)
- Module de fidélisation client
- Assistant virtuel (chatbot) pour les demandes fréquentes