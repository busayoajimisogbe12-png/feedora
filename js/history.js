
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

 // Page elements
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const historyMessage = document.getElementById("historyMessage");

const historySearch = document.getElementById("historySearch");
const historyDate = document.getElementById("historyDate");
const clearHistoryFilters = document.getElementById("clearHistoryFilters");

// Store loaded history records for searching and filtering
let allHistoryRecords = [];


 // Search as the user types
historySearch.addEventListener("input", filterHistoryRecords);

// Filter when the date changes
historyDate.addEventListener("change", filterHistoryRecords);

// Clear both filters
clearHistoryFilters.addEventListener("click", () => {
  historySearch.value = "";
  historyDate.value = "";
  filterHistoryRecords();
});



const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const logoutBtn = document.getElementById("logoutBtn");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserEmail = document.getElementById("sidebarUserEmail");
const userAvatar = document.getElementById("userAvatar");

// Format money in Nigerian naira
function formatNaira(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format Firestore dates safely
function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "Date unavailable";
  }

  return timestamp.toDate().toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}


 // Create a history card
function createHistoryCard(record) {
  const card = document.createElement("article");
  card.className = "formulation-card history-card";

  const heading = document.createElement("h3");
  heading.textContent = record.name || "Feed calculation";

  const date = document.createElement("p");
  date.className = "formulation-date";
  date.textContent = "Calculated: " + formatDate(record.createdAt);

  const details = document.createElement("div");
  details.className = "formulation-details";

  const batch = document.createElement("p");
  batch.textContent =
    "Batch size: " +
    Number(record.batchSize || 0).toLocaleString("en-NG") +
    " kg";

  const totalCost = document.createElement("p");
  totalCost.textContent = "Total cost: " + formatNaira(record.totalCost);

  const costPerKg = document.createElement("p");
  costPerKg.textContent =
    "Cost per kg: " + formatNaira(record.costPerKg);

  details.append(batch, totalCost, costPerKg);

  // View Details button
  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.className = "view-history-btn";
  viewButton.textContent = "View Details";

  
viewButton.addEventListener("click", () => {
  showHistoryDetails(record);
});

// Delete History button
const deleteButton = document.createElement("button");
deleteButton.type = "button";
deleteButton.className = "delete-history-btn";
deleteButton.textContent = "Delete";

deleteButton.addEventListener("click", () => {
  deleteHistoryRecord(record.id);
});

const actionButtons = document.createElement("div");
actionButtons.className = "history-action-buttons";
actionButtons.append(viewButton, deleteButton);

card.append(heading, date, details, actionButtons);

return card;

}


// Show full details of a calculation
function showHistoryDetails(record) {
  const ingredients = record.ingredients || [];

  const detailsContainer = document.createElement("div");

  const batchInfo = document.createElement("p");
  batchInfo.textContent =
    "Batch size: " +
    Number(record.batchSize || 0).toLocaleString("en-NG") +
    " kg";

  const totalCostInfo = document.createElement("p");
  totalCostInfo.textContent =
    "Total cost: " + formatNaira(record.totalCost);

  const costPerKgInfo = document.createElement("p");
  costPerKgInfo.textContent =
    "Cost per kg: " + formatNaira(record.costPerKg);

  detailsContainer.append(batchInfo, totalCostInfo, costPerKgInfo);

  const heading = document.createElement("h4");
  heading.textContent = "Ingredients";

  detailsContainer.appendChild(heading);

  if (ingredients.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No ingredient details are available.";
    detailsContainer.appendChild(message);
  } else {
    const table = document.createElement("table");
    table.className = "history-ingredients-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    ["Ingredient", "Percentage", "Quantity (kg)", "Price/kg", "Cost"].forEach(
      (label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headerRow.appendChild(th);
      }
    );

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    ingredients.forEach((ingredient) => {
      const row = document.createElement("tr");

      const values = [
        ingredient.name || "Unnamed ingredient",
        `${Number(ingredient.percentage || 0)}%`,
        Number(ingredient.quantity || 0).toLocaleString("en-NG", {
          maximumFractionDigits: 3
        }),
        formatNaira(ingredient.price),
        formatNaira(ingredient.cost)
      ];

      values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    detailsContainer.appendChild(table);
  }

  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: record.name || "Feed calculation",
      html: detailsContainer,
      width: "900px",
      confirmButtonText: "Close"
    });
    console.log(typeof Swal);
    
  } else {
    alert(
      "Calculation details are ready, but the details popup library is unavailable."
    );
  }
}



 // Search and filter the loaded history records
function filterHistoryRecords() {
  const searchTerm = historySearch.value.trim().toLowerCase();
  const selectedDate = historyDate.value;

  const filteredRecords = allHistoryRecords.filter((record) => {
    const recordName = (record.name || "Feed calculation").toLowerCase();

    const matchesName = recordName.includes(searchTerm);

    let matchesDate = true;

    if (selectedDate) {
      if (record.createdAt && typeof record.createdAt.toDate === "function") {
        const recordDate = record.createdAt.toDate();

        const year = recordDate.getFullYear();
        const month = String(recordDate.getMonth() + 1).padStart(2, "0");
        const day = String(recordDate.getDate()).padStart(2, "0");

        const formattedDate = `${year}-${month}-${day}`;
        matchesDate = formattedDate === selectedDate;
      } else {
        matchesDate = false;
      }
    }

    return matchesName && matchesDate;
  });

  historyList.replaceChildren();

  if (filteredRecords.length === 0) {
    historyMessage.textContent =
      "No calculations match your search or selected date.";
  } else {
    historyMessage.textContent = "";

    filteredRecords.forEach((record) => {
      historyList.appendChild(createHistoryCard(record));
    });
  }

  historyCount.textContent =
    `${filteredRecords.length} of ${allHistoryRecords.length} calculation` +
    `${allHistoryRecords.length === 1 ? "" : "s"}`;
}


 // Delete one calculation history record
async function deleteHistoryRecord(recordId) {
  const user = auth.currentUser;

  if (!user || !recordId) {
    historyMessage.textContent =
      "Unable to identify this calculation. Please refresh and try again.";
    return;
  }

  if (typeof Swal === "undefined") {
    alert("The confirmation popup is unavailable. Please try again.");
    return;
  }

  const result = await Swal.fire({
    title: "Delete this calculation?",
    text: "This history record will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#183D2B",
    cancelButtonColor: "#777777"
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    await deleteDoc(
      doc(db, "users", user.uid, "history", recordId)
    );

    await Swal.fire({
      title: "Deleted!",
      text: "The calculation history record has been deleted.",
      icon: "success",
      confirmButtonColor: "#183D2B"
    });

    await loadHistory(user);
  } catch (error) {
    console.error("Error deleting history record:", error);

    await Swal.fire({
      title: "Couldn't delete",
      text: "The record could not be deleted. Please try again.",
      icon: "error",
      confirmButtonColor: "#183D2B"
    });
  }
}


// Load the signed-in user's calculation history
async function loadHistory(user) {
  historyList.replaceChildren();
  historyMessage.textContent = "";
  historyCount.textContent = "Loading your history...";

  try {
    const historyRef = collection(db, "users", user.uid, "history");
    const historyQuery = query(historyRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(historyQuery);

    historyCount.textContent =
      `${snapshot.size} calculation${snapshot.size === 1 ? "" : "s"}`;

    if (snapshot.empty) {
      historyMessage.textContent =
        "No calculation history yet. Calculate a feed formulation to get started.";
      return;
    }

   
allHistoryRecords = snapshot.docs.map((documentSnapshot) => ({
  id: documentSnapshot.id,
  ...documentSnapshot.data()
}));

filterHistoryRecords();

  } catch (error) {
    console.error("Error loading calculation history:", error);
    historyCount.textContent = "Unable to load history.";
    historyMessage.textContent =
      "We couldn't load your calculation history. Please refresh and try again.";
  }
}

// Mobile sidebar controls
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
  if (event.key === "Escape") closeSidebar();
});

// Authentication
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./login.html");
    return;
  }

  const displayName = user.displayName || "Feedora User";

  sidebarUserName.textContent = displayName;
  sidebarUserEmail.textContent = user.email || "Account email unavailable";
  userAvatar.textContent = displayName.charAt(0).toUpperCase();

  await loadHistory(user);
});

// Logout
logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;

  try {
    await signOut(auth);
    window.location.replace("./login.html");
  } catch (error) {
    console.error("Logout failed:", error);
    historyMessage.textContent = "Unable to log out. Please try again.";
    logoutBtn.disabled = false;
  }
});