const toggle = document.querySelector("#theme-toggle");
const preference = matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme, save = false) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  toggle.setAttribute("aria-pressed", String(dark));
  toggle.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} mode`);
  if (save) localStorage.setItem("theme", theme);
}

applyTheme(document.documentElement.dataset.theme);
toggle.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));
preference.addEventListener("change", event => {
  if (!localStorage.getItem("theme")) applyTheme(event.matches ? "dark" : "light");
});

const lastUpdated = document.querySelector("#last-updated");
const modifiedDate = new Date(document.lastModified);

if (!Number.isNaN(modifiedDate.getTime())) {
  lastUpdated.textContent = `Last updated ${modifiedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  })}`;
}
