// ============================================================================
// Page d'accueil : destinations, hôtels vedettes, redirection recherche
// ============================================================================
const DL = window.DataLayer;

async function loadPaysVilles() {
  const pays = await DL.getPays();
  const selectPays = document.getElementById("s-pays");
  const selectVille = document.getElementById("s-ville");
  pays.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id; opt.textContent = `${p.drapeau_emoji || ""} ${p.nom}`;
    selectPays.appendChild(opt);
  });

  selectPays.addEventListener("change", async () => {
    selectVille.innerHTML = '<option value="">Toutes les villes</option>';
    if (!selectPays.value) return;
    const villes = await DL.getVillesByPays(selectPays.value);
    villes.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.id; opt.textContent = v.nom;
      selectVille.appendChild(opt);
    });
  });
}

async function loadDestinations() {
  const grid = document.getElementById("destinations-grid");
  const pays = await DL.getPays();
  const hotels = await DL.getHotels();

  const cards = await Promise.all(pays.map(async (p) => {
    const hotelsInPays = hotels.filter(h => h.villes && h.villes.pays_id === p.id);
    const nbHotels = hotelsInPays.length;
    const prixMin = await DL.getPrixMinForHotelIds(hotelsInPays.map(h => h.id));
    return `
      <a class="destination-card" href="hotels.html?pays=${p.id}">
        <img src="${p.image_url}" alt="${p.nom}" loading="lazy">
        <div class="destination-info">
          <div class="flag">${p.drapeau_emoji || ""}</div>
          <h3>${p.nom}</h3>
          <div class="meta">
            <span>${nbHotels} hôtel${nbHotels > 1 ? "s" : ""}</span>
            <span>${prixMin ? `dès <b>${window.formatPrice(prixMin)}</b>` : ""}</span>
          </div>
        </div>
      </a>`;
  }));
  grid.innerHTML = cards.join("") || `<div class="empty-state" style="grid-column:1/-1;">Aucune destination disponible.</div>`;
}

async function loadFeaturedHotels() {
  const container = document.getElementById("featured-hotels");
  const hotels = (await DL.getHotels()).slice(0, 6);
  if (!hotels.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Aucun hôtel à afficher pour le moment.</div>`;
    return;
  }
  const cards = await Promise.all(hotels.map(renderHotelCard));
  container.innerHTML = cards.join("");
}

async function renderHotelCard(h) {
  const [prixMin, note] = await Promise.all([DL.getHotelPrixMin(h.id), DL.getHotelNote(h.id)]);
  const ville = h.villes ? h.villes.nom : "";
  const pays = h.villes && h.villes.pays ? h.villes.pays.nom : "";
  return `
    <a class="hotel-card" href="hotel.html?id=${h.id}">
      <div class="thumb">
        <img src="${h.photo_principale}" alt="${h.nom}" loading="lazy">
        <div class="badge-stars">${"★".repeat(h.etoiles)}</div>
      </div>
      <div class="hotel-card-body">
        <h3>${h.nom}</h3>
        <div class="hotel-loc">📍 ${ville}${pays ? ", " + pays : ""}</div>
        <div class="hotel-services">${(h.services || []).slice(0, 3).map(s => `<span class="chip">${s}</span>`).join("")}</div>
        <div class="hotel-card-foot">
          <div class="price-tag">${prixMin ? window.formatPrice(prixMin) : "—"}<br><small>par nuit</small></div>
          <div class="rating">⭐ ${note ? note.note_moyenne : "Nouveau"}</div>
        </div>
      </div>
    </a>`;
}

document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const params = new URLSearchParams({
    pays: document.getElementById("s-pays").value,
    ville: document.getElementById("s-ville").value,
    arrivee: document.getElementById("s-arrivee").value,
    depart: document.getElementById("s-depart").value,
    adultes: document.getElementById("s-adultes").value,
    enfants: document.getElementById("s-enfants").value,
  });
  window.location.href = `hotels.html?${params.toString()}`;
});

(function setDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const in3days = new Date(today); in3days.setDate(today.getDate() + 3);
  document.getElementById("s-arrivee").value = tomorrow.toISOString().slice(0, 10);
  document.getElementById("s-arrivee").min = today.toISOString().slice(0, 10);
  document.getElementById("s-depart").value = in3days.toISOString().slice(0, 10);
  document.getElementById("s-depart").min = tomorrow.toISOString().slice(0, 10);
})();

loadPaysVilles();
loadDestinations();
loadFeaturedHotels();
