
window.DataLayer = (function () {
  const sb = () => window.supabaseClient;
  const ready = () => window.isSupabaseConfigured();

  async function getPays() {
    if (ready()) {
      const { data, error } = await sb().from("pays").select("*").order("nom");
      if (!error && data && data.length) return data;
    }
    return window.DEMO.pays;
  }

  async function getVillesByPays(paysId) {
    if (!paysId) return getAllVilles();
    if (ready()) {
      const { data, error } = await sb().from("villes").select("*").eq("pays_id", paysId).order("nom");
      if (!error && data && data.length) return data;
    }
    return window.DEMO.villes.filter(v => v.pays_id === paysId);
  }

  async function getAllVilles() {
    if (ready()) {
      const { data, error } = await sb().from("villes").select("*").order("nom");
      if (!error && data && data.length) return data;
    }
    return window.DEMO.villes;
  }

  async function getHotels() {
    if (ready()) {
      const { data, error } = await sb()
        .from("hotels")
        .select("*, villes(nom, pays_id, pays(nom, drapeau_emoji))")
        .eq("actif", true);
      if (!error && data && data.length) return data;
    }
    return window.DEMO.hotels;
  }

  async function getHotelById(id) {
    if (ready()) {
      const { data, error } = await sb()
        .from("hotels")
        .select("*, villes(nom, pays(nom, drapeau_emoji))")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) return data;
    }
    return window.DEMO.hotels.find(h => h.id === id) || null;
  }

  async function getChambresByHotel(hotelId) {
    if (ready()) {
      const { data, error } = await sb()
        .from("chambres")
        .select("*")
        .eq("hotel_id", hotelId)
        .neq("statut", "hors_service")
        .order("prix_nuit");
      if (!error && data && data.length) return data;
    }
    return window.DEMO.chambres.filter(c => c.hotel_id === hotelId);
  }

  async function getAvisByHotel(hotelId) {
    if (ready()) {
      const { data, error } = await sb()
        .from("avis")
        .select("*, utilisateurs(prenom, nom)")
        .eq("hotel_id", hotelId)
        .order("date_creation", { ascending: false });
      if (!error && data && data.length) return data;
    }
    return window.DEMO.avis.filter(a => a.hotel_id === hotelId);
  }

  function demoPrixMin(hotelId) {
    const rooms = window.DEMO.chambres.filter(c => c.hotel_id === hotelId);
    return rooms.length ? Math.min(...rooms.map(r => r.prix_nuit)) : null;
  }

  function demoNote(hotelId) {
    const list = window.DEMO.avis.filter(a => a.hotel_id === hotelId);
    if (!list.length) return null;
    const moy = list.reduce((s, a) => s + a.note, 0) / list.length;
    return { note_moyenne: Math.round(moy * 10) / 10, nb_avis: list.length };
  }

  async function getHotelPrixMin(hotelId) {
    if (ready()) {
      const { data, error } = await sb().from("hotel_prix_min").select("prix_min").eq("hotel_id", hotelId).maybeSingle();
      if (!error && data) return data.prix_min;
    }
    return demoPrixMin(hotelId);
  }

  async function getHotelNote(hotelId) {
    if (ready()) {
      const { data, error } = await sb().from("hotel_notes").select("*").eq("hotel_id", hotelId).maybeSingle();
      if (!error && data) return data;
    }
    return demoNote(hotelId);
  }

  // Prix min pour un lot d'hôtels (utilisé pour les cartes "destination")
  async function getPrixMinForHotelIds(hotelIds) {
    if (!hotelIds.length) return null;
    if (ready()) {
      const { data, error } = await sb().from("hotel_prix_min").select("prix_min").in("hotel_id", hotelIds);
      if (!error && data && data.length) return Math.min(...data.map(x => x.prix_min).filter(Boolean));
    }
    const mins = hotelIds.map(demoPrixMin).filter(v => v !== null);
    return mins.length ? Math.min(...mins) : null;
  }

  return {
    getPays, getVillesByPays, getAllVilles, getHotels, getHotelById,
    getChambresByHotel, getAvisByHotel, getHotelPrixMin, getHotelNote,
    getPrixMinForHotelIds,
  };
})();
