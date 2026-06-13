(function () {
  const video = document.getElementById('movie-player');
  const button = document.getElementById('play-button');
  const dataNode = document.getElementById('player-data');
  if (!video || !button || !dataNode) {
    return;
  }

  let data = {};
  try {
    data = JSON.parse(dataNode.textContent || '{}');
  } catch (error) {
    data = {};
  }

  const source = data.src || '';
  let attached = false;
  let hls = null;

  function playVideo() {
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () {});
    }
  }

  function attachStream() {
    if (!source) {
      return;
    }
    if (!attached) {
      attached = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
      } else {
        video.src = source;
      }
      video.controls = true;
      button.classList.add('is-hidden');
    }
    playVideo();
  }

  button.addEventListener('click', attachStream);
  video.addEventListener('click', function () {
    if (!attached) {
      attachStream();
      return;
    }
    if (video.paused) {
      playVideo();
    }
  });
  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
})();
