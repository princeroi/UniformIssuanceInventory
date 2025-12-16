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

window.init_deliveries = function() {
    loadDeliveries();
    loadItemsForDropdown();
    setDefaultOrderDate();
};

function setDefaultOrderDate() {
    const orderDateInput = document.getElementById('delivery_order_date');
    if (orderDateInput) {
        const today = new Date().toISOString().split('T')[0];
        orderDateInput.value = today;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const newDeliveryModal = document.getElementById('newDeliveryModal');
    if (newDeliveryModal) {
        newDeliveryModal.addEventListener('show.bs.modal', function() {
            setDefaultOrderDate();
        });
    }
});

async function loadDeliveries(status = 'all') {
    const tbody = document.querySelector('#deliveriesTableBody');
    if (!tbody) {
        console.error('Table body #deliveriesTableBody not found');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="12" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div> Loading deliveries...
    </td></tr>`;

    try {
        const response = await fetch(`controller/deliveries.php?action=getDeliveries&status=${status}`);
        const result = await response.json();

        if (result.success) {
            const deliveries = result.data || [];
            updateDeliveryStats(deliveries);

            if (deliveries.length === 0) {
                tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted">
                    <i class="fas fa-truck fa-2x mb-2 d-block"></i>
                    No deliveries found.
                </td></tr>`;
                return;
            }

            tbody.innerHTML = deliveries.map(delivery => {
                let statusClass, statusText;
                if (delivery.delivery_status === 'Delivered') {
                    statusClass = 'success';
                    statusText = 'Delivered';
                } else if (delivery.delivery_status === 'Partial') {
                    statusClass = 'info';
                    statusText = 'Partial';
                } else {
                    statusClass = 'warning';
                    statusText = 'Pending';
                }
                
                const hasPending = delivery.quantity_pending > 0;
                const hasDelivered = delivery.quantity_delivered > 0;
                
                return `
                    <tr>
                        <td>${escapeHtml(delivery.transaction_number)}</td>
                        <td>${escapeHtml(delivery.item_code)}</td>
                        <td>${escapeHtml(delivery.item_name)}</td>
                        <td>${escapeHtml(delivery.category)}</td>
                        <td>${escapeHtml(delivery.size)}</td>
                        <td>
                            <div class="d-flex flex-column">
                                <small class="text-muted">Ordered: <strong>${delivery.quantity_ordered}</strong></small>
                                ${hasDelivered ? `<small class="text-success">Delivered: <strong>${delivery.quantity_delivered}</strong></small>` : ''}
                                ${hasPending ? `<small class="text-warning">Pending: <strong>${delivery.quantity_pending}</strong></small>` : ''}
                            </div>
                        </td>
                        <td>${escapeHtml(delivery.supplier)}</td>
                        <td>${escapeHtml(delivery.received_by)}</td>
                        <td>${formatDate(delivery.order_date)}</td>
                        <td>${formatDate(delivery.expected_date)}</td>
                        <td>
                            <span class="badge bg-${statusClass}">
                                ${statusText}
                            </span>
                        </td>
                        <td>
                            <div class="d-flex gap-1">
                                ${hasPending ? `
                                    <button class="btn btn-sm btn-success" 
                                            onclick="showDeliveryModal(${delivery.id}, '${escapeHtml(delivery.transaction_number)}', ${delivery.quantity_pending})" 
                                            title="Mark as Delivered">
                                        <i class="fas fa-check"></i>
                                    </button>
                                ` : ''}
                                ${hasDelivered ? `
                                    <button class="btn btn-sm btn-info" 
                                            onclick="viewDeliveryHistory(${delivery.id})" 
                                            title="View History">
                                        <i class="fas fa-history"></i>
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-info" 
                                        onclick="printDelivery(${delivery.id})" 
                                        title="Print">
                                    <i class="fas fa-print"></i>
                                </button>
                                ${!hasDelivered ? `
                                    <button class="btn btn-sm btn-danger" 
                                            onclick="deleteDelivery(${delivery.id}, '${escapeHtml(delivery.transaction_number)}')" 
                                            title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">${result.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error loading deliveries. Please try again.
        </td></tr>`;
        NotificationUI.showError('Failed to load deliveries', error.message);
    }
}

function showDeliveryModal(id, transactionNumber, pendingQty) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'partialDeliveryModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-truck me-2"></i>
                        Process Delivery
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <strong>Transaction:</strong> ${escapeHtml(transactionNumber)}<br>
                        <strong>Pending Quantity:</strong> ${pendingQty} pcs
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Quantity to Deliver <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" id="quantity_to_deliver" 
                               min="1" max="${pendingQty}" value="${pendingQty}" required>
                        <small class="text-muted">Maximum: ${pendingQty} pcs</small>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Delivery Notes</label>
                        <textarea class="form-control" id="delivery_notes" rows="3" 
                                  placeholder="Optional notes about this delivery"></textarea>
                    </div>
                    
                    <div class="alert alert-warning">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Note:</strong> If quantity is less than pending, the remaining will stay as pending.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-success" onclick="processPartialDelivery(${id})">
                        <i class="fas fa-check me-1"></i> Process Delivery
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

async function processPartialDelivery(id) {
    const quantityInput = document.getElementById('quantity_to_deliver');
    const notesInput = document.getElementById('delivery_notes');
    
    const quantity = parseInt(quantityInput.value);
    const notes = notesInput.value.trim();
    
    if (!quantity || quantity <= 0) {
        NotificationUI.showError('Invalid quantity', 'Please enter a valid quantity to deliver.');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'markAsDelivered');
    formData.append('id', id);
    formData.append('quantity_to_deliver', quantity);
    formData.append('delivery_notes', notes);

    try {
        const response = await fetch('controller/deliveries.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            const statusText = result.data.status === 'Delivered' ? 'fully delivered' : 'partially delivered';
            NotificationUI.showToast(`Delivery ${statusText}! Inventory updated.`, 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('partialDeliveryModal'));
            modal.hide();
            
            loadDeliveries();
        } else {
            NotificationUI.showError('Failed to process delivery', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred', 'Please check your connection and try again.');
    }
}

async function viewDeliveryHistory(deliveryId) {
    try {
        const response = await fetch(`controller/deliveries.php?action=getDeliveryHistory&delivery_id=${deliveryId}`);
        const result = await response.json();
        
        if (result.success) {
            const history = result.data;
            
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-history me-2"></i>
                                Delivery History
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${history.length === 0 ? `
                                <p class="text-center text-muted">No delivery history found.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Date & Time</th>
                                                <th>Quantity Delivered</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${history.map(h => `
                                                <tr>
                                                    <td>${formatDateTime(h.delivered_date)}</td>
                                                    <td><strong>${h.quantity_delivered}</strong> pcs</td>
                                                    <td>${escapeHtml(h.notes) || '-'}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
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
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('Failed to load delivery history', err.message);
    }
}

async function loadItemsForDropdown() {
    try {
        const response = await fetch('controller/deliveries.php?action=getItems');
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('delivery_item_code');
            if (select) {
                select.innerHTML = '<option value="">Select Item</option>' +
                    result.data.map(item => 
                        `<option value="${item.item_code}">${item.item_name} (${item.category} - ${item.size})</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

function updateDeliveryStats(deliveries) {
    const totalDeliveries = deliveries.length;
    const pendingDeliveries = deliveries.filter(d => d.delivery_status === 'Pending' || d.delivery_status === 'Partial').length;
    const deliveredCount = deliveries.filter(d => d.delivery_status === 'Delivered').length;
    
    const totalEl = document.getElementById('totalDeliveries');
    const pendingEl = document.getElementById('pendingDeliveries');
    const deliveredEl = document.getElementById('deliveredDeliveries');
    
    if (totalEl) totalEl.textContent = totalDeliveries;
    if (pendingEl) pendingEl.textContent = pendingDeliveries;
    if (deliveredEl) deliveredEl.textContent = deliveredCount;
}

async function createDelivery() {
    const itemCode = document.getElementById('delivery_item_code').value;
    const quantity = document.getElementById('delivery_quantity').value;
    const orderDate = document.getElementById('delivery_order_date').value;
    const supplier = document.getElementById('delivery_supplier').value.trim();
    const receivedBy = document.getElementById('delivery_received_by').value.trim();
    const expectedDays = document.getElementById('expected_days').value;
    const notes = document.getElementById('delivery_notes').value.trim();

    if (!itemCode || !quantity || !orderDate || !supplier || !receivedBy) {
        NotificationUI.showError('Please fill in all required fields', 'Item, quantity, order date, supplier, and received by are required.');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'createDelivery');
    formData.append('item_code', itemCode);
    formData.append('quantity', quantity);
    formData.append('order_date', orderDate);
    formData.append('supplier', supplier);
    formData.append('received_by', receivedBy);
    formData.append('expected_days', expectedDays);
    formData.append('notes', notes);

    try {
        const response = await fetch('controller/deliveries.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            NotificationUI.showToast(`Delivery "${result.data.transaction_number}" created successfully!`, 'success');

            const modal = bootstrap.Modal.getInstance(document.getElementById('newDeliveryModal'));
            modal.hide();

            document.getElementById('newDeliveryForm').reset();
            setDefaultOrderDate();
            loadDeliveries();
        } else {
            NotificationUI.showError('Failed to create delivery', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred while creating the delivery', 'Please check your connection and try again.');
    }
}

async function printDelivery(id) {
    try {
        const response = await fetch(`controller/deliveries.php?action=getDeliveryById&id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const delivery = result.data;
            
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Delivery Receipt - ${delivery.transaction_number}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .header h1 { margin: 0; font-size: 28px; }
                        .header p { margin: 5px 0; color: #666; }
                        .info-section { margin: 20px 0; }
                        .info-row { display: flex; margin: 10px 0; }
                        .info-label { font-weight: bold; width: 180px; }
                        .info-value { flex: 1; }
                        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        .items-table th { background-color: #f5f5f5; font-weight: bold; }
                        .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
                        .signature-box { width: 45%; }
                        .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; text-align: center; }
                        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; 
                                      background-color: ${delivery.delivery_status === 'Delivered' ? '#28a745' : delivery.delivery_status === 'Partial' ? '#17a2b8' : '#ffc107'}; 
                                      color: white; }
                        @media print { body { padding: 20px; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>DELIVERY RECEIPT</h1>
                        <p>Transaction Number: <strong>${delivery.transaction_number}</strong></p>
                        <p><span class="status-badge">${delivery.delivery_status}</span></p>
                    </div>
                    
                    <div class="info-section">
                        <h3>Delivery Information</h3>
                        <div class="info-row">
                            <div class="info-label">Order Date:</div>
                            <div class="info-value">${formatDate(delivery.order_date)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Expected Date:</div>
                            <div class="info-value">${formatDate(delivery.expected_date)}</div>
                        </div>
                        ${delivery.delivered_date ? `
                        <div class="info-row">
                            <div class="info-label">Delivered Date:</div>
                            <div class="info-value">${formatDateTime(delivery.delivered_date)}</div>
                        </div>
                        ` : ''}
                        <div class="info-row">
                            <div class="info-label">Supplier:</div>
                            <div class="info-value">${escapeHtml(delivery.supplier)}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Received By:</div>
                            <div class="info-value">${escapeHtml(delivery.received_by)}</div>
                        </div>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Item Code</th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Size</th>
                                <th>Ordered</th>
                                <th>Delivered</th>
                                <th>Pending</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${escapeHtml(delivery.item_code)}</td>
                                <td>${escapeHtml(delivery.item_name)}</td>
                                <td>${escapeHtml(delivery.category)}</td>
                                <td>${escapeHtml(delivery.size)}</td>
                                <td><strong>${delivery.quantity_ordered}</strong></td>
                                <td><strong>${delivery.quantity_delivered}</strong></td>
                                <td><strong>${delivery.quantity_pending}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    ${delivery.notes ? `
                    <div class="info-section">
                        <h3>Notes</h3>
                        <p>${escapeHtml(delivery.notes)}</p>
                    </div>
                    ` : ''}
                    
                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line">
                                ${escapeHtml(delivery.received_by)}<br>
                                <small>Received By</small>
                            </div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line">
                                Delivered By
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.onload = function() {
                printWindow.print();
            };
        } else {
            NotificationUI.showError('Failed to load delivery details', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('Error loading delivery details', 'Please check your connection and try again.');
    }
}

async function deleteDelivery(id, transactionNumber) {
    const confirmed = await NotificationUI.showConfirm({
        title: 'Delete Delivery',
        message: `Are you sure you want to delete delivery "${transactionNumber}"?`,
        detail: 'This action cannot be undone. Only deliveries with no delivered items can be deleted.',
        type: 'danger',
        confirmText: 'Delete'
    });
    
    if (!confirmed) return;

    const formData = new FormData();
    formData.append('action', 'deleteDelivery');
    formData.append('id', id);

    try {
        const response = await fetch('controller/deliveries.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            NotificationUI.showToast('Delivery deleted successfully!', 'success');
            loadDeliveries();
        } else {
            NotificationUI.showError('Failed to delete delivery', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('An error occurred while deleting the delivery', 'Please check your connection and try again.');
    }
}

function filterDeliveries(status) {
    loadDeliveries(status);
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${status}"]`)?.classList.add('active');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}