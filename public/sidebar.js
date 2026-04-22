// ═══════════════════════════════════════════════════
// sidebar.js  —  Shared navigation shell for Sprint 1
// Used by: dashboard.html, batches.html, scan.html, dispatch.html
// ═══════════════════════════════════════════════════

// ── Inject global CSS (sidebar + shared styles) ──
const sharedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

    :root {
        --nestle-blue: #003087;
        --nestle-light-blue: #0057B8;
        --nestle-accent: #00AEEF;
        --sidebar-w: 264px;
        --sidebar-bg: #001a4d;
        --glass-bg: rgba(255,255,255,0.80);
        --glass-border: rgba(255,255,255,0.50);
        --glass-shadow: 0 8px 32px rgba(0, 48, 135, 0.08);
    }

    *, *::before, *::after { box-sizing: border-box; }
    * { font-family: 'DM Sans', system-ui, sans-serif; }
    code, .mono, .font-mono { font-family: 'DM Mono', 'Cascadia Code', monospace; }

    body { background: #f1f5f9; }

    /* ── Sidebar ── */
    #sidebar { width: var(--sidebar-w); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); background: var(--sidebar-bg); }

    .nav-item {
        display: flex; align-items: center; gap: 12px;
        padding: 11px 16px; border-radius: 12px;
        color: #7fa0c8; cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        font-size: 14.5px; font-weight: 500; letter-spacing: -0.01em;
        text-decoration: none;
    }
    .nav-item:hover {
        background: rgba(255,255,255,0.07);
        color: #e2eaf5;
        transform: translateX(2px);
    }
    .nav-item.active {
        background: linear-gradient(135deg, rgba(0,174,239,0.18), rgba(0,86,184,0.12));
        color: #00AEEF;
        font-weight: 600;
        box-shadow: inset 0 0 0 1px rgba(0,174,239,0.2);
    }
    .nav-item .icon { width: 18px; height: 18px; flex-shrink: 0; opacity: 0.9; }

    /* ── Badges ── */
    .badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 11px; border-radius: 999px;
        font-size: 11.5px; font-weight: 700; letter-spacing: 0.3px;
        font-family: 'DM Sans', sans-serif;
    }
    .badge-green  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-red    { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .badge-yellow { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-blue   { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-gray   { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    /* ── Form inputs ── */
    .form-input {
        width: 100%; padding: 12px 16px;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px; font-size: 15px; color: #1e293b; outline: none;
        transition: all 0.2s; background: rgba(255,255,255,0.9);
        font-family: 'DM Sans', sans-serif;
    }
    .form-input:focus {
        border-color: var(--nestle-accent);
        box-shadow: 0 0 0 4px rgba(0,174,239,0.10);
        background: #fff;
    }
    .form-label {
        font-size: 12px; font-weight: 700; color: #64748b;
        margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; display: block;
    }

    /* ── Glass Stat Cards ── */
    .stat-card {
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 24px;
        border: 1px solid var(--glass-border);
        box-shadow: var(--glass-shadow), 0 1px 2px rgba(0,0,0,0.04);
        transition: all 0.5s cubic-bezier(0.4,0,0.2,1);
        position: relative;
        overflow: hidden;
    }
    .stat-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%);
        border-radius: inherit;
        pointer-events: none;
    }
    .stat-card:hover {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 20px 48px rgba(0,48,135,0.13), 0 2px 8px rgba(0,48,135,0.06);
        border-color: rgba(0,174,239,0.25);
    }

    /* ── Shimmer loading skeleton ── */
    @keyframes shimmer {
        0%   { background-position: -600px 0; }
        100% { background-position:  600px 0; }
    }
    .shimmer {
        background: linear-gradient(90deg, #f1f5f9 25%, #e9eef5 50%, #f1f5f9 75%);
        background-size: 600px 100%;
        animation: shimmer 1.5s infinite linear;
        border-radius: 8px;
        color: transparent !important;
        user-select: none;
    }
    .shimmer * { opacity: 0 !important; }

    /* ── Data table ── */
    .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .data-table th {
        background: #f8fafc; color: #64748b; font-weight: 700; text-align: left;
        padding: 13px 18px; font-size: 11px; text-transform: uppercase;
        letter-spacing: 0.7px; border-bottom: 1px solid #e2e8f0;
        font-family: 'DM Sans', sans-serif;
    }
    .data-table td {
        padding: 13px 18px; border-bottom: 1px solid #f1f5f9;
        color: #1e293b; vertical-align: middle;
        transition: background 0.15s;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8faff; }

    /* ── Shelf bar ── */
    .shelf-bar { height: 5px; border-radius: 3px; background: #e2e8f0; overflow: hidden; }
    .shelf-fill { height: 100%; border-radius: 3px; transition: width 0.5s cubic-bezier(0.4,0,0.2,1); }

    /* ── Toast ── */
    #toast-container {
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        display: flex; flex-direction: column; gap: 10px;
    }
    .toast {
        min-width: 300px; max-width: 400px; padding: 16px 20px;
        border-radius: 16px; font-size: 13.5px; font-weight: 500;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: flex; align-items: flex-start; gap: 12px;
        animation: slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
        backdrop-filter: blur(12px);
    }
    .toast-success { background: rgba(255,255,255,0.95); border-left: 4px solid #22c55e; color: #1e293b; }
    .toast-error   { background: rgba(255,255,255,0.95); border-left: 4px solid #ef4444; color: #1e293b; }
    .toast-info    { background: rgba(255,255,255,0.95); border-left: 4px solid #3b82f6; color: #1e293b; }
    @keyframes slideIn {
        from { transform: translateX(120%) scale(0.9); opacity: 0; }
        to   { transform: translateX(0) scale(1); opacity: 1; }
    }

    /* ── Pulse dot ── */
    .pulse-dot {
        width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
        animation: pulseDot 2s infinite;
    }
    @keyframes pulseDot {
        0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
        70%  { box-shadow: 0 0 0 7px rgba(34,197,94,0); }
        100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }

    /* ── Role chips ── */
    .role-chip {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 10px; border-radius: 999px;
        font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .role-supervisor { background: rgba(109,40,217,0.15); color: #7c3aed; }
    .role-staff      { background: rgba(29,78,216,0.12);  color: #2563eb; }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    /* ── Mobile ── */
    @media (max-width: 768px) {
        #sidebar {
            position: fixed; height: 100dvh; z-index: 50;
            transform: translateX(-100%); left: 0; top: 0;
            box-shadow: 4px 0 40px rgba(0,0,0,0.25);
        }
        #sidebar.open { transform: translateX(0); }
        #sidebar-overlay {
            display: none; position: fixed; inset: 0;
            background: rgba(0,10,26,0.6); z-index: 40; opacity: 0;
            transition: opacity 0.3s; backdrop-filter: blur(4px);
        }
        #sidebar-overlay.show { display: block; opacity: 1; }
        .header-title-container { margin-left: 44px; }
    }
`;

const styleEl = document.createElement('style');
styleEl.textContent = sharedStyles;
document.head.appendChild(styleEl);

// ── Navigation config per page ──
export const NAV_PAGES = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: 'dashboard.html',
        subtitle: 'Warehouse overview and metrics',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`
    },
    {
        id: 'batches',
        label: 'Batch Database',
        href: 'batches.html',
        subtitle: 'Manage product batches and expiry dates',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>`
    },
    {
        id: 'scan',
        label: 'Barcode Scan',
        href: 'scan.html',
        subtitle: 'Look up batch details by barcode / batch ID',
        icon: `<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v10M12 7v10M16 7v10"/>`
    },
    {
        id: 'dispatch',
        label: 'FEFO Dispatch',
        href: 'dispatch.html',
        subtitle: 'Process dispatch orders with FEFO + MRSL validation',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>`
    },
    {
        id: 'orders',
        label: 'Dispatch Orders',
        href: 'orders.html',
        subtitle: 'Historical dispatch order records',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`
    }
];

// Pages accessible only to Supervisors
const SUPERVISOR_ONLY_PAGES = ['dashboard', 'dispatch', 'orders'];

// ── Build sidebar HTML ──
export function buildSidebar(activePage) {
    const user_name = sessionStorage.getItem('user_name') || 'User';
    const user_role = sessionStorage.getItem('user_role') || 'Warehouse Staff';
    const avatar = (user_name.charAt(0) || '?').toUpperCase();

    const isSup = user_role.toLowerCase().includes('supervisor');
    const isPlanner = user_role.toLowerCase().includes('planner');
    const isLogistics = user_role.toLowerCase().includes('logistics');

    // Filter pages based on role
    let visiblePages = NAV_PAGES;

    if (isSup) {
        // Supervisors see everything
        visiblePages = NAV_PAGES;
    } else if (isPlanner || isLogistics) {
        // Planners and Logistics Managers only see Dashboard
        visiblePages = NAV_PAGES.filter(p => p.id === 'dashboard');
    } else {
        // Staff see everything EXCEPT supervisor-only pages
        visiblePages = NAV_PAGES.filter(p => !SUPERVISOR_ONLY_PAGES.includes(p.id));
    }

    const navItems = visiblePages.map(p => `
        <a href="${p.href}" class="nav-item ${activePage === p.id ? 'active' : ''}" data-page="${p.id}">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">${p.icon}</svg>
            ${p.label}
        </a>
    `).join('');

    return `
    <div id="sidebar-overlay" onclick="toggleSidebar()"></div>
    <aside id="sidebar" class="flex-shrink-0 h-full flex flex-col overflow-hidden"
           style="background:var(--sidebar-bg); width:var(--sidebar-w); border-right:1px solid rgba(255,255,255,0.05);">

        <!-- Logo -->
        <div style="padding:20px; border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#00AEEF,#0057B8);box-shadow:0 4px 12px rgba(0,174,239,0.3);">
                    <svg style="width:18px;height:18px;color:#fff;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                </div>
                <div>
                    <div style="color:#f0f6ff;font-weight:700;font-size:15px;letter-spacing:-0.02em;line-height:1.2;">Nestlé SSAMS</div>
                    <div style="color:#4a6fa8;font-size:11.5px;margin-top:2px;font-family:'DM Mono',monospace;letter-spacing:0.02em;">v1.0 · Sprint 1</div>
                </div>
            </div>
        </div>

        <!-- Nav -->
        <nav style="flex:1;padding:16px 12px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;">
            <div style="color:#2a4a78;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:0 6px 10px;margin-top:4px;">Workspace</div>
            ${navItems}
        </nav>

        <!-- User footer -->
        <div style="padding:14px;border-top:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;background:rgba(255,255,255,0.04);">
                <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:800;background:linear-gradient(135deg,#0057B8,#003087);flex-shrink:0;">${avatar}</div>
                <div style="flex:1;min-width:0;">
                    <div style="color:#e2ecff;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user_name}</div>
                    <div style="margin-top:3px;">
                        <span class="role-chip ${isSup ? 'role-supervisor' : 'role-staff'}">${user_role}</span>
                    </div>
                </div>
                <button onclick="doLogout()" title="Sign Out"
                        style="color:#3a5a8a;transition:color 0.2s;background:none;border:none;cursor:pointer;padding:4px;"
                        onmouseover="this.style.color='#ff6b6b'" onmouseout="this.style.color='#3a5a8a'">
                    <svg style="width:18px;height:18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                </button>
            </div>
        </div>
    </aside>`;
}

// ── Build top header HTML ──
export function buildHeader(title, subtitle) {
    return `
    <header style="height:68px;background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.8);display:flex;align-items:center;justify-content:space-between;padding:0 28px;flex-shrink:0;box-shadow:0 1px 0 rgba(0,48,135,0.06), 0 4px 20px rgba(0,48,135,0.04);z-index:10;position:relative;">
        <button onclick="toggleSidebar()" class="md:hidden" style="position:absolute;left:16px;padding:8px;color:#64748b;background:none;border:none;cursor:pointer;border-radius:8px;transition:background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
            <svg style="width:22px;height:22px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="header-title-container" style="flex:1;min-width:0;padding-right:16px;">
            <h2 style="font-size:17px;font-weight:700;color:#0f172a;line-height:1.2;letter-spacing:-0.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</h2>
            <p style="font-size:12px;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${subtitle}</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
            <div class="hidden md:flex" style="align-items:center;gap:7px;font-size:12.5px;font-weight:500;color:#475569;background:rgba(248,250,252,0.9);border-radius:10px;padding:7px 14px;border:1px solid #e2e8f0;backdrop-filter:blur(8px);">
                <div class="pulse-dot"></div>
                <span style="letter-spacing:-0.01em;">Live · Firestore</span>
            </div>
            <div id="header-datetime" style="font-size:12px;font-weight:500;color:#64748b;font-family:'DM Mono',monospace;background:rgba(248,250,252,0.9);border:1px solid #e2e8f0;border-radius:8px;padding:7px 12px;backdrop-filter:blur(8px);white-space:nowrap;"></div>
        </div>
    </header>`;
}

// ── Toast utility ──
export function toast(msg, type = 'info') {
    const icons = {
        success: `<svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
        error: `<svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
        info: `<svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icons[type] || icons.info}
        <div>
            <div style="font-weight:700;font-size:12px;margin-bottom:2px;">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div style="color:#64748b;font-size:12.5px;">${msg}</div>
        </div>`;
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

// ── Shared date/calculation utilities ──
export function daysBetween(d1, d2) {
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function shelfLifePct(mfgTs, expTs) {
    const mfg = mfgTs.toDate ? mfgTs.toDate() : new Date(mfgTs);
    const exp = expTs.toDate ? expTs.toDate() : new Date(expTs);
    const total = daysBetween(mfg, exp);
    if (total <= 0) return 0;
    const remaining = daysBetween(new Date(), exp);
    return Math.max(0, Math.round((remaining / total) * 100));
}

export function mrslStatus(batch, mrslDays = 30) {
    const exp = batch.expiryDate.toDate ? batch.expiryDate.toDate() : new Date(batch.expiryDate);
    const daysLeft = daysBetween(new Date(), exp);
    const pct = shelfLifePct(batch.manufacturingDate, batch.expiryDate);
    if (daysLeft < 0) return { ok: false, label: 'Expired', color: 'red', daysLeft, pct };
    if (!(daysLeft > mrslDays && pct >= 20))
        return { ok: false, label: 'MRSL Fail', color: 'red', daysLeft, pct };
    if (daysLeft <= mrslDays * 1.5 || pct < 35)
        return { ok: true, label: 'Near Limit', color: 'yellow', daysLeft, pct };
    return { ok: true, label: 'Compliant', color: 'green', daysLeft, pct };
}

export function badgeHtml(label, color) {
    const map = { green: 'badge-green', red: 'badge-red', yellow: 'badge-yellow', blue: 'badge-blue', gray: 'badge-gray' };
    return `<span class="badge ${map[color] || 'badge-gray'}">${label}</span>`;
}

export function shelfBar(pct) {
    const color = pct >= 50 ? '#22c55e' : pct >= 20 ? '#f59e0b' : '#ef4444';
    return `<div class="shelf-bar w-20"><div class="shelf-fill" style="width:${pct}%;background:${color};"></div></div>`;
}

export function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.6' : '1';
}

// ── Clock ──
export function startClock() {
    const update = () => {
        const el = document.getElementById('header-datetime');
        if (el) el.textContent = new Date().toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };
    setInterval(update, 1000);
    update();
}

// ── Auth guard: redirect to login if no session ──
export function requireAuth() {
    if (!sessionStorage.getItem('user_uid')) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ── Mobile Sidebar Toggle ──
window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.classList.add('show'), 10);
        } else {
            overlay.classList.remove('show');
            setTimeout(() => overlay.style.display = 'none', 300);
        }
    }
};
