(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobilePanel = document.querySelector('.mobile-panel');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      var expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!expanded));
      menuButton.classList.toggle('is-open', !expanded);
      mobilePanel.hidden = expanded;
    });
  }

  var hero = document.querySelector('[data-hero-carousel]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var previous = hero.querySelector('.hero-prev');
    var next = hero.querySelector('.hero-next');
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
      }
    }

    if (previous) {
      previous.addEventListener('click', function () {
        showSlide(current - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
        startTimer();
      });
    });

    startTimer();
  }

  var filterScope = document.querySelector('[data-filter-scope]');
  if (filterScope) {
    var filterInput = filterScope.querySelector('[data-card-search]');
    var yearButtons = Array.prototype.slice.call(filterScope.querySelectorAll('[data-year-filter]'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card-grid] .movie-card'));
    var selectedYear = 'all';

    function filterCards() {
      var keyword = filterInput ? filterInput.value.trim().toLowerCase() : '';
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-region')
        ].join(' ').toLowerCase();
        var matchText = !keyword || haystack.indexOf(keyword) !== -1;
        var matchYear = selectedYear === 'all' || card.getAttribute('data-year') === selectedYear;
        card.classList.toggle('is-hidden', !(matchText && matchYear));
      });
    }

    if (filterInput) {
      filterInput.addEventListener('input', filterCards);
    }

    yearButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        selectedYear = button.getAttribute('data-year-filter');
        yearButtons.forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        filterCards();
      });
    });
  }

  var searchPage = document.querySelector('[data-search-page]');
  if (searchPage && typeof siteSearchIndex !== 'undefined') {
    var searchInput = searchPage.querySelector('[data-search-input]');
    var results = searchPage.querySelector('[data-search-results]');
    var status = searchPage.querySelector('[data-search-status]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    function cardTemplate(movie) {
      var tags = movie.tags.slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');
      return [
        '<article class="movie-card movie-card-standard">',
        '<a class="card-cover" href="' + movie.url + '" aria-label="观看' + escapeHtml(movie.title) + '">',
        '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '<span class="card-year">' + movie.year + '</span>',
        '<span class="card-play">▶</span>',
        '</a>',
        '<div class="card-body">',
        '<div class="card-meta"><span>' + escapeHtml(movie.category) + '</span><span>' + escapeHtml(movie.region) + '</span></div>',
        '<h3><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>',
        '<p>' + escapeHtml(movie.oneLine) + '</p>',
        '<div class="tag-row">' + tags + '</div>',
        '</div>',
        '</article>'
      ].join('');
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderSearch(value) {
      var keyword = String(value || '').trim().toLowerCase();
      if (!keyword) {
        results.innerHTML = '';
        status.textContent = '输入关键词开始查找影片。';
        return;
      }
      var matched = siteSearchIndex.filter(function (movie) {
        return movie.searchText.indexOf(keyword) !== -1;
      }).slice(0, 96);
      results.innerHTML = matched.map(cardTemplate).join('');
      status.textContent = matched.length ? '以下是相关影片。' : '暂未找到匹配影片，可更换关键词。';
    }

    if (searchInput) {
      searchInput.value = query;
      searchInput.addEventListener('input', function () {
        renderSearch(searchInput.value);
      });
    }
    renderSearch(query);
  }
})();

function initVideoPlayer(videoUrl) {
  var video = document.getElementById('moviePlayer');
  var playButton = document.getElementById('playButton');
  if (!video || !videoUrl) {
    return;
  }

  var attached = false;
  var hlsInstance = null;

  function attachVideo() {
    if (attached) {
      return;
    }
    attached = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(videoUrl);
      hlsInstance.attachMedia(video);
      return;
    }

    video.src = videoUrl;
  }

  function startPlayback() {
    attachVideo();
    if (playButton) {
      playButton.classList.add('is-hidden');
    }
    var request = video.play();
    if (request && typeof request.catch === 'function') {
      request.catch(function () {
        if (playButton) {
          playButton.classList.remove('is-hidden');
        }
      });
    }
  }

  if (playButton) {
    playButton.addEventListener('click', startPlayback);
  }

  video.addEventListener('play', function () {
    if (playButton) {
      playButton.classList.add('is-hidden');
    }
  });

  video.addEventListener('error', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    attached = false;
  });
}
