(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function markBrokenImages() {
    document.addEventListener('error', function (event) {
      var target = event.target;
      if (target && target.tagName === 'IMG') {
        target.classList.add('is-missing');
      }
    }, true);
  }

  function setupMobileMenu() {
    var toggle = document.querySelector('.mobile-toggle');
    var menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var prev = document.querySelector('.hero-arrow.prev');
    var next = document.querySelector('.hero-arrow.next');
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });
    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }
    show(0);
    restart();
  }

  function setupFilters() {
    var bars = Array.prototype.slice.call(document.querySelectorAll('.filter-bar'));
    bars.forEach(function (bar) {
      var cards = Array.prototype.slice.call(document.querySelectorAll(bar.getAttribute('data-target') || '.movie-card'));
      var empty = document.querySelector(bar.getAttribute('data-empty') || '.empty-state');
      bar.addEventListener('click', function (event) {
        var button = event.target.closest('.filter-button');
        if (!button) {
          return;
        }
        var filter = button.getAttribute('data-filter') || 'all';
        bar.querySelectorAll('.filter-button').forEach(function (item) {
          item.classList.toggle('active', item === button);
        });
        var visible = 0;
        cards.forEach(function (card) {
          var matched = true;
          if (filter !== 'all') {
            var parts = filter.split(':');
            var key = parts[0];
            var value = parts.slice(1).join(':');
            var field = card.getAttribute('data-' + key) || '';
            matched = field.indexOf(value) !== -1;
          }
          card.style.display = matched ? '' : 'none';
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('show', visible === 0);
        }
      });
    });
  }

  function setupSearchPage() {
    var page = document.querySelector('[data-search-page]');
    if (!page || !window.MovieIndex) {
      return;
    }
    var input = page.querySelector('input[name="q"]');
    var results = page.querySelector('.search-results');
    var empty = page.querySelector('.empty-state');
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    if (input && initial) {
      input.value = initial;
    }

    function card(movie) {
      return [
        '<article class="movie-card">',
        '<a class="card-link" href="./movie/' + movie.file + '">',
        '<div class="poster-shell">',
        '<img class="poster-img" src="./' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '<span class="year-badge">' + escapeHtml(movie.year) + '</span>',
        '<div class="poster-grad"></div>',
        '</div>',
        '<div class="card-body">',
        '<h3 class="card-title line-clamp-2">' + escapeHtml(movie.title) + '</h3>',
        '<p class="card-text line-clamp-2">' + escapeHtml(movie.oneLine) + '</p>',
        '<div class="card-meta">',
        '<span>' + escapeHtml(movie.region) + '</span>',
        '<span>' + escapeHtml(movie.type) + '</span>',
        '<span>' + escapeHtml(movie.genre) + '</span>',
        '</div>',
        '</div>',
        '</a>',
        '</article>'
      ].join('');
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char];
      });
    }

    function runSearch(term) {
      var q = String(term || '').trim().toLowerCase();
      var pool = window.MovieIndex;
      var list = q ? pool.filter(function (movie) {
        return String(movie.search || '').toLowerCase().indexOf(q) !== -1;
      }) : pool.slice(0, 72);
      list = list.slice(0, 120);
      if (results) {
        results.innerHTML = list.map(card).join('');
      }
      if (empty) {
        empty.classList.toggle('show', list.length === 0);
      }
    }

    page.addEventListener('submit', function (event) {
      event.preventDefault();
      runSearch(input ? input.value : '');
    });
    runSearch(input ? input.value : '');
  }

  window.initMoviePlayer = function (url) {
    var video = document.getElementById('movie-player');
    var cover = document.querySelector('.play-cover');
    var frame = document.querySelector('.video-frame');
    var attached = false;
    var hls = null;

    function attach() {
      if (!video || attached) {
        return;
      }
      attached = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else {
        video.src = url;
      }
    }

    function play() {
      attach();
      if (cover) {
        cover.classList.add('is-hidden');
      }
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener('click', play);
    }
    if (frame) {
      frame.addEventListener('click', function (event) {
        if (event.target === frame) {
          play();
        }
      });
    }
    if (video) {
      video.addEventListener('click', function () {
        if (!attached) {
          play();
        }
      });
      video.addEventListener('play', function () {
        if (cover) {
          cover.classList.add('is-hidden');
        }
      });
    }
    window.addEventListener('beforeunload', function () {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    });
  };

  ready(function () {
    markBrokenImages();
    setupMobileMenu();
    setupHero();
    setupFilters();
    setupSearchPage();
  });
})();
