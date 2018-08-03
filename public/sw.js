importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js'
);

const CACHE_FILES = [
  'https://www.gstatic.com/firebasejs/5.3.0/firebase.js',
  'https://www.gstatic.com/firebasejs/5.3.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/5.3.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/5.3.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/5.3.0/firebase.js',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-rc.2/js/materialize.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons|Roboto',
  'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-rc.2/css/materialize.min.css'
];

//workbox.routing.registerRoute(CACHE_FILES, workbox.strategies.networkFirst());
