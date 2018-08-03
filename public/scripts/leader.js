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
  { enableHighAccuracy: true, maximumAge: 0 }
);

function initMap() {
  let insertMaps = document.getElementById('insertMaps');

  watchingCollection.onSnapshot(async function(querySnapshot) {
    insertMaps.innerHTML = '';

    let handledLosses = 0;
    window.allMaps = [];
    querySnapshot.docs.forEach(async doc => {
      let directionsDisplay = new google.maps.DirectionsRenderer();
      let directionsService = new google.maps.DirectionsService();

      let li = document.createElement('li');
      let header = document.createElement('div');
      header.classList.add('collapsible-header');
      let placeIcon = document.createElement('i');
      placeIcon.classList.add('material-icon');
      placeIcon.innerHTML = 'place';
      header.appendChild(placeIcon);
      header.innerText = 'HELP';

      let body = document.createElement('div');
      body.classList.add('collapsible-body');
      let map = document.createElement('div');
      map.classList.add('map');
      let googleMap = new google.maps.Map(map, {
        zoom: 30,
        center: globalPos
      });
      directionsDisplay.setMap(googleMap);

      calculateAndDisplayRoute(
        directionsService,
        directionsDisplay,
        { latitude: globalPos.lat, longitude: globalPos.lng },
        doc.data().location
      );
      allMaps.push({ googleMap, directionsDisplay, directionsService });

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
      found.id = doc.data().user;
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
            } catch (error) {
              console.error(error);
            }
          };
        });
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
    await db
      .collection('users')
      .doc(leader)
      .update({ location: new firebase.firestore.GeoPoint(0, 0) });
  } catch (error) {
    console.error(error);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('.collapsible');
  var instances = M.Collapsible.init(elems, {});
});
