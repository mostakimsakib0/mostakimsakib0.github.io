(function () {
  var header = document.getElementById("site-header");
  var backToTop = document.getElementById("back-to-top");

  /* ─── Scroll effects ─── */
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        if (scrollY > 50) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
        if (scrollY > 400) {
          backToTop.classList.add("visible");
        } else {
          backToTop.classList.remove("visible");
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  /* ─── Back to top ─── */
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ─── Mobile menu ─── */
  var hamburger = document.getElementById("hamburger");
  var mobileMenu = document.getElementById("mobile-menu");

  function toggleMenu(open) {
    var isOpen = open !== undefined ? open : mobileMenu.classList.contains("open");
    if (isOpen) {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    } else {
      mobileMenu.classList.add("open");
      hamburger.classList.add("active");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
  }

  hamburger.addEventListener("click", function () {
    toggleMenu();
  });

  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      toggleMenu(true);
    });
  });

  /* ─── Reveal animations (staggered) ─── */
  var revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  /* ─── Keyboard: Escape closes mobile menu ─── */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
      toggleMenu(true);
    }
  });
})();
