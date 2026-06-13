(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function initMenu() {
        var toggle = qs('[data-menu-toggle]');
        var panel = qs('[data-mobile-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            panel.classList.toggle('open');
        });
    }

    function initHero() {
        var root = qs('[data-hero]');
        if (!root) {
            return;
        }
        var slides = qsa('[data-hero-slide]', root);
        var dots = qsa('[data-hero-dot]', root);
        var prev = qs('[data-hero-prev]', root);
        var next = qs('[data-hero-next]', root);
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
        }

        function move(step) {
            show(index + step);
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                move(1);
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
                move(-1);
                restart();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                move(1);
                restart();
            });
        }
        show(0);
        restart();
    }

    function initFilters() {
        var panel = qs('[data-filter-panel]');
        var results = qs('[data-filter-results]');
        if (!panel || !results) {
            return;
        }
        var input = qs('[data-filter-input]', panel);
        var region = qs('[data-filter-region]', panel);
        var type = qs('[data-filter-type]', panel);
        var empty = qs('[data-empty-state]');
        var cards = qsa('.searchable-card', results);
        var params = new URLSearchParams(window.location.search);
        var startQuery = params.get('q') || '';
        if (input && startQuery) {
            input.value = startQuery;
        }

        function apply() {
            var query = normalize(input ? input.value : '');
            var regionValue = normalize(region ? region.value : '');
            var typeValue = normalize(type ? type.value : '');
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-keywords')
                ].join(' '));
                var regionText = normalize(card.getAttribute('data-region'));
                var typeText = normalize(card.getAttribute('data-type'));
                var matched = true;
                if (query && haystack.indexOf(query) === -1) {
                    matched = false;
                }
                if (regionValue && regionText.indexOf(regionValue) === -1) {
                    matched = false;
                }
                if (typeValue && typeText.indexOf(typeValue) === -1) {
                    matched = false;
                }
                card.style.display = matched ? '' : 'none';
                if (matched) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('show', visible === 0);
            }
        }

        [input, region, type].forEach(function (el) {
            if (el) {
                el.addEventListener('input', apply);
                el.addEventListener('change', apply);
            }
        });
        apply();
    }

    window.initMoviePlayer = function (options) {
        var video = document.getElementById(options.videoId);
        var overlay = document.getElementById(options.overlayId);
        var url = options.url;
        var loaded = false;
        var hls = null;
        if (!video || !overlay || !url) {
            return;
        }

        function load() {
            if (loaded) {
                return;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else {
                video.src = url;
            }
            loaded = true;
        }

        function play() {
            load();
            overlay.classList.add('is-hidden');
            video.controls = true;
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {});
            }
        }

        overlay.addEventListener('click', play);
        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });
        window.addEventListener('beforeunload', function () {
            if (hls && hls.destroy) {
                hls.destroy();
            }
        });
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMenu();
        initHero();
        initFilters();
    });
}());
