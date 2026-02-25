/**
 * InnovatEPAM Portal – app.js (v2)
 * Handles Auth, Theme, View Routing, Ideas, Admin Review.
 */

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    token: localStorage.getItem('token'),
    user: null,
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── Theme ────────────────────────────────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    applyTheme(saved);
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
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
});

// ─── Navbar ───────────────────────────────────────────────────────────────────
function showNavUser(user) {
    $('nav-user-info').classList.remove('hidden');
    $('nav-user-info').classList.add('flex');
    $('nav-email').textContent = user.email;

    const badge = $('nav-role-badge');
    if (user.role === 'admin') {
        badge.textContent = 'Admin';
        badge.className = 'text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    } else {
        badge.textContent = 'Submitter';
        badge.className = 'text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300';
    }
}

function hideNavUser() {
    $('nav-user-info').classList.add('hidden');
    $('nav-user-info').classList.remove('flex');
}

// ─── Views ────────────────────────────────────────────────────────────────────
function showView(view) {
    ['auth-view', 'submitter-view', 'admin-view'].forEach(id => $$(id));
    showEl(view + '-view');
}

function showEl(id) { const el = $(id); if (el) el.classList.remove('hidden'); }
function $$(id) { const el = $(id); if (el) el.classList.add('hidden'); }

// ─── Auth ─────────────────────────────────────────────────────────────────────
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
                    loadAllIdeas();
                } else {
                    showView('submitter');
                    loadMyIdeas();
                }
                return;
            }
        } catch (_) { }
    }
    logout(false);
}

// Auth form toggle
let isLoginMode = true;
$('auth-toggle-btn').addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    $('login-form').classList.toggle('hidden', !isLoginMode);
    $('register-form').classList.toggle('hidden', isLoginMode);
    $('auth-heading').textContent = isLoginMode ? 'Sign In' : 'Create Account';
    $('auth-subheading').textContent = isLoginMode ? 'Access your innovation portal' : 'Join the EPAM innovation community';
    $('auth-toggle-btn').textContent = isLoginMode
        ? "Don't have an account? Register"
        : 'Already have an account? Sign in';
});

$('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new URLSearchParams();
    form.append('username', $('login-email').value.trim());
    form.append('password', $('login-password').value);

    const res = await fetch('/api/auth/login', { method: 'POST', body: form });
    const data = await res.json();
    if (res.ok) {
        state.token = data.access_token;
        localStorage.setItem('token', state.token);
        toast('Welcome back!', 'success');
        await init();
    } else {
        toast(data.detail || 'Login failed.', 'error');
    }
});

$('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: $('reg-email').value.trim(), password: $('reg-password').value }),
    });
    const data = await res.json();
    if (res.ok) {
        toast('Account created! Please sign in.', 'success');
        $('auth-toggle-btn').click();
    } else {
        toast(data.detail || 'Registration failed.', 'error');
    }
});

$('logout-btn').addEventListener('click', () => logout(true));

function logout(notify_user = true) {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    hideNavUser();
    showView('auth');
    if (notify_user) toast('Logged out.', 'info');
}

// ─── API helper ───────────────────────────────────────────────────────────────
function apiFetch(url, opts = {}) {
    return fetch(url, {
        ...opts,
        headers: {
            ...(opts.headers || {}),
            'Authorization': `Bearer ${state.token}`,
        },
    });
}

// ─── Submitter: Load my ideas ─────────────────────────────────────────────────
async function loadMyIdeas() {
    const res = await apiFetch('/api/ideas');
    if (!res.ok) { toast('Failed to load ideas.', 'error'); return; }
    const ideas = await res.json();
    renderMyIdeas(ideas);
}

function renderMyIdeas(ideas) {
    const tbody = $('my-ideas-tbody');
    const emptyRow = $('my-ideas-empty-row');

    // Remove old data rows
    tbody.querySelectorAll('tr.data-row').forEach(r => r.remove());

    if (!ideas.length) {
        emptyRow.classList.remove('hidden');
        return;
    }

    emptyRow.classList.add('hidden');
    ideas.forEach(idea => {
        const tr = document.createElement('tr');
        tr.className = 'data-row';
        tr.title = 'Click to view details';
        tr.innerHTML = `
            <td>
                <span class="font-semibold hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">${escapeHtml(idea.title)}</span>
            </td>
            <td>${escapeHtml(idea.category)}</td>
            <td>${formatDate(idea.created_at)}</td>
            <td>${statusBadge(idea.status)}</td>
        `;
        tr.addEventListener('click', () => openDetailModal(idea));
        tbody.appendChild(tr);
    });
}

// ─── Submitter: Submit new idea ───────────────────────────────────────────────
$('open-submit-form-btn').addEventListener('click', () => showModal('submit-modal'));
$('close-submit-modal').addEventListener('click', () => hideModal('submit-modal'));
$('cancel-submit-modal').addEventListener('click', () => hideModal('submit-modal'));

$('submit-idea-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', $('idea-title').value.trim());
    fd.append('category', $('idea-category').value);
    fd.append('description', $('idea-description').value.trim());
    const file = $('idea-attachment').files[0];
    if (file) fd.append('attachment', file);

    const res = await apiFetch('/api/ideas', { method: 'POST', body: fd });
    if (res.ok) {
        toast('Idea submitted successfully!', 'success');
        hideModal('submit-modal');
        $('submit-idea-form').reset();
        loadMyIdeas();
    } else {
        const d = await res.json().catch(() => ({}));
        toast(d.detail || 'Submission failed.', 'error');
    }
});

// ─── Detail Modal (Submitter view) ───────────────────────────────────────────
function openDetailModal(idea) {
    $('detail-title').textContent = idea.title;
    $('detail-category').textContent = idea.category;
    $('detail-description').textContent = idea.description;
    $('detail-status-badge').className = `badge ${statusBadgeClass(idea.status)}`;
    $('detail-status-badge').textContent = idea.status;

    // Attachment
    if (idea.file_path) {
        $('detail-attachment-row').classList.remove('hidden');
        $('detail-attachment-link').href = idea.file_path;
    } else {
        $('detail-attachment-row').classList.add('hidden');
    }

    // Admin comment
    if (idea.admin_comment) {
        $('detail-comment-row').classList.remove('hidden');
        $('detail-comment').textContent = idea.admin_comment;
    } else {
        $('detail-comment-row').classList.add('hidden');
    }

    showModal('detail-modal');
}

$('close-detail-modal').addEventListener('click', () => hideModal('detail-modal'));
$('close-detail-btn').addEventListener('click', () => hideModal('detail-modal'));

// ─── Admin: Load all ideas ────────────────────────────────────────────────────
async function loadAllIdeas() {
    const res = await apiFetch('/api/admin/ideas');
    if (!res.ok) { toast('Failed to load ideas.', 'error'); return; }
    const ideas = await res.json();
    renderAllIdeas(ideas);
    $('admin-total-count').textContent = ideas.length;
}

function renderAllIdeas(ideas) {
    const tbody = $('all-ideas-tbody');
    const emptyRow = $('all-ideas-empty-row');
    tbody.querySelectorAll('tr.data-row').forEach(r => r.remove());

    if (!ideas.length) {
        emptyRow.textContent = 'No ideas have been submitted yet.';
        emptyRow.classList.remove('hidden');
        return;
    }

    emptyRow.classList.add('hidden');
    ideas.forEach(idea => {
        const tr = document.createElement('tr');
        tr.className = 'data-row';
        tr.innerHTML = `
            <td>
                <div class="font-semibold">${escapeHtml(idea.title)}</div>
                <div class="text-xs mt-0.5" style="color: var(--color-text-muted)">${escapeHtml(idea.description).substring(0, 80)}…</div>
            </td>
            <td>${escapeHtml(idea.category)}</td>
            <td>${formatDate(idea.created_at)}</td>
            <td>${statusBadge(idea.status)}</td>
            <td class="text-right">
                <button class="btn-primary !text-xs !px-3 !py-1.5 review-btn">Review</button>
            </td>
        `;
        tr.querySelector('.review-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openReviewModal(idea);
        });
        tbody.appendChild(tr);
    });
}

// ─── Admin Review Modal ───────────────────────────────────────────────────────
function openReviewModal(idea) {
    $('review-idea-id').value = idea.id;
    $('review-title').textContent = idea.title;
    $('review-category').textContent = idea.category;
    $('review-description').textContent = idea.description;
    $('review-status-badge').className = `badge ${statusBadgeClass(idea.status)}`;
    $('review-status-badge').textContent = idea.status;
    $('review-comment').value = idea.admin_comment || '';

    if (idea.file_path) {
        $('review-attachment-row').classList.remove('hidden');
        $('review-attachment-link').href = idea.file_path;
    } else {
        $('review-attachment-row').classList.add('hidden');
    }

    showModal('review-modal');
}

$('close-review-modal').addEventListener('click', () => hideModal('review-modal'));
$('cancel-review-modal').addEventListener('click', () => hideModal('review-modal'));

// Accept button
$('accept-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    await submitEvaluation('accepted');
});

// Reject button
$('reject-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    await submitEvaluation('rejected');
});

async function submitEvaluation(status) {
    const id = $('review-idea-id').value;
    const admin_comment = $('review-comment').value.trim();

    if (!admin_comment) {
        toast('Please provide an admin comment before submitting.', 'error');
        $('review-comment').focus();
        return;
    }

    const res = await apiFetch(`/api/admin/ideas/${id}/evaluate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_comment }),
    });

    if (res.ok) {
        toast(`Idea ${status === 'accepted' ? 'accepted' : 'rejected'} successfully.`, 'success');
        hideModal('review-modal');
        loadAllIdeas();
    } else {
        toast('Failed to submit evaluation.', 'error');
    }
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
function showModal(id) {
    const el = $(id);
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Close on backdrop click
    el.addEventListener('click', (e) => {
        if (e.target === el) hideModal(id);
    }, { once: true });
}

function hideModal(id) {
    $(id).classList.add('hidden');
    document.body.style.overflow = '';
}

// ─── Status Badges ────────────────────────────────────────────────────────────
function statusBadgeClass(status) {
    const s = (status || '').toLowerCase();
    if (s === 'accepted') return 'badge-accepted';
    if (s === 'rejected') return 'badge-rejected';
    if (s === 'under-review' || s === 'under review') return 'badge-review';
    return 'badge-pending';
}

function statusBadge(status) {
    const cls = statusBadgeClass(status);
    return `<span class="badge ${cls}">${escapeHtml(status || 'Pending')}</span>`;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Toast Notification ───────────────────────────────────────────────────────
let toastTimer = null;
function toast(message, type = 'info') {
    const el = $('toast');
    const icon = $('toast-icon');
    const msg = $('toast-message');

    msg.textContent = message;
    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    const colors = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        info: 'text-cyan-600 dark:text-cyan-400',
    };
    icon.textContent = icons[type] || '';
    icon.className = `font-bold text-base ${colors[type] || ''}`;

    el.classList.remove('hidden-toast');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden-toast'), 4500);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
