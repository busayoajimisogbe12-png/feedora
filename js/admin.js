
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  // Keep the dashboard hidden while checking access
  document.body.style.display = "none";

  if (!user) {
    window.location.replace("./login.html");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (
      !userSnapshot.exists() ||
      userSnapshot.data().role !== "admin"
    ) {
      window.location.replace("./dashboard.html");
      return;
    }

    // Reveal the page only after admin access is verified
    document.body.style.display = "block";

    console.log("Admin access verified.");
  } catch (error) {
    console.error("Admin access check failed:", error);

    window.location.replace("./login.html");
  }
});
