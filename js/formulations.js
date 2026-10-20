
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
  deleteDoc,
  updateDoc

} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Get HTML elements
const formulationsList = document.getElementById("formulationsList");
const formulationCount = document.getElementById("formulationCount");
const formulationsMessage = document.getElementById("formulationsMessage");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const logoutBtn = document.getElementById("logoutBtn");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserEmail = document.getElementById("sidebarUserEmail");
const userAvatar = document.getElementById("userAvatar");

// Format amounts as Nigerian naira
function formatNaira(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format the saved date
function formatDate(timestamp) {
  if (!timestamp) return "Date unavailable";

  const date = timestamp.toDate();

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// Display one formulation
function createFormulationCard(formulation) {
  const card = document.createElement("article");
  card.className = "formulation-card";
  card.dataset.id = formulation.id;

  const heading = document.createElement("h3");
  heading.textContent = formulation.name || "Untitled formulation";

  const date = document.createElement("p");
  date.className = "formulation-date";
  date.textContent = "Saved: " + formatDate(formulation.createdAt);

  const details = document.createElement("div");
  details.className = "formulation-details";

  const batch = document.createElement("p");
  batch.textContent =
    "Batch size: " + Number(formulation.batchSize || 0).toLocaleString("en-NG") + " kg";

  const cost = document.createElement("p");
  cost.textContent = "Total cost: " + formatNaira(formulation.totalCost);

  const costPerKg = document.createElement("p");
  costPerKg.textContent = "Cost per kg: " + formatNaira(formulation.costPerKg);

  details.append(batch, cost, costPerKg);

  const ingredientHeading = document.createElement("h4");
  ingredientHeading.textContent = "Ingredients";

  const ingredientList = document.createElement("ul");
  ingredientList.className = "formulation-ingredients";

  (Array.isArray(formulation.ingredients) ? formulation.ingredients : [])
    .forEach((ingredient) => {
      const item = document.createElement("li");

      item.textContent =
        `${ingredient.name} — ${ingredient.percentage}% | ` +
        `${Number(ingredient.quantity || 0).toLocaleString("en-NG", {
          maximumFractionDigits: 3
        })} kg | ${formatNaira(ingredient.price)} per kg`;

      ingredientList.appendChild(item);
    });

    const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "view-formulation-btn";
        viewButton.textContent = "View Details";

        
viewButton.addEventListener("click", async () => {
  const ingredients = Array.isArray(formulation.ingredients)
    ? formulation.ingredients
    : [];

  const ingredientRows = ingredients.map((ingredient) => `
    <tr>
      <td>${ingredient.name || "Unnamed ingredient"}</td>
      <td>${Number(ingredient.percentage || 0)}%</td>
      <td>${Number(ingredient.quantity || 0).toLocaleString("en-NG", {
        maximumFractionDigits: 3
      })} kg</td>
      <td>${formatNaira(ingredient.price)}</td>
      <td>${formatNaira(ingredient.cost)}</td>
    </tr>
  `).join("");

  const table = `
    <div style="overflow-x:auto; text-align:left;">
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr>
            <th style="padding:10px; text-align:left;">Ingredient</th>
            <th style="padding:10px;">%</th>
            <th style="padding:10px;">Quantity</th>
            <th style="padding:10px;">Price/kg</th>
            <th style="padding:10px;">Total</th>
          </tr>
        </thead>
        <tbody>${ingredientRows}</tbody>
      </table>
    </div>
  `;

  await Swal.fire({
    title: formulation.name || "Untitled formulation",
    html: `
      <div style="text-align:left; margin-bottom:18px; line-height:1.9;">
        <p><strong>Batch size:</strong> ${Number(formulation.batchSize || 0).toLocaleString("en-NG")} kg</p>
        <p><strong>Total cost:</strong> ${formatNaira(formulation.totalCost)}</p>
        <p><strong>Cost per kg:</strong> ${formatNaira(formulation.costPerKg)}</p>
        <p><strong>Total percentage:</strong> ${Number(formulation.totalPercentage || 0)}%</p>
      </div>
      <h3 style="text-align:left; margin-bottom:12px;">Ingredients</h3>
      ${table}
    `,
    confirmButtonText: "Close",
    confirmButtonColor: "#183D2B",
    width: "850px"
  });
});

    
const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-formulation-btn";
        editButton.textContent = "Edit name";
        editButton.setAttribute(
        "aria-label",
        `Edit name of ${formulation.name || "untitled formulation"}`
);

editButton.addEventListener("click", async () => {
  const result = await Swal.fire({
    title: "Edit formulation name",
    input: "text",
    inputValue: formulation.name || "",
    inputPlaceholder: "Enter formulation name",
    showCancelButton: true,
    confirmButtonText: "Save changes",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#183D2B",
    cancelButtonColor: "#6b7280",
    inputAttributes: {
      maxlength: 100,
      "aria-label": "Formulation name"
    },
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return "Please enter a formulation name.";
      }
    }
  });

  if (!result.isConfirmed) return;

  const newName = result.value.trim();

  if (newName === formulation.name) return;

  editButton.disabled = true;
  editButton.textContent = "Saving...";

  try {
    await updateDoc(
      doc(db, "users", auth.currentUser.uid, "formulations", formulation.id),
      { name: newName }
    );

    formulation.name = newName;
    heading.textContent = newName;
    editButton.setAttribute(
      "aria-label",
      `Edit name of ${newName}`
    );

    await Swal.fire({
      title: "Updated!",
      text: "Your formulation name has been updated.",
      icon: "success",
      confirmButtonColor: "#183D2B"
    });
  } catch (error) {
    console.error("Error updating formulation name:", error);

    await Swal.fire({
      title: "Unable to update",
      text: "Your formulation name could not be updated. Please try again.",
      icon: "error",
      confirmButtonColor: "#183D2B"
    });
  } finally {
    editButton.disabled = false;
    editButton.textContent = "Edit name";
  }
});

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-formulation-btn";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute(
        "aria-label",
        `Delete ${formulation.name || "untitled formulation"}`
        );

        deleteButton.addEventListener("click", async () => {
        const result = await Swal.fire({
            title: "Delete formulation?",
            text: `Are you sure you want to delete "${formulation.name || "Untitled formulation"}"? This action cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#b42318",
            cancelButtonColor: "#183D2B",
            reverseButtons: true,
            focusCancel: true
        });

if (!result.isConfirmed) return;

        deleteButton.disabled = true;
        deleteButton.textContent = "Deleting...";

        try {
            await deleteDoc(
            doc(db, "users", auth.currentUser.uid, "formulations", formulation.id)
            );

            card.remove();

            await Swal.fire({
                title: "Deleted!",
                text: "Your formulation has been deleted successfully.",
                icon: "success",
                confirmButtonText: "Done",
                confirmButtonColor: "#183D2B"
            });

            const remainingCards = formulationsList.querySelectorAll(".formulation-card").length;
            formulationCount.textContent =
            `${remainingCards} saved formulation${remainingCards === 1 ? "" : "s"}`;

            if (remainingCards === 0) {
            formulationsMessage.textContent =
                "You have no saved formulations. Use the Feed Calculator to create a new one.";
            }
        } catch (error) {
            console.error("Error deleting formulation:", error);
            deleteButton.disabled = false;
            deleteButton.textContent = "Delete";
            await Swal.fire({
                title: "Oops!",
                text: "Unable to delete this formulation. Please try again.",
                icon: "error",
                confirmButtonText: "Okay",
                confirmButtonColor: "#183D2B"
            });
        }
        });

        card.append(
        heading,
        date,
        details,
        ingredientHeading,
        ingredientList,
        viewButton,
        deleteButton,
        editButton
        );

        return card;
}

// Load only the signed-in user's formulations
async function loadFormulations(user) {
  formulationsList.replaceChildren();
  formulationsMessage.textContent = "";
  formulationCount.textContent = "Loading your formulations...";

  try {
    const formulationsRef = collection(
      db,
      "users",
      user.uid,
      "formulations"
    );

    const formulationsQuery = query(
      formulationsRef,
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(formulationsQuery);

    formulationCount.textContent =
      `${snapshot.size} saved formulation${snapshot.size === 1 ? "" : "s"}`;

    if (snapshot.empty) {
      formulationsMessage.textContent =
        "You haven't saved any formulations yet. Use the Feed Calculator to create your first one.";
      return;
    }

    snapshot.forEach((documentSnapshot) => {
            const formulation = {
        ...documentSnapshot.data(),
        id: documentSnapshot.id
        };

        formulationsList.appendChild(createFormulationCard(formulation));
    });
  } catch (error) {
    console.error("Error loading formulations:", error);

    formulationCount.textContent = "Unable to load formulations.";
    formulationsMessage.textContent =
      "We couldn't load your saved formulations. Please refresh the page and try again.";
  }
}

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

// Protect the page and load the signed-in user's data
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./login.html");
    return;
  }

  const displayName = user.displayName || "Feedora User";

  sidebarUserName.textContent = displayName;
  sidebarUserEmail.textContent = user.email || "Account email unavailable";
  userAvatar.textContent = displayName.charAt(0).toUpperCase();

  await loadFormulations(user);
});

// Log out
logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;

  try {
    await signOut(auth);
    window.location.replace("./login.html");
  } catch (error) {
    console.error("Logout failed:", error);

    formulationsMessage.textContent =
      "Unable to log out. Please try again.";

    logoutBtn.disabled = false;
  }
});
