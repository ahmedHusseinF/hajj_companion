const auth = firebase.auth();
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

// Logout
document.querySelector('#logout').addEventListener('click', async ev => {
    try {
        await auth.signOut();
        localStorage.removeItem('admin');
        document.location = 'index.html';
    } catch (error) {
        console.error(error);
    }
});


// lost number, lost nationalities, lost genders, lost locations

let lostNumber, lostNationalities = {}, lostGenders = {}, lostLocations;

document.getElementById('generate').addEventListener('click', async function() {
    const querySnapshot = await db.collection('users')
    .where('lostStatus', '==', true)
    .get();

    let docs = querySnapshot.docs;
        console.log(docs.length);
        lostNumber = docs.length;

        docs.forEach(doc => {
            doc = doc.data();
            if (typeof lostNationalities[doc.nationality] != 'undefined') {
                lostNationalities[doc.nationality]++;
            } else {
                lostNationalities[doc.nationality] = 1;
            }

            if (typeof lostGenders[doc.gender] != 'undefined') {
                lostGenders[doc.gender]++;
            } else {
                lostGenders[doc.gender] = 1;
            }

            
        })
        
        document.getElementById('number').textContent = `Total lost pilgrams: ${lostNumber}`;
        
        let countriesBody = document.getElementById('countries');
        let row;
        let data = [];

        console.log(lostNationalities);

        for (n in lostNationalities) {
            console.log(n);
            row = document.createElement('tr');
            data[0] = document.createElement('td');
            data[1] = document.createElement('td');

            data[0].textContent = n;
            data[1].textContent = lostNationalities[n];
            row.appendChild(data[0]);
            row.appendChild(data[1]);
            countriesBody.appendChild(row);
        }

        let gendersBody = document.getElementById('genders');
        row;
        data = [];

        console.log(lostGenders);

        for (n in lostGenders) {
            console.log(n);
            row = document.createElement('tr');
            data[0] = document.createElement('td');
            data[1] = document.createElement('td');

            data[0].textContent = n;
            data[1].textContent = lostGenders[n];
            row.appendChild(data[0]);
            row.appendChild(data[1]);
            gendersBody.appendChild(row);
        }
})