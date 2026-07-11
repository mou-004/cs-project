# Tested Authentication Flow

The Firebase REST authentication module was tested with controlled Firebase responses.

Passed:

- Customer registration creates a Firebase account
- Verification email request is sent
- Unverified Customer login is blocked
- Resend verification request works
- Verified Customer login succeeds
- Firebase requests stop after a 10-second timeout
- No local Customer password fallback exists
- `app.js`, `ciphers.js`, and `firebase-config.js` pass JavaScript syntax validation
- The page no longer downloads the three Firebase compatibility SDK files

Required Firebase Console setting:

- Authentication > Sign-in method > Email/Password must be enabled
