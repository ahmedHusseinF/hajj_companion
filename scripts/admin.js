const auth = firebase.auth();
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

let user;

let admin = localStorage.getItem('admin');
admin = JSON.parse(admin);

const watchingCollection = db
  .collection('users')
  .doc(admin.id)
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

//function onUserLocationChange() {}

function initMap() {
  navigator.geolocation.getCurrentPosition(function(pos) {
    myLocation = pos.coords;

    let directionsDisplay = new google.maps.DirectionsRenderer();
    let directionsService = new google.maps.DirectionsService();
    let map = new google.maps.Map(document.getElementById('map'), {
      zoom: 7,
      center: { lat: pos.coords.latitude, lng: pos.coords.longitude }
    });
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('right-panel'));

    watchingCollection.onSnapshot(function(querySnapshot) {
      console.log(querySnapshot);
      if (querySnapshot.docs.length > 0) {
        user = {
          id: querySnapshot.docs[0].data().user,
          location: querySnapshot.docs[0].data().location
        };
        console.log(user);
        calculateAndDisplayRoute(
          directionsService,
          directionsDisplay,
          pos.coords,
          user.location
        );
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
