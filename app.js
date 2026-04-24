/* ─────────────────────────────────────
   TheatreOps Portal — app.js
   SPA Router + API layer
   ───────────────────────────────────── */

const API_URL = 'https://theatrecontract-be.onrender.com';

// ══════════════════════════════════════
//  DOM Refs
// ══════════════════════════════════════
const authScreen     = document.getElementById('auth-screen');
const appShell       = document.getElementById('app-shell');
const loginForm      = document.getElementById('login-form');
const loginError     = document.getElementById('login-error');
const loginBtnText   = document.getElementById('login-btn-text');
const loginSpinner   = document.getElementById('login-spinner');
const loginBtn       = document.getElementById('login-btn');

const logoutBtn      = document.getElementById('logout-btn');
const sidebarAvatar  = document.getElementById('sidebar-avatar');
const sidebarUsername= document.getElementById('sidebar-username');
const topbarAvatar   = document.getElementById('topbar-avatar');
const topbarUsername = document.getElementById('topbar-username');

const adminNavItem   = document.getElementById('admin-nav-item');
const adminInfoCard  = document.getElementById('admin-info-card');
const pageTitle      = document.getElementById('page-title');

const menuBtn        = document.getElementById('menu-btn');
const sidebar        = document.getElementById('sidebar');
const overlay        = document.getElementById('sidebar-overlay');

// Process page
const uploadForm     = document.getElementById('upload-form');
const excelFile      = document.getElementById('excel-file');
const dropzone       = document.getElementById('dropzone');
const dropzoneLabel  = document.getElementById('dropzone-label');
const filePreview    = document.getElementById('file-preview');
const filePreviewName= document.getElementById('file-preview-name');
const removeFileBtn  = document.getElementById('remove-file-btn');
const processBtn     = document.getElementById('process-btn');
const processBtnText = document.getElementById('process-btn-text');
const processSpinner = document.getElementById('process-spinner');
const uploadStatus   = document.getElementById('upload-status');

// Admin page
const createUserForm   = document.getElementById('create-user-form');
const createUserStatus = document.getElementById('create-user-status');
const refreshUsersBtn  = document.getElementById('refresh-users-btn');
const usersList        = document.getElementById('users-list');

// ══════════════════════════════════════
//  Auth Helpers
// ══════════════════════════════════════
const getToken   = () => localStorage.getItem('token');
const getIsAdmin = () => localStorage.getItem('is_admin') === 'true';
const getUsername= () => localStorage.getItem('username') || '';

function initials(name) {
    if (!name) return '?';
    return name.split(/[\s_\-]+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ══════════════════════════════════════
//  Boot / Auth Check
// ══════════════════════════════════════
function boot() {
    if (getToken()) {
        showApp();
    } else {
        showAuth();
    }
}

function showApp() {
    authScreen.classList.add('hidden');
    appShell.classList.remove('hidden');

    const username = getUsername();
    const isAdmin  = getIsAdmin();

    // Set user info in sidebar & topbar
    const av = initials(username);
    sidebarAvatar.textContent  = av;
    topbarAvatar.textContent   = av;
    sidebarUsername.textContent= username || 'User';
    topbarUsername.textContent = username || 'User';

    // Admin visibility
    if (isAdmin) {
        adminNavItem.classList.remove('hidden');
        adminInfoCard.style.display = '';
    } else {
        adminNavItem.classList.add('hidden');
        adminInfoCard.style.display = 'none';
    }

    // Route to current hash (default: dashboard)
    routeTo(location.hash.replace('#', '') || 'dashboard');
}

function showAuth() {
    appShell.classList.add('hidden');
    authScreen.classList.remove('hidden');
}

// ══════════════════════════════════════
//  SPA Router
// ══════════════════════════════════════
const PAGE_META = {
    dashboard: { title: 'Dashboard' },
    process:   { title: 'Process Data' },
    admin:     { title: 'User Management', adminOnly: true },
};

function routeTo(page) {
    const meta = PAGE_META[page];

    // Fallback if page doesn't exist or is admin-only for non-admin
    if (!meta || (meta.adminOnly && !getIsAdmin())) {
        page = 'dashboard';
    }

    // Update URL hash without push
    history.replaceState(null, '', `#${page}`);

    // Update page title
    pageTitle.textContent = PAGE_META[page].title;

    // Switch active page
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    // Update sidebar active link
    document.querySelectorAll('.nav-item').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });

    // Side-effects per page
    if (page === 'admin') fetchUsers();

    // Close mobile sidebar
    closeSidebar();
}

// ══════════════════════════════════════
//  Login
// ══════════════════════════════════════
loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    setLoginLoading(true);
    loginError.classList.add('hidden');

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const res = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token',    data.access_token);
            localStorage.setItem('is_admin', data.is_admin);
            localStorage.setItem('username', username);
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            showApp();
        } else {
            const err = await res.json().catch(() => ({}));
            showLoginError(err.detail || 'Invalid credentials.');
        }
    } catch {
        showLoginError('Connection error. Please try again.');
    } finally {
        setLoginLoading(false);
    }
});

function setLoginLoading(on) {
    loginBtn.disabled = on;
    loginBtnText.textContent = on ? 'Signing in…' : 'Sign In';
    loginSpinner.classList.toggle('hidden', !on);
}

function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
}

// ══════════════════════════════════════
//  Logout
// ══════════════════════════════════════
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('username');
    showAuth();
});

// ══════════════════════════════════════
//  Navigation — sidebar links + hash
// ══════════════════════════════════════
document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
        e.preventDefault();
        routeTo(el.dataset.page);
    });
});

window.addEventListener('hashchange', () => {
    if (getToken()) routeTo(location.hash.replace('#', '') || 'dashboard');
});

// ══════════════════════════════════════
//  Mobile Sidebar
// ══════════════════════════════════════
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
});

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

overlay.addEventListener('click', closeSidebar);

// ══════════════════════════════════════
//  Process Data — Dropzone
// ══════════════════════════════════════
excelFile.addEventListener('change', () => {
    const file = excelFile.files[0];
    if (file) showFilePreview(file);
});

removeFileBtn.addEventListener('click', () => {
    excelFile.value = '';
    filePreview.classList.add('hidden');
    dropzoneLabel.style.display = '';
    processBtn.disabled = true;
    clearUploadStatus();
});

function showFilePreview(file) {
    filePreviewName.textContent = file.name;
    filePreview.classList.remove('hidden');
    dropzoneLabel.style.display = 'none';
    processBtn.disabled = false;
    clearUploadStatus();
}

// Drag & drop
dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && /\.(xlsx|xls)$/i.test(file.name)) {
        // Assign to input
        const dt = new DataTransfer();
        dt.items.add(file);
        excelFile.files = dt.files;
        showFilePreview(file);
    } else {
        setUploadStatus('error', 'Please drop a valid Excel file (.xlsx or .xls).');
    }
});

// ══════════════════════════════════════
//  Process & Download ZIP
// ══════════════════════════════════════
uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!excelFile.files.length) return;

    const token = getToken();
    const formData = new FormData();
    formData.append('file', excelFile.files[0]);

    setProcessLoading(true);
    setUploadStatus('info', '⚙️ Processing your file…');

    try {
        const res = await fetch(`${API_URL}/process-zip`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.download = 'theatre_package.zip';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            setUploadStatus('success', '✅ Done! Your download has started.');
            // Reset file input
            excelFile.value = '';
            filePreview.classList.add('hidden');
            dropzoneLabel.style.display = '';
            processBtn.disabled = true;
        } else {
            const err = await res.json().catch(() => ({}));
            setUploadStatus('error', `❌ ${err.detail || 'Processing failed. Please try again.'}`);
        }
    } catch {
        setUploadStatus('error', '❌ Network error. Check your connection and try again.');
    } finally {
        setProcessLoading(false);
    }
});

function setProcessLoading(on) {
    processBtn.disabled = on;
    processBtnText.textContent = on ? 'Processing…' : 'Process & Download ZIP';
    processSpinner.classList.toggle('hidden', !on);
    processBtn.querySelector('.btn-icon').classList.toggle('hidden', on);
}

function setUploadStatus(type, msg) {
    uploadStatus.textContent = msg;
    uploadStatus.className = `status-banner ${type}`;
    uploadStatus.classList.remove('hidden');
}

function clearUploadStatus() {
    uploadStatus.classList.add('hidden');
    uploadStatus.className = 'status-banner hidden';
}

// ══════════════════════════════════════
//  User Management (Admin)
// ══════════════════════════════════════
async function fetchUsers() {
    const token = getToken();
    usersList.innerHTML = `<tr class="empty-row"><td colspan="2">Loading…</td></tr>`;

    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
            const users = await res.json();
            if (!users.length) {
                usersList.innerHTML = `<tr class="empty-row"><td colspan="2">No users found.</td></tr>`;
                return;
            }
            usersList.innerHTML = users.map(u => `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:0.625rem">
                            <div class="user-avatar" style="width:28px;height:28px;font-size:0.7rem">${initials(u.username)}</div>
                            <span style="font-weight:500">${escHtml(u.username)}</span>
                        </div>
                    </td>
                    <td>
                        <span class="role-pill ${u.is_admin ? 'admin' : 'staff'}">${u.is_admin ? 'Admin' : 'Staff'}</span>
                    </td>
                </tr>
            `).join('');
        } else {
            usersList.innerHTML = `<tr class="empty-row"><td colspan="2">Failed to load users.</td></tr>`;
        }
    } catch {
        usersList.innerHTML = `<tr class="empty-row"><td colspan="2">Connection error.</td></tr>`;
    }
}

refreshUsersBtn.addEventListener('click', fetchUsers);

createUserForm.addEventListener('submit', async e => {
    e.preventDefault();
    const usernameEl = document.getElementById('new-username');
    const passwordEl = document.getElementById('new-password');
    const roleEl     = createUserForm.querySelector('input[name="role"]:checked');
    const token      = getToken();
    const isAdmin    = roleEl?.value === 'admin';

    hideCreateUserStatus();

    try {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                username: usernameEl.value.trim(),
                password: passwordEl.value,
                is_admin: isAdmin,
            }),
        });

        if (res.ok) {
            showCreateUserStatus('success', `User "${usernameEl.value.trim()}" created successfully.`);
            usernameEl.value = '';
            passwordEl.value = '';
            createUserForm.querySelector('input[value="staff"]').checked = true;
            fetchUsers();
        } else {
            const err = await res.json().catch(() => ({}));
            showCreateUserStatus('error', err.detail || 'Failed to create user.');
        }
    } catch {
        showCreateUserStatus('error', 'Server error. Please try again.');
    }
});

function showCreateUserStatus(type, msg) {
    createUserStatus.textContent = msg;
    createUserStatus.className = `status-inline ${type}`;
    createUserStatus.classList.remove('hidden');
}
function hideCreateUserStatus() {
    createUserStatus.classList.add('hidden');
}

// ══════════════════════════════════════
//  Utils
// ══════════════════════════════════════
function escHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

// ══════════════════════════════════════
//  Init
// ══════════════════════════════════════
boot();