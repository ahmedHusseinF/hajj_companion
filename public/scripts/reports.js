// lost number, lost nationalities, lost genders, lost locations

db.collection('users')
    .where('lostStatus', '==', true)
    .get()
    .then(docs => {
        console.log(docs.docs.length);
})