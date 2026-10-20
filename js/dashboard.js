
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const welcomeTitle = document.getElementById("welcomeTitle");
const userEmail = document.getElementById("sidebarUserEmail");
const sidebarUserName = document.getElementById("sidebarUserName");
const userAvatar = document.getElementById("userAvatar");

const logoutBtn = document.getElementById("logoutBtn");
const formulationCount = document.getElementById("formulationCount");
const historyCount = document.getElementById("historyCount");
const dashboardMessage = document.getElementById("dashboardMessage");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

// Open and close the mobile sidebar
function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("show");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
}

menuToggle.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("open");

  sidebarBackdrop.classList.toggle("show", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );
});

sidebarBackdrop.addEventListener("click", closeSidebar);

document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
  link.addEventListener("click", closeSidebar);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSidebar();
  }
});

// Check authentication and load dashboard information
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./login.html");
    return;
  }

  const displayName = user.displayName || "Feedora User";
  const email = user.email || "Account email unavailable";

  welcomeTitle.textContent = `Welcome back, ${displayName}!`;
  sidebarUserName.textContent = displayName;
  userEmail.textContent = email;
  userAvatar.textContent = displayName.charAt(0).toUpperCase();

  try {
    const formulationsRef = collection(
      db, "users", user.uid, "formulations"
    );

    const historyRef = collection(
      db, "users", user.uid, "history"
    );

    const [formulationsSnapshot, historySnapshot] =
      await Promise.all([
        getDocs(formulationsRef),
        getDocs(historyRef)
      ]);

    formulationCount.textContent = formulationsSnapshot.size;
    historyCount.textContent = historySnapshot.size;

  } catch (error) {
    console.error("Could not load dashboard counts:", error);

    formulationCount.textContent = "—";
    historyCount.textContent = "—";

    dashboardMessage.textContent =
      "We couldn't load your saved data. Please refresh and try again.";
  }
});

// Log out
logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;

  try {
    await signOut(auth);
    window.location.replace("./login.html");
  } catch (error) {
    console.error("Logout failed:", error);

    dashboardMessage.textContent =
      "Unable to log out. Please try again.";

    logoutBtn.disabled = false;
  }
});

