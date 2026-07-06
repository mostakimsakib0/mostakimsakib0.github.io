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

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
      toggleMenu(true);
    }
  });

  /* ─── Staggered reveal animations ─── */
  (function () {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { obs.observe(el); });
  })();

  /* ─── Animated Counters ─── */
  (function () {
    var els = document.querySelectorAll(".hero-image-stat .stat-value");
    if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.textContent, 10);
          if (!isNaN(target) && target > 0) {
            var duration = 1200;
            var start = null;
            function step(ts) {
              if (!start) start = ts;
              var p = Math.min((ts - start) / duration, 1);
              var eased = 1 - Math.pow(1 - p, 3);
              el.textContent = Math.floor(0 + (target - 0) * eased);
              if (p < 1) requestAnimationFrame(step);
              else el.textContent = target;
            }
            requestAnimationFrame(step);
          }
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { obs.observe(el); });
  })();

  /* ─── Skill bars: animate fill on scroll ─── */
  (function () {
    var els = document.querySelectorAll(".skill-bar-fill");
    if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("animated");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    els.forEach(function (el) { obs.observe(el); });
  })();

  /* ─── Floating background particles ─── */
  (function () {
    var field = document.createElement("div");
    field.className = "particle-field";
    field.setAttribute("aria-hidden", "true");
    document.body.appendChild(field);
    var count = Math.min(Math.floor(window.innerWidth / 60), 20);
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "particle";
      var s = Math.random() * 6 + 2;
      p.style.width = s + "px";
      p.style.height = s + "px";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = (Math.random() * 30 + 20) + "s";
      p.style.animationDelay = (Math.random() * 40) + "s";
      field.appendChild(p);
    }
  })();

  /* ─── 3D Tilt on Hero Image ─── */
  (function () {
    var el = document.getElementById("tilt-image");
    if (!el) return;

    var isMobile = window.matchMedia("(hover: none)").matches;
    if (isMobile) return;

    el.addEventListener("mousemove", function (e) {
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var cx = rect.width / 2;
      var cy = rect.height / 2;
      var dx = (x - cx) / cx;
      var dy = (y - cy) / cy;
      el.style.transform =
        "perspective(600px) rotateY(" + (dx * 10) + "deg) rotateX(" + (-dy * 10) + "deg)";
    });

    el.addEventListener("mouseleave", function () {
      el.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg)";
    });
  })();

  /* ─── Button Ripple ─── */
  (function () {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".button");
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement("span");
      ripple.className = "ripple-effect";
      var size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", function () {
        ripple.remove();
      });
    });
  })();

  /* ─── Magnetic Buttons ─── */
  (function () {
    var wraps = document.querySelectorAll(".magnetic-wrap");
    if (!wraps.length) return;

    var isMobile = window.matchMedia("(hover: none)").matches;
    if (isMobile) return;

    wraps.forEach(function (wrap) {
      wrap.addEventListener("mousemove", function (e) {
        var rect = wrap.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        var dist = Math.sqrt(x * x + y * y);
        var maxDist = 150;
        var strength = Math.min(dist / maxDist, 1);
        var moveX = x * 0.2 * strength;
        var moveY = y * 0.2 * strength;
        wrap.style.transform = "translate(" + moveX + "px, " + moveY + "px)";
      });

      wrap.addEventListener("mouseleave", function () {
        wrap.style.transform = "translate(0, 0)";
      });
    });
  })();

  /* ─── Featured Carousel ─── */
  (function () {
    var track = document.getElementById("carousel-track");
    var prevBtn = document.getElementById("carousel-prev");
    var nextBtn = document.getElementById("carousel-next");
    var dots = document.querySelectorAll(".carousel-dot");
    if (!track || !dots.length) return;

    var slideW = 100;
    var current = 0;
    var total = dots.length;
    var interval;

    function goTo(index) {
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;
      current = index;
      track.style.transform = "translateX(-" + (current * slideW) + "%)";
      dots.forEach(function (d, i) {
        d.classList.toggle("active", i === current);
      });
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAuto() {
      interval = setInterval(next, 5000);
    }
    function stopAuto() {
      clearInterval(interval);
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { stopAuto(); prev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { stopAuto(); next(); startAuto(); });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        stopAuto();
        goTo(parseInt(this.getAttribute("data-slide")));
        startAuto();
      });
    });

    var carousel = document.getElementById("featured-carousel");
    if (carousel) {
      carousel.addEventListener("mouseenter", stopAuto);
      carousel.addEventListener("mouseleave", startAuto);
    }

    if (total > 1) startAuto();
  })();
})();
