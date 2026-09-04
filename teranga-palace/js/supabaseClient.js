
const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.TERANGA_CONFIG;

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.isSupabaseConfigured = function () {
  return SUPABASE_URL && !SUPABASE_URL.includes("VOTRE-PROJET") &&
         SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("VOTRE_CLE");
};


window.showToast = function (message, type = "success") {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3800);
};


window.formatPrice = function (n) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
};


window.getCurrentProfile = async function () {
  // En mode démo (Supabase non connecté), personne n'est jamais "connecté".
  if (!window.isSupabaseConfigured()) return null;
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) return null;
  const { data, error } = await window.supabaseClient
    .from("utilisateurs")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) { console.warn(error); return null; }
  return data;
};

window.requireAuth = async function (adminOnly = false) {
  const profile = await window.getCurrentProfile();
  if (!profile) { window.location.href = "auth.html"; return null; }
  if (adminOnly && !["admin", "gestionnaire", "receptionniste"].includes(profile.role)) {
    window.location.href = "index.html";
    return null;
  }
  return profile;
};
