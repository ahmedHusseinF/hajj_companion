const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
const auth = firebase.auth();

let CURRENT_USER;

firebase.auth().onAuthStateChanged(function(user) {
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
  const querySnapshot = await db
    .collection('users')
    .where('email', '==', localStorage.getItem('user'))
    .get();

  // the querySnapshot is guarenteed to have ONLY one element but we have to iterate over it
  querySnapshot.forEach(async doc => {
    console.log(doc.data());
    if (!doc.data().lostStatus) {
      const user = await doc.ref;
      console.log(user);
      user.set({ lostStatus: true }, { merge: true });
    }

    const tracking = new Worker('../tracking-worker.js');
    navigator.geolocation.watchPosition(function(pos) {
      tracking.postMessage({ flag: 'position', payload: pos });
    });
  });
});
