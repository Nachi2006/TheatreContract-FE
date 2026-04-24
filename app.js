const API_URL = 'https://theatrecontract-be.onrender.com/';

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const adminSection = document.getElementById('admin-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const uploadForm = document.getElementById('upload-form');
const createUserForm = document.getElementById('create-user-form');
const refreshUsersBtn = document.getElementById('refresh-users-btn');

function checkAuth() {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('is_admin') === 'true';

    if (token) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        if (isAdmin) {
            adminSection.classList.remove('hidden');
            fetchUsers();
        } else {
            adminSection.classList.add('hidden');
        }
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
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
            errorEl.classList.add('block');
        }
    } catch (error) {
        errorEl.textContent = 'Unable to connect to the server.';
        errorEl.classList.remove('hidden');
        errorEl.classList.add('block');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('is_admin');
    checkAuth();
});

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('excel-file');
    const statusEl = document.getElementById('upload-status');
    const token = localStorage.getItem('token');

    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    statusEl.textContent = 'Processing data...';
    statusEl.className = 'text-sm mt-4 text-blue-600 block';

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
            link.download = 'all_theatres.zip';
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            statusEl.textContent = 'Processing complete. File downloaded.';
            statusEl.className = 'text-sm mt-4 text-green-600 block';
            fileInput.value = ''; 
        } else {
            const err = await response.json();
            statusEl.textContent = err.detail || 'Failed to process file.';
            statusEl.className = 'text-sm mt-4 text-red-600 block';
        }
    } catch (error) {
        statusEl.textContent = 'Upload interrupted due to network error.';
        statusEl.className = 'text-sm mt-4 text-red-600 block';
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
                const li = document.createElement('li');
                li.className = 'p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition';
                li.innerHTML = `
                    <span class="font-medium text-gray-800">${u.username}</span>
                    <span class="text-xs px-2 py-1 rounded-full border ${u.is_admin ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-600 border-gray-200'}">
                        ${u.is_admin ? 'Administrator' : 'Standard User'}
                    </span>
                `;
                listEl.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Data retrieval error.');
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
            statusEl.textContent = 'User successfully provisioned.';
            statusEl.className = 'text-sm mt-3 text-green-600 block';
            usernameEl.value = '';
            passwordEl.value = '';
            isAdminEl.checked = false;
            fetchUsers(); 
        } else {
            const err = await response.json();
            statusEl.textContent = err.detail || 'User provisioning failed.';
            statusEl.className = 'text-sm mt-3 text-red-600 block';
        }
    } catch (error) {
        statusEl.textContent = 'Network communication error.';
        statusEl.className = 'text-sm mt-3 text-red-600 block';
    }
});

checkAuth();