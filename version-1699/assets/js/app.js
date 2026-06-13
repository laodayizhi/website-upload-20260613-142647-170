(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        restart();
      });
    }

    if (slides.length > 1) {
      restart();
    }
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function applyFilter(input, scope, emptyState) {
    var keyword = normalize(input.value);
    var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = normalize(card.getAttribute("data-search") + " " + card.textContent);
      var match = !keyword || haystack.indexOf(keyword) !== -1;
      card.hidden = !match;
      if (match) {
        visible += 1;
      }
    });

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }
  }

  function setupInlineFilters() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-inline-filter]"));
    forms.forEach(function (form) {
      var input = form.querySelector("input");
      var section = form.closest("main");
      var scope = section ? section.querySelector("[data-filter-scope]") : null;
      var emptyState = section ? section.querySelector("[data-empty-state]") : null;
      if (!input || !scope) {
        return;
      }
      input.addEventListener("input", function () {
        applyFilter(input, scope, emptyState);
      });
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q) {
        input.value = q;
        applyFilter(input, scope, emptyState);
      }
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        applyFilter(input, scope, emptyState);
      });
    });
  }

  function setupPlayer() {
    var player = document.querySelector("[data-player]");
    if (!player) {
      return;
    }
    var video = player.querySelector("video");
    var overlay = player.querySelector(".player-overlay");
    var source = player.getAttribute("data-src");
    var started = false;
    var hls;

    function playVideo() {
      if (!video || !source) {
        return;
      }
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      video.setAttribute("controls", "controls");
      if (!started) {
        started = true;
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true });
          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          video.addEventListener("loadedmetadata", function () {
            video.play().catch(function () {});
          }, { once: true });
        } else {
          video.src = source;
          video.play().catch(function () {});
        }
      } else {
        video.play().catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener("click", playVideo);
    }

    video.addEventListener("click", function () {
      if (!started || video.paused) {
        playVideo();
      }
    });

    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupInlineFilters();
    setupPlayer();
  });
}());
