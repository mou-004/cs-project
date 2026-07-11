# Sentinel Bank — Fast Verified Customer Email Build

Customer authentication uses Firebase Identity Toolkit REST directly. The three large Firebase browser SDK files were removed, so the page loads and responds faster.

## Customer registration

1. Enter a real inbox email and password.
2. Firebase creates a pending account.
3. Firebase sends a verification link.
4. Open the link in that inbox.
5. Return to the site and sign in.

The Customer Dashboard is blocked until Firebase returns `emailVerified: true`.

## Customer login

- No local Customer login fallback
- No Customer password stored in browser storage
- Unverified Firebase accounts cannot enter
- Resend Verification Email is included
- Each Firebase request has a 10-second timeout instead of waiting indefinitely

## Firebase Console

Enable **Authentication → Sign-in method → Email/Password** for project `csproject-24094`.

Add `localhost` and the deployed domain under **Authentication → Settings → Authorized domains**.

## Run

Use VS Code Live Server or:

```bash
python -m http.server 5500
```

Open `http://localhost:5500`.

## Staff accounts

Administrator: `admin@sentinelbank.mil` / `Admin@123`

Employee: `employee@sentinelbank.mil` / `Employee@123`
