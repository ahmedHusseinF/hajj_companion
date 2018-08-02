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

var mapInit = document.createElement('script');
mapInit.src =
  'https://maps.googleapis.com/maps/api/js?key=AIzaSyCfXJ4DFcVAriFGCrObaWS0L_Un0nW2wu8&callback=initMap';
mapInit.async = true;
mapInit.defer = true;
mapInit.id = 'theMapContent';

var myLocation;
let addedScript = null;
navigator.geolocation.getCurrentPosition(function(g) {
  myLocation = g.coords;
  watchingCollection.onSnapshot(function(querySnapshot) {
    console.log(querySnapshot);
    if (querySnapshot.docs.length > 0) {
      user = {
        id: querySnapshot.docs[0].data().user,
        location: querySnapshot.docs[0].data().location
      };
      console.log(user);
      if (window['theMapContent']) {
        window['theMapContent'].remove();
        //document.body.removeChild(addedScript);
      }
      document.body.appendChild(mapInit);
    }
  });
});

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
  var directionsDisplay = new google.maps.DirectionsRenderer();
  var directionsService = new google.maps.DirectionsService();
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 7,
    center: { lat: myLocation.latitude, lng: myLocation.longitude }
  });
  console.log({ lat: myLocation.latitude, lng: myLocation.longitude });
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById('right-panel'));

  var control = document.getElementById('floating-panel');
  control.style.display = 'block';
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);

  calculateAndDisplayRoute(directionsService, directionsDisplay);
}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
  var start = document.getElementById('start').value;
  var end = document.getElementById('end').value;
  directionsService.route(
    {
      origin: { lat: myLocation.latitude, lng: myLocation.longitude },
      destination: {
        lat: user.location.latitude,
        lng: user.location.longitude
      },
      travelMode: 'WALKING'
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
