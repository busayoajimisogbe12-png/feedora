
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const root = document.documentElement;

function applyTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : "light";

  root.dataset.theme = selectedTheme;

  if (themeIcon) {
    themeIcon.textContent =
      selectedTheme === "dark" ? "☀" : "☾";
  }

  if (themeToggle) {
    const label =
      selectedTheme === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode";

    themeToggle.setAttribute("aria-label", label);
    themeToggle.title = label;
  }
}

// Load the same preference used by the landing page
let savedTheme = "light";

try {
  savedTheme = localStorage.getItem("feedora-theme") || "light";
} catch (error) {
  // Continue with light mode if storage is unavailable
}

applyTheme(savedTheme);

// Change and save the selected theme
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const newTheme =
      root.dataset.theme === "dark" ? "light" : "dark";

    applyTheme(newTheme);

    try {
      localStorage.setItem("feedora-theme", newTheme);
    } catch (error) {
      // The theme still changes for the current page
    }
  });
}
