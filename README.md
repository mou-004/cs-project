# Sentinel Bank Professional Secure Build

This build redesigns the interface and fixes the responsive navigation, mobile dashboard sidebar, card overlap, and locked-data visibility.

## Included files

- `index.html`
- `styles.css`
- `app.js`
- `ciphers.js`
- `firebase-config.js`
- `FIREBASE-SETUP.txt`
- `README.md`
- `TESTED.md`

## Staff accounts

Administrator:

```text
admin@sentinelbank.mil
Admin@123
```

Employee:

```text
employee@sentinelbank.mil
Employee@123
```

The Administrator must create and lock the Employee Access Vault before Employee Dashboard access works.

## Customer safety workflow

Each customer has three independent safety profiles:

- Deposit Safety
- Withdrawal Safety
- Transfer Safety

Before locking, the customer can see:

- Authorization text
- Selected algorithm
- Ciphertext preview

After locking, all of those details disappear. Only a private-key input remains. The correct key is required to unlock the profile for editing or execute the banking operation.

After a successful operation, the decrypted authorization text and the balance calculation are displayed.

## Employee access workflow

The Administrator creates the Employee vault using private text, one algorithm, and a private key. The vault is then locked and its details disappear.

The Employee login page does not show:

- Authorization text
- Algorithm name
- Ciphertext
- Any key clue

The Employee enters only the private vault key. Three incorrect attempts block access until the Administrator resets the vault.

## Responsive interface

- Working public hamburger navigation
- Working mobile dashboard sidebar
- Responsive cards with no overlap
- Scrollable tables
- Professional dark/light appearance
- Mobile layouts for forms and balance calculations

## Run

Use VS Code Live Server or:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```
