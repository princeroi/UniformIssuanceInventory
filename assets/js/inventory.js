// Enhanced Notification System
const NotificationUI = {
    showToast(message, type = 'info') {
        const toastContainer = this.getToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${this.getIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    },
    
    showConfirm(options) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-${options.type || 'warning'} text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-${this.getIcon(options.type || 'warning')} me-2"></i>
                                ${options.title || 'Confirm Action'}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">${options.message}</p>
                            ${options.detail ? `<small class="text-muted">${options.detail}</small>` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i> Cancel
                            </button>
                            <button type="button" class="btn btn-${options.type || 'warning'}" id="confirmBtn">
                                <i class="fas fa-check me-1"></i> ${options.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            modal.querySelector('#confirmBtn').addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve(false);
            });
        });
    },
    
    showError(message, details = null) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Error
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-0">${message}</p>
                        ${details ? `<small class="text-muted d-block mt-2">${details}</small>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    },
    
    getToastContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    },
    
    getIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            primary: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
};

/**
 * Initialize the inventory page
 */
window.init_inventory = function() {
    loadInventoryItems();
    initializeFilters();
};

function initializeFilters() {
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    const categorySelect = document.querySelector('select');
    const statusSelect = document.querySelectorAll('select')[1];
    const sortSelect = document.querySelectorAll('select')[2];
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterTable, 300));
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', filterTable);
    }
    
    if (statusSelect) {
        statusSelect.addEventListener('change', filterTable);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', filterTable);
    }
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Filter and sort the table
 */
function filterTable() {
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    const categorySelect = document.querySelector('select');
    const statusSelect = document.querySelectorAll('select')[1];
    const sortSelect = document.querySelectorAll('select')[2];
    
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const categoryFilter = categorySelect?.value || '';
    const statusFilter = statusSelect?.value || '';
    const sortOption = sortSelect?.value || '';
    
    const tbody = document.querySelector('#inventoryTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Filter rows
    let visibleCount = 0;
    rows.forEach(row => {
        const itemCode = row.cells[1]?.textContent.toLowerCase() || '';
        const itemName = row.cells[2]?.textContent.toLowerCase() || '';
        const category = row.cells[3]?.textContent || '';
        const statusBadge = row.cells[6]?.textContent.trim() || '';
        
        let showRow = true;
        
        // Search filter
        if (searchTerm && !itemCode.includes(searchTerm) && !itemName.includes(searchTerm)) {
            showRow = false;
        }
        
        // Category filter
        if (categoryFilter && categoryFilter !== 'All Categories' && category !== categoryFilter) {
            showRow = false;
        }
        
        // Status filter
        if (statusFilter && statusFilter !== 'All Status') {
            if (statusFilter === 'In Stock' && statusBadge !== 'In Stock') showRow = false;
            if (statusFilter === 'Low Stock' && statusBadge !== 'Low Stock') showRow = false;
            if (statusFilter === 'Out of Stock' && statusBadge !== 'Out of Stock') showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });
    
    // Sort rows
    if (sortOption && visibleCount > 0) {
        const visibleRows = rows.filter(row => row.style.display !== 'none');
        
        visibleRows.sort((a, b) => {
            const aName = a.cells[2]?.textContent.trim() || '';
            const bName = b.cells[2]?.textContent.trim() || '';
            const aCode = a.cells[1]?.textContent.trim() || '';
            const bCode = b.cells[1]?.textContent.trim() || '';
            const aQty = parseInt(a.cells[4]?.textContent.trim()) || 0;
            const bQty = parseInt(b.cells[4]?.textContent.trim()) || 0;
            
            switch(sortOption) {
                case 'Sort: Name (A-Z)':
                    return aName.localeCompare(bName);
                case 'Sort: Name (Z-A)':
                    return bName.localeCompare(aName);
                case 'Sort: Code (A-Z)':
                    return aCode.localeCompare(bCode);
                case 'Sort: Code (Z-A)':
                    return bCode.localeCompare(aCode);
                case 'Sort: Stock (Low to High)':
                    return aQty - bQty;
                case 'Sort: Stock (High to Low)':
                    return bQty - aQty;
                default:
                    return 0;
            }
        });
        
        visibleRows.forEach(row => tbody.appendChild(row));
    }
    
    // Show "no results" message if needed
    if (visibleCount === 0 && rows.length > 0) {
        const noResultsRow = tbody.querySelector('.no-results-row');
        if (!noResultsRow) {
            const newRow = document.createElement('tr');
            newRow.className = 'no-results-row';
            newRow.innerHTML = `
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2 d-block"></i>
                    No items match your search criteria
                </td>
            `;
            tbody.appendChild(newRow);
        }
    } else {
        const noResultsRow = tbody.querySelector('.no-results-row');
        if (noResultsRow) {
            noResultsRow.remove();
        }
    }
}

/**
 * Load all inventory items (auto-updates min_stock)
 */
async function loadInventoryItems() {
    const tbody = document.querySelector('#inventoryTableBody');
    if (!tbody) {
        console.error('Table body #inventoryTableBody not found');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="8" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div> Loading items and calculating reorder points...
    </td></tr>`;

    try {
        const response = await fetch('controller/inventory.php?action=getItems');
        const result = await response.json();

        if (result.success) {
            const items = result.data || [];
            updateInventoryStats(items);

            if (items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">
                    <i class="fas fa-box-open fa-2x mb-2 d-block"></i>
                    No items found.
                </td></tr>`;
                return;
            }

            tbody.innerHTML = items.map(item => {
                const stockStatus = getStockStatus(item.quantity, item.min_stock);
                const imgSrc = item.image_url || "assets/no-image.png";

                return `
                    <tr>
                        <td class="text-center">
                            <img src="${imgSrc}"
                                class="img-thumbnail"
                                style="width:60px; height:60px; object-fit:cover; background:#ccc;"
                                onerror="
                                    this.onerror=null;
                                    this.removeAttribute('src');
                                    this.style.background='#ccc';
                                ">
                        </td>
                        <td>${escapeHtml(item.item_code)}</td>
                        <td>
                            ${escapeHtml(item.item_name)}
                            <br><small class="text-muted">
                                <i class="fas fa-chart-line"></i> ${item.yearly_usage || 0}/year
                            </small>
                        </td>
                        <td>${escapeHtml(item.category)}</td>
                        <td>
                            <span class="badge bg-${stockStatus.color}">
                                ${item.quantity}
                            </span>
                        </td>
                        <td>
                            <span class="badge bg-info" title="Auto-calculated reorder point">
                                ${item.min_stock}
                            </span>
                        </td>
                        <td>
                            <span class="badge bg-${stockStatus.color}">
                                ${stockStatus.status}
                            </span>
                        </td>
                        <td>
                            <div class="d-flex gap-1">
                                <button class="btn btn-sm btn-primary" onclick="editItem('${item.item_code}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-success" onclick="adjustStock('${item.item_code}', 'add')" title="Add Stock">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="adjustStock('${item.item_code}', 'remove')" title="Remove Stock">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.item_code}', '${escapeHtml(item.item_name)}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${result.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Error fetching items:', error);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error loading items. Please try again.
        </td></tr>`;
        NotificationUI.showError('Failed to load inventory items', error.message);
    }
}

/**
 * Preview image in create modal
 */
function previewImage(event) {
    const preview = document.getElementById('imagePreview');
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.add('d-none');
    }
}

/**
 * Preview image in edit modal
 */
function editPreviewImage(event) {
    const preview = document.getElementById('edit_item_image_preview');
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Get stock status based on quantity and minimum stock
 */
function getStockStatus(quantity, minStock) {
    if (quantity === 0) {
        return { status: 'Out of Stock', color: 'danger' };
    } else if (quantity <= minStock) {
        return { status: 'Low Stock', color: 'warning' };
    } else {
        return { status: 'In Stock', color: 'success' };
    }
}

/**
 * Update inventory statistics
 */
function updateInventoryStats(items) {
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.quantity > 0 && item.quantity <= item.min_stock).length;
    const outOfStockItems = items.filter(item => item.quantity === 0).length;
    const inStockItems = items.filter(item => item.quantity > item.min_stock).length;
    
    const totalItemsEl = document.getElementById('totalItems');
    const lowStockEl = document.getElementById('lowStock');
    const outOfStockEl = document.getElementById('outStock');
    const inStockEl = document.getElementById('inStock');
    
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (lowStockEl) lowStockEl.textContent = lowStockItems;
    if (outOfStockEl) outOfStockEl.textContent = outOfStockItems;
    if (inStockEl) inStockEl.textContent = inStockItems;
}

/**
 * Create new inventory item (min_stock auto-calculated)
 */
async function createInventoryItem() {
    const itemCode = document.getElementById('item_code').value.trim();
    const itemName = document.getElementById('item_name').value.trim();
    const category = document.getElementById('category').value;
    const size = document.getElementById('size').value.trim();
    const description = document.getElementById('description').value.trim();
    const quantity = 0;
    const itemImage = document.getElementById('item_image').files[0];

    if (!itemCode || !itemName || !category || !size) {
        NotificationUI.showError('Please fill in all required fields', 'Item code, name, category, and size are required.');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'createItems');
    formData.append('item_code', itemCode);
    formData.append('item_name', itemName);
    formData.append('category', category);
    formData.append('size', size);
    formData.append('description', description);
    formData.append('quantity', quantity);

    if (itemImage) {
        formData.append('image', itemImage);
    }

    try {
        const response = await fetch('controller/inventory.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            // FIXED: Remove the calculation reference
            NotificationUI.showToast(
                `Item "${itemCode}" added successfully!`, 
                'success'
            );

            const modal = bootstrap.Modal.getInstance(document.getElementById('newItemModal'));
            modal.hide();

            document.getElementById('newItemForm').reset();
            document.getElementById('imagePreview').classList.add('d-none');

            loadInventoryItems();
        } else {
            NotificationUI.showError('Failed to add item', result.message);
        }
    } catch (err) {
        console.error('Error details:', err);
        NotificationUI.showError('An error occurred while adding the item', 'Please check your connection and try again.');
    }
}

/**
 * Edit inventory item (shows auto-calculated min_stock)
 */
async function editItem(itemCode) {
    try {
        const response = await fetch(`controller/inventory.php?action=getItemByCode&item_code=${encodeURIComponent(itemCode)}`);
        const result = await response.json();
        
        if (result.success) {
            const item = result.data;
            
            let editModal = document.getElementById('editItemModal');
            if (!editModal) {
                editModal = createEditModal();
                document.body.appendChild(editModal);
            }
            
            document.getElementById('edit_item_code').value = item.item_code;
            document.getElementById('edit_item_name').value = item.item_name;
            document.getElementById('edit_category').value = item.category;
            document.getElementById('edit_size').value = item.size;
            document.getElementById('edit_description').value = item.description || '';
            document.getElementById('edit_quantity').value = item.quantity;
            
            // Display reorder point calculation details
            document.getElementById('edit_reorder_info').innerHTML = `
                <div class="alert alert-info mb-0">
                    <h6 class="mb-2"><i class="fas fa-calculator"></i> Reorder Point Calculation</h6>
                    <div class="row g-2 small">
                        <div class="col-6">
                            <strong>Yearly Usage:</strong> ${item.yearly_usage || 0} units
                        </div>
                        <div class="col-6">
                            <strong>Daily Usage:</strong> ${item.daily_usage || 0} units/day
                        </div>
                        <div class="col-6">
                            <strong>Lead Time:</strong> ${item.lead_time_days} days
                        </div>
                        <div class="col-6">
                            <strong>Safety Stock:</strong> ${item.safety_stock} units (${item.safety_stock_days} days)
                        </div>
                        <div class="col-12 mt-2">
                            <strong class="text-primary">
                                <i class="fas fa-bell"></i> Reorder Point (Min Stock): ${item.min_stock} units
                            </strong>
                            <br><small class="text-muted">
                                Formula: ((${item.yearly_usage}/365) × ${item.lead_time_days}) + ${item.safety_stock}
                            </small>
                        </div>
                    </div>
                </div>
            `;

            // Display existing image
            const preview = document.getElementById('edit_item_image_preview');
            if (item.image_url) {
                preview.src = item.image_url;
            } else {
                preview.src = 'assets/no-image.png';
            }
            preview.classList.remove('d-none');
            preview.onerror = function() {
                this.src = 'assets/no-image.png';
            };

            const modal = new bootstrap.Modal(editModal);
            modal.show();
        } else {
            NotificationUI.showError('Failed to load item data', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('Error loading item data', 'Please check your connection and try again.');
    }
}

/**
 * Create edit modal HTML
 */
function createEditModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'editItemModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-edit"></i> Edit Inventory Item</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="editItemForm">
                        <div class="row g-3">
                            
                            <div class="col-12">
                                <label class="form-label">Item Image</label>
                                <input type="file" class="form-control" id="edit_item_image" accept="image/*" onchange="editPreviewImage(event)">
                                <div class="mt-2">
                                    <img id="edit_item_image_preview" src="" class="img-thumbnail d-none" style="max-height:120px;">
                                </div>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Item Code</label>
                                <input type="text" class="form-control" id="edit_item_code" readonly>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Item Name</label>
                                <input type="text" class="form-control" id="edit_item_name" required>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Category</label>
                                <select class="form-select" id="edit_category" required>
                                    <option value="">Select Category</option>
                                    <option value="Polo">Polo</option>
                                    <option value="Polo Shirt">Polo Shirt</option>
                                    <option value="T-Shirt">T-Shirt</option>
                                    <option value="Long Sleeve">Long Sleeve</option>
                                    <option value="Pants">Pants</option>
                                    <option value="ID Lace">ID Lace</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">Size</label>
                                <input type="text" class="form-control" id="edit_size" required>
                            </div>

                            <div class="col-md-12">
                                <label class="form-label">Current Quantity</label>
                                <input type="number" class="form-control" id="edit_quantity" min="0" required>
                            </div>

                            <div class="col-12">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" rows="3" id="edit_description"></textarea>
                            </div>

                            <div class="col-12" id="edit_reorder_info">
                                <!-- Reorder calculation will be inserted here -->
                            </div>

                        </div>
                    </form>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="updateInventoryItem()">
                        <i class="fas fa-save"></i> Update Item
                    </button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Update inventory item (min_stock auto-recalculated)
 */
async function updateInventoryItem() {
    const itemCode = document.getElementById('edit_item_code').value.trim();
    const itemName = document.getElementById('edit_item_name').value.trim();
    const category = document.getElementById('edit_category').value;
    const size = document.getElementById('edit_size').value.trim();
    const description = document.getElementById('edit_description').value.trim();
    const quantity = parseInt(document.getElementById('edit_quantity').value);
    const newImage = document.getElementById('edit_item_image').files[0];

    if (!itemCode || !itemName || !category || !size) {
        NotificationUI.showError('Please fill in all required fields', 'Item code, name, category, and size are required.');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'updateItem');
    formData.append('item_code', itemCode);
    formData.append('item_name', itemName);
    formData.append('category', category);
    formData.append('size', size);
    formData.append('description', description);
    formData.append('quantity', quantity);

    if (newImage) {
        formData.append('image', newImage);
    }

    try {
        const response = await fetch('controller/inventory.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            NotificationUI.showToast(result.message, 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
            modal.hide();

            document.getElementById('edit_item_image').value = "";
            document.getElementById('edit_item_image_preview').classList.add('d-none');

            loadInventoryItems();
        } else {
            NotificationUI.showError('Failed to update item', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred while updating the item', 'Please check your connection and try again.');
    }
}

/**
 * Adjust stock (add or remove) - auto-updates min_stock
 */
async function adjustStock(itemCode, type) {
    const title = type === 'add' ? 'Add Stock' : 'Remove Stock';
    const actionText = type === 'add' ? 'add' : 'remove';
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-${type === 'add' ? 'success' : 'warning'} text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-${type === 'add' ? 'plus' : 'minus'}-circle me-2"></i>
                        ${title}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Item Code</label>
                        <input type="text" class="form-control" value="${itemCode}" readonly>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Quantity to ${actionText} *</label>
                        <input type="number" class="form-control" id="adjustQuantity" min="1" value="1" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Reason</label>
                        <textarea class="form-control" id="adjustReason" rows="2" placeholder="Optional reason for adjustment"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-${type === 'add' ? 'success' : 'warning'}" id="confirmAdjustBtn">
                        <i class="fas fa-check me-1"></i> Confirm
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.querySelector('#confirmAdjustBtn').addEventListener('click', async () => {
        const quantity = parseInt(modal.querySelector('#adjustQuantity').value);
        const reason = modal.querySelector('#adjustReason').value.trim();
        
        if (!quantity || quantity <= 0) {
            NotificationUI.showError('Invalid quantity', 'Please enter a valid quantity.');
            return;
        }
        
        const formData = new FormData();
        formData.append('action', 'adjustStock');
        formData.append('item_code', itemCode);
        formData.append('adjustment_type', type);
        formData.append('quantity', quantity);
        formData.append('reason', reason);
        
        try {
            const response = await fetch('controller/inventory.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                NotificationUI.showToast(result.message, 'success');
                bsModal.hide();
                loadInventoryItems();
            } else {
                NotificationUI.showError('Failed to adjust stock', result.message);
            }
        } catch (err) {
            console.error(err);
            NotificationUI.showError('An error occurred', 'Please check your connection and try again.');
        }
    });
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

/**
 * Delete inventory item
 */
async function deleteItem(itemCode, itemName) {
    const confirmed = await NotificationUI.showConfirm({
        title: 'Delete Item',
        message: `Are you sure you want to delete item "${itemName}"?`,
        detail: 'This action cannot be undone. All item data and images will be permanently removed.',
        type: 'danger',
        confirmText: 'Delete'
    });
    
    if (!confirmed) return;

    const formData = new FormData();
    formData.append('action', 'deleteItem');
    formData.append('item_code', itemCode);

    try {
        const response = await fetch('controller/inventory.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            NotificationUI.showToast(result.message, 'success');
            loadInventoryItems();
        } else {
            NotificationUI.showError('Failed to delete item', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred while deleting the item', 'Please check your connection and try again.');
    }
}

/**
 * Recalculate all min_stock values (batch update)
 */
async function recalculateAllMinStock() {
    const confirmed = await NotificationUI.showConfirm({
        title: 'Recalculate All Reorder Points',
        message: 'This will recalculate minimum stock for all items based on current usage data.',
        detail: 'This process may take a moment for large inventories.',
        type: 'info',
        confirmText: 'Recalculate'
    });
    
    if (!confirmed) return;

    try {
        const response = await fetch('controller/inventory.php?action=recalculateAllMinStock');
        const result = await response.json();
        
        if (result.success) {
            NotificationUI.showToast(result.message, 'success');
            loadInventoryItems();
        } else {
            NotificationUI.showError('Failed to recalculate', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred', 'Please check your connection and try again.');
    }
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}