(function () {
  var storageKey = "theme-preference";
  var toggle = document.getElementById("theme-toggle");

  if (!toggle) {
    return;
  }

  function getPreferredTheme() {
    var stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemDark ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(storageKey, theme);
  }

  toggle.addEventListener("click", function () {
    var current = getPreferredTheme();
    var next = current === "dark" ? "light" : "dark";
    setTheme(next);
  });
})();
