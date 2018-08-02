const auth = firebase.auth();
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

let admin = localStorage.getItem('admin');

auth.onAuthStateChanged(function(user) {
  if (user) {
    if (localStorage.getItem('user')) {
      document.location = 'index.html';
    } else {
      // User is signed in.
      console.log('user is signed in');
    }
  } else {
    // No user is signed in.
    document.location = 'login.html';
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
    document.location = 'login.html';
  } catch (error) {
    console.error(error);
  }
});

function initMap() {
  navigator.geolocation.getCurrentPosition(function(pos) {
    let directionsDisplay = new google.maps.DirectionsRenderer();
    let directionsService = new google.maps.DirectionsService();
    let map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: { lat: pos.coords.latitude, lng: pos.coords.longitude }
    });
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('right-panel'));

    watchingCollection.onSnapshot(async function(querySnapshot) {
      console.log(querySnapshot.empty);
      if (!querySnapshot.empty) {
        document.querySelector('#map').style.display = 'block';
        let user = {
          id: querySnapshot.docs[0].data().user,
          location: querySnapshot.docs[0].data().location
        };
        // console.log(user);
        try {
          await db
            .collection(`users`)
            .doc(admin)
            .update({ busy: true });
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
          await db
            .collection(`users`)
            .doc(admin.id)
            .update({ busy: false });
        } catch (err) {
          console.error(err);
        }
        document.querySelector('#map').style.display = 'none';
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
