/**
 * Provision Store Simple Web POS & Billing System
 * Single-file Vanilla JavaScript Application
 * Features Editable Credentials, Auth, and Live Store Header
 */

// Initial Default Catalog Items
const DEFAULT_CATALOG = [
  { id: '1', name: 'Basmati Rice 5kg', price: 450 },
  { id: '2', name: 'Fresh Milk 1L', price: 60 },
  { id: '3', name: 'Cashew Nuts 250g', price: 220 },
  { id: '4', name: 'Tata Salt 1kg', price: 28 },
  { id: '5', name: 'Refined Oil 1L', price: 145 },
  { id: '6', name: 'Sugar 1kg', price: 44 },
];

const DEFAULT_STORE = {
  name: 'Sri Lakshmi Provision Store',
  subTitle: 'General & Provision Store',
  address: '45 Market Road, Electronic City, Bengaluru - Ph: 9876543210',
  phone: '9876543210',
};

const DEFAULT_CREDENTIALS = {
  email: 'owner@store.com',
  password: 'password123',
};

// Application Auth & State
let posCredentials = JSON.parse(localStorage.getItem('posCredentials')) || DEFAULT_CREDENTIALS;
let authState = JSON.parse(localStorage.getItem('posAuthState')) || {
  isAuthenticated: false,
  user: null,
};

let isRegisterMode = false;
let storeConfig = JSON.parse(localStorage.getItem('storeConfig')) || DEFAULT_STORE;
let catalog = JSON.parse(localStorage.getItem('catalogItems')) || DEFAULT_CATALOG;
let cart = []; // [{ item, quantity }]

// DOM Elements
const authScreen = document.getElementById('authScreen');
const mainPosContent = document.getElementById('mainPosContent');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubtitle = document.getElementById('authSubtitle');
const authHint = document.getElementById('authHint');
const btnSubmitAuth = document.getElementById('btnSubmitAuth');
const btnToggleRegister = document.getElementById('btnToggleRegister');
const txtUserBadge = document.getElementById('txtUserBadge');
const btnLogout = document.getElementById('btnLogout');

// Store Header Elements
const navStoreName = document.getElementById('navStoreName');
const navStoreAddress = document.getElementById('navStoreAddress');
const inlineStoreName = document.getElementById('inlineStoreName');
const inlineSubTitle = document.getElementById('inlineSubTitle');
const inlineAddress = document.getElementById('inlineAddress');

// POS Catalog & Form Elements
const quickAddForm = document.getElementById('quickAddForm');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const searchCatalog = document.getElementById('searchCatalog');
const productGrid = document.getElementById('productGrid');
const cartItemsList = document.getElementById('cartItemsList');
const txtSubtotal = document.getElementById('txtSubtotal');
const discountInput = document.getElementById('discountInput');
const txtGrandTotal = document.getElementById('txtGrandTotal');
const btnClearCart = document.getElementById('btnClearCart');
const btnCheckout = document.getElementById('btnCheckout');
const custNameInput = document.getElementById('custName');
const custPhoneInput = document.getElementById('custPhone');

// Receipt Modal
const receiptModal = document.getElementById('receiptModal');
const paperReceipt = document.getElementById('paperReceipt');
const btnCloseReceipt = document.getElementById('btnCloseReceipt');
const btnCloseReceiptFooter = document.getElementById('btnCloseReceiptFooter');
const btnPrintReceipt = document.getElementById('btnPrintReceipt');

// Settings Modal
const settingsModal = document.getElementById('settingsModal');
const btnOpenSettings = document.getElementById('btnOpenSettings');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnCancelSettings = document.getElementById('btnCancelSettings');
const settingsForm = document.getElementById('settingsForm');
const cfgStoreName = document.getElementById('cfgStoreName');
const cfgSubTitle = document.getElementById('cfgSubTitle');
const cfgStoreAddress = document.getElementById('cfgStoreAddress');
const cfgAuthEmail = document.getElementById('cfgAuthEmail');
const cfgAuthPassword = document.getElementById('cfgAuthPassword');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderAuthUI();
  initStoreConfigInputs();
  renderStoreHeader();
  renderCatalog();
  renderCart();

  // Auth Event Listeners
  authForm.addEventListener('submit', handleAuthSubmit);
  btnToggleRegister.addEventListener('click', toggleRegisterMode);
  btnLogout.addEventListener('click', handleLogout);

  // Inline Store Header Live Listeners
  inlineStoreName.addEventListener('input', handleInlineStoreUpdate);
  inlineSubTitle.addEventListener('input', handleInlineStoreUpdate);
  inlineAddress.addEventListener('input', handleInlineStoreUpdate);

  // POS Event Listeners
  quickAddForm.addEventListener('submit', handleQuickAdd);
  searchCatalog.addEventListener('input', (e) => renderCatalog(e.target.value));
  discountInput.addEventListener('input', updateCartTotals);
  btnClearCart.addEventListener('click', clearCart);
  btnCheckout.addEventListener('click', handleCheckout);

  // Settings Modal Events
  btnOpenSettings.addEventListener('click', openSettingsModal);
  btnCloseSettings.addEventListener('click', closeSettingsModal);
  btnCancelSettings.addEventListener('click', closeSettingsModal);
  settingsForm.addEventListener('submit', handleSaveSettings);

  // Receipt Modal Events
  btnCloseReceipt.addEventListener('click', closeReceiptModal);
  btnCloseReceiptFooter.addEventListener('click', closeReceiptModal);
  btnPrintReceipt.addEventListener('click', printReceipt);
});

// Toggle Login vs Register Mode
function toggleRegisterMode() {
  isRegisterMode = !isRegisterMode;
  if (isRegisterMode) {
    authSubtitle.innerText = 'Register new custom store login credentials';
    btnSubmitAuth.innerText = '✨ Register New Login & Enter Counter';
    btnToggleRegister.innerText = 'Already have credentials? Back to Sign In';
    authHint.innerHTML = '<span>Setting custom credentials for your store counter</span>';
  } else {
    authSubtitle.innerText = 'Sign in to your store billing counter';
    btnSubmitAuth.innerText = '🔓 Sign In to Billing Counter';
    btnToggleRegister.innerText = 'Need to change credentials or register new store?';
    authHint.innerHTML = `<span>Active Login: ${posCredentials.email}</span>`;
  }
}

// Authentication UI & Login Handlers
function renderAuthUI() {
  if (authState.isAuthenticated && authState.user) {
    authScreen.classList.add('hidden');
    mainPosContent.classList.remove('hidden');
    txtUserBadge.innerText = `👤 ${authState.user.name} (${authState.user.role})`;
  } else {
    authScreen.classList.remove('hidden');
    mainPosContent.classList.add('hidden');
    authEmail.value = posCredentials.email;
    authPassword.value = posCredentials.password;
    authHint.innerHTML = `<span>Active Login: ${posCredentials.email}</span>`;
  }
}

function handleAuthSubmit(e) {
  e.preventDefault();

  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  if (!email || !password) {
    showToast('Please enter both email and password.');
    return;
  }

  if (isRegisterMode) {
    // Save New Custom Credentials
    posCredentials = { email, password };
    localStorage.setItem('posCredentials', JSON.stringify(posCredentials));
    showToast('Custom login credentials created & saved!');
    isRegisterMode = false;
  } else {
    // Validate against Saved Credentials
    if (email.toLowerCase() !== posCredentials.email.toLowerCase() || password !== posCredentials.password) {
      showToast('❌ Invalid email or password. Try again.');
      return;
    }
  }

  // Create Authenticated Session
  const userName = email.split('@')[0] || 'Store Owner';
  authState = {
    isAuthenticated: true,
    user: {
      email,
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      role: 'Owner',
    },
  };

  localStorage.setItem('posAuthState', JSON.stringify(authState));
  renderAuthUI();
  showToast(`Welcome, ${authState.user.name}! Counter unlocked.`);
}

function handleLogout() {
  authState = {
    isAuthenticated: false,
    user: null,
  };
  localStorage.removeItem('posAuthState');
  renderAuthUI();
  showToast('Logged out of POS counter.');
}

// Toast Helper
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// Populate Store Config Inputs
function initStoreConfigInputs() {
  inlineStoreName.value = storeConfig.name || '';
  inlineSubTitle.value = storeConfig.subTitle || '';
  inlineAddress.value = storeConfig.address || '';
}

// Live Update Store Config on Typing
function handleInlineStoreUpdate() {
  storeConfig.name = inlineStoreName.value.trim() || 'My Provision Store';
  storeConfig.subTitle = inlineSubTitle.value.trim() || '';
  storeConfig.address = inlineAddress.value.trim() || 'Main Road, Bengaluru';

  localStorage.setItem('storeConfig', JSON.stringify(storeConfig));
  renderStoreHeader();
}

// Store Header Rendering
function renderStoreHeader() {
  navStoreName.innerText = storeConfig.name;
  navStoreAddress.innerText = `${storeConfig.subTitle ? storeConfig.subTitle + ' • ' : ''}${storeConfig.address}`;
}

// Catalog Rendering
function renderCatalog(searchFilter = '') {
  productGrid.innerHTML = '';

  const filterText = searchFilter.toLowerCase().trim();
  const filteredItems = catalog.filter((item) =>
    item.name.toLowerCase().includes(filterText)
  );

  if (filteredItems.length === 0) {
    productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">No products found.</p>`;
    return;
  }

  filteredItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-title">${escapeHtml(item.name)}</div>
      <div class="product-price-row">
        <span class="product-price">₹${item.price.toFixed(2)}</span>
        <button class="btn-add-item">+ Add</button>
      </div>
    `;

    card.addEventListener('click', () => addToCart(item));
    productGrid.appendChild(card);
  });
}

// Handle Quick Add Product
function handleQuickAdd(e) {
  e.preventDefault();

  const name = itemNameInput.value.trim();
  const price = parseFloat(itemPriceInput.value);

  if (!name || isNaN(price) || price <= 0) {
    showToast('Please enter valid product name and price.');
    return;
  }

  const newItem = {
    id: 'item_' + Date.now(),
    name,
    price,
  };

  catalog.unshift(newItem);
  localStorage.setItem('catalogItems', JSON.stringify(catalog));

  // Automatically add to cart as well for speed
  addToCart(newItem);

  // Reset form
  itemNameInput.value = '';
  itemPriceInput.value = '';
  renderCatalog();
  showToast(`Added "${name}" to catalog & cart!`);
}

// Cart Operations
function addToCart(item) {
  const existing = cart.find((c) => c.item.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ item, quantity: 1 });
  }
  renderCart();
  showToast(`Added ${item.name}`);
}

function updateQty(itemId, change) {
  const index = cart.findIndex((c) => c.item.id === itemId);
  if (index > -1) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
  }
  renderCart();
}

function removeFromCart(itemId) {
  cart = cart.filter((c) => c.item.id !== itemId);
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
  showToast('Cart cleared.');
}

// Render Cart List & Totals
function renderCart() {
  cartItemsList.innerHTML = '';

  if (cart.length === 0) {
    cartItemsList.innerHTML = `<p style="text-align: center; color: #64748b; padding: 40px 0;">Cart is empty. Tap items on the left to add.</p>`;
    txtSubtotal.innerText = '₹0.00';
    txtGrandTotal.innerText = '₹0';
    return;
  }

  cart.forEach(({ item, quantity }) => {
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    const itemTotal = item.price * quantity;

    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-price">₹${item.price.toFixed(2)} × ${quantity} = ₹${itemTotal.toFixed(2)}</div>
      </div>
      <div class="stepper">
        <button class="btn-step btn-minus">-</button>
        <span class="qty-val">${quantity}</span>
        <button class="btn-step btn-plus">+</button>
        <button class="btn-remove">&times;</button>
      </div>
    `;

    row.querySelector('.btn-minus').addEventListener('click', () => updateQty(item.id, -1));
    row.querySelector('.btn-plus').addEventListener('click', () => updateQty(item.id, 1));
    row.querySelector('.btn-remove').addEventListener('click', () => removeFromCart(item.id));

    cartItemsList.appendChild(row);
  });

  updateCartTotals();
}

function updateCartTotals() {
  let subtotal = 0;
  cart.forEach(({ item, quantity }) => {
    subtotal += item.price * quantity;
  });

  const discount = Math.max(0, parseFloat(discountInput.value) || 0);
  const grandTotal = Math.max(0, Math.round(subtotal - discount));

  txtSubtotal.innerText = `₹${subtotal.toFixed(2)}`;
  txtGrandTotal.innerText = `₹${grandTotal}`;
}

// Checkout & Dynamic Store Receipt Generation
function handleCheckout() {
  if (cart.length === 0) {
    showToast('Cart is empty! Add items before checkout.');
    return;
  }

  const receiptNo = 'RCP' + Math.floor(1000 + Math.random() * 9000);
  const today = new Date();
  const dateStr = String(today.getDate()).padStart(2, '0') + '/' + String(today.getMonth() + 1).padStart(2, '0') + '/' + today.getFullYear();
  
  const custName = custNameInput.value.trim() || 'manu';
  const custPhone = custPhoneInput.value.trim() || '7584628451';
  const paymentMode = document.querySelector('input[name="paymentMode"]:checked').value;

  let subtotal = 0;
  let itemsRowsHtml = '';

  cart.forEach(({ item, quantity }) => {
    const lineTotal = item.price * quantity;
    subtotal += lineTotal;
    itemsRowsHtml += `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td style="text-align: center;">${quantity}</td>
        <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="text-align: right;">₹${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  });

  const discount = Math.max(0, parseFloat(discountInput.value) || 0);
  const grandTotal = Math.max(0, Math.round(subtotal - discount));

  // Build Dynamic Reference Receipt HTML Layout
  const receiptHtml = `
    <div class="rcpt-header">
      <div class="rcpt-title">${escapeHtml(storeConfig.name)}</div>
      ${storeConfig.subTitle ? `<div class="rcpt-subtitle">${escapeHtml(storeConfig.subTitle)}</div>` : ''}
      <div class="rcpt-address">${escapeHtml(storeConfig.address)}</div>
    </div>

    <div class="rcpt-meta-row">
      <span>Receipt No: ${receiptNo}</span>
      <span>Date: ${dateStr}</span>
    </div>

    <div class="rcpt-details-list">
      <div class="rcpt-detail-item">
        <span class="rcpt-label">Customer Name:</span>
        <span class="rcpt-val">${escapeHtml(custName)}</span>
      </div>
      <div class="rcpt-detail-item">
        <span class="rcpt-label">Phone:</span>
        <span class="rcpt-val">${escapeHtml(custPhone)}</span>
      </div>

      <table class="rcpt-items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>

      <div class="rcpt-detail-item" style="margin-top: 10px;">
        <span class="rcpt-label">Total Bill:</span>
        <span class="rcpt-val-bold">₹${subtotal.toFixed(2)}</span>
      </div>
      ${discount > 0 ? `
      <div class="rcpt-detail-item">
        <span class="rcpt-label">Discount:</span>
        <span class="rcpt-val" style="color: #ef4444;">-₹${discount.toFixed(2)}</span>
      </div>` : ''}
      <div class="rcpt-detail-item" style="margin-top: 6px;">
        <span class="rcpt-label">Balance Settled (${paymentMode}):</span>
        <span class="rcpt-val-bold">₹${grandTotal}</span>
      </div>
    </div>
  `;

  paperReceipt.innerHTML = receiptHtml;
  receiptModal.classList.remove('hidden');
}

function printReceipt() {
  window.print();
}

function closeReceiptModal() {
  receiptModal.classList.add('hidden');
  clearCart();
  custNameInput.value = '';
  custPhoneInput.value = '';
  discountInput.value = '0';
}

// Settings Modal Handler
function openSettingsModal() {
  cfgStoreName.value = storeConfig.name;
  cfgSubTitle.value = storeConfig.subTitle || '';
  cfgStoreAddress.value = storeConfig.address;
  cfgAuthEmail.value = posCredentials.email;
  cfgAuthPassword.value = posCredentials.password;
  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

function handleSaveSettings(e) {
  e.preventDefault();

  // Save Store Header
  storeConfig = {
    name: cfgStoreName.value.trim(),
    subTitle: cfgSubTitle.value.trim(),
    address: cfgStoreAddress.value.trim(),
  };
  localStorage.setItem('storeConfig', JSON.stringify(storeConfig));

  // Save New Credentials if provided
  const newEmail = cfgAuthEmail.value.trim();
  const newPassword = cfgAuthPassword.value.trim();
  if (newEmail && newPassword) {
    posCredentials = { email: newEmail, password: newPassword };
    localStorage.setItem('posCredentials', JSON.stringify(posCredentials));

    // Update active user session
    if (authState.user) {
      const userName = newEmail.split('@')[0] || 'Store Owner';
      authState.user.email = newEmail;
      authState.user.name = userName.charAt(0).toUpperCase() + userName.slice(1);
      localStorage.setItem('posAuthState', JSON.stringify(authState));
    }
  }

  initStoreConfigInputs();
  renderStoreHeader();
  renderAuthUI();
  closeSettingsModal();
  showToast('Store details & login credentials saved successfully!');
}

// Escape HTML Utility
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[m];
  });
}
