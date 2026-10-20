const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const currentYear = document.getElementById("currentYear");

const root = document.documentElement;

// Update the theme and the theme button's accessible label.
function applyTheme(theme) {
  root.dataset.theme = theme;

  const isDark = theme === "dark";

  themeIcon.textContent = isDark ? "☀" : "☾";

  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );

  themeToggle.title = isDark
    ? "Switch to light mode"
    : "Switch to dark mode";
}

// Read the saved theme. Use light mode if none exists.
let savedTheme = "light";

try {
  savedTheme = localStorage.getItem("feedora-theme") || "light";
} catch (error) {
  // The page still works if browser storage is unavailable.
}

applyTheme(savedTheme);

// Switch between light and dark themes.
themeToggle.addEventListener("click", () => {
  const newTheme =
    root.dataset.theme === "dark" ? "light" : "dark";

  applyTheme(newTheme);

  try {
    localStorage.setItem("feedora-theme", newTheme);
  } catch (error) {
    // The theme still changes for the current page.
  }
});

// Open and close the mobile navigation.
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation"
  );
});

// Close the mobile navigation after choosing a section.
mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

// Display the current year automatically.
currentYear.textContent = new Date().getFullYear();
