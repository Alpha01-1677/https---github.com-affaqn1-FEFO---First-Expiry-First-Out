// ═══════════════════════════════════════════════════
// sidebar.js  —  Shared navigation shell for Sprint 1
// Used by: dashboard.html, batches.html, scan.html, dispatch.html
// ═══════════════════════════════════════════════════

// ── Inject global CSS (sidebar + shared styles) ──
const sharedStyles = `
    :root {
        --nestle-blue: #003087;
        --nestle-light-blue: #0057B8;
        --nestle-accent: #00AEEF;
        --sidebar-w: 260px;
    }
    * { font-family: 'DM Sans', sans-serif; }
    code, .mono { font-family: 'DM Mono', monospace; }

    #sidebar { width: var(--sidebar-w); transition: transform 0.3s ease; }

    .nav-item {
        display: flex; align-items: center; gap: 14px;
        padding: 12px 18px; border-radius: 12px;
        color: #94a3b8; cursor: pointer;
        transition: all 0.2s; font-size: 15px; font-weight: 500;
    }
    .nav-item:hover  { background: rgba(255,255,255,0.07); color: #fff; }
    .nav-item.active { background: rgba(0,174,239,0.15); color: #00AEEF; font-weight: 600; }
    .nav-item .icon  { width: 20px; height: 20px; flex-shrink: 0; }

    .badge { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:600; letter-spacing:0.3px; }
    .badge-green  { background:#dcfce7; color:#15803d; }
    .badge-red    { background:#fee2e2; color:#b91c1c; }
    .badge-yellow { background:#fef9c3; color:#92400e; }
    .badge-blue   { background:#dbeafe; color:#1d4ed8; }
    .badge-gray   { background:#f1f5f9; color:#475569; }

    .form-input {
        width:100%; padding:12px 16px; border:1.5px solid #e2e8f0;
        border-radius:10px; font-size:15px; color:#1e293b; outline:none;
        transition:border-color 0.2s; background:#fff;
    }
    .form-input:focus { border-color:var(--nestle-accent); box-shadow:0 0 0 3px rgba(0,174,239,0.1); }
    .form-label { font-size:13px; font-weight:600; color:#64748b; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.4px; display:block; }

    .stat-card { background:#fff; border-radius:16px; padding:24px; border:1px solid #f1f5f9; transition:box-shadow 0.2s; }
    .stat-card:hover { box-shadow:0 4px 20px rgba(0,48,135,0.08); }

    .data-table { width:100%; border-collapse:collapse; font-size:14px; }
    .data-table th { background:#f8fafc; color:#64748b; font-weight:600; text-align:left; padding:14px 18px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e2e8f0; }
    .data-table td { padding:14px 18px; border-bottom:1px solid #f1f5f9; color:#1e293b; vertical-align:middle; }
    .data-table tr:hover td { background:#f8fafc; }

    .shelf-bar { height:6px; border-radius:3px; background:#e2e8f0; overflow:hidden; }
    .shelf-fill { height:100%; border-radius:3px; transition:width 0.4s; }

    #toast-container { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:10px; }
    .toast { min-width:300px; max-width:400px; padding:16px 20px; border-radius:16px; font-size:14px; font-weight:500; box-shadow:0 8px 32px rgba(0,0,0,0.12); display:flex; align-items:flex-start; gap:12px; animation:slideIn 0.3s ease; }
    .toast-success { background:#fff; border-left:4px solid #22c55e; color:#1e293b; }
    .toast-error   { background:#fff; border-left:4px solid #ef4444; color:#1e293b; }
    .toast-info    { background:#fff; border-left:4px solid #3b82f6; color:#1e293b; }
    @keyframes slideIn { from { transform:translateX(120%); opacity:0; } to { transform:translateX(0); opacity:1; } }

    .pulse-dot { width:8px; height:8px; border-radius:50%; background:#22c55e; animation:pulse 2s infinite; }
    @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 70%{box-shadow:0 0 0 8px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }

    .role-chip { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
    .role-supervisor { background:#ede9fe; color:#6d28d9; }
    .role-staff      { background:#dbeafe; color:#1d4ed8; }

    ::-webkit-scrollbar { width:6px; height:6px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }
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

// ── Build sidebar HTML ──
export function buildSidebar(activePage) {
    const user_name = sessionStorage.getItem('user_name') || 'User';
    const user_role = sessionStorage.getItem('user_role') || 'Warehouse Staff';
    const avatar    = (user_name.charAt(0) || '?').toUpperCase();
    const isSup     = user_role.toLowerCase().includes('supervisor');

    const navItems = NAV_PAGES.map(p => `
        <a href="${p.href}" class="nav-item ${activePage === p.id ? 'active' : ''}" data-page="${p.id}">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">${p.icon}</svg>
            ${p.label}
        </a>
    `).join('');

    return `
    <aside id="sidebar" class="flex-shrink-0 h-full flex flex-col overflow-hidden"
           style="background:#0a1628; width:var(--sidebar-w);">
        <!-- Logo -->
        <div class="px-5 py-6 border-b border-white/5">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:var(--nestle-accent);">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                </div>
                <div>
                    <div class="text-white font-bold text-base leading-tight">Nestlé SSAMS</div>
                    <div class="text-slate-400 text-sm mt-0.5">v1.0 — Sprint 1</div>
                </div>
            </div>
        </div>
        <!-- Nav -->
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
            <div class="text-slate-500 text-sm font-semibold uppercase tracking-widest px-3 mb-4 mt-2">Workspace</div>
            ${navItems}
        </nav>
        <!-- User footer -->
        <div class="p-4 border-t border-white/5">
            <div class="flex items-center gap-3 px-2">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-inner"
                     style="background:var(--nestle-accent);">${avatar}</div>
                <div class="flex-1 min-w-0">
                    <div class="text-white text-sm font-semibold truncate">${user_name}</div>
                    <div class="mt-1">
                        <span class="role-chip ${isSup ? 'role-supervisor' : 'role-staff'}">${user_role}</span>
                    </div>
                </div>
                <button onclick="doLogout()" title="Sign Out" class="text-slate-500 hover:text-red-400 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <header class="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10 relative">
        <div>
            <h2 class="text-xl font-bold text-slate-900">${title}</h2>
            <p class="text-sm text-slate-500 mt-0.5">${subtitle}</p>
        </div>
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200">
                <div class="pulse-dot"></div>
                <span>Live · Firestore</span>
            </div>
            <div class="text-sm font-medium text-slate-500 mono bg-white border border-slate-200 rounded-xl px-4 py-2" id="header-datetime"></div>
        </div>
    </header>`;
}

// ── Toast utility ──
export function toast(msg, type = 'info') {
    const icons = {
        success: `<svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
        error:   `<svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
        info:    `<svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icons[type] || icons.info}
        <div>
            <div class="font-semibold text-xs mb-0.5">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="text-slate-600 text-xs">${msg}</div>
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
    const mfg  = mfgTs.toDate ? mfgTs.toDate() : new Date(mfgTs);
    const exp  = expTs.toDate ? expTs.toDate() : new Date(expTs);
    const total = daysBetween(mfg, exp);
    if (total <= 0) return 0;
    const remaining = daysBetween(new Date(), exp);
    return Math.max(0, Math.round((remaining / total) * 100));
}

export function mrslStatus(batch, mrslDays = 30) {
    const exp = batch.expiryDate.toDate ? batch.expiryDate.toDate() : new Date(batch.expiryDate);
    const daysLeft = daysBetween(new Date(), exp);
    const pct = shelfLifePct(batch.manufacturingDate, batch.expiryDate);
    if (daysLeft < 0)             return { ok: false, label: 'Expired',    color: 'red',    daysLeft, pct };
    if (!( daysLeft >= mrslDays && pct >= 20 ))
                                  return { ok: false, label: 'MRSL Fail',  color: 'red',    daysLeft, pct };
    if (daysLeft < mrslDays * 1.5 || pct < 35)
                                  return { ok: true,  label: 'Near Limit', color: 'yellow', daysLeft, pct };
    return                               { ok: true,  label: 'Compliant',  color: 'green',  daysLeft, pct };
}

export function badgeHtml(label, color) {
    const map = { green:'badge-green', red:'badge-red', yellow:'badge-yellow', blue:'badge-blue', gray:'badge-gray' };
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
    btn.style.opacity = loading ? '0.7' : '1';
}

// ── Clock ──
export function startClock() {
    const update = () => {
        const el = document.getElementById('header-datetime');
        if (el) el.textContent = new Date().toLocaleString('en-GB', {
            day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
        });
    };
    setInterval(update, 1000);
    update();
}

// ── Auth guard: redirect to login if no session ──
export function requireAuth() {
    if (!sessionStorage.getItem('user_uid')) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
