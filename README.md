# Sentinel Bank — Fast Verified Customer Email Build

# Tactical Bank Cipher Project

A military-themed, role-based banking security simulator developed with **HTML, CSS, JavaScript, Firebase Authentication, and Cloud Firestore**.

The application demonstrates three classical encryption algorithms in a banking environment with three user roles:

- Customer
- Employee
- Administrator

---

## Demo Login Credentials

These accounts must be created in **Firebase Authentication** and added to the Firestore `users` collection before they can be used.

### Administrator

```text
Email: admin@tacticalbank.com
Password: Admin@12345
Role: admin
```

### Employee

```text
Email: employee@tacticalbank.com
Password: Employee@12345
Role: employee
```

Change these passwords before publishing or demonstrating the project publicly.

---

## Main Features

- Firebase email and password authentication
- Customer registration
- Separate customer, employee, and admin dashboards
- Role-based page access
- Military-themed responsive design
- Hamburger navigation menu
- Dark and light theme toggle
- Header and footer
- Secure encrypted messaging
- Simulated banking transactions
- Admin user-role management
- Audit logs
- Encryption and decryption toolkit
- Mathematical processing details
- Playfair 5 × 5 matrix display
- Columnar Transposition grid display

---

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Firebase Authentication
- Cloud Firestore
- Firebase Security Rules

---

## Project Pages

- `index.html` — Login page
- `register.html` — Customer registration
- `customer-dashboard.html` — Customer dashboard
- `employee-dashboard.html` — Employee dashboard
- `admin-dashboard.html` — Administrator dashboard
- `cipher.html` — Encryption and decryption toolkit
- `messages.html` — Secure messages
- `transactions.html` — Simulated transactions
- `users.html` — User-role management
- `logs.html` — Audit logs

---

## How to Run the Project

### Requirements

- Visual Studio Code
- Live Server extension
- A modern web browser
- Internet connection
- Firebase Authentication enabled
- Cloud Firestore enabled

### Steps

1. Extract the project ZIP file.
2. Open the extracted folder in Visual Studio Code.
3. Install the **Live Server** extension.
4. Right-click `index.html`.
5. Select **Open with Live Server**.
6. The application will open in your browser.

A typical local address is:

```text
http://127.0.0.1:5500/index.html
```

Do not open `index.html` by double-clicking it because Firebase JavaScript modules require a local web server.

---

## Firebase Setup

### Enable Email and Password Authentication

1. Open Firebase Console.
2. Select your Firebase project.
3. Open **Authentication**.
4. Open **Sign-in method**.
5. Enable **Email/Password**.

### Create Cloud Firestore

1. Open **Firestore Database**.
2. Click **Create database**.
3. Choose the appropriate region.
4. Complete the setup.

### Publish Firestore Security Rules

1. Open **Firestore Database**.
2. Open the **Rules** tab.
3. Copy the contents of `firestore.rules`.
4. Paste the rules into Firebase.
5. Click **Publish**.

---

## Create the Administrator Account

1. Open Firebase Console.
2. Go to **Authentication → Users**.
3. Click **Add user**.
4. Enter:

```text
Email: admin@tacticalbank.com
Password: Admin@12345
```

5. Copy the Firebase UID of the new administrator.
6. Open **Firestore Database**.
7. Open the `users` collection.
8. Create a document using the administrator UID as the document ID.
9. Add these fields:

```text
uid: ADMIN_FIREBASE_UID
name: System Administrator
email: admin@tacticalbank.com
role: admin
status: active
accountNumber: ADMIN-001
```

---

## Create the Employee Account

1. Open Firebase Console.
2. Go to **Authentication → Users**.
3. Click **Add user**.
4. Enter:

```text
Email: employee@tacticalbank.com
Password: Employee@12345
```

5. Copy the Firebase UID of the employee.
6. Open **Firestore Database**.
7. Open the `users` collection.
8. Create a document using the employee UID as the document ID.
9. Add these fields:

```text
uid: EMPLOYEE_FIREBASE_UID
name: Bank Employee
email: employee@tacticalbank.com
role: employee
status: active
accountNumber: EMP-001
```

---

## User Roles

### Customer

A customer can:

- Register and log in
- Access the customer dashboard
- View personal simulated transactions
- Use the cipher toolkit
- Send encrypted messages
- Receive encrypted messages

### Employee

An employee can:

- Access the employee dashboard
- View customer messages
- Send encrypted replies
- Create simulated deposits
- Create simulated withdrawals
- View transaction records
- Use all three cipher algorithms

### Administrator

An administrator can:

- Access the admin dashboard
- View all users
- Assign customer, employee, or admin roles
- View all transactions
- View encrypted messages
- View audit logs
- Use the cipher toolkit

---

## Selected Cipher Algorithms

The project implements exactly three non-Caesar cipher algorithms.

### 1. Vigenère Cipher

The Vigenère Cipher is a **polyalphabetic substitution cipher**.

It uses a repeating keyword to shift each plaintext letter by a different amount.

Encryption formula:

```text
Ci = (Pi + Ki) mod 26
```

Decryption formula:

```text
Pi = (Ci - Ki + 26) mod 26
```

Where:

- `Pi` is the numerical value of the plaintext letter
- `Ki` is the numerical value of the key letter
- `Ci` is the numerical value of the ciphertext letter

---

### 2. Playfair Cipher

The Playfair Cipher is a **digraph substitution cipher**.

It encrypts two letters at a time using a 5 × 5 matrix generated from a keyword.

Main rules:

1. Same row — move right during encryption.
2. Same column — move down during encryption.
3. Rectangle — use the opposite corners.
4. Repeated letters are separated with `X`.
5. `I` and `J` are treated as the same letter.

During decryption, row and column movements are reversed.

---

### 3. Columnar Transposition Cipher

The Columnar Transposition Cipher is a **transposition cipher**.

It does not replace letters. It rearranges their positions.

The plaintext is written in rows under a keyword. The keyword letters are ranked alphabetically, and the columns are read according to that order.

During decryption, the ciphertext is divided into columns and reconstructed row by row.

The application may add `X` characters as padding when the last row is incomplete.

---

## Project Folder Structure

```text
tactical-bank-project/
│
├── index.html
├── register.html
├── customer-dashboard.html
├── employee-dashboard.html
├── admin-dashboard.html
├── cipher.html
├── messages.html
├── transactions.html
├── users.html
├── logs.html
├── firestore.rules
├── README.md
│
├── css/
│   └── style.css
│
└── js/
    ├── firebase-config.js
    ├── common.js
    ├── auth.js
    ├── dashboard.js
    ├── ciphers.js
    ├── cipher-page.js
    ├── messages.js
    ├── transactions.js
    ├── users.js
    └── logs.js
```

---

## Security Notice

The Vigenère, Playfair, and Columnar Transposition ciphers are historical educational algorithms.

They must not be used for:

- Real passwords
- Real bank accounts
- Authentication tokens
- Personal financial information
- Real banking transactions

Firebase Authentication is used for login security. The three classical ciphers are included only to demonstrate substitution, transposition, modular arithmetic, matrix operations, encryption, and decryption.

---

## Course Information

**Course:** Introduction to Computer Security  
**Project Type:** Major Project  
**Application Type:** Role-Based Banking Security Simulator  
**Purpose:** Academic and educational use only
