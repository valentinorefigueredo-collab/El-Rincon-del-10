// =========================================================
// EL RINCÓN DEL 10 - APP JAVASCRIPT
// Lógica de catálogo, carrito, personalizador y checkout
// =========================================================

// --- ESTADO GLOBAL DE LA APLICACIÓN ---
const STATE = {
    products: PRODUCTS || [],
    currentCategory: 'all',
    searchQuery: '',
    currentSort: 'featured',
    selectedSizes: {}, // { [productId]: 'L' }
    cart: JSON.parse(localStorage.getItem('rincon10_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('rincon10_wishlist')) || [],
    activeCoupon: localStorage.getItem('rincon10_coupon') || null,
    discountRate: 0,
    freeShippingThreshold: 50000,
    shippingCost: 4500,
    customizer: {
        presetIndex: 0,
        name: 'MESSI',
        number: 10,
        size: 'L',
        price: 51999
    }
};

// --- FORMATEADOR DE MONEDA ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(amount);
};

// =========================================================
// INICIALIZACIÓN
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    initCatalog();
    initSearch();
    initFilters();
    initCustomizer();
    initCart();
    initWishlist();
    initModals();
    initCountdown();
    initScrollAndNav();
    initContactAndNewsletter();
    initAdminCostCalculator();

    // Reanudar cupón si ya estaba guardado
    if (STATE.activeCoupon) {
        applyCouponCode(STATE.activeCoupon, false);
    }
});

// =========================================================
// CATÁLOGO Y RENDERIZADO DE PRODUCTOS
// =========================================================
function initCatalog() {
    renderProducts();
}

function getFilteredProducts() {
    let list = [...STATE.products];

    // Filtrado por categoría
    if (STATE.currentCategory !== 'all') {
        if (STATE.currentCategory === 'camisetas') {
            list = list.filter(p => p.category === 'camisetas');
        } else if (STATE.currentCategory === 'retro') {
            list = list.filter(p => p.isRetro || p.subCategory === 'retro');
        } else if (STATE.currentCategory === 'selecciones') {
            list = list.filter(p => p.subCategory === 'selecciones');
        } else if (STATE.currentCategory === 'clubes') {
            list = list.filter(p => p.subCategory === 'clubes');
        } else if (STATE.currentCategory === 'accesorios') {
            list = list.filter(p => p.category === 'accesorios');
        }
    }

    // Filtrado por búsqueda
    if (STATE.searchQuery.trim() !== '') {
        const query = STATE.searchQuery.toLowerCase().trim();
        list = list.filter(p => {
            const matchName = p.name.toLowerCase().includes(query);
            const matchDesc = p.description.toLowerCase().includes(query);
            const matchTags = p.tags && p.tags.some(t => t.toLowerCase().includes(query));
            return matchName || matchDesc || matchTags;
        });
    }

    // Ordenamiento
    switch (STATE.currentSort) {
        case 'price-asc':
            list.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            list.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            list.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
            list.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'featured':
        default:
            list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
            break;
    }

    return list;
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    if (!grid) return;

    const filtered = getFilteredProducts();

    // Actualizar barra de resultados
    if (resultsCount) {
        resultsCount.textContent = `Mostrando ${filtered.length} producto${filtered.length === 1 ? '' : 's'}`;
    }

    // Mostrar botón de limpiar si hay filtros activos
    if (resetFiltersBtn) {
        const hasActiveFilter = STATE.currentCategory !== 'all' || STATE.searchQuery !== '';
        resetFiltersBtn.style.display = hasActiveFilter ? 'inline-flex' : 'none';
    }

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(product => {
        const isWishlisted = STATE.wishlist.includes(product.id);
        const discountPercent = product.originalPrice 
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
            : 0;
        const installmentPrice = Math.round(product.price / 3);

        // Talle seleccionado por defecto
        const selectedSize = STATE.selectedSizes[product.id] || (product.sizes ? product.sizes[0] : '');

        return `
            <article class="product-card" data-id="${product.id}">
                <div class="card-img-wrap">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='assets/products/cam-arg-2022.svg'">
                    ${product.badge ? `<span class="card-badge">${product.badge}</span>` : ''}
                    <button class="wishlist-heart-btn ${isWishlisted ? 'active' : ''}" 
                            onclick="toggleWishlist('${product.id}')" 
                            title="${isWishlisted ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                            aria-label="Favoritos">
                        <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                    <button class="card-quick-view-btn" onclick="openQuickView('${product.id}')">
                        <i class="fa-solid fa-eye"></i> Vista Rápida
                    </button>
                </div>

                <div class="card-content">
                    <div class="card-meta">
                        <span class="card-category">${product.category === 'camisetas' ? 'Camiseta' : 'Accesorio'}</span>
                        <div class="card-rating">
                            <i class="fa-solid fa-star"></i>
                            <strong>${product.rating.toFixed(1)}</strong>
                            <span>(${product.reviewsCount})</span>
                        </div>
                    </div>

                    <h3 class="card-title" title="${product.name}">${product.name}</h3>

                    <!-- Selector de Talles -->
                    ${product.sizes && product.sizes.length > 0 ? `
                        <div class="card-sizes">
                            <span class="sizes-label">Talle:</span>
                            <div class="sizes-options">
                                ${product.sizes.map(size => `
                                    <button type="button" 
                                            class="size-btn ${size === selectedSize ? 'selected' : ''}" 
                                            onclick="selectProductSize('${product.id}', '${size}')">
                                        ${size}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="card-pricing-wrap">
                        <div class="price-row">
                            <span class="card-current-price">${formatCurrency(product.price)}</span>
                            ${product.originalPrice ? `
                                <span class="card-old-price">${formatCurrency(product.originalPrice)}</span>
                                <span class="discount-pill">${discountPercent}% OFF</span>
                            ` : ''}
                        </div>
                        <div class="installments-note">
                            <i class="fa-solid fa-credit-card"></i> 3 cuotas sin interés de <strong>${formatCurrency(installmentPrice)}</strong>
                        </div>
                    </div>

                    <button class="add-to-cart-btn" id="btn-add-${product.id}" onclick="addProductToCart('${product.id}')">
                        <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function selectProductSize(productId, size) {
    STATE.selectedSizes[productId] = size;
    // Actualizar visualmente la selección en la tarjeta
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (card) {
        card.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.textContent.trim() === size);
        });
    }
}

// =========================================================
// FILTROS Y BÚSQUEDA
// =========================================================
function initFilters() {
    // Píldoras de categorías
    const pills = document.querySelectorAll('.pill-btn');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            STATE.currentCategory = pill.dataset.category;
            renderProducts();
        });
    });

    // Enlaces de la barra de navegación que filtran
    const navFilterLinks = document.querySelectorAll('.nav-link[data-filter]');
    navFilterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const filter = link.dataset.filter;
            filterByCategory(filter);
        });
    });

    // Selector de ordenamiento
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            STATE.currentSort = e.target.value;
            renderProducts();
        });
    }

    // Botón reset
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetAllFilters);
    }
}

function filterByCategory(category) {
    STATE.currentCategory = category;
    const pills = document.querySelectorAll('.pill-btn');
    pills.forEach(p => {
        p.classList.toggle('active', p.dataset.category === category);
    });
    renderProducts();
}

function resetAllFilters() {
    STATE.currentCategory = 'all';
    STATE.searchQuery = '';
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('show');

    const pills = document.querySelectorAll('.pill-btn');
    pills.forEach(p => p.classList.toggle('active', p.dataset.category === 'all'));

    renderProducts();
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        STATE.searchQuery = e.target.value;
        if (clearBtn) {
            clearBtn.classList.toggle('show', STATE.searchQuery.length > 0);
        }
        renderProducts();
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            STATE.searchQuery = '';
            clearBtn.classList.remove('show');
            searchInput.focus();
            renderProducts();
        });
    }
}

// =========================================================
// CARRITO DE COMPRAS
// =========================================================
function initCart() {
    const cartOpenBtn = document.getElementById('cartOpenBtn');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const whatsappCheckoutBtn = document.getElementById('whatsappCheckoutBtn');
    const directCheckoutBtn = document.getElementById('directCheckoutBtn');

    if (cartOpenBtn) cartOpenBtn.addEventListener('click', openCartDrawer);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', () => {
            const input = document.getElementById('couponInput');
            if (input) applyCouponCode(input.value.trim());
        });
    }

    if (whatsappCheckoutBtn) {
        whatsappCheckoutBtn.addEventListener('click', handleWhatsAppCheckout);
    }

    if (directCheckoutBtn) {
        directCheckoutBtn.addEventListener('click', () => {
            if (STATE.cart.length === 0) {
                showToast('Tu carrito está vacío', 'error');
                return;
            }
            closeCartDrawer();
            openCheckoutModal();
        });
    }

    updateCartUI();
}

function openCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function addProductToCart(productId) {
    const product = STATE.products.find(p => p.id === productId);
    if (!product) return;

    const chosenSize = STATE.selectedSizes[productId] || (product.sizes ? product.sizes[0] : 'Único');
    const cartItemId = `${product.id}_${chosenSize}`;

    const existingIndex = STATE.cart.findIndex(item => item.cartItemId === cartItemId);

    if (existingIndex > -1) {
        STATE.cart[existingIndex].quantity += 1;
    } else {
        STATE.cart.push({
            cartItemId: cartItemId,
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: chosenSize,
            quantity: 1,
            customPrint: null
        });
    }

    saveCart();
    updateCartUI();

    // Animación feedback en botón
    const btn = document.getElementById(`btn-add-${productId}`);
    if (btn) {
        const originalText = btn.innerHTML;
        btn.classList.add('added');
        btn.innerHTML = `<i class="fa-solid fa-check"></i> ¡Agregado!`;
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = originalText;
        }, 1400);
    }

    showToast(`"${product.name}" agregado al carrito`, 'success');
}

function quickAddToCart(productId) {
    addProductToCart(productId);
    openCartDrawer();
}

function updateCartItemQty(cartItemId, delta) {
    const itemIndex = STATE.cart.findIndex(i => i.cartItemId === cartItemId);
    if (itemIndex === -1) return;

    STATE.cart[itemIndex].quantity += delta;

    if (STATE.cart[itemIndex].quantity <= 0) {
        STATE.cart.splice(itemIndex, 1);
        showToast('Producto eliminado del carrito', 'info');
    }

    saveCart();
    updateCartUI();
}

function removeCartItem(cartItemId) {
    STATE.cart = STATE.cart.filter(i => i.cartItemId !== cartItemId);
    saveCart();
    updateCartUI();
    showToast('Producto eliminado del carrito', 'info');
}

function saveCart() {
    localStorage.setItem('rincon10_cart', JSON.stringify(STATE.cart));
}

function updateCartUI() {
    const totalCount = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Actualizar contadores
    const headerCount = document.getElementById('cartCount');
    const drawerCount = document.getElementById('cartDrawerCount');
    const totalPreview = document.getElementById('cartTotalPreview');

    if (headerCount) headerCount.textContent = totalCount;
    if (drawerCount) drawerCount.textContent = totalCount;
    if (totalPreview) totalPreview.textContent = formatCurrency(subtotal);

    // Envío gratis dinámico
    const freeShippingText = document.getElementById('freeShippingText');
    const progressBar = document.getElementById('shippingProgressBar');
    const isFreeShipping = subtotal >= STATE.freeShippingThreshold;
    const finalShipping = (subtotal === 0 || isFreeShipping) ? 0 : STATE.shippingCost;

    if (progressBar && freeShippingText) {
        if (subtotal === 0) {
            progressBar.style.width = '0%';
            freeShippingText.innerHTML = `¡Sumá <strong>${formatCurrency(STATE.freeShippingThreshold)}</strong> para tener <strong>ENVÍO GRATIS</strong>!`;
        } else if (isFreeShipping) {
            progressBar.style.width = '100%';
            freeShippingText.innerHTML = `🎉 ¡Genial! Tenés <strong>ENVÍO GRATIS</strong> a cualquier punto del país.`;
        } else {
            const remaining = STATE.freeShippingThreshold - subtotal;
            const pct = Math.min(Math.round((subtotal / STATE.freeShippingThreshold) * 100), 100);
            progressBar.style.width = `${pct}%`;
            freeShippingText.innerHTML = `Te faltan <strong>${formatCurrency(remaining)}</strong> para <strong>ENVÍO GRATIS</strong>`;
        }
    }

    // Cálculos de descuento
    const discountAmount = Math.round(subtotal * STATE.discountRate);
    const totalFinal = subtotal - discountAmount + finalShipping;
    const installmentAmount = Math.round(totalFinal / 3);

    // Actualizar líneas del resumen
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountLine = document.getElementById('cartDiscountLine');
    const discountPercentEl = document.getElementById('discountPercent');
    const discountAmountEl = document.getElementById('cartDiscountAmount');
    const shippingAmountEl = document.getElementById('cartShippingAmount');
    const totalFinalEl = document.getElementById('cartTotalFinal');
    const installmentEl = document.getElementById('cartInstallmentAmount');

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (discountLine) {
        discountLine.style.display = discountAmount > 0 ? 'flex' : 'none';
        if (discountPercentEl) discountPercentEl.textContent = `${Math.round(STATE.discountRate * 100)}%`;
        if (discountAmountEl) discountAmountEl.textContent = `-${formatCurrency(discountAmount)}`;
    }
    if (shippingAmountEl) {
        shippingAmountEl.textContent = finalShipping === 0 ? (subtotal > 0 ? 'GRATIS' : '$0') : formatCurrency(finalShipping);
    }
    if (totalFinalEl) totalFinalEl.textContent = formatCurrency(totalFinal);
    if (installmentEl) installmentEl.textContent = formatCurrency(installmentAmount);

    // Renderizar lista de items
    const listEl = document.getElementById('cartItemsList');
    if (!listEl) return;

    if (STATE.cart.length === 0) {
        listEl.innerHTML = `
            <div class="cart-empty-state">
                <i class="fa-solid fa-shirt"></i>
                <h4>Tu carrito está vacío</h4>
                <p>Elegí una camiseta retro, actual o un accesorio y llevala a la cancha.</p>
                <button class="btn btn-secondary btn-sm" onclick="closeCartDrawer()">
                    Explorar Colección
                </button>
            </div>
        `;
        return;
    }

    listEl.innerHTML = STATE.cart.map(item => `
        <div class="cart-item-card">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='assets/products/cam-arg-2022.svg'">
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.name}</h4>
                <div class="cart-item-meta">
                    Talle: <strong>${item.size}</strong>
                    ${item.customPrint ? `<br>Estampado: <strong>${item.customPrint.name} #${item.customPrint.number}</strong>` : ''}
                </div>
                <div class="cart-item-bottom">
                    <span class="cart-item-price">${formatCurrency(item.price * item.quantity)}</span>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateCartItemQty('${item.cartItemId}', -1)" aria-label="Restar">−</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartItemQty('${item.cartItemId}', 1)" aria-label="Sumar">+</button>
                    </div>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeCartItem('${item.cartItemId}')" title="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');
}

// Cupón de Descuento
function applyCouponCode(code, showNotifications = true) {
    const statusMsg = document.getElementById('couponStatus');
    const upperCode = code.toUpperCase().trim();

    if (upperCode === 'RINCON10') {
        STATE.activeCoupon = 'RINCON10';
        STATE.discountRate = 0.10;
        localStorage.setItem('rincon10_coupon', 'RINCON10');
        if (statusMsg) {
            statusMsg.className = 'coupon-status-msg success';
            statusMsg.textContent = '¡Cupón RINCON10 aplicado! (10% de descuento)';
        }
        if (showNotifications) showToast('¡Cupón aplicado con éxito! 10% OFF', 'success');
    } else if (upperCode === 'COMBO10') {
        STATE.activeCoupon = 'COMBO10';
        STATE.discountRate = 0.25;
        localStorage.setItem('rincon10_coupon', 'COMBO10');
        if (statusMsg) {
            statusMsg.className = 'coupon-status-msg success';
            statusMsg.textContent = '¡Cupón COMBO10 aplicado! (25% de descuento relámpago)';
        }
        if (showNotifications) showToast('¡Descuento relámpago aplicado! 25% OFF', 'success');
    } else if (upperCode === 'ENVIOGRATIS') {
        STATE.activeCoupon = 'ENVIOGRATIS';
        STATE.shippingCost = 0;
        if (statusMsg) {
            statusMsg.className = 'coupon-status-msg success';
            statusMsg.textContent = '¡Cupón de Envío Gratis activado!';
        }
        if (showNotifications) showToast('¡Envío Gratis activado!', 'success');
    } else {
        if (statusMsg) {
            statusMsg.className = 'coupon-status-msg error';
            statusMsg.textContent = 'Código no válido o vencido.';
        }
        if (showNotifications) showToast('El cupón ingresado no es válido', 'error');
        return;
    }

    updateCartUI();
}

function applyPromoCodeDirect(code) {
    applyCouponCode(code, true);
    openCartDrawer();
}

// =========================================================
// CHECKOUT POR WHATSAPP (IDEAL MICROEMPRENDIMIENTO)
// =========================================================
function handleWhatsAppCheckout() {
    if (STATE.cart.length === 0) {
        showToast('Tu carrito está vacío. Agregá algún producto primero.', 'error');
        return;
    }

    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = Math.round(subtotal * STATE.discountRate);
    const isFreeShipping = subtotal >= STATE.freeShippingThreshold || STATE.shippingCost === 0;
    const finalShipping = isFreeShipping ? 0 : STATE.shippingCost;
    const totalFinal = subtotal - discountAmount + finalShipping;

    let message = `*¡HOLA EL RINCÓN DEL 10! 👋*\n`;
    message += `Quiero hacer el siguiente pedido desde la web:\n\n`;
    message += `*📋 DETALLE DE PRODUCTOS:*\n`;

    STATE.cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        message += `   • Talle: ${item.size}\n`;
        if (item.customPrint) {
            message += `   • Estampado: ${item.customPrint.name} #${item.customPrint.number}\n`;
        }
        message += `   • Cantidad: ${item.quantity}\n`;
        message += `   • Precio: ${formatCurrency(item.price * item.quantity)}\n\n`;
    });

    message += `------------------------------\n`;
    message += `*Subtotal:* ${formatCurrency(subtotal)}\n`;
    if (discountAmount > 0) {
        message += `*Descuento (${STATE.activeCoupon}):* -${formatCurrency(discountAmount)}\n`;
    }
    message += `*Envío:* ${finalShipping === 0 ? 'GRATIS' : formatCurrency(finalShipping)}\n`;
    message += `*TOTAL A ABONAR:* *${formatCurrency(totalFinal)}*\n\n`;
    message += `¿Me confirmás el stock y los datos para transferir / abonar? ¡Muchas gracias! 🙌`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5493757323681?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
}

// =========================================================
// PERSONALIZADOR DE CAMISETAS ("EL TALLER DEL 10")
// =========================================================
function initCustomizer() {
    renderCustomizerPresets();

    const nameInput = document.getElementById('customNameInput');
    const numberInput = document.getElementById('customNumberInput');
    const addCustomBtn = document.getElementById('addCustomJerseyBtn');

    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '').slice(0, 12);
            nameInput.value = val;
            STATE.customizer.name = val || 'MESSI';
            updateMockup();
        });
    }

    if (numberInput) {
        numberInput.addEventListener('input', (e) => {
            let num = parseInt(e.target.value, 10);
            if (isNaN(num) || num < 1) num = 1;
            if (num > 99) num = 99;
            STATE.customizer.number = num;
            updateMockup();
        });
    }

    // Talles en el personalizador
    const sizePills = document.querySelectorAll('#customizerSizePills .size-pill');
    sizePills.forEach(pill => {
        pill.addEventListener('click', () => {
            sizePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            STATE.customizer.size = pill.dataset.size;
        });
    });

    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', addCustomJerseyToCart);
    }

    updateMockup();
}

function renderCustomizerPresets() {
    const container = document.getElementById('presetButtons');
    if (!container || !CUSTOMIZER_PRESETS) return;

    container.innerHTML = CUSTOMIZER_PRESETS.map((preset, index) => `
        <button type="button" class="preset-chip ${index === STATE.customizer.presetIndex ? 'active' : ''}" 
                onclick="setCustomizerPreset(${index})">
            ${preset.name}
        </button>
    `).join('');
}

function setCustomizerPreset(index) {
    STATE.customizer.presetIndex = index;
    renderCustomizerPresets();
    updateMockup();
}

function setLegend(name, number) {
    const nameInput = document.getElementById('customNameInput');
    const numberInput = document.getElementById('customNumberInput');

    STATE.customizer.name = name;
    STATE.customizer.number = number;

    if (nameInput) nameInput.value = name;
    if (numberInput) numberInput.value = number;

    // Cambiar preset según jugador para mayor fidelidad
    if (name === 'MESSI' || name === 'MARADONA') {
        setCustomizerPreset(0); // Albiceleste
    } else if (name === 'RIQUELME') {
        setCustomizerPreset(2); // Boca
    } else if (name === 'PELÉ') {
        setCustomizerPreset(0);
    } else if (name === 'MODRIC') {
        setCustomizerPreset(4); // Black & Gold
    }

    updateMockup();
    showToast(`Dorsal ${name} #${number} seleccionado`, 'info');
}

function updateMockup() {
    const preset = CUSTOMIZER_PRESETS[STATE.customizer.presetIndex];
    if (!preset) return;

    const body = document.getElementById('jerseyBody');
    const stripes = document.getElementById('jerseyStripes');
    const band = document.getElementById('jerseyBand');
    const nameEl = document.getElementById('mockupName');
    const numEl = document.getElementById('mockupNumber');

    if (body) {
        body.style.backgroundColor = preset.primaryColor;
    }

    if (stripes) {
        stripes.style.display = preset.stripes ? 'block' : 'none';
        if (preset.stripes) {
            stripes.style.background = `repeating-linear-gradient(90deg, transparent, transparent 32px, ${preset.secondaryColor} 32px, ${preset.secondaryColor} 64px)`;
        }
    }

    if (band) {
        band.style.display = preset.bandColor ? 'block' : 'none';
        if (preset.bandColor) {
            band.style.backgroundColor = preset.bandColor;
        }
    }

    if (nameEl) {
        nameEl.textContent = STATE.customizer.name || 'MESSI';
        nameEl.style.color = preset.textColor;
        nameEl.style.fontFamily = preset.fontFamily;
    }

    if (numEl) {
        numEl.textContent = STATE.customizer.number || '10';
        numEl.style.color = preset.numberColor;
        numEl.style.fontFamily = preset.fontFamily;
    }
}

function addCustomJerseyToCart() {
    const preset = CUSTOMIZER_PRESETS[STATE.customizer.presetIndex];
    const name = STATE.customizer.name.trim() || 'MESSI';
    const number = STATE.customizer.number || 10;
    const size = STATE.customizer.size || 'L';

    const cartItemId = `custom_${preset.id}_${name}_${number}_${size}`;

    const existingIndex = STATE.cart.findIndex(i => i.cartItemId === cartItemId);
    if (existingIndex > -1) {
        STATE.cart[existingIndex].quantity += 1;
    } else {
        STATE.cart.push({
            cartItemId: cartItemId,
            productId: `custom-${preset.id}`,
            name: `Camiseta ${preset.name} (Personalizada)`,
            price: STATE.customizer.price,
            image: "assets/products/cam-arg-2022.svg",
            size: size,
            quantity: 1,
            customPrint: {
                name: name,
                number: number
            }
        });
    }

    saveCart();
    updateCartUI();
    openCartDrawer();
    showToast(`¡Camiseta de ${name} #${number} agregada al carrito!`, 'success');
}

// =========================================================
// FAVORITOS (WISHLIST)
// =========================================================
function initWishlist() {
    const openBtn = document.getElementById('wishlistOpenBtn');
    const closeBtn = document.getElementById('wishlistCloseBtn');
    const overlay = document.getElementById('wishlistModalOverlay');

    if (openBtn) openBtn.addEventListener('click', openWishlistModal);
    if (closeBtn) closeBtn.addEventListener('click', closeWishlistModal);
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeWishlistModal();
        });
    }

    updateWishlistCount();
}

function toggleWishlist(productId) {
    const index = STATE.wishlist.indexOf(productId);
    const product = STATE.products.find(p => p.id === productId);

    if (index > -1) {
        STATE.wishlist.splice(index, 1);
        showToast(`"${product ? product.name : 'Producto'}" quitado de favoritos`, 'info');
    } else {
        STATE.wishlist.push(productId);
        showToast(`"${product ? product.name : 'Producto'}" guardado en favoritos ❤️`, 'success');
    }

    localStorage.setItem('rincon10_wishlist', JSON.stringify(STATE.wishlist));
    updateWishlistCount();
    renderProducts();
}

function updateWishlistCount() {
    const countEl = document.getElementById('wishlistCount');
    const modalCountEl = document.getElementById('wishlistModalCount');
    if (countEl) countEl.textContent = STATE.wishlist.length;
    if (modalCountEl) modalCountEl.textContent = STATE.wishlist.length;
}

function openWishlistModal() {
    const overlay = document.getElementById('wishlistModalOverlay');
    const body = document.getElementById('wishlistModalBody');

    if (!overlay || !body) return;

    const wishlistedProducts = STATE.products.filter(p => STATE.wishlist.includes(p.id));

    if (wishlistedProducts.length === 0) {
        body.innerHTML = `
            <div class="empty-state" style="border: none; padding: 2rem 0;">
                <i class="fa-regular fa-heart" style="font-size: 3rem; color: var(--gold); margin-bottom: 1rem;"></i>
                <h3>No tenés productos guardados</h3>
                <p>Tocá el corazón en cualquier camiseta o accesorio para guardarlo acá.</p>
            </div>
        `;
    } else {
        body.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${wishlistedProducts.map(p => `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.8rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <img src="${p.image}" alt="${p.name}" style="width: 55px; height: 55px; border-radius: var(--radius-sm); object-fit: cover;">
                        <div style="flex: 1;">
                            <strong style="font-size: 0.9rem; color: #fff; display: block;">${p.name}</strong>
                            <span style="font-size: 0.85rem; color: var(--gold); font-weight: 700;">${formatCurrency(p.price)}</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary btn-sm" onclick="quickAddToCart('${p.id}'); closeWishlistModal();">
                                <i class="fa-solid fa-cart-plus"></i> Comprar
                            </button>
                            <button class="action-btn" onclick="toggleWishlist('${p.id}'); openWishlistModal();" title="Eliminar" style="width: 34px; height: 34px; font-size: 0.85rem;">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    overlay.classList.add('active');
}

function closeWishlistModal() {
    const overlay = document.getElementById('wishlistModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

// =========================================================
// VISTA RÁPIDA (QUICK VIEW) & GUÍA DE TALLES
// =========================================================
function initModals() {
    // Quick View
    const qvOverlay = document.getElementById('quickViewModalOverlay');
    const qvClose = document.getElementById('quickViewCloseBtn');
    if (qvClose) qvClose.addEventListener('click', closeQuickView);
    if (qvOverlay) {
        qvOverlay.addEventListener('click', (e) => {
            if (e.target === qvOverlay) closeQuickView();
        });
    }

    // Size Guide
    const sgOverlay = document.getElementById('sizeGuideModalOverlay');
    const sgClose = document.getElementById('sizeGuideCloseBtn');
    const sgOpenBtn = document.getElementById('openSizeGuideBtn');
    const footerSg = document.getElementById('footerSizeGuideLink');

    if (sgOpenBtn) sgOpenBtn.addEventListener('click', openSizeGuide);
    if (footerSg) footerSg.addEventListener('click', (e) => { e.preventDefault(); openSizeGuide(); });
    if (sgClose) sgClose.addEventListener('click', closeSizeGuide);
    if (sgOverlay) {
        sgOverlay.addEventListener('click', (e) => {
            if (e.target === sgOverlay) closeSizeGuide();
        });
    }

    // Checkout Modal
    const chkOverlay = document.getElementById('checkoutModalOverlay');
    const chkClose = document.getElementById('checkoutCloseBtn');
    const chkForm = document.getElementById('checkoutForm');

    if (chkClose) chkClose.addEventListener('click', closeCheckoutModal);
    if (chkOverlay) {
        chkOverlay.addEventListener('click', (e) => {
            if (e.target === chkOverlay) closeCheckoutModal();
        });
    }

    if (chkForm) {
        chkForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

function openQuickView(productId) {
    const product = STATE.products.find(p => p.id === productId);
    if (!product) return;

    const overlay = document.getElementById('quickViewModalOverlay');
    const body = document.getElementById('quickViewBody');

    if (!overlay || !body) return;

    const selectedSize = STATE.selectedSizes[product.id] || (product.sizes ? product.sizes[0] : '');
    const installmentPrice = Math.round(product.price / 3);

    body.innerHTML = `
        <div class="quick-view-grid">
            <div>
                <img src="${product.image}" alt="${product.name}" class="qv-image" onerror="this.src='assets/products/cam-arg-2022.svg'">
            </div>
            <div class="qv-details">
                ${product.badge ? `<span class="qv-badge">${product.badge}</span>` : ''}
                <h2 class="qv-title">${product.name}</h2>
                <div class="card-rating" style="margin-bottom: 0.8rem;">
                    <i class="fa-solid fa-star"></i>
                    <strong>${product.rating.toFixed(1)}</strong>
                    <span>(${product.reviewsCount} opiniones verificadas)</span>
                </div>
                <p class="qv-desc">${product.description}</p>
                <div class="qv-price-row">
                    <span class="qv-price">${formatCurrency(product.price)}</span>
                    ${product.originalPrice ? `<span class="card-old-price">${formatCurrency(product.originalPrice)}</span>` : ''}
                </div>
                <div class="installments-note" style="margin-bottom: 1.5rem;">
                    <i class="fa-solid fa-credit-card"></i> 3 cuotas sin interés de <strong>${formatCurrency(installmentPrice)}</strong>
                </div>

                ${product.sizes && product.sizes.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; display: block;">
                            Elegí tu talle:
                        </label>
                        <div class="sizes-options">
                            ${product.sizes.map(size => `
                                <button type="button" 
                                        class="size-btn ${size === selectedSize ? 'selected' : ''}" 
                                        onclick="selectProductSize('${product.id}', '${size}'); openQuickView('${product.id}');">
                                    ${size}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div style="display: flex; gap: 0.8rem;">
                    <button class="btn btn-primary btn-block btn-lg" onclick="addProductToCart('${product.id}'); closeQuickView(); openCartDrawer();">
                        <i class="fa-solid fa-cart-plus"></i> Comprar Ahora
                    </button>
                    <button class="action-btn" onclick="toggleWishlist('${product.id}')" title="Guardar">
                        <i class="fa-${STATE.wishlist.includes(product.id) ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    overlay.classList.add('active');
}

function closeQuickView() {
    const overlay = document.getElementById('quickViewModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function openSizeGuide() {
    const overlay = document.getElementById('sizeGuideModalOverlay');
    if (overlay) overlay.classList.add('active');
}

function closeSizeGuide() {
    const overlay = document.getElementById('sizeGuideModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

// Checkout Modal
function openCheckoutModal() {
    const overlay = document.getElementById('checkoutModalOverlay');
    const modalTotal = document.getElementById('chkModalTotal');
    if (!overlay) return;

    const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = Math.round(subtotal * STATE.discountRate);
    const isFreeShipping = subtotal >= STATE.freeShippingThreshold || STATE.shippingCost === 0;
    const finalShipping = isFreeShipping ? 0 : STATE.shippingCost;
    const totalFinal = subtotal - discountAmount + finalShipping;

    if (modalTotal) modalTotal.textContent = formatCurrency(totalFinal);
    overlay.classList.add('active');
}

function closeCheckoutModal() {
    const overlay = document.getElementById('checkoutModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

function handleCheckoutSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('chkName').value;
    const phone = document.getElementById('chkPhone').value;
    const address = document.getElementById('chkAddress').value;
    const city = document.getElementById('chkCity').value;
    const payment = document.querySelector('input[name="paymentMethod"]:checked').value;

    const orderNumber = Math.floor(100000 + Math.random() * 900000);

    const content = document.getElementById('checkoutModalContent');
    if (content) {
        content.innerHTML = `
            <div class="order-success-ticket">
                <div class="success-icon-badge">
                    <i class="fa-solid fa-check"></i>
                </div>
                <h3>¡Orden Recibida con Éxito!</h3>
                <span class="order-id-tag">PEDIDO #${orderNumber}</span>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.95rem;">
                    Muchas gracias por tu compra, <strong>${name}</strong>. Te enviamos los detalles a tu WhatsApp (${phone}).
                </p>
                <div style="background: var(--bg-surface); padding: 1.2rem; border-radius: var(--radius-md); text-align: left; margin-bottom: 1.5rem; font-size: 0.85rem; border: 1px solid var(--border-color);">
                    <div style="color: var(--gold); font-weight: 700; margin-bottom: 0.4rem;">Datos de Entrega:</div>
                    <div>${address}, ${city}</div>
                    <div style="margin-top: 0.8rem; color: var(--gold); font-weight: 700; margin-bottom: 0.4rem;">Estado del Pago:</div>
                    <div>${payment === 'transfer' ? 'Esperando Comprobante de Transferencia (15% OFF aplicado)' : 'Procesado correctamente mediante plataforma segura'}</div>
                </div>
                <button class="btn btn-primary btn-block" onclick="finishOrderAndReload()">
                    Entendido, Volver a la Tienda
                </button>
            </div>
        `;
    }

    // Vaciar carrito
    STATE.cart = [];
    saveCart();
    updateCartUI();
}

function finishOrderAndReload() {
    closeCheckoutModal();
    window.location.reload();
}

// =========================================================
// CUENTA REGRESIVA (OFERTA RELÁMPAGO)
// =========================================================
function initCountdown() {
    // Cuenta regresiva de 24hs rotativa
    let hours = 18;
    let minutes = 42;
    let seconds = 30;

    const hEl = document.getElementById('timerHours');
    const mEl = document.getElementById('timerMinutes');
    const sEl = document.getElementById('timerSeconds');

    if (!hEl || !mEl || !sEl) return;

    setInterval(() => {
        if (seconds > 0) {
            seconds--;
        } else {
            seconds = 59;
            if (minutes > 0) {
                minutes--;
            } else {
                minutes = 59;
                if (hours > 0) {
                    hours--;
                } else {
                    hours = 23;
                }
            }
        }

        hEl.textContent = String(hours).padStart(2, '0');
        mEl.textContent = String(minutes).padStart(2, '0');
        sEl.textContent = String(seconds).padStart(2, '0');
    }, 1000);
}

// =========================================================
// NAVEGACIÓN MOBILE & SCROLL TO TOP
// =========================================================
function initScrollAndNav() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const closeMobileBtn = document.getElementById('closeMobileMenuBtn');
    const mainNav = document.getElementById('mainNav');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => {
            mainNav.classList.add('active');
        });
    }

    if (closeMobileBtn && mainNav) {
        closeMobileBtn.addEventListener('click', () => {
            mainNav.classList.remove('active');
        });
    }

    // Cerrar al hacer click en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav) mainNav.classList.remove('active');
        });
    });

    // Scroll to Top
    window.addEventListener('scroll', () => {
        if (scrollTopBtn) {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        }
    });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// =========================================================
// CONTACTO Y NEWSLETTER
// =========================================================
function initContactAndNewsletter() {
    const contactForm = document.getElementById('contactForm');
    const newsletterForm = document.getElementById('newsletterForm');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            showToast(`¡Gracias ${name}! Tu consulta fue enviada con éxito. Te responderemos a la brevedad por WhatsApp.`, 'success');
            contactForm.reset();
        });
    }

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('¡Te suscribiste con éxito! Tu cupón de bienvenida es RINCON10', 'success');
            newsletterForm.reset();
        });
    }
}

// =========================================================
// SISTEMA DE TOAST NOTIFICATIONS
// =========================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}



// =========================================================
// CALCULADORA DE COSTOS & PANEL DE GESTIÓN (PRIVADO)
// =========================================================
function initAdminCostCalculator() {
    const authBox = document.getElementById('adminAuthBox');
    const dashboardPanel = document.getElementById('adminDashboardPanel');
    const loginForm = document.getElementById('adminLoginForm');
    const passInput = document.getElementById('adminPassInput');
    const togglePassBtn = document.getElementById('btnTogglePass');
    const authFeedback = document.getElementById('adminAuthFeedback');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const recalculateBtn = document.getElementById('btnRecalculateCosts');
    const resetCalcBtn = document.getElementById('btnResetCalcFields');
    const saveCostBtn = document.getElementById('btnSaveCostProduct');
    const exportBtn = document.getElementById('btnExportCosts');
    const marginSlider = document.getElementById('marginSlider');
    const quickMarginBtns = document.querySelectorAll('.btn-quick-margin');
    const allCalcInputs = document.querySelectorAll('.calc-var-input, .calc-fix-input, #costBatchUnits, #costProdName');
    const navCostosBtn = document.getElementById('navCostosBtn');

    // Navegación fluida al panel
    if (navCostosBtn) {
        navCostosBtn.addEventListener('click', (e) => {
            const isAuth = sessionStorage.getItem('rincon10_admin_auth') === 'true';
            if (!isAuth && passInput) {
                setTimeout(() => passInput.focus(), 400);
            }
        });
    }

    // Verificar si ya hay una sesión desbloqueada en esta pestaña
    if (sessionStorage.getItem('rincon10_admin_auth') === 'true') {
        unlockAdminPanel(false);
    }

    // Toggle para mostrar/ocultar contraseña (visualmente en el input)
    if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
            const isPassword = passInput.type === 'password';
            passInput.type = isPassword ? 'text' : 'password';
            togglePassBtn.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
        });
    }

    // Validación de contraseña
    if (loginForm && passInput) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputVal = passInput.value.trim();

            // Validación estricta sin mostrar la clave en el panel
            if (inputVal === 'renzo777') {
                sessionStorage.setItem('rincon10_admin_auth', 'true');
                if (authFeedback) {
                    authFeedback.className = 'admin-auth-feedback success';
                    authFeedback.textContent = '¡Acceso concedido! Abriendo panel de costos...';
                }
                setTimeout(() => {
                    unlockAdminPanel(true);
                }, 350);
            } else {
                if (authFeedback) {
                    authFeedback.className = 'admin-auth-feedback error';
                    authFeedback.textContent = 'Contraseña incorrecta. Acceso restringido.';
                }
                passInput.value = '';
                passInput.focus();
                showToast('Contraseña incorrecta', 'error');
            }
        });
    }

    // Botón de Bloquear Panel / Cerrar Sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('rincon10_admin_auth');
            lockAdminPanel();
            showToast('Panel de costos bloqueado con éxito', 'info');
        });
    }

    // Cálculo instantáneo al escribir en cualquier campo
    allCalcInputs.forEach(input => {
        input.addEventListener('input', () => {
            calculateAndRenderCosts();
        });
    });

    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', () => {
            calculateAndRenderCosts();
            const heroCard = document.querySelector('.cost-total-hero-card');
            if (heroCard) {
                heroCard.style.transform = 'scale(1.02)';
                setTimeout(() => heroCard.style.transform = 'scale(1)', 250);
            }
            showToast('Costos actualizados', 'success');
        });
    }

    // Slider de Margen de Ganancia
    if (marginSlider) {
        marginSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            const badge = document.getElementById('marginDisplayBadge');
            if (badge) badge.textContent = `${val}% Margen`;
            quickMarginBtns.forEach(b => b.classList.toggle('active', b.dataset.margin === val));
            calculateAndRenderCosts();
        });
    }

    // Botones rápidos de Margen (+30%, +40%, +50%, +70%, +100%)
    quickMarginBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const margin = btn.dataset.margin;
            quickMarginBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (marginSlider) marginSlider.value = margin;
            const badge = document.getElementById('marginDisplayBadge');
            if (badge) badge.textContent = `${margin}% Margen`;
            calculateAndRenderCosts();
        });
    });

    // Guardar Producto en la lista
    if (saveCostBtn) {
        saveCostBtn.addEventListener('click', saveCurrentProductCost);
    }

    // Restablecer valores
    if (resetCalcBtn) {
        resetCalcBtn.addEventListener('click', resetCalculatorValues);
    }

    // Exportar Resumen
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCostsSummary);
    }

    // Cargar historial y realizar primer cálculo
    renderSavedCostsTable();
    calculateAndRenderCosts();
}

function unlockAdminPanel(notify = true) {
    const authBox = document.getElementById('adminAuthBox');
    const dashboardPanel = document.getElementById('adminDashboardPanel');
    const authFeedback = document.getElementById('adminAuthFeedback');
    const passInput = document.getElementById('adminPassInput');

    if (authBox) authBox.style.display = 'none';
    if (dashboardPanel) dashboardPanel.style.display = 'flex';
    if (authFeedback) authFeedback.textContent = '';
    if (passInput) passInput.value = '';

    calculateAndRenderCosts();
    renderSavedCostsTable();

    if (notify) {
        showToast('Bienvenido al Panel de Costos y Rentabilidad', 'success');
    }
}

function lockAdminPanel() {
    const authBox = document.getElementById('adminAuthBox');
    const dashboardPanel = document.getElementById('adminDashboardPanel');
    const passInput = document.getElementById('adminPassInput');
    const authFeedback = document.getElementById('adminAuthFeedback');

    if (dashboardPanel) dashboardPanel.style.display = 'none';
    if (authBox) authBox.style.display = 'block';
    if (passInput) {
        passInput.value = '';
        passInput.focus();
    }
    if (authFeedback) authFeedback.textContent = '';
}

function getCalculatorValues() {
    const getVal = (id) => {
        const el = document.getElementById(id);
        const val = parseFloat(el ? el.value : 0);
        return isNaN(val) || val < 0 ? 0 : val;
    };

    const prodNameInput = document.getElementById('costProdName');
    const prodName = prodNameInput && prodNameInput.value.trim() !== '' ? prodNameInput.value.trim() : 'Prenda / Accesorio';

    // Unidades del lote / ventas mensuales
    const batchUnitsEl = document.getElementById('costBatchUnits');
    let batchUnits = parseInt(batchUnitsEl ? batchUnitsEl.value : 60, 10);
    if (isNaN(batchUnits) || batchUnits <= 0) batchUnits = 1;

    // Costos Variables
    const varBase = getVal('varBaseCost');
    const varPrint = getVal('varPrintCost');
    const varPackaging = getVal('varPackagingCost');
    const varShipping = getVal('varDirectShipping');
    const varPayment = getVal('varPaymentFee');
    const varOther = getVal('varOtherCost');
    const totalVariable = varBase + varPrint + varPackaging + varShipping + varPayment + varOther;

    // Costos Fijos Mensuales
    const fixRent = getVal('fixRentCost');
    const fixServices = getVal('fixServicesCost');
    const fixAds = getVal('fixAdsCost');
    const fixMaintenance = getVal('fixMaintenanceCost');
    const fixSalary = getVal('fixSalaryCost');
    const fixOther = getVal('fixOtherCost');
    const totalFixedMonth = fixRent + fixServices + fixAds + fixMaintenance + fixSalary + fixOther;

    // Margen
    const marginSlider = document.getElementById('marginSlider');
    const marginPercent = parseInt(marginSlider ? marginSlider.value : 40, 10) || 40;

    return {
        prodName,
        batchUnits,
        totalVariable,
        totalFixedMonth,
        marginPercent
    };
}

function calculateAndRenderCosts() {
    const data = getCalculatorValues();

    // 1. Costo Fijo Unitario Prorrateado
    const fixedPerUnit = Math.round(data.totalFixedMonth / data.batchUnits);

    // 2. Costo Total Unitario (Variable + Fijo)
    const costoTotalUnitario = data.totalVariable + fixedPerUnit;

    // 3. Porcentajes
    const variablePercent = costoTotalUnitario > 0 ? Math.round((data.totalVariable / costoTotalUnitario) * 100) : 0;
    const fijoPercent = 100 - variablePercent;

    // 4. Precio de Venta Sugerido y Ganancia Neta
    const precioVentaSugerido = Math.round(costoTotalUnitario * (1 + data.marginPercent / 100));
    const gananciaNeta = precioVentaSugerido - costoTotalUnitario;
    const cuota3 = Math.round(precioVentaSugerido / 3);

    // 5. Punto de Equilibrio (Break-Even)
    const margenContribucion = precioVentaSugerido - data.totalVariable;
    const breakEven = margenContribucion > 0 ? Math.ceil(data.totalFixedMonth / margenContribucion) : 0;

    // Actualizar Previews de subtotales
    const subVarPreview = document.getElementById('subtotalVariablesPreview');
    const subFixPreview = document.getElementById('subtotalFijosPreview');
    if (subVarPreview) subVarPreview.textContent = formatCurrency(data.totalVariable);
    if (subFixPreview) subFixPreview.textContent = formatCurrency(data.totalFixedMonth);

    // Actualizar Card Destacada de Costo Total
    const resTotal = document.getElementById('resCostoTotalUnitario');
    const resFormula = document.getElementById('resFormulaBreakdown');
    if (resTotal) resTotal.textContent = formatCurrency(costoTotalUnitario);
    if (resFormula) {
        resFormula.textContent = `Variable: ${formatCurrency(data.totalVariable)} + Fijo prorrateado: ${formatCurrency(fixedPerUnit)}`;
    }

    // Actualizar Métricas Secundarias
    const resVarUnit = document.getElementById('resVariableUnitario');
    const resVarPct = document.getElementById('resVariablePercent');
    const resFixUnit = document.getElementById('resFijoUnitario');
    const resFixPct = document.getElementById('resFijoPercent');
    const resTotFix = document.getElementById('resTotalFijosMes');
    const resBatchLbl = document.getElementById('resBatchLabel');
    const resBreakEven = document.getElementById('resBreakEvenUnits');

    if (resVarUnit) resVarUnit.textContent = formatCurrency(data.totalVariable);
    if (resVarPct) resVarPct.textContent = `${variablePercent}% del costo`;
    if (resFixUnit) resFixUnit.textContent = formatCurrency(fixedPerUnit);
    if (resFixPct) resFixPct.textContent = `${fijoPercent}% del costo`;
    if (resTotFix) resTotFix.textContent = formatCurrency(data.totalFixedMonth);
    if (resBatchLbl) resBatchLbl.textContent = `Prorrateado en ${data.batchUnits} u./mes`;
    if (resBreakEven) resBreakEven.textContent = `${breakEven} prendas/mes`;

    // Actualizar Resultados de Precio y Ganancia
    const resPrecioVenta = document.getElementById('resPrecioVentaSugerido');
    const resCuotas = document.getElementById('resCuotasVentaSugerido');
    const resGanancia = document.getElementById('resGananciaNeta');
    const resMargenReal = document.getElementById('resMargenRealGanancia');

    if (resPrecioVenta) resPrecioVenta.textContent = formatCurrency(precioVentaSugerido);
    if (resCuotas) resCuotas.textContent = `3 cuotas de ${formatCurrency(cuota3)}`;
    if (resGanancia) resGanancia.textContent = `+${formatCurrency(gananciaNeta)}`;
    if (resMargenReal) resMargenReal.textContent = `${data.marginPercent}% de rentabilidad neta`;
}

// Guardar producto en lista local
function saveCurrentProductCost() {
    const data = getCalculatorValues();
    const fixedPerUnit = Math.round(data.totalFixedMonth / data.batchUnits);
    const costoTotalUnitario = data.totalVariable + fixedPerUnit;
    const precioVentaSugerido = Math.round(costoTotalUnitario * (1 + data.marginPercent / 100));
    const gananciaNeta = precioVentaSugerido - costoTotalUnitario;

    const saved = JSON.parse(localStorage.getItem('rincon10_saved_costs')) || [];

    const newItem = {
        id: 'cost_' + Date.now(),
        name: data.prodName,
        totalVariable: data.totalVariable,
        fixedPerUnit: fixedPerUnit,
        costoTotalUnitario: costoTotalUnitario,
        marginPercent: data.marginPercent,
        precioVentaSugerido: precioVentaSugerido,
        gananciaNeta: gananciaNeta,
        date: new Date().toLocaleDateString('es-AR')
    };

    saved.unshift(newItem);
    localStorage.setItem('rincon10_saved_costs', JSON.stringify(saved));

    renderSavedCostsTable();
    showToast(`"${newItem.name}" guardado en la lista de costos`, 'success');
}

function renderSavedCostsTable() {
    const tbody = document.getElementById('savedCostsTableBody');
    if (!tbody) return;

    const saved = JSON.parse(localStorage.getItem('rincon10_saved_costs')) || [];

    if (saved.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--gold);"></i>
                    No hay productos guardados todavía. Cargá los costos arriba y hacé clic en "Guardar Producto en la Lista".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = saved.map(item => `
        <tr>
            <td>
                <strong>${item.name}</strong>
                <small style="display: block; color: var(--text-muted); font-size: 0.72rem;">${item.date}</small>
            </td>
            <td>${formatCurrency(item.totalVariable)}</td>
            <td>${formatCurrency(item.fixedPerUnit)}</td>
            <td><strong style="color: #ffffff;">${formatCurrency(item.costoTotalUnitario)}</strong></td>
            <td><span class="discount-pill">${item.marginPercent}%</span></td>
            <td><strong style="color: var(--gold);">${formatCurrency(item.precioVentaSugerido)}</strong></td>
            <td><strong style="color: #10b981;">+${formatCurrency(item.gananciaNeta)}</strong></td>
            <td>
                <div class="admin-table-actions">
                    <button type="button" class="btn-table-action delete" onclick="deleteSavedCost('${item.id}')" title="Eliminar">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteSavedCost(id) {
    let saved = JSON.parse(localStorage.getItem('rincon10_saved_costs')) || [];
    saved = saved.filter(item => item.id !== id);
    localStorage.setItem('rincon10_saved_costs', JSON.stringify(saved));
    renderSavedCostsTable();
    showToast('Producto eliminado de la lista de costos', 'info');
}

function resetCalculatorValues() {
    const defaultVals = {
        costProdName: 'Camiseta Fútbol Titular',
        costBatchUnits: 60,
        varBaseCost: 16000,
        varPrintCost: 3800,
        varPackagingCost: 1200,
        varDirectShipping: 2500,
        varPaymentFee: 1500,
        varOtherCost: 500,
        fixRentCost: 80000,
        fixServicesCost: 25000,
        fixAdsCost: 35000,
        fixMaintenanceCost: 10000,
        fixSalaryCost: 200000,
        fixOtherCost: 10000
    };

    Object.entries(defaultVals).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });

    const marginSlider = document.getElementById('marginSlider');
    if (marginSlider) marginSlider.value = 40;

    const badge = document.getElementById('marginDisplayBadge');
    if (badge) badge.textContent = '40% Margen';

    document.querySelectorAll('.btn-quick-margin').forEach(b => {
        b.classList.toggle('active', b.dataset.margin === '40');
    });

    calculateAndRenderCosts();
    showToast('Valores restablecidos por defecto', 'info');
}

function exportCostsSummary() {
    const saved = JSON.parse(localStorage.getItem('rincon10_saved_costs')) || [];
    const current = getCalculatorValues();
    const fixedPerUnit = Math.round(current.totalFixedMonth / current.batchUnits);
    const costoTotalUnitario = current.totalVariable + fixedPerUnit;
    const precioVentaSugerido = Math.round(costoTotalUnitario * (1 + current.marginPercent / 100));
    const gananciaNeta = precioVentaSugerido - costoTotalUnitario;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Producto,Costo Variable,Costo Fijo Unitario,Costo Total,Margen %,Precio Sugerido,Ganancia Neta,Fecha\r\n";

    // Agregar actual
    csvContent += `"${current.prodName}",${current.totalVariable},${fixedPerUnit},${costoTotalUnitario},${current.marginPercent}%,${precioVentaSugerido},${gananciaNeta},"${new Date().toLocaleDateString('es-AR')}"\r\n`;

    // Agregar guardados
    saved.forEach(item => {
        csvContent += `"${item.name}",${item.totalVariable},${item.fixedPerUnit},${item.costoTotalUnitario},${item.marginPercent}%,${item.precioVentaSugerido},${item.gananciaNeta},"${item.date}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Costos_ElRinconDel10_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Resumen de costos exportado en CSV', 'success');
}
