const auth = firebase.auth();
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

document.querySelector('#logout').addEventListener('click', async ev => {
  try {
    await auth.signOut();
    localStorage.removeItem('admin');
    document.location = 'login.html';
  } catch (error) {
    console.error(error);
  }
});
