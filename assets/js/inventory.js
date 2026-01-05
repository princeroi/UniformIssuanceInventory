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
 * Load all inventory items
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
        </div> Loading items...
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
                                <button class="btn btn-sm btn-primary" onclick="editItem('${escapeHtml(item.item_code)}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-success" onclick="adjustStock('${escapeHtml(item.item_code)}', 'add')" title="Add Stock">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="adjustStock('${escapeHtml(item.item_code)}', 'remove')" title="Remove Stock">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="showDeleteModal('${escapeHtml(item.item_code)}', '${escapeHtml(item.item_name)}')" title="Delete">
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
        showToast('Failed to load inventory items', 'danger');
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
 * Create new inventory item
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
        showToast('Please fill in all required fields', 'warning');
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
            showToast(`Item "${itemCode}" added successfully!`, 'success');

            const modal = bootstrap.Modal.getInstance(document.getElementById('newItemModal'));
            modal.hide();

            document.getElementById('newItemForm').reset();
            document.getElementById('imagePreview').classList.add('d-none');

            loadInventoryItems();
        } else {
            showToast('Failed to add item: ' + result.message, 'danger');
        }
    } catch (err) {
        console.error('Error details:', err);
        showToast('An error occurred while adding the item', 'danger');
    }
}

/**
 * Edit inventory item - directly show edit form
 */
async function editItem(itemCode) {
    try {
        const response = await fetch(`controller/inventory.php?action=getItemByCode&item_code=${encodeURIComponent(itemCode)}`);
        const result = await response.json();
        
        if (result.success) {
            const item = result.data;
            showEditModal(item);
        } else {
            showToast('Failed to load item data: ' + result.message, 'danger');
        }
    } catch (err) {
        console.error(err);
        showToast('Error loading item data', 'danger');
    }
}

/**
 * Show edit modal
 */
function showEditModal(item) {
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
                                    <option value="Longsleeve">Longsleeve</option>
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
                    <button type="button" class="btn btn-primary" onclick="showUpdateConfirmation()">
                        <i class="fas fa-save"></i> Update Item
                    </button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Show update confirmation modal
 */
function showUpdateConfirmation() {
    const itemCode = document.getElementById('edit_item_code').value.trim();
    const itemName = document.getElementById('edit_item_name').value.trim();
    const category = document.getElementById('edit_category').value;
    const size = document.getElementById('edit_size').value.trim();

    if (!itemCode || !itemName || !category || !size) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }

    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'updateConfirmModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-save me-2"></i> Confirm Update
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-3">
                        <i class="fas fa-save fa-3x text-primary"></i>
                    </div>
                    <h6 class="text-center mb-3">Are you sure you want to save these changes?</h6>
                    <div class="alert alert-info mb-0">
                        <strong>${escapeHtml(itemName)}</strong>
                        <p class="mb-0 mt-2 small">Code: ${escapeHtml(itemCode)}</p>
                        <p class="mb-0 small">Category: ${escapeHtml(category)} | Size: ${escapeHtml(size)}</p>
                        <p class="mb-0 mt-2 small text-muted">This will update the item information in the database.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-primary" id="confirmUpdateBtn">
                        <i class="fas fa-save me-1"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Handle confirmation
    modal.querySelector('#confirmUpdateBtn').addEventListener('click', () => {
        bsModal.hide();
        updateInventoryItem();
    });
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

/**
 * Update inventory item
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
        showToast('Please fill in all required fields', 'warning');
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
            showToast(result.message, 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
            modal.hide();

            document.getElementById('edit_item_image').value = "";
            document.getElementById('edit_item_image_preview').classList.add('d-none');

            loadInventoryItems();
        } else {
            showToast('Failed to update item: ' + result.message, 'danger');
        }
    } catch (err) {
        console.error(err);
        showToast('An error occurred while updating the item', 'danger');
    }
}

/**
 * Adjust stock (add or remove)
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
            showToast('Please enter a valid quantity', 'warning');
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
                showToast(result.message, 'success');
                bsModal.hide();
                loadInventoryItems();
            } else {
                showToast('Failed to adjust stock: ' + result.message, 'danger');
            }
        } catch (err) {
            console.error(err);
            showToast('An error occurred', 'danger');
        }
    });
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

/**
 * Show delete confirmation modal with issuance check
 */
async function showDeleteModal(itemCode, itemName) {
    // First, check if item has issuance history
    try {
        const response = await fetch(`controller/inventory.php?action=checkItemUsage&item_code=${encodeURIComponent(itemCode)}`);
        const result = await response.json();
        
        if (!result.success) {
            showToast('Error checking item usage', 'danger');
            return;
        }
        
        const hasIssuances = result.data.has_issuances;
        const issuanceCount = result.data.issuance_count;
        const totalIssued = result.data.total_items_issued;
        
        // Create appropriate delete modal
        createDeleteModal(itemCode, itemName, hasIssuances, issuanceCount, totalIssued);
        
    } catch (err) {
        console.error('Error checking item usage:', err);
        showToast('Error checking item usage', 'danger');
    }
}

/**
 * Create delete modal with appropriate warnings
 */
function createDeleteModal(itemCode, itemName, hasIssuances, issuanceCount, totalIssued) {
    // Remove any existing delete modal
    const existingModal = document.getElementById('deleteModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'deleteModal';
    
    let warningContent = '';
    let cascadeOption = '';
    
    if (hasIssuances) {
        warningContent = `
            <div class="alert alert-danger mb-3">
                <h6 class="alert-heading">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Cannot Delete - Item Has Issuance History
                </h6>
                <hr>
                <p class="mb-2"><strong>This item has been issued and is referenced in:</strong></p>
                <ul class="mb-2">
                    <li><strong>${issuanceCount}</strong> issuance transaction(s)</li>
                    <li><strong>${totalIssued}</strong> total units issued</li>
                </ul>
                <p class="mb-0 small">
                    <i class="fas fa-info-circle me-1"></i>
                    Deleting this item would break historical issuance records.
                </p>
            </div>
        `;
        
        cascadeOption = `
            <div class="alert alert-warning mb-0">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="cascadeDeleteCheck">
                    <label class="form-check-label" for="cascadeDeleteCheck">
                        <strong>Enable Cascade Delete</strong>
                        <br>
                        <small class="text-danger">
                            ⚠️ This will permanently delete the item AND all ${issuanceCount} related issuance record(s). 
                            This action cannot be undone and will affect your historical data.
                        </small>
                    </label>
                </div>
            </div>
        `;
    } else {
        warningContent = `
            <div class="alert alert-warning mb-0">
                <strong>${escapeHtml(itemName)}</strong>
                <p class="mb-0 mt-2 small">Code: ${escapeHtml(itemCode)}</p>
                <p class="mb-0 mt-2 small text-danger">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    This action cannot be undone. All item data and images will be permanently removed.
                </p>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-trash-alt me-2"></i> 
                        ${hasIssuances ? 'Delete Item with History' : 'Confirm Deletion'}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-3">
                        <i class="fas fa-trash-alt fa-3x text-danger"></i>
                    </div>
                    <h6 class="text-center mb-3">
                        ${hasIssuances ? 'This item cannot be deleted normally' : 'Are you sure you want to delete this item?'}
                    </h6>
                    ${warningContent}
                    ${cascadeOption}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn" ${hasIssuances ? 'disabled' : ''}>
                        <i class="fas fa-trash me-1"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Handle cascade checkbox
    if (hasIssuances) {
        const cascadeCheck = modal.querySelector('#cascadeDeleteCheck');
        const deleteBtn = modal.querySelector('#confirmDeleteBtn');
        
        cascadeCheck.addEventListener('change', () => {
            deleteBtn.disabled = !cascadeCheck.checked;
            if (cascadeCheck.checked) {
                deleteBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Delete with History';
            } else {
                deleteBtn.innerHTML = '<i class="fas fa-trash me-1"></i> Delete';
            }
        });
    }
    
    // Handle delete confirmation
    modal.querySelector('#confirmDeleteBtn').addEventListener('click', () => {
        const cascadeEnabled = hasIssuances && modal.querySelector('#cascadeDeleteCheck')?.checked;
        deleteItem(itemCode, itemName, cascadeEnabled, bsModal);
    });
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

/**
 * Delete inventory item with error handling
 */
async function deleteItem(itemCode, itemName, cascadeDelete = false, modalInstance) {
    const formData = new FormData();
    formData.append('action', 'deleteItem');
    formData.append('item_code', itemCode);
    formData.append('cascade_delete', cascadeDelete ? '1' : '0');

    try {
        const response = await fetch('controller/inventory.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            modalInstance.hide();
            loadInventoryItems();
        } else {
            // Handle specific error: item has issuances
            if (result.message === 'CANNOT_DELETE_HAS_ISSUANCES') {
                modalInstance.hide();
                showIssuanceErrorModal(
                    itemCode, 
                    itemName, 
                    result.data.issuance_count, 
                    result.data.total_issued
                );
            } else {
                showToast('Failed to delete: ' + result.message, 'danger');
            }
        }
    } catch (err) {
        console.error('Delete error:', err);
        showToast('An error occurred while deleting the item', 'danger');
    }
}

/**
 * Show error modal when item has issuances
 */
function showIssuanceErrorModal(itemCode, itemName, issuanceCount, totalIssued) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'issuanceErrorModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-danger">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-ban me-2"></i> Cannot Delete Item
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-3">
                        <i class="fas fa-ban fa-3x text-danger"></i>
                    </div>
                    <h6 class="text-center text-danger mb-3">This item cannot be deleted</h6>
                    
                    <div class="alert alert-danger">
                        <h6 class="mb-2"><strong>${escapeHtml(itemName)}</strong></h6>
                        <p class="mb-1 small">Code: ${escapeHtml(itemCode)}</p>
                        <hr class="my-2">
                        <p class="mb-1">
                            <i class="fas fa-history me-2"></i>
                            This item has been issued <strong>${issuanceCount}</strong> time(s)
                        </p>
                        <p class="mb-0">
                            <i class="fas fa-boxes me-2"></i>
                            Total units issued: <strong>${totalIssued}</strong>
                        </p>
                    </div>
                    
                    <div class="alert alert-info mb-0">
                        <h6><i class="fas fa-lightbulb me-2"></i> Options:</h6>
                        <ol class="mb-0 ps-3">
                            <li class="mb-2">
                                <strong>Set quantity to 0</strong> - Keep the item in the system but mark it as out of stock
                            </li>
                            <li class="mb-0">
                                <strong>Enable cascade delete</strong> - Delete the item AND all related issuance history (⚠️ This will permanently erase historical data)
                            </li>
                        </ol>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i> Close
                    </button>
                    <button type="button" class="btn btn-danger" onclick="showDeleteModal('${escapeHtml(itemCode)}', '${escapeHtml(itemName)}')">
                        <i class="fas fa-exclamation-triangle me-1"></i> Try Again with Cascade
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

/**
 * Simple toast notification function
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    const icons = {
        success: 'check-circle',
        danger: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${icons[type] || 'info-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    container.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
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