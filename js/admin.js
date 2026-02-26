// ================================================================
//  js/admin.js  —  Admin Panel Firebase Logic
//
//  ✅  ALL collections match Flutter Dart models exactly:
//
//  /users/{uid}            ← UserModel
//    manages: fullName, username, email, phone, provider,
//             profileComplete, locationEnabled, role, createdAt
//
//  /helpers/{helperId}     ← HelperFirestoreModel
//    manages: name, serviceType, rating, completedJobs,
//             isAvailable, pricePerHour, phoneNumber,
//             experience, location, profileImageUrl,
//             skills, employeeId, createdAt
//
//  /bookings/{bookingId}   ← BookingFirestoreModel
//    manages: userId, helperId, helperName, serviceName,
//             serviceId, status, address, scheduledAt,
//             completedAt, totalAmount, paymentMode,
//             paymentStatus, createdAt
//
//  /contact_messages/{id}  ← web-only (no Flutter model)
//    manages: full_name, email, phone, message, status
// ================================================================

import { auth, db } from './firebase-config.js';
import {
    onAuthStateChanged, signOut,
    createUserWithEmailAndPassword, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection, getDocs, doc, getDoc, addDoc, setDoc,
    updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentAdmin = null;
let allHelpers   = [];
let allUsers     = [];
let allBookings  = [];
let allContacts  = [];

// ── Auth Guard — admin only ───────────────────────────────────────
//    Reads /users/{uid}  — checks role field
onAuthStateChanged(auth, async user => {
    if (!user) { window.location.href = 'login.html'; return; }

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists() || snap.data().role !== 'admin') {
        window.location.href = 'dashboard.html';
        return;
    }

    currentAdmin = user;
    // Flutter UserModel: username or fullName
    const d = snap.data();
    document.getElementById('adminUsernameBtn').textContent = `${d.username || d.fullName || 'Admin'} ▼`;

    await loadAll();
});

async function loadAll() {
    await Promise.all([loadHelpers(), loadUsers(), loadBookings(), loadContacts()]);
    updateDashboardCards();
}

// ════════════════════════════════════════════════════════════════
//  HELPERS  —  /helpers/{helperId}  (Flutter HelperFirestoreModel)
// ════════════════════════════════════════════════════════════════

async function loadHelpers() {
    try {
        const snap = await getDocs(collection(db, 'helpers'));
        allHelpers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort: unavailable last, then by name
        allHelpers.sort((a, b) => {
            if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
            return (a.name || '').localeCompare(b.name || '');
        });

        renderHelpersTable();
        renderRecentHelpers();
    } catch (e) { console.error('loadHelpers:', e); }
}

function renderRecentHelpers() {
    const tbody = document.getElementById('recentHelpers');
    const slice = allHelpers.slice(0, 5);
    if (!slice.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#666;">No helpers yet.</td></tr>';
        return;
    }
    tbody.innerHTML = slice.map(h => `
    <tr>
        <td style="font-size:0.8rem;color:#999;">${h.id.slice(0, 8)}</td>
        <td>${esc(h.name || '')}</td>
        <td>${esc(h.phoneNumber || '')}</td>
        <td>${esc(h.serviceType || '')}</td>
        <td>
            <span class="status-badge ${h.isAvailable ? 'active' : 'inactive'}">
                ${h.isAvailable ? 'Available' : 'Unavailable'}
            </span>
        </td>
        <td><button class="btn btn-secondary btn-sm" onclick="editHelper('${h.id}')">Edit</button></td>
    </tr>`).join('');
}

function renderHelpersTable() {
    const tbody = document.getElementById('helpersTable');
    if (!allHelpers.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#666;">No helpers found. Click "Add New Helper" to add one.</td></tr>';
        return;
    }
    tbody.innerHTML = allHelpers.map(h => `
    <tr>
        <td style="font-size:0.8rem;color:#999;">${h.id.slice(0, 8)}</td>
        <td>
            <strong>${esc(h.name || '')}</strong>
            ${h.employeeId ? `<br><small style="color:#999;">${esc(h.employeeId)}</small>` : ''}
        </td>
        <td>${esc(h.phoneNumber || '')}</td>
        <td>${esc(h.serviceType || '')}</td>
        <td>${esc(h.location || 'N/A')}</td>
        <td>
            <span class="status-badge ${h.isAvailable ? 'active' : 'inactive'}">
                ${h.isAvailable ? 'Available' : 'Unavailable'}
            </span>
        </td>
        <td>${parseFloat(h.rating || 0).toFixed(1)} ⭐ (${h.completedJobs || 0} jobs)</td>
        <td>${h.pricePerHour ? '₹' + h.pricePerHour + '/hr' : 'N/A'}</td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-secondary btn-sm" onclick="editHelper('${h.id}')">Edit</button>
                ${h.isAvailable
                    ? `<button class="btn btn-secondary btn-sm" onclick="toggleHelperAvailability('${h.id}', false)">Deactivate</button>`
                    : `<button class="btn btn-primary btn-sm"   onclick="toggleHelperAvailability('${h.id}', true)">Activate</button>`}
                <button class="btn btn-danger btn-sm" onclick="deleteHelper('${h.id}')">Delete</button>
            </div>
        </td>
    </tr>`).join('');
}

// ── Add Helper ────────────────────────────────────────────────────
//    Uses Flutter HelperFirestoreModel field names exactly
window.addHelper = async () => {
    const name        = v('add_name');
    const phoneNumber = v('add_phone');
    const email       = v('add_email');
    const location    = v('add_location');
    const serviceType = v('add_service');     // Flutter: serviceType (not service_category)
    const description = v('add_description');
    const experience  = v('add_experience') || '1 year';
    const pricePerHour= parseFloat(v('add_price') || 0);
    const rating      = parseFloat(v('add_rating') || 4.0);
    const skillsRaw   = v('add_skills');

    if (!name || !phoneNumber || !serviceType || !location) {
        showStatus('Name, Phone, Service Type and Location are required.', 'error'); return;
    }

    const skills = skillsRaw
        ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    // Generate employeeId like Flutter expects: "TS-EMP-XXX"
    const employeeId = `TS-EMP-${Math.floor(100 + Math.random() * 900)}`;

    try {
        // ✅ Flutter HelperFirestoreModel — exact field names
        await addDoc(collection(db, 'helpers'), {
            name,
            serviceType,          // Flutter field (not service_category)
            rating,
            completedJobs: 0,     // Flutter field (not total_jobs)
            isAvailable: false,   // Flutter field (not is_active)
            pricePerHour,         // Flutter field
            phoneNumber,          // Flutter field (not phone)
            experience,           // Flutter field: "5 years" string
            location,
            profileImageUrl: null,// Flutter field
            skills,               // Flutter field: List<String>
            employeeId,           // Flutter field: "TS-EMP-XXX"
            // Extra web-only fields (Flutter ignores unknown fields)
            email:       email || null,
            description: description || null,
            createdAt:   serverTimestamp()
        });
        showStatus('Helper added successfully!', 'success');
        hideModal('addHelperModal');
        await loadHelpers();
        updateDashboardCards();
    } catch (e) { showStatus('Error: ' + e.message, 'error'); }
};

// ── Edit Helper ───────────────────────────────────────────────────
window.editHelper = id => {
    const h = allHelpers.find(x => x.id === id);
    if (!h) return;
    sv('edit_helper_id',   id);
    sv('edit_name',        h.name        || '');
    sv('edit_phone',       h.phoneNumber || '');   // Flutter: phoneNumber
    sv('edit_email',       h.email       || '');
    sv('edit_location',    h.location    || '');
    sv('edit_experience',  h.experience  || '');
    sv('edit_price',       h.pricePerHour|| '');
    sv('edit_rating',      h.rating      || 4.0);
    sv('edit_description', h.description || '');
    sv('edit_skills',      (h.skills || []).join(', '));
    const sel = document.getElementById('edit_service');
    if (sel) sel.value = h.serviceType || '';     // Flutter: serviceType
    showModal('editHelperModal');
};

// ── Update Helper ─────────────────────────────────────────────────
window.updateHelper = async () => {
    const id          = v('edit_helper_id');
    const name        = v('edit_name');
    const phoneNumber = v('edit_phone');
    const email       = v('edit_email');
    const location    = v('edit_location');
    const serviceType = v('edit_service');
    const experience  = v('edit_experience') || '1 year';
    const pricePerHour= parseFloat(v('edit_price') || 0);
    const rating      = parseFloat(v('edit_rating') || 4.0);
    const description = v('edit_description');
    const skillsRaw   = v('edit_skills');

    if (!name || !phoneNumber || !serviceType || !location) {
        showStatus('Name, Phone, Service Type and Location are required.', 'error'); return;
    }

    const skills = skillsRaw
        ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    try {
        // ✅ Flutter HelperFirestoreModel field names
        await updateDoc(doc(db, 'helpers', id), {
            name,
            serviceType,          // Flutter field
            rating,
            pricePerHour,         // Flutter field
            phoneNumber,          // Flutter field
            experience,           // Flutter field
            location,
            skills,               // Flutter field
            email:       email || null,
            description: description || null
        });
        showStatus('Helper updated successfully!', 'success');
        hideModal('editHelperModal');
        await loadHelpers();
        updateDashboardCards();
    } catch (e) { showStatus('Error: ' + e.message, 'error'); }
};

// ── Toggle Availability ───────────────────────────────────────────
//    Flutter: isAvailable bool (not status string)
window.toggleHelperAvailability = async (id, available) => {
    const action = available ? 'activate' : 'deactivate';
    if (!confirm(`${cap(action)} this helper?`)) return;
    try {
        await updateDoc(doc(db, 'helpers', id), { isAvailable: available });
        showStatus(`Helper ${action}d successfully!`, 'success');
        await loadHelpers();
        updateDashboardCards();
    } catch (e) { showStatus('Error: ' + e.message, 'error'); }
};

window.deleteHelper = async id => {
    if (!confirm('Delete this helper permanently? This cannot be undone.')) return;
    try {
        await deleteDoc(doc(db, 'helpers', id));
        showStatus('Helper deleted.', 'success');
        await loadHelpers();
        updateDashboardCards();
    } catch (e) { showStatus('Error: ' + e.message, 'error'); }
};

// ════════════════════════════════════════════════════════════════
//  USERS  —  /users/{uid}  (Flutter UserModel)
// ════════════════════════════════════════════════════════════════

async function loadUsers() {
    try {
        const snap = await getDocs(collection(db, 'users'));
        allUsers   = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort: admins first, then by fullName
        allUsers.sort((a, b) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (b.role === 'admin' && a.role !== 'admin') return 1;
            return (a.fullName || '').localeCompare(b.fullName || '');
        });

        document.getElementById('usersCount').textContent = allUsers.length;
        renderUsersTable();
    } catch (e) { console.error('loadUsers:', e); }
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTable');
    if (!allUsers.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#666;">No users found.</td></tr>';
        return;
    }
    tbody.innerHTML = allUsers.map(u => {
        // Flutter UserModel: createdAt Timestamp
        const joined = u.createdAt?.toDate
            ? u.createdAt.toDate().toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })
            : 'N/A';
        return `
        <tr>
            <td>
                <strong>${esc(u.fullName || '')}</strong>
                <br><small style="color:#999;">@${esc(u.username || '')}</small>
            </td>
            <td>${esc(u.email || '')}</td>
            <td>${esc(u.phone  || '')}</td>
            <td>
                <span class="status-badge ${u.provider || 'email'}">
                    ${cap(u.provider || 'email')}
                </span>
            </td>
            <td>
                <span class="status-badge ${(u.role || 'user')}">
                    ${cap(u.role || 'user')}
                </span>
            </td>
            <td>
                <span class="status-badge ${u.profileComplete ? 'active' : 'pending'}">
                    ${u.profileComplete ? 'Complete' : 'Incomplete'}
                </span>
            </td>
            <td>${joined}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="editUser('${u.id}')">Edit</button>
                    ${u.role !== 'admin'
                        ? `<button class="btn btn-primary btn-sm"  onclick="makeAdmin('${u.id}')">Make Admin</button>`
                        : `<button class="btn btn-secondary btn-sm" onclick="removeAdmin('${u.id}')">Remove Admin</button>`}
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ── Add User (creates Firebase Auth + /users doc) ─────────────────
window.addUser = async () => {
    const fullName = v('add_user_name');
    const email    = v('add_user_email');
    const phone    = v('add_user_phone');
    const pw       = v('add_user_password');

    if (!fullName || !email || !phone || !pw) {
        showStatus('All fields are required.', 'error'); return;
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        await updateProfile(cred.user, { displayName: fullName });

        // ✅ Flutter UserModel — all fields
        await setDoc(doc(db, 'users', cred.user.uid), {
            uid:             cred.user.uid,
            fullName:        fullName,
            username:        fullName.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
            email:           email,
            phone:           phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g,'')}`,
            photoUrl:        null,
            provider:        'email',
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

        showStatus('User added successfully!', 'success');
        hideModal('addUserModal');
        await loadUsers();
        updateDashboardCards();
    } catch (e) {
        showStatus(e.code === 'auth/email-already-in-use' ? 'Email already in use.' : 'Error: ' + e.message, 'error');
    }
};

// ── Edit User ─────────────────────────────────────────────────────
window.editUser = id => {
    const u = allUsers.find(x => x.id === id);
    if (!u) return;
    sv('edit_user_id',    id);
    sv('edit_user_name',  u.fullName || '');      // Flutter: fullName
    sv('edit_user_email', u.email    || '');
    sv('edit_user_phone', (u.phone   || '').replace('+91', ''));
    showModal('editUserModal');
};

// ── Update User ───────────────────────────────────────────────────
window.updateUser = async () => {
    const id       = v('edit_user_id');
    const fullName = v('edit_user_name');
    const email    = v('edit_user_email');
    const phone    = v('edit_user_phone');

    if (!fullName || !email || !phone) {
        showStatus('All fields are required.', 'error'); return;
    }

    try {
        // ✅ Flutter UserModel field names
        await updateDoc(doc(db, 'users', id), {
            fullName: fullName,
            email:    email,
            phone:    phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g,'')}`,
            updatedAt: serverTimestamp()
        });
        showStatus('User updated successfully!', 'success');
        hideModal('editUserModal');
        await loadUsers();
    } catch (e) { showStatus('Error: ' + e.message, 'error'); }
};

// ── Role Management ───────────────────────────────────────────────
window.makeAdmin   = async id => {
    if (!confirm('Make this user an admin?')) return;
    await updateDoc(doc(db,'users',id), { role: 'admin',  updatedAt: serverTimestamp() });
    showStatus('User is now an admin.', 'success');
    await loadUsers();
};

window.removeAdmin = async id => {
    if (id === currentAdmin.uid) { showStatus('You cannot remove your own admin role!', 'error'); return; }
    if (!confirm('Remove admin role from this user?')) return;
    await updateDoc(doc(db,'users',id), { role: 'user', updatedAt: serverTimestamp() });
    showStatus('Admin role removed.', 'success');
    await loadUsers();
};

window.deleteUser  = async id => {
    if (id === currentAdmin.uid) { showStatus('You cannot delete your own account!', 'error'); return; }
    if (!confirm('Delete this user? This removes them from Firestore (not Firebase Auth).')) return;
    try {
        await deleteDoc(doc(db, 'users', id));
        showStatus('User deleted from Firestore.', 'success');
        await loadUsers();
        updateDashboardCards();
    } catch (e) { showStatus('Error: ' + e.message, 'error'); }
};

// ════════════════════════════════════════════════════════════════
//  BOOKINGS  —  /bookings/{id}  (Flutter BookingFirestoreModel)
// ════════════════════════════════════════════════════════════════

async function loadBookings() {
    try {
        const snap  = await getDocs(collection(db, 'bookings'));
        allBookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort: newest first using createdAt
        allBookings.sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tB - tA;
        });

        renderBookingsTable();
    } catch (e) { console.error('loadBookings:', e); }
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    if (!allBookings.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#666;">No bookings yet.</td></tr>';
        return;
    }
    tbody.innerHTML = allBookings.map(b => {
        // Flutter: scheduledAt is a Timestamp
        const scheduled = b.scheduledAt?.toDate
            ? b.scheduledAt.toDate().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : 'N/A';

        // Flutter status: pending | active | ongoing | completed | cancelled
        const status = b.status || 'pending';

        return `
        <tr>
            <td style="font-size:0.8rem;color:#999;">#${b.id.slice(0,8)}</td>
            <td>
                <strong>${esc(b.helperName || 'N/A')}</strong>
                ${b.helperEmployeeId ? `<br><small style="color:#999;">${esc(b.helperEmployeeId)}</small>` : ''}
            </td>
            <td>${esc(b.serviceName || b.serviceId || 'N/A')}</td>
            <td>${scheduled}</td>
            <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                title="${esc(b.address||'')}">
                ${esc((b.address || 'N/A').slice(0, 40))}${(b.address||'').length > 40 ? '…' : ''}
            </td>
            <td><span class="status-badge ${status}">${cap(status)}</span></td>
            <td>
                ${cap(b.paymentMode || 'cash')}
                <span class="status-badge ${b.paymentStatus === 'paid' ? 'active' : 'pending'}" style="margin-left:4px;">
                    ${cap(b.paymentStatus || 'pending')}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    ${status === 'pending'  ? `<button class="btn btn-primary btn-sm"   onclick="updateBookingStatus('${b.id}','active')">Confirm</button>` : ''}
                    ${status === 'active'   ? `<button class="btn btn-primary btn-sm"   onclick="updateBookingStatus('${b.id}','ongoing')">Start</button>` : ''}
                    ${status === 'ongoing'  ? `<button class="btn btn-primary btn-sm"   onclick="updateBookingStatus('${b.id}','completed')">Complete</button>` : ''}
                    ${(status !== 'cancelled' && status !== 'completed')
                        ? `<button class="btn btn-danger btn-sm" onclick="updateBookingStatus('${b.id}','cancelled')">Cancel</button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

// Flutter booking status flow: pending → active → ongoing → completed
window.updateBookingStatus = async (id, status) => {
    if (!confirm(`Set booking status to "${status}"?`)) return;
    const update = { status };
    if (status === 'completed') update.completedAt = serverTimestamp();
    try {
        await updateDoc(doc(db, 'bookings', id), update);
        showStatus(`Booking marked as ${status}.`, 'success');
        await loadBookings();
        updateDashboardCards();
    } catch (e) { showStatus('Error: ' + e.message, 'error'); }
};

// ════════════════════════════════════════════════════════════════
//  CONTACT MESSAGES  —  /contact_messages  (web-only)
// ════════════════════════════════════════════════════════════════

async function loadContacts() {
    try {
        const snap  = await getDocs(collection(db, 'contact_messages'));
        allContacts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        allContacts.sort((a, b) => {
            const tA = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
            const tB = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
            return tB - tA;
        });
        renderContactsTable();
    } catch (e) { console.error('loadContacts:', e); }
}

function renderContactsTable() {
    const tbody = document.getElementById('contactsTable');
    if (!allContacts.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#666;">No messages yet.</td></tr>';
        return;
    }
    tbody.innerHTML = allContacts.map(c => {
        const dt = c.created_at?.toDate
            ? c.created_at.toDate().toLocaleDateString('en-IN')
            : 'N/A';
        return `
        <tr>
            <td>${esc(c.full_name || '')}</td>
            <td>${esc(c.email    || '')}</td>
            <td>${esc(c.phone    || 'N/A')}</td>
            <td>${esc((c.message || '').slice(0, 60))}${(c.message||'').length > 60 ? '…' : ''}</td>
            <td><span class="status-badge ${(c.status||'new').toLowerCase()}">${cap(c.status || 'new')}</span></td>
            <td>${dt}</td>
            <td>
                <div class="action-buttons">
                    ${c.status === 'new' ? `<button class="btn btn-primary btn-sm" onclick="markContactRead('${c.id}')">Mark Read</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteContact('${c.id}')">Delete</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

window.markContactRead = async id => {
    await updateDoc(doc(db, 'contact_messages', id), { status: 'read' });
    showStatus('Message marked as read.', 'success');
    await loadContacts();
    updateDashboardCards();
};

window.deleteContact = async id => {
    if (!confirm('Delete this message?')) return;
    await deleteDoc(doc(db, 'contact_messages', id));
    showStatus('Message deleted.', 'success');
    await loadContacts();
    updateDashboardCards();
};

// ── Dashboard Cards ───────────────────────────────────────────────
function updateDashboardCards() {
    document.getElementById('d_totalUsers').textContent     = allUsers.filter(u => u.role !== 'admin').length;
    document.getElementById('d_activeHelpers').textContent  = allHelpers.filter(h => h.isAvailable).length;   // Flutter: isAvailable
    document.getElementById('d_totalBookings').textContent  = allBookings.length;
    document.getElementById('d_contactMsgs').textContent    = allContacts.filter(c => c.status === 'new').length;

    const avail = allHelpers.filter(h => h.isAvailable);
    const avg   = avail.length
        ? (avail.reduce((s, h) => s + (parseFloat(h.rating) || 0), 0) / avail.length).toFixed(1)
        : '0.0';
    document.getElementById('d_avgRating').textContent      = avg;
    document.getElementById('d_pendingHelpers').textContent = allHelpers.filter(h => !h.isAvailable).length;
}

// ── Public ────────────────────────────────────────────────────────
window.doLogout = async () => { await signOut(auth); window.location.href = 'login.html'; };

// ── Utilities ─────────────────────────────────────────────────────
function v(id)       { return document.getElementById(id)?.value?.trim() || ''; }
function sv(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function esc(s)      { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function cap(s)      { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

window.showStatus = function (msg, type) {
    const el = document.getElementById('statusMessage');
    if (!el) return;
    el.textContent      = msg;
    el.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
    el.style.color      = type === 'success' ? '#155724' : '#721c24';
    el.style.borderLeft = `4px solid ${type === 'success' ? '#28a745' : '#dc3545'}`;
    el.style.display    = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
};