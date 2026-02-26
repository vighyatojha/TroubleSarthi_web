// ================================================================
//  js/firebase-config.js  —  Trouble Sarthi  |  Firebase Setup
// ================================================================
//
//  ✅  HOW TO CONNECT YOUR FIREBASE PROJECT  (read carefully)
//
//  1.  Open https://console.firebase.google.com
//  2.  Click  "Add project"  →  name it "trouble-sarthi"  →  Continue
//  3.  Inside project dashboard → click the  "</>  Web"  icon
//  4.  Register an app name (e.g. "TroubleSarthiWeb") → Continue
//  5.  Firebase shows you a firebaseConfig object.  Copy the values
//      and paste them below replacing every "YOUR_..." placeholder.
//
//  6.  Still inside Firebase Console, enable these services:
//
//      ▸  Authentication
//           Left menu → Authentication → Sign-in method
//           Enable:  Email/Password   ✔
//           Enable:  Google           ✔  (optional)
//
//      ▸  Firestore Database
//           Left menu → Firestore Database → Create database
//           Select: "Start in production mode" → next → pick any region
//           Then copy firestore.rules from this project into the Rules tab
//
//  7.  Save this file — you are done.
//
// ================================================================

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ⚠️  REPLACE THESE WITH YOUR REAL VALUES  ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyBTyz4ZSHFKtg9Eq-eZ2rD5fPcapNRyQyo",
  authDomain: "trouble-sarthi.firebaseapp.com",
  projectId: "trouble-sarthi",
  storageBucket: "trouble-sarthi.firebasestorage.app",
  messagingSenderId: "241665118590",
  appId: "1:241665118590:web:e705c3ca12324b8c25632f",
  measurementId: "G-LMKYXGPSYF"
};


const app     = initializeApp(firebaseConfig);
const auth    = getAuth(app);
const db      = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// ================================================================
//  FIRESTORE COLLECTIONS  (maps 1-to-1 with your MySQL tables)
// ================================================================
//  user_details       ←→  user_details_tbl
//  helpers            ←→  helper_tbl
//  bookings           ←→  booking_tbl
//  contact_messages   ←→  (new — replaces PHP mail / DB inserts)
// ================================================================