
(async function () {
  const actions = document.getElementById("header-actions");
  if (!actions) return;

  if (!window.isSupabaseConfigured()) {
    console.warn("⚠️ Supabase n'est pas configuré : édite js/config.js avec ton URL et ta clé anon.");
    if (!document.getElementById("demo-banner")) {
      const banner = document.createElement("div");
      banner.id = "demo-banner";
      banner.style.cssText = "background:#9C7530;color:#fff;text-align:center;padding:8px 16px;font-size:0.82rem;font-weight:600;";
      banner.textContent = "🔧 Mode démonstration — données fictives affichées. Connecte Supabase dans js/config.js pour brancher ta vraie base.";
      const header = document.querySelector(".site-header");
      if (header) header.insertAdjacentElement("afterend", banner);
    }
  }

  try {
    const profile = await window.getCurrentProfile();
    if (profile) {
      const isStaff = ["admin", "gestionnaire", "receptionniste"].includes(profile.role);
      actions.innerHTML = `
        ${isStaff ? '<a href="admin.html" class="btn btn-ghost btn-sm">Admin</a>' : ''}
        <a href="account.html" class="btn btn-ghost btn-sm">👤 ${profile.prenom || "Mon compte"}</a>
      `;
    }
  } catch (e) {
    console.warn("Session non disponible", e);
  }
})();
