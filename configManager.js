import LZString from 'lz-string';

export class ConfigManager {
  constructor() {
    // Initializing some properties to store intervals, rounds, and other settings.
    this.intervals = [];
    this.rounds = 1;
    this.countdownDuration = 0;
    this.sets = 1;
    this.restBetweenSetsDuration = 0;
    this.skipFinalInterval = false;
  }

  get successColour() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'lightgreen' : 'green';
  }

  get errorColour() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'tomato' : 'red';
  }

  captureInputs() {
    const intervalEls = document.querySelectorAll('.intervalFieldset');
    this.intervals = [];

    intervalEls.forEach(intervalEl => {
      const name = intervalEl.querySelector('.c-formField-intervalName input').value;
      const duration = parseInt(intervalEl.querySelector('.c-formField-intervalDuration input').value) * 1000;
      const color = intervalEl.querySelector('.c-formField-intervalColor').value;

      if (name && duration) {
        this.intervals.push({ name, duration, color });
      }
    });

    this.sets = parseInt(document.getElementById('sets').value) || 1;
    this.restBetweenSetsDuration = parseInt(document.getElementById('restBetweenSets').value) * 1000;
    this.countdownDuration = parseInt(document.getElementById('countdown').value) * 1000;
    this.rounds = parseInt(document.getElementById('rounds').value) || 1;
    this.skipFinalInterval = document.getElementById('skipFinalInterval').checked;
  }

  addInterval() {
      const container = document.getElementById('intervalContainer');
      const newInterval = document.createElement('fieldset');
      newInterval.classList.add('intervalFieldset', 'c-formField', 'c-formField--interval');

      // Define your placeholder colors here
      const colors = ['#01FF70', '#FF4136', '#FF851B', '#FFFF00', '#39CCCC', '#F012BE', '#7FDBFF'];
      const index = container.querySelectorAll('.intervalFieldset').length;
      
      // Cycle through the colors array
      const color = colors[(index) % colors.length];

      newInterval.innerHTML = `
        <label class="c-formField-intervalLabel c-formField-label c-formField-label--large">Interval ${index + 1}: </label>
        <div class="c-formField-intervalName">
          <label class="c-formField-label" for="intervalName${index + 1}">Name:</label>
          <input type="text" id="intervalName${index + 1}" placeholder="-" minlength="1">
        </div>
        <div class="c-formField-intervalDuration">
          <label class="c-formField-label" for="intervalDuration${index + 1}">Duration:</label>
          <input class="c-formField-intervalDuration" id="intervalDuration${index + 1}" type="number" placeholder="In seconds" min="1">
        </div>
        <input class="c-formField-intervalColor" type="color" value="${color}">
        <button class="deleteInterval btn btn--ghost c-formField-intervalDelete">Delete</button>
      `;
      newInterval.querySelector('.deleteInterval').addEventListener('click', function () {
          container.removeChild(newInterval);
      });
      container.appendChild(newInterval);
  }

  saveToURL() {
    try {
      this.captureInputs();
      const settings = {
        intervals: this.intervals,
        rounds: this.rounds,
        countdownDuration: this.countdownDuration,
        sets: this.sets,
        restBetweenSetsDuration: this.restBetweenSetsDuration,
        skipFinalInterval: this.skipFinalInterval
      };

      const serialized = JSON.stringify(settings);
      const compressed = LZString.compressToEncodedURIComponent(serialized);

      // Get the #save element and any existing message element within it
      const saveElement = document.querySelector('#customise');
      let messageElement = saveElement.querySelector('.save-message');

      // If there's no existing message, create one
      if (!messageElement) {
        messageElement = document.createElement('p');
        messageElement.classList.add('save-message');
        saveElement.appendChild(messageElement);
      }

      if (compressed.length <= 2000) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('config', compressed);
        window.history.pushState(null, '', newUrl);

        // Set a success message
        messageElement.textContent = 'Timer saved to the URL successfully! (bookmark to revisit)';
        messageElement.classList.remove('save-message--error');
      } else {
        // Set an error message
        messageElement.textContent = 'URL character length is above 2000. Consider other methods of saving configuration.';
        messageElement.classList.add('save-message--error');
      }
    } catch (error) {
      console.error(error);

      const saveElement = document.querySelector('#customise');
      let messageElement = saveElement.querySelector('.save-message');

      // If there's no existing message, create one
      if (!messageElement) {
        messageElement = document.createElement('p');
        messageElement.classList.add('save-message');
      }
      
      // Set the error message
      messageElement.classList.add('save-message--error');
      messageElement.textContent = 'Failed to save the timer.';

      saveElement.appendChild(messageElement);
    }
  }


  loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const config = urlParams.get('config');

    if (config) {
      const decompressed = LZString.decompressFromEncodedURIComponent(config);
      const data = JSON.parse(decompressed);

      this.intervals = data.intervals;
      this.rounds = data.rounds;
      this.countdownDuration = data.countdownDuration;
      this.sets = data.sets;
      this.restBetweenSetsDuration = data.restBetweenSetsDuration;
      this.skipFinalInterval = data.skipFinalInterval === true;
      this.populateFields();
      document.getElementById('output').classList.remove('output--error');
      document.getElementById('output').innerHTML = 'Timer loaded from URL. (See "Customise timer" for settings)';
      document.getElementById('customise').open = true;
    }
  }

  // loadFromSettings(settings) {
  //   this.intervals = settings.intervals;
  //   this.rounds = settings.rounds;
  //   this.countdownDuration = settings.countdownDuration;
  //   this.sets = settings.sets;
  //   this.restBetweenSetsDuration = settings.restBetweenSetsDuration;

  //   // Load the values into the appropriate input fields based on the provided settings
  //   document.getElementById('rounds').value = settings.rounds || '';
  //   document.getElementById('countdown').value = settings.countdownDuration / 1000 || ''; // converting to seconds
  //   document.getElementById('sets').value = settings.sets || '';
  //   document.getElementById('restBetweenSets').value = settings.restBetweenSetsDuration / 1000 || ''; // converting to seconds

  //   const container = document.getElementById('intervalContainer');

  //   // Clear out existing intervals
  //   container.innerHTML = '';

  //   settings.intervals.forEach(interval => {
  //     const newInterval = document.createElement('fieldset');
  //     newInterval.className = 'intervalFieldset';
  //     newInterval.innerHTML = `
  //                   <label>Interval ${container.querySelectorAll('.intervalFieldset').length + 1}: </label>
  //                   <input type="text" placeholder="Name" class="interval-name" value="${interval.name}" minlength="1">
  //                   <input type="number" placeholder="Seconds" class="interval-duration" value="${interval.duration / 1000}" min="1">
  //                   <input type="color" class="interval-color" value="${interval.color}">
  //               `;

  //     container.appendChild(newInterval);
  //   });

  //   // Notify the user that settings have been loaded
  //   document.getElementById('output').classList.remove('output--error');
  //   document.getElementById('output').innerHTML = 'Timer loaded from QR. (See "Customise timer" for settings)';

  //   document.getElementById('customise').open = true;
  // }

  populateFields() {
    document.getElementById('countdown').value = this.countdownDuration / 1000;
    document.getElementById('rounds').value = this.rounds;
    document.getElementById('sets').value = this.sets;
    document.getElementById('restBetweenSets').value = this.restBetweenSetsDuration / 1000;
    document.getElementById('skipFinalInterval').checked = this.skipFinalInterval;

    const container = document.getElementById('intervalContainer');
    container.innerHTML = '';

    this.intervals.forEach(interval => {
      const newInterval = document.createElement('fieldset');
      newInterval.classList.add('intervalFieldset', 'c-formField', 'c-formField--interval');
      newInterval.innerHTML = `
          <label class="c-formField-intervalLabel c-formField-label c-formField-label--large">Interval ${container.querySelectorAll('.intervalFieldset').length + 1}: </label>
          <div class="c-formField-intervalName">
            <label class="c-formField-label" for="intervalName${container.querySelectorAll('.intervalFieldset').length + 1}">Name:</label>
            <input type="text" id="intervalName${container.querySelectorAll('.intervalFieldset').length + 1}" value="${interval.name}" placeholder="-" minlength="1">
          </div>
          <div class="c-formField-intervalDuration">
            <label class="c-formField-label" for="intervalDuration${container.querySelectorAll('.intervalFieldset').length + 1}">Duration:</label>
            <input class="c-formField-intervalDuration" id="intervalDuration${container.querySelectorAll('.intervalFieldset').length + 1}" value="${interval.duration / 1000}" type="number" placeholder="In seconds" min="1">
          </div>
          <input class="c-formField-intervalColor" type="color" value="${interval.color}">
          <button class="deleteInterval btn btn--ghost c-formField-intervalDelete">Delete</button>
      `;
      newInterval.querySelector('.deleteInterval').addEventListener('click', function() {
        container.removeChild(newInterval);
      });
      container.appendChild(newInterval);
    });    
  }

  get capturedIntervals() {
    return this.intervals;
  }

  get capturedRounds() {
    return this.rounds;
  }

  get capturedCountdownDuration() {
    return this.countdownDuration;
  }

  get capturedSets() {
    return this.sets;
  }

  get capturedRestBetweenSetsDuration() {
    return this.restBetweenSetsDuration;
  }

  get capturedSkipFinalInterval() {
    return this.skipFinalInterval;
  }
}
