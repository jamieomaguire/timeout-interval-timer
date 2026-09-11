export class Timer {
  constructor(configManager) {
    this.configManager = configManager;
    this.audio = null;
    this.startTime = null;
    this.elapsed = null;
    this.timerStopped = true;
    this.intervals = [];
    this.currentIntervalIndex = 0;
    this.rounds = 1;
    this.currentRound = 1;
    this.countdownDuration = 0;
    this.inCountdown = false;
    this.sets = 1;
    this.currentSet = 1;
    this.restBetweenSetsDuration = 0;
    this.inRestBetweenSets = false;
    this.skipFinalInterval = false;
    this.x = 0;
    this.y = 0;
    this.muted = false;
    this.wakeLock = null;

    // Canvas sizing params
    this.aspectRatio = { width: 4, height: 3.5 };
    this.baseFontScale = 0.1;
    this.maxFontScale = 1.8;
    this.maxCanvasWidth = 600;  // Maximum width for the canvas on larger screens

    this.canvas = document.getElementById('timerCanvas');
    this.canvas.style.backgroundColor = this.defaultCanvasColor;
    this.ctx = this.canvas.getContext('2d');

    window.devicePixelRatio = 2;

    this.resizeCanvas();

    window.addEventListener('resize', this.resizeCanvas.bind(this));
    document.documentElement.addEventListener('themeChange', this.updateCanvasColorBasedOnTheme.bind(this));

    // Render the initial time on the canvas
    this.drawTime(this.configManager.capturedCountdownDuration ?? 0, '', false);
  }

  get defaultCanvasColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '#ccc' : 'white';
  }

  toggleMuteTimer() {
    this.muted = !this.muted;
  }

  updateCanvasColorBasedOnTheme() {
    this.canvas.style.backgroundColor = this.defaultCanvasColor;
    // Re-draw the current time to ensure the timer looks correct in the new theme
    this.drawTime(this.configManager.capturedCountdownDuration ?? 0, '', false);
  }

  resizeCanvas() {
    const viewportWidth = window.innerWidth;
    const scale = window.devicePixelRatio;

    if (viewportWidth <= 768) {
      this.canvasWidth = viewportWidth - 16;
    } else {
      this.canvasWidth = Math.min(0.7 * viewportWidth, this.maxCanvasWidth); // Set an upper limit on the canvas width
    }

    this.canvasHeight = (this.aspectRatio.height / this.aspectRatio.width) * this.canvasWidth;

    this.canvas.style.width = `${this.canvasWidth}px`;
    this.canvas.style.height = `${this.canvasHeight}px`;

    this.canvas.width = this.canvasWidth * scale;
    this.canvas.height = this.canvasHeight * scale;

    this.ctx.scale(scale, scale);
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';

    this.x = this.canvasWidth / 2;
    this.y = this.canvasHeight / 2;

    this.drawTime(this.configManager.capturedCountdownDuration ?? 0, '', false);
  }

  adjustFontSize(ctx, maxFontSize, textArray, maxWidth) {
    let fontSize = maxFontSize;
    ctx.font = `${fontSize}px Arial`;

    const combinedWidth = textArray.reduce((acc, text) => acc + ctx.measureText(text).width, 0);

    while (combinedWidth > maxWidth && fontSize > 10) {
      fontSize--;
      ctx.font = `${fontSize}px Arial`;
    }

    return fontSize;
  }

  drawTime(time, intervalName = '', displayRound = true) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = time % 1000;

    const minutesText = `${minutes.toString().padStart(2, '0')}:`;
    const secondsText = `${seconds.toString().padStart(2, '0')}.`;
    const milliText = milliseconds.toString().slice(0, 2).padStart(2, '0');

    const baseFontSize = this.canvasWidth * this.baseFontScale;
    const maxFontSize = this.maxFontScale * baseFontSize;

    const fontSize = this.adjustFontSize(this.ctx, maxFontSize, [minutesText, secondsText, milliText], this.canvasWidth);

    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';

    const maxMinutesWidth = this.ctx.measureText("59:").width;
    const maxSecondsWidth = this.ctx.measureText("59.").width;

    const startX = this.x - (maxMinutesWidth + maxSecondsWidth + this.ctx.measureText("99").width) / 2;

    this.ctx.fillText(minutesText, startX, this.y);
    this.ctx.fillText(secondsText, startX + maxMinutesWidth, this.y);
    this.ctx.fillText(milliText, startX + maxMinutesWidth + maxSecondsWidth, this.y);

    const bottomTextFontSize = 1 * baseFontSize;
    const bottomTextMargin = 10;

    // Display Name on bottom left
    this.ctx.font = `${bottomTextFontSize}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(intervalName, bottomTextMargin, this.canvasHeight - bottomTextMargin);

    // If the timer is not running or in countdown mode, skip rendering the set information
    if (!this.timerStopped && !this.inCountdown) {
      // If resting, display "Up next: set x" in the top left
      if (this.inRestBetweenSets) {
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.font = `${1 * baseFontSize}px Arial`;
        const setText = `Up next: set ${this.currentSet}`;
        this.ctx.fillText(setText, bottomTextMargin, bottomTextMargin);
        displayRound = false;  // Do not display the current round during resting
      } else {
        // Display current set in the top left
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.font = `${1 * baseFontSize}px Arial`;
        const setText = `Set: ${this.currentSet}/${this.sets}`;
        this.ctx.fillText(setText, bottomTextMargin, bottomTextMargin);
      }
    }

    // Restore baseline for the 'currentRound' text
    this.ctx.textBaseline = 'bottom';

    // Display current round on bottom right
    if (displayRound) {
      this.ctx.textAlign = 'right';
      const roundText = `${this.currentRound}/${this.rounds}`;
      this.ctx.fillText(roundText, this.canvasWidth - bottomTextMargin, this.canvasHeight - bottomTextMargin);
    }
  }

  shouldSkipCurrentInterval() {
    return this.skipFinalInterval &&
      this.currentRound === this.rounds &&
      this.currentIntervalIndex === this.intervals.length - 1;
  }

  advanceToNextInterval(currentTime) {
    this.currentIntervalIndex++;

    if (this.shouldSkipCurrentInterval()) {
      this.currentIntervalIndex++;
    }

    while (this.currentIntervalIndex >= this.intervals.length) {
      this.currentRound++;

      if (this.currentRound > this.rounds) {
        this.currentSet++;
        this.currentRound = 1;

        if (this.currentSet > this.sets) {
          this.timerStopped = true;
          this.startTime = null;
          this.elapsed = null;
          this.currentIntervalIndex = 0;
          this.currentRound = 1;
          this.inCountdown = false;
          this.currentSet = 1;
          this.inRestBetweenSets = false;
          this.canvas.style.backgroundColor = this.defaultCanvasColor;
          this.drawTime(0, '', false);
          return false;
        }

        if (this.restBetweenSetsDuration > 0) {
          this.inRestBetweenSets = true;
          this.canvas.style.backgroundColor = '#bbb';
          this.startTime = null;
          this.elapsed = 0;
          this.animate(currentTime);
          return false;
        }
      }

      this.currentIntervalIndex = 0;

      if (this.shouldSkipCurrentInterval()) {
        this.currentIntervalIndex++;
      }
    }

    const currentInterval = this.intervals[this.currentIntervalIndex];
    this.canvas.style.backgroundColor = currentInterval.color;
    this.startTime = null;
    this.elapsed = 0;
    return true;
  }

  skipCurrentInterval(currentTime) {
    if (this.advanceToNextInterval(currentTime)) {
      this.animate(currentTime);
    }
  }

  animate(currentTime) {
    if (!this.startTime) {
      this.startTime = currentTime;
    }

    this.elapsed = currentTime - this.startTime;

    if (this.inCountdown) {
      let remainingTime = this.countdownDuration - this.elapsed;
      if (remainingTime <= 0) {
        this.playAudio();
        this.inCountdown = false;
        if (this.shouldSkipCurrentInterval()) {
          this.skipCurrentInterval(currentTime);
          return;
        }
        this.canvas.style.backgroundColor = this.intervals[0].color;
        this.startTime = null;
        this.animate(currentTime);
        return;
      }
      this.drawTime(remainingTime, '', false);
    } else if (this.inRestBetweenSets) {
      let remainingRestTime = this.restBetweenSetsDuration - this.elapsed;
      if (remainingRestTime <= 0) {
        this.playAudio();
        this.inRestBetweenSets = false;
        this.currentIntervalIndex = 0;  // Reset the interval index
        this.startTime = null;
        if (this.shouldSkipCurrentInterval()) {
          this.skipCurrentInterval(currentTime);
          return;
        }
        this.canvas.style.backgroundColor = this.intervals[0].color;
        this.animate(currentTime);
        return;
      }
      this.drawTime(remainingRestTime, "Resting", true);
    } else {
      let currentInterval = this.intervals[this.currentIntervalIndex];

      let remainingTime = currentInterval.duration - this.elapsed;

      if (remainingTime <= 0) {
        this.playAudio();
        if (!this.advanceToNextInterval(currentTime)) {
          return;
        }

        currentInterval = this.intervals[this.currentIntervalIndex];
        remainingTime = currentInterval.duration;
      }

      this.drawTime(remainingTime, currentInterval.name);
    }

    if (!this.timerStopped) {
      requestAnimationFrame(this.animate.bind(this));
    } else {
      this.canvas.style.backgroundColor = this.defaultCanvasColor;
      this.drawTime(0, '', false);
    }
  }

  startTimer() {
    if (this.timerStopped) {
      this.requestWakeLock();
      // Capture the latest form input values
      this.configManager.captureInputs();

      if (!this.audio) {
        this.audio = new Audio('./timer.mp3');
        this.audio.setAttribute('playsinline', '');
        this.audio.preload = 'auto';
      }

      this.currentIntervalIndex = 0;
      this.currentRound = 1;
      this.startTime = null;

      this.intervals = this.configManager.capturedIntervals;
      const outputEl = document.getElementById('output');

      if (!this.intervals.length) {
        outputEl.innerHTML = 'Please create a timer first';
        outputEl.classList.add('output--error');

        return;
      } else {
        outputEl.innerHTML = '';
      }

      this.rounds = this.configManager.capturedRounds;
      this.countdownDuration = this.configManager.capturedCountdownDuration;
      this.sets = this.configManager.capturedSets;
      this.restBetweenSetsDuration = this.configManager.capturedRestBetweenSetsDuration;
      this.skipFinalInterval = this.configManager.capturedSkipFinalInterval;

      if (this.timerStopped && this.intervals.length > 0) {
        this.timerStopped = false;
        this.currentIntervalIndex = 0;
        this.currentRound = 1;
        if (this.countdownDuration > 0) {
          this.inCountdown = true;
        } else {
          if (this.shouldSkipCurrentInterval()) {
            requestAnimationFrame(this.skipCurrentInterval.bind(this));
            return;
          }
          this.canvas.style.backgroundColor = this.intervals[0].color;
        }
        this.startTime = null;
        requestAnimationFrame(this.animate.bind(this));
      }
    }

  }

  stopTimer() {
    if (!this.timerStopped) {
      this.timerStopped = true;
  
      this.startTime = null;
      this.elapsed = null;
      this.timerStopped = true;
      this.currentIntervalIndex = 0;
      this.currentRound = 1;
      this.inCountdown = false;
      this.currentSet = 1;
      this.inRestBetweenSets = false;
  
      this.canvas.style.backgroundColor = this.defaultCanvasColor;
      this.drawTime(0, '', false);
      this.releaseWakeLock();
    }
  }

  playAudio() {
    if (this.audio.paused) {
      if (!this.muted) {
        this.audio.play();
      }
    } else {
      this.audio.pause();
      this.audio.currentTime = 0;
      if (!this.muted) {
        this.audio.play();
      }
    }
  }

  async requestWakeLock() {
    if (!('wakeLock' in navigator)) {
      console.log('Wake Lock API not supported.');
      return;
    }
    
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released');
      });
      console.log('Wake Lock is active');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }
}
