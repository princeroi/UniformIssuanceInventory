// pos.js - Updated with Error Modal UI

// Initialize when page loads
window.init_pos = function() {
    console.log('Initializing POS...');
    loadProducts();
    setupSearch();
    setupCategories();
    initializeCart();
};

// Cart state
let cart = [];

// Initialize cart
function initializeCart() {
    updateCartDisplay();
}

// Load all products
function loadProducts() {
    const container = document.getElementById('productsContainer');
    
    if (!container) {
        console.error('Products container not found!');
        return;
    }
    
    container.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading products...</p>
        </div>
    `;
    
    fetch('controller/pos.php?action=getItems')
        .then(response => response.text())
        .then(text => JSON.parse(text))
        .then(result => {
            if (result.success) {
                displayProducts(result.data || []);
            } else {
                showErrorModal('Load Error', result.message || 'Failed to load products');
                container.innerHTML = `
                    <div class="col-12 text-center text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                        <p>Error: ${result.message}</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showErrorModal('Network Error', 'Unable to connect to server. Please check your connection and try again.');
            container.innerHTML = `
                <div class="col-12 text-center text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Error loading products</p>
                </div>
            `;
        });
}

// Display products
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted">
                <i class="fas fa-box-open fa-3x mb-3"></i>
                <p>No products available</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => {
        const stockColor = product.quantity === 0 ? 'danger' : 
                          product.quantity <= (product.min_stock || 10) ? 'warning' : 'success';
        
        const hasImage = product.image_url && product.image_url !== 'assets/no-image.png';
        const isOutOfStock = product.quantity === 0;
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 product-card border-0 shadow-sm ${isOutOfStock ? 'out-of-stock' : ''}">
                    <div class="position-relative">
                        ${isOutOfStock ? '<div class="out-of-stock-overlay"><span class="badge">OUT OF STOCK</span></div>' : ''}
                        <div class="position-absolute top-0 start-0 w-100 d-flex justify-content-between align-items-start p-3" style="z-index: 10;">
                            <span class="badge bg-dark bg-opacity-75 px-3 py-2" style="font-size: 1.1rem; font-weight: 600;">
                                ${escapeHtml(product.size)}
                            </span>
                            <span class="badge bg-${stockColor} bg-opacity-90 px-2 py-1" style="font-size: 0.75rem;">
                                ${product.quantity} in stock
                            </span>
                        </div>
                        
                        ${hasImage ? 
                            `<img src="${product.image_url}" class="card-img-top" style="height: 220px; object-fit: cover;"
                                 onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <div style="height: 220px; background: #e9ecef; display: none; align-items: center; justify-content: center;">
                                 <i class="fas fa-image fa-3x text-secondary opacity-50"></i>
                             </div>` 
                            : 
                            `<div style="height: 220px; background: #e9ecef; display: flex; align-items: center; justify-content: center;">
                                 <i class="fas fa-image fa-3x text-secondary opacity-50"></i>
                             </div>`
                        }
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title mb-2 fw-semibold" style="font-size: 0.95rem;">
                            ${escapeHtml(product.item_name)}
                        </h6>
                        <div class="d-flex align-items-center gap-2 mb-3">
                            <span class="badge rounded-pill bg-light text-dark border" style="font-size: 0.7rem;">
                                ${escapeHtml(product.category)}
                            </span>
                        </div>
                        <button class="btn btn-primary btn-sm w-100 mt-auto" 
                                onclick="showAddToCartModal('${product.item_code}', '${escapeHtml(product.item_name)}', ${product.quantity})"
                                ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus me-1"></i> ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Setup search
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let timeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const searchTerm = this.value.trim();
            fetch(`controller/pos.php?action=searchItems&search=${encodeURIComponent(searchTerm)}`)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        displayProducts(result.data || []);
                    }
                })
                .catch(error => {
                    console.error('Search error:', error);
                    showErrorModal('Search Error', 'Failed to search products. Please try again.');
                });
        }, 500);
    });
}

// Setup category buttons
function setupCategories() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            
            const container = document.getElementById('productsContainer');
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
            `;
            
            fetch(`controller/pos.php?action=getItemsByCategory&category=${encodeURIComponent(category)}`)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        displayProducts(result.data || []);
                    }
                })
                .catch(error => {
                    console.error('Filter error:', error);
                    showErrorModal('Filter Error', 'Failed to filter products. Please try again.');
                });
        });
    });
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error modal
function showErrorModal(title, message, type = 'danger') {
    const iconMap = {
        danger: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const colorMap = {
        danger: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    };
    
    const modalHtml = `
        <div class="modal fade" id="errorModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header ${colorMap[type]} text-white">
                        <h5 class="modal-title">
                            <i class="fas ${iconMap[type]} me-2"></i>${escapeHtml(title)}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center py-3">
                            <i class="fas ${iconMap[type]} fa-4x text-${type} mb-3"></i>
                            <p class="mb-0" style="font-size: 1.1rem;">${escapeHtml(message)}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('errorModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    modal.show();
    
    document.getElementById('errorModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Show add to cart modal
function showAddToCartModal(itemCode, itemName, maxQuantity) {
    // Check if item is out of stock
    if (maxQuantity === 0) {
        showErrorModal('Out of Stock', `${itemName} is currently out of stock. Please select another item.`, 'warning');
        return;
    }
    
    const modalHtml = `
        <div class="modal fade" id="addToCartModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add to Cart</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6 class="mb-3">${itemName}</h6>
                        <div class="mb-3">
                            <label class="form-label">Quantity (Available: ${maxQuantity})</label>
                            <div class="input-group">
                                <button class="btn btn-outline-secondary" type="button" onclick="adjustModalQuantity(-1)">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <input type="number" class="form-control text-center" id="modalQuantity" value="1" min="1" max="${maxQuantity}">
                                <button class="btn btn-outline-secondary" type="button" onclick="adjustModalQuantity(1)">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="addToCart('${itemCode}', '${itemName}', ${maxQuantity})">
                            <i class="fas fa-cart-plus me-1"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('addToCartModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('addToCartModal'));
    modal.show();
    
    document.getElementById('addToCartModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Adjust quantity in modal
function adjustModalQuantity(change) {
    const input = document.getElementById('modalQuantity');
    if (!input) return;
    
    const currentValue = parseInt(input.value) || 1;
    const newValue = currentValue + change;
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 999;
    
    if (newValue >= min && newValue <= max) {
        input.value = newValue;
    }
}

// Add item to cart
function addToCart(itemCode, itemName, maxQuantity) {
    const quantityInput = document.getElementById('modalQuantity');
    const quantity = parseInt(quantityInput?.value) || 1;
    
    if (quantity > maxQuantity) {
        showErrorModal('Insufficient Stock', `Cannot add more than ${maxQuantity} items. Only ${maxQuantity} available in stock.`, 'warning');
        return;
    }
    
    const existingIndex = cart.findIndex(item => item.item_code === itemCode);
    
    if (existingIndex !== -1) {
        const newQuantity = cart[existingIndex].quantity + quantity;
        if (newQuantity > maxQuantity) {
            showErrorModal('Stock Limit Exceeded', `Cannot add more items. Maximum available: ${maxQuantity}. You already have ${cart[existingIndex].quantity} in cart.`, 'warning');
            return;
        }
        cart[existingIndex].quantity = newQuantity;
    } else {
        cart.push({
            item_code: itemCode,
            item_name: itemName,
            quantity: quantity,
            max_quantity: maxQuantity
        });
    }
    
    updateCartDisplay();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addToCartModal'));
    if (modal) modal.hide();
    
    showToast(`${itemName} (${quantity}) added to cart`, 'success');
}

// Update cart display
function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    const totalItemsEl = document.getElementById('totalItems');
    const completeBtn = document.getElementById('completeTransactionBtn');
    
    if (!cartContainer) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (completeBtn) completeBtn.disabled = cart.length === 0;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-shopping-basket fa-2x mb-2"></i>
                <p class="mb-0">Cart is empty</p>
            </div>
        `;
        return;
    }
    
    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="card mb-2 border-0 shadow-sm">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0 fw-semibold" style="font-size: 0.9rem;">${escapeHtml(item.item_name)}</h6>
                    <button class="btn btn-sm btn-link text-danger p-0" onclick="removeFromCart(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">Max: ${item.max_quantity}</small>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="updateCartQuantity(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="btn btn-outline-secondary" disabled style="min-width: 50px;">
                            ${item.quantity}
                        </button>
                        <button class="btn btn-outline-secondary" onclick="updateCartQuantity(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Update cart item quantity
function updateCartQuantity(index, change) {
    if (index < 0 || index >= cart.length) return;
    
    const newQuantity = cart[index].quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > cart[index].max_quantity) {
        showErrorModal('Stock Limit', `Cannot exceed available stock. Maximum: ${cart[index].max_quantity}`, 'warning');
        return;
    }
    
    cart[index].quantity = newQuantity;
    updateCartDisplay();
}

// Remove item from cart
function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;
    
    const itemName = cart[index].item_name;
    cart.splice(index, 1);
    updateCartDisplay();
    showToast(`${itemName} removed from cart`, 'info');
}

// Clear cart
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear all items from the cart?')) {
        cart = [];
        updateCartDisplay();
        showToast('Cart cleared', 'info');
    }
}

// Show confirmation modal
function showConfirmationModal() {
    if (cart.length === 0) {
        showErrorModal('Empty Cart', 'Your cart is empty. Please add items before completing transaction.', 'warning');
        return;
    }
    
    const employeeName = document.getElementById('employeeName')?.value.trim();
    const siteAssignedEl = document.getElementById('siteAssigned');
    const siteAssigned = siteAssignedEl?.value || '';
    const issuanceType = document.getElementById('issuanceType')?.value;
    
    if (!employeeName) {
        showErrorModal('Missing Information', 'Please enter employee name before completing transaction.', 'warning');
        document.getElementById('employeeName')?.focus();
        return;
    }
    
    if (!siteAssigned || siteAssigned === '') {
        showErrorModal('Missing Information', 'Please select site assigned before completing transaction.', 'warning');
        if (siteAssignedEl) siteAssignedEl.focus();
        return;
    }
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const itemsList = cart.map(item => `
        <tr>
            <td>${escapeHtml(item.item_name)}</td>
            <td class="text-end">${item.quantity}</td>
        </tr>
    `).join('');
    
    const modalHtml = `
        <div class="modal fade" id="confirmationModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle me-2"></i>Confirm Transaction
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>Employee:</strong> ${escapeHtml(employeeName)}<br>
                            <strong>Site Assigned:</strong> ${escapeHtml(siteAssigned)}<br>
                            <strong>Issuance Type:</strong> ${escapeHtml(issuanceType)}<br>
                            <strong>Total Items:</strong> ${totalItems}
                        </div>
                        
                        <h6 class="mb-2">Items to be issued:</h6>
                        <div style="max-height: 200px; overflow-y: auto;">
                            <table class="table table-sm table-bordered">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th class="text-end">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsList}
                                </tbody>
                            </table>
                        </div>
                        
                        <p class="text-danger mb-0 mt-3">
                            <i class="fas fa-info-circle me-1"></i>
                            <small>This action will deduct items from inventory.</small>
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cancel
                        </button>
                        <button type="button" class="btn btn-success" onclick="completeTransaction()">
                            <i class="fas fa-check-circle me-1"></i>Confirm & Complete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('confirmationModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modal.show();
    
    document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Complete transaction
function completeTransaction() {
    const employeeName = document.getElementById('employeeName')?.value.trim();
    const siteAssignedEl = document.getElementById('siteAssigned');
    const siteAssigned = siteAssignedEl?.value || '';
    const issuanceType = document.getElementById('issuanceType')?.value;
    
    if (!siteAssigned || siteAssigned === '') {
        showErrorModal('Missing Information', 'Please select site assigned', 'warning');
        if (siteAssignedEl) siteAssignedEl.focus();
        return;
    }
    
    const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
    if (confirmModal) confirmModal.hide();
    
    showLoadingModal();
    
    const formData = new FormData();
    formData.append('action', 'completeTransaction');
    formData.append('employee_name', employeeName);
    formData.append('site_assigned', siteAssigned);
    formData.append('issuance_type', issuanceType);
    formData.append('items', JSON.stringify(cart));
    
    fetch('controller/pos.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        hideLoadingModal();
        
        if (result.success) {
            showReceiptModal(result, employeeName, siteAssigned, issuanceType);
            
            cart = [];
            updateCartDisplay();
            document.getElementById('employeeName').value = '';
            document.getElementById('siteAssigned').selectedIndex = 0;
            document.getElementById('issuanceType').selectedIndex = 0;
            
            loadProducts();
        } else {
            showErrorModal('Transaction Failed', result.message || 'Unable to complete transaction. Please try again.', 'danger');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Transaction error:', error);
        showErrorModal('Connection Error', 'Unable to complete transaction. Please check your connection and try again.', 'danger');
    });
}

// Show loading modal
function showLoadingModal() {
    const modalHtml = `
        <div class="modal fade" id="loadingModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <div class="modal-body text-center py-4">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mb-0">Processing transaction...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
    modal.show();
}

// Hide loading modal
function hideLoadingModal() {
    const modalEl = document.getElementById('loadingModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        setTimeout(() => modalEl.remove(), 300);
    }
}

// Show receipt modal
function showReceiptModal(result, employeeName, siteAssigned, issuanceType) {
    const transactionDate = new Date().toLocaleString();
    const itemsHtml = cart.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.item_name)}</td>
            <td class="text-center">${item.quantity}</td>
        </tr>
    `).join('');

    const modalHtml = `
        <div class="modal fade" id="receiptModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="width:8.3in; max-width:8.3in; height:5.85in; max-height:5.85in;">
                <div class="modal-content" style="height:100%;">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-file-alt me-2"></i>STRONGLINK SERVICES</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-2 d-flex justify-content-center align-items-center" style="height:100%; overflow:auto;">
                        <div id="receiptPrint" class="receipt-container" style="width:100%; height:100%; padding:0.2in; box-sizing:border-box;">
                            <div class="text-center mb-3">
                                <img src="assets/images/SSILOGO.png" alt="Logo" style="max-height:50px; object-fit:contain; display:block; margin:0 auto;">
                                <div style="margin-top:5px; font-weight:bold;">RL Bldg. Francisco Vilage, Brgy. Pulong Sta. Cruz, Sta. Rosa, Laguna</div>
                                <div>(049) 543-9544</div>
                            </div>
                            <table class="table table-borderless mb-3" style="width:100%;">
                                <tr>
                                    <td><strong>Transaction ID:</strong> ${result.transaction_id}</td>
                                    <td class="text-end"><strong>Date:</strong> ${transactionDate}</td>
                                </tr>
                                <tr>
                                    <td><strong>Name:</strong> ${escapeHtml(employeeName)}</td>
                                    <td class="text-end"><strong>Assigned at:</strong> ${escapeHtml(siteAssigned)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2"><strong>Status:</strong> ${escapeHtml(issuanceType)}</td>
                                </tr>
                            </table>
                            <table class="table table-bordered" style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr>
                                        <th width="50">NO.</th>
                                        <th>ITEM DESCRIPTION</th>
                                        <th width="100" class="text-center">QUANTITY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                    ${Array(10 - cart.length).fill('<tr><td>&nbsp;</td><td></td><td></td></tr>').join('')}
                                </tbody>
                            </table>
                            <div style="height:30px;"></div>
                            <table class="table table-borderless" style="width:100%; margin-top:10px;">
                                <tr>
                                    <td style="width:50%; vertical-align:bottom;">
                                        <div style="display:flex; flex-direction:column; align-items:center;">
                                            <div style="margin-bottom:4px; font-weight:bold;">${escapeHtml(employeeName)}</div>
                                            <div style="border-top:1px solid #000; width:80%;"></div>
                                            <div style="margin-top:2px; font-size:11px;">Signature over printed name</div>
                                        </div>
                                    </td>
                                    <td style="width:50%; vertical-align:bottom;">
                                        <div style="display:flex; flex-direction:column; align-items:center;">
                                            <div style="margin-bottom:24px;">&nbsp;</div>
                                            <div style="border-top:1px solid #000; width:80%;"></div>
                                            <div style="margin-top:2px; font-size:11px;">Date Received</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer no-print">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-info" onclick="previewReceipt()"><i class="fas fa-eye me-1"></i>Preview</button>
                        <button type="button" class="btn btn-primary" onclick="printReceipt()"><i class="fas fa-print me-1"></i>Print Receipt</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const existingModal = document.getElementById('receiptModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
    modal.show();

    document.getElementById('receiptModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        document.body.classList.remove('modal-open');
    });
}

// Preview receipt
function previewReceipt() {
    const receipt = document.getElementById('receiptPrint');
    if (!receipt) return;

    const previewWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes');
    previewWindow.document.write(`
        <html>
        <head>
            <title>Receipt Preview</title>
            <style>
                body {
                    width: 210mm;
                    min-height: 297mm;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    margin: 0;
                    padding: 10mm;
                    box-sizing: border-box;
                }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 4px; }
                .table-bordered th, .table-bordered td { border: 1px solid #000; }
                .table-borderless td, .table-borderless th { border: none; }
                .text-center { text-align: center; }
                .text-end { text-align: right; }
            </style>
        </head>
        <body>
            ${receipt.innerHTML}
        </body>
        </html>
    `);
    previewWindow.document.close();
    previewWindow.focus();
}

// Print receipt
function printReceipt() {
    const receipt = document.getElementById('receiptPrint');
    if (!receipt) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes');
    printWindow.document.write(`
        <html>
        <head>
            <title>Receipt</title>
            <style>
                @media print {
                    body { margin: 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 4px; font-size: 12px; }
                    .table-bordered th, .table-bordered td { border: 1px solid #000; }
                    .table-borderless td, .table-borderless th { border: none; }
                    .text-center { text-align: center; }
                    .text-end { text-align: right; }
                }
                @page { size: A4 portrait; margin: 15mm 10mm 10mm 10mm; }
                body {
                    width: 210mm;
                    min-height: 297mm;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    margin: 0;
                    padding: 10mm;
                    box-sizing: border-box;
                }
            </style>
        </head>
        <body>
            ${receipt.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Simple toast notification
function showToast(message, type='info') {
    const colors = {success:'#28a745', warning:'#ffc107', info:'#17a2b8', danger:'#dc3545'};
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;top:20px;right:20px;background:${colors[type]||colors.info};color:white;padding:15px 20px;border-radius:5px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:9999;animation:slideIn 0.3s ease;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { 
        toast.style.animation = 'slideOut 0.3s ease'; 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init_pos);
} else {
    init_pos();
}