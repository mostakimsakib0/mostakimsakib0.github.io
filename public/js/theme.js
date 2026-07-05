(function () {
  var storageKey = "theme-preference";
  var toggle = document.getElementById("theme-toggle");
  var icon = document.getElementById("theme-icon");

  if (!toggle) return;

  function getPreferredTheme() {
    var stored = localStorage.getItem(storageKey);
    if (stored) return stored;
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemDark ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(storageKey, theme);
    if (icon) {
      icon.textContent = theme === "dark" ? "🌙" : "☀️";
    }
  }

  setTheme(getPreferredTheme());

  toggle.addEventListener("click", function () {
    var current = getPreferredTheme();
    setTheme(current === "dark" ? "light" : "dark");
  });
})();
