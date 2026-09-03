// ============================================================================
// Page détail hôtel : affichage (via DataLayer) + moteur de réservation
// (écriture directe Supabase, avec garde-fou si Supabase n'est pas connecté)
// ============================================================================
const sbd = window.supabaseClient;
const DLd = window.DataLayer;
const hotelId = new URLSearchParams(window.location.search).get("id");

const SERVICE_ICONS = {
  "Piscine": "🏊", "WiFi": "📶", "Restaurant": "🍽️", "Spa": "💆",
  "Salle de sport": "🏋️", "Parking": "🅿️"
};

let currentHotel = null;
let chambres = [];

async function loadHotel() {
  if (!hotelId) { document.getElementById("hotel-header").innerHTML = `<div class="empty-state">Hôtel introuvable.</div>`; return; }

  const hotel = await DLd.getHotelById(hotelId);
  if (!hotel) {
    document.getElementById("hotel-header").innerHTML = `<div class="empty-state">Cet hôtel n'existe pas ou a été retiré.</div>`;
    return;
  }
  currentHotel = hotel;
  document.getElementById("page-title").textContent = `${hotel.nom} — Teranga Palace`;

  const ville = hotel.villes ? hotel.villes.nom : "";
  const pays = hotel.villes && hotel.villes.pays ? hotel.villes.pays.nom : "";

  document.getElementById("hotel-header").innerHTML = `
    <div class="badge-stars" style="position:static;display:inline-block;">${"★".repeat(hotel.etoiles)}</div>
    <h1 class="font-display" style="font-size:2.2rem;margin-top:10px;">${hotel.nom}</h1>
    <p style="margin-top:6px;">📍 ${hotel.adresse}${ville ? " · " + ville : ""}${pays ? ", " + pays : ""}</p>
  `;
  document.getElementById("hotel-description").textContent = hotel.description || "";

  const photos = [hotel.photo_principale, ...(hotel.galerie_photos || [])].filter(Boolean).slice(0, 5);
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = photos.map((src, i) => `<img class="${i === 0 ? "main" : ""}" src="${src}" alt="Photo ${i + 1} de ${hotel.nom}" loading="lazy">`).join("");

  document.getElementById("services-grid").innerHTML = (hotel.services || [])
    .map(s => `<div class="service-item">${SERVICE_ICONS[s] || "✔️"} ${s}</div>`).join("");

  await loadChambres();
  await loadReviews();
  recomputePrice();
}

async function loadChambres() {
  chambres = await DLd.getChambresByHotel(hotelId);
  const list = document.getElementById("rooms-list");
  const select = document.getElementById("b-chambre");

  if (!chambres.length) {
    list.innerHTML = `<div class="empty-state">Aucune chambre configurée pour cet hôtel.</div>`;
    return;
  }

  list.innerHTML = chambres.map(c => `
    <div class="room-card">
      <img src="${(c.photos && c.photos[0]) || currentHotel.photo_principale}" alt="${c.type}">
      <div>
        <h4 style="font-size:1.05rem;">${c.type} · Chambre ${c.numero}</h4>
        <p style="font-size:0.88rem;margin-top:4px;">${c.description || ""}</p>
        <p style="font-size:0.8rem;margin-top:6px;color:var(--text-muted);">👤 ${c.capacite_adultes} adultes · 🧒 ${c.capacite_enfants} enfants</p>
      </div>
      <div style="text-align:right;">
        <div class="price-tag">${window.formatPrice(c.prix_nuit)}<br><small>par nuit</small></div>
        <button class="btn btn-outline btn-sm" style="margin-top:10px;" onclick="selectRoom('${c.id}')">Choisir</button>
      </div>
    </div>
  `).join("");

  select.innerHTML = chambres.map(c => `<option value="${c.id}">${c.type} — ${window.formatPrice(c.prix_nuit)}/nuit</option>`).join("");
}

window.selectRoom = function (chambreId) {
  document.getElementById("b-chambre").value = chambreId;
  recomputePrice();
  document.querySelector(".booking-box").scrollIntoView({ behavior: "smooth", block: "center" });
};

async function loadReviews() {
  const avis = await DLd.getAvisByHotel(hotelId);
  const note = await DLd.getHotelNote(hotelId);

  document.getElementById("reviews-summary").innerHTML = note
    ? `<span style="font-size:1.6rem;font-weight:800;color:var(--gold-dark);">⭐ ${note.note_moyenne}</span> <span style="color:var(--text-muted);">(${note.nb_avis} avis)</span>`
    : `<span style="color:var(--text-muted);">Aucun avis pour l'instant — soyez le premier à en laisser un.</span>`;

  const list = document.getElementById("reviews-list");
  list.innerHTML = (avis || []).map(a => `
    <div class="review-item">
      <div class="head"><span>${a.utilisateurs ? a.utilisateurs.prenom + " " + a.utilisateurs.nom : "Client"}</span><span class="stars">${"★".repeat(a.note)}${"☆".repeat(5 - a.note)}</span></div>
      <p>${a.commentaire || ""}</p>
    </div>
  `).join("");

  const wrap = document.getElementById("review-form-wrap");
  if (!window.isSupabaseConfigured()) {
    wrap.innerHTML = `<p style="font-size:0.85rem;color:var(--text-muted);">Mode démonstration — connecte Supabase pour permettre le dépôt d'avis réels.</p>`;
    return;
  }

  const profile = await window.getCurrentProfile();
  if (profile) {
    wrap.innerHTML = `
      <h4 style="margin-bottom:10px;">Laisser un avis</h4>
      <div class="field-row">
        <div class="field"><label>Note</label>
          <select id="new-note"><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option></select>
        </div>
      </div>
      <div class="field"><label>Commentaire</label><textarea id="new-comment" rows="3" style="padding:11px;border:1px solid var(--border);border-radius:6px;"></textarea></div>
      <button class="btn btn-dark btn-sm" style="margin-top:10px;" id="submit-review">Publier mon avis</button>
    `;
    document.getElementById("submit-review").addEventListener("click", async () => {
      const noteVal = parseInt(document.getElementById("new-note").value);
      const commentaire = document.getElementById("new-comment").value.trim();
      const { error } = await sbd.from("avis").insert({ hotel_id: hotelId, client_id: profile.id, note: noteVal, commentaire });
      if (error) { window.showToast("Impossible de publier l'avis.", "error"); return; }
      window.showToast("Merci pour votre avis !");
      loadReviews();
    });
  } else {
    wrap.innerHTML = `<p style="font-size:0.88rem;"><a href="auth.html" style="color:var(--gold-dark);font-weight:700;">Connectez-vous</a> pour laisser un avis.</p>`;
  }
}

function nightsBetween(a, b) {
  const d1 = new Date(a), d2 = new Date(b);
  const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
  return diff > 0 ? Math.round(diff) : 0;
}

function recomputePrice() {
  const arrivee = document.getElementById("b-arrivee").value;
  const depart = document.getElementById("b-depart").value;
  const chambreId = document.getElementById("b-chambre").value;
  const chambre = chambres.find(c => c.id === chambreId);
  const nuits = nightsBetween(arrivee, depart);
  const msg = document.getElementById("booking-msg");
  msg.textContent = "";

  if (!chambre || nuits <= 0) {
    document.getElementById("pl-nuits").textContent = "0 nuit";
    ["pl-prix-nuit", "pl-subtotal", "pl-taxes", "pl-total"].forEach(id => document.getElementById(id).textContent = "—");
    return { valid: false };
  }

  const sousTotal = nuits * chambre.prix_nuit;
  const taxRate = (window.TERANGA_CONFIG && window.TERANGA_CONFIG.TAX_RATE) || 0.18;
  const taxes = sousTotal * taxRate;
  const total = sousTotal + taxes;

  document.getElementById("pl-nuits").textContent = `${nuits} nuit${nuits > 1 ? "s" : ""}`;
  document.getElementById("pl-prix-nuit").textContent = window.formatPrice(chambre.prix_nuit) + " / nuit";
  document.getElementById("pl-subtotal").textContent = window.formatPrice(sousTotal);
  document.getElementById("pl-taxes").textContent = window.formatPrice(taxes);
  document.getElementById("pl-total").textContent = window.formatPrice(total);

  return { valid: true, chambre, nuits, sousTotal, taxes, total };
}

["b-arrivee", "b-depart", "b-chambre"].forEach(id => {
  document.getElementById(id).addEventListener("change", recomputePrice);
});

document.getElementById("btn-reserver").addEventListener("click", async () => {
  const msg = document.getElementById("booking-msg");

  if (!window.isSupabaseConfigured()) {
    msg.style.color = "var(--terracotta)";
    msg.textContent = "Mode démonstration : connecte Supabase (js/config.js) pour activer les réservations réelles.";
    return;
  }

  const profile = await window.getCurrentProfile();
  if (!profile) {
    msg.style.color = "var(--terracotta)";
    msg.textContent = "Connectez-vous pour finaliser votre réservation.";
    setTimeout(() => window.location.href = "auth.html", 1200);
    return;
  }

  const calc = recomputePrice();
  if (!calc.valid) {
    msg.style.color = "var(--terracotta)";
    msg.textContent = "Sélectionnez des dates valides et une chambre.";
    return;
  }

  const btn = document.getElementById("btn-reserver");
  btn.disabled = true; btn.textContent = "Réservation en cours…";

  const payload = {
    client_id: profile.id,
    chambre_id: calc.chambre.id,
    date_arrivee: document.getElementById("b-arrivee").value,
    heure_arrivee: document.getElementById("b-heure-arrivee").value,
    date_depart: document.getElementById("b-depart").value,
    heure_depart: document.getElementById("b-heure-depart").value,
    nb_adultes: parseInt(document.getElementById("b-adultes").value) || 1,
    nb_enfants: parseInt(document.getElementById("b-enfants").value) || 0,
    prix_total: calc.sousTotal,
    taxes: calc.taxes,
    statut: "confirmee",
  };

  const { data: reservation, error } = await sbd.from("reservations").insert(payload).select().single();

  if (error) {
    btn.disabled = false; btn.textContent = "Confirmer la réservation";
    if (error.code === "23P01" || (error.message || "").toLowerCase().includes("exclu")) {
      msg.style.color = "var(--terracotta)";
      msg.textContent = "Cette chambre vient d'être réservée pour ces dates. Essayez d'autres dates.";
    } else {
      msg.style.color = "var(--terracotta)";
      msg.textContent = "Erreur lors de la réservation : " + error.message;
    }
    return;
  }

  await sbd.from("sejours").insert({ reservation_id: reservation.id, statut: "a_venir" });
  const numeroFacture = "FAC-" + Date.now().toString().slice(-8);
  await sbd.from("factures").insert({
    reservation_id: reservation.id,
    numero_facture: numeroFacture,
    montant_ht: calc.sousTotal,
    montant_taxes: calc.taxes,
    montant_total: calc.total,
  });

  window.showToast("Réservation confirmée !");
  setTimeout(() => window.location.href = "account.html", 900);
});

(function setDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const in3days = new Date(today); in3days.setDate(today.getDate() + 3);
  document.getElementById("b-arrivee").value = tomorrow.toISOString().slice(0, 10);
  document.getElementById("b-arrivee").min = today.toISOString().slice(0, 10);
  document.getElementById("b-depart").value = in3days.toISOString().slice(0, 10);
  document.getElementById("b-depart").min = tomorrow.toISOString().slice(0, 10);
})();

loadHotel();
