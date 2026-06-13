(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  ready(function () {
    var menuToggle = document.querySelector("[data-menu-toggle]");
    var siteNav = document.querySelector("[data-site-nav]");

    if (menuToggle && siteNav) {
      menuToggle.addEventListener("click", function () {
        siteNav.classList.toggle("is-open");
      });
    }

    document.querySelectorAll("img.poster-image, .hero-bg img, .hero-poster img").forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("is-missing");
      });
    });

    initHeroSlider();
    initFilters();
  });

  function initHeroSlider() {
    var slider = document.querySelector("[data-hero-slider]");

    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var prev = slider.querySelector("[data-hero-prev]");
    var next = slider.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initFilters() {
    var scopes = document.querySelectorAll("[data-filter-scope]");

    scopes.forEach(function (scope) {
      var input = scope.querySelector("[data-filter-input]");
      var typeSelect = scope.querySelector("[data-filter-type]");
      var yearSelect = scope.querySelector("[data-filter-year]");
      var regionSelect = scope.querySelector("[data-filter-region]");
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
      var emptyState = scope.querySelector("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q");

      if (query && input && !input.value) {
        input.value = query;
      }

      function filter() {
        var keyword = normalize(input ? input.value : "");
        var type = normalize(typeSelect ? typeSelect.value : "");
        var year = normalize(yearSelect ? yearSelect.value : "");
        var region = normalize(regionSelect ? regionSelect.value : "");
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-year"),
            card.getAttribute("data-type"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-tags"),
            card.textContent
          ].join(" "));
          var matched = true;

          if (keyword && haystack.indexOf(keyword) === -1) {
            matched = false;
          }

          if (type && normalize(card.getAttribute("data-type")) !== type) {
            matched = false;
          }

          if (year && normalize(card.getAttribute("data-year")) !== year) {
            matched = false;
          }

          if (region && normalize(card.getAttribute("data-region")) !== region) {
            matched = false;
          }

          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });

        if (emptyState) {
          emptyState.classList.toggle("is-visible", visible === 0);
        }
      }

      [input, typeSelect, yearSelect, regionSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", filter);
          control.addEventListener("change", filter);
        }
      });

      filter();
    });
  }
})();
