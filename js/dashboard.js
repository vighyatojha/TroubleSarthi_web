// ================================================================
//  js/dashboard.js  —  User Dashboard Firebase Logic
//
//  ✅  Collections used — all matching Flutter Dart models:
//
//  /users/{uid}              ← UserModel
//    reads: fullName, username, email, phone, role
//
//  /helpers/{helperId}       ← HelperFirestoreModel
//    reads: name, serviceType, rating, completedJobs,
//           isAvailable, pricePerHour, phoneNumber,
//           experience, location, profileImageUrl, skills,
//           employeeId
//
//  /bookings/{bookingId}     ← BookingFirestoreModel
//    writes: userId, helperId, helperName, helperRating,
//            helperJobCount, helperEmployeeId, helperImageUrl,
//            serviceName, serviceId, status, address,
//            scheduledAt, paymentMode, paymentStatus, createdAt
//    queries: where('userId', ==, uid)
// ================================================================

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection, getDocs, doc, getDoc, addDoc,
    query, where, orderBy, limit, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser     = null;
let currentUserData = null;
let allHelpers      = [];

// ── Auth Guard ────────────────────────────────────────────────────
//    Reads /users/{uid}  (Flutter UserModel)
onAuthStateChanged(auth, async user => {
    if (!user) { window.location.href = 'login.html'; return; }

    try {
        const snap = await getDoc(doc(db, 'users', user.uid));

        if (!snap.exists()) {
            // New Google/phone auth user — create a minimal doc
            await signOut(auth);
            window.location.href = 'login.html';
            return;
        }

        const data = snap.data();

        // Redirect admin to admin panel
        if (data.role === 'admin') {
            window.location.href = 'admin.html';
            return;
        }

        currentUser     = user;
        currentUserData = data;

        // Show username in nav  (Flutter: username field, lowercase)
        const display = data.username || data.fullName || 'User';
        document.getElementById('navUsername').textContent    = display;
        document.getElementById('mobileUsername').textContent = display;

        // Pre-fill booking form (Flutter UserModel field names)
        document.getElementById('customer_name').value  = data.fullName || '';
        document.getElementById('customer_phone').value = (data.phone  || '').replace('+91', '');
        document.getElementById('customer_email').value = data.email   || '';

        // Min date = now (no past bookings)
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('service_date').min = now.toISOString().slice(0, 16);

        await loadHelpers();

    } catch (e) {
        console.error('Auth check failed:', e);
        window.location.href = 'login.html';
    }
});

// ── Load Helpers ──────────────────────────────────────────────────
//    /helpers where isAvailable == true  (Flutter: isAvailable bool)
//    Groups by serviceType  (Flutter: serviceType field, not service_category)
async function loadHelpers() {
    try {
        const q    = query(collection(db, 'helpers'), where('isAvailable', '==', true));
        const snap = await getDocs(q);
        allHelpers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort: serviceType ASC, rating DESC, name ASC
        allHelpers.sort((a, b) => {
            const catA = (a.serviceType || '').toLowerCase();
            const catB = (b.serviceType || '').toLowerCase();
            if (catA < catB) return -1;
            if (catA > catB) return 1;
            if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
            return (a.name || '').localeCompare(b.name || '');
        });

        // Group by serviceType (Flutter field)
        const byCategory = {};
        allHelpers.forEach(h => {
            const cat = h.serviceType || 'Other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(h);
        });

        renderCategories(byCategory);
        updateStats(byCategory);

    } catch (e) {
        document.getElementById('categoriesGrid').innerHTML =
            '<div class="no-services"><i class="fas fa-tools"></i><h3>No services available</h3><p>Please check back later.</p></div>';
        console.error('loadHelpers:', e);
    }
}

// ── Stats ─────────────────────────────────────────────────────────
async function updateStats(byCategory) {
    const total = allHelpers.length;
    const avg   = total
        ? (allHelpers.reduce((s, h) => s + (parseFloat(h.rating) || 0), 0) / total).toFixed(1)
        : '0.0';

    document.getElementById('statHelpers').textContent = total;
    document.getElementById('statCats').textContent    = Object.keys(byCategory).length;
    document.getElementById('statRating').textContent  = avg;

    try {
        // Count bookings for this user
        const bSnap = await getDocs(query(
            collection(db, 'bookings'),
            where('userId', '==', currentUser.uid)   // Flutter: userId field
        ));
        document.getElementById('statBookings').textContent = bSnap.size;
    } catch { /* ignore */ }
}

// ── Icon Map ──────────────────────────────────────────────────────
const CATEGORY_ICONS = {
    'cleaning':    '<i class="fas fa-broom"></i>',
    'plumbing':    '<i class="fas fa-wrench"></i>',
    'electrical':  '<i class="fas fa-bolt"></i>',
    'painting':    '<i class="fas fa-paint-brush"></i>',
    'carpentry':   '<i class="fas fa-hammer"></i>',
    'gardening':   '<i class="fas fa-seedling"></i>',
    'tutoring':    '<i class="fas fa-book"></i>',
    'cooking':     '<i class="fas fa-utensils"></i>',
    'repair':      '<i class="fas fa-tools"></i>',
    'home repairs':'<i class="fas fa-home"></i>',
    'beauty':      '<i class="fas fa-spa"></i>',
    'fitness':     '<i class="fas fa-dumbbell"></i>',
    'pet care':    '<i class="fas fa-dog"></i>',
    'moving':      '<i class="fas fa-truck"></i>',
    'it support':  '<i class="fas fa-laptop"></i>',
    'photography': '<i class="fas fa-camera"></i>',
};

function getIcon(cat) {
    return CATEGORY_ICONS[cat.toLowerCase()] || '<i class="fas fa-tools"></i>';
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating)            stars += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= rating) stars += '<i class="fas fa-star-half-alt"></i>';
        else                        stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

// ── Render Category Cards ─────────────────────────────────────────
function renderCategories(byCategory) {
    const grid = document.getElementById('categoriesGrid');
    const cats = Object.keys(byCategory);

    if (!cats.length) {
        grid.innerHTML = '<div class="no-services"><i class="fas fa-tools"></i><h3>No services available</h3><p>Please check back later.</p></div>';
        return;
    }

    grid.innerHTML = cats.map(cat => {
        const helpers = byCategory[cat];
        return `
        <div class="category-card">
            <div class="category-header" onclick="toggleCategory(this)">
                <div class="category-info">
                    <div class="category-icon">${getIcon(cat)}</div>
                    <div class="category-details">
                        <h3>${ucwords(cat)}</h3>
                        <p>Professional ${cat.toLowerCase()} services available</p>
                    </div>
                </div>
                <div class="category-meta">
                    <div class="helper-count">
                        <i class="fas fa-users"></i>
                        ${helpers.length} Helper${helpers.length !== 1 ? 's' : ''}
                    </div>
                    <i class="fas fa-chevron-down expand-icon"></i>
                </div>
            </div>
            <div class="helpers-list">
                ${helpers.map(h => `
                <div class="helper-card" data-helper-name="${(h.name || '').toLowerCase()}">
                    <div class="helper-header">
                        <div class="helper-info">
                            <h4>
                                ${esc(h.name || '')}
                                <span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>
                            </h4>
                            <p>${esc(h.experience || '')}${h.pricePerHour ? ' · ₹' + h.pricePerHour + '/hr' : ''}</p>
                            <div class="helper-rating">
                                <div class="stars">${renderStars(parseFloat(h.rating) || 0)}</div>
                                <span class="rating-text">${parseFloat(h.rating || 0).toFixed(1)} · ${h.completedJobs || 0} jobs</span>
                            </div>
                        </div>
                    </div>
                    <div class="helper-contact">
                        <div class="contact-info">
                            <div class="contact-item"><i class="fas fa-phone"></i><span>${esc(h.phoneNumber || '')}</span></div>
                            <div class="contact-item"><i class="fas fa-map-marker-alt"></i><span>${esc(h.location || 'City Wide')}</span></div>
                            ${h.employeeId ? `<div class="contact-item"><i class="fas fa-id-badge"></i><span>${esc(h.employeeId)}</span></div>` : ''}
                        </div>
                        <button class="book-btn"
                            onclick="openBookingModal(
                                '${h.id}',
                                '${escAttr(h.name || '')}',
                                '${escAttr(h.serviceType || '')}',
                                ${parseFloat(h.rating||0)},
                                ${h.completedJobs||0},
                                '${escAttr(h.employeeId||'')}',
                                '${escAttr(h.profileImageUrl||'')}'
                            )">
                            <i class="fas fa-calendar-check"></i> Book Now
                        </button>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
    }).join('');
}

// ── Submit Booking ────────────────────────────────────────────────
//    Writes to /bookings/{id}  — exact Flutter BookingFirestoreModel fields
window.submitBooking = async () => {
    const helperId        = document.getElementById('modalHelperId').value;
    const helperName      = document.getElementById('helperName').value;
    const serviceType     = document.getElementById('serviceCategory').value;
    const helperRating    = parseFloat(document.getElementById('modalHelperRating').value  || 0);
    const helperJobCount  = parseInt(document.getElementById('modalHelperJobs').value      || 0);
    const helperEmpId     = document.getElementById('modalHelperEmpId').value;
    const helperImageUrl  = document.getElementById('modalHelperImg').value;
    const custName        = document.getElementById('customer_name').value.trim();
    const custPhone       = document.getElementById('customer_phone').value.trim();
    const custEmail       = document.getElementById('customer_email').value.trim();
    const svcDate         = document.getElementById('service_date').value;
    const svcAddr         = document.getElementById('service_address').value.trim();
    const specInstr       = document.getElementById('special_instructions').value.trim();
    const payMethod       = document.getElementById('payment_method').value;

    if (!custName || !custPhone || !svcDate || !svcAddr) {
        alert('Please fill all required fields.'); return;
    }
    if (!/^\d{10}$/.test(custPhone.replace(/\D/g, ''))) {
        alert('Please enter a valid 10-digit phone number.'); return;
    }
    if (new Date(svcDate) <= new Date()) {
        alert('Please select a future date and time.'); return;
    }

    let payStatus = 'pending';
    let transId   = null;

    if (payMethod === 'upi') {
        transId   = document.getElementById('upi_transaction_id').value.trim();
        if (!transId) { alert('Please enter the UPI Transaction ID.'); return; }
        payStatus = 'paid';
    } else if (payMethod === 'cash') {
        payStatus = 'pending';
    }

    const helper = allHelpers.find(h => h.id === helperId);
    if (!helper) { alert('This helper is no longer available.'); return; }

    document.getElementById('loadingOverlay').style.display = 'flex';

    try {
        // ✅ BookingFirestoreModel — exact field names from Flutter Dart model
        const ref = await addDoc(collection(db, 'bookings'), {
            userId:           currentUser.uid,
            helperId:         helperId,
            helperName:       helperName,
            helperRating:     helperRating,
            helperJobCount:   helperJobCount,
            helperEmployeeId: helperEmpId || null,
            helperImageUrl:   helperImageUrl || null,
            serviceName:      ucwords(serviceType),
            serviceId:        serviceType.toLowerCase().replace(/\s+/g, '_'),
            status:           'pending',              // Flutter status values
            address:          svcAddr,
            scheduledAt:      Timestamp.fromDate(new Date(svcDate)),
            completedAt:      null,
            totalAmount:      helper.pricePerHour || null,
            paymentMode:      payMethod,              // 'cash' | 'upi'
            paymentStatus:    payStatus,              // 'pending' | 'paid'
            // Extra web fields (Flutter will ignore unknown fields)
            customerPhone:    `+91${custPhone.replace(/\D/g,'')}`,
            customerEmail:    custEmail || null,
            specialInstructions: specInstr || null,
            transactionId:    transId || null,
            createdAt:        serverTimestamp()
        });

        document.getElementById('loadingOverlay').style.display = 'none';
        closeBookingModal();
        showAlert(`✅ Booking confirmed! ID: #${ref.id.slice(0, 8)}. We'll contact you soon.`, 'success');

    } catch (e) {
        document.getElementById('loadingOverlay').style.display = 'none';
        showAlert('Booking failed: ' + e.message, 'error');
    }
};

// ── Load User Bookings ────────────────────────────────────────────
//    Queries /bookings where userId == uid  (Flutter: userId field)
//    Shows status, serviceName, address, scheduledAt, paymentMode
async function loadUserBookings() {
    const list = document.getElementById('bookingsList');
    list.innerHTML = '<div class="no-bookings"><i class="fas fa-spinner fa-spin"></i><h3>Loading...</h3></div>';

    try {
        const q    = query(
            collection(db, 'bookings'),
            where('userId', '==', currentUser.uid),   // Flutter field: userId
            orderBy('createdAt', 'desc'),
            limit(10)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            list.innerHTML = '<div class="no-bookings"><i class="fas fa-calendar-times"></i><h3>No bookings yet</h3><p>Book your first service above!</p></div>';
            return;
        }

        const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        list.innerHTML = bookings.map(b => {
            // Flutter: scheduledAt is a Timestamp
            const dateStr = b.scheduledAt?.toDate
                ? b.scheduledAt.toDate().toLocaleString('en-IN', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
                : 'N/A';

            // Flutter status values: pending | active | ongoing | completed | cancelled
            const statusClass = 'status-' + (b.status || 'pending').toLowerCase();

            return `
            <div class="booking-card">
                <div class="booking-header">
                    <div class="booking-id"><i class="fas fa-receipt"></i> #${b.id.slice(0,8)}</div>
                    <div class="booking-status ${statusClass}">${cap(b.status || 'pending')}</div>
                </div>
                <div class="booking-details">
                    <div class="detail-item"><i class="fas fa-user-tie"></i><span><strong>Helper:</strong> ${esc(b.helperName || 'N/A')}</span></div>
                    <div class="detail-item"><i class="fas fa-tools"></i><span><strong>Service:</strong> ${esc(b.serviceName || '')}</span></div>
                    <div class="detail-item"><i class="fas fa-calendar"></i><span><strong>Scheduled:</strong> ${dateStr}</span></div>
                    <div class="detail-item"><i class="fas fa-map-marker-alt"></i><span><strong>Address:</strong> ${esc(b.address || '')}</span></div>
                    <div class="detail-item"><i class="fas fa-credit-card"></i><span><strong>Payment:</strong> ${cap(b.paymentMode || 'cash')} — ${cap(b.paymentStatus || 'pending')}</span></div>
                    ${b.totalAmount ? `<div class="detail-item"><i class="fas fa-rupee-sign"></i><span><strong>Amount:</strong> ₹${b.totalAmount}/hr</span></div>` : ''}
                    ${b.specialInstructions ? `<div class="detail-item" style="grid-column:1/-1"><i class="fas fa-comment"></i><span><strong>Note:</strong> ${esc(b.specialInstructions)}</span></div>` : ''}
                </div>
            </div>`;
        }).join('');

    } catch (e) {
        list.innerHTML = '<div class="no-bookings"><i class="fas fa-exclamation-triangle"></i><h3>Could not load bookings</h3><p>' + e.message + '</p></div>';
    }
}

// ── Public API ────────────────────────────────────────────────────
window.doLogout = async () => { await signOut(auth); window.location.href = 'login.html'; };

window.openBookingsModal = () => {
    document.getElementById('bookingsModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    loadUserBookings();
};

window.closeBookingsModal = () => {
    document.getElementById('bookingsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
};

window.filterServices = term => {
    document.querySelectorAll('.category-card').forEach(card => {
        const catName = card.querySelector('h3').textContent.toLowerCase();
        const t       = term.toLowerCase().trim();
        let visible   = 0;
        card.querySelectorAll('.helper-card').forEach(hc => {
            const match = !t || hc.dataset.helperName.includes(t) || hc.textContent.toLowerCase().includes(t);
            hc.style.display = match ? 'flex' : 'none';
            if (match) visible++;
        });
        card.style.display = (!t || catName.includes(t) || visible > 0) ? 'block' : 'none';
    });
};

// ── Utilities ─────────────────────────────────────────────────────
function esc(s)    { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s){ return String(s).replace(/'/g,"\\'"); }
function ucwords(s){ return s.replace(/\b\w/g, c => c.toUpperCase()); }
function cap(s)    { return s.charAt(0).toUpperCase() + s.slice(1); }

function showAlert(msg, type) {
    const el = document.getElementById('alertMessage');
    el.className  = `alert alert-${type}`;
    el.innerHTML  = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${msg}`;
    el.style.display = 'flex';
    setTimeout(() => {
        el.style.opacity   = '0';
        el.style.transform = 'translate(-50%, -30px)';
        setTimeout(() => {
            el.style.display   = 'none';
            el.style.opacity   = '1';
            el.style.transform = 'translate(-50%, 0)';
        }, 300);
    }, 5000);
}