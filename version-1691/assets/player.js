(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  ready(function () {
    document.querySelectorAll("[data-player]").forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector(".player-start");
      var shell = player.querySelector(".video-shell");
      var status = player.querySelector(".player-status");
      var stream = player.getAttribute("data-stream");
      var hlsInstance = null;
      var attached = false;

      function setStatus(text) {
        if (status) {
          status.textContent = text || "";
        }
      }

      function attachStream() {
        if (attached || !video || !stream) {
          return Promise.resolve();
        }

        attached = true;
        setStatus("正在连接播放源...");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);

          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus("");
          });

          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus("播放暂时不可用，请稍后再试。");
              if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
              }
              attached = false;
            }
          });

          return Promise.resolve();
        }

        setStatus("播放暂时不可用，请稍后再试。");
        return Promise.resolve();
      }

      function startPlayback() {
        attachStream().then(function () {
          if (!video) {
            return;
          }

          var playPromise = video.play();

          if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(function () {
              if (shell) {
                shell.classList.add("is-playing");
              }
              setStatus("");
            }).catch(function () {
              setStatus("点击视频控件即可继续播放。");
            });
          } else if (shell) {
            shell.classList.add("is-playing");
          }
        });
      }

      if (button) {
        button.addEventListener("click", startPlayback);
      }

      if (video) {
        video.addEventListener("play", function () {
          if (shell) {
            shell.classList.add("is-playing");
          }
          setStatus("");
        });

        video.addEventListener("pause", function () {
          if (video.currentTime === 0 && shell) {
            shell.classList.remove("is-playing");
          }
        });

        video.addEventListener("click", function () {
          if (!attached) {
            startPlayback();
          }
        });
      }
    });
  });
})();
