import { H as Hls } from './video-vendor-dru42stk.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function setupMobileNav() {
    const toggle = $('[data-nav-toggle]');
    const menu = $('[data-nav-menu]');

    if (!toggle || !menu) {
        return;
    }

    toggle.addEventListener('click', () => {
        menu.classList.toggle('is-open');
        toggle.setAttribute('aria-label', menu.classList.contains('is-open') ? '关闭导航' : '打开导航');
    });
}

function setupHeroSlider() {
    const slider = $('[data-hero-slider]');

    if (!slider) {
        return;
    }

    const slides = $$('[data-hero-slide]', slider);
    const dots = $$('[data-hero-dot]', slider);
    const next = $('[data-hero-next]', slider);
    const prev = $('[data-hero-prev]', slider);
    let current = 0;
    let timer = null;

    const activate = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === current);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === current);
        });
    };

    const start = () => {
        stop();
        timer = window.setInterval(() => activate(current + 1), 5000);
    };

    const stop = () => {
        if (timer) {
            window.clearInterval(timer);
            timer = null;
        }
    };

    next?.addEventListener('click', () => {
        activate(current + 1);
        start();
    });

    prev?.addEventListener('click', () => {
        activate(current - 1);
        start();
    });

    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            activate(Number(dot.dataset.heroDot || 0));
            start();
        });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    start();
}

function setupPlayers() {
    $$('[data-player]').forEach((player) => {
        const video = $('video[data-hls]', player);
        const button = $('.play-overlay', player);

        if (!video || !button) {
            return;
        }

        const loadVideo = () => {
            if (video.dataset.ready === '1') {
                return;
            }

            const source = video.dataset.hls;
            if (!source) {
                return;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            } else if (Hls && Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                hls.loadSource(source);
                hls.attachMedia(video);
                video._hls = hls;
            } else {
                video.src = source;
            }

            video.dataset.ready = '1';
        };

        const playVideo = () => {
            loadVideo();
            player.classList.add('is-playing');
            const attempt = video.play();

            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(() => {
                    player.classList.remove('is-playing');
                });
            }
        };

        button.addEventListener('click', playVideo);
        video.addEventListener('play', () => player.classList.add('is-playing'));
    });
}

function setupScrollToPlayer() {
    $$('[data-scroll-player]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const player = $('[data-player]');
            player?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
}

function normalize(value) {
    return String(value || '').toLowerCase().trim();
}

function setupCardFilters() {
    const page = $('[data-filter-page]');

    if (!page) {
        return;
    }

    const grid = $('[data-card-grid]', page);
    const searchInput = $('[data-card-search]', page);
    const sortSelect = $('[data-card-sort]', page);
    const tagButtons = $$('[data-filter-tag]', page);
    const originalCards = $$('.movie-card', grid);
    let activeTag = '';

    const apply = () => {
        const query = normalize(searchInput?.value);
        const cards = $$('.movie-card', grid);

        cards.forEach((card) => {
            const haystack = normalize([
                card.dataset.title,
                card.dataset.year,
                card.dataset.region,
                card.dataset.type,
                card.dataset.tags,
            ].join(' '));
            const hasQuery = !query || haystack.includes(query);
            const hasTag = !activeTag || normalize(card.dataset.tags).includes(normalize(activeTag));
            card.hidden = !(hasQuery && hasTag);
        });
    };

    const sortCards = () => {
        const value = sortSelect?.value || 'default';
        const cards = [...originalCards];

        if (value === 'year-desc') {
            cards.sort((a, b) => Number(b.dataset.year || 0) - Number(a.dataset.year || 0));
        } else if (value === 'year-asc') {
            cards.sort((a, b) => Number(a.dataset.year || 0) - Number(b.dataset.year || 0));
        } else if (value === 'title') {
            cards.sort((a, b) => String(a.dataset.title || '').localeCompare(String(b.dataset.title || ''), 'zh-CN'));
        }

        cards.forEach((card) => grid.appendChild(card));
        apply();
    };

    searchInput?.addEventListener('input', apply);
    sortSelect?.addEventListener('change', sortCards);

    tagButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeTag = button.dataset.filterTag || '';
            tagButtons.forEach((item) => item.classList.toggle('is-active', item === button));
            apply();
        });
    });
}

function movieCard(movie) {
    const tags = (movie.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
    const meta = [movie.region, movie.year, movie.type].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join('');

    return `
        <article class="movie-card">
            <a class="card-poster" href="${escapeAttribute(movie.url)}" aria-label="观看${escapeAttribute(movie.title)}">
                <img src="${escapeAttribute(movie.cover)}" alt="${escapeAttribute(movie.title)}" loading="lazy">
                <span class="card-play">播放</span>
            </a>
            <div class="card-body">
                <div class="card-meta">${meta}</div>
                <h3><a href="${escapeAttribute(movie.url)}">${escapeHtml(movie.title)}</a></h3>
                <p>${escapeHtml(movie.oneLine || movie.summary || '')}</p>
                <div class="tag-row">${tags}</div>
            </div>
        </article>`;
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('`', '&#096;');
}

function setupSearchPage() {
    const page = $('[data-search-page]');

    if (!page || !window.MOVIE_INDEX) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const input = $('[data-search-input]', page);
    const count = $('[data-search-count]', page);
    const results = $('[data-search-results]', page);
    const initialQuery = params.get('q') || '';

    if (input) {
        input.value = initialQuery;
    }

    const render = () => {
        const query = normalize(input?.value || '');

        if (!query) {
            results.innerHTML = '';
            count.textContent = '输入关键词开始搜索';
            return;
        }

        const matches = window.MOVIE_INDEX.filter((movie) => {
            const haystack = normalize([
                movie.title,
                movie.region,
                movie.type,
                movie.year,
                movie.genre,
                (movie.tags || []).join(' '),
                movie.oneLine,
                movie.summary,
            ].join(' '));
            return haystack.includes(query);
        }).slice(0, 120);

        count.textContent = `搜索“${input.value}”找到 ${matches.length} 个结果`;
        results.innerHTML = matches.map(movieCard).join('');
    };

    input?.addEventListener('input', render);
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    setupMobileNav();
    setupHeroSlider();
    setupPlayers();
    setupScrollToPlayer();
    setupCardFilters();
    setupSearchPage();
});
