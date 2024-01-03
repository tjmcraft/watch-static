const vid = document.querySelector("input[name=vid]").value || 0;
(async () => {
  const IS_WIDE = document.querySelector('.client > .video').classList.contains('horizontal');
  /**
   * @type {HTMLVideoElement}
   **/
  const videoBox = document.querySelector(".video-box");
  const video = videoBox.querySelector('#video');
  const bannerMuted = videoBox.querySelector(".banner-muted");
  const spinner = videoBox.querySelector(".spinner");
  if (!video || !vid) return;

  const nextButton = document.querySelector('button#nextbtn');
  const volButton = document.querySelector('button#volbtn');
  const volButtonIcon = volButton.querySelector('i');
  const volSlider = document.querySelector('.volume-slider input[type=range]');
  const volSliderFill = document.querySelector('.volume-slider .slider-fill');

  nextButton.style.display = 'none';

  const setMuted = (muted = true) => {
    if (muted) {
      video.muted = true;
    } else {
      if (IS_MOBILE || IS_SAFARI) bannerMuted.classList.remove("show");
      video.muted = false;
    }
  };

  const startWaiting = () => {
    videoBox.classList.add('waiting');
  };
  video.addEventListener('canplay', () => {
    videoBox.classList.remove('waiting');
  });

  const startPlaying = (e) => {
    if (IS_MOBILE || IS_SAFARI) {
      bannerMuted.classList.add("show");
      setMuted(true);
    } else setMuted(false);
    // console.debug(">>", 'startplay');
    videoBox.classList.add('waiting');
    video.play().catch(e => {
      console.error("play", e);
    });
    video.addEventListener('playing', () => {
      videoBox.classList.remove("loading");
      videoBox.classList.remove('waiting');
      document.querySelector('.vertical-controls > .play').classList['remove']('show');
    });
    video.addEventListener('waiting', () => startWaiting());
    video.addEventListener('progress', () => video.readyState == 1 && startWaiting());
  };

  if (data.url.endsWith('.m3u8')) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = data.url;
      console.debug("<<", 'canplay hls');
      video.addEventListener('loadedmetadata', startPlaying, { once: true });
    } else
      if (Hls.isSupported()) {
        var hls = new Hls({
          "debug": false,
          "enableWorker": true,
          "lowLatencyMode": false,
          "backBufferLength": 30,
          "maxBufferSize": 10,
          "maxBufferLength": 5,
        });
        hls.loadSource(data.url);
        hls.attachMedia(video);
        hls.autoLevelEnabled = true;
        // hls.currentLevel = -1;
        // hls.loadLevel = 0;
        hls.startLevel = 1;
        window.hls = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, startPlaying);
        // console.debug("<<", 'using hls.js');
        // console.debug(">", hls.config);
      }
  } else if (data.url.endsWith('.mp4')) {
    video.src = data.url;
    video.setAttribute('type', 'video/mp4');
    console.debug("<<", 'canplay mp4');
    video.addEventListener('loadedmetadata', startPlaying, { once: true });
  }

  (() => { // playlist switcher
    const gonext = (hash) => location.href = '/video/' + hash;
    if (data.playlist?.items.length) {
      let index = data.playlist.items.findIndex(e => e.hash == data.hash) + 1;
      if (data.playlist?.items.length > index) {
        let next = data.playlist.items[index];
        video.addEventListener('ended', (e) => gonext(next.hash), false);
        nextButton.style.display = null;
        nextButton.addEventListener('click', () => gonext(next.hash));
      }
    }
    // video.loop = true;
  })();

  { // MOBILE UNMUTE
    const unmuteMobile = (e = null) => {
      if ((IS_MOBILE || IS_SAFARI) && video.muted) {
        e?.preventDefault();
        e?.stopImmediatePropagation();
        e?.stopPropagation();
        setMuted(false);
        return false;
      }
    };
    videoBox.addEventListener('click', unmuteMobile);
    bannerMuted.addEventListener('click', unmuteMobile);
  }

  { // STATS SENDER
    var timePlayStart = new Date().getTime();
    var timePlayTotal = 0;
    var statsSend = false;
    video.addEventListener('playing', (e) => {
      timePlayStart = new Date().getTime();
      timePlayTotal = 0;
      statsSend = false;
    }, { once: true });

    video.addEventListener('timeupdate', () => {
      if (video.paused) return;
      timePlayTotal = (new Date().getTime() - timePlayStart) / 1e3;
      if (video.duration >= 60 * 2 ?
        timePlayTotal >= 60 :
        timePlayTotal / video.duration >= 0.35
      ) {
        sendStats(video.currentTime, timePlayTotal);
      }
    });

    const sendStats = (ct = 0, ctw = 0) => {
      if (statsSend) return;
      console.debug(">>", 'sendStats', ct, ctw);
      if (vid) {
        let xhr1 = new XMLHttpRequest();
        xhr1.open('POST', '/api/stats?type=view_count', true);
        xhr1.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr1.send(JSON.stringify({
          vid: vid,
          ctw: ctw || 0,
          ct: ct || 0,
        }));
      }
      statsSend = true;
    }
  }

  const handlePlayPause = () => {
    if (video.paused || video.ended) {
      video.play();
    } else {
      video.pause();
    }
  }

  if (IS_WIDE) {

    if (!IS_MOBILE) {
      const props = {
        muted: window.localStorage.getItem('tjmc.player.muted') ?? false,
        volume: window.localStorage.getItem('tjmc.player.volume') ?? 4e-1,
      };
      video.muted = props.muted;
      video.volume = props.volume;
      video.addEventListener('volumechange', (e) => {
        window.localStorage.getItem('tjmc.player.muted', video.muted);
        window.localStorage.setItem('tjmc.player.volume', video.volume);
      });
    } else {
      video.muted = false;
      video.volume = 1;
    }

    const playerRoot = document.querySelector(".player");
    const playerBottom = document.querySelector(".player .video-bottom");

    let controlsTimeout = undefined;
    let controlsLock = false;
    const requestControlsRemove = () =>
      controlsTimeout = setTimeout(() => {
        if (video.paused || controlsLock) return;
        playerBottom.classList.remove("active");
      }, 3000);
    const preventControlsRemove = () =>
      (controlsTimeout) && clearTimeout(controlsTimeout);
    const showControls = () => {
      preventControlsRemove();
      playerBottom.classList.add("active");
      requestControlsRemove();
    };
    const hideControls = () => {
      if (video.paused) return;
      playerBottom.classList.remove("active");
    };

    video.addEventListener('pause', () => showControls());

    { // CONTROLS BEHAVIOR
      playerBottom.classList.add("active");
      playerRoot.addEventListener("mousemove", () => {
        showControls();
      });
      playerRoot.addEventListener("mouseleave", () => {
        hideControls();
      });
      playerBottom.addEventListener('mouseenter', () => {
        controlsLock = true;
      });
      playerBottom.addEventListener('mouseleave', () => {
        controlsLock = false;
      });
      video.addEventListener('canplay', requestControlsRemove);
    }

    const handleFullscreen = () => setFullscreen(IS_MOBILE ? video : playerRoot);

    { // KEYBOARD HANDLERS
      playerRoot.addEventListener('keydown', (e) => {
        switch (e.code) {
          case "Space": {
            handlePlayPause();
            e.preventDefault();
          }; break;
          case "ArrowLeft": {
            video.currentTime -= 5;
            showControls();
            e.preventDefault();
          }; break;
          case "ArrowRight": {
            video.currentTime += 5;
            showControls();
            e.preventDefault();
          }; break;
          case "ArrowDown": {
            video.volume = Math.min(1, Math.max(0, video.volume - 5 / 100));
            showControls();
            e.preventDefault();
          }; break;
          case "ArrowUp": {
            video.volume = Math.min(1, Math.max(0, video.volume + 5 / 100));
            showControls();
            e.preventDefault();
          }; break;
          case "KeyK": {
            handlePlayPause();
            e.preventDefault();
          }; break;
          case "KeyM": {
            setMuted(!video.muted);
            e.preventDefault();
          }; break;
          case "KeyF": {
            handleFullscreen();
            e.preventDefault();
          }; break;
        }
        // console.debug(">>", 'keydown', e);
      }, true);
    }

    { // PLAY/PAUSE
      const playpause = document.querySelector("button#playpause");
      playpause.addEventListener('click', handlePlayPause);
      videoBox.addEventListener('click', handlePlayPause);
      function changeButtonState(type) {
        if (type === "playpause") {
          if (video.paused || video.ended) {
            playpause.querySelector('i').className = "icon-play";
          } else {
            playpause.querySelector('i').className = "icon-pause";
          }
        }
      }
      video.addEventListener("play", () => changeButtonState("playpause"), false);
      video.addEventListener("pause", () => changeButtonState("playpause"), false);
    }

    { // FULLSCREEN
      const fullscreen = document.querySelector("button#fullscreen");
      fullscreen.addEventListener('click', handleFullscreen);
      videoBox.addEventListener('dblclick', handleFullscreen);
    }

    const vprogress = document.querySelector(".video-progress");
    { // PROGRESS SEEK
      let vpp = false;
      let isp = false;
      const down = (e) => {
        isp = video.paused;
        video.pause();
        vpp = true;
        vprogress.classList.add('active');
      };
      const move = (e) => {
        if (!vpp) return;
        if (e.type === 'touchmove' && ('touches' in e)) {
          if (e.pageX === undefined) {
            e.pageX = e.touches[0].pageX;
          }
        }
        const rect = vprogress.getBoundingClientRect();
        const pos = (e.pageX - rect.left) / vprogress.offsetWidth;
        video.currentTime = pos * video.duration;
      };
      const up = (e) => {
        if (!vpp) return;
        vpp = false;
        !isp && video.play();
        vprogress.classList.remove('active');
      };
      vprogress.addEventListener("mousedown", down);
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);

      vprogress.addEventListener("touchstart", down, { passive: true });
      document.addEventListener("touchmove", move);
      document.addEventListener("touchend", up);
      document.addEventListener("touchcancel", up);

      vprogress.addEventListener("click", e => {
        const rect = vprogress.getBoundingClientRect();
        const pos = (e.pageX - rect.left) / vprogress.offsetWidth;
        video.currentTime = pos * video.duration;
      });
    }

    { // VOLUME
      if (!IS_MOBILE) {
        volButton.addEventListener('click', e => {
          setMuted(!video.muted);
        });
        volSlider.addEventListener('input', e => {
          video.volume = (volSlider.value / 100);
          // e.currentTarget.value = Math.floor(video.volume * 100);
          e.preventDefault();
          return false;
        });
        volSlider.addEventListener('wheel', e => {
          e.preventDefault();
          video.volume = Math.min(1, Math.max(0, video.volume - Math.sign(e.deltaY) * 0.1));
        }, { passive: false });
      } else {
        volButton.style.display = 'none';
        volSlider.style.display = 'none';
      }
    }

    const timeArea = document.querySelector(".video-controls > .time");

    const watchedProgress = vprogress.querySelector(".played");
    const loadedProgress = vprogress.querySelector(".loaded");

    video.addEventListener('progress', function () {
      let loaded = (this.buffered.end(this.buffered.length - 1) / this.duration) * 100;
      loadedProgress.style.width = loaded + "%";
      // console.debug(">>", 'loadedPercentage', loaded);
    });

    requestAnimationFrame(function update() {
      let curr = (video.currentTime / video.duration) * 100;
      watchedProgress.style.width = curr + "%";
      {
        const volume = video.muted ? 0 : video.volume * 100;
        volSliderFill.style.width = Math.floor(volume) + "%";
        volSlider.value = volume;
        volButtonIcon.className = (() => {
          if (video.volume === 0 || video.muted) return 'icon-muted';
          if (video.volume < 0.35) return 'icon-volume-1';
          if (video.volume < 0.75) return 'icon-volume-2';
          return 'icon-volume-3';
        })();
      }
      if (video.readyState >= 1) {
        const next_time = formatTime(Math.round(video.currentTime)) + "\xa0/\xa0" + formatTime(Math.round(video.duration));
        if (timeArea.innerText != next_time) timeArea.innerText = next_time;
      }
      requestAnimationFrame(update);
    });
  }

  // VERTICAL EVENTS
  if (!IS_WIDE) {
    if (!IS_MOBILE) {
      video.volume = 0.75;
    } else {
      video.volume = 1;
    }
    video.loop = true;
    document.querySelector(':root').classList.add('vertical-video');
    video.addEventListener('play', () => {
      document.querySelector('.vertical-controls > .play').classList['remove']('show');
    });
    video.addEventListener('pause', () => {
      document.querySelector('.vertical-controls > .play').classList['add']('show');
    });
    videoBox.addEventListener('click', handlePlayPause);
    setInterval(() => {
      if (video.paused) return;
      let curr = (video.currentTime / video.duration) * 100;
      document.querySelector('.metadata').style = "--progress:" + curr + "%;";
    }, 50);
    video.addEventListener('canplay', () => {
      document.querySelector('.vertical-controls > .play').classList['add']('show');
    }, { once: true });
  }

})();