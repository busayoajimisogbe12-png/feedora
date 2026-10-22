
import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Get the HTML elements
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const logoutBtn = document.getElementById("logoutBtn");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserEmail = document.getElementById("sidebarUserEmail");
const userAvatar = document.getElementById("userAvatar");

const settingsUserName = document.getElementById("settingsUserName");
const settingsUserEmail = document.getElementById("settingsUserEmail");

const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const settingsMessage = document.getElementById("settingsMessage");

// Display messages on the Settings page
function showMessage(message) {
    settingsMessage.textContent = message;
}

// Display the signed-in user's information
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }

    const name = user.displayName || "Feedora User";
    const email = user.email || "No email available";

    sidebarUserName.textContent = name;
    sidebarUserEmail.textContent = email;

    settingsUserName.textContent = name;
    settingsUserEmail.textContent = email;

    userAvatar.textContent = name.charAt(0).toUpperCase();
});

// Open and close the mobile sidebar
function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");

    sidebarBackdrop.classList.toggle("show", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

sidebarBackdrop.addEventListener("click", closeSidebar);

// Close the mobile menu with Escape
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeSidebar();
    }
});

// Log out the current user
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "./login.html";
    } catch (error) {
        console.error("Logout error:", error);
        showMessage("Unable to log out. Please try again.");
    }
});

// Send a password-reset email
resetPasswordBtn.addEventListener("click", async () => {
    const user = auth.currentUser;

    if (!user || !user.email) {
        showMessage("Please sign in with an email address first.");
        return;
    }

    // Check whether the account uses email and password
    const usesPassword = user.providerData.some(
        (provider) => provider.providerId === "password"
    );

    if (!usesPassword) {
        showMessage(
            "This account does not use a Feedora password. Manage its password through your sign-in provider."
        );
        return;
    }

    resetPasswordBtn.disabled = true;
    resetPasswordBtn.textContent = "Sending...";

    try {
        await sendPasswordResetEmail(auth, user.email);

        showMessage(
            `Password-reset instructions have been sent to ${user.email}. Check your inbox.`
        );
    } catch (error) {
        console.error("Password-reset error:", error);

        if (error.code === "auth/too-many-requests") {
            showMessage(
                "Too many attempts. Please wait a while before trying again."
            );
        } else {
            showMessage(
                "Unable to send the reset email. Please try again later."
            );
        }
    } finally {
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.textContent = "Reset Password";
    }
});
