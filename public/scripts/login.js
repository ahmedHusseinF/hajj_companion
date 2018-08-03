const auth = firebase.auth();
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

const form = document.querySelector('#form');

form.addEventListener('submit', async function(ev) {
  ev.preventDefault();
  const email = form.elements.email.value;
  const password = form.elements.password.value;
  try {
    // presisit the user login session even if browser close, break when logout
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const data = await auth.signInWithEmailAndPassword(email, password);
    console.log(data);

    const querySnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .get();

    //
    let theUser = querySnapshot.docs[0].data();
    console.log(theUser);
    theUser.group = theUser.group.path;
    theUser.id = querySnapshot.docs[0].id;

    if (theUser.type == 'User') {
      localStorage.setItem('user', theUser.id);
      document.location = 'user.html';
    } else {
      localStorage.setItem('leader', theUser.id);
      document.location = 'leader.html';
    }
  } catch (er) {
    console.error(er);
  }
});
