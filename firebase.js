// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyAmlUeEg0Ln1eYtWZOeyKBGY5BHyiah8hQ",
  authDomain: "archive-984e6.firebaseapp.com",
  projectId: "archive-984e6",
  storageBucket: "archive-984e6.firebasestorage.app",
  messagingSenderId: "508847264735",
  appId: "1:508847264735:web:108a98e09d4d430412ea6a",
  measurementId: "G-NC766EDJGX"
};

// Initialize Firebase (using UMD window objects since we load via CDN in index.html)
const app = window.firebase.initializeApp(firebaseConfig);
const auth = window.firebase.auth();
const db = window.firebase.firestore();

// Export them to window so other files can use them easily without module bundler
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
