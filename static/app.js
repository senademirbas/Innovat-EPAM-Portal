// State Management
const state = {
    token: localStorage.getItem('token'),
    user: null,
    view: 'auth', // 'auth', 'submitter', 'admin'
};

// DOM Elements
const elements = {
    authView: document.getElementById('auth-view'),
    submitterView: document.getElementById('submitter-view'),
    adminView: document.getElementById('admin-view'),
    navUser: document.getElementById('nav-user'),
    userDisplay: document.getElementById('user-display'),
    roleBadge: document.getElementById('role-badge'),
    logoutBtn: document.getElementById('logout-btn'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    toRegister: document.getElementById('to-register'),
    toLogin: document.getElementById('to-login'),
    ideaForm: document.getElementById('idea-form'),
    showIdeaFormBtn: document.getElementById('show-idea-form'),
    ideaFormContainer: document.getElementById('idea-form-container'),
    cancelIdeaBtn: document.getElementById('cancel-idea'),
    myIdeasList: document.getElementById('my-ideas-list'),
    adminIdeasList: document.getElementById('admin-ideas-list'),
    evalModal: document.getElementById('eval-modal'),
    evalForm: document.getElementById('eval-form'),
    closeEvalBtn: document.getElementById('close-eval'),
    notification: document.getElementById('notification'),
    notificationMsg: document.getElementById('notification-msg')
};

// --- Initialization ---
async function init() {
    if (state.token) {
        await fetchUser();
    } else {
        showView('auth');
    }
}

// --- View Switching ---
function showView(view) {
    state.view = view;
    Object.values(elements).forEach(el => {
        if (el && el.id && el.id.endsWith('-view')) {
            el.classList.add('hidden');
        }
    });

    if (view === 'auth') {
        elements.authView.classList.remove('hidden');
        elements.navUser.classList.add('hidden');
    } else if (view === 'submitter') {
        elements.submitterView.classList.remove('hidden');
        elements.navUser.classList.remove('hidden');
        fetchMyIdeas();
    } else if (view === 'admin') {
        elements.adminView.classList.remove('hidden');
        elements.navUser.classList.remove('hidden');
        fetchAllIdeas();
    }
}

// --- Authentication ---
async function fetchUser() {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });

        if (res.ok) {
            state.user = await res.json();
            elements.userDisplay.textContent = state.user.full_name;
            elements.roleBadge.textContent = state.user.role.toUpperCase();
            elements.roleBadge.className = `px-2 py-0.5 rounded text-xs font-semibold ${state.user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`;
            showView(state.user.role === 'admin' ? 'admin' : 'submitter');
        } else {
            logout();
        }
    } catch (err) {
        console.error(err);
        logout();
    }
}

async function login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI OAuth2 uses 'username' field
    formData.append('password', password);

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            state.token = data.access_token;
            localStorage.setItem('token', state.token);
            notify('Login successful!', 'success');
            await fetchUser();
        } else {
            notify(data.detail || 'Login failed', 'error');
        }
    } catch (err) {
        notify('Connection error', 'error');
    }
}

async function register(name, email, password) {
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: name, email, password })
        });

        if (res.ok) {
            notify('Registration successful! Please login.', 'success');
            elements.registerForm.classList.add('hidden');
            elements.loginForm.classList.remove('hidden');
        } else {
            const data = await res.json();
            notify(data.detail || 'Registration failed', 'error');
        }
    } catch (err) {
        notify('Connection error', 'error');
    }
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    showView('auth');
}

// --- Idea Management ---
async function fetchMyIdeas() {
    try {
        const res = await fetch('/api/ideas', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const ideas = await res.json();
        renderMyIdeas(ideas);
    } catch (err) {
        notify('Failed to load ideas', 'error');
    }
}

async function fetchAllIdeas() {
    try {
        const res = await fetch('/api/admin/ideas', {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const ideas = await res.json();
        renderAdminIdeas(ideas);
    } catch (err) {
        notify('Failed to load all ideas', 'error');
    }
}

async function submitIdea(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('idea-title').value);
    formData.append('category', document.getElementById('idea-category').value);
    formData.append('description', document.getElementById('idea-description').value);

    const file = document.getElementById('idea-attachment').files[0];
    if (file) {
        formData.append('attachment', file);
    }

    try {
        const res = await fetch('/api/ideas', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` },
            body: formData
        });

        if (res.ok) {
            notify('Idea submitted successfully!', 'success');
            elements.ideaForm.reset();
            elements.ideaFormContainer.classList.add('hidden');
            fetchMyIdeas();
        } else {
            const text = await res.text();
            console.error('Submission failed:', res.status, text);
            try {
                const data = JSON.parse(text);
                notify(data.detail || 'Submission failed', 'error');
            } catch (e) {
                notify(`Error ${res.status}: ${text.substring(0, 50)}...`, 'error');
            }
        }
    } catch (err) {
        console.error('Fetch error:', err);
        notify('Connection error: ' + err.message, 'error');
    }
}

async function evaluateIdea(event) {
    event.preventDefault();
    const ideaId = document.getElementById('eval-idea-id').value;
    const status = document.getElementById('eval-status').value;
    const comment = document.getElementById('eval-comment').value;

    try {
        const res = await fetch(`/api/admin/ideas/${ideaId}/evaluate`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, admin_comment: comment })
        });

        if (res.ok) {
            notify('Idea updated!', 'success');
            elements.evalModal.classList.add('hidden');
            fetchAllIdeas();
        } else {
            const data = await res.json();
            notify(data.detail || 'Update failed', 'error');
        }
    } catch (err) {
        notify('Connection error', 'error');
    }
}

// --- Rendering ---
function renderMyIdeas(ideas) {
    if (ideas.length === 0) {
        elements.myIdeasList.innerHTML = '<p class="text-gray-500 italic">No ideas submitted yet.</p>';
        return;
    }

    elements.myIdeasList.innerHTML = ideas.map(idea => `
        <div class="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-lg">${idea.title}</h3>
                <span class="px-2 py-1 rounded text-xs font-semibold ${getStatusClass(idea.status)}">
                    ${idea.status}
                </span>
            </div>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${idea.description}</p>
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span>Category: ${idea.category}</span>
                <span>${new Date(idea.created_at).toLocaleDateString()}</span>
            </div>
            ${idea.admin_comment ? `
                <div class="mt-4 p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                    <p class="text-xs font-bold text-gray-700">Admin Comment:</p>
                    <p class="text-xs italic text-gray-600">${idea.admin_comment}</p>
                </div>
            ` : ''}
            ${idea.file_path ? `
                <div class="mt-3">
                    <a href="${idea.file_path}" target="_blank" class="text-blue-600 hover:underline text-xs font-medium">View Attachment</a>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderAdminIdeas(ideas) {
    if (ideas.length === 0) {
        elements.adminIdeasList.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-gray-500">No ideas available.</td></tr>';
        return;
    }

    elements.adminIdeasList.innerHTML = ideas.map(idea => `
        <tr>
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div class="font-medium text-gray-900">${idea.title}</div>
                <div class="text-gray-500 truncate max-w-xs">${idea.description}</div>
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${idea.category}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm">
                <span class="px-2 py-1 rounded text-xs font-semibold ${getStatusClass(idea.status)}">
                    ${idea.status}
                </span>
            </td>
            <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button onclick="openEvalModal('${idea.id}', '${idea.status}', '${idea.admin_comment || ''}')" class="text-blue-600 hover:text-blue-900">Evaluate</button>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch (status) {
        case 'Under Review': return 'bg-blue-100 text-blue-800';
        case 'Accepted': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function openEvalModal(id, status, comment) {
    document.getElementById('eval-idea-id').value = id;
    document.getElementById('eval-status').value = status;
    document.getElementById('eval-comment').value = comment;
    elements.evalModal.classList.remove('hidden');
}

// --- Utils ---
function notify(msg, type = 'info') {
    elements.notificationMsg.textContent = msg;
    elements.notification.className = `fixed bottom-4 right-4 max-w-sm w-full bg-white border rounded-lg shadow-lg transform translate-y-0 transition-transform duration-300 z-50 p-4 border-l-4 ${type === 'error' ? 'border-red-500' : 'border-green-500'
        }`;

    setTimeout(() => {
        elements.notification.classList.add('translate-y-24');
    }, 3000);
}

// --- Event Listeners ---
elements.toRegister.onclick = (e) => {
    e.preventDefault();
    elements.loginForm.classList.add('hidden');
    elements.registerForm.classList.remove('hidden');
};

elements.toLogin.onclick = (e) => {
    e.preventDefault();
    elements.registerForm.classList.add('hidden');
    elements.loginForm.classList.remove('hidden');
};

elements.loginForm.onsubmit = (e) => {
    e.preventDefault();
    login(document.getElementById('login-email').value, document.getElementById('login-password').value);
};

elements.registerForm.onsubmit = (e) => {
    e.preventDefault();
    register(document.getElementById('reg-name').value, document.getElementById('reg-email').value, document.getElementById('reg-password').value);
};

elements.logoutBtn.onclick = logout;

elements.showIdeaFormBtn.onclick = () => {
    elements.ideaFormContainer.classList.toggle('hidden');
};

elements.cancelIdeaBtn.onclick = () => {
    elements.ideaFormContainer.classList.add('hidden');
};

elements.ideaForm.onsubmit = submitIdea;
elements.evalForm.onsubmit = evaluateIdea;
elements.closeEvalBtn.onclick = () => elements.evalModal.classList.add('hidden');

// Start
init();
