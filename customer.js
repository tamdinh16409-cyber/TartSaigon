// State management key for localStorage
const STATE_KEY = 'tart_coffee_state';

// Product metadata (name + image) by menu item ID — source of truth for customer page
const MENU_META = {
    1: { name: "Cà Phê Sữa Đá",    image: "img2/Cà phê sữa đá.jpg",      price: 40000, description: "Cà phê phin truyền thống pha sữa đặc thơm béo, uống đá mát lạnh." },
    2: { name: "Cappuccino",         image: "img2/Cappuccino nóng.jpg",     price: 50000, description: "Espresso kết hợp sữa nóng và lớp bọt sữa mịn nghệ thuật." },
    3: { name: "Trà Sữa Oolong",    image: "img2/Trà sữa Oolong.jpg",      price: 45000, description: "Trà oolong đậm vị hòa quyện cùng sữa tươi thơm ngon." },
    4: { name: "Trà Dâu Ổi Hồng",  image: "img2/Trà Dâu Ổi hồng.jpg",    price: 50000, description: "Trà trái cây vị dâu ổi tươi mát, thanh ngọt giải nhiệt." },
    5: { name: "Croissant Bơ Tỏi", image: "img2/Croissant Bơ Tỏi.jpg",    price: 35000, description: "Bánh croissant ngàn lớp giòn tan, thơm lừng bơ tỏi đặc biệt." },
    6: { name: "Bánh Tart Trứng",   image: "img2/Bánh Tart Trứng.jpg",     price: 28000, description: "Bánh tart trứng vỏ giòn xốp, nhân kem trứng vàng mịn thơm." }
};

// Global variables
let state = {};
let cart = [];
let selectedMenuCategory = 'all';
let currentFulfillment = 'pickup';
let activeRechargeAmount = 50000;
let activeGiftAmount = 50000;

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
    
    // Check if there's a recent order to display invoice for
    checkRedirectInvoice();

    // Listen to changes in other tabs (real-time sync of order status!)
    window.addEventListener('storage', (e) => {
        if (e.key === STATE_KEY) {
            loadStateFromStorage();
            renderCustomerMenu();
            renderCart();
            renderOrderHistory();
            renderLoyaltyWidget();
            renderUserStatusWidget();
        }
    });
});

// Setup data from LocalStorage
function initApp() {
    loadStateFromStorage();

    // Apply product metadata (overrides stale localStorage data)
    if (state.menu) {
        state.menu.forEach(item => {
            const meta = MENU_META[item.id];
            if (meta) {
                item.name = meta.name;
                item.image = meta.image;
                item.price = meta.price;
                item.description = meta.description;
            }
        });
    }

    // Show login gate if not yet logged in as customer
    if (state.currentSessionUser.role !== 'customer') {
        openLoginGate();
        return;
    }

    renderUserStatusWidget();
    renderCustomerMenu();
    renderCart();
    renderOrderHistory();
    renderLoyaltyWidget();
}

function openLoginGate() {
    const modal = document.getElementById('login-modal');
    modal.classList.add('active');
    const closeBtn = modal.querySelector('.close-modal-btn');
    if (closeBtn) closeBtn.style.display = 'none';
}

function loadStateFromStorage() {
    const savedState = localStorage.getItem(STATE_KEY);
    if (savedState) {
        state = JSON.parse(savedState);
    } else {
        // Fallback default state (should have been created by index.html initialization)
        window.location.href = 'index.html'; // redirect to init
    }
}

// Save state to LocalStorage
function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// Check for redirect invoice showing
function checkRedirectInvoice() {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('show_invoice');
    if (invoiceId) {
        openInvoiceModal(invoiceId);
        // Clear param without reload
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Setup standard event listeners
function setupEventListeners() {
    // Category filters
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedMenuCategory = e.currentTarget.getAttribute('data-category');
            filterMenu();
        });
    });

    // Gift card value options
    document.querySelectorAll('.gift-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            document.querySelectorAll('.gift-option').forEach(o => o.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeGiftAmount = parseInt(e.currentTarget.getAttribute('data-val'));
        });
    });

    // Wallet recharge options
    document.querySelectorAll('.topup-amount-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.topup-amount-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeRechargeAmount = parseInt(e.currentTarget.getAttribute('data-val'));
            document.getElementById('custom-topup-amount').value = '';
        });
    });

    document.getElementById('custom-topup-amount').addEventListener('input', (e) => {
        document.querySelectorAll('.topup-amount-btn').forEach(b => b.classList.remove('active'));
        activeRechargeAmount = parseInt(e.target.value) || 0;
    });
}

// Render dynamic user session widget in header
function renderUserStatusWidget() {
    const widget = document.getElementById('user-status-widget');
    if (!widget) return;

    if (state.currentSessionUser.role === 'customer') {
        widget.innerHTML = `
            <div class="status-badge">
                <div class="status-dot"></div>
                <span>KH: ${state.user.name}</span>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="logoutSession()"><i class="fa-solid fa-sign-out-alt"></i> Đăng xuất</button>
        `;
    } else {
        widget.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="openLoginModal()"><i class="fa-solid fa-user"></i> Đăng nhập</button>
        `;
    }
}

// Open Modal helper
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

// Close generic modal
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Switch between login & register tab in modal
function switchLoginTab(formId) {
    document.querySelectorAll('.login-tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick').includes(formId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.login-form-tab').forEach(form => {
        if (form.id === formId) {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });
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

    state.currentSessionUser = {
        name: username === 'khachhang' ? state.user.name : username,
        username: username,
        role: 'customer'
    };
    saveState();
    showToast("Đăng nhập thành công!", "success");
    // Restore close button in case it was hidden
    const closeBtn = document.querySelector('#login-modal .close-modal-btn');
    if (closeBtn) closeBtn.style.display = '';
    closeModal('login-modal');
    initApp();
}

// Register a new customer
function handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    
    state.user.name = name;
    state.user.username = username;
    state.user.wallet = 100000; // Gift free credit
    state.user.points = 0;
    state.user.vouchers = [
        { code: "TARTWELCOME", discount: 20000, desc: "Giảm 20k cho đơn đầu tiên" }
    ];
    
    state.currentSessionUser = {
        name: name,
        username: username,
        role: 'customer'
    };
    
    saveState();
    showToast("Đăng ký thành công! Nhận quà tặng 100k vào ví.", "success");
    const closeBtn2 = document.querySelector('#login-modal .close-modal-btn');
    if (closeBtn2) closeBtn2.style.display = '';
    closeModal('login-modal');
    initApp();
}

// Log out session
function logoutSession() {
    state.currentSessionUser = { name: "Guest", username: "guest", role: "guest" };
    saveState();
    showToast("Đã đăng xuất.", "success");
    openLoginGate();
}

// Render customer menu tab
function renderCustomerMenu() {
    const container = document.getElementById('menu-items-container');
    if (!container) return;

    let itemsHtml = '';
    const filtered = state.menu.filter(item => {
        if (selectedMenuCategory === 'favorites') {
            return state.user.favorites.includes(item.id);
        } else if (selectedMenuCategory !== 'all' && item.category !== selectedMenuCategory) {
            return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message" style="grid-column: 1/-1;">
                <i class="fa-solid fa-mug-hot"></i>
                <p>Không tìm thấy món ăn nào tương ứng.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        const isFavorite = state.user.favorites.includes(item.id);
        const favClass = isFavorite ? 'liked' : '';
        const heartIcon = isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const outOfStockLabel = item.available ? '' : `<div class="badge-out-stock">Hết hàng</div>`;
        const buttonDisabled = item.available ? '' : 'disabled';
        
        itemsHtml += `
            <div class="menu-card glass-card">
                <button class="card-favorite-btn ${favClass}" onclick="toggleFavorite(${item.id})">
                    <i class="${heartIcon}"></i>
                </button>
                <div class="menu-card-image">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<i class="${item.icon}"></i>`}
                    ${outOfStockLabel}
                </div>
                <div class="menu-card-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <div class="menu-card-footer">
                        <span class="menu-card-price">${item.price.toLocaleString('vi-VN')}đ</span>
                        <div class="menu-card-right-group" style="display:flex; align-items:center; gap: 8px;">
                            <span class="menu-card-rating"><i class="fa-solid fa-star"></i> ${item.rating}</span>
                            <button class="add-cart-btn" ${buttonDisabled} onclick="openCustomizationModal(${item.id})">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = itemsHtml;
}

// Filter menu items on search input
function filterMenu() {
    const query = document.getElementById('menu-search').value.toLowerCase().trim();
    const container = document.getElementById('menu-items-container');
    if (!container) return;

    renderCustomerMenu();
    
    if (query !== '') {
        const cards = container.querySelectorAll('.menu-card');
        cards.forEach(card => {
            const title = card.querySelector('h4').textContent.toLowerCase();
            const desc = card.querySelector('p').textContent.toLowerCase();
            if (title.includes(query) || desc.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// Toggle favorite
function toggleFavorite(itemId) {
    const index = state.user.favorites.indexOf(itemId);
    if (index > -1) {
        state.user.favorites.splice(index, 1);
        showToast("Đã bỏ yêu thích món.", "success");
    } else {
        state.user.favorites.push(itemId);
        showToast("Đã thêm món vào yêu thích!", "success");
    }
    saveState();
    renderCustomerMenu();
}

// Switch Tab
function switchCustomerTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.customer-tab-content').forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Open Customization Modal
function openCustomizationModal(itemId) {
    const item = state.menu.find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById('customization-modal');
    modal.classList.add('active');

    modal.innerHTML = `
        <div class="modal-header">
            <h3>Tùy chỉnh món ăn</h3>
            <button class="close-modal-btn" onclick="closeModal('customization-modal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="customize-header">
                <div class="customize-img"><i class="${item.icon}"></i></div>
                <div class="customize-title">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <span class="text-primary font-lg" style="font-weight:700;">${item.price.toLocaleString('vi-VN')}đ</span>
                </div>
            </div>
            
            <form id="customize-product-form" onsubmit="handleCustomizeAdd(event, ${item.id})">
                <!-- Size Options -->
                <div class="option-group">
                    <span class="option-group-title">Kích cỡ</span>
                    <div class="option-choices size-choices">
                        <button type="button" class="choice-btn active" data-val="M" data-add="0">Size M (+0đ)</button>
                        <button type="button" class="choice-btn" data-val="L" data-add="10000">Size L (+10.000đ)</button>
                    </div>
                </div>

                <!-- Ice Options -->
                <div class="option-group">
                    <span class="option-group-title">Mức đá</span>
                    <div class="option-choices ice-choices">
                        <button type="button" class="choice-btn" data-val="0%">Đá ít (0%)</button>
                        <button type="button" class="choice-btn" data-val="50%">Đá vừa (50%)</button>
                        <button type="button" class="choice-btn active" data-val="100%">Đá thường (100%)</button>
                    </div>
                </div>

                <!-- Sugar Options -->
                <div class="option-group">
                    <span class="option-group-title">Mức đường</span>
                    <div class="option-choices sugar-choices">
                        <button type="button" class="choice-btn" data-val="0%">Không đường (0%)</button>
                        <button type="button" class="choice-btn" data-val="50%">Đường vừa (50%)</button>
                        <button type="button" class="choice-btn active" data-val="100%">Đường thường (100%)</button>
                    </div>
                </div>

                <!-- Toppings Options -->
                <div class="option-group">
                    <span class="option-group-title">Toppings thêm</span>
                    <div class="option-choices topping-choices">
                        <button type="button" class="choice-btn" data-val="Trân châu trắng" data-add="5000">Trân châu trắng (+5k)</button>
                        <button type="button" class="choice-btn" data-val="Kem béo phô mai" data-add="10000">Kem béo phô mai (+10k)</button>
                        <button type="button" class="choice-btn" data-val="Thạch đào dai" data-add="5000">Thạch đào dai (+5k)</button>
                    </div>
                </div>

                <div class="form-group margin-top-lg">
                    <button type="submit" class="btn btn-primary btn-block btn-lg"><i class="fa-solid fa-shopping-cart"></i> Thêm vào giỏ hàng</button>
                </div>
            </form>
        </div>
    `;

    // Hook customized clicks
    const bindChoiceGroup = (selector) => {
        modal.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener('click', (e) => {
                modal.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    };

    bindChoiceGroup('.size-choices .choice-btn');
    bindChoiceGroup('.ice-choices .choice-btn');
    bindChoiceGroup('.sugar-choices .choice-btn');

    // Toppings can select multiple
    modal.querySelectorAll('.topping-choices .choice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
        });
    });
}

// Add customized product
function handleCustomizeAdd(event, itemId) {
    event.preventDefault();
    const item = state.menu.find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById('customization-modal');
    
    const sizeBtn = modal.querySelector('.size-choices .choice-btn.active');
    const size = sizeBtn.getAttribute('data-val');
    const sizeAdd = parseInt(sizeBtn.getAttribute('data-add'));

    const ice = modal.querySelector('.ice-choices .choice-btn.active').getAttribute('data-val');
    const sugar = modal.querySelector('.sugar-choices .choice-btn.active').getAttribute('data-val');

    const toppings = [];
    let toppingsAddPrice = 0;
    modal.querySelectorAll('.topping-choices .choice-btn.active').forEach(btn => {
        toppings.push(btn.getAttribute('data-val'));
        toppingsAddPrice += parseInt(btn.getAttribute('data-add'));
    });

    const finalUnitPrice = item.price + sizeAdd + toppingsAddPrice;

    const existing = cart.find(c => 
        c.id === itemId && 
        c.size === size && 
        c.ice === ice && 
        c.sugar === sugar && 
        JSON.stringify(c.toppings) === JSON.stringify(toppings)
    );

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: finalUnitPrice,
            qty: 1,
            size: size,
            ice: ice,
            sugar: sugar,
            toppings: toppings
        });
    }

    closeModal('customization-modal');
    renderCart();
    showToast(`Đã thêm ${item.name} vào giỏ hàng!`, "success");
}

// Render loyalty card widget
function renderLoyaltyWidget() {
    document.getElementById('widget-wallet-bal').textContent = `${state.user.wallet.toLocaleString('vi-VN')}đ`;
    document.getElementById('widget-points').textContent = `${state.user.points} điểm`;
    document.getElementById('loyalty-tier').textContent = computeTier(state.user.points);

    // Calculate progress (Silver member -> Gold Member -> VIP Platinum)
    let percent = 0;
    let label = '';
    if (state.user.points >= 200) {
        percent = 100;
        label = 'Đã đạt bậc VIP Platinum cao nhất';
    } else {
        percent = (state.user.points / 200) * 100;
        label = `${200 - state.user.points} điểm nữa để đạt bậc VIP Platinum`;
    }
    
    document.getElementById('points-progress').style.width = `${percent}%`;
    document.getElementById('next-tier-label').textContent = label;
}

// Render cart
function renderCart() {
    const list = document.getElementById('cart-items-list');
    const summary = document.getElementById('cart-summary');
    const countBadge = document.getElementById('cart-count');
    const walletText = document.getElementById('cart-wallet-available');
    
    if (!list) return;

    if (walletText) walletText.textContent = `Số dư: ${state.user.wallet.toLocaleString('vi-VN')}đ`;

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="empty-cart-message">
                <i class="fa-solid fa-mug-hot"></i>
                <p>Chưa có sản phẩm nào trong giỏ hàng.</p>
            </div>
        `;
        summary.style.display = 'none';
        countBadge.textContent = '0 món';
        return;
    }

    countBadge.textContent = `${cart.reduce((sum, item) => sum + item.qty, 0)} món`;
    summary.style.display = 'block';

    let cartHtml = '';
    cart.forEach((item, index) => {
        const toppingsString = item.toppings.length > 0 ? `+ Toppings: ${item.toppings.join(', ')}` : '';
        cartHtml += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <h5>${item.name}</h5>
                    <div class="cart-item-options">
                        <span>Size: ${item.size} | Đá: ${item.ice} | Đường: ${item.sugar}</span>
                        ${toppingsString ? `<br><span>${toppingsString}</span>` : ''}
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="changeCartQty(${index}, -1)">&minus;</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="changeCartQty(${index}, 1)">&plus;</button>
                    </div>
                </div>
                <div class="cart-item-right">
                    <span class="cart-item-price">${(item.price * item.qty).toLocaleString('vi-VN')}đ</span>
                    <button class="cart-item-delete" onclick="removeCartItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    });

    list.innerHTML = cartHtml;
    calculateBill();
}

// Adjust cart qty
function changeCartQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    renderCart();
}

// Remove item
function removeCartItem(index) {
    cart.splice(index, 1);
    renderCart();
}

// Set Delivery / Pickup
function setFulfillment(method) {
    currentFulfillment = method;
    document.getElementById('fulfill-pickup').classList.toggle('active', method === 'pickup');
    document.getElementById('fulfill-delivery').classList.toggle('active', method === 'delivery');
    document.getElementById('delivery-address-container').style.display = method === 'delivery' ? 'block' : 'none';
    
    calculateBill();
}

// Apply Voucher Coupon code
let activeAppliedVoucher = null;

function applyVoucher() {
    const input = document.getElementById('voucher-input-code');
    const code = input.value.trim().toUpperCase();
    const info = document.getElementById('applied-voucher-info');

    const promo = state.promotions.find(p => p.code === code) || state.user.vouchers.find(v => v.code === code);
    
    if (promo) {
        activeAppliedVoucher = promo;
        info.style.display = 'flex';
        info.innerHTML = `
            <span>Áp dụng thành công: -${promo.discount.toLocaleString('vi-VN')}đ</span>
            <span style="cursor:pointer;" onclick="removeVoucher()">&times; Gỡ</span>
        `;
        showToast(`Đã áp dụng mã giảm giá ${code}!`, "success");
        calculateBill();
    } else {
        showToast("Mã giảm giá không hợp lệ.", "error");
    }
}

// Remove voucher
function removeVoucher() {
    activeAppliedVoucher = null;
    document.getElementById('applied-voucher-info').style.display = 'none';
    document.getElementById('voucher-input-code').value = '';
    calculateBill();
}

// Calculations
let billSubtotal = 0;
let billDiscount = 0;
let billDeliveryFee = 0;
let billTotal = 0;

function calculateBill() {
    billSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    billDiscount = activeAppliedVoucher ? activeAppliedVoucher.discount : 0;
    
    if (billDiscount > billSubtotal) billDiscount = billSubtotal;
    
    billDeliveryFee = currentFulfillment === 'delivery' ? 15000 : 0;
    billTotal = billSubtotal - billDiscount + billDeliveryFee;

    document.getElementById('bill-subtotal').textContent = `${billSubtotal.toLocaleString('vi-VN')}đ`;
    
    const discRow = document.getElementById('row-discount');
    if (billDiscount > 0) {
        discRow.style.display = 'flex';
        document.getElementById('bill-discount').textContent = `-${billDiscount.toLocaleString('vi-VN')}đ`;
    } else {
        discRow.style.display = 'none';
    }

    const delRow = document.getElementById('row-delivery-fee');
    if (billDeliveryFee > 0) {
        delRow.style.display = 'flex';
        document.getElementById('bill-delivery-fee').textContent = `${billDeliveryFee.toLocaleString('vi-VN')}đ`;
    } else {
        delRow.style.display = 'none';
    }

    document.getElementById('bill-total').textContent = `${billTotal.toLocaleString('vi-VN')}đ`;
}

// Checkout order flow
function checkoutOrder() {
    if (cart.length === 0) return;

    if (currentFulfillment === 'delivery') {
        const address = document.getElementById('delivery-address').value.trim();
        if (address === '') {
            showToast("Vui lòng điền địa chỉ giao hàng.", "error");
            return;
        }
    }

    const activePayOption = document.querySelector('.pay-option.active');
    const method = activePayOption ? activePayOption.getAttribute('data-method') : 'wallet';

    if (method === 'wallet') {
        if (state.user.wallet >= billTotal) {
            state.user.wallet -= billTotal;
            const earnedPoints = Math.round(billTotal / 1000);
            state.user.points += earnedPoints;

            const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
            const newOrder = {
                id: orderId,
                customerName: state.user.name,
                items: JSON.parse(JSON.stringify(cart)),
                fulfillment: currentFulfillment,
                address: currentFulfillment === 'delivery' ? document.getElementById('delivery-address').value : '',
                paymentMethod: 'wallet',
                subtotal: billSubtotal,
                discount: billDiscount,
                deliveryFee: billDeliveryFee,
                total: billTotal,
                status: 'pending',
                timestamp: new Date().toLocaleString("vi-VN"),
                paymentStatus: 'paid'
            };

            state.orders.push(newOrder);
            
            if (activeAppliedVoucher) {
                const uIdx = state.user.vouchers.findIndex(v => v.code === activeAppliedVoucher.code);
                if (uIdx > -1) state.user.vouchers.splice(uIdx, 1);
            }

            cart = [];
            activeAppliedVoucher = null;
            saveState();
            
            showToast(`Đặt hàng thành công! Nhận +${earnedPoints} điểm.`, "success");
            
            initApp();
            openInvoiceModal(orderId);
        } else {
            showToast("Số dư ví không đủ. Vui lòng nạp thêm tiền.", "error");
        }
    } else {
        // External Gateway redirect
        state.pendingGatewayOrder = {
            customerName: state.user.name,
            items: JSON.parse(JSON.stringify(cart)),
            fulfillment: currentFulfillment,
            address: currentFulfillment === 'delivery' ? document.getElementById('delivery-address').value : '',
            paymentMethod: 'gateway',
            subtotal: billSubtotal,
            discount: billDiscount,
            deliveryFee: billDeliveryFee,
            total: billTotal
        };
        
        saveState();
        showToast("Đang kết nối cổng thanh toán...", "success");
        setTimeout(() => {
            // Redirect to index.html operations portal with the ?role=payment parameter!
            window.location.href = 'index.html?role=payment';
        }, 800);
    }
}

// Open E-Invoice
function openInvoiceModal(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('invoice-modal');
    modal.classList.add('active');

    let itemsRows = '';
    order.items.forEach(item => {
        const opts = `(${item.size}, ${item.ice} đá, ${item.sugar} đường)`;
        itemsRows += `
            <tr>
                <td style="text-align:left;">${item.name}<br><small style="color:#666;">${opts}</small></td>
                <td>x${item.qty}</td>
                <td style="text-align:right;">${(item.price * item.qty).toLocaleString('vi-VN')}đ</td>
            </tr>
        `;
    });

    modal.innerHTML = `
        <div class="modal-header">
            <h3>Hóa Đơn Điện Tử (E-Invoice)</h3>
            <button class="close-modal-btn" onclick="closeModal('invoice-modal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="invoice-box">
                <div class="invoice-logo"><i class="fa-solid fa-mug-hot"></i> TART COFFEE</div>
                <div style="font-size:11px; margin-top:4px;">Cà Phê Nguyên Bản & Trải Nghiệm Thượng Hạng</div>
                <hr style="border:none; border-top:1px dashed #ccc; margin: 12px 0;">
                
                <div style="text-align:left; font-size:11px; line-height: 1.6;">
                    <strong>Mã hóa đơn:</strong> ${order.id}<br>
                    <strong>Thời gian:</strong> ${order.timestamp}<br>
                    <strong>Khách hàng:</strong> ${order.customerName}<br>
                    <strong>Hình thức:</strong> ${order.fulfillment === 'pickup' ? 'Tự nhận tại quán' : 'Giao hàng tận nơi'}<br>
                    ${order.address ? `<strong>Địa chỉ:</strong> ${order.address}<br>` : ''}
                    <strong>Thanh toán:</strong> ${order.paymentMethod === 'wallet' ? 'Ví Tart Card' : 'Thẻ / Cổng thanh toán'}
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th style="text-align:left; font-weight:700;">Món</th>
                            <th style="font-weight:700;">SL</th>
                            <th style="text-align:right; font-weight:700;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div style="text-align:right; font-size:11px; line-height: 1.6;">
                    Tạm tính: ${order.subtotal.toLocaleString('vi-VN')}đ<br>
                    Khuyến mãi: -${order.discount.toLocaleString('vi-VN')}đ<br>
                    Phí giao hàng: ${order.deliveryFee.toLocaleString('vi-VN')}đ<br>
                    <strong style="font-size:14px;">Tổng cộng: ${order.total.toLocaleString('vi-VN')}đ</strong>
                </div>

                <hr style="border:none; border-top:1px dashed #ccc; margin: 12px 0;">
                <div style="font-size:10px; color:#666;">Cảm ơn quý khách đã tin tưởng Tart Coffee!</div>
            </div>
            
            <button class="btn btn-primary btn-block margin-top-md" onclick="closeModal('invoice-modal')">Đóng Hóa Đơn</button>
        </div>
    `;
}

// Render Order History
function renderOrderHistory() {
    const list = document.getElementById('order-history-list');
    if (!list) return;

    if (state.orders.length === 0) {
        list.innerHTML = `<p class="text-center" style="padding: 20px 0;">Bạn chưa đặt đơn hàng nào.</p>`;
        return;
    }

    let historyHtml = '';
    [...state.orders].reverse().forEach(order => {
        let itemsString = order.items.map(i => `${i.name} (x${i.qty})`).join(', ');
        let showFulfillment = order.fulfillment === 'pickup' ? 'Tự nhận' : 'Giao hàng';
        let feedbackBtn = order.status === 'delivered' ? `<button class="btn btn-sm btn-accent-outline" onclick="openFeedbackModal('${order.id}')"><i class="fa-solid fa-star"></i> Đánh giá</button>` : '';

        historyHtml += `
            <div class="history-card">
                <div class="hist-info">
                    <h5>Mã đơn: ${order.id} | ${order.total.toLocaleString('vi-VN')}đ</h5>
                    <span>${order.timestamp} | ${itemsString} | <strong>${showFulfillment}</strong></span>
                </div>
                <div class="hist-status-box">
                    <span class="status-label status-${order.status}">${translateStatus(order.status)}</span>
                    <button class="btn btn-sm btn-primary-outline" onclick="openInvoiceModal('${order.id}')"><i class="fa-solid fa-receipt"></i> Hóa đơn</button>
                    ${feedbackBtn}
                    <button class="btn btn-sm btn-primary" onclick="quickReorder('${order.id}')"><i class="fa-solid fa-redo"></i> Đặt lại</button>
                </div>
            </div>
        `;
    });

    list.innerHTML = historyHtml;
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

// Quick Reorder
function quickReorder(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    cart = [];
    order.items.forEach(item => {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            size: item.size,
            ice: item.ice,
            sugar: item.sugar,
            toppings: [...item.toppings]
        });
    });

    setFulfillment(order.fulfillment);
    renderCart();
    switchCustomerTab('menu-tab');
    showToast("Đã sao chép các món đơn cũ vào giỏ!", "success");
}

function openFeedbackModal(orderId) {
    showToast(`Đã gửi đánh giá 5 sao thành công cho đơn ${orderId}!`, "success");
}

function openTopupModal() {
    openModal('topup-modal');
}

function triggerWalletTopup(event) {
    event.preventDefault();
    const customAmountVal = document.getElementById('custom-topup-amount').value;
    const finalAmount = customAmountVal ? parseInt(customAmountVal) : activeRechargeAmount;

    if (finalAmount <= 0) {
        showToast("Số tiền không hợp lệ.", "error");
        return;
    }

    state.pendingRechargeAmount = finalAmount;
    saveState();

    closeModal('topup-modal');
    showToast("Đang kết nối cổng thanh toán...", "success");
    setTimeout(() => {
        window.location.href = 'index.html?role=payment';
    }, 800);
}

function openVouchersModal() {
    openModal('vouchers-modal');
    document.getElementById('loyalty-claim-points').textContent = state.user.points;
    renderUserVouchersList();
}

function renderUserVouchersList() {
    const list = document.getElementById('user-vouchers-list');
    if (!list) return;

    if (state.user.vouchers.length === 0) {
        list.innerHTML = `<p class="text-center" style="padding: 10px 0; font-size:12px; color:rgba(255,255,255,0.4);">Bạn không có mã giảm giá nào.</p>`;
        return;
    }

    let vouchersHtml = '';
    state.user.vouchers.forEach(v => {
        vouchersHtml += `
            <div class="promo-tag-card" style="margin-bottom: 8px;">
                <div>
                    <strong style="color:var(--color-primary);">${v.code}</strong><br>
                    <small style="color:rgba(255,255,255,0.5);">${v.desc}</small>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="copyVoucherToCheckout('${v.code}')">Dùng ngay</button>
            </div>
        `;
    });
    list.innerHTML = vouchersHtml;
}

function copyVoucherToCheckout(code) {
    closeModal('vouchers-modal');
    const input = document.getElementById('voucher-input-code');
    if (input) {
        input.value = code;
        applyVoucher();
    }
}

function claimReward(pointsReq, discountAmount, descText) {
    if (state.user.points >= pointsReq) {
        state.user.points -= pointsReq;
        const code = `REWARD-${Math.floor(100 + Math.random() * 900)}`;
        state.user.vouchers.push({
            code: code,
            discount: discountAmount,
            desc: descText
        });
        saveState();
        showToast(`Đổi voucher ${code} thành công!`, "success");
        
        document.getElementById('loyalty-claim-points').textContent = state.user.points;
        renderUserVouchersList();
        renderLoyaltyWidget();
    } else {
        showToast("Bạn không đủ điểm tích lũy.", "error");
    }
}

function computeTier(points) {
    if (points >= 300) return 'VIP Platinum';
    if (points >= 150) return 'Gold Member';
    return 'Silver Member';
}

function sendGiftCard(event) {
    event.preventDefault();
    const receiver = document.getElementById('gift-receiver').value.trim();
    const message = document.getElementById('gift-message').value.trim();

    if (state.user.wallet >= activeGiftAmount) {
        state.user.wallet -= activeGiftAmount;
        saveState();
        showToast(`Đã gửi tặng Gift Card trị giá ${activeGiftAmount.toLocaleString('vi-VN')}đ tới ${receiver}!`, "success");
        document.getElementById('gift-receiver').value = '';
        document.getElementById('gift-message').value = '';
        renderLoyaltyWidget();
    } else {
        showToast("Số dư ví không đủ.", "error");
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

function openLoginModal() {
    openModal('login-modal');
}
