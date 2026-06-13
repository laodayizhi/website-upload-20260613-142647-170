(function () {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (toggle && panel) {
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-spotlight-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-spotlight-dot]'));
    if (slides.length > 0) {
        var current = 0;
        var show = function (index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === current);
            });
        };
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
            });
        });
        show(0);
        window.setInterval(function () {
            show(current + 1);
        }, 6500);
    }

    var filterRoot = document.querySelector('[data-filter-root]');
    if (filterRoot) {
        var input = filterRoot.querySelector('[data-filter-input]');
        var region = filterRoot.querySelector('[data-filter-region]');
        var type = filterRoot.querySelector('[data-filter-type]');
        var year = filterRoot.querySelector('[data-filter-year]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));
        var empty = document.querySelector('[data-no-results]');
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q') || '';
        if (input && q) {
            input.value = q;
        }
        var apply = function () {
            var query = input ? input.value.trim().toLowerCase() : '';
            var regionValue = region ? region.value : '';
            var typeValue = type ? type.value : '';
            var yearValue = year ? year.value : '';
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute('data-title') || '',
                    card.getAttribute('data-region') || '',
                    card.getAttribute('data-type') || '',
                    card.getAttribute('data-year') || '',
                    card.getAttribute('data-tags') || ''
                ].join(' ').toLowerCase();
                var ok = true;
                if (query && haystack.indexOf(query) === -1) {
                    ok = false;
                }
                if (regionValue && card.getAttribute('data-region') !== regionValue) {
                    ok = false;
                }
                if (typeValue && card.getAttribute('data-type') !== typeValue) {
                    ok = false;
                }
                if (yearValue && card.getAttribute('data-year') !== yearValue) {
                    ok = false;
                }
                card.style.display = ok ? '' : 'none';
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.style.display = visible === 0 ? 'block' : 'none';
            }
        };
        [input, region, type, year].forEach(function (node) {
            if (node) {
                node.addEventListener('input', apply);
                node.addEventListener('change', apply);
            }
        });
        apply();
    }
})();

function initMoviePlayer(videoUrl) {
    var video = document.querySelector('[data-player-video]');
    var overlay = document.querySelector('[data-player-overlay]');
    var button = document.querySelector('[data-player-button]');
    if (!video || !videoUrl) {
        return;
    }
    var attached = false;
    var hlsInstance = null;
    var attach = function () {
        if (attached) {
            return;
        }
        attached = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: false
            });
            hlsInstance.loadSource(videoUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = videoUrl;
        }
    };
    var start = function () {
        attach();
        video.controls = true;
        if (overlay) {
            overlay.classList.add('is-hidden');
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
        }
    };
    if (button) {
        button.addEventListener('click', start);
    }
    if (overlay) {
        overlay.addEventListener('click', start);
    }
    video.addEventListener('click', function () {
        if (!attached) {
            start();
        }
    });
    window.addEventListener('pagehide', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
