const auth = firebase.auth();
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

let admin = localStorage.getItem('admin');

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
  .doc(admin)
  .collection('watchCollection');

// Logout
document.querySelector('#logout').addEventListener('click', async ev => {
  try {
    await auth.signOut();
    localStorage.removeItem('admin');
    document.location = 'index.html';
  } catch (error) {
    console.error(error);
  }
});

window.globalPos = null;
window.allMaps = [];
let watchID = navigator.geolocation.watchPosition(async pos => {
  globalPos = { lat: pos.coords.latitude, lang: pos.coords.longitude };
  await db
    .collection('users')
    .doc(admin)
    .update({ location: globalPos });

  window.allMaps.forEach(map => {
    map.setCenter(globalPos);
  });
});

function initMap() {
  let directionsDisplay = new google.maps.DirectionsRenderer();
  let directionsService = new google.maps.DirectionsService();
  let insertMaps = document.getElementById('insertMaps');

  watchingCollection.onSnapshot(async function(querySnapshot) {
    querySnapshot.docs.forEach(async doc => {
      let li = document.createElement('li');
      let header = document.createElement('div');
      header.classList.add('collapsible-header');
      let i = document.createElement('i');
      i.classList.add('material-icon');
      i.innerHTML = 'place';
      header.appendChild(i);
      header.innerText = 'HELP';

      let body = document.createElement('div');
      body.classList.add('collapsible-body');
      let map = document.createElement('div');
      let googleMap = new gooogle.maps.Map(map, {
        zoom: 12,
        center: globalPos
      });
      allMaps.push(googleMap);
      body.appendChild(map);

      li.appendChild(header);
      li.appendChild(body);
      insertMaps.appendChild(li);
    });
  });

  let map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: { lat: pos.coords.latitude, lng: pos.coords.longitude }
  });
  watchID = navigator.geolocation.watchPosition(
    function(pos) {
      console.log(pos, 'tracking location - admin');
      map.setCenter(
        new firabase.firestore.GeoPoint(
          pos.coords.latitude,
          pos.coords.longitude
        )
      );

      watchingCollection.onSnapshot(async function(querySnapshot) {
        if (!querySnapshot.empty) {
          document.querySelector('#map').style.display = 'block';
          let user = {
            id: querySnapshot.docs[0].data().user,
            location: querySnapshot.docs[0].data().location
          };
          localStorage.setItem('lostUser', user.id);
          try {
            await db
              .collection(`users`)
              .doc(admin)
              .update({
                busy: true,
                location: new firebase.firestore.GeoPoint(
                  pos.coords.latitude,
                  pos.coords.longitude
                )
              });
          } catch (err) {
            console.error(err);
          }
          calculateAndDisplayRoute(
            directionsService,
            directionsDisplay,
            pos.coords,
            user.location
          );
        } else {
          try {
            // free the leader, and do listeners cleanup
          } catch (err) {
            console.error(err);
          }
          document.getElementById('map').style.display = 'none';
          document.getElementById('found').style.display = 'none';
        }
      });
    },
    _ => {},
    { enableHighAccuracy: true }
  );
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
        //directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    }
  );
}

document.getElementById('found').addEventListener('click', async function(ev) {
  ev.preventDefault();

  const lostUser = localStorage.getItem('lostUser');
  try {
    await db
      .collection(`users`)
      .doc(lostUser)
      .update({ lostStatus: false, helpingLeader: '' });

    localStorage.removeItem('lostUser');

    navigator.geolocation.clearWatch(watchID);

    await db
      .collection(`users/${admin}/watchCollection`)
      .doc(lostUser)
      .delete();
  } catch (error) {
    console.error(error);
  }
});

window.onbeforeunload(async function(ev) {
  try {
    await db
      .collection('users')
      .doc(admin)
      .update({ location: new firebase.firestore.GeoPoint(0, 0) });
  } catch (error) {
    console.error(error);
  }
});
