(function () {
  const qs = (selector, parent = document) => parent.querySelector(selector);
  const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  function initMenu() {
    const button = qs('[data-menu-toggle]');
    const menu = qs('[data-mobile-menu]');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initSearchForms() {
    qsa('[data-search-form]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const input = qs('input[name="q"]', form);
        const query = input ? input.value.trim() : '';
        if (query) {
          window.location.href = './search.html?q=' + encodeURIComponent(query);
        }
      });
    });
  }

  function initHero() {
    const slides = qsa('[data-hero-slide]');
    if (!slides.length) {
      return;
    }
    const dots = qsa('[data-hero-dot]');
    const prev = qs('[data-hero-prev]');
    const next = qs('[data-hero-next]');
    let index = 0;
    let timer = null;

    function setSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        setSlide(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        setSlide(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        setSlide(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        setSlide(dotIndex);
        start();
      });
    });
    start();
  }

  function initCategoryFilters() {
    const list = qs('[data-filter-list]');
    if (!list) {
      return;
    }
    const input = qs('[data-category-search]');
    const sort = qs('[data-category-sort]');
    const tagButtons = qsa('[data-filter-tag]');
    const clear = qs('[data-filter-clear]');
    const empty = qs('[data-empty-state]');
    let activeTags = [];

    function apply() {
      const query = input ? input.value.trim().toLowerCase() : '';
      const cards = qsa('[data-movie-card]', list);
      let visible = 0;

      cards.forEach(function (card) {
        const haystack = [
          card.dataset.title || '',
          card.dataset.year || '',
          card.dataset.region || '',
          card.dataset.type || '',
          card.dataset.tags || '',
          card.textContent || ''
        ].join(' ').toLowerCase();
        const tagText = card.dataset.tags || '';
        const queryOk = !query || haystack.includes(query);
        const tagOk = activeTags.length === 0 || activeTags.some(function (tag) {
          return tagText.includes(tag);
        });
        const show = queryOk && tagOk;
        card.classList.toggle('is-hidden', !show);
        if (show) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    function sortCards() {
      const value = sort ? sort.value : 'latest';
      const cards = qsa('[data-movie-card]', list);
      cards.sort(function (a, b) {
        if (value === 'title') {
          return (a.dataset.title || '').localeCompare(b.dataset.title || '', 'zh-CN');
        }
        const yearA = Number(a.dataset.year || 0);
        const yearB = Number(b.dataset.year || 0);
        if (value === 'oldest') {
          return yearA - yearB;
        }
        return yearB - yearA;
      });
      cards.forEach(function (card) {
        list.appendChild(card);
      });
      apply();
    }

    if (input) {
      input.addEventListener('input', apply);
    }
    if (sort) {
      sort.addEventListener('change', sortCards);
    }
    tagButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const tag = button.dataset.filterTag || '';
        if (activeTags.includes(tag)) {
          activeTags = activeTags.filter(function (item) {
            return item !== tag;
          });
        } else {
          activeTags.push(tag);
        }
        button.classList.toggle('is-active');
        apply();
      });
    });
    if (clear) {
      clear.addEventListener('click', function () {
        activeTags = [];
        tagButtons.forEach(function (button) {
          button.classList.remove('is-active');
        });
        if (input) {
          input.value = '';
        }
        apply();
      });
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cardTemplate(movie) {
    const tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span class="tag">' + escapeHtml(tag) + '</span>';
    }).join('');
    return '<a class="movie-card" href="' + escapeHtml(movie.url) + '">' +
      '<span class="poster-frame">' +
      '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">' +
      '<span class="poster-shade"></span>' +
      '<span class="year-badge">' + escapeHtml(movie.year) + '</span>' +
      '</span>' +
      '<span class="card-info">' +
      '<span class="card-meta">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.type) + '</span>' +
      '<strong>' + escapeHtml(movie.title) + '</strong>' +
      '<span class="card-desc">' + escapeHtml(movie.oneLine) + '</span>' +
      '<span class="tag-row">' + tags + '</span>' +
      '</span>' +
      '</a>';
  }

  function initSearchPage() {
    const root = qs('[data-search-page]');
    const results = qs('[data-search-results]');
    const title = qs('[data-search-title]');
    const empty = qs('[data-search-empty]');
    const input = qs('[data-search-input]');
    if (!root || !results || !window.SearchMovies) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const query = (params.get('q') || '').trim();
    if (input) {
      input.value = query;
    }
    if (!query) {
      results.innerHTML = '';
      if (empty) {
        empty.textContent = '输入关键词即可开始查找影片';
        empty.hidden = false;
      }
      return;
    }
    const normalized = query.toLowerCase();
    const found = window.SearchMovies.filter(function (movie) {
      return [
        movie.title,
        movie.year,
        movie.region,
        movie.type,
        movie.genre,
        movie.oneLine,
        (movie.tags || []).join(' ')
      ].join(' ').toLowerCase().includes(normalized);
    });
    if (title) {
      title.textContent = '“' + query + '” 的搜索结果';
    }
    results.innerHTML = found.map(cardTemplate).join('');
    if (empty) {
      empty.textContent = found.length ? '' : '没有找到相关影片';
      empty.hidden = found.length !== 0;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initSearchForms();
    initHero();
    initCategoryFilters();
    initSearchPage();
  });
})();
