
const sbA = window.supabaseClient;
let adminProfile = null;

document.querySelectorAll(".tab-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
    link.classList.add("active");
    document.getElementById("tab-" + link.dataset.tab).style.display = "block";
  });
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await sbA.auth.signOut();
  window.location.href = "index.html";
});

async function init() {
  adminProfile = await window.requireAuth(true);
  if (!adminProfile) return;
  document.getElementById("admin-name").textContent = `${adminProfile.prenom} ${adminProfile.nom}`;
  document.getElementById("admin-initial").textContent = (adminProfile.prenom || "A")[0].toUpperCase();
  document.getElementById("admin-role").textContent = adminProfile.role;

  await Promise.all([loadStats(), loadVillesIntoSelect(), loadHotelsAdmin(), loadHotelsIntoSelect(), loadChambresAdmin(), loadReservationsAdmin(), loadRevenus()]);
}

// ---------------- Aperçu / stats ----------------
async function loadStats() {
  const [{ count: nbHotels }, { count: nbChambres }, { count: nbReservations }, { data: factures }] = await Promise.all([
    sbA.from("hotels").select("*", { count: "exact", head: true }).eq("actif", true),
    sbA.from("chambres").select("*", { count: "exact", head: true }),
    sbA.from("reservations").select("*", { count: "exact", head: true }),
    sbA.from("factures").select("montant_total"),
  ]);
  document.getElementById("stat-hotels").textContent = nbHotels ?? 0;
  document.getElementById("stat-chambres").textContent = nbChambres ?? 0;
  document.getElementById("stat-reservations").textContent = nbReservations ?? 0;
  const total = (factures || []).reduce((s, f) => s + parseFloat(f.montant_total), 0);
  document.getElementById("stat-revenus").textContent = window.formatPrice(total);

  const { data: reservations } = await sbA.from("reservations").select("chambre_id, chambres(type, numero, hotels(nom))");
  const counts = {};
  (reservations || []).forEach(r => {
    if (!r.chambres) return;
    const key = `${r.chambres.hotels ? r.chambres.hotels.nom : ""} — ${r.chambres.type} ${r.chambres.numero}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById("top-rooms").innerHTML = sorted.length
    ? `<table class="data-table"><thead><tr><th>Chambre</th><th>Nb réservations</th></tr></thead><tbody>${sorted.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</tbody></table>`
    : `<div class="empty-state">Pas encore de données.</div>`;
}

// ---------------- Hôtels ----------------
async function loadVillesIntoSelect() {
  const { data: villes } = await sbA.from("villes").select("*, pays(nom)").order("nom");
  const select = document.getElementById("h-ville");
  select.innerHTML = (villes || []).map(v => `<option value="${v.id}">${v.nom}${v.pays ? " — " + v.pays.nom : ""}</option>`).join("");
}

async function loadHotelsAdmin() {
  const { data: hotels } = await sbA.from("hotels").select("*, villes(nom)").order("nom");
  const container = document.getElementById("admin-hotels-list");
  if (!hotels || !hotels.length) { container.innerHTML = `<div class="empty-state">Aucun hôtel. Ajoutez-en un.</div>`; return; }
  container.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Hôtel</th><th>Ville</th><th>Étoiles</th><th>Statut</th><th></th></tr></thead>
      <tbody>
        ${hotels.map(h => `
          <tr>
            <td>${h.nom}</td>
            <td>${h.villes ? h.villes.nom : ""}</td>
            <td>${"★".repeat(h.etoiles)}</td>
            <td><span class="status-pill ${h.actif ? 'status-confirmee' : 'status-annulee'}">${h.actif ? "Actif" : "Inactif"}</span></td>
            <td><button class="btn btn-outline btn-sm" onclick="editHotel('${h.id}')">Modifier</button></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

document.getElementById("btn-new-hotel").addEventListener("click", () => openHotelModal());
document.getElementById("btn-cancel-hotel").addEventListener("click", () => toggleModal("modal-hotel", false));

function toggleModal(id, show) { document.getElementById(id).style.display = show ? "flex" : "none"; }

function openHotelModal(hotel = null) {
  document.getElementById("modal-hotel-title").textContent = hotel ? "Modifier l'hôtel" : "Ajouter un hôtel";
  document.getElementById("h-id").value = hotel ? hotel.id : "";
  document.getElementById("h-nom").value = hotel ? hotel.nom : "";
  document.getElementById("h-ville").value = hotel ? hotel.ville_id : "";
  document.getElementById("h-adresse").value = hotel ? hotel.adresse : "";
  document.getElementById("h-description").value = hotel ? (hotel.description || "") : "";
  document.getElementById("h-etoiles").value = hotel ? hotel.etoiles : 5;
  document.getElementById("h-actif").value = hotel ? String(hotel.actif) : "true";
  document.getElementById("h-photo").value = hotel ? (hotel.photo_principale || "") : "";
  document.getElementById("h-galerie").value = hotel ? (hotel.galerie_photos || []).join(", ") : "";
  document.querySelectorAll(".h-service").forEach(cb => { cb.checked = hotel ? (hotel.services || []).includes(cb.value) : false; });
  toggleModal("modal-hotel", true);
}

window.editHotel = async function (id) {
  const { data: hotel } = await sbA.from("hotels").select("*").eq("id", id).single();
  if (hotel) openHotelModal(hotel);
};

document.getElementById("hotel-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("h-id").value;
  const payload = {
    nom: document.getElementById("h-nom").value.trim(),
    ville_id: document.getElementById("h-ville").value,
    adresse: document.getElementById("h-adresse").value.trim(),
    description: document.getElementById("h-description").value.trim(),
    etoiles: parseInt(document.getElementById("h-etoiles").value),
    actif: document.getElementById("h-actif").value === "true",
    photo_principale: document.getElementById("h-photo").value.trim(),
    galerie_photos: document.getElementById("h-galerie").value.split(",").map(s => s.trim()).filter(Boolean),
    services: [...document.querySelectorAll(".h-service:checked")].map(c => c.value),
  };
  const { error } = id
    ? await sbA.from("hotels").update(payload).eq("id", id)
    : await sbA.from("hotels").insert(payload);
  if (error) { window.showToast("Erreur : " + error.message, "error"); return; }
  window.showToast(id ? "Hôtel mis à jour." : "Hôtel ajouté.");
  toggleModal("modal-hotel", false);
  loadHotelsAdmin(); loadHotelsIntoSelect(); loadStats();
});

// ---------------- Chambres ----------------
async function loadHotelsIntoSelect() {
  const { data: hotels } = await sbA.from("hotels").select("id, nom").order("nom");
  document.getElementById("c-hotel").innerHTML = (hotels || []).map(h => `<option value="${h.id}">${h.nom}</option>`).join("");
}

async function loadChambresAdmin() {
  const { data: chambres } = await sbA.from("chambres").select("*, hotels(nom)").order("numero");
  const container = document.getElementById("admin-chambres-list");
  if (!chambres || !chambres.length) { container.innerHTML = `<div class="empty-state">Aucune chambre. Ajoutez-en une.</div>`; return; }
  container.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Hôtel</th><th>N°</th><th>Type</th><th>Prix / nuit</th><th>Statut</th></tr></thead>
      <tbody>
        ${chambres.map(c => `
          <tr>
            <td>${c.hotels ? c.hotels.nom : ""}</td>
            <td>${c.numero}</td>
            <td>${c.type}</td>
            <td>${window.formatPrice(c.prix_nuit)}</td>
            <td><span class="status-pill ${c.statut === 'disponible' ? 'status-confirmee' : (c.statut === 'occupee' ? 'status-en_attente' : 'status-annulee')}">${c.statut}</span></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

document.getElementById("btn-new-chambre").addEventListener("click", () => toggleModal("modal-chambre", true));
document.getElementById("btn-cancel-chambre").addEventListener("click", () => toggleModal("modal-chambre", false));

document.getElementById("chambre-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    hotel_id: document.getElementById("c-hotel").value,
    numero: document.getElementById("c-numero").value.trim(),
    type: document.getElementById("c-type").value,
    capacite_adultes: parseInt(document.getElementById("c-adultes").value) || 1,
    capacite_enfants: parseInt(document.getElementById("c-enfants").value) || 0,
    prix_nuit: parseFloat(document.getElementById("c-prix").value),
    description: document.getElementById("c-description").value.trim(),
    photos: [document.getElementById("c-photo").value.trim()].filter(Boolean),
  };
  const { error } = await sbA.from("chambres").insert(payload);
  if (error) { window.showToast("Erreur : " + error.message, "error"); return; }
  window.showToast("Chambre ajoutée.");
  toggleModal("modal-chambre", false);
  document.getElementById("chambre-form").reset();
  loadChambresAdmin(); loadStats();
});

// ---------------- Réservations ----------------
async function loadReservationsAdmin() {
  const { data: reservations } = await sbA
    .from("reservations")
    .select("*, utilisateurs(prenom, nom), chambres(type, numero, hotels(nom))")
    .order("date_creation", { ascending: false })
    .limit(100);
  const container = document.getElementById("admin-reservations-list");
  if (!reservations || !reservations.length) { container.innerHTML = `<div class="empty-state">Aucune réservation.</div>`; return; }
  container.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Client</th><th>Hôtel / Chambre</th><th>Dates</th><th>Montant</th><th>Statut</th></tr></thead>
      <tbody>
        ${reservations.map(r => `
          <tr>
            <td>${r.utilisateurs ? r.utilisateurs.prenom + " " + r.utilisateurs.nom : "—"}</td>
            <td>${r.chambres && r.chambres.hotels ? r.chambres.hotels.nom : ""} — ${r.chambres ? r.chambres.type : ""}</td>
            <td>${r.date_arrivee} → ${r.date_depart}</td>
            <td>${window.formatPrice(parseFloat(r.prix_total) + parseFloat(r.taxes))}</td>
            <td><span class="status-pill status-${r.statut}">${r.statut}</span></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

// ---------------- Revenus ----------------
async function loadRevenus() {
  const { data: factures } = await sbA
    .from("factures")
    .select("montant_total, reservations(chambres(hotels(nom)))");
  const parHotel = {};
  (factures || []).forEach(f => {
    const nom = f.reservations && f.reservations.chambres && f.reservations.chambres.hotels ? f.reservations.chambres.hotels.nom : "Autre";
    parHotel[nom] = (parHotel[nom] || 0) + parseFloat(f.montant_total);
  });
  const rows = Object.entries(parHotel).sort((a, b) => b[1] - a[1]);
  document.getElementById("revenus-list").innerHTML = rows.length
    ? `<table class="data-table"><thead><tr><th>Hôtel</th><th>Revenus</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${window.formatPrice(v)}</td></tr>`).join("")}</tbody></table>`
    : `<div class="empty-state">Aucun revenu enregistré pour l'instant.</div>`;
}

init();
