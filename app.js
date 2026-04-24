const API_URL = 'https://theatrecontract-be.onrender.com';

// State Management
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const adminSection = document.getElementById('admin-section');
const adminNavLink = document.getElementById('admin-nav-link');

// Forms & Btns
const loginForm = document.getElementById('login-form');
const logoutBtnDesktop = document.getElementById('logout-btn-desktop');
const logoutBtnMobile = document.getElementById('logout-btn-mobile');
const uploadForm = document.getElementById('upload-form');
const createUserForm = document.getElementById('create-user-form');
const refreshUsersBtn = document.getElementById('refresh-users-btn');

function checkAuth() {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('is_admin') === 'true';

    if (token) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        dashboardSection.classList.add('flex');
        
        if (isAdmin) {
            adminSection.classList.remove('hidden');
            adminNavLink.classList.remove('hidden');
            fetchUsers();
        } else {
            adminSection.classList.add('hidden');
            adminNavLink.classList.add('hidden');
        }
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        dashboardSection.classList.remove('flex');
    }
    lucide.createIcons(); // Re-render icons for dynamic elements
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');
    const errorEl = document.getElementById('login-error');

    const formData = new URLSearchParams();
    formData.append('username', usernameEl.value);
    formData.append('password', passwordEl.value);

    try {
        const response = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('is_admin', data.is_admin);
            usernameEl.value = '';
            passwordEl.value = '';
            errorEl.classList.add('hidden');
            checkAuth();
        } else {
            const err = await response.json();
            errorEl.textContent = err.detail || 'Authentication failed.';
            errorEl.classList.remove('hidden');
        }
    } catch (error) {
        errorEl.textContent = 'Connection error.';
        errorEl.classList.remove('hidden');
    }
});

const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    checkAuth();
};

logoutBtnDesktop.addEventListener('click', handleLogout);
logoutBtnMobile.addEventListener('click', handleLogout);

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('excel-file');
    const statusEl = document.getElementById('upload-status');
    const token = localStorage.getItem('token');

    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    statusEl.textContent = '⚙️ Processing data...';
    statusEl.className = 'mt-4 p-3 rounded-lg text-sm bg-blue-50 text-blue-700 block animate-pulse';

    try {
        const response = await fetch(`${API_URL}/process-zip`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'theatre_package.zip';
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            statusEl.textContent = '✅ Success! Your download has started.';
            statusEl.className = 'mt-4 p-3 rounded-lg text-sm bg-green-50 text-green-700 block';
            fileInput.value = ''; 
        } else {
            const err = await response.json();
            statusEl.textContent = `❌ Error: ${err.detail || 'Failed to process'}`;
            statusEl.className = 'mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 block';
        }
    } catch (error) {
        statusEl.textContent = '❌ Network error during upload.';
        statusEl.className = 'mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 block';
    }
});

async function fetchUsers() {
    const token = localStorage.getItem('token');
    const listEl = document.getElementById('users-list');
    
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const users = await response.json();
            listEl.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="py-4">
                        <div class="font-medium text-slate-800">${u.username}</div>
                    </td>
                    <td class="py-4 text-right">
                        <span class="text-[10px] font-bold px-2 py-1 rounded-full border ${u.is_admin ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-500 border-slate-200'}">
                            ${u.is_admin ? 'ADMIN' : 'STAFF'}
                        </span>
                    </td>
                `;
                listEl.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('User fetch failed');
    }
}

refreshUsersBtn.addEventListener('click', fetchUsers);

createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameEl = document.getElementById('new-username');
    const passwordEl = document.getElementById('new-password');
    const isAdminEl = document.getElementById('new-is-admin');
    const statusEl = document.getElementById('create-user-status');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: usernameEl.value,
                password: passwordEl.value,
                is_admin: isAdminEl.checked
            })
        });

        if (response.ok) {
            statusEl.textContent = 'User created successfully';
            statusEl.className = 'text-xs text-green-600 block';
            usernameEl.value = '';
            passwordEl.value = '';
            isAdminEl.checked = false;
            fetchUsers(); 
        } else {
            const err = await response.json();
            statusEl.textContent = err.detail || 'Creation failed';
            statusEl.className = 'text-xs text-red-600 block';
        }
    } catch (error) {
        statusEl.textContent = 'Server error';
        statusEl.className = 'text-xs text-red-600 block';
    }
});

// Initial boot
checkAuth();