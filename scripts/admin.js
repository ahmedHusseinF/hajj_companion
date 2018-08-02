const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

let user = localStorage.getItem('admin');
user = JSON.parse(user);

const querySnapshot = db
    .collection('users')
    .where('email', '==', user.email)
    .doc('fUzDhwXHyhJ9nNCOiqu2')
    .collection('watchinColleciton');

console.log(querySnapshot);
// let userData = querySnapshot.docs[0].data();
// console.log(userData);
// userData.group = userData.group.path;