
document.addEventListener('DOMContentLoaded', function () {
  initMobileMenu();
  initHeroCarousel();
  initFilters();
  initPlayers();
});

function initMobileMenu() {
  var button = document.querySelector('[data-mobile-menu-button]');
  var menu = document.querySelector('[data-mobile-menu]');

  if (!button || !menu) {
    return;
  }

  button.addEventListener('click', function () {
    menu.classList.toggle('is-open');
  });
}

function initHeroCarousel() {
  var root = document.querySelector('[data-hero-carousel]');

  if (!root) {
    return;
  }

  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
  var current = 0;
  var timer = null;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === current);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  }

  function start() {
    stop();
    timer = window.setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showSlide(index);
      start();
    });
  });

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  showSlide(0);
  start();
}

function initFilters() {
  var input = document.querySelector('[data-filter-input]');
  var list = document.querySelector('[data-filter-list]');
  var resultCount = document.querySelector('[data-result-count]');

  if (!input || !list) {
    return;
  }

  var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function filterCards() {
    var query = normalize(input.value);
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-year'),
        card.getAttribute('data-region'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags'),
        card.textContent
      ].join(' '));
      var matched = !query || haystack.indexOf(query) !== -1;

      card.setAttribute('data-filter-hidden', matched ? 'false' : 'true');

      if (matched) {
        visible += 1;
      }
    });

    if (resultCount) {
      resultCount.textContent = visible + ' 部影片';
    }
  }

  input.addEventListener('input', filterCards);
  filterCards();
}

function initPlayers() {
  var players = Array.prototype.slice.call(document.querySelectorAll('video[data-hls-src]'));

  players.forEach(function (video) {
    var src = video.getAttribute('data-hls-src');
    var shell = video.closest('.player-shell');
    var button = shell ? shell.querySelector('[data-player-start]') : null;

    if (!src) {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (_event, data) {
        if (data && data.fatal) {
          showPlayerMessage(shell, '当前播放源连接失败，请稍后重试。');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      showPlayerMessage(shell, '当前浏览器不支持 HLS 播放，请更换支持 HLS 的浏览器。');
    }

    if (button) {
      button.addEventListener('click', function () {
        var promise = video.play();

        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            showPlayerMessage(shell, '浏览器阻止了自动播放，请点击播放器控件继续。');
          });
        }
      });
    }

    video.addEventListener('play', function () {
      if (shell) {
        shell.classList.add('is-playing');
      }
    });

    video.addEventListener('pause', function () {
      if (shell) {
        shell.classList.remove('is-playing');
      }
    });
  });
}

function showPlayerMessage(shell, message) {
  if (!shell || shell.querySelector('.player-message')) {
    return;
  }

  var node = document.createElement('div');
  node.className = 'player-message';
  node.textContent = message;
  shell.appendChild(node);
}
