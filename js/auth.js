
import { auth } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


import { db } from "./firebase-config.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";



async function saveUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      fullName: user.displayName || "",
      email: user.email || "",
      role: "user",
      createdAt: serverTimestamp()
    });
  }
}




// 1. Show or hide password fields
document.querySelectorAll(".password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.passwordTarget || "password";
    const passwordInput = document.getElementById(targetId);

    if (!passwordInput) return;

    const showPassword = passwordInput.type === "password";

    passwordInput.type = showPassword ? "text" : "password";
    button.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    button.setAttribute("title", showPassword ? "Hide password" : "Show password");
    button.setAttribute("aria-pressed", String(showPassword));
    button.classList.toggle("is-visible", showPassword);
  });
});


// 2. Register with email and password
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const message = document.getElementById("registerMessage");
    const submitButton = registerForm.querySelector('button[type="submit"]');

    message.textContent = "";

    if (!fullName) {
      message.textContent = "Please enter your full name.";
      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "Your passwords do not match.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      await saveUserProfile(userCredential.user);

      message.textContent =
        "Account created! Sending your verification email...";

      try {
        await sendEmailVerification(userCredential.user);

        message.textContent =
          "Account created! Please check your inbox and click the verification link.";
      } catch (emailError) {
        console.error("Verification email error:", emailError);

        message.textContent =
          "Your account was created, but we couldn't send the verification email. Please try again later.";
      }

      registerForm.reset();

    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === "auth/email-already-in-use") {
        message.textContent =
          "An account already exists with this email address.";
      } else if (error.code === "auth/invalid-email") {
        message.textContent = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        message.textContent = "Please choose a stronger password.";
      } else {
        message.textContent =
          "We couldn't create your account. Please try again.";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML =
        'Create Account <span class="submit-arrow" aria-hidden="true">→</span>';
    }
  });
}


// 3. Sign in with email and password
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("formMessage");
    const submitButton = loginForm.querySelector('button[type="submit"]');

    message.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

const user = userCredential.user;

if (!user.emailVerified) {
  message.textContent =
    "Please verify your email before continuing. Check your inbox.";
  return;
}

const userRef = doc(db, "users", user.uid);
const userSnapshot = await getDoc(userRef);

if (!userSnapshot.exists()) {
  message.textContent =
    "Your user profile could not be found. Please contact support.";
  return;
}

const role = userSnapshot.data().role;

console.log("Logged-in email:", user.email);
console.log("Firestore role:", role);
console.log("User UID:", user.uid);

if (role === "admin") {
  window.location.href = "./admin-dashboard.html";
} else {
  window.location.href = "./dashboard.html";
}

return;


      message.textContent =
        `Welcome back, ${userCredential.user.displayName || "Feedora user"}!`;
        console.log("Feedora login successful.");

        window.location.href = "./dashboard.html";
        return;

      // console.log("Feedora login successful.");

    } catch (error) {
      console.error("Login error:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        message.textContent =
          "The email or password is incorrect. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        message.textContent = "Please enter a valid email address.";
      } else {
        message.textContent =
          "We couldn't sign you in. Please try again.";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML =
        'Sign in <span class="submit-arrow" aria-hidden="true">→</span>';
    }
  });
}


// 4. Sign in with Google
const googleLoginBtn = document.getElementById("googleLoginBtn");
const googleRegisterBtn = document.getElementById("googleRegisterBtn");
const googleProvider = new GoogleAuthProvider();

async function handleGoogleSignIn(button) {
  const message =
    document.getElementById("formMessage") ||
    document.getElementById("registerMessage");

  button.disabled = true;
  button.textContent = "Connecting to Google...";

  if (message) message.textContent = "";

  try {

    googleProvider.setCustomParameters({
      prompt: "select_account"
    });


    const result = await signInWithPopup(auth, googleProvider);

    await saveUserProfile(result.user);

    console.log("Google sign-in successful:", result.user.email);

    
    const userRef = doc(db, "users", result.user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new Error("User profile not found.");
    }

  const role = userSnapshot.data().role;

    console.log("Logged-in email:", result.user.email);
    console.log("Firestore role:", role);
    console.log("User UID:", result.user.uid);

    if (role === "admin") {
      window.location.href = "./admin-dashboard.html";
    } else {
      window.location.href = "./dashboard.html";
    }

    return;

    

    if (message) {
      message.textContent =
        `Welcome, ${result.user.displayName || "Feedora user"}!`;
    }

    window.location.href = "./dashboard.html";
    return;

  } catch (error) {
    console.error("Google sign-in error:", error);

    if (message) {
      if (error.code === "auth/popup-closed-by-user") {
        message.textContent = "Google sign-in was cancelled.";
      } else if (error.code === "auth/popup-blocked") {
        message.textContent = "Your browser blocked the Google sign-in window.";
      } else if (error.code === "auth/unauthorized-domain") {
        message.textContent =
          "This website domain is not authorized in Firebase.";
      } else {
        message.textContent = "Google sign-in failed. Please try again.";
      }
    }
  } finally {
    button.disabled = false;
    button.innerHTML = `
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt=""
        class="google-icon"
      >
      Continue with Google
    `;
  }
}

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", () => {
    handleGoogleSignIn(googleLoginBtn);
  });
}

if (googleRegisterBtn) {
  googleRegisterBtn.addEventListener("click", () => {
    handleGoogleSignIn(googleRegisterBtn);
  });
}


// 5. Forgot password
const forgotPasswordLink = document.getElementById("forgotPassword");

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const message = document.getElementById("formMessage");

    if (!emailInput || !message) return;

    const email = emailInput.value.trim();

    if (!email) {
      message.textContent = "Please enter your email address first.";
      emailInput.focus();
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      message.textContent =
        "If an account exists for this email, a password-reset email will be sent. Please check your inbox and spam folder.";

    } catch (error) {
      console.error("Password reset error:", error);

      if (error.code === "auth/invalid-email") {
        message.textContent = "Please enter a valid email address.";
      } else {
        message.textContent =
          "We couldn't process your request. Please try again.";
      }
    }
  });
}


