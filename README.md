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

* No local Customer login fallback
* No Customer password stored in browser storage
* Unverified Firebase accounts cannot enter
* Resend Verification Email is included
* Each Firebase request has a 10-second timeout instead of waiting indefinitely

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

## Implemented algorithms

### Vigenère Cipher

The Vigenère Cipher is a polyalphabetic substitution cipher. It uses a repeating keyword to shift each plaintext letter by a different amount.

Encryption:

```text
Ci = (Pi + Ki) mod 26
```

Decryption:

```text
Pi = (Ci - Ki + 26) mod 26
```

### Playfair Cipher

The Playfair Cipher is a digraph substitution cipher. It encrypts two letters at a time using a 5 × 5 matrix generated from a keyword.

The algorithm follows three main rules:

* Same row: move right during encryption and left during decryption.
* Same column: move down during encryption and up during decryption.
* Rectangle: replace each letter with the letter in the same row and the other letter's column.

Repeated letters are separated using `X`, and `I` and `J` are treated as the same letter.

### Rail Fence Cipher

The Rail Fence Cipher is a transposition cipher. It writes plaintext in a zigzag pattern across a selected number of rails.

The ciphertext is created by reading each rail from left to right. During decryption, the zigzag pattern is reconstructed and the ciphertext letters are placed back into their original positions.

The key is the number of rails.
::: 
