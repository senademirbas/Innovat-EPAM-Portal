/**
 * InnovatEPAM Portal – app.js (v3)
 * Handles Auth, Theme, Nav Tabs, Ideas, Admin Review, Profile & Analytics.
 */

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    token: localStorage.getItem('token'),
    user: null,
    submissionsChart: null, // Chart.js instance
};

// ─── DOM ref helper ──────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── API helper ──────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (state.token && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    return fetch(path, { ...options, headers });
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const toast = $('toast');
    $('toast-icon').textContent = type === 'success' ? '✓' : '✗';
    $('toast-message').textContent = msg;
    toast.className = `toast toast-${type}`;
    setTimeout(() => { toast.className = 'toast hidden-toast'; }, 3500);
}

// ─── Theme ───────────────────────────────────────────────────────────────────
function initTheme() {
    applyTheme(localStorage.getItem('theme') || 'light');
}
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        $('icon-sun').classList.remove('hidden');
        $('icon-moon').classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        $('icon-moon').classList.remove('hidden');
        $('icon-sun').classList.add('hidden');
    }
    localStorage.setItem('theme', theme);
}
$('theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
});

// ─── Navbar ──────────────────────────────────────────────────────────────────
function showNavUser(user) {
    $('nav-user-info').classList.remove('hidden');
    $('nav-user-info').classList.add('flex');
    $('nav-tabs').classList.remove('hidden');
    $('nav-tabs').classList.add('flex');
    $('nav-email').textContent = user.email;
    const badge = $('nav-role-badge');
    if (user.role === 'admin') {
        badge.textContent = 'Admin';
        badge.className = 'text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
        $('tab-admin').classList.remove('hidden');
        $('tab-ideas').classList.add('hidden');
    } else {
        badge.textContent = 'Submitter';
        badge.className = 'text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300';
        $('tab-admin').classList.add('hidden');
        $('tab-ideas').classList.remove('hidden');
    }
}
function hideNavUser() {
    $('nav-user-info').classList.add('hidden');
    $('nav-user-info').classList.remove('flex');
    $('nav-tabs').classList.add('hidden');
    $('nav-tabs').classList.remove('flex');
}

// ─── Nav Tab switching ────────────────────────────────────────────────────────
function activateTab(viewName) {
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.nav-tab[data-view="${viewName}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    showView(viewName);
}

document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        activateTab(view);
        if (view === 'profile') loadUserProfile();
        if (view === 'admin') { loadAllIdeas(); loadAdminStats(); }
        if (view === 'submitter') loadMyIdeas();
    });
});

// ─── View switching ──────────────────────────────────────────────────────────
function showView(view) {
    ['auth', 'submitter', 'admin', 'profile'].forEach(v => {
        const el = $(`${v}-view`);
        if (el) el.classList.add('hidden');
    });
    const target = $(`${view}-view`);
    if (target) target.classList.remove('hidden');
}

// ─── Auth flow ───────────────────────────────────────────────────────────────
async function init() {
    initTheme();
    if (state.token) {
        try {
            const res = await apiFetch('/api/auth/me');
            if (res.ok) {
                state.user = await res.json();
                showNavUser(state.user);
                if (state.user.role === 'admin') {
                    showView('admin');
                    activateTab('admin');
                    loadAllIdeas();
                    loadAdminStats();
                } else {
                    showView('submitter');
                    activateTab('submitter');
                    loadMyIdeas();
                }
                return;
            }
        } catch (e) { /* fall through */ }
    }
    state.token = null;
    localStorage.removeItem('token');
    showView('auth');
}

// Login / Register form toggle
let isLoginMode = true;
$('auth-toggle-btn').addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    $('login-form').classList.toggle('hidden', !isLoginMode);
    $('register-form').classList.toggle('hidden', isLoginMode);
    $('auth-heading').textContent = isLoginMode ? 'Sign In' : 'Create Account';
    $('auth-subheading').textContent = isLoginMode ? 'Access your innovation portal' : 'Join the InnovatEPAM community';
    $('auth-toggle-btn').textContent = isLoginMode ? "Don't have an account? Register" : 'Already have an account? Sign In';
});

$('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = new URLSearchParams({ username: $('login-email').value, password: $('login-password').value });
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (res.ok) {
        state.token = (await res.json()).access_token;
        localStorage.setItem('token', state.token);
        init();
    } else {
        showToast((await res.json()).detail || 'Login failed', 'error');
    }
});

$('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('reg-email').value, password: $('reg-password').value }) });
    if (res.ok) {
        showToast('Account created! Please sign in.');
        isLoginMode = false;
        $('auth-toggle-btn').click();
    } else {
        showToast((await res.json()).detail || 'Registration failed.', 'error');
    }
});

$('logout-btn').addEventListener('click', () => {
    state.token = null; state.user = null;
    localStorage.removeItem('token');
    hideNavUser();
    showView('auth');
    if (state.submissionsChart) { state.submissionsChart.destroy(); state.submissionsChart = null; }
});

// ─── Status badge helper ─────────────────────────────────────────────────────
function statusBadge(status) {
    const map = { submitted: 'badge-submitted', accepted: 'badge-accepted', rejected: 'badge-rejected' };
    return `<span class="badge ${map[status] || 'badge-submitted'}">${status}</span>`;
}

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Submitter: My Ideas ──────────────────────────────────────────────────────
async function loadMyIdeas() {
    const res = await apiFetch('/api/ideas');
    if (!res.ok) return;
    const ideas = await res.json();
    const tbody = $('my-ideas-tbody');
    if (!ideas.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-10" style="color:var(--color-text-muted)">No ideas yet. Click "Submit New Idea" to get started.</td></tr>`;
        return;
    }
    tbody.innerHTML = ideas.map(i => `
        <tr class="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" onclick="openDetail(${JSON.stringify(i).replace(/"/g, '&quot;')})">
            <td class="font-medium">${i.title}</td>
            <td><span class="text-xs px-2.5 py-1 rounded-full font-semibold" style="background:var(--color-border);color:var(--color-text-muted)">${i.category}</span></td>
            <td class="text-sm" style="color:var(--color-text-muted)">${fmtDate(i.created_at)}</td>
            <td>${statusBadge(i.status)}</td>
        </tr>`).join('');
}

// Submit idea form
$('open-submit-form-btn').addEventListener('click', () => $('submit-modal').classList.remove('hidden'));
$('close-submit-modal').addEventListener('click', () => $('submit-modal').classList.add('hidden'));
$('cancel-submit-modal').addEventListener('click', () => $('submit-modal').classList.add('hidden'));
$('submit-modal').addEventListener('click', (e) => { if (e.target === $('submit-modal')) $('submit-modal').classList.add('hidden'); });

$('submit-idea-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', $('idea-title').value);
    fd.append('category', $('idea-category').value);
    fd.append('description', $('idea-description').value);
    const file = $('idea-attachment').files[0];
    if (file) fd.append('file', file);
    const res = await apiFetch('/api/ideas', { method: 'POST', body: fd });
    if (res.ok) {
        showToast('Idea submitted successfully!');
        $('submit-modal').classList.add('hidden');
        $('submit-idea-form').reset();
        loadMyIdeas();
    } else {
        showToast((await res.json()).detail || 'Submission failed.', 'error');
    }
});

// ─── Idea Detail Modal (Submitter) ─────────────────────────────────────────
function openDetail(idea) {
    $('detail-title').textContent = idea.title;
    $('detail-category').textContent = idea.category;
    $('detail-status-badge').outerHTML = `<span id="detail-status-badge" class="badge">${statusBadge(idea.status)}</span>`;
    $('detail-description').textContent = idea.description;
    const attachRow = $('detail-attachment-row');
    if (idea.file_path) {
        attachRow.classList.remove('hidden');
        $('detail-attachment-link').href = `/${idea.file_path}`;
    } else { attachRow.classList.add('hidden'); }
    const commentRow = $('detail-comment-row');
    if (idea.admin_comment) {
        commentRow.classList.remove('hidden');
        $('detail-comment').textContent = idea.admin_comment;
    } else { commentRow.classList.add('hidden'); }
    $('detail-modal').classList.remove('hidden');
}
$('close-detail-modal').addEventListener('click', () => $('detail-modal').classList.add('hidden'));
$('close-detail-btn').addEventListener('click', () => $('detail-modal').classList.add('hidden'));
$('detail-modal').addEventListener('click', (e) => { if (e.target === $('detail-modal')) $('detail-modal').classList.add('hidden'); });

// ─── Admin: All Ideas ─────────────────────────────────────────────────────────
async function loadAllIdeas() {
    const res = await apiFetch('/api/admin/ideas');
    if (!res.ok) return;
    const ideas = await res.json();
    const tbody = $('all-ideas-tbody');
    if (!ideas.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10" style="color:var(--color-text-muted)">No submissions yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = ideas.map(i => `
        <tr>
            <td class="font-medium">${i.title}</td>
            <td><span class="text-xs px-2.5 py-1 rounded-full font-semibold" style="background:var(--color-border);color:var(--color-text-muted)">${i.category}</span></td>
            <td class="text-sm" style="color:var(--color-text-muted)">${fmtDate(i.created_at)}</td>
            <td>${statusBadge(i.status)}</td>
            <td class="text-right">
                <button onclick="openReview(${JSON.stringify(i).replace(/"/g, '&quot;')})" class="btn-ghost text-xs !px-3 !py-1.5">Review</button>
            </td>
        </tr>`).join('');
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────
async function loadAdminStats() {
    const res = await apiFetch('/api/admin/stats');
    if (!res.ok) return;
    const d = await res.json();
    $('kpi-total').textContent = d.total;
    $('kpi-accepted').textContent = d.accepted;
    $('kpi-rejected').textContent = d.rejected;
    $('kpi-rate').textContent = `${d.acceptance_rate}%`;

    const labels = d.daily_submissions.map(x => x.date);
    const counts = d.daily_submissions.map(x => x.count);

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    if (state.submissionsChart) state.submissionsChart.destroy();

    state.submissionsChart = new Chart($('submissions-chart'), {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No data'],
            datasets: [{
                label: 'Submissions',
                data: counts.length ? counts : [0],
                backgroundColor: 'rgba(6, 182, 212, 0.7)',
                borderColor: 'rgb(6, 182, 212)',
                borderWidth: 1.5,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1, font: { size: 11 } }, beginAtZero: true }
            }
        }
    });
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function openReview(idea) {
    $('review-title').textContent = idea.title;
    $('review-category').textContent = idea.category;
    $('review-description').textContent = idea.description;
    $('review-idea-id').value = idea.id;
    $('review-comment').value = idea.admin_comment || '';
    const attachRow = $('review-attachment-row');
    if (idea.file_path) {
        attachRow.classList.remove('hidden');
        $('review-attachment-link').href = `/${idea.file_path}`;
    } else { attachRow.classList.add('hidden'); }
    $('review-modal').classList.remove('hidden');
}
$('close-review-modal').addEventListener('click', () => $('review-modal').classList.add('hidden'));
$('cancel-review-modal').addEventListener('click', () => $('review-modal').classList.add('hidden'));
$('review-modal').addEventListener('click', (e) => { if (e.target === $('review-modal')) $('review-modal').classList.add('hidden'); });

async function submitReview(status) {
    const id = $('review-idea-id').value;
    const comment = $('review-comment').value.trim();
    if (!comment) { showToast('Please enter a comment before submitting.', 'error'); return; }
    const res = await apiFetch(`/api/admin/ideas/${id}/evaluate`, { method: 'PATCH', body: JSON.stringify({ status, admin_comment: comment }) });
    if (res.ok) {
        showToast(`Idea ${status} successfully.`);
        $('review-modal').classList.add('hidden');
        loadAllIdeas();
        loadAdminStats();
    } else {
        showToast((await res.json()).detail || 'Evaluation failed.', 'error');
    }
}
$('accept-btn').addEventListener('click', () => submitReview('accepted'));
$('reject-btn').addEventListener('click', () => submitReview('rejected'));

// ─── Profile View ─────────────────────────────────────────────────────────────
async function loadUserProfile() {
    if (!state.user) return;

    // Identity card
    $('profile-email').textContent = state.user.email;
    $('profile-avatar').textContent = state.user.email[0].toUpperCase();
    const roleBadge = $('profile-role-badge');
    if (state.user.role === 'admin') {
        roleBadge.textContent = 'Admin';
        roleBadge.className = 'text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    } else {
        roleBadge.textContent = 'Submitter';
        roleBadge.className = 'text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300';
    }

    // Stats
    const res = await apiFetch('/api/users/me/stats');
    if (res.ok) {
        const d = await res.json();
        $('stat-total').textContent = d.total;
        $('stat-accepted').textContent = d.accepted;
        $('stat-rejected').textContent = d.rejected;
        $('stat-pending').textContent = d.pending;
        $('stat-rate').textContent = `${d.success_rate}%`;
    }
}

// ─── Change Password ──────────────────────────────────────────────────────────
$('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = $('cp-current').value;
    const newPw = $('cp-new').value;
    const confirm = $('cp-confirm').value;

    if (newPw !== confirm) {
        showToast('New passwords do not match.', 'error');
        return;
    }
    const res = await apiFetch('/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: current, new_password: newPw }),
    });
    if (res.ok) {
        showToast('Password updated successfully!');
        $('change-password-form').reset();
    } else {
        showToast((await res.json()).detail || 'Password change failed.', 'error');
    }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
