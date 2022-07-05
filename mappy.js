'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
//First Popup
const modal = document.querySelector('.modal');
const btnCloseModal = document.querySelector('.btn--close-modal');
const overlay = document.querySelector('.overlay');
const btnDelet = document.querySelector('.delete');
//Second Popup
const modal2 = document.querySelector('.modal--2');
const btnCloseModal2 = document.querySelector('.btn--close-modal--2');
const overlay2 = document.querySelector('.overlay--2');
const btnDelet2 = document.querySelector('.delete--2');
const trash = document.querySelector('.trash');
const navbar = document.querySelector('.navbar');
const btnSort = document.querySelector('.btn--sort');

class Workout {
  date = new Date();
  id = `${this.date.getTime().toString().slice(-10)}`;
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _description() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} On ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Runnig extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this._calcPace();
    this._description();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this._calcSpeed();
    this._description();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  // store all workout object in an array
  #workouts = [];
  #map;
  #mapEvent;
  #bigContainer;
  #storeHtml = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    form.addEventListener('submit', this._newWorkout.bind(this));
    trash.addEventListener('click', this._deleteAllWorkout.bind(this));
    navbar.addEventListener('click', this._navBarAnimation.bind(this));
    btnSort.addEventListener('click', this._sortWorkouts.bind(this));
  }

  //get current location coords of the user
  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
      alert(`can't get ur position`)
    );
  }

  //render map on current location
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    L.marker(coords)
      .addTo(this.#map)
      .bindPopup('current location', {
        maxWidth: 250,
        minWidth: 100,
        closeOnClick: false,
        autoClose: false,
        className: 'location-popup',
      })
      .openPopup();

    // when the user click on the map
    this.#map.on('click', this._showForm.bind(this));
  }
  //hide form
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => ((form.style.display = 'grid'), 1000));
  }
  //render workout form
  _showForm(posiClick) {
    this.#mapEvent = posiClick; // now we have the coords of user position clicked on map
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  //toggle between form inputs
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const testPositive = (...inputs) => inputs.every(inp => inp > 0);
    const testNumber = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    //get form data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // test if data is valid (running object):
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !testPositive(distance, duration, cadence) ||
        !testNumber(distance, duration, cadence)
      )
        return alert('the inputs should be a positive numbers !');
      //create running object
      workout = new Runnig(distance, duration, [lat, lng], cadence);
      this.#workouts.push(workout);
    }

    // test if data is valid (cycling object):

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !testPositive(distance, duration) ||
        !testNumber(distance, duration, elevation)
      )
        return alert('the inputs should be a positive numbers !');
      //create cycling object
      workout = new Cycling(distance, duration, [lat, lng], elevation);
      this.#workouts.push(workout);
    }

    this._renderWorkoutMarker(workout);

    this._renderWorkout(workout);

    this._hideForm();

    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    //render workout on map (depend on clicked position)
    // const { lat, lng } = this.#mapEvent.latlng;

    const greenIcon = L.icon({
      iconUrl:
        workout.type === 'running' ? 'icon.png' : 'output-onlinepngtools.png',
      iconSize: [44, 58], // size of the icon
      iconAnchor: [11, 86], // point of the icon which will correspond to marker's location
      popupAnchor: [15, -76], // point from which the popup should open relative to the iconAnchor
    });
    L.marker(workout.coords, { icon: greenIcon })
      .addTo(this.#map)
      .bindPopup(
        `${inputType.value === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`,
        {
          maxWidth: 250,
          minWidth: 100,
          closeOnClick: false,
          autoClose: false,
          className: `${inputType.value}-popup`,
        }
      )
      .openPopup();
  }

  _workoutDetails(workout) {
    let html = `
    <div class="big">
     <div class="circle"></div>
     <div class="workout__close">
     <i class="fa-solid fa-circle-xmark"></i>
     </div>
     <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value km">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
  </div>`;
    } else {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
      </div>
   </li>
   </div>`;
    }
    return html;
  }
  //render workout on list
  _renderWorkout(workout) {
    let html = this._workoutDetails(workout);

    form.insertAdjacentHTML('afterend', html);
    let closebtn = document.querySelector('.workout__close');

    this._deleted();
  }

  _deleted() {
    const closebtn = document.querySelector('.workout__close');
    closebtn.addEventListener('click', e => {
      e.preventDefault();
      this.#bigContainer = e.target.closest('.big');
      modal.classList.remove('hidden');
      overlay.classList.remove('hidden');
      btnDelet.addEventListener('click', this._deleteWorkout.bind(this));
    });

    btnCloseModal.addEventListener('click', () => {
      modal.classList.add('hidden');
      overlay.classList.add('hidden');
    });
  }

  _moveToPopup(e) {
    const workdelegation = e.target.closest('.workout');
    if (!workdelegation) return;
    const workEl = this.#workouts.find(
      work => work.id === workdelegation.dataset.id
    );

    this.#map.setView(workEl.coords, this.#map._zoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      setTimeout(() => this._renderWorkoutMarker(work), 1000);
    });
  }

  _reset() {
    localStorage.removeItem('workout');
    location.reload();
  }

  _deleteWorkout() {
    this.#bigContainer.style.transition = '1s ease-in-out';
    this.#bigContainer.style.opacity = '0';
    setTimeout(() => (this.#bigContainer.style.display = 'none'), 1000);

    const idWork = this.#bigContainer.querySelector('.workout').dataset.id;
    const foundIndWorkout = this.#workouts.findIndex(
      work => work.id === idWork
    );

    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    this.#workouts.splice(foundIndWorkout, 1);
    let workouts = JSON.parse(localStorage.getItem('workout'));
    workouts.splice(foundIndWorkout, 1);
    localStorage.setItem('workout', JSON.stringify(workouts));
  }

  _deleteAllWorkout() {
    modal2.classList.remove('hidden');
    overlay2.classList.remove('hidden');
    btnDelet2.addEventListener('click', () => {
      localStorage.removeItem('workout');
      location.reload();
      modal2.classList.add('hidden');
      overlay2.classList.add('hidden');
    });

    btnCloseModal2.addEventListener('click', () => {
      modal2.classList.add('hidden');
      overlay2.classList.add('hidden');
    });
  }

  _navBarAnimation() {
    containerWorkouts.classList.toggle('hidden');
    document.querySelector('.logo').classList.toggle('hidden');
    document.querySelector('.copyright').classList.toggle('hidden');
    document.querySelector('.sidebar').classList.toggle('sidebar--active');
  }

  _sortWorkouts(e) {
    e.preventDefault();
    this.#storeHtml = this.#workouts.sort((a, b) => b.distance - a.distance);
    const htmlEl = document.querySelectorAll('.big');
    htmlEl.forEach(ht => ht.remove());

    this.#storeHtml.forEach(htmlel => {
      let html = this._workoutDetails(htmlel);
      form.insertAdjacentHTML('afterend', html);
      this._deleted();
    });
  }
}

const workObject = new App();
