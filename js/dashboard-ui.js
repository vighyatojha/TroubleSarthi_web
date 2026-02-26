// ================================================================
//  js/dashboard-ui.js  —  Dashboard UI & interactions (no Firebase)
//  Mirrors: User.php <script> block exactly
// ================================================================

let profileDropdownOpen = false;
let mobileMenuOpen      = false;

document.addEventListener('DOMContentLoaded', function () {
    // Close dropdown/menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.user-profile'))  closeProfileDropdown();
        if (!e.target.closest('nav'))            closeMobileMenu();
    });

    // Close modals on backdrop click
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal') ||
            e.target.classList.contains('bookings-modal')) {
            closeBookingModal();
            closeBookingsModal();
        }
    });

    // Phone input: digits only, max 10
    const phoneInput = document.getElementById('customer_phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 10) v = v.slice(0, 10);
            e.target.value = v;
        });
    }

    // Smooth anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const t = document.querySelector(this.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Prevent back-navigation to cached page
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
});

// ── Mobile Menu ───────────────────────────────────────────────────
window.toggleMobileMenu = function () {
    const m = document.getElementById('mobileMenu');
    const i = document.querySelector('.mobile-menu-toggle i');
    mobileMenuOpen = !mobileMenuOpen;
    if (mobileMenuOpen) {
        m.classList.add('active');
        if (i) i.classList.replace('fa-bars', 'fa-times');
    } else {
        closeMobileMenu();
    }
};

function closeMobileMenu() {
    const m = document.getElementById('mobileMenu');
    const i = document.querySelector('.mobile-menu-toggle i');
    mobileMenuOpen = false;
    if (m) m.classList.remove('active');
    if (i) { i.classList.replace('fa-times', 'fa-bars'); }
}

// ── Profile Dropdown ──────────────────────────────────────────────
window.toggleProfileDropdown = function () {
    profileDropdownOpen = !profileDropdownOpen;
    const d = document.getElementById('profileDropdown');
    const b = document.querySelector('.profile-dropdown');
    if (profileDropdownOpen) {
        d?.classList.add('active');
        b?.classList.add('active');
    } else {
        closeProfileDropdown();
    }
};

function closeProfileDropdown() {
    profileDropdownOpen = false;
    document.getElementById('profileDropdown')?.classList.remove('active');
    document.querySelector('.profile-dropdown')?.classList.remove('active');
}

// ── Category Expand/Collapse ──────────────────────────────────────
window.toggleCategory = function (header) {
    const card     = header.closest('.category-card');
    const list     = card.querySelector('.helpers-list');
    const expanded = card.classList.contains('expanded');

    // Collapse all others
    document.querySelectorAll('.category-card').forEach(c => {
        c.classList.remove('expanded');
        c.querySelector('.helpers-list').classList.remove('expanded');
    });

    // Toggle this one
    if (!expanded) {
        card.classList.add('expanded');
        list.classList.add('expanded');
    }
};

// ── Booking Modal ─────────────────────────────────────────────────
window.openBookingModal = function (helperId, helperName, svcCategory, helperRating, helperJobs, helperEmpId, helperImg) {
    document.getElementById('modalHelperId').value   = helperId;
    document.getElementById('modalHelperRating').value = helperRating || 0;
    document.getElementById('modalHelperJobs').value   = helperJobs   || 0;
    document.getElementById('modalHelperEmpId').value  = helperEmpId  || '';
    document.getElementById('modalHelperImg').value    = helperImg    || '';
    document.getElementById('helperName').value        = helperName;
    document.getElementById('serviceCategory').value   = svcCategory;
    selectPaymentMethod('cash');
    document.getElementById('bookingModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.closeBookingModal = function () {
    document.getElementById('bookingModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

// ── Payment Method Selector ───────────────────────────────────────
window.selectPaymentMethod = function (method) {
    document.getElementById('payment_method').value = method;

    document.querySelectorAll('.payment-method').forEach(pm => pm.classList.remove('selected'));
    document.querySelector(`.payment-method[data-method="${method}"]`)?.classList.add('selected');

    document.querySelectorAll('.payment-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${method}Payment`)?.classList.add('active');
};