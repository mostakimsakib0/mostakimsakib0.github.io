(function () {
  var header = document.getElementById("site-header");
  var backToTop = document.getElementById("back-to-top");
  var progressBar = document.getElementById("progress-bar");

  /* ─── Scroll effects: header, back-to-top, progress bar ─── */
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;

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
        if (progressBar) {
          progressBar.style.width = (scrollY / maxScroll) * 100 + "%";
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

  /* ─── Keyboard: Escape closes mobile menu ─── */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
      toggleMenu(true);
    }
  });

  /* ─── Staggered reveal animations ─── */
  var revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  /* ─── Animated Counters ─── */
  var statValues = document.querySelectorAll(".hero-image-stat .stat-value");
  if (statValues.length) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var target = parseInt(el.textContent, 10);
            if (!isNaN(target) && target > 0) {
              animateCounter(el, target);
            }
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    statValues.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  function animateCounter(el, target) {
    var duration = 1200;
    var startTime = null;
    var startVal = 0;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(startVal + (target - startVal) * eased);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }

  /* ─── Skill bars: animate fill on scroll ─── */
  var skillFills = document.querySelectorAll(".skill-bar-fill");
  if (skillFills.length) {
    var skillObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("animated");
            skillObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    skillFills.forEach(function (el) {
      skillObserver.observe(el);
    });
  }

  /* ─── Floating background particles ─── */
  var particleField = document.createElement("div");
  particleField.className = "particle-field";
  particleField.setAttribute("aria-hidden", "true");
  document.body.appendChild(particleField);

  var particleCount = Math.min(Math.floor(window.innerWidth / 60), 20);
  for (var i = 0; i < particleCount; i++) {
    createParticle(particleField);
  }

  function createParticle(container) {
    var particle = document.createElement("div");
    particle.className = "particle";
    var size = Math.random() * 6 + 2;
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = (Math.random() * 30 + 20) + "s";
    particle.style.animationDelay = (Math.random() * 40) + "s";
    container.appendChild(particle);
  }
})();
