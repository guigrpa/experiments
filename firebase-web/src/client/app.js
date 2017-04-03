const firebase = require('firebase');

const app = firebase.initializeApp({
  apiKey: 'AIzaSyCgIoPIg-GN-NecigxbkrF_NL4k73MC5Ng',
  authDomain: 'play-netmd.firebaseapp.com',
  databaseURL: 'https://play-netmd.firebaseio.com',
  projectId: 'play-netmd',
  storageBucket: 'play-netmd.appspot.com',
  messagingSenderId: '577038104221',
});

const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({
  login_hint: 'user@patata.com',
});

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log(user);
    accessDb();
  } else {
    firebase.auth().signInWithPopup(provider).then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const token = result.credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      console.log(user);
      // ...
      accessDb();
    }).catch(function(error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.email;
      console.log(email);
      // The firebase.auth.AuthCredential type that was used.
      const credential = error.credential;
      console.log(error.credential);
      console.log(error);
      // ...
    });
  }
});

const accessDb = () => {
  const db = app.database();
  db.ref('/server/now-example').once('value').then(snapshot => {
    console.log(snapshot.val());
  });

  // db.ref('/server/now-example').on('value', (snapshot) => {
  //   console.log(snapshot.val());
  // });
};
