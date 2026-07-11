(() => {
  "use strict";

  const firebaseConfig = Object.freeze({
    apiKey: "AIzaSyDi_V7YpIVzAHm-17PEvcNkDqCeLcQH6cE",
    authDomain: "csproject-24094.firebaseapp.com",
    projectId: "csproject-24094",
    storageBucket: "csproject-24094.firebasestorage.app",
    messagingSenderId: "700850444793",
    appId: "1:700850444793:web:4960574bdabcacf3fe8528",
    measurementId: "G-93JL324JWL"
  });

  const API_KEY = firebaseConfig.apiKey;
  const IDENTITY_URL = "https://identitytoolkit.googleapis.com/v1";
  const REQUEST_TIMEOUT_MS = 10000;

  function available() {
    return typeof window.fetch === "function" && Boolean(API_KEY);
  }

  function createAuthError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function normalizeFirebaseCode(code) {
    return String(code || "")
      .toLowerCase()
      .replaceAll("_", "-");
  }

  function errorMessage(error) {
    const rawCode = String(error?.code || "");
    const code = rawCode.startsWith("auth/")
      ? rawCode
      : `auth/${normalizeFirebaseCode(rawCode)}`;

    const messages = {
      "auth/email-exists": "This email is already registered. Sign in or resend verification.",
      "auth/email-already-in-use": "This email is already registered. Sign in or resend verification.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-login-credentials": "Incorrect email or password.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/email-not-found": "No Customer account was found for this email.",
      "auth/user-not-found": "No Customer account was found for this email.",
      "auth/invalid-password": "Incorrect email or password.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/weak-password": "Password must contain at least 6 characters.",
      "auth/operation-not-allowed": "Enable Email/Password authentication in Firebase Console.",
      "auth/network-request-failed": "Could not connect to Firebase. Check the internet connection.",
      "auth/request-timeout": "Firebase took too long to respond. Try again.",
      "auth/too-many-attempts-try-later": "Too many attempts. Wait before trying again.",
      "auth/too-many-requests": "Too many attempts. Wait before trying again.",
      "auth/email-not-verified": "Open the Firebase verification link sent to this inbox before signing in.",
      "auth/firebase-required": "Firebase is required for Customer registration and login.",
      "auth/verification-send-failed": "The account was created, but the verification email could not be sent.",
      "auth/user-disabled": "This Customer account is disabled.",
      "auth/missing-email": "Enter the Customer email.",
      "auth/missing-password": "Enter the Customer password."
    };

    return messages[code] || error?.message || "Firebase authentication failed.";
  }

  async function post(endpoint, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${IDENTITY_URL}/${endpoint}?key=${encodeURIComponent(API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firebaseCode = data?.error?.message || "FIREBASE_REQUEST_FAILED";
        throw createAuthError(firebaseCode, firebaseCode);
      }

      return data;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw createAuthError("auth/request-timeout", "Firebase request timed out.");
      }

      if (error?.code) throw error;
      throw createAuthError("auth/network-request-failed", error?.message || "Network request failed.");
    } finally {
      clearTimeout(timeout);
    }
  }

  async function registerCustomer(name, email, password) {
    if (!available()) {
      throw createAuthError("auth/firebase-required", "Firebase Authentication is unavailable.");
    }

    const created = await post("accounts:signUp", {
      email,
      password,
      returnSecureToken: true
    });

    let idToken = created.idToken;

    try {
      const updated = await post("accounts:update", {
        idToken,
        displayName: name,
        returnSecureToken: true
      });
      idToken = updated.idToken || idToken;

      await post("accounts:sendOobCode", {
        requestType: "VERIFY_EMAIL",
        idToken
      });
    } catch (error) {
      throw createAuthError(
        error?.code || "auth/verification-send-failed",
        errorMessage(error)
      );
    }

    return {
      uid: created.localId,
      name,
      email: created.email || email,
      verificationSent: true,
      active: false
    };
  }

  async function signIn(email, password) {
    return post("accounts:signInWithPassword", {
      email,
      password,
      returnSecureToken: true
    });
  }

  async function lookup(idToken) {
    const result = await post("accounts:lookup", { idToken });
    return result?.users?.[0] || null;
  }

  async function loginCustomer(email, password) {
    if (!available()) {
      throw createAuthError("auth/firebase-required", "Firebase Authentication is unavailable.");
    }

    const signedIn = await signIn(email, password);
    const user = await lookup(signedIn.idToken);

    if (!user?.emailVerified) {
      throw createAuthError(
        "auth/email-not-verified",
        "The Customer email has not been verified."
      );
    }

    return {
      uid: user.localId || signedIn.localId,
      name: user.displayName || signedIn.displayName || email.split("@")[0],
      email: user.email || signedIn.email || email,
      emailVerified: true,
      idToken: signedIn.idToken
    };
  }

  async function resendVerification(email, password) {
    if (!available()) {
      throw createAuthError("auth/firebase-required", "Firebase Authentication is unavailable.");
    }

    const signedIn = await signIn(email, password);
    const user = await lookup(signedIn.idToken);

    if (user?.emailVerified) {
      return { alreadyVerified: true };
    }

    await post("accounts:sendOobCode", {
      requestType: "VERIFY_EMAIL",
      idToken: signedIn.idToken
    });

    return {
      alreadyVerified: false,
      verificationSent: true
    };
  }

  async function logoutCustomer() {
    return true;
  }

  window.SENTINEL_FIREBASE_CONFIG = firebaseConfig;
  window.FirebaseCustomerAuth = Object.freeze({
    available,
    registerCustomer,
    loginCustomer,
    resendVerification,
    logoutCustomer,
    errorMessage
  });
})();
