// ================================================================
//  js/login.js  —  Login & Signup Firebase Logic
//
//  ✅  Collection: /users/{uid}   ← exact Flutter UserModel
//
//  Field mapping (old web → Flutter):
//    Name     → fullName
//    Username → username   (always lowercase)
//    Email    → email
//    PhoneNo  → phone      (+91XXXXXXXXXX)
//    (new)    → provider   'email' | 'google' | 'facebook'
//    (new)    → profileComplete, locationEnabled, address
//    role     → role       'user' | 'admin'  (web-admin field)
//    createdAt, updatedAt  (same names)
// ================================================================

import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    browserLocalPersistence,
    browserSessionPersistence,
    setPersistence,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc, setDoc, getDoc, getDocs,
    collection, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Rate Limiting  (5 attempts / 15 min) ─────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000;
const STORE_KEY    = 'ts_login_attempts';

const getAttemptData  = () => { try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; } };
const saveAttemptData = d  => sessionStorage.setItem(STORE_KEY, JSON.stringify(d));
const resetAttempts   = () => saveAttemptData({});

function isLocked() {
    const d = getAttemptData();
    if (d.lockedAt && Date.now() - d.lockedAt < LOCKOUT_MS) return true;
    if (d.lockedAt) saveAttemptData({});
    return false;
}

function recordFailedAttempt() {
    const d = getAttemptData();
    d.count = (d.count || 0) + 1;
    if (d.count >= MAX_ATTEMPTS) d.lockedAt = Date.now();
    saveAttemptData(d);
    return d.count;
}

let _countdownInterval = null;
function startLockCountdown() {
    const d   = getAttemptData();
    if (!d.lockedAt) return;
    const btn = document.getElementById('loginBtn');
    clearInterval(_countdownInterval);
    _countdownInterval = setInterval(() => {
        const remaining = LOCKOUT_MS - (Date.now() - d.lockedAt);
        if (remaining <= 0) {
            clearInterval(_countdownInterval);
            btn.disabled    = false;
            btn.textContent = 'Login';
            resetAttempts();
            return;
        }
        const m = String(Math.floor(remaining / 60000)).padStart(2, '0');
        const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
        btn.disabled    = true;
        btn.textContent = `Rate Limited — ${m}:${s}`;
    }, 1000);
}

// ── Auto-redirect if already logged in ───────────────────────────
//    Reads /users/{uid}  (Flutter UserModel collection)
onAuthStateChanged(auth, async user => {
    if (!user) return;
    try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().role === 'admin') {
            window.location.href = 'admin.html';
            return;
        }
        window.location.href = 'dashboard.html';
    } catch (e) {
        console.warn('Auth redirect check failed:', e.message);
    }
});

// ── LOGIN ─────────────────────────────────────────────────────────
//    Supports email OR username login
//    Username lookup → /users where username == input (lowercase)
window.doLogin = async () => {
    if (isLocked()) { startLockCountdown(); return; }

    const userOrEmail = document.getElementById('l_user').value.trim();
    const password    = document.getElementById('l_pw').value;

    if (!userOrEmail || !password) {
        showMsg('Invalid username or password!', 'error'); return;
    }

    setBtn('loginBtn', true, 'Logging in...');

    try {
        let email = userOrEmail;

        if (!userOrEmail.includes('@')) {
            // Username login → find email in /users collection
            const q = await getDocs(query(
                collection(db, 'users'),
                where('username', '==', userOrEmail.toLowerCase())
            ));
            if (q.empty) throw { code: 'auth/user-not-found' };
            email = q.docs[0].data().email;
        }

        const persist = document.getElementById('rememberMe').checked
            ? browserLocalPersistence
            : browserSessionPersistence;
        await setPersistence(auth, persist);

        await signInWithEmailAndPassword(auth, email, password);
        resetAttempts();
        // onAuthStateChanged above handles the redirect

    } catch (e) {
        const count = recordFailedAttempt();
        if (count >= MAX_ATTEMPTS) {
            startLockCountdown();
            showMsg('Too many login attempts. Please try again in 15 minutes.', 'error');
        } else {
            const left = MAX_ATTEMPTS - count;
            showMsg(`Invalid username or password! (${left} attempt${left !== 1 ? 's' : ''} remaining)`, 'error');
        }
        setBtn('loginBtn', false, 'Login');
    }
};

// ── SIGNUP ────────────────────────────────────────────────────────
//    Writes to /users/{uid}  — ALL Flutter UserModel fields included
window.doSignup = async () => {
    const fullName = document.getElementById('s_name').value.trim();
    const username = document.getElementById('s_uname').value.trim().toLowerCase();
    const email    = document.getElementById('s_email').value.trim();
    const phone    = document.getElementById('s_phone').value.trim();
    const pw       = document.getElementById('s_pw').value;
    const conf     = document.getElementById('s_conf').value;

    if (!fullName || !username || !email || !phone || !pw) {
        showMsg('All fields are required!', 'error'); return;
    }
    if (pw !== conf)   { showMsg('Passwords do not match!', 'error'); return; }
    if (pw.length < 8) { showMsg('Password must be at least 8 characters!', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showMsg('Please enter a valid email address!', 'error'); return; }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) { showMsg('Please enter a valid 10-digit phone number!', 'error'); return; }

    setBtn('signupBtn', true, 'Creating account...');

    try {
        // Username uniqueness check — /users where username == username
        const uq = await getDocs(query(
            collection(db, 'users'),
            where('username', '==', username)
        ));
        if (!uq.empty) {
            showMsg('Username already taken! Please choose another.', 'error');
            setBtn('signupBtn', false, 'Create Account');
            return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        await updateProfile(cred.user, { displayName: fullName });

        // ✅ Write /users/{uid} — exact Flutter UserModel structure
        await setDoc(doc(db, 'users', cred.user.uid), {
            uid:             cred.user.uid,
            fullName:        fullName,
            username:        username,
            email:           email,
            // Store phone in +91XXXXXXXXXX format (Flutter expects this)
            phone:           phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`,
            photoUrl:        null,
            provider:        'email',
            dob:             null,
            gender:          null,
            emergencyContact:null,
            profileComplete: false,
            locationEnabled: false,
            address:         null,
            role:            'user',    // ← web admin panel uses this field
            createdAt:       serverTimestamp(),
            updatedAt:       serverTimestamp()
        });

        showMsg('Registration successful! You can now login.', 'success');
        setTimeout(() => switchTab('login'), 2000);

    } catch (e) {
        showMsg(friendlyError(e.code), 'error');
        setBtn('signupBtn', false, 'Create Account');
    }
};

// ── GOOGLE SIGN-IN ────────────────────────────────────────────────
//    provider: 'google'  — matches Flutter UserModel
window.doGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        const user   = result.user;
        const snap   = await getDoc(doc(db, 'users', user.uid));

        if (!snap.exists()) {
            const rawName = user.displayName || 'user';
            await setDoc(doc(db, 'users', user.uid), {
                uid:             user.uid,
                fullName:        rawName,
                username:        rawName.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
                email:           user.email || '',
                phone:           user.phoneNumber || '',
                photoUrl:        user.photoURL   || null,
                provider:        'google',
                dob:             null,
                gender:          null,
                emergencyContact:null,
                profileComplete: false,
                locationEnabled: false,
                address:         null,
                role:            'user',
                createdAt:       serverTimestamp(),
                updatedAt:       serverTimestamp()
            });
        }
        // onAuthStateChanged handles redirect
    } catch (e) { showMsg(friendlyError(e.code), 'error'); }
};

// ── FACEBOOK SIGN-IN ──────────────────────────────────────────────
//    provider: 'facebook'  — matches Flutter UserModel
window.doFacebook = async () => {
    try {
        const result = await signInWithPopup(auth, new FacebookAuthProvider());
        const user   = result.user;
        const snap   = await getDoc(doc(db, 'users', user.uid));

        if (!snap.exists()) {
            const rawName = user.displayName || 'user';
            await setDoc(doc(db, 'users', user.uid), {
                uid:             user.uid,
                fullName:        rawName,
                username:        rawName.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
                email:           user.email || '',
                phone:           '',
                photoUrl:        user.photoURL || null,
                provider:        'facebook',
                dob:             null,
                gender:          null,
                emergencyContact:null,
                profileComplete: false,
                locationEnabled: false,
                address:         null,
                role:            'user',
                createdAt:       serverTimestamp(),
                updatedAt:       serverTimestamp()
            });
        }
    } catch (e) { showMsg(friendlyError(e.code), 'error'); }
};

// ── FORGOT PASSWORD ───────────────────────────────────────────────
window.handleForgot = async () => {
    const val  = document.getElementById('l_user').value.trim();
    const addr = val.includes('@') ? val : prompt('Enter your email address:');
    if (!addr) return;
    try {
        await sendPasswordResetEmail(auth, addr);
        showMsg('Password reset email sent! Check your inbox.', 'success');
    } catch (e) { showMsg(friendlyError(e.code), 'error'); }
};

// ── Utilities ─────────────────────────────────────────────────────
function friendlyError(code) {
    const map = {
        'auth/invalid-email':          'Invalid email address.',
        'auth/user-not-found':         'Invalid username or password!',
        'auth/wrong-password':         'Invalid username or password!',
        'auth/invalid-credential':     'Invalid username or password!',
        'auth/email-already-in-use':   'An account with this email already exists!',
        'auth/weak-password':          'Password must be at least 6 characters.',
        'auth/too-many-requests':      'Too many attempts. Please try again in 15 minutes.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/popup-closed-by-user':   'Sign-in popup was closed.',
    };
    return map[code] || 'Something went wrong. Please try again.';
}

function setBtn(id, disabled, text) {
    const b = document.getElementById(id);
    if (!b) return;
    b.disabled    = disabled;
    b.textContent = text;
}

window.showMsg = function (msg, type) {
    const area = document.getElementById('msgArea');
    if (!area) return;
    area.innerHTML = `<div class="php-message php-${type === 'success' ? 'success' : 'error'}" id="_msg">${msg}</div>`;
    clearTimeout(area._timer);
    area._timer = setTimeout(() => {
        const el = document.getElementById('_msg');
        if (el) { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }
    }, 5000);
};

if (isLocked()) startLockCountdown();