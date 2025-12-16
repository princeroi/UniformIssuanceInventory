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

window.init_issuance = function() {
    window.currentPage = 1;
    window.itemsPerPage = 10;
    window.totalPages = 1;
    loadIssuances();
    setupEventListeners();
};

function setupEventListeners() {
    // Search input - trigger on input (real-time search)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            // Debounce search to avoid too many requests
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadIssuances(1); // Reset to page 1 when searching
            }, 500); // Wait 500ms after user stops typing
        });
    }

    // Filter dropdowns - trigger on change
    const issuanceTypeFilter = document.getElementById('issuanceTypeFilter');
    if (issuanceTypeFilter) {
        issuanceTypeFilter.addEventListener('change', () => loadIssuances(1));
    }

    const dateFromFilter = document.getElementById('dateFromFilter');
    if (dateFromFilter) {
        dateFromFilter.addEventListener('change', () => loadIssuances(1));
    }

    const dateToFilter = document.getElementById('dateToFilter');
    if (dateToFilter) {
        dateToFilter.addEventListener('change', () => loadIssuances(1));
    }
}

async function loadIssuances(page = 1) {
    window.currentPage = page;
    
    const tbody = document.querySelector('#issuancesTableBody');
    if (!tbody) {
        console.error('Table body #issuancesTableBody not found');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="7" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div> Loading issuances...
    </td></tr>`;

    try {
        const search = document.getElementById('searchInput')?.value || '';
        const issuanceType = document.getElementById('issuanceTypeFilter')?.value || 'all';
        const dateFrom = document.getElementById('dateFromFilter')?.value || '';
        const dateTo = document.getElementById('dateToFilter')?.value || '';
        
        const params = new URLSearchParams({
            action: 'getIssuances',
            search: search,
            issuance_type: issuanceType,
            date_from: dateFrom,
            date_to: dateTo
        });

        const response = await fetch(`controller/issuance.php?${params}`);
        const result = await response.json();

        if (result.success) {
            const allIssuances = result.data || [];
            
            // Calculate pagination
            window.totalPages = Math.ceil(allIssuances.length / window.itemsPerPage);
            const startIndex = (page - 1) * window.itemsPerPage;
            const endIndex = startIndex + window.itemsPerPage;
            const issuances = allIssuances.slice(startIndex, endIndex);

            if (allIssuances.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">
                    <i class="fas fa-clipboard-list fa-2x mb-2 d-block"></i>
                    No issuances found matching your filters.
                </td></tr>`;
                updatePagination();
                return;
            }

            tbody.innerHTML = issuances.map(issuance => {
                return `
                    <tr>
                        <td><strong>${escapeHtml(issuance.transaction_id)}</strong></td>
                        <td>${formatDate(issuance.issuance_date)}</td>
                        <td>${escapeHtml(issuance.employee_name)}</td>
                        <td>
                            <span class="badge bg-primary">
                                ${escapeHtml(issuance.issuance_type)}
                            </span>
                        </td>
                        <td><strong>${issuance.total_items}</strong></td>
                        <td>${escapeHtml(issuance.issued_by)}</td>
                        <td>
                            <button class="btn btn-sm btn-info" 
                                    onclick="viewIssuanceDetails(${issuance.id})" 
                                    title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" 
                                    onclick="printIssuance(${issuance.id})" 
                                    title="Print">
                                <i class="fas fa-print"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Show results count
            showResultsCount(allIssuances.length, startIndex + 1, Math.min(endIndex, allIssuances.length));
            
            // Update pagination controls
            updatePagination();
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${result.message}</td></tr>`;
            updatePagination();
        }
    } catch (error) {
        console.error('Error fetching issuances:', error);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error loading issuances. Please try again.
        </td></tr>`;
        NotificationUI.showError('Failed to load issuances', error.message);
        updatePagination();
    }
}

function showResultsCount(total, start, end) {
    const existingCount = document.getElementById('resultsCount');
    if (existingCount) {
        existingCount.remove();
    }
    
    const tableContainer = document.querySelector('.table-responsive');
    if (tableContainer && total > 0) {
        const countBadge = document.createElement('div');
        countBadge.id = 'resultsCount';
        countBadge.className = 'text-muted small mb-2';
        countBadge.innerHTML = `<i class="fas fa-list me-1"></i> Showing <strong>${start}-${end}</strong> of <strong>${total}</strong> result${total !== 1 ? 's' : ''}`;
        tableContainer.parentElement.insertBefore(countBadge, tableContainer);
    }
}

function updatePagination() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    
    if (window.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${window.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${window.currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i> Previous
            </a>
        </li>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, window.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(window.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === window.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Last page
    if (endPage < window.totalPages) {
        if (endPage < window.totalPages - 1) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${window.totalPages}); return false;">${window.totalPages}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${window.currentPage === window.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${window.currentPage + 1}); return false;">
                Next <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > window.totalPages) return;
    loadIssuances(page);
    
    // Scroll to top of table
    const tableCard = document.querySelector('.card .card-body');
    if (tableCard) {
        tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function viewIssuanceDetails(id) {
    try {
        const response = await fetch(`controller/issuance.php?action=getIssuanceById&id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const issuance = result.data;
            const items = issuance.items || [];
            
            // Build items table HTML
            const itemsTableHTML = items.length > 0 ? `
                <div class="col-12 mt-3">
                    <h6 class="border-bottom pb-2 mb-3">
                        <i class="fas fa-box me-2"></i>Issued Items
                    </h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Item Code</th>
                                    <th>Item Name</th>
                                    <th>Category</th>
                                    <th>Size</th>
                                    <th>Quantity</th>
                                    <th>Issued Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => `
                                    <tr>
                                        <td><code>${escapeHtml(item.item_code)}</code></td>
                                        <td>${escapeHtml(item.item_name)}</td>
                                        <td><span class="badge bg-secondary">${escapeHtml(item.category)}</span></td>
                                        <td><strong>${escapeHtml(item.size)}</strong></td>
                                        <td><strong>${item.quantity}</strong></td>
                                        <td>${formatDateTime(item.issued_date)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : '<div class="col-12 mt-3"><p class="text-muted">No items recorded for this issuance.</p></div>';
            
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-clipboard-list me-2"></i>
                                Issuance Details
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="text-muted small">Transaction ID</label>
                                    <p class="fw-bold">${escapeHtml(issuance.transaction_id)}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Employee Name</label>
                                    <p class="fw-bold">${escapeHtml(issuance.employee_name)}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Issuance Type</label>
                                    <p><span class="badge bg-primary">${escapeHtml(issuance.issuance_type)}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Total Items</label>
                                    <p class="fw-bold">${issuance.total_items} items</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Issued By</label>
                                    <p class="fw-bold">${escapeHtml(issuance.issued_by)}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Issuance Date</label>
                                    <p>${formatDateTime(issuance.issuance_date)}</p>
                                </div>
                                <div class="col-md-6">
                                    <label class="text-muted small">Transaction Date</label>
                                    <p>${formatDateTime(issuance.transaction_date)}</p>
                                </div>
                                ${itemsTableHTML}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="printIssuance(${issuance.id})">
                                <i class="fas fa-print me-1"></i> Print
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            modal.addEventListener('hidden.bs.modal', () => modal.remove());
        } else {
            NotificationUI.showError('Failed to load issuance details', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('Failed to load issuance details', err.message);
    }
}

async function printIssuance(id) {
    try {
        const response = await fetch(`controller/issuance.php?action=getIssuanceById&id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const issuance = result.data;
            const items = issuance.items || [];
            
            // Build items table for print
            const itemsTableHTML = items.length > 0 ? `
                <div class="items-section">
                    <h3 style="margin-top: 40px; margin-bottom: 20px; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                        <i class="fas fa-box"></i> Issued Items
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Item Code</th>
                                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Item Name</th>
                                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">Category</th>
                                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center;">Size</th>
                                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center;">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td style="border: 1px solid #dee2e6; padding: 10px;">
                                        <code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-family: monospace;">
                                            ${escapeHtml(item.item_code)}
                                        </code>
                                    </td>
                                    <td style="border: 1px solid #dee2e6; padding: 10px; font-weight: 500;">
                                        ${escapeHtml(item.item_name)}
                                    </td>
                                    <td style="border: 1px solid #dee2e6; padding: 10px;">
                                        ${escapeHtml(item.category)}
                                    </td>
                                    <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center; font-weight: bold;">
                                        ${escapeHtml(item.size)}
                                    </td>
                                    <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center; font-weight: bold; font-size: 18px;">
                                        ${item.quantity}
                                    </td>
                                </tr>
                            `).join('')}
                            <tr style="background-color: #f8f9fa; font-weight: bold;">
                                <td colspan="4" style="border: 1px solid #dee2e6; padding: 12px; text-align: right;">
                                    TOTAL ITEMS:
                                </td>
                                <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-size: 20px; color: #007bff;">
                                    ${items.reduce((sum, item) => sum + parseInt(item.quantity), 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ` : '';
            
            const printWindow = window.open('', '_blank', 'width=900,height=700');
            
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Issuance Receipt - ${issuance.transaction_id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
                        .header h1 { margin: 0; font-size: 32px; color: #333; }
                        .header p { margin: 5px 0; color: #666; }
                        .info-section { margin: 30px 0; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                        .info-item { padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; }
                        .info-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
                        .info-value { font-size: 16px; font-weight: bold; color: #333; }
                        .badge { display: inline-block; padding: 8px 16px; border-radius: 20px; 
                                background-color: #007bff; color: white; font-weight: bold; }
                        .signature-section { margin-top: 80px; display: flex; justify-content: space-between; }
                        .signature-box { width: 45%; text-align: center; }
                        .signature-line { border-top: 2px solid #333; margin-top: 60px; padding-top: 10px; }
                        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; 
                                 border-top: 1px solid #ddd; padding-top: 20px; }
                        @media print { body { padding: 20px; } .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>UNIFORM ISSUANCE RECEIPT</h1>
                        <p style="font-size: 18px; margin-top: 10px;">Transaction ID: <strong>${escapeHtml(issuance.transaction_id)}</strong></p>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Employee Name</div>
                                <div class="info-value">${escapeHtml(issuance.employee_name)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Issuance Type</div>
                                <div class="info-value">
                                    <span class="badge">${escapeHtml(issuance.issuance_type)}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Total Items Issued</div>
                                <div class="info-value">${issuance.total_items} items</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Issued By</div>
                                <div class="info-value">${escapeHtml(issuance.issued_by)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Issuance Date</div>
                                <div class="info-value">${formatDateTime(issuance.issuance_date)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Transaction Date</div>
                                <div class="info-value">${formatDateTime(issuance.transaction_date)}</div>
                            </div>
                        </div>
                    </div>
                    
                    ${itemsTableHTML}
                    
                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line">
                                ${escapeHtml(issuance.employee_name)}<br>
                                <small style="color: #666;">Employee Signature</small>
                            </div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line">
                                ${escapeHtml(issuance.issued_by)}<br>
                                <small style="color: #666;">Issued By</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is an official uniform issuance receipt.</p>
                        <p>Generated on ${formatDateTime(new Date().toISOString())}</p>
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
            NotificationUI.showError('Failed to load issuance details', result.message);
        }
    } catch (err) {
        console.error(err);
        NotificationUI.showError('Error loading issuance details', 'Please check your connection and try again.');
    }
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const issuanceTypeFilter = document.getElementById('issuanceTypeFilter');
    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');
    
    if (searchInput) searchInput.value = '';
    if (issuanceTypeFilter) issuanceTypeFilter.value = 'all';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';
    
    loadIssuances(1); // Reset to page 1
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
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}