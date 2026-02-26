// ================================================================
//  js/admin-ui.js  —  Admin Panel UI (no Firebase)
//  Mirrors: Admin.php <script> block exactly
//  NOTE: loaded as a regular <script> (not type="module")
// ================================================================

// ── Section Switcher ──────────────────────────────────────────────
function showSection(name) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(name);
    if (section) section.classList.add('active');

    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`[data-section="${name}"]`);
    if (link) link.classList.add('active');

    // Close mobile menu on section change
    document.getElementById('mobileMenu')?.classList.remove('active');
}

// ── Mobile Menu ───────────────────────────────────────────────────
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

// ── Sidebar ───────────────────────────────────────────────────────
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// ── Modal Helpers ─────────────────────────────────────────────────
function showModal(id) { document.getElementById(id).style.display = 'block'; }
function hideModal(id) { document.getElementById(id).style.display = 'none';  }

// Close modal on backdrop click
window.onclick = function (e) {
    document.querySelectorAll('.modal').forEach(m => {
        if (e.target === m) m.style.display = 'none';
    });
};

// ── Responsive: hide sidebar on large screens ─────────────────────
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('mobileMenu').classList.remove('active');
    }
});