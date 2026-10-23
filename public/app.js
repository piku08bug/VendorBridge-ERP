async function api(url, method = 'GET', body) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && !location.pathname.match(/login|register|forgot|reset/))
    location.href = '/login.html';
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function showErr(id, msg, ok) {
  const e = document.getElementById(id);
  e.className = 'alert ' + (ok ? 'alert-success' : 'alert-danger');
  e.textContent = msg;
}

const STAFF = ['Procurement Officer', 'Manager/Approver', 'Admin'];
const APPROVERS = ['Manager/Approver', 'Admin'];
const NAV = [
  ['Dashboard', '/dashboard.html', null],
  ['Vendors', '/vendors.html', STAFF],
  ["RFQ's", '/module.html?m=' + encodeURIComponent("RFQ's"), null],
  ['Quotations', '/module.html?m=Quotations', null],
  ['Approvals', '/module.html?m=Approvals', APPROVERS],
  ['Purchase orders', '/module.html?m=' + encodeURIComponent('Purchase orders'), null],
  ['Invoices', '/module.html?m=Invoices', null],
  ['Reports', '/module.html?m=Reports', STAFF],
  ['Activity', '/module.html?m=Activity', APPROVERS]
];

async function initPage(active) {
  const { user } = await api('/api/auth/me');
  document.body.classList.add('app');
  const links = NAV.filter(n => !n[2] || n[2].includes(user.role))
    .map(n => `<a href="${n[1]}" class="${n[0] === active ? 'active' : ''}">- ${esc(n[0])}</a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `
    <header class="topbar">
      <span class="brand">VendorBridge</span>
      <span class="d-flex align-items-center gap-2">
        <small class="text-light d-none d-md-inline">${esc(user.name)} <span class="badge bg-secondary">${esc(user.role)}</span></small>
        <span class="avatar">${esc(user.name.charAt(0).toUpperCase())}</span>
        <button class="btn btn-outline-light btn-sm" onclick="logout()">Logout</button>
      </span>
    </header>
    <aside class="sidebar">${links}</aside>`);
  return user;
}

async function logout() {
  await api('/api/auth/logout', 'POST');
  location.href = '/login.html';
}
