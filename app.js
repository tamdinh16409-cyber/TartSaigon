// State management key for localStorage
const STATE_KEY = 'tart_coffee_state';

// Initial default state (if localStorage is empty)
const defaultState = {
    menu: [
        { id: 1, name: "Cà Phê Sữa Đá", category: "coffee", price: 40000, rating: 4.8, description: "Cà phê phin truyền thống pha sữa đặc thơm béo, uống đá mát lạnh.", available: true, icon: "fa-solid fa-mug-hot", image: "img2/Cà phê sữa đá.jpg" },
        { id: 2, name: "Cappuccino", category: "coffee", price: 50000, rating: 4.9, description: "Espresso kết hợp sữa nóng và lớp bọt sữa mịn nghệ thuật.", available: true, icon: "fa-solid fa-mug-hot", image: "img2/Cappuccino nóng.jpg" },
        { id: 3, name: "Trà Sữa Oolong", category: "tea", price: 45000, rating: 4.7, description: "Trà oolong đậm vị hòa quyện cùng sữa tươi thơm ngon.", available: true, icon: "fa-solid fa-whiskey-glass", image: "img2/Trà sữa Oolong.jpg" },
        { id: 4, name: "Trà Dâu Ổi Hồng", category: "tea", price: 50000, rating: 4.6, description: "Trà trái cây vị dâu ổi tươi mát, thanh ngọt giải nhiệt.", available: true, icon: "fa-solid fa-glass-water", image: "img2/Trà Dâu Ổi hồng.jpg" },
        { id: 5, name: "Croissant Bơ Tỏi", category: "pastry", price: 35000, rating: 4.5, description: "Bánh croissant ngàn lớp giòn tan, thơm lừng bơ tỏi đặc biệt.", available: true, icon: "fa-solid fa-bread-slice", image: "img2/Croissant Bơ Tỏi.jpg" },
        { id: 6, name: "Bánh Tart Trứng", category: "pastry", price: 28000, rating: 4.9, description: "Bánh tart trứng vỏ giòn xốp, nhân kem trứng vàng mịn thơm.", available: true, icon: "fa-solid fa-cookie", image: "img2/Bánh Tart Trứng.jpg" }
    ],
    orders: [
        {
            id: "ORD-9281",
            customerName: "Nguyễn Văn A",
            items: [
                { id: 1, name: "Cà Phê Sữa Đá", price: 40000, qty: 1, size: "M", ice: "100%", sugar: "100%", toppings: [] }
            ],
            fulfillment: "pickup",
            address: "",
            paymentMethod: "wallet",
            subtotal: 40000,
            discount: 0,
            deliveryFee: 0,
            total: 40000,
            status: "ready", // pending, brewing, ready, delivering, delivered
            timestamp: new Date(Date.now() - 30 * 60000).toLocaleString("vi-VN"),
            paymentStatus: "paid"
        },
        {
            id: "ORD-7362",
            customerName: "Nguyễn Văn A",
            items: [
                { id: 3, name: "Trà Sữa Oolong", price: 45000, qty: 2, size: "L", ice: "50%", sugar: "50%", toppings: ["Trân châu trắng"] }
            ],
            fulfillment: "delivery",
            address: "123 Nguyễn Trãi, Quận 1, TPHCM",
            paymentMethod: "gateway",
            subtotal: 100000,
            discount: 20000,
            deliveryFee: 15000,
            total: 95000,
            status: "delivered",
            timestamp: new Date(Date.now() - 120 * 60000).toLocaleString("vi-VN"),
            paymentStatus: "paid"
        }
    ],
    user: {
        name: "Nguyễn Văn A",
        username: "khachhang",
        wallet: 200000,
        points: 120,
        favorites: [1, 3],
        vouchers: [
            { code: "TARTWELCOME", discount: 20000, desc: "Giảm 20k cho đơn đầu tiên" },
            { code: "TART50", discount: 50000, desc: "Giảm 50k cho đơn từ 150k" }
        ]
    },
    inventory: {
        coffee: 85,
        milk: 90,
        syrup: 70
    },
    staff: [
        { name: "Trần Thị C (Barista)", role: "Barista", status: "online" },
        { name: "Phạm Văn D (Admin)", role: "Admin", status: "online" }
    ],
    promotions: [
        { code: "TARTWELCOME", discount: 20000, desc: "Giảm 20k cho đơn đầu tiên" },
        { code: "TART50", discount: 50000, desc: "Giảm 50k cho đơn từ 150k" }
    ],
    currentUserRole: "barista", // Default view for index.html operations
    currentSessionUser: {
        name: "Trần Thị C (Barista)",
        username: "barista",
        role: "barista"
    },
    pendingGatewayOrder: null,
    pendingRechargeAmount: 0
};

// Global variables
let state = {};
let activeDeliveryOrder = null;

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();

    // Listen to changes in other tabs (e.g. customer places order!)
    window.addEventListener('storage', (e) => {
        if (e.key === STATE_KEY) {
            loadStateFromStorage();
            refreshCurrentRoleView();
        }
    });
});

// Setup data from LocalStorage
function initApp() {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
        try {
            state = JSON.parse(savedState);
            // Ensure runtime values are reset
            state.pendingGatewayOrder = state.pendingGatewayOrder || null;
            state.pendingRechargeAmount = state.pendingRechargeAmount || 0;
            // Migrate menu fields from defaultState (name, description, image, price)
            defaultState.menu.forEach(defaultItem => {
                const stateItem = state.menu && state.menu.find(i => i.id === defaultItem.id);
                if (stateItem) {
                    stateItem.name = defaultItem.name;
                    stateItem.description = defaultItem.description;
                    stateItem.image = defaultItem.image;
                    stateItem.price = defaultItem.price;
                }
            });
        } catch (e) {
            console.error("Error parsing localStorage state, resetting...", e);
            state = JSON.parse(JSON.stringify(defaultState));
        }
    } else {
        state = JSON.parse(JSON.stringify(defaultState));
    }
    
    saveState();

    // Check if redirect query parameter exists (e.g. ?role=payment)
    const urlParams = new URLSearchParams(window.location.search);
    const queryRole = urlParams.get('role');
    
    if (queryRole) {
        // Log in session quickly if payment role is chosen
        if (queryRole === 'payment') {
            state.currentSessionUser = { name: "Cổng thanh toán", username: "pay", role: "payment" };
        }
        switchRole(queryRole);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        switchRole(state.currentUserRole || 'barista');
    }
}

// Save state to LocalStorage
function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadStateFromStorage() {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
        state = JSON.parse(savedState);
    }
}

// Refresh current active operations panel
function refreshCurrentRoleView() {
    const role = state.currentUserRole;
    renderUserStatusWidget();
    
    if (role === 'barista') {
        renderBaristaQueue();
        renderBaristaInventory();
    } else if (role === 'admin') {
        renderAdminDashboard();
    } else if (role === 'delivery') {
        renderDeliveryPortal();
    } else if (role === 'payment') {
        renderPaymentGateway();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Role switcher buttons
    document.querySelectorAll('.role-btn[data-role]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const role = e.currentTarget.getAttribute('data-role');
            handleRoleSwitchClick(role);
        });
    });
}

// Handle role click and check login inclusion
function handleRoleSwitchClick(targetRole) {
    if (state.currentSessionUser.role !== targetRole && targetRole !== 'payment') {
        openLoginModal(targetRole);
    } else {
        switchRole(targetRole);
    }
}

// Switch UI Roles
function switchRole(role) {
    state.currentUserRole = role;
    saveState();

    // Toggle button active state
    document.querySelectorAll('.role-btn[data-role]').forEach(btn => {
        if (btn.getAttribute('data-role') === role) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Hide all views, show active one
    document.querySelectorAll('.portal-view').forEach(view => {
        view.classList.remove('active');
        view.style.opacity = 0;
    });

    const targetView = document.getElementById(`${role}-view`);
    if (targetView) {
        targetView.classList.add('active');
        setTimeout(() => {
            targetView.style.opacity = 1;
        }, 50);
    }

    refreshCurrentRoleView();
}

// Render user session widget
function renderUserStatusWidget() {
    const widget = document.getElementById('user-status-widget');
    if (!widget) return;

    widget.innerHTML = `
        <div class="status-badge">
            <div class="status-dot"></div>
            <span>Bộ phận: ${state.currentSessionUser.name} (${state.currentSessionUser.role.toUpperCase()})</span>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="logoutSession()"><i class="fa-solid fa-sign-out-alt"></i> Đăng xuất</button>
    `;
}

// Open Login Modal
function openLoginModal(targetRole) {
    const modal = document.getElementById('login-modal');
    modal.classList.add('active');
    modal.setAttribute('data-target-role', targetRole);
    
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
}

// Close modal
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Autofill logins
function autofillLogin(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
}

// Handle Login Submission
function handleLoginSubmit(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const modal = document.getElementById('login-modal');
    const targetRole = modal.getAttribute('data-target-role') || 'barista';

    let success = false;

    if (username === 'barista' && targetRole === 'barista') {
        state.currentSessionUser = {
            name: "Trần Thị C (Barista)",
            username: 'barista',
            role: 'barista'
        };
        success = true;
    } else if (username === 'admin' && targetRole === 'admin') {
        state.currentSessionUser = {
            name: "Phạm Văn D (Admin)",
            username: 'admin',
            role: 'admin'
        };
        success = true;
    } else {
        if (targetRole === 'barista') {
            state.currentSessionUser = { name: "Trần Thị C (Barista)", username: 'barista', role: 'barista' };
            success = true;
        } else if (targetRole === 'admin') {
            state.currentSessionUser = { name: "Phạm Văn D (Admin)", username: 'admin', role: 'admin' };
            success = true;
        } else if (targetRole === 'delivery') {
            state.currentSessionUser = { name: "Đối tác giao hàng", username: 'shipper', role: 'delivery' };
            success = true;
        }
    }

    if (success) {
        showToast("Đăng nhập thành công!", "success");
        closeModal('login-modal');
        switchRole(targetRole);
    } else {
        showToast("Thông tin đăng nhập sai lệch cho vai trò này.", "error");
    }
}

// Log out session
function logoutSession() {
    state.currentSessionUser = {
        name: "Guest Staff",
        username: "guest_staff",
        role: "barista"
    };
    saveState();
    showToast("Đã đăng xuất tài khoản vận hành.", "success");
    switchRole('barista');
}

// =========================================
// BARISTA / POS PORTAL LOGIC
// =========================================

function renderBaristaQueue() {
    const listPending = document.getElementById('list-pending');
    const listBrewing = document.getElementById('list-brewing');
    const listReady = document.getElementById('list-ready');

    if (!listPending || !listBrewing || !listReady) return;

    listPending.innerHTML = '';
    listBrewing.innerHTML = '';
    listReady.innerHTML = '';

    let countP = 0, countB = 0, countR = 0;

    state.orders.forEach(order => {
        if (order.status === 'delivered') return;

        let itemsLines = '';
        order.items.forEach(i => {
            const opts = `(${i.size}, ${i.ice} đá, ${i.sugar} đường${i.toppings.length > 0 ? ', + ' + i.toppings.join(', ') : ''})`;
            itemsLines += `<li>- <strong>${i.qty}x ${i.name}</strong> <small style="color:var(--color-primary);">${opts}</small></li>`;
        });

        const showFulfillment = order.fulfillment === 'pickup' ? 'Tự nhận' : 'Giao hàng';
        
        let actionBtn = '';
        if (order.status === 'pending') {
            countP++;
            actionBtn = `<button class="btn btn-sm btn-accent" onclick="updateOrderStatus('${order.id}', 'brewing')">Bắt đầu pha chế <i class="fa-solid fa-mug-hot"></i></button>`;
        } else if (order.status === 'brewing') {
            countB++;
            actionBtn = `<button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${order.id}', 'ready')">Hoàn thành <i class="fa-solid fa-check"></i></button>`;
        } else if (order.status === 'ready') {
            countR++;
            if (order.fulfillment === 'pickup') {
                actionBtn = `<button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${order.id}', 'delivered')">Đã nhận <i class="fa-solid fa-handshake"></i></button>`;
            } else {
                actionBtn = `<small class="text-accent" style="font-weight:700;"><i class="fa-solid fa-clock"></i> Chờ shiper nhận đơn</small>`;
            }
        } else if (order.status === 'delivering') {
            countR++;
            actionBtn = `<small class="text-primary" style="font-weight:700;"><i class="fa-solid fa-truck-ramp-box"></i> Đang đi giao...</small>`;
        }

        const cardHtml = `
            <div class="order-card">
                <div class="order-card-header">
                    <span>Mã: ${order.id}</span>
                    <span class="text-accent">${showFulfillment}</span>
                </div>
                <div class="order-card-items">
                    <ul>
                        ${itemsLines}
                    </ul>
                </div>
                <div class="order-card-customer">
                    <strong>Khách hàng:</strong> ${order.customerName}<br>
                    ${order.address ? `<strong>Đ/C:</strong> ${order.address}` : ''}
                </div>
                <div class="order-card-footer">
                    <span class="order-price">${order.total.toLocaleString('vi-VN')}đ</span>
                    ${actionBtn}
                </div>
            </div>
        `;

        if (order.status === 'pending') {
            listPending.innerHTML += cardHtml;
        } else if (order.status === 'brewing') {
            listBrewing.innerHTML += cardHtml;
        } else if (order.status === 'ready' || order.status === 'delivering') {
            listReady.innerHTML += cardHtml;
        }
    });

    document.getElementById('count-pending').textContent = countP;
    document.getElementById('count-brewing').textContent = countB;
    document.getElementById('count-ready').textContent = countR;
}

function updateOrderStatus(orderId, newStatus) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = newStatus;
    
    if (newStatus === 'brewing') {
        state.inventory.coffee = Math.max(0, state.inventory.coffee - 5);
        state.inventory.milk = Math.max(0, state.inventory.milk - 4);
        state.inventory.syrup = Math.max(0, state.inventory.syrup - 3);
    }

    saveState();
    renderBaristaQueue();
    renderBaristaInventory();
    showToast(`Đã chuyển đơn ${orderId} sang trạng thái: ${translateStatus(newStatus)}`, "success");
}

function renderBaristaInventory() {
    document.getElementById('inv-coffee').style.width = `${state.inventory.coffee}%`;
    document.getElementById('inv-coffee-label').textContent = `${state.inventory.coffee}%`;
    
    document.getElementById('inv-milk').style.width = `${state.inventory.milk}%`;
    document.getElementById('inv-milk-label').textContent = `${state.inventory.milk}%`;
    
    document.getElementById('inv-syrup').style.width = `${state.inventory.syrup}%`;
    document.getElementById('inv-syrup-label').textContent = `${state.inventory.syrup}%`;

    const list = document.getElementById('barista-stock-list');
    if (!list) return;

    let listHtml = '';
    state.menu.forEach(item => {
        const checked = item.available ? 'checked' : '';
        listHtml += `
            <div class="stock-toggle-item">
                <div class="stock-toggle-info">
                    <h5>${item.name}</h5>
                    <span>Giá: ${item.price.toLocaleString('vi-VN')}đ</span>
                </div>
                <label class="switch">
                    <input type="checkbox" ${checked} onchange="toggleItemStock(${item.id}, this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `;
    });
    list.innerHTML = listHtml;
}

function toggleItemStock(itemId, isAvailable) {
    const item = state.menu.find(i => i.id === itemId);
    if (item) {
        item.available = isAvailable;
        saveState();
        showToast(`Đã cập nhật trạng thái món ${item.name} thành: ${isAvailable ? 'Còn hàng' : 'Hết hàng'}`, "success");
    }
}

function translateStatus(status) {
    const table = {
        'pending': 'Chờ pha chế',
        'brewing': 'Đang pha chế',
        'ready': 'Sẵn sàng nhận',
        'delivering': 'Đang giao hàng',
        'delivered': 'Đã giao'
    };
    return table[status] || status;
}

// =========================================
// ADMIN PORTAL LOGIC
// =========================================

// =========================================
// BARISTA POS SYSTEM
// =========================================

let posCart = [];
let posSelectedCategory = 'all';
let posPaymentMethod = 'cash';

function switchBaristaTab(tab) {
    document.querySelectorAll('.barista-tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tab));
    document.getElementById('barista-queue-tab').style.display = tab === 'queue' ? '' : 'none';
    document.getElementById('barista-pos-tab').style.display  = tab === 'pos'   ? '' : 'none';
    if (tab === 'pos') { renderPOSMenu(); renderPosCart(); }
}

function filterPosMenu(btn, category) {
    posSelectedCategory = category;
    document.querySelectorAll('.pos-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPOSMenu();
}

function renderPOSMenu() {
    const grid = document.getElementById('pos-menu-grid');
    if (!grid) return;
    const items = state.menu.filter(i => i.available && (posSelectedCategory === 'all' || i.category === posSelectedCategory));
    if (!items.length) { grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:30px;color:rgba(255,255,255,0.4);">Không có món nào.</p>`; return; }
    grid.innerHTML = items.map(item => `
        <div class="pos-menu-item" onclick="addToPosCart(${item.id})">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" class="pos-item-img">` : `<div class="pos-item-img pos-item-icon"><i class="${item.icon}"></i></div>`}
            <div class="pos-item-name">${item.name}</div>
            <div class="pos-item-price">${item.price.toLocaleString('vi-VN')}đ</div>
        </div>
    `).join('');
}

function addToPosCart(itemId) {
    const item = state.menu.find(i => i.id === itemId);
    if (!item) return;
    const ex = posCart.find(c => c.id === itemId);
    if (ex) { ex.qty++; } else { posCart.push({ id: item.id, name: item.name, price: item.price, qty: 1 }); }
    renderPosCart();
    showToast(`Đã thêm ${item.name}`, 'success');
}

function renderPosCart() {
    const list = document.getElementById('pos-cart-items');
    const footer = document.getElementById('pos-cart-summary');
    if (!list) return;
    if (!posCart.length) {
        list.innerHTML = `<div class="pos-empty-cart"><i class="fa-solid fa-mug-hot"></i><p>Chọn món bên trái để thêm</p></div>`;
        if (footer) footer.style.display = 'none';
        return;
    }
    let total = 0;
    list.innerHTML = posCart.map((item, idx) => {
        const sub = item.price * item.qty; total += sub;
        return `
        <div class="pos-cart-row">
            <span class="pos-cart-name">${item.name}</span>
            <div class="pos-cart-qty">
                <button onclick="changePosQty(${idx},-1)">−</button>
                <span>${item.qty}</span>
                <button onclick="changePosQty(${idx},1)">+</button>
            </div>
            <span class="pos-cart-price">${sub.toLocaleString('vi-VN')}đ</span>
        </div>`;
    }).join('');
    document.getElementById('pos-total').textContent = `${total.toLocaleString('vi-VN')}đ`;
    if (footer) footer.style.display = 'block';
}

function changePosQty(idx, delta) {
    posCart[idx].qty += delta;
    if (posCart[idx].qty <= 0) posCart.splice(idx, 1);
    renderPosCart();
}

function clearPosCart() {
    posCart = [];
    const n = document.getElementById('pos-customer-name');
    if (n) n.value = '';
    renderPosCart();
}

function openPosPaymentModal() {
    if (!posCart.length) { showToast('Giỏ hàng trống!', 'error'); return; }
    const total = posCart.reduce((s, i) => s + i.price * i.qty, 0);
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById('pos-pay-amount').textContent = `${total.toLocaleString('vi-VN')}đ`;
    document.getElementById('pos-cash-received').value = '';
    document.getElementById('pos-change-display').style.display = 'none';
    document.getElementById('pos-bank-ref').textContent = `TART ${orderId}`;
    const modal = document.getElementById('pos-payment-modal');
    modal.setAttribute('data-total', total);
    modal.setAttribute('data-order-id', orderId);
    selectPosPayMethod(document.querySelector('.pos-pay-method-btn[data-method="cash"]'), 'cash');
    modal.classList.add('active');
}

function selectPosPayMethod(btn, method) {
    posPaymentMethod = method;
    document.querySelectorAll('.pos-pay-method-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    ['cash','atm','bank'].forEach(m => {
        document.getElementById(`pos-pay-${m}-panel`).style.display = m === method ? 'block' : 'none';
    });
}

function calcChange() {
    const modal = document.getElementById('pos-payment-modal');
    const total = parseInt(modal.getAttribute('data-total')) || 0;
    const received = parseInt(document.getElementById('pos-cash-received').value) || 0;
    const changeEl = document.getElementById('pos-change-display');
    if (received > 0) {
        changeEl.style.display = 'flex';
        const change = received - total;
        const amtEl = document.getElementById('pos-change-amount');
        amtEl.textContent = `${Math.max(0, change).toLocaleString('vi-VN')}đ`;
        amtEl.style.color = change < 0 ? 'var(--color-danger)' : 'var(--color-success)';
    } else {
        changeEl.style.display = 'none';
    }
}

function completePosPayment() {
    const modal = document.getElementById('pos-payment-modal');
    const total = parseInt(modal.getAttribute('data-total')) || 0;
    const orderId = modal.getAttribute('data-order-id');
    if (posPaymentMethod === 'cash') {
        const received = parseInt(document.getElementById('pos-cash-received').value) || 0;
        if (received < total) { showToast('Số tiền nhận chưa đủ!', 'error'); return; }
    }
    const customerName = (document.getElementById('pos-customer-name').value.trim()) || 'Khách vãng lai';
    const received = posPaymentMethod === 'cash' ? (parseInt(document.getElementById('pos-cash-received').value) || total) : total;
    const newOrder = {
        id: orderId, customerName,
        items: posCart.map(i => ({ ...i, size: 'M', ice: '100%', sugar: '100%', toppings: [] })),
        fulfillment: 'pickup', address: '',
        paymentMethod: posPaymentMethod,
        subtotal: total, discount: 0, deliveryFee: 0, total,
        status: 'delivered', timestamp: new Date().toLocaleString('vi-VN'), paymentStatus: 'paid'
    };
    state.orders.push(newOrder);
    saveState();
    closeModal('pos-payment-modal');
    showPosInvoice(newOrder, received);
}

function showPosInvoice(order, received) {
    const methodLabel = { cash: 'Tiền mặt', atm: 'Thẻ ATM', bank: 'Chuyển khoản ngân hàng' };
    const change = order.paymentMethod === 'cash' ? received - order.total : 0;
    const rows = order.items.map(i => `
        <tr>
            <td style="text-align:left;padding:4px 0;">${i.name}</td>
            <td style="text-align:center;">x${i.qty}</td>
            <td style="text-align:right;">${(i.price*i.qty).toLocaleString('vi-VN')}đ</td>
        </tr>`).join('');
    document.getElementById('pos-invoice-content').innerHTML = `
        <div class="pos-invoice-paper">
            <div class="invoice-logo" style="font-size:18px;margin-bottom:4px;"><i class="fa-solid fa-mug-hot"></i> TART COFFEE</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);">Hóa đơn bán hàng (POS)</div>
            <div class="pos-inv-divider"></div>
            <div style="font-size:12px;line-height:1.8;text-align:left;">
                <div>Mã HĐ: <strong style="color:var(--color-primary);">${order.id}</strong></div>
                <div>Thời gian: ${order.timestamp}</div>
                <div>Khách hàng: ${order.customerName}</div>
                <div>Thu ngân: ${state.currentSessionUser.name}</div>
            </div>
            <div class="pos-inv-divider"></div>
            <table style="width:100%;font-size:12px;border-collapse:collapse;">
                <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                    <th style="text-align:left;padding-bottom:6px;">Món</th>
                    <th style="text-align:center;">SL</th>
                    <th style="text-align:right;">Tiền</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="pos-inv-divider"></div>
            <div style="font-size:13px;line-height:2;">
                <div style="display:flex;justify-content:space-between;"><span>Tổng tiền</span><strong>${order.total.toLocaleString('vi-VN')}đ</strong></div>
                <div style="display:flex;justify-content:space-between;"><span>Thanh toán</span><span>${methodLabel[order.paymentMethod]||order.paymentMethod}</span></div>
                ${order.paymentMethod==='cash'?`
                <div style="display:flex;justify-content:space-between;"><span>Tiền nhận</span><span>${received.toLocaleString('vi-VN')}đ</span></div>
                <div style="display:flex;justify-content:space-between;color:var(--color-accent);"><span>Tiền thối</span><strong>${change.toLocaleString('vi-VN')}đ</strong></div>`:''}
            </div>
            <div class="pos-inv-divider"></div>
            <div style="text-align:center;font-size:10px;color:rgba(255,255,255,0.4);">Cảm ơn quý khách! Hẹn gặp lại.<br>Tart Saigon Coffee · 8AM – 10PM</div>
        </div>`;
    document.getElementById('pos-invoice-modal').classList.add('active');
    showToast(`Thanh toán thành công! ${order.id}`, 'success');
    renderBaristaQueue();
}

function resetPos() {
    posCart = [];
    const n = document.getElementById('pos-customer-name');
    if (n) n.value = '';
    renderPosCart();
}

// =========================================
// ADMIN MENU MANAGEMENT (CRUD)
// =========================================

let menuItemCurrentImage = '';

function renderAdminMenuList() {
    const list = document.getElementById('admin-menu-list');
    if (!list) return;

    const catLabel = { coffee: 'Cà phê', tea: 'Trà trái cây', pastry: 'Bánh ngọt' };

    let html = '';
    state.menu.forEach(item => {
        const imgHtml = item.image
            ? `<img src="${item.image}" alt="${item.name}" class="admin-menu-thumb">`
            : `<div class="admin-menu-thumb admin-menu-thumb-icon"><i class="${item.icon}"></i></div>`;

        html += `
            <div class="admin-menu-row">
                ${imgHtml}
                <div class="admin-menu-row-info">
                    <strong>${item.name}</strong>
                    <span>${catLabel[item.category] || item.category} · ${item.price.toLocaleString('vi-VN')}đ · <i class="fa-solid fa-star" style="color:var(--color-accent);font-size:10px;"></i> ${item.rating}</span>
                </div>
                <span class="badge-status ${item.available ? 'badge-available' : 'badge-unavailable'}">${item.available ? 'Còn hàng' : 'Hết hàng'}</span>
                <div class="admin-menu-row-actions">
                    <button class="btn btn-sm btn-primary-outline" onclick="openMenuItemModal(${item.id})"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id})"><i class="fa-solid fa-trash-can"></i> Xóa</button>
                </div>
            </div>
        `;
    });

    list.innerHTML = html || `<p style="text-align:center;padding:20px;color:rgba(255,255,255,0.4);">Thực đơn trống.</p>`;
}

function openMenuItemModal(itemId = null) {
    menuItemCurrentImage = '';

    document.getElementById('menu-item-id').value = '';
    document.getElementById('menu-item-name').value = '';
    document.getElementById('menu-item-category').value = 'coffee';
    document.getElementById('menu-item-price').value = '';
    document.getElementById('menu-item-rating').value = '4.5';
    document.getElementById('menu-item-desc').value = '';
    document.getElementById('menu-item-img-upload').value = '';
    document.getElementById('menu-img-preview').innerHTML = `
        <i class="fa-solid fa-image" style="font-size:36px; color:var(--color-primary);"></i>
        <span style="display:block;margin-top:8px;font-size:12px;color:var(--color-text-muted);">Chưa có ảnh</span>
    `;

    if (itemId) {
        const item = state.menu.find(i => i.id === itemId);
        if (!item) return;
        document.getElementById('menu-modal-title').textContent = 'Chỉnh sửa món';
        document.getElementById('menu-item-id').value = item.id;
        document.getElementById('menu-item-name').value = item.name;
        document.getElementById('menu-item-category').value = item.category;
        document.getElementById('menu-item-price').value = item.price;
        document.getElementById('menu-item-rating').value = item.rating;
        document.getElementById('menu-item-desc').value = item.description || '';
        if (item.image) {
            menuItemCurrentImage = item.image;
            document.getElementById('menu-img-preview').innerHTML =
                `<img src="${item.image}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
        }
    } else {
        document.getElementById('menu-modal-title').textContent = 'Thêm món mới';
    }

    document.getElementById('menu-item-modal').classList.add('active');
}

function handleMenuImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        menuItemCurrentImage = e.target.result;
        document.getElementById('menu-img-preview').innerHTML =
            `<img src="${menuItemCurrentImage}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
    };
    reader.readAsDataURL(file);
}

function saveMenuItem(event) {
    event.preventDefault();
    const idVal = document.getElementById('menu-item-id').value;
    const name = document.getElementById('menu-item-name').value.trim();
    const category = document.getElementById('menu-item-category').value;
    const price = parseInt(document.getElementById('menu-item-price').value);
    const rating = parseFloat(document.getElementById('menu-item-rating').value);
    const description = document.getElementById('menu-item-desc').value.trim();
    const iconMap = { coffee: 'fa-solid fa-mug-hot', tea: 'fa-solid fa-whiskey-glass', pastry: 'fa-solid fa-cookie' };

    if (idVal) {
        const item = state.menu.find(i => i.id === parseInt(idVal));
        if (item) {
            item.name = name;
            item.category = category;
            item.price = price;
            item.rating = rating;
            item.description = description;
            item.icon = iconMap[category] || 'fa-solid fa-mug-hot';
            if (menuItemCurrentImage) item.image = menuItemCurrentImage;
        }
        showToast(`Đã cập nhật món "${name}"!`, 'success');
    } else {
        const newId = Math.max(...state.menu.map(i => i.id), 0) + 1;
        state.menu.push({ id: newId, name, category, price, rating, description, image: menuItemCurrentImage || '', icon: iconMap[category] || 'fa-solid fa-mug-hot', available: true });
        showToast(`Đã thêm "${name}" vào thực đơn!`, 'success');
    }

    saveState();
    closeModal('menu-item-modal');
    renderAdminMenuList();
    renderBaristaInventory();
}

function deleteMenuItem(itemId) {
    const item = state.menu.find(i => i.id === itemId);
    if (!item) return;
    if (!confirm(`Xóa món "${item.name}" khỏi thực đơn?`)) return;
    state.menu = state.menu.filter(i => i.id !== itemId);
    saveState();
    showToast(`Đã xóa món "${item.name}".`, 'success');
    renderAdminMenuList();
    renderBaristaInventory();
}

function renderAdminDashboard() {
    let totalRevenue = state.orders.reduce((sum, o) => o.status === 'delivered' ? sum + o.total : sum, 0);
    let totalOrdersCount = state.orders.length;
    let loyaltyMembersCount = 1;
    let activePromosCount = state.promotions.length;

    document.getElementById('admin-stat-revenue').textContent = `${totalRevenue.toLocaleString('vi-VN')}đ`;
    document.getElementById('admin-stat-orders').textContent = `${totalOrdersCount} đơn`;
    document.getElementById('admin-stat-promos').textContent = `${activePromosCount} mã`;
    document.getElementById('admin-stat-loyalty').textContent = `${loyaltyMembersCount} hội viên`;

    renderAdminMenuList();
    renderRevenueChart();
    renderAdminPromotionsList();
    renderAdminCRMTable();
    renderAdminStaffTable();
}

function renderRevenueChart() {
    const group = document.getElementById('chart-bars-group');
    if (!group) return;

    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const sales = [450000, 780000, 520000, 950000, 1200000, 1650000, 1300000];
    let maxSale = 2000000;
    
    let barsHtml = '';
    days.forEach((day, index) => {
        const xPos = 80 + index * 65;
        const val = sales[index];
        const barHeight = (val / maxSale) * 150;
        const yPos = 170 - barHeight;

        barsHtml += `
            <rect x="${xPos}" y="${yPos}" width="30" height="${barHeight}" rx="4" fill="url(#barGradient)" />
            <text x="${xPos + 15}" y="195" fill="rgba(255,255,255,0.6)" font-size="10" text-anchor="middle">${day}</text>
            <text x="${xPos + 15}" y="${yPos - 6}" fill="#fff" font-size="8" text-anchor="middle" font-weight="700">${Math.round(val/1000)}K</text>
        `;
    });

    group.innerHTML = `
        <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--color-primary)" />
                <stop offset="100%" stop-color="#3c2218" />
            </linearGradient>
        </defs>
        ${barsHtml}
    `;
}

function renderAdminPromotionsList() {
    const list = document.getElementById('admin-promos-list');
    if (!list) return;

    let listHtml = '';
    state.promotions.forEach((promo, index) => {
        listHtml += `
            <div class="promo-tag-card">
                <div>
                    <strong>Mã: ${promo.code}</strong> - Giảm: ${promo.discount.toLocaleString('vi-VN')}đ<br>
                    <small style="color:var(--color-text-muted);">${promo.desc}</small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="deletePromotionCode(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });
    list.innerHTML = listHtml;
}

function createNewPromo(event) {
    event.preventDefault();
    const code = document.getElementById('promo-code').value.trim().toUpperCase();
    const discount = parseInt(document.getElementById('promo-discount').value);
    const desc = document.getElementById('promo-desc').value.trim();

    state.promotions.push({ code, discount, desc });
    saveState();
    showToast(`Đã tạo mã khuyến mãi ${code} thành công!`, "success");
    
    document.getElementById('promo-code').value = '';
    document.getElementById('promo-discount').value = '';
    document.getElementById('promo-desc').value = '';

    renderAdminDashboard();
}

function deletePromotionCode(index) {
    state.promotions.splice(index, 1);
    saveState();
    showToast("Đã xóa mã khuyến mãi.", "success");
    renderAdminDashboard();
}

function renderAdminCRMTable() {
    const tbody = document.getElementById('crm-table-body');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td>
                <strong>Nguyễn Văn A</strong><br>
                <small style="color:var(--color-text-muted);">khachhang</small>
            </td>
            <td><span class="text-accent" style="font-weight:700;"><i class="fa-solid fa-crown"></i> ${computeTier(state.user.points)}</span></td>
            <td>${state.user.points} điểm</td>
            <td>${state.user.wallet.toLocaleString('vi-VN')}đ</td>
            <td>
                <button class="btn btn-sm btn-primary-outline" onclick="adjustPointsDemo(50)">+50 điểm</button>
                <button class="btn btn-sm btn-accent-outline" onclick="adjustPointsDemo(-50)">-50 điểm</button>
            </td>
        </tr>
    `;
}

function computeTier(points) {
    if (points >= 300) return 'VIP Platinum';
    if (points >= 150) return 'Gold Member';
    return 'Silver Member';
}

function adjustPointsDemo(points) {
    state.user.points = Math.max(0, state.user.points + points);
    saveState();
    renderAdminCRMTable();
    showToast(`Đã cập nhật điểm tích lũy!`, "success");
}

function renderAdminStaffTable() {
    const tbody = document.getElementById('staff-table-body');
    if (!tbody) return;

    let tbodyHtml = '';
    state.staff.forEach((member, index) => {
        tbodyHtml += `
            <tr>
                <td><strong>${member.name}</strong></td>
                <td>${member.role}</td>
                <td><span style="color:var(--color-success); font-weight:700;"><i class="fa-solid fa-circle"></i> ${member.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteStaffMember(${index})">Xóa</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = tbodyHtml;
}

function addStaffMember(event) {
    event.preventDefault();
    const name = document.getElementById('staff-name').value.trim();
    const role = document.getElementById('staff-role').value;

    state.staff.push({ name, role, status: 'online' });
    saveState();
    showToast(`Đã thêm nhân viên ${name}!`, "success");
    document.getElementById('staff-name').value = '';
    renderAdminDashboard();
}

function deleteStaffMember(index) {
    state.staff.splice(index, 1);
    saveState();
    showToast("Đã xóa nhân viên.", "success");
    renderAdminDashboard();
}

// =========================================
// DELIVERY PARTNER PORTAL LOGIC
// =========================================

function renderDeliveryPortal() {
    const container = document.getElementById('delivery-orders-container');
    if (!container) return;

    const deliveryOrders = state.orders.filter(o => o.fulfillment === 'delivery' && (o.status === 'ready' || o.status === 'delivering'));

    if (deliveryOrders.length === 0) {
        container.innerHTML = `<p class="text-center" style="padding:20px 0;">Không có đơn hàng nào cần giao.</p>`;
        return;
    }

    let cardsHtml = '';
    deliveryOrders.forEach(order => {
        let itemsCount = order.items.reduce((sum, i) => sum + i.qty, 0);
        let btnHtml = '';
        if (order.status === 'ready') {
            btnHtml = `<button class="btn btn-sm btn-accent btn-block" onclick="startDeliveryTransit('${order.id}')">Nhận giao đơn này <i class="fa-solid fa-motorcycle"></i></button>`;
        } else if (order.status === 'delivering') {
            btnHtml = `
                <div style="display:flex; flex-direction:column; gap:6px; width:100%;">
                    <button class="btn btn-sm btn-primary btn-block" onclick="completeDeliveryJob('${order.id}')">Hoàn thành giao hàng <i class="fa-solid fa-check"></i></button>
                    <button class="btn btn-sm btn-secondary btn-block" onclick="simulateMapRoute('${order.id}')">Xem mô phỏng lộ trình <i class="fa-solid fa-route"></i></button>
                </div>
            `;
        }

        cardsHtml += `
            <div class="delivery-card ${activeDeliveryOrder && activeDeliveryOrder.id === order.id ? 'active' : ''}">
                <div style="display:flex; justify-content:space-between; margin-bottom: 6px;">
                    <strong>Đơn hàng: ${order.id}</strong>
                    <span class="status-label status-${order.status}">${translateStatus(order.status)}</span>
                </div>
                <div style="font-size:12px; margin-bottom:8px; line-height: 1.4;">
                    Khách hàng: ${order.customerName}<br>
                    Địa chỉ: ${order.address}<br>
                    Số lượng: ${itemsCount} món | Số tiền: <strong>${order.total.toLocaleString('vi-VN')}đ</strong>
                </div>
                ${btnHtml}
            </div>
        `;
    });

    container.innerHTML = cardsHtml;
}

function startDeliveryTransit(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = 'delivering';
    saveState();
    showToast(`Đã nhận đơn giao hàng ${orderId}!`, "success");
    simulateMapRoute(orderId);
}

function simulateMapRoute(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    activeDeliveryOrder = order;
    renderDeliveryPortal();

    document.getElementById('simulation-active-card').innerHTML = `
        <div class="glass-card" style="padding:14px; background:rgba(0,0,0,0.2);">
            <h4>Đang vận chuyển đơn hàng: ${order.id}</h4>
            <p style="font-size:12px; margin-top:4px;">Lộ trình: <strong>Tart Coffee Shop &rarr; ${order.address}</strong></p>
        </div>
    `;

    const mapVisual = document.getElementById('sim-map-visual');
    const vehicle = document.getElementById('map-vehicle');
    
    mapVisual.style.display = 'flex';
    vehicle.classList.remove('transit');
    
    setTimeout(() => {
        vehicle.classList.add('transit');
        showToast("Shipper đang di chuyển...", "success");
    }, 100);
}

function completeDeliveryJob(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = 'delivered';
    order.paymentStatus = 'paid';
    activeDeliveryOrder = null;
    saveState();
    
    showToast(`Đơn hàng ${orderId} đã giao thành công!`, "success");
    document.getElementById('sim-map-visual').style.display = 'none';
    document.getElementById('simulation-active-card').innerHTML = `
        <div class="empty-simulation">
            <i class="fa-solid fa-map-location-dot"></i>
            <p>Chọn đơn hàng bên cạnh để bắt đầu hành trình mô phỏng giao hàng.</p>
        </div>
    `;

    renderDeliveryPortal();
}

// =========================================
// PAYMENT GATEWAY SIMULATOR LOGIC
// =========================================

function renderPaymentGateway() {
    const container = document.getElementById('payment-simulation-form-container');
    if (!container) return;

    if (state.pendingGatewayOrder) {
        const order = state.pendingGatewayOrder;
        container.innerHTML = `
            <div class="payment-transaction-card glass-card">
                <h3>Thanh toán hóa đơn đặt hàng</h3>
                <p style="font-size:12px; margin-top:4px; color:var(--color-text-muted);">Mã GD: TXN-${Math.floor(100000 + Math.random() * 900000)}</p>
                
                <div class="pay-amount-box">
                    ${order.total.toLocaleString('vi-VN')}đ
                </div>

                <div style="font-size:12px; line-height: 1.6; margin-bottom:20px;">
                    <strong>Chủ thẻ:</strong> ${order.customerName}<br>
                    <strong>Dịch vụ cung cấp:</strong> Tart Coffee Shop Order Delivery<br>
                    <strong>Nguồn tiền:</strong> Thẻ ghi nợ ngân hàng liên kết
                </div>

                <form id="pay-otp-form" onsubmit="approveGatewayPayment(event, 'checkout')">
                    <div class="form-group">
                        <label for="gateway-otp">Mã xác thực OTP (Điền: 123456)</label>
                        <input type="text" id="gateway-otp" value="123456" placeholder="Nhập mã OTP..." style="text-align:center; font-size:16px; font-weight:700; letter-spacing:4px;" required>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <button type="button" class="btn btn-secondary" onclick="cancelGatewayTransaction()">Hủy bỏ</button>
                        <button type="submit" class="btn btn-primary">Xác nhận OTP</button>
                    </div>
                </form>
            </div>
        `;
    } else if (state.pendingRechargeAmount > 0) {
        const amount = state.pendingRechargeAmount;
        container.innerHTML = `
            <div class="payment-transaction-card glass-card">
                <h3>Nạp tiền vào ví Tart Card</h3>
                <p style="font-size:12px; margin-top:4px; color:var(--color-text-muted);">Mã GD: TXN-TOPUP-${Math.floor(100000 + Math.random() * 900000)}</p>
                
                <div class="pay-amount-box">
                    ${amount.toLocaleString('vi-VN')}đ
                </div>

                <div style="font-size:12px; line-height: 1.6; margin-bottom:20px;">
                    <strong>Chủ thẻ:</strong> Nguyễn Văn A<br>
                    <strong>Dịch vụ cung cấp:</strong> Recharge Tart Card Wallet<br>
                    <strong>Khuyến mãi:</strong> +5% Điểm tích lũy thành viên
                </div>

                <form id="pay-otp-form" onsubmit="approveGatewayPayment(event, 'topup')">
                    <div class="form-group">
                        <label for="gateway-otp">Mã xác thực OTP (Điền: 123456)</label>
                        <input type="text" id="gateway-otp" value="123456" placeholder="Nhập mã OTP..." style="text-align:center; font-size:16px; font-weight:700; letter-spacing:4px;" required>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <button type="button" class="btn btn-secondary" onclick="cancelGatewayTransaction()">Hủy bỏ</button>
                        <button type="submit" class="btn btn-primary">Xác nhận OTP</button>
                    </div>
                </form>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="empty-payment-sim">
                <i class="fa-solid fa-lock"></i>
                <h3>Không có giao dịch nào đang chờ thanh toán</h3>
                <p>Để thanh toán, vui lòng chuyển sang trang Khách hàng, chọn món vào giỏ hàng và chọn thanh toán bằng "Thẻ / Cổng ngoài".</p>
                <a href="customer.html" class="btn btn-primary margin-top-md">Quay lại trang mua hàng</a>
            </div>
        `;
    }
}

function approveGatewayPayment(event, type) {
    event.preventDefault();
    const otp = document.getElementById('gateway-otp').value.trim();

    if (otp !== '123456') {
        showToast("Mã xác thực OTP không đúng. Vui lòng nhập 123456.", "error");
        return;
    }

    if (type === 'checkout') {
        const pending = state.pendingGatewayOrder;
        const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const earnedPoints = Math.round(pending.total / 1000);

        const newOrder = {
            id: orderId,
            customerName: pending.customerName,
            items: pending.items,
            fulfillment: pending.fulfillment,
            address: pending.address,
            paymentMethod: 'gateway',
            subtotal: pending.subtotal,
            discount: pending.discount,
            deliveryFee: pending.deliveryFee,
            total: pending.total,
            status: 'pending',
            timestamp: new Date().toLocaleString("vi-VN"),
            paymentStatus: 'paid'
        };

        state.orders.push(newOrder);
        state.user.points += earnedPoints;
        
        state.pendingGatewayOrder = null;
        saveState();

        showToast("Thanh toán thành công!", "success");
        
        // Redirect back to customer portal with the show_invoice query!
        setTimeout(() => {
            window.location.href = `customer.html?show_invoice=${orderId}`;
        }, 500);
    } else if (type === 'topup') {
        const topupAmt = state.pendingRechargeAmount;
        state.user.wallet += topupAmt;
        
        const bonusPoints = Math.round((topupAmt / 1000) * 0.5);
        state.user.points += bonusPoints;
        
        state.pendingRechargeAmount = 0;
        saveState();

        showToast("Nạp ví thành công!", "success");
        
        // Redirect back to customer portal
        setTimeout(() => {
            window.location.href = 'customer.html';
        }, 500);
    }
}

function cancelGatewayTransaction() {
    state.pendingGatewayOrder = null;
    state.pendingRechargeAmount = 0;
    saveState();
    showToast("Đã hủy bỏ giao dịch.", "error");
    setTimeout(() => {
        window.location.href = 'customer.html';
    }, 500);
}

// Open usecase diagrams in dialog modal
function openDiagramModal(role) {
    const modal = document.getElementById('diagram-modal');
    const title = document.getElementById('diagram-modal-title');
    const img = document.getElementById('diagram-modal-img');

    const table = {
        'barista': { title: 'Sơ đồ Use Case - Nhân viên cửa hàng / Barista', src: 'img/nhanvien,barista.png' },
        'admin': { title: 'Sơ đồ Use Case - Quản trị viên / Quản lý', src: 'img/admin.png' },
        'delivery': { title: 'Sơ đồ Use Case - Đối tác giao hàng', src: 'img/giaohang.png' },
        'payment': { title: 'Sơ đồ Use Case - Cổng thanh toán', src: 'img/congthanhtoan.png' }
    };

    const details = table[role];
    if (details) {
        title.textContent = details.title;
        img.src = details.src;
        modal.classList.add('active');
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === 'error') {
        icon = '<i class="fa-solid fa-circle-xmark"></i>';
    }

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}
