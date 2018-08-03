const auth = firebase.auth();
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

let leader = localStorage.getItem('leader');

auth.onAuthStateChanged(function(user) {
  if (user) {
    if (localStorage.getItem('user')) {
      document.location = 'user.html';
    } else {
      // User is signed in.
      console.log('user is signed in');
    }
  } else {
    // No user is signed in.
    document.location = 'index.html';
  }
});

const watchingCollection = db
  .collection('users')
  .doc(leader)
  .collection('watchCollection');

// Logout
document.querySelector('#logout').addEventListener('click', async ev => {
  try {
    await auth.signOut();
    localStorage.removeItem('leader');
    document.location = 'index.html';
  } catch (error) {
    console.error(error);
  }
});

window.globalPos = { lat: 22.212321, lng: 39.31453321 };
window.allMaps = [];
let watchID = navigator.geolocation.watchPosition(
  async pos => {
    globalPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };

    await db
      .collection('users')
      .doc(leader)
      .update({
        location: new firebase.firestore.GeoPoint(globalPos.lat, globalPos.lng)
      });

    window.allMaps.forEach(obj => {
      if (!obj.map) {
        return;
      }
      obj.map.setCenter(globalPos);
    });
  },
  _ => {},
  { enableHighAccuracy: true }
);

function generateMapForUser(user, loc, handledLosses, name) {
  let directionsDisplay = new google.maps.DirectionsRenderer();
  let directionsService = new google.maps.DirectionsService();

  let li = document.createElement('li');
  li.classList.add(user);
  let header = document.createElement('div');
  header.classList.add('collapsible-header');
  let placeIcon = document.createElement('i');
  placeIcon.classList.add('material-icon');
  placeIcon.innerHTML = 'place';
  header.appendChild(placeIcon);
  header.innerText = name;

  let body = document.createElement('div');
  body.classList.add('collapsible-body');
  let map = document.createElement('div');
  map.classList.add('map');
  let googleMap = new google.maps.Map(map, {
    zoom: 17,
    center: globalPos
  });
  directionsDisplay.setMap(googleMap);

  calculateAndDisplayRoute(
    directionsService,
    directionsDisplay,
    { latitude: globalPos.lat, longitude: globalPos.lng },
    loc
  );
  allMaps.push({ googleMap, directionsDisplay, directionsService, user });

  body.appendChild(map);
  let found = document.createElement('a');
  found.classList.add(
    'btn',
    'btn-small',
    'waves-effect',
    'waves-light',
    'waves-green',
    'found'
  );
  found.innerHTML = 'FOUND';
  found.id = user;
  body.appendChild(found);

  li.appendChild(header);
  li.appendChild(body);
  insertMaps.appendChild(li);

  handledLosses++;
  let els = document.querySelectorAll('.found');
  if (els.length) {
    els.forEach(el => {
      el.onclick = async function(ev) {
        ev.preventDefault();
        console.log(ev);

        const lostUser = ev.target.id;
        try {
          await db
            .collection(`users`)
            .doc(lostUser)
            .update({ lostStatus: false, helpingLeader: '' });

          localStorage.removeItem('lostUser');

          navigator.geolocation.clearWatch(watchID);

          await db
            .collection(`users/${leader}/watchCollection`)
            .doc(lostUser)
            .delete();

          insertMaps.removeChild(document.querySelector(`li.${user}`));
        } catch (error) {
          console.error(error);
        }
      };
    });
  }
}

function updateMapForUser(user, loc) {
  window.allMaps.forEach(obj => {
    if (obj.user == user) {
      calculateAndDisplayRoute(
        obj.directionsService,
        obj.directionsDisplay,
        { latitude: globalPos.lat, longitude: globalPos.lng },
        loc
      );
    }
  });
}

function initMap() {
  let insertMaps = document.getElementById('insertMaps');

  watchingCollection.onSnapshot(async function(querySnapshot) {
    // insertMaps.innerHTML = '';
    // window.allMaps = [];
    let handledLosses = 0;

    querySnapshot.docs.forEach(async doc => {
      let data = doc.data();

      let index = window.allMaps.find(obj => {
        if (obj.user == data.user) return true;
      });
      if (index) {
        // we found him
        updateMapForUser(data.user, data.location);
      } else {
        // generate
        generateMapForUser(data.user, data.location, handledLosses, data.name);
      }
    });
    await db
      .collection('users')
      .doc(leader)
      .update({ handledLosses });
  });
}

function calculateAndDisplayRoute(
  directionsService,
  directionsDisplay,
  myPos,
  hisPos,
  mode = 'WALKING'
) {
  directionsService.route(
    {
      origin: { lat: myPos.latitude, lng: myPos.longitude },
      destination: {
        lat: hisPos.latitude,
        lng: hisPos.longitude
      },
      travelMode: mode
    },
    function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    }
  );
}

window.onbeforeunload = async function(ev) {
  try {
    this.navigator.geolocation.getCurrentPosition(async pos => {
      await db
        .collection('users')
        .doc(leader)
        .update({
          location: new firebase.firestore.GeoPoint(
            pos.coords.latitude,
            pos.coords.longitude
          )
        });
    });
  } catch (error) {
    console.error(error);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.collapsible');
  var instances = M.Collapsible.init(elems, {});
});
