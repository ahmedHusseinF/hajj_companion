const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
const auth = firebase.auth();

let user;

auth.onAuthStateChanged(async function(authUser) {
  if (authUser) {
    if (localStorage.getItem('user')) {
      // User is signed in.
      console.log('user is signed in');

      const currentUser = localStorage.getItem('user');
      const docSnapshot = await db
        .collection('users')
        .doc(currentUser)
        .get();

      console.log(docSnapshot);    
      // the querySnapshot is guarenteed to have ONLY one element but we have to iterate over it
      user = docSnapshot.data();


    } else {
      document.location = 'admin.html';
    }

  } else {
    // No user is signed in.
    document.location = 'login.html';
  }
});

document.querySelector('#logout').addEventListener('click', async ev => {
  try {
    await auth.signOut();
    localStorage.removeItem('user');
    document.location = 'login.html';
  } catch (error) {
    console.error(error);
  }
});

if (!user.lostStatus) {
  document.querySelector('#lost').css.display = 'block';
}

document.querySelector('#lost').addEventListener('click', async ev => {
  
  document.querySelector('#lost').css.display = 'none';

  docSnapshot.ref.set({ lostStatus: true }, { merge: true });

  navigator.geolocation.watchPosition(async pos => {
    // pos.coords.latitude / longitude
    const leaderSnapshot = await db
      .collection('users')
      .where('group', '==', user.group.path)
      .where('type', '==', 'Leader')
      .where('busy', '==', false)
      .get();

    let leaderID = leaderSnapshot.docs[0].id;

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
  });
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
            .doc(admin.id)
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
