
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Get HTML elements
const batchSizeInput = document.getElementById("batchSize");
const ingredientRows = document.getElementById("ingredientRows");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const calculateBtn = document.getElementById("calculateBtn");

const formulationNameInput = document.getElementById("formulationName");
const saveFormulationBtn = document.getElementById("saveFormulationBtn");
const saveFormulationMessage = document.getElementById("saveFormulationMessage");

let latestCalculation = null;

const percentageStatus = document.getElementById("percentageStatus");
const calculatorMessage = document.getElementById("calculatorMessage");

const resultBatch = document.getElementById("resultBatch");
const resultCost = document.getElementById("resultCost");
const resultCostPerKg = document.getElementById("resultCostPerKg");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const logoutBtn = document.getElementById("logoutBtn");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserEmail = document.getElementById("sidebarUserEmail");
const userAvatar = document.getElementById("userAvatar");

// Format amounts as Nigerian naira
function formatNaira(amount) {
  return "₦" + amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Read the ingredient rows
function getIngredientRows() {
  return [...ingredientRows.querySelectorAll(".ingredient-row")];
}

// Update the displayed percentage total
function updatePercentageTotal() {
  const total = getIngredientRows().reduce((sum, row) => {
    const input = row.querySelector(".ingredient-percentage");
    const value = input.value.trim() === "" ? 0 : Number(input.value);

    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  percentageStatus.textContent =
    `Total inclusion: ${Number(total.toFixed(4))}%`;

  percentageStatus.style.color =
    Math.abs(total - 100) < 0.0001 ? "#183D2B" : "#9B7220";
}

// Clear previous results
function clearResults() {
    latestCalculation = null;

    resultBatch.textContent = "— kg";
    resultCost.textContent = "₦—";
    resultCostPerKg.textContent = "₦—";

  getIngredientRows().forEach((row) => {
    row.querySelector(".ingredient-quantity").textContent = "—";
    row.querySelector(".ingredient-cost").textContent = "—";
  });
}

// Add a new ingredient row
function addIngredientRow() {
  const row = document.createElement("tr");
  row.className = "ingredient-row";

  row.innerHTML = `
    <td>
      <input
        type="text"
        class="ingredient-name"
        placeholder="e.g. Soybean meal"
        aria-label="Ingredient name"
      >
    </td>

    <td>
      <input
        type="number"
        class="ingredient-percentage"
        min="0"
        max="100"
        step="any"
        placeholder="0"
        aria-label="Inclusion percentage"
      >
    </td>

    <td>
      <input
        type="number"
        class="ingredient-price"
        min="0"
        step="any"
        placeholder="0"
        aria-label="Price per kilogram"
      >
    </td>

    <td class="ingredient-quantity">—</td>
    <td class="ingredient-cost">—</td>

    <td>
      <button
        class="remove-ingredient"
        type="button"
        aria-label="Remove ingredient"
      >×</button>
    </td>
  `;

  ingredientRows.appendChild(row);
  updatePercentageTotal();
  clearResults();
  calculatorMessage.textContent = "";
}

// Add ingredient button
addIngredientBtn.addEventListener("click", addIngredientRow);

// Handle ingredient percentage changes and row removal
ingredientRows.addEventListener("input", (event) => {
  if (event.target.classList.contains("ingredient-percentage")) {
    updatePercentageTotal();
    clearResults();
    calculatorMessage.textContent = "";
  } else if (
    event.target.classList.contains("ingredient-name") ||
    event.target.classList.contains("ingredient-price")
  ) {
    clearResults();
    calculatorMessage.textContent = "";
  }
});

ingredientRows.addEventListener("click", (event) => {
  const removeBtn = event.target.closest(".remove-ingredient");

  if (!removeBtn) return;

  const rows = getIngredientRows();

  if (rows.length <= 1) {
    calculatorMessage.textContent =
      "Keep at least one ingredient row in your formulation.";
    return;
  }

  removeBtn.closest(".ingredient-row").remove();

  updatePercentageTotal();
  clearResults();
  calculatorMessage.textContent = "";
});

// Changing the batch size invalidates old results
batchSizeInput.addEventListener("input", () => {
  clearResults();
  calculatorMessage.textContent = "";
});

// Calculate the formulation
calculateBtn.addEventListener("click", async () => {
  calculatorMessage.textContent = "";

  const batchSize = Number(batchSizeInput.value);
  const rows = getIngredientRows();

  if (
    batchSizeInput.value.trim() === "" ||
    !Number.isFinite(batchSize) ||
    batchSize <= 0
  ) {
    calculatorMessage.textContent =
      "Enter a batch size greater than zero.";
    clearResults();
    return;
  }

  if (rows.length === 0) {
    calculatorMessage.textContent =
      "Add at least one ingredient.";
    clearResults();
    return;
  }

  let totalPercentage = 0;
  let totalCost = 0;
  const ingredients = [];

  for (const row of rows) {
    const name = row.querySelector(".ingredient-name").value.trim();
    const percentageInput =
      row.querySelector(".ingredient-percentage");
    const priceInput = row.querySelector(".ingredient-price");

    const percentage =
      percentageInput.value.trim() === ""
        ? NaN
        : Number(percentageInput.value);

    const price =
      priceInput.value.trim() === ""
        ? NaN
        : Number(priceInput.value);

    if (!name) {
      calculatorMessage.textContent =
        "Enter a name for every ingredient.";
      clearResults();
      return;
    }

    if (
      percentageInput.value.trim() === "" ||
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      calculatorMessage.textContent =
        `Enter a percentage from 0 to 100 for ${name}.`;
      clearResults();
      return;
    }

    if (
      priceInput.value.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      calculatorMessage.textContent =
        `Enter a valid price of zero or more for ${name}.`;
      clearResults();
      return;
    }

    totalPercentage += percentage;

    const quantity = batchSize * percentage / 100;
    const cost = quantity * price;

    totalCost += cost;

    
    ingredients.push({
        row,
        name,
        percentage,
        price,
        quantity,
        cost
    });

  }

  if (Math.abs(totalPercentage - 100) > 0.0001) {
    calculatorMessage.textContent =
      `Your ingredient percentages total ${Number(totalPercentage.toFixed(4))}%. They must add up to 100% before calculation.`;
    clearResults();
    return;
  }

  // Display results
  ingredients.forEach((ingredient) => {
    ingredient.row.querySelector(".ingredient-quantity").textContent =
      `${ingredient.quantity.toLocaleString("en-NG", {
        maximumFractionDigits: 3
      })} kg`;

    ingredient.row.querySelector(".ingredient-cost").textContent =
      formatNaira(ingredient.cost);
  });

  resultBatch.textContent =
    `${batchSize.toLocaleString("en-NG")} kg`;

  resultCost.textContent = formatNaira(totalCost);

  
    resultCostPerKg.textContent =
    formatNaira(totalCost / batchSize);

    // Keep the successful calculation ready to save.
    latestCalculation = {
    batchSize,
    totalPercentage,
    totalCost,
    costPerKg: totalCost / batchSize,
    ingredients: ingredients.map(({ name, percentage, price, quantity, cost }) => ({
        name,
        percentage,
        price,
        quantity,
        cost
    }))
    };

    
  // Save this successful calculation to history.
  const user = auth.currentUser;

  if (user) {
    try {
      await addDoc(
        collection(db, "users", user.uid, "history"),
        {
          name: "Feed calculation",
          batchSize: latestCalculation.batchSize,
          totalPercentage: latestCalculation.totalPercentage,
          totalCost: latestCalculation.totalCost,
          costPerKg: latestCalculation.costPerKg,
          ingredients: latestCalculation.ingredients,
          createdAt: serverTimestamp()
        }
      );
    } catch (error) {
      console.error("Error saving calculation history:", error);

      calculatorMessage.textContent =
        "Calculation completed, but history could not be saved. Please check your connection and try again.";
    }
  }

});



 // Save a formulation to Firestore
saveFormulationBtn.addEventListener("click", async () => {
  saveFormulationMessage.textContent = "";

  // Check that a successful calculation exists.
  if (!latestCalculation) {
    saveFormulationMessage.textContent =
      "Please calculate a valid formulation before saving.";
    return;
  }

  // Check the formulation name.
  const name = formulationNameInput.value.trim();

  if (!name) {
    saveFormulationMessage.textContent =
      "Please enter a name for your formulation.";
    formulationNameInput.focus();
    return;
  }

  // Check the signed-in user.
  const user = auth.currentUser;

  if (!user) {
    saveFormulationMessage.textContent =
      "Please log in again before saving.";
    return;
  }

  saveFormulationBtn.disabled = true;
  saveFormulationBtn.textContent = "Saving...";

  try {
    await addDoc(collection(db, "users", user.uid, "formulations"), {
      userId: user.uid,
      name: name,
      batchSize: latestCalculation.batchSize,
      totalPercentage: latestCalculation.totalPercentage,
      totalCost: latestCalculation.totalCost,
      costPerKg: latestCalculation.costPerKg,
      ingredients: latestCalculation.ingredients,
      createdAt: serverTimestamp()
    });

    Swal.fire({
      icon: "success",
      title: "Formulation Saved!",
      text: "Your feed formulation has been saved successfully.",
      confirmButtonText: "Great!",
      confirmButtonColor: "#183D2B"
    });

    formulationNameInput.value = "";
  } catch (error) {
    console.error("Error saving formulation:", error);

    saveFormulationMessage.textContent =
      "Unable to save your formulation. Please try again.";
  } finally {
    saveFormulationBtn.disabled = false;
    saveFormulationBtn.textContent = "Save Formulation";
  }
});



// Mobile sidebar
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

// Protect the page and show account information
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("./login.html");
    return;
  }

  const displayName = user.displayName || "Feedora User";

  sidebarUserName.textContent = displayName;
  sidebarUserEmail.textContent =
    user.email || "Account email unavailable";
  userAvatar.textContent = displayName.charAt(0).toUpperCase();
});

// Log out
logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;

  try {
    await signOut(auth);
    window.location.replace("./login.html");
  } catch (error) {
    console.error("Logout failed:", error);

    calculatorMessage.textContent =
      "Unable to log out. Please try again.";

    logoutBtn.disabled = false;
  }
});

// Initial display
updatePercentageTotal();
