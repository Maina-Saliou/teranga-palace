-- ============================================================================
-- TERANGA PALACE — DONNÉES DE DÉMONSTRATION
-- À exécuter après schema.sql dans le SQL Editor de Supabase
-- ============================================================================

-- 1. PAYS
insert into public.pays (nom, code, drapeau_emoji, image_url) values
  ('Sénégal', 'SN', '🇸🇳', 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200'),
  ('Maroc',   'MA', '🇲🇦', 'https://images.unsplash.com/photo-1517821362941-13d5f668e8e2?w=1200'),
  ('France',  'FR', '🇫🇷', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200'),
  ('Turquie', 'TR', '🇹🇷', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200'),
  ('Émirats Arabes Unis', 'AE', '🇦🇪', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200'),
  ('Espagne', 'ES', '🇪🇸', 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1200')
on conflict (nom) do nothing;

-- 2. VILLES
insert into public.villes (pays_id, nom, image_url)
select id, 'Dakar', 'https://images.unsplash.com/photo-1580746738099-1f4ee3730563?w=1200' from public.pays where code = 'SN'
union all
select id, 'Saly', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200' from public.pays where code = 'SN'
union all
select id, 'Marrakech', 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200' from public.pays where code = 'MA'
union all
select id, 'Paris', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200' from public.pays where code = 'FR'
union all
select id, 'Istanbul', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200' from public.pays where code = 'TR'
union all
select id, 'Dubaï', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200' from public.pays where code = 'AE'
union all
select id, 'Barcelone', 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200' from public.pays where code = 'ES';

-- 3. HOTELS (dont le vaisseau amiral : Teranga Palace Dakar)
insert into public.hotels (ville_id, nom, adresse, description, etoiles, services, photo_principale, galerie_photos)
select v.id,
  'Teranga Palace Dakar',
  'Corniche Ouest, Dakar, Sénégal',
  'Le fleuron de l''hospitalité sénégalaise, face à l''océan Atlantique. Chambres raffinées, spa signature et gastronomie locale revisitée.',
  5,
  array['Piscine','WiFi','Restaurant','Spa','Salle de sport','Parking'],
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600',
  array[
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200'
  ]
from public.villes v where v.nom = 'Dakar';

insert into public.hotels (ville_id, nom, adresse, description, etoiles, services, photo_principale, galerie_photos)
select v.id, 'Teranga Resort Saly', 'Route de la Petite Côte, Saly, Sénégal',
  'Un resort balnéaire les pieds dans le sable, entre piscine à débordement et cuisine créole.', 4,
  array['Piscine','WiFi','Restaurant','Parking'],
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600',
  array['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200']
from public.villes v where v.nom = 'Saly';

insert into public.hotels (ville_id, nom, adresse, description, etoiles, services, photo_principale, galerie_photos)
select v.id, 'Riad Al Bahja', 'Médina, Marrakech, Maroc',
  'Riad traditionnel au cœur de la médina, patio andalou et hammam privatif.', 5,
  array['WiFi','Spa','Restaurant'],
  'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1600',
  array['https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200']
from public.villes v where v.nom = 'Marrakech';

insert into public.hotels (ville_id, nom, adresse, description, etoiles, services, photo_principale, galerie_photos)
select v.id, 'Hôtel Lumière Paris', '8e Arrondissement, Paris, France',
  'Élégance haussmannienne à deux pas des Champs-Élysées.', 5,
  array['WiFi','Restaurant','Salle de sport','Parking'],
  'https://images.unsplash.com/photo-1541343672885-9be56236302a?w=1600',
  array['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200']
from public.villes v where v.nom = 'Paris';

insert into public.hotels (ville_id, nom, adresse, description, etoiles, services, photo_principale, galerie_photos)
select v.id, 'Bosphore Palace', 'Beyoğlu, Istanbul, Turquie',
  'Vue imprenable sur le Bosphore, hammam ottoman et rooftop panoramique.', 5,
  array['Piscine','WiFi','Spa','Restaurant'],
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600',
  array['https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200']
from public.villes v where v.nom = 'Istanbul';

insert into public.hotels (ville_id, nom, adresse, description, etoiles, services, photo_principale, galerie_photos)
select v.id, 'Burj Al Sable', 'Jumeirah, Dubaï, EAU',
  'Tour signature, suites vue mer et plage privée.', 5,
  array['Piscine','WiFi','Spa','Restaurant','Salle de sport','Parking'],
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600',
  array['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200']
from public.villes v where v.nom = 'Dubaï';

insert into public.hotels (ville_id, nom, adresse, description, etoiles, services, photo_principale, galerie_photos)
select v.id, 'Casa Barcelona Suites', 'Eixample, Barcelone, Espagne',
  'Design catalan contemporain à deux pas de la Sagrada Família.', 4,
  array['WiFi','Restaurant','Parking'],
  'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600',
  array['https://images.unsplash.com/photo-1523592121529-f6dde35f079e?w=1200']
from public.villes v where v.nom = 'Barcelone';

-- 4. CHAMBRES (pour chaque hôtel, 4 types de chambres)
insert into public.chambres (hotel_id, numero, type, capacite_adultes, capacite_enfants, prix_nuit, description, photos)
select h.id, t.numero, t.type, t.adultes, t.enfants, t.prix, t.descr, array[t.photo]
from public.hotels h
cross join (values
  ('101', 'Simple',   1, 0, 45000,  'Chambre cosy avec vue jardin.',              'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200'),
  ('102', 'Double',   2, 1, 75000,  'Lit king size, balcon privé.',               'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200'),
  ('201', 'Suite',    2, 2, 150000, 'Salon séparé, vue panoramique.',             'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200'),
  ('202', 'Deluxe',   2, 1, 110000, 'Terrasse privative et baignoire îlot.',      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200')
) as t(numero, type, adultes, enfants, prix, descr, photo)
on conflict (hotel_id, numero) do nothing;
