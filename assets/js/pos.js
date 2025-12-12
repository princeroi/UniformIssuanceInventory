// pos.js - Updated with Confirmation and Receipt Modals

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
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 product-card border-0 shadow-sm">
                    <div class="position-relative">
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
                        <button class="btn btn-primary btn-sm w-100 mt-auto" onclick="showAddToCartModal('${product.item_code}', '${escapeHtml(product.item_name)}', ${product.quantity})">
                            <i class="fas fa-cart-plus me-1"></i> Add to Cart
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
                .catch(error => console.error('Search error:', error));
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
                .catch(error => console.error('Filter error:', error));
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

// Show add to cart modal
function showAddToCartModal(itemCode, itemName, maxQuantity) {
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
        alert(`Cannot add more than ${maxQuantity} items.`);
        return;
    }
    
    const existingIndex = cart.findIndex(item => item.item_code === itemCode);
    
    if (existingIndex !== -1) {
        const newQuantity = cart[existingIndex].quantity + quantity;
        if (newQuantity > maxQuantity) {
            alert(`Cannot add more items. Maximum available: ${maxQuantity}`);
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
        showToast('Cannot exceed available stock', 'warning');
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
        showToast('Cart is empty', 'warning');
        return;
    }
    
    const employeeName = document.getElementById('employeeName')?.value.trim();
    const issuanceType = document.getElementById('issuanceType')?.value;
    
    if (!employeeName) {
        showToast('Please enter employee name', 'warning');
        document.getElementById('employeeName')?.focus();
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
    const issuanceType = document.getElementById('issuanceType')?.value;
    
    // Close confirmation modal
    const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
    if (confirmModal) confirmModal.hide();
    
    // Show loading modal
    showLoadingModal();
    
    const formData = new FormData();
    formData.append('action', 'completeTransaction');
    formData.append('employee_name', employeeName);
    formData.append('issuance_type', issuanceType);
    formData.append('items', JSON.stringify(cart));
    
    fetch('controller/pos.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        // Hide loading modal
        hideLoadingModal();
        
        if (result.success) {
            // Show success receipt modal
            showReceiptModal(result, employeeName, issuanceType);
            
            // Clear cart and form
            cart = [];
            updateCartDisplay();
            document.getElementById('employeeName').value = '';
            document.getElementById('issuanceType').selectedIndex = 0;
            
            // Reload products
            loadProducts();
        } else {
            showToast(result.message || 'Transaction failed', 'danger');
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Transaction error:', error);
        showToast('Transaction failed. Please try again.', 'danger');
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
function showReceiptModal(result, employeeName, issuanceType) {
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
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle me-2"></i>Transaction Successful
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0">
                        <!-- Receipt Content -->
                        <div id="receiptPrint" class="receipt-container">
                            <div class="receipt-header">
                                <h3 class="mb-1">UNIFORM ISSUANCE RECEIPT</h3>
                                <p class="text-muted mb-0">Official Copy</p>
                            </div>
                            
                            <div class="receipt-details">
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <strong>Transaction ID:</strong><br>
                                        <span class="text-primary">${result.transaction_id}</span>
                                    </div>
                                    <div class="col-6 text-end">
                                        <strong>Date & Time:</strong><br>
                                        ${transactionDate}
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <strong>Employee Name:</strong><br>
                                        ${escapeHtml(employeeName)}
                                    </div>
                                    <div class="col-6">
                                        <strong>Issuance Type:</strong><br>
                                        ${escapeHtml(issuanceType)}
                                    </div>
                                </div>
                            </div>
                            
                            <h6 class="mb-2">Items Issued:</h6>
                            <table class="receipt-table">
                                <thead>
                                    <tr>
                                        <th width="50">#</th>
                                        <th>Item Description</th>
                                        <th width="100" class="text-center">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="2" class="text-end"><strong>Total Items:</strong></td>
                                        <td class="text-center"><strong>${result.data.total_items}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                            
                            <div class="receipt-footer">
                                <div class="row mb-4">
                                    <div class="col-6">
                                        <p class="mb-1"><strong>Issued By:</strong></p>
                                        <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 30px;">
                                            ${escapeHtml(result.data.issued_by)}
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <p class="mb-1"><strong>Received By:</strong></p>
                                        <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 30px;">
                                            ${escapeHtml(employeeName)}
                                        </div>
                                    </div>
                                </div>
                                
                                <p class="text-muted small mb-0">
                                    This is an official receipt. Please keep for your records.<br>
                                    For inquiries, please contact the HR Department.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer no-print">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Close
                        </button>
                        <button type="button" class="btn btn-primary" onclick="printReceipt()">
                            <i class="fas fa-print me-1"></i>Print Receipt
                        </button>
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
        // Remove modal HTML
        this.remove();

        // Remove any remaining backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();

        // Re-enable scrolling (Bootstrap sets body overflow to hidden)
        document.body.classList.remove('modal-open');
    });

}

// Print receipt
function printReceipt() {
    window.print();
}

// Simple toast notification
function showToast(message, type = 'info') {
    const colors = {
        success: '#28a745',
        warning: '#ffc107',
        info: '#17a2b8',
        danger: '#dc3545'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
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