import './src/scss/style.scss';
import { Timer } from './timer';
import { ConfigManager } from './configManager';
// import { QRHandler } from './qrHandler';

// Wrap everything inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Initializations
  const configManager = new ConfigManager();
  configManager.loadFromURL();
  const timer = new Timer(configManager);
  // const qrHandler = new QRHandler(timer);

  // Re-enable wakelock if the browser was minimised and a wake lock already existed
  document.addEventListener('visibilitychange', async () => {
    if (timer.wakeLock !== null && document.visibilityState === 'visible') {
      await timer.requestWakeLock();
    }
  });

  // Event listeners for ConfigManager
  document.getElementById('addInterval').addEventListener('click', configManager.addInterval.bind(configManager));
  document.getElementById('createURL').addEventListener('click', configManager.saveToURL.bind(configManager));

  // Event listeners for Timer
  const playIcon = `
<svg viewBox="-3 0 28 28" xmlns="http://www.w3.org/2000/svg">
  <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="Icon-Set-Filled" transform="translate(-419 -571)" fill="#000">
      <path d="m440.415 583.554-18.997-12.243c-1.127-.607-2.418-.544-2.418 1.635v24.108c0 1.992 1.385 2.306 2.418 1.635l18.997-12.243a2.076 2.076 0 0 0 0-2.892" id="play"/>
    </g>
  </g>
</svg>`;

  const pauseIcon = `
<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
  <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="Icon-Set-Filled" fill="#000">
      <path d="M9 2H5a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm14 0h-4a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" id="pause"/>
    </g>
  </g>
</svg>`;

  const startBtnStates = {
    idle: { html: `${playIcon}\nStart`, label: 'Start timer' },
    running: { html: `${pauseIcon}\nPause`, label: 'Pause timer' },
    paused: { html: `${playIcon}\nResume`, label: 'Resume timer' },
  };

  const startBtn = document.getElementById('startTimer');
  startBtn.addEventListener('click', timer.toggleTimer.bind(timer));

  // The timer can also stop itself when the workout ends, so follow its state rather
  // than flipping the button inside the click handler
  document.documentElement.addEventListener('timerStateChange', (e) => {
    const { html, label } = startBtnStates[e.detail.state] ?? startBtnStates.idle;

    startBtn.innerHTML = html;
    startBtn.setAttribute('aria-label', label);
    startBtn.dataset.state = e.detail.state;
  });

  document.getElementById('stopTimer').addEventListener('click', timer.stopTimer.bind(timer));
  const muteBtnCopy = `
<svg viewBox="0 -3 30 30" xmlns="http://www.w3.org/2000/svg">
  <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="Icon-Set-Filled" transform="translate(-311 -573)" fill="#000">
      <path d="m336.444 585 4.173-4.173c.45-.45.492-1.139.094-1.538-.399-.398-1.088-.356-1.538.094L335 583.556l-4.173-4.173c-.45-.45-1.139-.492-1.538-.094-.398.399-.356 1.088.094 1.538l4.173 4.173-4.173 4.173c-.45.45-.492 1.139-.094 1.538.399.398 1.088.356 1.538-.094l4.173-4.173 4.173 4.173c.45.45 1.139.492 1.538.094.398-.399.356-1.088-.094-1.538L336.444 585ZM325 573l-7 4.667v14.666l7 4.667a2 2 0 0 0 2-2v-20a2 2 0 0 0-2-2Zm-14 8v8a2 2 0 0 0 2 2h3v-12h-3a2 2 0 0 0-2 2Z" id="volume-muted"/>
    </g>
  </g>
</svg>
Mute timer`;

  const unMuteBtnCopy = `
<svg viewBox="0 -0.5 25 25" xmlns="http://www.w3.org/2000/svg">
  <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="Icon-Set-Filled" transform="translate(-209 -573)" fill="#000">
      <path d="M228 578.101v2a5 5 0 0 1 0 9.798v2c3.388-.489 6-3.376 6-6.899s-2.612-6.41-6-6.899ZM209 581v8a2 2 0 0 0 2 2h3v-12h-3a2 2 0 0 0-2 2Zm14-8-7 4.667v14.666l7 4.667a2 2 0 0 0 2-2v-20a2 2 0 0 0-2-2Z" id="volume"/>
    </g>
  </g>
</svg>
Unmute timer`;

  const muteBtn = document.getElementById('muteTimer');
  muteBtn.addEventListener('click', (e) => {
    timer.toggleMuteTimer();
    if (muteBtn.dataset.muted) {
      muteBtn.innerHTML = unMuteBtnCopy;
      delete muteBtn.dataset.muted
    } else {
      muteBtn.innerHTML = muteBtnCopy;
      muteBtn.dataset.muted = true;
    }
  });
  // Event listeners for QRHandler
  // document.getElementById('saveToQR').addEventListener('click', qrHandler.saveToQR.bind(qrHandler));
  // document.getElementById('scanQR').addEventListener('click', qrHandler.scanQR.bind(qrHandler));
  // qrHandler.handleQRUpload();   

  document.querySelectorAll('details').forEach(details => {
    let clicked = false;

    details.addEventListener('click', () => {
      clicked = true;
    });

    details.addEventListener('toggle', function () {
      if (clicked) {
        this.scrollIntoView({ behavior: 'smooth', block: 'start' });
        clicked = false;  // Reset the flag
      }
    });
  });

  // const themeToggle = document.getElementById('themeToggle');
  // const logo = document.getElementById('logo');

  // themeToggle.addEventListener('click', () => {
  //   if (document.documentElement.getAttribute('data-theme') === 'dark') {
  //     document.documentElement.removeAttribute('data-theme');
  //     themeToggle.innerHTML = '<span>&#9790;</span>';
  //     logo.src = "./logo-light.png";
  //   } else {
  //     document.documentElement.setAttribute('data-theme', 'dark');
  //     themeToggle.innerHTML = '<span>&#9728;</span>';
  //     logo.src = "./logo-dark.png";
  //   }

  //   const themeChangeEvent = new Event('themeChange');
  //   document.documentElement.dispatchEvent(themeChangeEvent);
  // });
});
