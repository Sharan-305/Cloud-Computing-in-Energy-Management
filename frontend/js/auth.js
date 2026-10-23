/**
 * Authentication and Page Navigation Manager
 */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  checkProtectedPage();
});

function initNav() {
  const token = API.getToken();
  const user = API.getUser();
  const navContainer = document.querySelector('nav ul');

  if (!navContainer) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  if (token && user) {
    // Authenticated user navigation
    navContainer.innerHTML = `
      <li><a href="dashboard.html" class="${currentPath === 'dashboard.html' ? 'active' : ''}">Dashboard</a></li>
      <li><a href="readings.html" class="${currentPath === 'readings.html' ? 'active' : ''}">Readings</a></li>
      <li><a href="billing.html" class="${currentPath === 'billing.html' ? 'active' : ''}">Bill Estimate</a></li>
      <li><a href="predictions.html" class="${currentPath === 'predictions.html' ? 'active' : ''}">Forecast & Patterns</a></li>
      <li><a href="devices.html" class="${currentPath === 'devices.html' ? 'active' : ''}">Devices</a></li>
      ${user.role === 'admin' ? `<li><a href="admin.html" class="${currentPath === 'admin.html' ? 'active' : ''}">Admin</a></li>` : ''}
      <li>
        <span style="font-size:0.85rem; color:var(--text-muted); margin-right:0.5rem;">${escapeHtml(user.fullName.split(' ')[0])} (${user.role === 'admin' ? 'Admin' : 'TN User'})</span>
        <button onclick="handleLogout()" class="btn btn-outline btn-sm">Logout</button>
      </li>
    `;
  } else {
    // Public / Visitor navigation
    navContainer.innerHTML = `
      <li><a href="index.html" class="${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">Home</a></li>
      <li><a href="login.html" class="${currentPath === 'login.html' ? 'active' : ''}">Login</a></li>
      <li><a href="register.html" class="btn-nav-auth ${currentPath === 'register.html' ? 'active' : ''}">Register</a></li>
    `;
  }
}

function checkProtectedPage() {
  const protectedPages = ['dashboard.html', 'readings.html', 'billing.html', 'predictions.html', 'devices.html', 'admin.html'];
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  const token = API.getToken();
  const user = API.getUser();

  if (protectedPages.includes(currentPath) && !token) {
    window.location.href = `login.html?redirect=${encodeURIComponent(currentPath)}`;
    return;
  }

  if (currentPath === 'admin.html' && user && user.role !== 'admin') {
    alert('Access restricted to administrators.');
    window.location.href = 'dashboard.html';
  }
}

function handleLogout() {
  API.clearSession();
  window.location.href = 'login.html?logged_out=true';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

async function populateDistrictDropdown(selectElementId, defaultDistrict = '') {
  const select = document.getElementById(selectElementId);
  if (!select) return;

  try {
    const res = await API.getDistricts();
    if (res.districts && res.districts.length > 0) {
      select.innerHTML = '<option value="">-- Select Tamil Nadu District --</option>';
      res.districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.districtName;
        opt.textContent = `${d.districtName} (${d.districtCode})`;
        if (defaultDistrict && d.districtName.toLowerCase() === defaultDistrict.toLowerCase()) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Failed to load districts:', err);
  }
}
