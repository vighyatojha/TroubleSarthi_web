// ================================================================
//  js/login-ui.js  —  Login page UI & form validation
//  No Firebase imports — pure DOM/validation logic
//  Mirrors: Login.php <script> block exactly
// ================================================================

let passwordStrengthScore = 0;
let passwordsMatch        = false;
let allRequirementsMet    = false;
let termsAccepted         = false;

document.addEventListener('DOMContentLoaded', function () {
    initFormValidation();
    preventPasswordCopyCut();

    // Phone: digits only, max 10
    document.getElementById('s_phone').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length > 10) this.value = this.value.slice(0, 10);
    });
    document.getElementById('s_phone').addEventListener('blur', function () {
        this.style.borderColor = this.value && this.value.length !== 10 ? '#dc3545' : (this.value ? '#7cb342' : '');
    });

    // Username: alphanumeric + underscore only
    document.getElementById('s_uname').addEventListener('input', function () {
        this.value = this.value.replace(/[^a-zA-Z0-9_]/g, '');
    });

    // Name: letters and spaces only
    document.getElementById('s_name').addEventListener('input', function () {
        this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    });

    // Email blur validation
    document.getElementById('s_email').addEventListener('blur', function () {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value);
        this.style.borderColor = this.value ? (valid ? '#7cb342' : '#dc3545') : '';
    });

    // Clear passwords on page unload (security)
    window.addEventListener('beforeunload', () => {
        document.querySelectorAll('input[type="password"]').forEach(f => f.value = '');
    });
});

// ── Tab Switcher ──────────────────────────────────────────────────
window.switchTab = function (tab) {
    document.getElementById('loginTab').classList.toggle('active',  tab === 'login');
    document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
    document.getElementById('loginForm').classList.toggle('active',  tab === 'login');
    document.getElementById('signupForm').classList.toggle('active', tab === 'signup');
    document.getElementById('msgArea').innerHTML = '';
};

// ── Password Toggle (eye icon) ─────────────────────────────────────
window.togglePassword = function (inputId, btn) {
    const input = document.getElementById(inputId);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

// ── Form Validation Init ──────────────────────────────────────────
function initFormValidation() {
    document.getElementById('s_pw').addEventListener('input', function () {
        checkPasswordStrength(this.value);
        checkPasswordMatch();
        updateSignupButton();
        const show = this.value.length > 0;
        document.getElementById('passwordRequirements').classList.toggle('show', show);
        document.getElementById('passwordStrength').classList.toggle('show', show);
    });

    document.getElementById('s_conf').addEventListener('input', function () {
        checkPasswordMatch();
        updateSignupButton();
    });

    document.getElementById('termsCheck').addEventListener('change', function () {
        termsAccepted = this.checked;
        updateSignupButton();
    });
}

// ── Password Strength Check ───────────────────────────────────────
window.checkPasswordStrength = function (password) {
    const req = {
        length:    password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number:    /\d/.test(password),
        special:   /[@$!%*?&]/.test(password)
    };

    updateRequirement('lengthReq',    req.length);
    updateRequirement('uppercaseReq', req.uppercase);
    updateRequirement('lowercaseReq', req.lowercase);
    updateRequirement('numberReq',    req.number);
    updateRequirement('specialReq',   req.special);

    const metCount = Object.values(req).filter(Boolean).length;
    allRequirementsMet = metCount === 5;

    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');

    if (!password.length) {
        fill.className = 'strength-fill';
        text.className = 'strength-text';
        text.textContent = 'Enter a password';
        passwordStrengthScore = 0;
    } else if (metCount <= 2) {
        fill.className = 'strength-fill weak';
        text.className = 'strength-text weak';
        text.textContent = 'Weak';
        passwordStrengthScore = 1;
    } else if (metCount <= 3) {
        fill.className = 'strength-fill fair';
        text.className = 'strength-text fair';
        text.textContent = 'Fair';
        passwordStrengthScore = 2;
    } else if (metCount <= 4) {
        fill.className = 'strength-fill good';
        text.className = 'strength-text good';
        text.textContent = 'Good';
        passwordStrengthScore = 3;
    } else {
        fill.className = 'strength-fill strong';
        text.className = 'strength-text strong';
        text.textContent = 'Strong';
        passwordStrengthScore = 4;
    }
};

function updateRequirement(id, isValid) {
    const el   = document.getElementById(id);
    const icon = el.querySelector('.requirement-icon');
    el.classList.toggle('valid', isValid);
    icon.textContent = isValid ? '✓' : '✗';
}

// ── Password Match Check ──────────────────────────────────────────
window.checkPasswordMatch = function () {
    const pw   = document.getElementById('s_pw').value;
    const conf = document.getElementById('s_conf').value;
    const ind  = document.getElementById('passwordMatch');

    if (!conf.length) { ind.classList.remove('show'); passwordsMatch = false; return; }

    ind.classList.add('show');
    const match = pw === conf && pw.length > 0;
    ind.classList.toggle('valid',   match);
    ind.classList.toggle('invalid', !match);
    ind.textContent = match ? '✓' : '✗';
    passwordsMatch  = match;
};

// ── Signup Button State ───────────────────────────────────────────
window.updateSignupButton = function () {
    const btn = document.getElementById('signupBtn');
    const can = allRequirementsMet && passwordsMatch && termsAccepted;
    btn.disabled       = !can;
    btn.style.opacity  = can ? '1' : '0.6';
    btn.style.cursor   = can ? 'pointer' : 'not-allowed';
};

// ── Security: no copy/cut on password fields ──────────────────────
function preventPasswordCopyCut() {
    document.querySelectorAll('input[type="password"]').forEach(f => {
        f.addEventListener('copy',        e => e.preventDefault());
        f.addEventListener('cut',         e => e.preventDefault());
        f.addEventListener('contextmenu', e => e.preventDefault());
    });
}