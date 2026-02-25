/**
 * InnovatEPAM Portal – app.js v4 (Social SaaS)
 * Card Feed • Multi-Step Form • Timeline Modal • Social Profile
 */

// ─── State ─────────────────────────────────────────────────────────────────
const state = {
    token: localStorage.getItem('token'),
    user: null,
    submissionsChart: null,
    selectedTags: new Set(),
    currentStep: 1,
};

// ─── DOM helper ──────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── API ─────────────────────────────────────────────────────────────────────
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
    const t = $('toast');
    $('toast-icon').textContent = type === 'success' ? '✓' : '✗';
    $('toast-message').textContent = msg;
    t.className = `toast toast-${type}`;
    setTimeout(() => { t.className = 'toast hidden-toast'; }, 3500);
}

// ─── Theme ───────────────────────────────────────────────────────────────────
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
applyTheme(localStorage.getItem('theme') || 'light');
$('theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
});

// ─── Navbar ──────────────────────────────────────────────────────────────────
function avatarFor(user) {
    if (user?.avatar_url) return `<img src="${user.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.style.display='none';this.parentNode.textContent='${(user.email || '?')[0].toUpperCase()}'">`;
    return (user?.email || '?')[0].toUpperCase();
}

function showNavUser(user) {
    $('nav-user-info').classList.remove('hidden');
    $('nav-user-info').classList.add('flex');
    $('nav-tabs').classList.remove('hidden');
    $('nav-tabs').classList.add('flex');
    $('nav-email').textContent = user.email;
    $('nav-avatar').innerHTML = avatarFor(user);

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

// ─── View switching ──────────────────────────────────────────────────────────
function showView(view) {
    ['auth', 'submitter', 'admin', 'profile'].forEach(v => {
        const el = $(`${v}-view`);
        if (el) el.classList.add('hidden');
    });
    const t = $(`${view}-view`);
    if (t) t.classList.remove('hidden');
}

function activateTab(viewName) {
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.nav-tab[data-view="${viewName}"]`);
    if (btn) btn.classList.add('active');
    showView(viewName);
}

document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        activateTab(view);
        if (view === 'profile') { loadUserProfile(); }
        if (view === 'admin') { loadAllIdeas(); loadAdminStats(); }
        if (view === 'submitter') { loadMyIdeas(); }
    });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function init() {
    if (state.token) {
        try {
            const res = await apiFetch('/api/auth/me');
            if (res.ok) {
                state.user = await res.json();
                showNavUser(state.user);
                if (state.user.role === 'admin') {
                    activateTab('admin'); loadAllIdeas(); loadAdminStats();
                } else {
                    activateTab('submitter'); loadMyIdeas();
                }
                return;
            }
        } catch (e) { /* fall through */ }
    }
    state.token = null; localStorage.removeItem('token');
    showView('auth');
}

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
    } else { showToast((await res.json()).detail || 'Login failed', 'error'); }
});

$('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('reg-email').value, password: $('reg-password').value }) });
    if (res.ok) { showToast('Account created! Please sign in.'); isLoginMode = false; $('auth-toggle-btn').click(); }
    else { showToast((await res.json()).detail || 'Registration failed.', 'error'); }
});

$('logout-btn').addEventListener('click', () => {
    state.token = null; state.user = null;
    localStorage.removeItem('token'); hideNavUser(); showView('auth');
    if (state.submissionsChart) { state.submissionsChart.destroy(); state.submissionsChart = null; }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtDateTime(iso) {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_BADGE = {
    submitted: `<span class="badge badge-submitted">Submitted</span>`,
    accepted: `<span class="badge badge-accepted">Accepted</span>`,
    rejected: `<span class="badge badge-rejected">Rejected</span>`,
};

const TAG_COLORS = ['tag-cyan', 'tag-purple', 'tag-green', 'tag-amber', 'tag-pink'];
function tagColor(t) {
    let h = 0; for (let c of t) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
    return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
}

function renderTags(tags) {
    if (!tags) return '';
    return tags.split(',').map(t => t.trim()).filter(Boolean)
        .map(t => `<span class="tag-pill ${tagColor(t)}">${t}</span>`).join('');
}

function avatarDot(user, size = '2.25rem', fontSize = '0.875rem') {
    const label = (user?.email || '?')[0].toUpperCase();
    const accentColor = '#0891b2';
    if (user?.avatar_url) {
        return `<div class="avatar-ring" style="width:${size};height:${size};padding:0;overflow:hidden;"><img src="${user.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.insertAdjacentText('afterend','${label}')"></div>`;
    }
    return `<div class="avatar-ring" style="width:${size};height:${size};font-size:${fontSize};background:${accentColor}">${label}</div>`;
}

// ─── Idea Card Builder ────────────────────────────────────────────────────────
function renderIdeaCard(idea, isAdmin = false) {
    const author = idea.author || {};
    const namePart = author.email ? author.email.split('@')[0] : 'Unknown';
    const tagsHtml = renderTags(idea.tags);
    const badge = STATUS_BADGE[idea.status] || STATUS_BADGE.submitted;
    const reviewBtn = isAdmin
        ? `<button class="btn-ghost text-xs !px-3 !py-1.5 flex-shrink-0" onclick="event.stopPropagation();openReview(${JSON.stringify(idea).replace(/"/g, '&quot;')})">Review</button>`
        : '';

    const problemSnippet = idea.problem_statement
        ? `<p class="text-xs mt-1" style="color:var(--color-text-muted)">${idea.problem_statement.slice(0, 80)}${idea.problem_statement.length > 80 ? '…' : ''}</p>` : '';

    return `
    <div class="idea-card" onclick='openDetail(${JSON.stringify(idea).replace(/'/g, "&#39;")})'>
        <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
                ${avatarDot(author)}
                <div class="min-w-0">
                    <p class="text-xs font-semibold truncate">${namePart}</p>
                    <p class="text-xs" style="color:var(--color-text-muted)">${fmtDate(idea.created_at)}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
                ${badge}
                ${reviewBtn}
            </div>
        </div>
        <div>
            <h4 class="font-bold text-base leading-snug">${idea.title}</h4>
            ${problemSnippet}
            <p class="text-sm mt-1.5" style="color:var(--color-text-muted)">${idea.description.slice(0, 100)}${idea.description.length > 100 ? '…' : ''}</p>
        </div>
        ${tagsHtml ? `<div class="flex flex-wrap gap-1.5">${tagsHtml}</div>` : ''}
        <div class="flex items-center justify-between">
            <span class="text-xs px-2.5 py-1 rounded-full font-semibold" style="background:var(--color-border);color:var(--color-text-muted)">${idea.category}</span>
            <span class="text-xs" style="color:var(--color-text-muted)">Click to view →</span>
        </div>
    </div>`;
}

function renderFeed(ideas, containerId, isAdmin = false) {
    const el = $(containerId);
    if (!ideas.length) {
        el.innerHTML = `<div class="card p-10 text-center col-span-full" style="color:var(--color-text-muted)">${isAdmin ? 'No submissions yet.' : 'No ideas yet. Click "Submit New Idea" to get started.'}</div>`;
        return;
    }
    el.innerHTML = ideas.map(i => renderIdeaCard(i, isAdmin)).join('');
}

// ─── Submitter: My Ideas ──────────────────────────────────────────────────────
async function loadMyIdeas() {
    const res = await apiFetch('/api/ideas');
    if (!res.ok) return;
    renderFeed(await res.json(), 'idea-feed', false);
}

// ─── Admin: All Ideas ─────────────────────────────────────────────────────────
async function loadAllIdeas() {
    const res = await apiFetch('/api/admin/ideas');
    if (!res.ok) return;
    renderFeed(await res.json(), 'admin-feed', true);
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

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    if (state.submissionsChart) state.submissionsChart.destroy();
    state.submissionsChart = new Chart($('submissions-chart'), {
        type: 'bar',
        data: {
            labels: d.daily_submissions.length ? d.daily_submissions.map(x => x.date) : ['No data'],
            datasets: [{ label: 'Submissions', data: d.daily_submissions.length ? d.daily_submissions.map(x => x.count) : [0], backgroundColor: 'rgba(6,182,212,0.7)', borderColor: 'rgb(6,182,212)', borderWidth: 1.5, borderRadius: 5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1, font: { size: 11 } }, beginAtZero: true }
            }
        }
    });
}

// ─── Multi-Step Form ──────────────────────────────────────────────────────────
const STEPS = ['Details', 'Problem', 'Solution'];
function goToStep(n) {
    state.currentStep = n;
    [1, 2, 3].forEach(i => {
        const p = $(`step-${i}`);
        p.classList.toggle('active', i === n);
    });
    $('step-label').textContent = `Step ${n} of 3 — ${STEPS[n - 1]}`;
    $('step-frac').textContent = `${n}/3`;
    $('step-progress-fill').style.width = `${Math.round((n / 3) * 100)}%`;
}

// Tag chip clicks
document.querySelectorAll('.tag-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (state.selectedTags.has(tag)) { state.selectedTags.delete(tag); btn.classList.remove('selected'); }
        else { state.selectedTags.add(tag); btn.classList.add('selected'); }
        $('idea-tags-display').value = [...state.selectedTags].join(', ');
    });
});

$('step1-next').addEventListener('click', () => {
    if (!$('idea-title').value.trim() || !$('idea-category').value) {
        showToast('Please fill in Title and Category.', 'error'); return;
    }
    goToStep(2);
});
$('step2-back').addEventListener('click', () => goToStep(1));
$('step2-next').addEventListener('click', () => goToStep(3));
$('step3-back').addEventListener('click', () => goToStep(2));

// Open / Close
$('open-submit-form-btn').addEventListener('click', () => {
    goToStep(1); state.selectedTags.clear();
    document.querySelectorAll('.tag-chip-btn').forEach(b => b.classList.remove('selected'));
    $('submit-modal').classList.remove('hidden');
});
const closeSubmit = () => $('submit-modal').classList.add('hidden');
$('close-submit-modal').addEventListener('click', closeSubmit);
$('submit-modal').addEventListener('click', e => { if (e.target === $('submit-modal')) closeSubmit(); });

// Submit
$('submit-idea-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tagsVal = $('idea-tags-display').value.trim() || [...state.selectedTags].join(', ');
    const fd = new FormData();
    fd.append('title', $('idea-title').value);
    fd.append('category', $('idea-category').value);
    fd.append('description', $('idea-description').value);
    if (tagsVal) fd.append('tags', tagsVal);
    if ($('idea-problem').value.trim()) fd.append('problem_statement', $('idea-problem').value.trim());
    if ($('idea-solution').value.trim()) fd.append('solution', $('idea-solution').value.trim());
    const file = $('idea-attachment').files[0];
    if (file) fd.append('attachment', file);

    const res = await apiFetch('/api/ideas', { method: 'POST', body: fd });
    if (res.ok) {
        showToast('Idea submitted successfully!');
        closeSubmit();
        $('submit-idea-form').reset();
        loadMyIdeas();
    } else { showToast((await res.json()).detail || 'Submission failed.', 'error'); }
});

// ─── Timeline Detail Modal ────────────────────────────────────────────────────
function buildTimeline(idea) {
    const author = idea.author || {};
    const reviewer = idea.reviewer || null;
    const name = author.email ? author.email.split('@')[0] : 'User';
    const rvName = reviewer?.email?.split('@')[0] || 'Admin';

    const attachHtml = idea.file_path
        ? `<a href="/${idea.file_path}" target="_blank" class="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline mt-2">📎 Download attachment</a>`
        : '';

    const problemHtml = idea.problem_statement
        ? `<div class="mt-2 pt-2" style="border-top:1px solid var(--color-border)"><p class="text-xs font-semibold uppercase tracking-wider mb-1" style="color:var(--color-text-muted)">Problem</p><p class="text-sm">${idea.problem_statement}</p></div>` : '';

    const solutionHtml = idea.solution
        ? `<div class="mt-2 pt-2" style="border-top:1px solid var(--color-border)"><p class="text-xs font-semibold uppercase tracking-wider mb-1" style="color:var(--color-text-muted)">Solution</p><p class="text-sm">${idea.solution}</p></div>` : '';

    let html = `
    <div class="timeline-item">
        <div class="timeline-dot timeline-dot-submit">✍</div>
        <div class="timeline-body">
            <p class="timeline-meta"><strong>${name}</strong> submitted · ${fmtDateTime(idea.created_at)}</p>
            <div class="timeline-content">
                <p class="text-sm leading-relaxed whitespace-pre-wrap">${idea.description}</p>
                ${problemHtml}${solutionHtml}${attachHtml}
            </div>
        </div>
    </div>`;

    if (idea.status !== 'submitted' && reviewer) {
        const dotClass = idea.status === 'accepted' ? 'timeline-dot-accept' : 'timeline-dot-reject';
        const icon = idea.status === 'accepted' ? '✓' : '✗';
        html += `
        <div class="timeline-item">
            <div class="timeline-dot ${dotClass}">${icon}</div>
            <div class="timeline-body">
                <div class="flex items-center gap-2 mb-1">
                    ${avatarDot(reviewer, '1.5rem', '0.6rem')}
                    <p class="timeline-meta mb-0"><strong>${rvName}</strong> ${idea.status} this idea</p>
                </div>
                ${idea.admin_comment ? `<div class="timeline-content"><p class="text-sm italic">"${idea.admin_comment}"</p></div>` : ''}
            </div>
        </div>`;
    } else if (idea.status === 'submitted') {
        html += `
        <div class="timeline-item">
            <div class="timeline-dot timeline-dot-pending">⏳</div>
            <div class="timeline-body">
                <p class="timeline-meta">Awaiting review…</p>
            </div>
        </div>`;
    }
    return html;
}

function openDetail(idea) {
    $('detail-title').textContent = idea.title;
    $('detail-category').textContent = idea.category;
    $('detail-status-badge').innerHTML = STATUS_BADGE[idea.status] || STATUS_BADGE.submitted;
    $('detail-tags').innerHTML = renderTags(idea.tags);
    $('detail-timeline').innerHTML = buildTimeline(idea);
    $('detail-modal').classList.remove('hidden');
}
$('close-detail-modal').addEventListener('click', () => $('detail-modal').classList.add('hidden'));
$('close-detail-btn').addEventListener('click', () => $('detail-modal').classList.add('hidden'));
$('detail-modal').addEventListener('click', e => { if (e.target === $('detail-modal')) $('detail-modal').classList.add('hidden'); });

// ─── Admin Review Modal ───────────────────────────────────────────────────────
function openReview(idea) {
    $('review-title').textContent = idea.title;
    $('review-category').textContent = idea.category;
    $('review-status-badge').innerHTML = STATUS_BADGE[idea.status] || STATUS_BADGE.submitted;
    $('review-description').textContent = idea.description;
    $('review-idea-id').value = idea.id;
    $('review-comment').value = idea.admin_comment || '';

    const prob = $('review-problem-row'), sol = $('review-solution-row'), att = $('review-attach-row');
    if (idea.problem_statement) { prob.classList.remove('hidden'); $('review-problem').textContent = idea.problem_statement; } else prob.classList.add('hidden');
    if (idea.solution) { sol.classList.remove('hidden'); $('review-solution').textContent = idea.solution; } else sol.classList.add('hidden');
    if (idea.file_path) { att.classList.remove('hidden'); $('review-attach-link').href = `/${idea.file_path}`; } else att.classList.add('hidden');

    $('review-modal').classList.remove('hidden');
}
const closeReview = () => $('review-modal').classList.add('hidden');
$('close-review-modal').addEventListener('click', closeReview);
$('cancel-review-modal').addEventListener('click', closeReview);
$('review-modal').addEventListener('click', e => { if (e.target === $('review-modal')) closeReview(); });

async function submitReview(status) {
    const id = $('review-idea-id').value;
    const comment = $('review-comment').value.trim();
    if (!comment) { showToast('Please enter a comment.', 'error'); return; }
    const res = await apiFetch(`/api/admin/ideas/${id}/evaluate`, { method: 'PATCH', body: JSON.stringify({ status, admin_comment: comment }) });
    if (res.ok) {
        showToast(`Idea ${status} successfully.`);
        closeReview(); loadAllIdeas(); loadAdminStats();
    } else { showToast((await res.json()).detail || 'Evaluation failed.', 'error'); }
}
$('accept-btn').addEventListener('click', () => submitReview('accepted'));
$('reject-btn').addEventListener('click', () => submitReview('rejected'));

// ─── Profile View ─────────────────────────────────────────────────────────────
async function loadUserProfile() {
    if (!state.user) return;

    // Re-fetch fresh user data in case profile was just updated
    const meRes = await apiFetch('/api/auth/me');
    if (meRes.ok) { state.user = await meRes.json(); showNavUser(state.user); }

    const u = state.user;
    $('profile-email-display').textContent = u.email;
    $('profile-bio-display').textContent = u.bio || '';

    // Avatar preview
    const avEl = $('profile-avatar-preview');
    if (u.avatar_url) {
        avEl.innerHTML = `<img src="${u.avatar_url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`;
    } else {
        avEl.textContent = u.email[0].toUpperCase();
    }

    // Role badge
    const rb = $('profile-role-badge');
    if (u.role === 'admin') { rb.textContent = 'Admin'; rb.className = 'text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'; }
    else { rb.textContent = 'Submitter'; rb.className = 'text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'; }

    // Social links
    const sl = $('profile-social-links');
    sl.innerHTML = '';
    if (u.github_link) sl.innerHTML += `<a href="${u.github_link}" target="_blank" class="social-badge">⚙ GitHub</a>`;
    if (u.linkedin_link) sl.innerHTML += `<a href="${u.linkedin_link}" target="_blank" class="social-badge">💼 LinkedIn</a>`;

    // Pre-fill edit form
    $('ep-avatar').value = u.avatar_url || '';
    $('ep-bio').value = u.bio || '';
    $('ep-github').value = u.github_link || '';
    $('ep-linkedin').value = u.linkedin_link || '';

    // Stats
    const sRes = await apiFetch('/api/users/me/stats');
    if (sRes.ok) {
        const d = await sRes.json();
        $('stat-total').textContent = d.total;
        $('stat-accepted').textContent = d.accepted;
        $('stat-rejected').textContent = d.rejected;
        $('stat-pending').textContent = d.pending;
        $('stat-rate').textContent = `${d.success_rate}%`;
    }
}

// Edit profile form
$('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {};
    const av = $('ep-avatar').value.trim(); if (av) payload.avatar_url = av;
    const bio = $('ep-bio').value.trim(); if (bio) payload.bio = bio;
    const gh = $('ep-github').value.trim(); if (gh) payload.github_link = gh;
    const li = $('ep-linkedin').value.trim(); if (li) payload.linkedin_link = li;

    const res = await apiFetch('/api/users/me/profile', { method: 'PUT', body: JSON.stringify(payload) });
    if (res.ok) {
        state.user = await res.json();
        showNavUser(state.user);
        showToast('Profile updated!');
        loadUserProfile();
    } else { showToast((await res.json()).detail || 'Update failed.', 'error'); }
});

// Change password form
$('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = $('cp-current').value;
    const newPw = $('cp-new').value;
    const confirm = $('cp-confirm').value;
    if (newPw !== confirm) { showToast('New passwords do not match.', 'error'); return; }
    const res = await apiFetch('/api/users/me/password', { method: 'PUT', body: JSON.stringify({ current_password: current, new_password: newPw }) });
    if (res.ok) { showToast('Password updated successfully!'); $('change-password-form').reset(); }
    else { showToast((await res.json()).detail || 'Password change failed.', 'error'); }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
