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

let watchID = 0;
function initMap() {
  let directionsDisplay = new google.maps.DirectionsRenderer();
  let directionsService = new google.maps.DirectionsService();
  directionsDisplay.setPanel(document.getElementById('right-panel'));

  let map;
  watchID = navigator.geolocation.watchPosition(function(pos) {
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: { lat: pos.coords.latitude, lng: pos.coords.longitude }
    });
    directionsDisplay.setMap(map);

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

document.getElementById('found').addEventListener('click', async function(ev) {
  ev.preventDefault();

  const lostUser = localStorage.getItem('lostUser');
  try {
    await db
      .collection(`users`)
      .doc(admin)
      .update({ busy: false });

    await db
      .collection(`users`)
      .doc(lostUser)
      .update({ lostStatus: false });

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
