(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initCarousel() {
        var carousel = document.querySelector("[data-carousel]");
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll(".visual-slide"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll(".visual-dots button"));
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;

        function show(index) {
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

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                start();
            });
        });

        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
        panels.forEach(function (panel) {
            var input = panel.querySelector("[data-filter-keyword]");
            var category = panel.querySelector("[data-filter-category]");
            var type = panel.querySelector("[data-filter-type]");
            var cards = Array.prototype.slice.call(document.querySelectorAll(panel.getAttribute("data-filter-panel")));
            var empty = document.querySelector(panel.getAttribute("data-empty-target"));

            function valueOf(node) {
                return node ? node.value.trim().toLowerCase() : "";
            }

            function apply() {
                var keywordValue = valueOf(input);
                var categoryValue = valueOf(category);
                var typeValue = valueOf(type);
                var shown = 0;

                cards.forEach(function (card) {
                    var text = [
                        card.getAttribute("data-title"),
                        card.getAttribute("data-year"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-genre"),
                        card.getAttribute("data-tags")
                    ].join(" ").toLowerCase();
                    var cardCategory = (card.getAttribute("data-category") || "").toLowerCase();
                    var cardType = (card.getAttribute("data-type") || "").toLowerCase();
                    var matched = true;

                    if (keywordValue && text.indexOf(keywordValue) === -1) {
                        matched = false;
                    }
                    if (categoryValue && cardCategory !== categoryValue) {
                        matched = false;
                    }
                    if (typeValue && cardType !== typeValue) {
                        matched = false;
                    }

                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        shown += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle("is-visible", shown === 0);
                }
            }

            [input, category, type].forEach(function (node) {
                if (node) {
                    node.addEventListener("input", apply);
                    node.addEventListener("change", apply);
                }
            });

            apply();
        });
    }

    window.setupPlayer = function (videoId, buttonId, streamUrl) {
        var video = document.getElementById(videoId);
        var button = document.getElementById(buttonId);
        var hlsInstance = null;
        if (!video || !button || !streamUrl) {
            return;
        }

        function prepare() {
            if (video.getAttribute("data-ready") === "1") {
                return;
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls();
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
            } else {
                video.src = streamUrl;
            }
            video.setAttribute("data-ready", "1");
        }

        function play() {
            prepare();
            button.classList.add("is-hidden");
            var result = video.play();
            if (result && typeof result.catch === "function") {
                result.catch(function () {});
            }
        }

        button.addEventListener("click", play);
        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener("play", function () {
            button.classList.add("is-hidden");
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    };

    ready(function () {
        initMenu();
        initCarousel();
        initFilters();
    });
})();
