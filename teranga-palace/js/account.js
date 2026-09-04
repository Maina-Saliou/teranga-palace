
const sbc = window.supabaseClient;
let currentProfile = null;

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
  await sbc.auth.signOut();
  window.location.href = "index.html";
});

async function init() {
  currentProfile = await window.requireAuth(false);
  if (!currentProfile) return;

  document.getElementById("user-name").textContent = `${currentProfile.prenom} ${currentProfile.nom}`;
  document.getElementById("user-initial").textContent = (currentProfile.prenom || "?")[0].toUpperCase();
  document.getElementById("p-prenom").value = currentProfile.prenom || "";
  document.getElementById("p-nom").value = currentProfile.nom || "";
  document.getElementById("p-email").value = currentProfile.email || "";
  document.getElementById("p-telephone").value = currentProfile.telephone || "";

  await loadReservations();
  await loadFactures();
}

async function fetchReservations() {
  const { data, error } = await sbc
    .from("reservations")
    .select("*, chambres(type, numero, hotels(nom, photo_principale, ville_id, villes(nom)))")
    .eq("client_id", currentProfile.id)
    .order("date_arrivee", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

function reservationCardHtml(r, { cancellable }) {
  const hotel = r.chambres && r.chambres.hotels;
  const total = (parseFloat(r.prix_total) + parseFloat(r.taxes)).toFixed(0);
  return `
    <div class="room-card">
      <img src="${hotel ? hotel.photo_principale : ''}" alt="">
      <div>
        <h4 style="font-size:1.02rem;">${hotel ? hotel.nom : "Hôtel"} — ${r.chambres ? r.chambres.type : ""}</h4>
        <p style="font-size:0.85rem;margin-top:4px;">${r.date_arrivee} → ${r.date_depart} · ${r.nb_adultes} adulte(s), ${r.nb_enfants} enfant(s)</p>
        <span class="status-pill status-${r.statut}">${statusLabel(r.statut)}</span>
      </div>
      <div style="text-align:right;">
        <div class="price-tag">${window.formatPrice(total)}</div>
        <div style="display:flex; gap:8px; margin-top:10px; justify-content:flex-end; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="downloadInvoice('${r.id}')">Facture PDF</button>
          ${cancellable ? `<button class="btn btn-danger btn-sm" onclick="cancelReservation('${r.id}')">Annuler</button>` : ""}
        </div>
      </div>
    </div>`;
}

function statusLabel(s) {
  return { confirmee: "Confirmée", en_attente: "En attente", annulee: "Annulée", terminee: "Terminée" }[s] || s;
}

async function loadReservations() {
  const all = await fetchReservations();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = all.filter(r => r.date_depart >= today && r.statut !== "annulee");
  const history = all.filter(r => r.date_depart < today || r.statut === "annulee" || r.statut === "terminee");

  document.getElementById("reservations-upcoming").innerHTML = upcoming.length
    ? upcoming.map(r => reservationCardHtml(r, { cancellable: true })).join("")
    : `<div class="empty-state">Aucune réservation à venir. <a href="hotels.html" style="color:var(--gold-dark);font-weight:700;">Explorer les hôtels</a></div>`;

  document.getElementById("reservations-history").innerHTML = history.length
    ? history.map(r => reservationCardHtml(r, { cancellable: false })).join("")
    : `<div class="empty-state">Aucun séjour passé pour l'instant.</div>`;
}

window.cancelReservation = async function (id) {
  if (!confirm("Confirmer l'annulation de cette réservation ?")) return;
  const { error } = await sbc.from("reservations").update({ statut: "annulee" }).eq("id", id);
  if (error) { window.showToast("Impossible d'annuler : " + error.message, "error"); return; }
  window.showToast("Réservation annulée.");
  loadReservations();
};

async function fetchFactures() {
  const { data, error } = await sbc
    .from("factures")
    .select("*, reservations(date_arrivee, date_depart, client_id, chambres(type, hotels(nom)))")
    .order("date_emission", { ascending: false });
  if (error) { console.error(error); return []; }
  // RLS filtre déjà sur le client, mais on sécurise côté front aussi
  return (data || []).filter(f => f.reservations && f.reservations.client_id === currentProfile.id);
}

async function loadFactures() {
  const factures = await fetchFactures();
  const container = document.getElementById("factures-list");
  if (!factures.length) {
    container.innerHTML = `<div class="empty-state">Aucune facture pour l'instant.</div>`;
    return;
  }
  container.innerHTML = `
    <table class="data-table">
      <thead><tr><th>N° facture</th><th>Hôtel</th><th>Séjour</th><th>Montant TTC</th><th></th></tr></thead>
      <tbody>
        ${factures.map(f => `
          <tr>
            <td>${f.numero_facture}</td>
            <td>${f.reservations && f.reservations.chambres && f.reservations.chambres.hotels ? f.reservations.chambres.hotels.nom : "—"}</td>
            <td>${f.reservations ? f.reservations.date_arrivee + " → " + f.reservations.date_depart : "—"}</td>
            <td>${window.formatPrice(f.montant_total)}</td>
            <td><button class="btn btn-outline btn-sm" onclick="downloadInvoiceByFacture('${f.id}')">Télécharger PDF</button></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

async function buildAndSavePdf(facture, reservation, hotelNom) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(20); doc.text("Teranga Palace", 20, 24);
  doc.setFontSize(11); doc.text("Facture " + facture.numero_facture, 20, 34);
  doc.line(20, 38, 190, 38);
  doc.setFontSize(12);
  doc.text(`Hôtel : ${hotelNom || "—"}`, 20, 52);
  doc.text(`Client : ${currentProfile.prenom} ${currentProfile.nom}`, 20, 60);
  doc.text(`Email : ${currentProfile.email}`, 20, 68);
  doc.text(`Séjour : ${reservation ? reservation.date_arrivee + " → " + reservation.date_depart : "—"}`, 20, 76);
  doc.line(20, 86, 190, 86);
  doc.text(`Montant HT : ${window.formatPrice(facture.montant_ht)}`, 20, 98);
  doc.text(`Taxes (18%) : ${window.formatPrice(facture.montant_taxes)}`, 20, 106);
  doc.setFontSize(14);
  doc.text(`Total TTC : ${window.formatPrice(facture.montant_total)}`, 20, 118);
  doc.setFontSize(10); doc.text("Merci de votre confiance. À bientôt chez Teranga Palace.", 20, 140);
  doc.save(`${facture.numero_facture}.pdf`);
}

window.downloadInvoiceByFacture = async function (factureId) {
  const { data: facture } = await sbc.from("factures").select("*, reservations(date_arrivee, date_depart, chambres(hotels(nom)))").eq("id", factureId).single();
  if (!facture) { window.showToast("Facture introuvable.", "error"); return; }
  buildAndSavePdf(facture, facture.reservations, facture.reservations && facture.reservations.chambres ? facture.reservations.chambres.hotels.nom : null);
};

window.downloadInvoice = async function (reservationId) {
  const { data: facture } = await sbc.from("factures").select("*").eq("reservation_id", reservationId).maybeSingle();
  if (!facture) { window.showToast("Aucune facture associée à cette réservation.", "error"); return; }
  window.downloadInvoiceByFacture(facture.id);
};

document.getElementById("profile-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const updates = {
    prenom: document.getElementById("p-prenom").value.trim(),
    nom: document.getElementById("p-nom").value.trim(),
    telephone: document.getElementById("p-telephone").value.trim(),
  };
  const { error } = await sbc.from("utilisateurs").update(updates).eq("id", currentProfile.id);
  if (error) { window.showToast("Erreur : " + error.message, "error"); return; }
  window.showToast("Profil mis à jour.");
  init();
});

init();
