
const sba = window.supabaseClient;

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const msgZone = document.getElementById("form-msg-zone");

tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));

function switchTab(tab) {
  tabLogin.classList.toggle("active", tab === "login");
  tabRegister.classList.toggle("active", tab === "register");
  loginForm.style.display = tab === "login" ? "block" : "none";
  registerForm.style.display = tab === "register" ? "block" : "none";
  msgZone.innerHTML = "";
}

function showMsg(text, type = "error") {
  msgZone.innerHTML = `<div class="form-msg ${type}">${text}</div>`;
}

// Redirige déjà-connecté vers son compte
(async () => {
  const profile = await window.getCurrentProfile();
  if (profile) window.location.href = "account.html";
})();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("li-email").value.trim();
  const password = document.getElementById("li-password").value;
  const { error } = await sba.auth.signInWithPassword({ email, password });
  if (error) { showMsg("Identifiants incorrects. " + error.message); return; }
  window.location.href = "account.html";
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prenom = document.getElementById("re-prenom").value.trim();
  const nom = document.getElementById("re-nom").value.trim();
  const email = document.getElementById("re-email").value.trim();
  const telephone = document.getElementById("re-telephone").value.trim();
  const password = document.getElementById("re-password").value;

  const { data, error } = await sba.auth.signUp({
    email, password,
    options: { data: { prenom, nom } }
  });
  if (error) { showMsg("Inscription impossible : " + error.message); return; }

  // Met à jour le téléphone si le profil a bien été créé par le trigger
  if (data.user && telephone) {
    await sba.from("utilisateurs").update({ telephone }).eq("id", data.user.id);
  }

  if (data.session) {
    window.location.href = "account.html";
  } else {
    showMsg("Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.", "success");
    switchTab("login");
  }
});
