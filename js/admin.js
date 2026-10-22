
import { auth, db } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


import {
    doc,
    getDoc,
    collection,
    getDocs,
    collectionGroup
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

        
    /* Display admin account details */
    const adminName = document.getElementById("sidebarUserName");
    const adminEmail = document.getElementById("sidebarUserEmail");
    const userAvatar = document.getElementById("userAvatar");

    const settingsAdminName = document.getElementById("settingsAdminName");
    const settingsAdminEmail = document.getElementById("settingsAdminEmail");

    const displayName = user.displayName || "Feedora Admin";

    if (adminName) {
        adminName.textContent = displayName;
    }

    if (adminEmail) {
        adminEmail.textContent = user.email || "No email available";
    }

    if (userAvatar) {
        userAvatar.textContent = displayName.charAt(0).toUpperCase();
    }
    if (settingsAdminName) {
    settingsAdminName.textContent = displayName;
    }

    if (settingsAdminEmail) {
        settingsAdminEmail.textContent = user.email || "No email available";
    } 


    await loadRegisteredUsers();
    await loadTotalCalculations();
    await loadTotalFormulations();
    await loadActiveUsers();
    await loadUsersTable();
    setupUserSearch();
    await loadCalculationsTable();
    await loadUsageAnalytics();


    console.log("Admin access verified.");
  } catch (error) {
    console.error("Admin access check failed:", error);

    window.location.replace("./login.html");
  }
});


async function loadRegisteredUsers() {
    try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        document.getElementById("totalUsers").textContent =
            usersSnapshot.size;

    } catch (error) {
        console.error("Error loading registered users:", error);
    }
}


async function loadTotalCalculations() {
    try {
        const historyRef = collectionGroup(db, "history");
        const historySnapshot = await getDocs(historyRef);

        document.getElementById("totalCalculations").textContent =
            historySnapshot.size;

    } catch (error) {
        console.error("Error loading total calculations:", error);
    }
}


async function loadTotalFormulations() {
    try {
        const formulationsRef = collectionGroup(db, "formulations");
        const formulationsSnapshot = await getDocs(formulationsRef);

        document.getElementById("totalFormulations").textContent =
            formulationsSnapshot.size;

    } catch (error) {
        console.error("Error loading total formulations:", error);
    }
}


async function loadActiveUsers() {
    try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        const activeCount = usersSnapshot.docs.filter((userDoc) => {
            const lastLoginAt = userDoc.data().lastLoginAt;

            return lastLoginAt &&
                lastLoginAt.toMillis() >= thirtyDaysAgo;
        }).length;

        document.getElementById("activeUsers").textContent = activeCount;

    } catch (error) {
        console.error("Error loading active users:", error);
    }
}


async function loadUsersTable() {
    const tableBody = document.getElementById("usersTableBody");

    try {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        if (usersSnapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">No registered users found.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = "";

        usersSnapshot.forEach((userDoc) => {
            const user = userDoc.data();

            const registeredDate = user.createdAt
                ? user.createdAt.toDate().toLocaleDateString()
                : "Not available";

            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = user.fullName || "No name";

            const emailCell = document.createElement("td");
            emailCell.textContent = user.email || "No email";

            const roleCell = document.createElement("td");
            roleCell.textContent = user.role || "user";

            const dateCell = document.createElement("td");
            dateCell.textContent = registeredDate;

            row.append(nameCell, emailCell, roleCell, dateCell);
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading users table:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">Unable to load users. Please try again.</td>
            </tr>
        `;
    }
}


function setupUserSearch() {
    const searchInput = document.getElementById("userSearch");
    const tableBody = document.getElementById("usersTableBody");

    if (!searchInput || !tableBody) return;

    searchInput.addEventListener("input", () => {
        const searchText = searchInput.value.toLowerCase().trim();
        const rows = tableBody.querySelectorAll("tr");

        rows.forEach((row) => {
            const userName = row.cells[0]?.textContent.toLowerCase() || "";
            const userEmail = row.cells[1]?.textContent.toLowerCase() || "";

            if (row.cells.length < 4) return;

            row.style.display =
                userName.includes(searchText) ||
                userEmail.includes(searchText)
                    ? ""
                    : "none";
        });
    });
}


async function loadCalculationsTable() {
    const tableBody = document.getElementById("calculationsTableBody");

    try {
        const historyRef = collectionGroup(db, "history");
        const historySnapshot = await getDocs(historyRef);

        if (historySnapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">No calculations found.</td>
                </tr>
            `;
            return;
        }

        const calculations = historySnapshot.docs.map((historyDoc) => ({
            id: historyDoc.id,
            userId: historyDoc.ref.parent.parent?.id || "Unknown",
            ...historyDoc.data()
        }));

        calculations.sort((a, b) => {
            const dateA = a.createdAt?.toMillis?.() || 0;
            const dateB = b.createdAt?.toMillis?.() || 0;
            return dateB - dateA;
        });

        tableBody.innerHTML = "";

        calculations.slice(0, 20).forEach((calculation) => {
            const row = document.createElement("tr");

            const userCell = document.createElement("td");
            userCell.textContent = calculation.userId;

            const feedCell = document.createElement("td");
            feedCell.textContent =
                calculation.feedName ||
                calculation.name ||
                "Unnamed feed";

            const dateCell = document.createElement("td");
            dateCell.textContent = calculation.createdAt?.toDate
                ? calculation.createdAt.toDate().toLocaleString()
                : "Not available";

            row.append(userCell, feedCell, dateCell);
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading calculation activity:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="3">Unable to load calculations.</td>
            </tr>
        `;
    }
}

async function loadUsageAnalytics() {
    const analyticsContainer = document.getElementById("usageAnalytics");

    try {
        const historyRef = collectionGroup(db, "history");
        const historySnapshot = await getDocs(historyRef);

        const dailyCounts = {};

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - i);

            const dateKey = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
            ].join("-");

            dailyCounts[dateKey] = 0;
        }

        historySnapshot.forEach((historyDoc) => {
            const calculation = historyDoc.data();
            const timestamp = calculation.createdAt;

            if (!timestamp?.toDate) return;

            const date = timestamp.toDate();

            const dateKey = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
            ].join("-");

            if (dateKey in dailyCounts) {
                dailyCounts[dateKey]++;
            }
        });

        
          analyticsContainer.innerHTML = "";

          const maxCount = Math.max(...Object.values(dailyCounts), 1);

          Object.entries(dailyCounts).forEach(([date, count]) => {
              const row = document.createElement("p");

              const barWidth = (count / maxCount) * 100;
              row.style.setProperty("--bar-width", `${barWidth}%`);

              row.textContent = `${date}: ${count} calculation(s)`;

              analyticsContainer.appendChild(row);
          });


    } catch (error) {
        console.error("Error loading usage analytics:", error);
        analyticsContainer.textContent = "Unable to load analytics.";
    }
}




/* Mobile sidebar toggle */
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

function closeSidebar() {
    if (!sidebar || !menuToggle) return;

    sidebar.classList.remove("active");
    sidebarBackdrop?.classList.remove("active");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    menuToggle.textContent = "☰";
}

if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("active");

        sidebarBackdrop?.classList.toggle("active", isOpen);

        menuToggle.setAttribute("aria-expanded", isOpen);
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
        menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    sidebarBackdrop?.addEventListener("click", closeSidebar);

    sidebar.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeSidebar);
    });
}


/* Admin Logout */
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            logoutBtn.disabled = true;
            logoutBtn.textContent = "Logging out...";

            await signOut(auth);

            window.location.replace("./login.html");

        } catch (error) {
            console.error("Logout failed:", error);

            logoutBtn.disabled = false;
            logoutBtn.textContent = "Log out";

            alert("Unable to log out. Please try again.");
        }
    });
}

/* Admin sidebar active navigation */
const adminNavLinks = document.querySelectorAll(".sidebar-nav .nav-link");

adminNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
        adminNavLinks.forEach((navLink) => {
            navLink.classList.remove("active");
            navLink.removeAttribute("aria-current");
        });

        link.classList.add("active");
        link.setAttribute("aria-current", "page");
    });
});

