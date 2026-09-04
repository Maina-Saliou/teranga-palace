// ============================================================================
// Page hôtels : lecture des paramètres d'URL, filtres, affichage des résultats
// ============================================================================
const DLh = window.DataLayer;
const urlParams = new URLSearchParams(window.location.search);

let allHotels = [];
let allVilles = [];

async function loadFilterPays() {
  const pays = await DLh.getPays();
  const select = document.getElementById("f-pays");
  pays.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id; opt.textContent = `${p.drapeau_emoji || ""} ${p.nom}`;
    if (urlParams.get("pays") === p.id) opt.selected = true;
    select.appendChild(opt);
  });
}

async function loadFilterVilles() {
  allVilles = await DLh.getAllVilles();
  refreshVilleOptions();
}

function refreshVilleOptions() {
  const paysId = document.getElementById("f-pays").value;
  const select = document.getElementById("f-ville");
  const previous = select.value;
  const villes = paysId ? allVilles.filter(v => v.pays_id === paysId) : allVilles;
  select.innerHTML = '<option value="">Toutes les villes</option>' +
    villes.map(v => `<option value="${v.id}">${v.nom}</option>`).join("");
  if (villes.some(v => v.id === previous)) select.value = previous;
  else if (urlParams.get("ville") && villes.some(v => v.id === urlParams.get("ville"))) select.value = urlParams.get("ville");
}

document.getElementById("f-pays").addEventListener("change", () => { refreshVilleOptions(); applyFilters(); });

async function enrichHotel(h) {
  const [prixMin, note] = await Promise.all([DLh.getHotelPrixMin(h.id), DLh.getHotelNote(h.id)]);
  h.prix_min = prixMin;
  h.note_moyenne = note ? note.note_moyenne : null;
  return h;
}

function renderResults(hotels) {
  const list = document.getElementById("results-list");
  if (!hotels.length) {
    list.innerHTML = `<div class="empty-state">Aucun hôtel ne correspond à ta recherche. Essaie d'élargir les filtres.</div>`;
    return;
  }
  list.innerHTML = hotels.map(h => {
    const ville = h.villes ? h.villes.nom : "";
    const pays = h.villes && h.villes.pays ? h.villes.pays.nom : "";
    return `
    <a class="result-row" href="hotel.html?id=${h.id}">
      <div class="thumb"><img src="${h.photo_principale}" alt="${h.nom}" loading="lazy"></div>
      <div class="body">
        <div class="badge-stars" style="position:static;display:inline-block;width:fit-content;">${"★".repeat(h.etoiles)}</div>
        <h3 class="font-display" style="font-size:1.3rem;">${h.nom}</h3>
        <div class="hotel-loc">📍 ${ville}${pays ? ", " + pays : ""}</div>
        <p style="font-size:0.9rem;">${(h.description || "").slice(0, 130)}${h.description && h.description.length > 130 ? "…" : ""}</p>
        <div class="hotel-services">${(h.services || []).map(s => `<span class="chip">${s}</span>`).join("")}</div>
        <div class="foot">
          <div class="rating">⭐ ${h.note_moyenne || "Nouveau"}</div>
          <div class="price-tag">${h.prix_min ? window.formatPrice(h.prix_min) : "—"}<br><small>par nuit, dès ce prix</small></div>
        </div>
      </div>
    </a>`;
  }).join("");
}

function applyFilters() {
  const paysId = document.getElementById("f-pays").value;
  const villeId = document.getElementById("f-ville").value;
  const etoiles = [...document.querySelectorAll(".f-etoile:checked")].map(c => parseInt(c.value));
  const services = [...document.querySelectorAll(".f-service:checked")].map(c => c.value);
  const prixMax = parseInt(document.getElementById("f-prix").value);

  let filtered = allHotels.filter(h => {
    if (paysId && (!h.villes || h.villes.pays_id !== paysId)) return false;
    if (villeId && h.ville_id !== villeId) return false;
    if (etoiles.length && !etoiles.includes(h.etoiles)) return false;
    if (services.length && !services.every(s => (h.services || []).includes(s))) return false;
    if (h.prix_min && h.prix_min > prixMax) return false;
    return true;
  });
  renderResults(filtered);

  const summary = document.getElementById("search-summary");
  summary.textContent = `${filtered.length} hôtel${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`;
}

document.getElementById("f-prix").addEventListener("input", (e) => {
  document.getElementById("f-prix-val").textContent = `Jusqu'à ${window.formatPrice(parseInt(e.target.value))}`;
});
document.getElementById("f-ville").addEventListener("change", applyFilters);
document.getElementById("apply-filters").addEventListener("click", applyFilters);

(async function init() {
  await loadFilterPays();
  await loadFilterVilles();
  const raw = await DLh.getHotels();
  allHotels = await Promise.all(raw.map(enrichHotel));
  applyFilters();
})();
