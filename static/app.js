/**
 * InnovatEPAM — app.js v5 (Premium SaaS)
 * Sidebar ▸ Drawers ▸ Skeleton Loaders ▸ Spline Chart ▸ Social Profile
 */

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    token: localStorage.getItem('token'),
    user: null,
    allIdeas: [],          // cached for client-side filter
    adminIdeas: [],
    activeFilter: 'all',
    chart: null,
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    selectedTags: new Set(),
    currentStep: 1,
};

// ─── DOM shortcut ─────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Password Toggle ──────────────────────────────────────────────────────────
function togglePw(inputId, btn) {
    const input = $(inputId);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.querySelector('.eye-open').style.display = isHidden ? 'none' : '';
    btn.querySelector('.eye-shut').style.display = isHidden ? '' : 'none';
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (state.token && !(opts.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const res = await fetch(path, { ...opts, headers });
    return res;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
    document.body.classList.toggle('light', theme !== 'dark');
    $('icon-sun').classList.toggle('hidden', theme !== 'dark');
    $('icon-moon').classList.toggle('hidden', theme === 'dark');
    localStorage.setItem('theme', theme);
}
applyTheme(localStorage.getItem('theme') || 'dark');

$('theme-toggle').addEventListener('click', () => {
    const isDark = !document.body.classList.contains('light');
    applyTheme(isDark ? 'light' : 'dark');
    if (state.chart) rebuildChart();
});

// ─── Toast ────────────────────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = 'success') {
    const el = $('toast');
    clearTimeout(_toastTimer);
    $('toast-icon').textContent = type === 'success' ? '✓' : '✗';
    $('toast-message').textContent = msg;
    el.className = `toast toast-${type}`;
    _toastTimer = setTimeout(() => { el.className = 'toast toast-hidden'; }, 3500);
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────
function showSkeletons(containerId, n = 6) {
    const heights = [120, 160, 100, 180, 140, 120];
    $(containerId).innerHTML = Array.from({ length: n }, (_, i) => `
        <div class="skeleton-card">
            <div style="display:flex;align-items:center;gap:0.625rem;margin-bottom:0.5rem">
                <div class="skeleton" style="width:2.25rem;height:2.25rem;border-radius:50%;flex-shrink:0"></div>
                <div style="flex:1">
                    <div class="skeleton" style="height:0.75rem;width:60%;margin-bottom:0.375rem"></div>
                    <div class="skeleton" style="height:0.625rem;width:40%"></div>
                </div>
            </div>
            <div class="skeleton" style="height:1rem;width:80%;margin-bottom:0.375rem"></div>
            <div class="skeleton" style="height:${heights[i % heights.length]}px;width:100%"></div>
        </div>`
    ).join('');
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function toggleSidebar() {
    const sidebar = $('sidebar');
    const shell = $('app-shell');
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        sidebar.classList.toggle('mobile-open');
        $('sidebar-overlay').classList.toggle('visible', sidebar.classList.contains('mobile-open'));
    } else {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
        shell.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
        localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
    }
}
function closeSidebar() {
    $('sidebar').classList.remove('mobile-open');
    $('sidebar-overlay').classList.remove('visible');
}
// Apply saved collapse state
if (state.sidebarCollapsed && window.innerWidth > 768) {
    $('sidebar').classList.add('collapsed');
    $('app-shell').classList.add('sidebar-collapsed');
}

// ─── Avatar dropdown ─────────────────────────────────────────────────────────
function toggleAvatarDropdown() {
    $('avatar-dropdown').classList.toggle('hidden');
}
function closeDropdown() {
    $('avatar-dropdown').classList.add('hidden');
}
document.addEventListener('click', e => {
    if (!e.target.closest('#avatar-dropdown-btn') && !$('avatar-dropdown').classList.contains('hidden')) {
        closeDropdown();
    }
});

// ─── View Router ──────────────────────────────────────────────────────────────
function routeTo(view) {
    ['feed', 'admin', 'profile', 'workspace', 'users'].forEach(v => {
        const el = $(`${v}-view`);
        if (el) el.classList.add('hidden');
    });
    const target = $(`${view}-view`);
    if (target) target.classList.remove('hidden');

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navMap = { feed: 'nav-ideas', admin: 'nav-admin', profile: 'nav-profile', workspace: 'nav-workspace', users: 'nav-users' };
    const activeNav = $(navMap[view]);
    if (activeNav) activeNav.classList.add('active');

    // Close mobile sidebar on navigation
    closeSidebar();

    // Load data for view
    if (view === 'feed') loadMyIdeas();
    if (view === 'admin') { loadAllIdeas(); loadAdminStats(); }
    if (view === 'profile') loadProfile();
    if (view === 'workspace') loadWorkspace();
    if (view === 'users') loadUsersView();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(iso) {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_BADGE = {
    submitted: '<span class="badge badge-submitted">Pending</span>',
    accepted: '<span class="badge badge-accepted">Accepted</span>',
    rejected: '<span class="badge badge-rejected">Rejected</span>',
};

const TAG_COLORS = ['tag-cyan', 'tag-purple', 'tag-green', 'tag-amber', 'tag-pink'];
function tagColor(t) {
    let h = 0;
    for (const c of t) h = ((h * 31) + c.charCodeAt(0)) | 0;
    return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
}
function renderTagPills(tags) {
    if (!tags) return '';
    return tags.split(',').map(t => t.trim()).filter(Boolean)
        .map(t => `<span class="tag-pill ${tagColor(t)}">${t}</span>`).join('');
}

function avatarHtml(user, cls = 'avatar') {
    const letter = (user?.email || '?')[0].toUpperCase();
    if (user?.avatar_url) {
        return `<div class="${cls}"><img src="${user.avatar_url}" alt="" onerror="this.parentElement.textContent='${letter}'"></div>`;
    }
    return `<div class="${cls}">${letter}</div>`;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function populateUserUI(user) {
    state.user = user;
    const letter = user.email[0].toUpperCase();

    // Sidebar avatar + info
    $('sidebar-avatar').textContent = letter;
    if (user.avatar_url) {
        $('sidebar-avatar').innerHTML = `<img src="${user.avatar_url}" alt="" onerror="this.parentElement.textContent='${letter}'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }
    $('sidebar-user-email').textContent = user.email.split('@')[0];
    $('sidebar-user-role').textContent = user.role === 'admin' ? '⚡ Admin' : '💡 Submitter';

    // Topbar
    $('topbar-avatar').textContent = letter;
    if (user.avatar_url) {
        $('topbar-avatar').innerHTML = `<img src="${user.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }
    $('topbar-email').textContent = user.email;

    // Dropdown
    $('dd-email').textContent = user.email;
    $('dd-role').textContent = user.role === 'admin' ? 'Administrator' : 'Submitter';

    // Sidebar nav visibility
    if (user.role === 'admin') {
        $('nav-admin').classList.remove('hidden');
        $('nav-ideas').classList.add('hidden');
        const nu = $('nav-users');
        if (nu) nu.classList.remove('hidden');
    } else {
        $('nav-ideas').classList.remove('hidden');
        $('nav-admin').classList.add('hidden');
        const nu = $('nav-users');
        if (nu) nu.classList.add('hidden');
    }
}

async function init() {
    if (state.token) {
        try {
            const res = await apiFetch('/api/auth/me');
            if (res.ok) {
                const user = await res.json();
                populateUserUI(user);
                $('auth-view').classList.add('hidden');
                $('app-shell').classList.remove('hidden');
                routeTo(user.role === 'admin' ? 'admin' : 'feed');
                return;
            }
        } catch (_) { /* fall through */ }
    }
    state.token = null;
    localStorage.removeItem('token');
    $('auth-view').classList.remove('hidden');
    $('app-shell').classList.add('hidden');
}

// Login
$('login-form').addEventListener('submit', async e => {
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

// Register
$('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: $('reg-email').value, password: $('reg-password').value })
    });
    if (res.ok) {
        showToast('Account created! Please sign in.');
        $('auth-toggle-btn').click();
    } else {
        showToast((await res.json()).detail || 'Registration failed.', 'error');
    }
});

// Toggle form
let isLoginMode = true;
$('auth-toggle-btn').addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    $('login-form').style.display = isLoginMode ? 'flex' : 'none';
    $('register-form').style.display = isLoginMode ? 'none' : 'flex';
    $('auth-heading').textContent = isLoginMode ? 'Sign In' : 'Create Account';
    $('auth-subheading').textContent = isLoginMode ? 'Access your innovation portal' : 'Join the InnovatEPAM community';
    $('auth-toggle-btn').innerHTML = isLoginMode
        ? "Don't have an account? <span style='text-decoration:underline'>Register</span>"
        : "Already have an account? <span style='text-decoration:underline'>Sign In</span>";
});

function logout() {
    state.token = null; state.user = null;
    localStorage.removeItem('token');
    $('auth-view').classList.remove('hidden');
    $('app-shell').classList.add('hidden');
    closeDropdown();
    if (state.chart) { state.chart.destroy(); state.chart = null; }
}

// ─── Idea Card Builder ────────────────────────────────────────────────────────
function renderIdeaCard(idea, isAdmin = false) {
    const author = idea.author || {};
    const displayName = author.email ? author.email.split('@')[0] : 'User';
    const tagsHtml = renderTagPills(idea.tags);
    const badge = STATUS_BADGE[idea.status] || STATUS_BADGE.submitted;
    const problemSnippet = idea.problem_statement
        ? `<p style="font-size:0.75rem;font-style:italic;color:var(--text-muted);margin-top:0.25rem;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${idea.problem_statement}</p>`
        : '';

    const reviewBtn = isAdmin
        ? `<button class="btn-ghost" style="font-size:0.75rem;padding:0.3rem 0.75rem;border-radius:0.5rem;flex-shrink:0"
                onclick="event.stopPropagation();openReviewDrawer(${JSON.stringify(idea).replace(/"/g, '&quot;')})">Review →</button>`
        : '';

    const deleteBtn = idea.author?.email === state.user?.email || state.user?.role === 'admin'
        ? `<button class="btn-icon" style="color:#ef4444; width:1.75rem; height:1.75rem" title="Delete Idea" 
            onclick="event.stopPropagation(); if(confirm('Are you sure you want to delete this idea?')) deleteIdea('${idea.id}')">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
           </button>`
        : '';

    const avatarLetter = (author.email || '?')[0].toUpperCase();

    return `
    <div class="idea-card" onclick='openDetailDrawer(${JSON.stringify(idea).replace(/'/g, "&#39;")})'>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem">
            <div style="display:flex;align-items:center;gap:0.625rem;min-width:0">
                <div class="avatar" style="flex-shrink:0">
                    ${author.avatar_url
            ? `<img src="${author.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentElement.textContent='${avatarLetter}'">`
            : avatarLetter}
                </div>
                <div style="min-width:0">
                    <p style="font-size:0.8125rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${displayName}</p>
                    <p style="font-size:0.7rem;color:var(--text-muted)">${fmtDate(idea.created_at)}</p>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0">
                ${badge}
                ${reviewBtn}
                ${deleteBtn}
            </div>
        </div>
        <div>
            <h4 style="font-size:1rem;font-weight:800;letter-spacing:-0.02em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${idea.title}</h4>
            <p style="font-size:0.8125rem;color:var(--text-muted);margin-top:0.3rem;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${idea.description}</p>
            ${problemSnippet}
        </div>
        ${tagsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:0.375rem">${tagsHtml}</div>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:0.25rem">
            <span style="font-size:0.7rem;padding:0.2rem 0.65rem;border-radius:9999px;border:1px solid var(--border);color:var(--text-muted);font-weight:600">${idea.category}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);font-weight:600">View timeline →</span>
        </div>
    </div>`;
}

function getEmptyMessage(filter, isAdmin) {
    if (isAdmin) return { icon: '📭', title: 'No submissions yet', subtitle: 'Submissions will appear here.' };

    switch (filter) {
        case 'submitted': return { icon: '⏳', title: 'No pending ideas', subtitle: 'You have no ideas awaiting review.' };
        case 'accepted': return { icon: '🎉', title: 'No accepted ideas yet', subtitle: 'Keep submitting great ideas!' };
        case 'rejected': return { icon: '📈', title: 'No rejected ideas', subtitle: 'Good job!' };
        default: return { icon: '💡', title: 'No ideas yet', subtitle: 'Click "New Idea" to submit your first.' };
    }
}

function renderFeed(ideas, containerId, isAdmin = false) {
    const el = $(containerId);
    if (!ideas.length) {
        const msg = getEmptyMessage(state.activeFilter, isAdmin);
        el.innerHTML = `<div class="glass-card" style="padding:3rem 2rem;text-align:center;color:var(--text-muted);column-span:all;break-inside:avoid;margin:2rem auto;max-width:32rem;">
            <p style="font-size:2rem;margin-bottom:0.75rem">${msg.icon}</p>
            <p style="font-weight:700;margin-bottom:0.375rem">${msg.title}</p>
            <p style="font-size:0.875rem">${msg.subtitle}</p>
        </div>`;
        return;
    }
    el.innerHTML = ideas.map(i => renderIdeaCard(i, isAdmin)).join('');
}

// ─── Feed (Submitter) ─────────────────────────────────────────────────────────
async function loadMyIdeas() {
    showSkeletons('idea-feed', 6);
    const res = await apiFetch('/api/ideas');
    if (!res.ok) return;
    state.allIdeas = await res.json();
    applyFilter(state.activeFilter);
}

function applyFilter(filter) {
    state.activeFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.filter === filter);
    });
    const filtered = filter === 'all'
        ? state.allIdeas
        : state.allIdeas.filter(i => i.status === filter || (filter === 'submitted' && i.status === 'submitted'));
    renderFeed(filtered, 'idea-feed', false);
}

document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => applyFilter(chip.dataset.filter));
});

// Search
$('search-input').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    if (!q) { applyFilter(state.activeFilter); return; }
    const src = state.user?.role === 'admin' ? state.adminIdeas : state.allIdeas;
    const containerId = state.user?.role === 'admin' ? 'admin-feed' : 'idea-feed';
    renderFeed(src.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)), containerId, state.user?.role === 'admin');
});

// ─── Admin Feed ───────────────────────────────────────────────────────────────
async function loadAllIdeas() {
    showSkeletons('admin-feed', 6);
    const res = await apiFetch('/api/admin/ideas');
    if (!res.ok) return;
    state.adminIdeas = await res.json();
    $('admin-count').textContent = `${state.adminIdeas.length} submission${state.adminIdeas.length !== 1 ? 's' : ''}`;
    renderFeed(state.adminIdeas, 'admin-feed', true);
}

// ─── Admin Stats + Chart ──────────────────────────────────────────────────────
async function loadAdminStats() {
    const res = await apiFetch('/api/admin/stats');
    if (!res.ok) return;
    const d = await res.json();

    $('kpi-total').textContent = d.total;
    $('kpi-accepted').textContent = d.accepted;
    $('kpi-pending').textContent = d.pending ?? (d.total - d.accepted - d.rejected);
    $('kpi-rate').textContent = `${d.acceptance_rate}%`;

    $('kpi-total-trend').textContent = `${d.total} total`;
    $('kpi-accepted-trend').textContent = d.accepted > 0 ? `↑ ${Math.round(d.accepted / d.total * 100)}% accepted` : 'No accepted yet';
    $('kpi-rate-trend').textContent = d.acceptance_rate > 50 ? '↑ Above average' : '';
    $('kpi-rate-trend').className = `kpi-trend ${d.acceptance_rate > 50 ? 'up' : 'flat'}`;

    renderSplineChart(d.daily_submissions || []);
}

function rebuildChart() {
    const res = apiFetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(d => {
        if (d) renderSplineChart(d.daily_submissions || []);
    });
}

function renderSplineChart(data) {
    if (state.chart) { state.chart.destroy(); state.chart = null; }
    const canvas = $('submissions-chart');
    const ctx = canvas.getContext('2d');
    const isDark = !document.body.classList.contains('light');

    const labels = data.length ? data.map(x => x.date) : ['No data'];
    const values = data.length ? data.map(x => x.count) : [0];

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, 'rgba(6,182,212,0.35)');
    grad.addColorStop(0.5, 'rgba(6,182,212,0.1)');
    grad.addColorStop(1, 'rgba(6,182,212,0)');

    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#64748b' : '#94a3b8';

    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Submissions',
                data: values,
                borderColor: '#06b6d4',
                backgroundColor: grad,
                borderWidth: 2.5,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#06b6d4',
                pointBorderColor: isDark ? '#0f172a' : '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointHoverBorderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                    borderColor: 'rgba(6,182,212,0.4)',
                    borderWidth: 1,
                    titleColor: isDark ? '#f1f5f9' : '#0f172a',
                    bodyColor: '#06b6d4',
                    titleFont: { weight: '700', family: 'Inter' },
                    bodyFont: { weight: '600', family: 'Inter' },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: ctx => ` ${ctx.raw} submission${ctx.raw !== 1 ? 's' : ''}`,
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { size: 11, family: 'Inter' } },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor, stepSize: 1, font: { size: 11, family: 'Inter' } },
                    border: { display: false }
                }
            }
        }
    });
}

// ─── Detail Drawer (Timeline) ─────────────────────────────────────────────────
function openDetailDrawer(idea) {
    $('dd-title').textContent = idea.title;
    $('dd-category').textContent = idea.category;
    $('dd-status').innerHTML = STATUS_BADGE[idea.status] || STATUS_BADGE.submitted;
    $('dd-tags').innerHTML = renderTagPills(idea.tags);
    $('dd-timeline').innerHTML = buildTimeline(idea);

    $('detail-drawer').classList.add('open');
    $('drawer-overlay').classList.add('visible');
}

function buildTimeline(idea) {
    const author = idea.author || {};
    const reviewer = idea.reviewer || null;
    const aName = author.email?.split('@')[0] || 'Unknown';
    const rName = reviewer?.email?.split('@')[0] || 'Admin';

    const attach = idea.file_path
        ? `<a href="/${idea.file_path}" target="_blank"
              style="display:inline-flex;align-items:center;gap:0.375rem;font-size:0.8125rem;font-weight:600;color:var(--accent);text-decoration:none;margin-top:0.625rem">
              📎 Download attachment</a>`
        : '';
    const problemHtml = idea.problem_statement
        ? `<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border)">
               <p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:0.375rem">Problem</p>
               <p style="font-size:0.8125rem;line-height:1.6">${idea.problem_statement}</p>
           </div>` : '';
    const solutionHtml = idea.solution
        ? `<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border)">
               <p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:0.375rem">Solution</p>
               <p style="font-size:0.8125rem;line-height:1.6">${idea.solution}</p>
           </div>` : '';

    let html = `
    <div class="timeline-item">
        <div class="timeline-dot dot-submit">✍</div>
        <div class="timeline-body">
            <p class="timeline-meta"><strong>${aName}</strong> submitted · ${fmtDateTime(idea.created_at)}</p>
            <div class="timeline-content">
                <p style="font-size:0.875rem;line-height:1.65;white-space:pre-wrap">${idea.description}</p>
                ${problemHtml}${solutionHtml}${attach}
            </div>
        </div>
    </div>`;

    if (idea.status !== 'submitted' && reviewer) {
        const dotClass = idea.status === 'accepted' ? 'dot-accept' : 'dot-reject';
        const icon = idea.status === 'accepted' ? '✓' : '✗';
        const rLetter = (reviewer.email || '?')[0].toUpperCase();
        html += `
        <div class="timeline-item" style="margin-top:0.25rem">
            <div class="timeline-dot ${dotClass}">${icon}</div>
            <div class="timeline-body">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
                    <div class="avatar" style="width:1.5rem;height:1.5rem;font-size:0.65rem;flex-shrink:0">
                        ${reviewer.avatar_url ? `<img src="${reviewer.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentElement.textContent='${rLetter}'">` : rLetter}
                    </div>
                    <p class="timeline-meta" style="margin-bottom:0"><strong>${rName}</strong> ${idea.status} this idea</p>
                </div>
                ${idea.admin_comment ? `<div class="timeline-content"><p style="font-size:0.875rem;font-style:italic">"${idea.admin_comment}"</p></div>` : ''}
            </div>
        </div>`;
    } else if (idea.status === 'submitted') {
        html += `
        <div class="timeline-item" style="margin-top:0.25rem">
            <div class="timeline-dot dot-pending" style="opacity:0.6">⏳</div>
            <div class="timeline-body">
                <p class="timeline-meta" style="opacity:0.7">Awaiting admin review…</p>
            </div>
        </div>`;
    }
    return html;
}

// ─── Review Drawer (Admin) ────────────────────────────────────────────────────
function openReviewDrawer(idea) {
    $('rd-title').textContent = idea.title;
    $('rd-category').textContent = idea.category;
    $('rd-status').innerHTML = STATUS_BADGE[idea.status] || STATUS_BADGE.submitted;
    $('rd-tags').innerHTML = idea.tags ? renderTagPills(idea.tags) : '';
    $('rd-description').textContent = idea.description;
    $('rd-idea-id').value = idea.id;
    $('rd-comment').value = idea.admin_comment || '';

    // Author row
    const author = idea.author || {};
    const aLetter = (author.email || '?')[0].toUpperCase();
    $('rd-author-row').innerHTML = `
        <div class="avatar">${author.avatar_url ? `<img src="${author.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentElement.textContent='${aLetter}'">` : aLetter}</div>
        <div>
            <p style="font-weight:700;font-size:0.875rem">${author.email || 'Unknown'}</p>
            <p style="font-size:0.75rem;color:var(--text-muted)">${fmtDate(idea.created_at)}</p>
        </div>`;

    // Conditional sections
    const prob = $('rd-problem-row'), sol = $('rd-solution-row'), att = $('rd-attach-row');
    if (idea.problem_statement) { prob.classList.remove('hidden'); $('rd-problem').textContent = idea.problem_statement; } else prob.classList.add('hidden');
    if (idea.solution) { sol.classList.remove('hidden'); $('rd-solution').textContent = idea.solution; } else sol.classList.add('hidden');
    if (idea.file_path) { att.classList.remove('hidden'); $('rd-attach-link').href = `/${idea.file_path}`; } else att.classList.add('hidden');

    $('review-drawer').classList.add('open');
    $('drawer-overlay').classList.add('visible');
}

async function submitReview(status) {
    const id = $('rd-idea-id').value;
    const comment = $('rd-comment').value.trim();
    if (!comment) { showToast('Please provide an evaluation comment.', 'error'); return; }
    const res = await apiFetch(`/api/admin/ideas/${id}/evaluate`, {
        method: 'PATCH',
        body: JSON.stringify({ status, admin_comment: comment })
    });
    if (res.ok) {
        showToast(`Idea ${status} successfully!`);
        closeDrawers();
        loadAllIdeas();
        loadAdminStats();
    } else {
        showToast((await res.json()).detail || 'Evaluation failed.', 'error');
    }
}

function closeDrawers() {
    $('detail-drawer').classList.remove('open');
    $('review-drawer').classList.remove('open');
    if ($('event-modal')) $('event-modal').classList.remove('open');
    $('drawer-overlay').classList.remove('visible');
}


// ─── Submit Modal ─────────────────────────────────────────────────────────────
function openSubmitModal() {
    state.selectedTags.clear();
    document.querySelectorAll('.tag-chip-btn').forEach(b => b.classList.remove('selected'));
    $('idea-tags-input').value = '';
    $('submit-idea-form').reset();
    $('submit-modal').classList.remove('hidden');
}
function closeSubmitModal() { $('submit-modal').classList.add('hidden'); }

$('open-submit-btn')?.addEventListener('click', openSubmitModal);

$('submit-modal').addEventListener('click', e => { if (e.target === $('submit-modal')) closeSubmitModal(); });

// Tag chips
document.querySelectorAll('.tag-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (state.selectedTags.has(tag)) { state.selectedTags.delete(tag); btn.classList.remove('selected'); }
        else { state.selectedTags.add(tag); btn.classList.add('selected'); }
        $('idea-tags-input').value = [...state.selectedTags].join(', ');
    });
});

$('submit-idea-form').addEventListener('submit', async e => {
    e.preventDefault();
    const title = $('idea-title').value.trim();
    const category = $('idea-category').value;
    const description = $('idea-description').value.trim();
    if (!title) { showToast('Please enter a title.', 'error'); return; }
    if (!category) { showToast('Please select a category.', 'error'); return; }
    if (!description) { showToast('Please enter a description.', 'error'); return; }

    const tags = $('idea-tags-input').value.trim() || [...state.selectedTags].join(', ');
    const fd = new FormData();
    fd.append('title', title);
    fd.append('category', category);
    fd.append('description', description);
    if (tags) fd.append('tags', tags);

    const attachmentInput = $('idea-attachment');
    if (attachmentInput && attachmentInput.files.length > 0) {
        fd.append('attachment', attachmentInput.files[0]);
    }

    const res = await apiFetch('/api/ideas', { method: 'POST', body: fd });
    if (res.ok) {
        showToast('Idea submitted successfully!');
        closeSubmitModal();
        loadMyIdeas();
    } else {
        const err = await res.json();
        let msg = 'Submission failed.';
        if (typeof err.detail === 'string') msg = err.detail;
        else if (Array.isArray(err.detail) && err.detail.length > 0) msg = err.detail[0].msg;
        showToast(msg, 'error');
    }
});

async function deleteIdea(id) {
    const res = await apiFetch(`/api/ideas/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast('Idea deleted successfully.');
        loadMyIdeas();
        if (state.user?.role === 'admin') loadAllIdeas();
    } else {
        const err = await res.json();
        const msg = typeof err.detail === 'string' ? err.detail : (Array.isArray(err.detail) && err.detail.length ? err.detail[0].msg : 'Failed to delete idea.');
        showToast(msg, 'error');
    }
}

// ─── Profile ──────────────────────────────────────────────────────────────────
async function loadProfile() {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) return;
    const u = await res.json();
    state.user = u;
    populateUserUI(u);

    // Identity card
    const letter = u.email[0].toUpperCase();
    const avEl = $('profile-avatar-lg');
    if (u.avatar_url) {
        avEl.innerHTML = `<img src="${u.avatar_url}" alt="" onerror="this.parentElement.textContent='${letter}'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
        avEl.textContent = letter;
    }
    $('profile-name').textContent = u.bio ? u.email.split('@')[0] : u.email.split('@')[0];
    $('profile-bio').textContent = u.bio || 'No bio yet.';

    // Social links
    const sl = $('profile-social-links');
    sl.innerHTML = '';
    if (u.github_link) sl.innerHTML += `<a href="${u.github_link}" target="_blank" class="social-badge">⚙ GitHub</a>`;
    if (u.linkedin_link) sl.innerHTML += `<a href="${u.linkedin_link}" target="_blank" class="social-badge">💼 LinkedIn</a>`;

    // Role pill
    const rp = $('profile-role-pill');
    rp.innerHTML = u.role === 'admin'
        ? '<span class="badge badge-accepted" style="font-size:0.75rem">Admin</span>'
        : '<span class="badge badge-submitted" style="font-size:0.75rem">Submitter</span>';

    // Pre-fill form
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
        $('stat-rate').textContent = `${d.success_rate}%`;
    }
}

$('edit-profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {};
    const av = $('ep-avatar').value.trim(); if (av) payload.avatar_url = av;
    const bio = $('ep-bio').value.trim(); if (bio) payload.bio = bio;
    const gh = $('ep-github').value.trim(); if (gh) payload.github_link = gh;
    const li = $('ep-linkedin').value.trim(); if (li) payload.linkedin_link = li;

    const res = await apiFetch('/api/users/me/profile', { method: 'PUT', body: JSON.stringify(payload) });
    if (res.ok) {
        showToast('Profile updated!');
        await loadProfile();
    } else {
        showToast((await res.json()).detail || 'Update failed.', 'error');
    }
});

$('change-password-form').addEventListener('submit', async e => {
    e.preventDefault();
    const current = $('cp-current').value;
    const newPw = $('cp-new').value;
    const confirm = $('cp-confirm').value;
    if (newPw !== confirm) { showToast('New passwords do not match.', 'error'); return; }
    const res = await apiFetch('/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: current, new_password: newPw })
    });
    if (res.ok) { showToast('Password updated!'); $('change-password-form').reset(); }
    else { showToast((await res.json()).detail || 'Password change failed.', 'error'); }
});

// ─── Notification Bell ────────────────────────────────────────────────────────
let notifications = [];

async function loadNotifs() {
    try {
        const res = await fetch('/api/notifications', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            notifications = await res.json();
            updateNotifBadge();
            if (!$('notif-panel').classList.contains('hidden')) {
                renderNotifPanel();
            }
        }
    } catch (err) { console.error('Error fetching notifications:', err); }
}

function updateNotifBadge() {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const badge = $('notif-badge');
    const countEl = $('notif-count');

    if (unreadCount > 0) {
        badge.style.display = 'block';
        badge.style.opacity = '1';
        countEl.textContent = unreadCount;
    } else {
        badge.style.display = 'none';
        countEl.textContent = '0';
    }
}

function renderNotifPanel() {
    if (notifications.length === 0) {
        $('notif-list').innerHTML = `<p style="padding:1rem;color:#6b7280;text-align:center;">No notifications yet.</p>`;
        return;
    }

    // Map icons based on type
    const getIcon = (type) => {
        if (type === 'idea_review') return '✅';
        if (type === 'new_idea') return '💡';
        if (type === 'task_assigned') return '📋';
        return '🔔';
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr + "Z").getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
        return `${Math.floor(mins / 1440)}d ago`;
    };

    $('notif-list').innerHTML = notifications.map(n => `
        <div class="notif-item ${!n.is_read ? 'notif-unread' : ''}">
            <div class="notif-icon">${getIcon(n.type)}</div>
            <div style="flex:1;min-width:0">
                <p class="notif-text">${n.message}</p>
                <p class="notif-time">${timeAgo(n.created_at)}</p>
            </div>
            ${!n.is_read ? '<div class="notif-dot"></div>' : ''}
        </div>`).join('');
}

function toggleNotifPanel() {
    const panel = $('notif-panel');
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (isHidden) renderNotifPanel();
}

async function clearNotifs() {
    try {
        await fetch('/api/notifications/read', {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        await loadNotifs(); // reload state
    } catch (err) { console.error('Failed to mark read', err); }
}

setInterval(loadNotifs, 10000); // Polling every 10 seconds

document.addEventListener('click', e => {
    if (!e.target.closest('#notif-btn') && !$('notif-panel').classList.contains('hidden')) {
        $('notif-panel').classList.add('hidden');
    }
});

// ─── Extended routeTo ─────────────────────────────────────────────────────────
// Patch routeTo to support workspace and users views
function routeTo(view) {
    // Hide all views including new ones
    ['feed', 'admin', 'profile', 'workspace', 'users'].forEach(v => {
        const el = $(`${v}-view`);
        if (el) el.classList.add('hidden');
    });

    const target = $(`${view}-view`);
    if (target) target.classList.remove('hidden');

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navMap = { feed: 'nav-ideas', admin: 'nav-admin', profile: 'nav-profile', workspace: 'nav-workspace', users: 'nav-users' };
    const activeNav = $(navMap[view]);
    if (activeNav) activeNav.classList.add('active');

    closeSidebar();

    if (view === 'feed') loadMyIdeas();
    if (view === 'admin') { loadAllIdeas(); loadAdminStats(); }
    if (view === 'profile') loadProfile();
    if (view === 'workspace') loadWorkspace();
    if (view === 'users') loadUsersView();
}


// ─── Workspace: Todos ────────────────────────────────────────────────────────
let _todos = [];
let _events = [];
let _calYear, _calMonth;

async function loadWorkspace() {
    const today = new Date();
    if (!_calYear) { _calYear = today.getFullYear(); _calMonth = today.getMonth(); }

    const [tRes, eRes] = await Promise.all([
        apiFetch('/api/todos'),
        apiFetch('/api/events')
    ]);
    if (tRes.ok) _todos = await tRes.json();
    if (eRes.ok) _events = await eRes.json();

    renderTodoList();
    // Load idea dates from cached ideas
    const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
    renderMiniCalendar(_calYear, _calMonth, _events, ideaDates, _todos);
}

function renderTodoList() {
    const el = $('todo-list');
    $('todo-count').textContent = `${_todos.length} task${_todos.length !== 1 ? 's' : ''}`;
    if (!_todos.length) {
        el.innerHTML = `<p style="font-size:0.8125rem;color:var(--text-muted);text-align:center;padding:1.5rem 0">No tasks yet. Add one above!</p>`;
        return;
    }
    el.innerHTML = _todos.map(t => {
        let timeLabel = '';
        if (t.start_time || t.end_time) {
            timeLabel = `⏱ ${t.start_time || ''}${t.start_time && t.end_time ? ' - ' : ''}${t.end_time || ''}`;
        }
        let tagsHtml = '';
        if (t.tags) {
            tagsHtml = t.tags.split(',').map(tag => `<span style="font-size:0.6rem;padding:0.125rem 0.375rem;background:var(--bg-elevated);border:1px solid var(--border);border-radius:9999px;margin-right:4px">${tag.trim()}</span>`).join('');
        }

        return `
        <div class="todo-item ${t.done ? 'done' : ''}">
            <div class="todo-checkbox" onclick="toggleTodo('${t.id}', ${!t.done})">
                ${t.done ? `<svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;flex:1;min-width:0;gap:0.25rem">
                <span class="todo-text" style="line-height:1.2;font-weight:700">${t.title}</span>
                ${t.description ? `<span style="font-size:0.75rem;color:var(--text-muted);line-height:1.4">${t.description}</span>` : ''}
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.5rem">
                    ${t.date ? `<span style="font-size:0.7rem;color:var(--text-muted);font-weight:600">📅 ${t.date}</span>` : ''}
                    ${timeLabel ? `<span style="font-size:0.7rem;color:var(--accent);font-weight:600">${timeLabel}</span>` : ''}
                    ${tagsHtml ? `<div>${tagsHtml}</div>` : ''}
                </div>
            </div>
            <button class="todo-delete" onclick="deleteTodo('${t.id}')">✕</button>
        </div>`;
    }).join('');
}

async function openTaskModal(prefillDate = null) {
    $('task-title').value = '';
    $('task-desc').value = '';
    $('task-date').value = (typeof prefillDate === 'string' && prefillDate) ? prefillDate : '';
    $('task-start').value = '';
    $('task-end').value = '';
    $('task-tags').value = '';

    // If admin, populate users dropdown
    if (state.currentUser?.role === 'admin') {
        $('task-assign-group').classList.remove('hidden');
        const res = await apiFetch('/api/admin/users');
        if (res.ok) {
            const users = await res.json();
            const select = $('task-assign');
            select.innerHTML = `<option value="">Myself</option>` + users.map(u =>
                `<option value="${u.id}">${u.email} (${u.role})</option>`
            ).join('');
        }
    } else {
        $('task-assign-group').classList.add('hidden');
    }

    $('task-modal').classList.add('open');
    $('drawer-overlay').classList.add('visible');
}

function closeTaskModal() {
    $('task-modal').classList.remove('open');
    $('drawer-overlay').classList.remove('visible');
}

async function saveTask() {
    const title = $('task-title').value.trim();
    if (!title) { showToast("Title is required", "error"); return; }

    const description = $('task-desc').value.trim() || null;
    const date = $('task-date').value || null;
    const start_time = $('task-start').value || null;
    const end_time = $('task-end').value || null;
    const tags = $('task-tags').value.trim() || null;

    let assignUserId = null;
    if (state.currentUser?.role === 'admin') {
        assignUserId = $('task-assign').value;
    }

    const payload = { title, description, date, start_time, end_time, tags };
    if (assignUserId) payload.user_id = assignUserId;

    const endpoint = '/api/todos';

    const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) {
        showToast('Task added successfully!');
        closeTaskModal();
        if (!assignUserId) {
            _todos.push(await res.json());
            renderTodoList();

            // Re-render calendar to show new task if it has a date
            const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
            renderMiniCalendar(_calYear, _calMonth, _events, ideaDates, _todos);
        } else {
            showToast('Task assigned to user.');
        }
    } else { showToast('Failed to add task.', 'error'); }
}

async function toggleTodo(id, done) {
    const res = await apiFetch(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) });
    if (res.ok) {
        const updated = await res.json();
        _todos = _todos.map(t => t.id === id ? updated : t);
        renderTodoList();

        // Re-render calendar to update task dot colors
        const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
        renderMiniCalendar(_calYear, _calMonth, _events, ideaDates, _todos);
    }
}

async function deleteTodo(id) {
    const res = await apiFetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
        _todos = _todos.filter(t => t.id !== id);
        renderTodoList();
        showToast('Task deleted.');

        // Re-render calendar
        const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
        renderMiniCalendar(_calYear, _calMonth, _events, ideaDates, _todos);
    }
}

// ─── Workspace: Mini Calendar ─────────────────────────────────────────────────
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function calPrev() {
    _calMonth--;
    if (_calMonth < 0) { _calMonth = 11; _calYear--; }
    const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
    renderMiniCalendar(_calYear, _calMonth, _events, ideaDates, _todos);
}
function calNext() {
    _calMonth++;
    if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
    renderMiniCalendar(_calYear, _calMonth, _events, ideaDates, _todos);
}

function renderMiniCalendar(year, month, events, ideaDates, todos) {
    const el = $('mini-calendar');
    const titleEl = $('cal-title');
    titleEl.textContent = `${MONTH_NAMES[month]} ${year}`;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const eventDateSet = new Set(events.map(e => e.date));
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = DAY_LABELS.map(d => `<div class="cal-day-header">${d}</div>`).join('');

    // empty cells before first day
    for (let i = 0; i < firstDay; i++) html += `<div class="cal-day cal-empty"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const hasIdea = ideaDates?.has(dateStr);

        const dayEvents = events.filter(e => e.date === dateStr);
        const dayTasks = (todos || []).filter(t => t.date === dateStr);

        const hasEvent = dayEvents.length > 0;
        const hasDoneTask = dayTasks.some(t => t.done);
        const hasPendingTask = dayTasks.some(t => !t.done);

        const dots = [
            hasIdea ? '<span class="cal-dot" style="background:var(--primary)"></span>' : '',
            hasEvent ? '<span class="cal-dot cal-dot-event"></span>' : '',
            hasDoneTask ? '<span class="cal-dot" style="background:#22c55e"></span>' : '',
            hasPendingTask ? '<span class="cal-dot" style="background:#9ca3af"></span>' : ''
        ].filter(Boolean).join('');

        let tooltipLines = [];
        if (dayEvents.length) {
            tooltipLines.push('📍 Events:');
            dayEvents.forEach(e => tooltipLines.push(`  - ${e.time ? e.time + ' ' : ''}${e.title}`));
        }
        if (dayTasks.length) {
            tooltipLines.push('📝 Tasks:');
            dayTasks.forEach(t => tooltipLines.push(`  - [${t.done ? 'x' : ' '}] ${t.title} ${t.start_time ? '(' + t.start_time + ')' : ''}`));
        }

        const tooltip = tooltipLines.join('\n');
        const titleAttr = tooltip ? `title="${tooltip.replace(/"/g, '&quot;')}"` : '';

        html += `<div class="cal-day ${isToday ? 'cal-today' : ''}" ${titleAttr} onclick="openDayView('${dateStr}')">
            ${d}
            ${dots ? `<div class="cal-dots">${dots}</div>` : ''}
        </div>`;
    }

    el.innerHTML = html;
}

// --- Day View Methods ---
let _selectedDateStr = null;

function openDayView(dateStr) {
    if (!$('day-view-modal')) return;
    _selectedDateStr = dateStr;
    const dateObj = new Date(dateStr);
    $('day-view-date').textContent = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const dayIdeas = state.allIdeas.filter(i => i.created_at?.slice(0, 10) === dateStr);
    const dayEvents = _events.filter(e => e.date === dateStr);
    const dayTasks = (_todos || []).filter(t => t.date === dateStr);

    let html = '';

    if (dayIdeas.length) {
        html += `<div style="margin-bottom:1rem"><p class="section-label">Ideas Submitted</p>`;
        dayIdeas.forEach(i => {
            html += `<div style="background:var(--bg-elevated);padding:0.75rem;border-radius:0.5rem;border:1px solid var(--border);margin-bottom:0.5rem">
                <span class="cal-dot" style="background:var(--primary)"></span> <span style="font-weight:600;font-size:0.875rem">${i.title}</span>
            </div>`;
        });
        html += `</div>`;
    }

    if (dayEvents.length) {
        html += `<div style="margin-bottom:1rem"><p class="section-label">Events</p>`;
        dayEvents.forEach(e => {
            html += `<div style="background:var(--bg-elevated);padding:0.75rem;border-radius:0.5rem;border:1px solid var(--border);margin-bottom:0.5rem">
                <span class="cal-dot cal-dot-event"></span> <span style="font-weight:600;font-size:0.875rem">${e.title}</span>
                ${e.time ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem">⏱ ${e.time}</div>` : ''}
            </div>`;
        });
        html += `</div>`;
    }

    if (dayTasks.length) {
        html += `<div style="margin-bottom:1rem"><p class="section-label">Tasks</p>`;
        dayTasks.forEach(t => {
            const color = t.done ? '#22c55e' : '#9ca3af';
            let timeLabel = '';
            if (t.start_time || t.end_time) {
                timeLabel = `⏱ ${t.start_time || ''}${t.start_time && t.end_time ? ' - ' : ''}${t.end_time || ''}`;
            }
            html += `<div style="background:var(--bg-elevated);padding:0.75rem;border-radius:0.5rem;border:1px solid var(--border);margin-bottom:0.5rem;opacity:${t.done ? 0.6 : 1}">
                <span class="cal-dot" style="background:${color}"></span> <span style="font-weight:600;font-size:0.875rem;text-decoration:${t.done ? 'line-through' : 'none'}">${t.title}</span>
                ${timeLabel ? `<div style="font-size:0.75rem;color:var(--accent);margin-top:0.25rem">${timeLabel}</div>` : ''}
            </div>`;
        });
        html += `</div>`;
    }

    if (!html) {
        html = `<p style="color:var(--text-muted);font-size:0.875rem;text-align:center;padding:2rem 0">Nothing scheduled for this day.</p>`;
    }

    $('day-view-content').innerHTML = html;
    $('day-view-modal').classList.add('open');
    $('drawer-overlay').classList.add('visible');
}

function closeDayView() {
    $('day-view-modal').classList.remove('open');
    $('drawer-overlay').classList.remove('visible');
}

function openDayAddEvent() {
    closeDayView();
    showAddEventForm(_selectedDateStr);
}

function openDayAddTask() {
    closeDayView();
    openTaskModal(_selectedDateStr);
}

function showAddEventForm(dateStr) {
    if (!$('event-modal')) return;
    $('event-date').value = dateStr;
    $('event-title').value = '';
    const et = $('event-time'); if (et) et.value = '';
    const ed = $('event-desc'); if (ed) ed.value = '';
    $('event-modal').classList.add('open');
    $('drawer-overlay').classList.add('visible');
}

function closeEventModal() {
    $('event-modal').classList.remove('open');
    $('drawer-overlay').classList.remove('visible');
}

async function saveCalendarEvent() {
    const title = $('event-title').value.trim();
    const date = $('event-date').value;
    const color = document.querySelector('input[name="event-color"]:checked')?.value || '#06b6d4';

    const timeInput = $('event-time');
    const descInput = $('event-desc');
    const time = timeInput && timeInput.value ? timeInput.value : null;
    const description = descInput && descInput.value.trim() ? descInput.value.trim() : null;

    if (!title || !date) {
        showToast('Please enter both title and date.', 'error');
        return;
    }

    const res = await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title, date, color, time, description })
    });

    if (res.ok) {
        showToast('Event saved!');
        closeEventModal();
        const saved = await res.json();
        _events.push(saved);
        const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
        renderMiniCalendar(_calYear, _calMonth, _events, ideaDates);
    } else {
        showToast('Failed to save event.', 'error');
    }
}

// ─── Users Management View (Admin) ────────────────────────────────────────────
async function loadUsersView() {
    $('users-tbody').innerHTML = '';
    const res = await apiFetch('/api/admin/users');
    if (!res.ok) { showToast('Failed to load users.', 'error'); return; }
    const users = await res.json();
    $('users-count').textContent = `${users.length} registered user${users.length !== 1 ? 's' : ''}`;
    $('users-tbody').innerHTML = users.map(u => renderUserRow(u)).join('');

    // Render sparklines after DOM is updated
    users.forEach((u, idx) => {
        const canvas = document.getElementById(`spark-${idx}`);
        if (canvas) renderSparkline(canvas, [u.total, u.accepted, u.rejected]);
    });
}

function renderUserRow(user, idx) {
    const letter = user.email[0].toUpperCase();
    const roleBadge = user.role === 'admin'
        ? `<span class="role-badge-admin">Admin</span>`
        : `<span class="role-badge-submitter">Submitter</span>`;
    const toggleLabel = user.role === 'admin' ? 'Demote' : 'Promote';

    return `<tr>
        <td style="display:flex;align-items:center;gap:0.625rem">
            <div class="avatar" style="width:2rem;height:2rem;font-size:0.75rem;flex-shrink:0">${letter}</div>
            <div>
                <p style="font-weight:700;font-size:0.8125rem">${user.email}</p>
                <p style="font-size:0.7rem;color:var(--text-muted)">${user.is_active ? 'Active' : 'Inactive'}</p>
            </div>
        </td>
        <td>${roleBadge}</td>
        <td style="font-weight:700">${user.total}</td>
        <td style="color:#22c55e;font-weight:700">${user.accepted}</td>
        <td style="color:var(--accent);font-weight:700">${user.success_rate}%</td>
        <td><canvas id="spark-${idx}" class="sparkline-cell"></canvas></td>
        <td>
            <button class="role-toggle-btn" onclick="toggleUserRole('${user.id}', '${user.role}')">${toggleLabel}</button>
        </td>
    </tr>`;
}

function renderSparkline(canvas, data) {
    // data = [total, accepted, rejected]
    const ctx = canvas.getContext('2d');
    const isDark = !document.body.classList.contains('light');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total', 'OK', 'No'],
            datasets: [{
                data,
                backgroundColor: ['rgba(6,182,212,0.4)', 'rgba(34,197,94,0.5)', 'rgba(239,68,68,0.4)'],
                borderColor: ['#06b6d4', '#22c55e', '#ef4444'],
                borderWidth: 1,
                borderRadius: 2,
            }]
        },
        options: {
            responsive: false, animation: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true }
            }
        }
    });
}

async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'submitter' : 'admin';
    const label = newRole === 'admin' ? 'promoted to Admin' : 'demoted to Submitter';
    const res = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
    });
    if (res.ok) {
        showToast(`User ${label}!`);
        loadUsersView();
    } else {
        showToast((await res.json()).detail || 'Role update failed.', 'error');
    }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();

