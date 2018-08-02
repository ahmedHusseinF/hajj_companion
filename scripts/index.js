const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
const auth = firebase.auth();

auth.onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    console.log('user is signed in');
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

document.querySelector('#lost').addEventListener('click', async ev => {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const querySnapshot = await db
    .collection('users')
    .where('email', '==', currentUser.email)
    .get();

  // the querySnapshot is guarenteed to have ONLY one element but we have to iterate over it
  querySnapshot.forEach(async doc => {
    if (!doc.data().lostStatus) {
      const user = await doc.ref;
      //console.log(user);
      user.set({ lostStatus: true }, { merge: true });
    }

    navigator.geolocation.watchPosition(function(pos) {
      // pos.coords.latitude / longitude
      console.log(pos);
    });
  });
});
