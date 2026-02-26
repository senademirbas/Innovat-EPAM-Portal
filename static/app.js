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

function renderFeed(ideas, containerId, isAdmin = false) {
    const el = $(containerId);
    if (!ideas.length) {
        el.innerHTML = `<div class="glass-card" style="padding:3rem 2rem;text-align:center;color:var(--text-muted)">
            <p style="font-size:2rem;margin-bottom:0.75rem">${isAdmin ? '📭' : '💡'}</p>
            <p style="font-weight:700;margin-bottom:0.375rem">${isAdmin ? 'No submissions yet' : 'No ideas yet'}</p>
            <p style="font-size:0.875rem">${isAdmin ? 'Submissions will appear here.' : 'Click "New Idea" to submit your first.'}</p>
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

    const res = await apiFetch('/api/ideas', { method: 'POST', body: fd });
    if (res.ok) {
        showToast('Idea submitted successfully!');
        closeSubmitModal();
        loadMyIdeas();
    } else {
        showToast((await res.json()).detail || 'Submission failed.', 'error');
    }
});

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
const SEED_NOTIFS = [
    { icon: '✅', text: 'Your idea was accepted by the admin!', time: '2 hours ago', unread: true },
    { icon: '💡', text: 'You submitted a new idea — awaiting review.', time: 'Yesterday', unread: true },
    { icon: '👋', text: 'Welcome to InnovatEPAM Portal!', time: '2 days ago', unread: false },
];
let _notifsRead = false;

function renderNotifPanel() {
    $('notif-list').innerHTML = SEED_NOTIFS.map(n => `
        <div class="notif-item ${n.unread && !_notifsRead ? 'notif-unread' : ''}">
            <div class="notif-icon">${n.icon}</div>
            <div style="flex:1;min-width:0">
                <p class="notif-text">${n.text}</p>
                <p class="notif-time">${n.time}</p>
            </div>
            ${n.unread && !_notifsRead ? '<div class="notif-dot"></div>' : ''}
        </div>`).join('');
}

function toggleNotifPanel() {
    const panel = $('notif-panel');
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (isHidden) renderNotifPanel();
}

function clearNotifs() {
    _notifsRead = true;
    $('notif-badge').style.opacity = '0';
    $('notif-count').textContent = '0';
    renderNotifPanel();
}

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
    renderMiniCalendar(_calYear, _calMonth, _events, ideaDates);
}

function renderTodoList() {
    const el = $('todo-list');
    $('todo-count').textContent = `${_todos.length} task${_todos.length !== 1 ? 's' : ''}`;
    if (!_todos.length) {
        el.innerHTML = `<p style="font-size:0.8125rem;color:var(--text-muted);text-align:center;padding:1.5rem 0">No tasks yet. Add one above!</p>`;
        return;
    }
    el.innerHTML = _todos.map(t => `
        <div class="todo-item ${t.done ? 'done' : ''}">
            <div class="todo-checkbox" onclick="toggleTodo('${t.id}', ${!t.done})">
                ${t.done ? `<svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>` : ''}
            </div>
            <span class="todo-text">${t.text}</span>
            <button class="todo-delete" onclick="deleteTodo('${t.id}')">✕</button>
        </div>`).join('');
}

async function addTodo() {
    const input = $('todo-input');
    const text = input.value.trim();
    if (!text) return;
    const res = await apiFetch('/api/todos', { method: 'POST', body: JSON.stringify({ text }) });
    if (res.ok) {
        input.value = '';
        _todos.push(await res.json());
        renderTodoList();
    } else { showToast('Failed to add task.', 'error'); }
}

async function toggleTodo(id, done) {
    const res = await apiFetch(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) });
    if (res.ok) {
        const updated = await res.json();
        _todos = _todos.map(t => t.id === id ? updated : t);
        renderTodoList();
    }
}

async function deleteTodo(id) {
    const res = await apiFetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
        _todos = _todos.filter(t => t.id !== id);
        renderTodoList();
        showToast('Task deleted.');
    }
}

// ─── Workspace: Mini Calendar ─────────────────────────────────────────────────
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function calPrev() {
    _calMonth--;
    if (_calMonth < 0) { _calMonth = 11; _calYear--; }
    const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
    renderMiniCalendar(_calYear, _calMonth, _events, ideaDates);
}
function calNext() {
    _calMonth++;
    if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    const ideaDates = new Set(state.allIdeas.map(i => i.created_at?.slice(0, 10)).filter(Boolean));
    renderMiniCalendar(_calYear, _calMonth, _events, ideaDates);
}

function renderMiniCalendar(year, month, events, ideaDates) {
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
        const hasEvent = eventDateSet.has(dateStr);
        const dots = [
            hasIdea ? '<span class="cal-dot cal-dot-idea"></span>' : '',
            hasEvent ? '<span class="cal-dot cal-dot-event"></span>' : ''
        ].filter(Boolean).join('');

        html += `<div class="cal-day ${isToday ? 'cal-today' : ''}" onclick="showAddEventForm('${dateStr}')">
            ${d}
            ${dots ? `<div class="cal-dots">${dots}</div>` : ''}
        </div>`;
    }

    el.innerHTML = html;
}

function showAddEventForm(dateStr) {
    if (!$('event-modal')) return;
    $('event-date').value = dateStr;
    $('event-title').value = '';
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

    if (!title || !date) {
        showToast('Please enter both title and date.', 'error');
        return;
    }

    const res = await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title, date, color })
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

