const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
const auth = firebase.auth();

let userID = localStorage.getItem('user');

auth.onAuthStateChanged(async function(authUser) {
  if (authUser) {
    if (userID) {
      // User is signed in.
      console.log('user is signed in');
      const docSnapshot = await db.collection('users').doc(userID);

      docSnapshot.onSnapshot(querySnapshot => {
        user = querySnapshot.data();
        if (!user.lostStatus) {
          document.querySelector('#lost').style.display = 'block';
        } else {
          document.querySelector('#lost').style.display = 'none';
        }
      });

      // console.log(docSnapshot);

      // the querySnapshot is guarenteed to have ONLY one element but we have to iterate over it
    } else {
      document.location = 'leader.html';
    }
  } else {
    // No user is signed in.
    document.location = 'index.html';
  }
});

document.querySelector('#logout').addEventListener('click', async ev => {
  try {
    await auth.signOut();
    localStorage.removeItem('user');
    document.location = 'index.html';
  } catch (error) {
    console.error(error);
  }
});

let watchID = 0;
let globalPos = null;
document.querySelector('#lost').addEventListener('click', async ev => {
  document.querySelector('#lost').style.display = 'none';

  const docSnapshot = await db
    .collection('users')
    .doc(userID)
    .get();

  watchID = navigator.geolocation.watchPosition(
    async pos => {
      console.log(pos, 'tracking location - user');
      globalPos = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
      // pos.coords.latitude / longitude
      const leaderSnapshot = await db
        .collection('users')
        .where('group', '==', user.group)
        .where('type', '==', 'Leader')
        .orderBy('handledLosses')
        .get();

      let leaderID = leaderSnapshot.docs[0].id;

      docSnapshot.ref.update({ lostStatus: true, helpingLeader: leaderID });

      db.collection(`users/${leaderID}/watchCollection`)
        .doc(docSnapshot.id)
        .set(
          {
            location: new firebase.firestore.GeoPoint(
              pos.coords.latitude,
              pos.coords.longitude
            ),
            user: docSnapshot.id
          },
          { merge: true }
        );
    },
    _ => {},
    { enableHighAccuracy: true, maximumAge: 0 }
  );
});

function initMap() {
  navigator.geolocation.getCurrentPosition(
    async function(pos) {
      let directionsDisplay = new google.maps.DirectionsRenderer();
      let directionsService = new google.maps.DirectionsService();
      const myPos = new google.maps.LatLng(
        pos.coords.latitude,
        pos.coords.longitude
      );
      let map = new google.maps.Map(document.getElementById('map'), {
        zoom: 17,
        center: myPos
      });
      var marker = new google.maps.Marker({ position: myPos, map });
      directionsDisplay.setPanel(document.getElementById('right-panel'));

      const docSnapshot = await db.collection('users').doc(userID);

      docSnapshot.onSnapshot(async function(querySnapshot) {
        let userData = querySnapshot.data();
        if (userData.lostStatus === true) {
          var leaderData = await db
            .collection('users')
            .doc(userData.helpingLeader)
            .get();

          leaderData = leaderData.data();
          directionsDisplay.setMap(map);

          if (leaderData.location.latitude == 0) {
            M.toast({ html: 'Current Leader is offline' });
            return;
          }

          calculateAndDisplayRoute(
            directionsService,
            directionsDisplay,
            globalPos,
            leaderData.location
          );
        } else {
          navigator.geolocation.clearWatch(watchID);
          directionsDisplay.setMap(null);
        }
      });
    },
    _ => {},
    { enableHighAccuracy: true, maximumAge: 0 }
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
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    }
  );
}

/* watchingCollection.onSnapshot(async function(querySnapshot) {
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
        .doc(leader.id)
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
    document.querySelector('#map').style.display = 'none';
  }
}); */
