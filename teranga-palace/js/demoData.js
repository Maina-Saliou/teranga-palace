// ============================================================================
// DONNÉES DE DÉMONSTRATION
// Utilisées automatiquement tant que js/config.js n'a pas de vraies clés
// Supabase. Dès que Supabase est connecté et rempli via supabase/seed.sql,
// les vraies données prennent le relais sans qu'il faille toucher au code.
//
// Photos : IDs Unsplash fixes (pas de requête aléatoire) pour un rendu
// cohérent. Prix : chaque hôtel a un multiplicateur selon son standing et
// sa destination, donc les prix varient réellement d'un hôtel à l'autre.
// ============================================================================
(function () {
  const photo = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

  // ---------------- Pays ----------------
  const pays = [
    { id: "sn", nom: "Sénégal", code: "SN", drapeau_emoji: "🇸🇳", image_url: photo("1580746738099-1f4ee3730563") },
    { id: "ma", nom: "Maroc", code: "MA", drapeau_emoji: "🇲🇦", image_url: photo("1489749798305-4fea3ae63d43") },
    { id: "fr", nom: "France", code: "FR", drapeau_emoji: "🇫🇷", image_url: photo("1502602898657-3e91760cbb34") },
    { id: "tr", nom: "Turquie", code: "TR", drapeau_emoji: "🇹🇷", image_url: photo("1524231757912-21f4fe3a7200") },
    { id: "ae", nom: "Émirats Arabes Unis", code: "AE", drapeau_emoji: "🇦🇪", image_url: photo("1512453979798-5ea266f8880c") },
    { id: "es", nom: "Espagne", code: "ES", drapeau_emoji: "🇪🇸", image_url: photo("1583422409516-2895a77efded") },
  ];

  // ---------------- Villes (plusieurs par pays) ----------------
  const villes = [
    { id: "dakar", pays_id: "sn", nom: "Dakar", image_url: photo("1580746738099-1f4ee3730563") },
    { id: "saly", pays_id: "sn", nom: "Saly", image_url: photo("1519046904884-53103b34b206") },
    { id: "saint-louis", pays_id: "sn", nom: "Saint-Louis", image_url: photo("1580746738099-1f4ee3730563") },

    { id: "marrakech", pays_id: "ma", nom: "Marrakech", image_url: photo("1489749798305-4fea3ae63d43") },
    { id: "casablanca", pays_id: "ma", nom: "Casablanca", image_url: photo("1517821362941-13d5f668e8e2") },

    { id: "paris", pays_id: "fr", nom: "Paris", image_url: photo("1502602898657-3e91760cbb34") },
    { id: "nice", pays_id: "fr", nom: "Nice", image_url: photo("1502602898657-3e91760cbb34") },

    { id: "istanbul", pays_id: "tr", nom: "Istanbul", image_url: photo("1524231757912-21f4fe3a7200") },
    { id: "antalya", pays_id: "tr", nom: "Antalya", image_url: photo("1520250497591-112f2f40a3f4") },

    { id: "dubai", pays_id: "ae", nom: "Dubaï", image_url: photo("1512453979798-5ea266f8880c") },
    { id: "abu-dhabi", pays_id: "ae", nom: "Abu Dhabi", image_url: photo("1512453979798-5ea266f8880c") },

    { id: "barcelone", pays_id: "es", nom: "Barcelone", image_url: photo("1583422409516-2895a77efded") },
    { id: "madrid", pays_id: "es", nom: "Madrid", image_url: photo("1543783207-ec64e4d95325") },
  ];

  function ville(id) { return villes.find(v => v.id === id); }
  function paysOf(villeId) { return pays.find(p => p.id === ville(villeId).pays_id); }
  function withVille(villeId) {
    const v = ville(villeId);
    const p = paysOf(villeId);
    return { nom: v.nom, pays_id: p.id, pays: { nom: p.nom, drapeau_emoji: p.drapeau_emoji } };
  }

  // Photos de chambres réutilisées pour tous les hôtels (rendu cohérent)
  const ROOM_PHOTOS = {
    Simple: photo("1522771739844-6a9f6d5f14af"),
    Double: photo("1566073771259-6a8506099945"),
    Suite: photo("1590490360182-c33d57733427"),
    Deluxe: photo("1582719508461-905c673771fd"),
  };
  const GALLERY_EXTRA = [photo("1566073771259-6a8506099945"), photo("1590490360182-c33d57733427"), photo("1582719508461-905c673771fd")];

  // ---------------- Hôtels ----------------
  // "mult" ajuste le prix de base selon le standing de l'hôtel et le coût
  // de la destination : chaque hôtel a donc des tarifs différents.
  const hotels = [
    {
      id: "teranga-dakar", ville_id: "dakar", nom: "Teranga Palace Dakar", mult: 1.0,
      adresse: "Corniche Ouest, Dakar, Sénégal", latitude: 14.6928, longitude: -17.4749,
      description: "Le fleuron de l'hospitalité sénégalaise, face à l'océan Atlantique. Chambres raffinées, spa signature et gastronomie locale revisitée.",
      etoiles: 5, services: ["Piscine", "WiFi", "Restaurant", "Spa", "Salle de sport", "Parking"],
      photo_principale: photo("1571003123894-1f0594d2b5d9", 1600),
    },
    {
      id: "teranga-saly", ville_id: "saly", nom: "Teranga Resort Saly", mult: 0.75,
      adresse: "Route de la Petite Côte, Saly, Sénégal", latitude: 14.4531, longitude: -17.0092,
      description: "Un resort balnéaire les pieds dans le sable, entre piscine à débordement et cuisine créole.",
      etoiles: 4, services: ["Piscine", "WiFi", "Restaurant", "Parking"],
      photo_principale: photo("1520250497591-112f2f40a3f4", 1600),
    },
    {
      id: "teranga-saint-louis", ville_id: "saint-louis", nom: "Teranga Heritage Saint-Louis", mult: 0.65,
      adresse: "Île de Saint-Louis, Sénégal", latitude: 16.0179, longitude: -16.4896,
      description: "Maison coloniale restaurée sur l'île classée UNESCO, entre fleuve Sénégal et charme d'antan.",
      etoiles: 4, services: ["WiFi", "Restaurant", "Parking"],
      photo_principale: photo("1590523278191-995cbcda646b", 1600),
    },
    {
      id: "riad-marrakech", ville_id: "marrakech", nom: "Riad Al Bahja", mult: 0.85,
      adresse: "Médina, Marrakech, Maroc", latitude: 31.6295, longitude: -7.9811,
      description: "Riad traditionnel au cœur de la médina, patio andalou et hammam privatif.",
      etoiles: 5, services: ["WiFi", "Spa", "Restaurant"],
      photo_principale: photo("1489749798305-4fea3ae63d43", 1600),
    },
    {
      id: "atlantic-casablanca", ville_id: "casablanca", nom: "Hôtel Atlantic Casablanca", mult: 0.8,
      adresse: "Corniche Ain Diab, Casablanca, Maroc", latitude: 33.5952, longitude: -7.6604,
      description: "Adresse contemporaine face à l'Atlantique, à deux pas de la mosquée Hassan II.",
      etoiles: 4, services: ["Piscine", "WiFi", "Restaurant", "Parking"],
      photo_principale: photo("1517821362941-13d5f668e8e2", 1600),
    },
    {
      id: "lumiere-paris", ville_id: "paris", nom: "Hôtel Lumière Paris", mult: 1.6,
      adresse: "8e Arrondissement, Paris, France", latitude: 48.8721, longitude: 2.3055,
      description: "Élégance haussmannienne à deux pas des Champs-Élysées.",
      etoiles: 5, services: ["WiFi", "Restaurant", "Salle de sport", "Parking"],
      photo_principale: photo("1541343672885-9be56236302a", 1600),
    },
    {
      id: "riviera-nice", ville_id: "nice", nom: "Le Riviera Nice", mult: 1.3,
      adresse: "Promenade des Anglais, Nice, France", latitude: 43.6959, longitude: 7.2650,
      description: "Vue mer sur la Baie des Anges, esprit Belle Époque et terrasses ensoleillées.",
      etoiles: 4, services: ["WiFi", "Restaurant", "Spa"],
      photo_principale: photo("1502602898657-3e91760cbb34", 1600),
    },
    {
      id: "bosphore-istanbul", ville_id: "istanbul", nom: "Bosphore Palace", mult: 1.1,
      adresse: "Beyoğlu, Istanbul, Turquie", latitude: 41.0370, longitude: 28.9850,
      description: "Vue imprenable sur le Bosphore, hammam ottoman et rooftop panoramique.",
      etoiles: 5, services: ["Piscine", "WiFi", "Spa", "Restaurant"],
      photo_principale: photo("1524231757912-21f4fe3a7200", 1600),
    },
    {
      id: "anatolia-antalya", ville_id: "antalya", nom: "Anatolia Beach Resort", mult: 0.9,
      adresse: "Lara Beach, Antalya, Turquie", latitude: 36.8560, longitude: 30.7810,
      description: "Resort tout compris en bord de plage, idéal pour les familles.",
      etoiles: 4, services: ["Piscine", "WiFi", "Restaurant", "Salle de sport", "Parking"],
      photo_principale: photo("1520250497591-112f2f40a3f4", 1600),
    },
    {
      id: "burj-dubai", ville_id: "dubai", nom: "Burj Al Sable", mult: 2.2,
      adresse: "Jumeirah, Dubaï, EAU", latitude: 25.1412, longitude: 55.1852,
      description: "Tour signature, suites vue mer et plage privée.",
      etoiles: 5, services: ["Piscine", "WiFi", "Spa", "Restaurant", "Salle de sport", "Parking"],
      photo_principale: photo("1512453979798-5ea266f8880c", 1600),
    },
    {
      id: "sheikh-abudhabi", ville_id: "abu-dhabi", nom: "Sheikh Sable Palace", mult: 1.9,
      adresse: "Corniche, Abu Dhabi, EAU", latitude: 24.4764, longitude: 54.3705,
      description: "Palace inspiré de l'architecture émiratie traditionnelle, dômes dorés et jardins d'eau.",
      etoiles: 5, services: ["Piscine", "WiFi", "Spa", "Restaurant", "Parking"],
      photo_principale: photo("1512453979798-5ea266f8880c", 1600),
    },
    {
      id: "casa-barcelone", ville_id: "barcelone", nom: "Casa Barcelona Suites", mult: 1.3,
      adresse: "Eixample, Barcelone, Espagne", latitude: 41.3958, longitude: 2.1611,
      description: "Design catalan contemporain à deux pas de la Sagrada Família.",
      etoiles: 4, services: ["WiFi", "Restaurant", "Parking"],
      photo_principale: photo("1583422409516-2895a77efded", 1600),
    },
    {
      id: "palacio-madrid", ville_id: "madrid", nom: "Palacio Madrid", mult: 1.2,
      adresse: "Barrio de Salamanca, Madrid, Espagne", latitude: 40.4272, longitude: -3.6835,
      description: "Hôtel particulier du 19e siècle rénové, à quelques pas du Parc du Retiro.",
      etoiles: 4, services: ["WiFi", "Restaurant", "Salle de sport"],
      photo_principale: photo("1543783207-ec64e4d95325", 1600),
    },
  ];

  hotels.forEach(h => { h.villes = withVille(h.ville_id); h.actif = true; h.galerie_photos = GALLERY_EXTRA; });

  // ---------------- Chambres (prix ajustés par hôtel) ----------------
  const BASE_PRICES = { Simple: 40000, Double: 70000, Suite: 140000, Deluxe: 100000 };
  const ROOM_TYPES = [
    { suffix: "101", type: "Simple", adultes: 1, enfants: 0, description: "Chambre cosy, idéale pour un voyageur seul." },
    { suffix: "102", type: "Double", adultes: 2, enfants: 1, description: "Lit king size, balcon privé." },
    { suffix: "201", type: "Suite", adultes: 2, enfants: 2, description: "Salon séparé, vue panoramique." },
    { suffix: "202", type: "Deluxe", adultes: 2, enfants: 1, description: "Terrasse privative et baignoire îlot." },
  ];

  const round1000 = (n) => Math.round(n / 1000) * 1000;

  const chambres = [];
  hotels.forEach(h => {
    ROOM_TYPES.forEach(rt => {
      chambres.push({
        id: `${h.id}-${rt.suffix}`,
        hotel_id: h.id,
        numero: rt.suffix,
        type: rt.type,
        capacite_adultes: rt.adultes,
        capacite_enfants: rt.enfants,
        prix_nuit: round1000(BASE_PRICES[rt.type] * h.mult),
        description: rt.description,
        photos: [ROOM_PHOTOS[rt.type]],
        statut: "disponible",
      });
    });
  });

  // ---------------- Avis ----------------
  const avis = [
    { id: "a1", hotel_id: "teranga-dakar", note: 5, commentaire: "Accueil exceptionnel, vue sur mer à couper le souffle. La Teranga dans toute sa splendeur !", utilisateurs: { prenom: "Aïssatou", nom: "Diop" } },
    { id: "a2", hotel_id: "teranga-dakar", note: 4, commentaire: "Très bel hôtel, petit-déjeuner délicieux. Le spa mérite le détour.", utilisateurs: { prenom: "Moussa", nom: "Fall" } },
    { id: "a3", hotel_id: "riad-marrakech", note: 5, commentaire: "Un riad magique, on se sent transporté dans un autre temps.", utilisateurs: { prenom: "Camille", nom: "Laurent" } },
    { id: "a4", hotel_id: "burj-dubai", note: 5, commentaire: "Service impeccable, la plage privée est somptueuse.", utilisateurs: { prenom: "Yasmine", nom: "El Amrani" } },
    { id: "a5", hotel_id: "lumiere-paris", note: 4, commentaire: "Emplacement parfait, chambre un peu petite mais très élégante.", utilisateurs: { prenom: "Julien", nom: "Moreau" } },
    { id: "a6", hotel_id: "teranga-saly", note: 4, commentaire: "Parfait pour un séjour en famille, la piscine est superbe.", utilisateurs: { prenom: "Fatou", nom: "Ndiaye" } },
  ];

  window.DEMO = { pays, villes, hotels, chambres, avis };
})();