const API_URL = 'https://theatrecontract-be.onrender.com';

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

const uploadForm       = document.getElementById('upload-form');
const excelFile        = document.getElementById('excel-file');
const dropzone         = document.getElementById('dropzone');
const dropzoneLabel    = document.getElementById('dropzone-label');
const filePreview      = document.getElementById('file-preview');
const filePreviewName  = document.getElementById('file-preview-name');
const removeFileBtn    = document.getElementById('remove-file-btn');
const uploadStatus     = document.getElementById('upload-status');

const configSection    = document.getElementById('config-section');
const thirdPartyToggle = document.getElementById('third-party-toggle');
const monthSelect      = document.getElementById('month-select');
const theatreSearch    = document.getElementById('theatre-search');
const theatreList      = document.getElementById('theatre-list');
const btnExcel         = document.getElementById('btn-custom-excel');
const btnZip           = document.getElementById('btn-all-zip');
const excelBtnText     = document.getElementById('excel-btn-text');
const zipBtnText       = document.getElementById('zip-btn-text');

const createUserForm   = document.getElementById('create-user-form');
const createUserStatus = document.getElementById('create-user-status');
const refreshUsersBtn  = document.getElementById('refresh-users-btn');
const usersList        = document.getElementById('users-list');

const getToken   = () => localStorage.getItem('token');
const getIsAdmin = () => localStorage.getItem('is_admin') === 'true';
const getUsername= () => localStorage.getItem('username') || '';

function initials(name) {
    if (!name) return '?';
    return name.split(/[\s_\-]+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

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

    const av = initials(username);
    sidebarAvatar.textContent  = av;
    topbarAvatar.textContent   = av;
    sidebarUsername.textContent= username || 'User';
    topbarUsername.textContent = username || 'User';

    if (isAdmin) {
        adminNavItem.classList.remove('hidden');
        adminInfoCard.style.display = '';
    } else {
        adminNavItem.classList.add('hidden');
        adminInfoCard.style.display = 'none';
    }

    routeTo(location.hash.replace('#', '') || 'dashboard');
}

function showAuth() {
    appShell.classList.add('hidden');
    authScreen.classList.remove('hidden');
}

const PAGE_META = {
    dashboard: { title: 'Dashboard' },
    process:   { title: 'Process Data' },
    admin:     { title: 'User Management', adminOnly: true },
};

function routeTo(page) {
    const meta = PAGE_META[page];

    if (!meta || (meta.adminOnly && !getIsAdmin())) {
        page = 'dashboard';
    }

    history.replaceState(null, '', `#${page}`);
    pageTitle.textContent = PAGE_META[page].title;

    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });

    if (page === 'admin') fetchUsers();
    closeSidebar();
}

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

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('username');
    showAuth();
});

document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
        e.preventDefault();
        routeTo(el.dataset.page);
    });
});

window.addEventListener('hashchange', () => {
    if (getToken()) routeTo(location.hash.replace('#', '') || 'dashboard');
});

menuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
});

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

overlay.addEventListener('click', closeSidebar);

let currentFile = null;

excelFile.addEventListener('change', () => {
    const file = excelFile.files[0];
    if (file) handleFileUpload(file);
});

removeFileBtn.addEventListener('click', resetUploader);

function resetUploader() {
    excelFile.value = '';
    currentFile = null;
    filePreview.classList.add('hidden');
    dropzoneLabel.style.display = '';
    configSection.classList.add('hidden');
    
    theatreSearch.value = '';
    theatreSearch.classList.add('hidden');
    thirdPartyToggle.checked = false;
    monthSelect.innerHTML = '<option value="All">All Months</option>';
    
    clearUploadStatus();
}

function handleFileUpload(file) {
    currentFile = file;
    filePreviewName.textContent = file.name;
    filePreview.classList.remove('hidden');
    dropzoneLabel.style.display = 'none';
    clearUploadStatus();
    extractTheatres(file);
}

dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    
    if (file && /\.(xlsx|xls|xlsb)$/i.test(file.name)) {
        const dt = new DataTransfer();
        dt.items.add(file);
        excelFile.files = dt.files;
        handleFileUpload(file);
    } else {
        setUploadStatus('error', 'Please drop a valid Excel file (.xlsx, .xls, or .xlsb).');
    }
});

async function extractTheatres(file) {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    configSection.classList.remove('hidden');
    theatreList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.875rem; padding: 0.5rem;">Loading data...</p>`;
    btnExcel.disabled = true;
    btnZip.disabled = true;

    try {
        const res = await fetch(`${API_URL}/extract-theatres`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            const data = await res.json();
            populateTheatreList(data.theatres);
            populateMonthList(data.months);
            btnExcel.disabled = false;
            btnZip.disabled = false;
        } else {
            setUploadStatus('error', 'Failed to extract data from file.');
        }
    } catch {
        setUploadStatus('error', 'Network error. Could not connect to the server.');
    }
}

function populateMonthList(months) {
    monthSelect.innerHTML = '<option value="All">All Months</option>';
    if (months && months.length > 0) {
        months.forEach(m => {
            monthSelect.innerHTML += `<option value="${escHtml(m)}">${escHtml(m)}</option>`;
        });
    }
}

function populateTheatreList(theatres) {
    if (!theatres || theatres.length === 0) {
        theatreList.innerHTML = `<p style="color: var(--error-fg); font-size: 0.875rem; padding: 0.5rem;">No theatres found in this file.</p>`;
        theatreSearch.classList.add('hidden');
        return;
    }

    theatreSearch.classList.remove('hidden');
    theatreSearch.value = ''; 

    theatreList.innerHTML = theatres.map(t => `
        <label class="theatre-checkbox" data-name="${escHtml(t).toLowerCase()}">
            <input type="checkbox" value="${escHtml(t)}">
            <span>${escHtml(t)}</span>
        </label>
    `).join('');
}

theatreSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const labels = theatreList.querySelectorAll('.theatre-checkbox');
    
    labels.forEach(label => {
        const theatreName = label.getAttribute('data-name');
        if (theatreName.includes(query)) {
            label.style.display = 'flex'; 
        } else {
            label.style.display = 'none'; 
        }
    });
});

async function triggerDownload(res, defaultFilename) {
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    let filename = defaultFilename;
    const disposition = res.headers.get('Content-Disposition');
    if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
    }

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

btnExcel.addEventListener('click', async () => {
    if (!currentFile) return;

    const selectedCheckboxes = Array.from(theatreList.querySelectorAll('input:checked')).map(cb => cb.value);
    if (selectedCheckboxes.length === 0) {
        setUploadStatus('error', 'Please select at least one theatre for custom Excel.');
        return;
    }

    const token = getToken();
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('selected_theatres', JSON.stringify(selectedCheckboxes));
    formData.append('with_third_party', thirdPartyToggle.checked);
    formData.append('month', monthSelect.value);

    setLoadingState(btnExcel, excelBtnText, 'Processing...', true);
    setUploadStatus('info', '⚙️ Generating custom Excel file...');

    try {
        const res = await fetch(`${API_URL}/generate-custom-excel`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            await triggerDownload(res, 'selected_theatres_summary.xlsx');
            setUploadStatus('success', '✅ Excel downloaded successfully!');
        } else {
            const err = await res.json().catch(() => ({}));
            setUploadStatus('error', `❌ ${err.detail || 'Processing failed.'}`);
        }
    } catch {
        setUploadStatus('error', '❌ Network error. Check your connection.');
    } finally {
        setLoadingState(btnExcel, excelBtnText, 'Download Selected (Excel)', false);
    }
});

btnZip.addEventListener('click', async () => {
    if (!currentFile) return;

    const token = getToken();
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('with_third_party', thirdPartyToggle.checked);
    formData.append('month', monthSelect.value);

    setLoadingState(btnZip, zipBtnText, 'Zipping...', true);
    setUploadStatus('info', '⚙️ Processing all theatres into a ZIP archive...');

    try {
        const res = await fetch(`${API_URL}/generate-all-zip`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            await triggerDownload(res, 'all_theatres_summary.zip');
            setUploadStatus('success', '✅ ZIP archive downloaded successfully!');
        } else {
            const err = await res.json().catch(() => ({}));
            setUploadStatus('error', `❌ ${err.detail || 'Processing failed.'}`);
        }
    } catch {
        setUploadStatus('error', '❌ Network error. Check your connection.');
    } finally {
        setLoadingState(btnZip, zipBtnText, 'Download All (ZIP)', false);
    }
});

function setLoadingState(btnEl, textEl, loadText, isLoading) {
    btnEl.disabled = isLoading;
    textEl.textContent = loadText;
    
    if (btnEl === btnExcel) btnZip.disabled = isLoading;
    if (btnEl === btnZip) btnExcel.disabled = isLoading;
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

function escHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

const PING_INTERVAL = 30_000; 

function keepAlive() {
    fetch(`${API_URL}/ping`)
        .then(() => console.log(`[keepAlive] ping ok — ${new Date().toISOString()}`))
        .catch(err => console.warn(`[keepAlive] ping failed — ${err.message}`));
}

setInterval(keepAlive, PING_INTERVAL);
keepAlive(); 

boot();