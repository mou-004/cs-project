(() => {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyDi_V7YpIVzAHm-17PEvcNkDqCeLcQH6cE",
    authDomain: "csproject-24094.firebaseapp.com",
    projectId: "csproject-24094",
    storageBucket: "csproject-24094.firebasestorage.app",
    messagingSenderId: "700850444793",
    appId: "1:700850444793:web:4960574bdabcacf3fe8528",
    measurementId: "G-93JL324JWL"
  };

  let auth = null;
  let database = null;
  let initializationError = null;

  try {
    if (!window.firebase) {
      throw new Error("Firebase SDK did not load.");
    }

    const app = window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(firebaseConfig);

    auth = window.firebase.auth(app);

    if (typeof window.firebase.firestore === "function") {
      database = window.firebase.firestore(app);
    }
  } catch (error) {
    initializationError = error;
    console.warn("Firebase initialization failed. Local customer fallback remains available.", error);
  }

  function available() {
    return Boolean(auth);
  }

  function errorMessage(error) {
    const messages = {
      "auth/email-already-in-use": "This customer email is already registered in Firebase.",
      "auth/invalid-email": "Enter a valid customer email address.",
      "auth/invalid-credential": "Incorrect customer email or password.",
      "auth/user-not-found": "Customer account was not found.",
      "auth/wrong-password": "Incorrect customer email or password.",
      "auth/weak-password": "Password must contain at least 6 characters.",
      "auth/operation-not-allowed": "Enable Email/Password authentication in Firebase Console.",
      "auth/network-request-failed": "Firebase could not connect. The local fallback can still be used.",
      "auth/unauthorized-domain": "Add this domain to Firebase Authentication authorized domains."
    };

    return messages[error?.code] || error?.message || "Firebase authentication failed.";
  }

  async function registerCustomer(name, email, password) {
    if (!auth) {
      throw initializationError || new Error("Firebase Authentication is unavailable.");
    }

    const credential = await auth.createUserWithEmailAndPassword(email, password);

    if (credential.user) {
      await credential.user.updateProfile({ displayName: name });

      if (database) {
        try {
          await database.collection("users").doc(credential.user.uid).set({
            name,
            email: credential.user.email,
            role: "customer",
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.warn("Customer authentication succeeded, but Firestore profile storage failed.", error);
        }
      }
    }

    await auth.signOut();

    return {
      uid: credential.user.uid,
      name,
      email: credential.user.email
    };
  }

  async function loginCustomer(email, password) {
    if (!auth) {
      throw initializationError || new Error("Firebase Authentication is unavailable.");
    }

    const credential = await auth.signInWithEmailAndPassword(email, password);
    const currentUser = credential.user;

    let name = currentUser.displayName || email.split("@")[0];

    if (database) {
      try {
        const profile = await database.collection("users").doc(currentUser.uid).get();
        if (profile.exists && profile.data()?.name) {
          name = profile.data().name;
        }
      } catch (error) {
        console.warn("Could not read Firestore customer profile.", error);
      }
    }

    return {
      uid: currentUser.uid,
      name,
      email: currentUser.email
    };
  }

  async function logoutCustomer() {
    if (auth?.currentUser) {
      await auth.signOut();
    }
  }

  window.SENTINEL_FIREBASE_CONFIG = Object.freeze({ ...firebaseConfig });

  window.FirebaseCustomerAuth = Object.freeze({
    available,
    registerCustomer,
    loginCustomer,
    logoutCustomer,
    errorMessage
  });
})();
