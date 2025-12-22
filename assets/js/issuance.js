// Enhanced Notification System
// const NotificationUI = {
//     showToast(message, type = 'info') {
//         const toastContainer = this.getToastContainer();
//         const toast = document.createElement('div');
//         toast.className = `toast align-items-center text-white bg-${type} border-0`;
//         toast.setAttribute('role', 'alert');
//         toast.innerHTML = `
//             <div class="d-flex">
//                 <div class="toast-body">
//                     <i class="fas fa-${this.getIcon(type)} me-2"></i>
//                     ${message}
//                 </div>
//                 <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
//             </div>
//         `;
        
//         toastContainer.appendChild(toast);
//         const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
//         bsToast.show();
        
//         toast.addEventListener('hidden.bs.toast', () => toast.remove());
//     },
    
//     showError(message, details = null) {
//         const modal = document.createElement('div');
//         modal.className = 'modal fade';
//         modal.innerHTML = `
//             <div class="modal-dialog modal-dialog-centered">
//                 <div class="modal-content">
//                     <div class="modal-header bg-danger text-white">
//                         <h5 class="modal-title">
//                             <i class="fas fa-exclamation-circle me-2"></i>
//                             Error
//                         </h5>
//                         <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
//                     </div>
//                     <div class="modal-body">
//                         <p class="mb-0">${message}</p>
//                         ${details ? `<small class="text-muted d-block mt-2">${details}</small>` : ''}
//                     </div>
//                     <div class="modal-footer">
//                         <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
//                     </div>
//                 </div>
//             </div>
//         `;
        
//         document.body.appendChild(modal);
//         const bsModal = new bootstrap.Modal(modal);
//         bsModal.show();
        
//         modal.addEventListener('hidden.bs.modal', () => modal.remove());
//     },
    
//     getToastContainer() {
//         let container = document.getElementById('toastContainer');
//         if (!container) {
//             container = document.createElement('div');
//             container.id = 'toastContainer';
//             container.className = 'toast-container position-fixed top-0 end-0 p-3';
//             container.style.zIndex = '9999';
//             document.body.appendChild(container);
//         }
//         return container;
//     },
    
//     getIcon(type) {
//         const icons = {
//             success: 'check-circle',
//             danger: 'exclamation-circle',
//             warning: 'exclamation-triangle',
//             info: 'info-circle',
//             primary: 'info-circle'
//         };
//         return icons[type] || 'info-circle';
//     }
// };

window.init_issuance = function() {
    window.currentPage = 1;
    window.itemsPerPage = 10;
    window.totalPages = 1;
    window.selectedIssuances = new Set();
    loadIssuances();
    setupEventListeners();
};

function setupEventListeners() {
    // Search input - trigger on input (real-time search)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadIssuances(1);
            }, 500);
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

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.issuance-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const id = parseInt(checkbox.value);
        if (selectAllCheckbox.checked) {
            window.selectedIssuances.add(id);
        } else {
            window.selectedIssuances.delete(id);
        }
    });
    
    updateBulkPrintButton();
}

function toggleIssuanceSelection(id) {
    if (window.selectedIssuances.has(id)) {
        window.selectedIssuances.delete(id);
    } else {
        window.selectedIssuances.add(id);
    }
    
    // Update select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.issuance-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    selectAllCheckbox.checked = allChecked;
    
    updateBulkPrintButton();
}

function updateBulkPrintButton() {
    const bulkPrintBtn = document.getElementById('bulkPrintBtn');
    const count = window.selectedIssuances.size;
    
    if (bulkPrintBtn) {
        bulkPrintBtn.disabled = count === 0;
        bulkPrintBtn.innerHTML = `<i class="fas fa-print"></i> Print Selected${count > 0 ? ` (${count})` : ''}`;
    }
}

async function loadIssuances(page = 1) {
    window.currentPage = page;
    
    const tbody = document.querySelector('#issuancesTableBody');
    if (!tbody) {
        console.error('Table body #issuancesTableBody not found');
        return;
    }

    tbody.innerHTML = `<tr><td colspan="9" class="text-center">
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
                tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">
                    <i class="fas fa-clipboard-list fa-2x mb-2 d-block"></i>
                    No issuances found matching your filters.
                </td></tr>`;
                updatePagination();
                return;
            }

            tbody.innerHTML = issuances.map(issuance => {
                const isChecked = window.selectedIssuances.has(issuance.id);
                return `
                    <tr>
                        <td class="text-center">
                            <input type="checkbox" 
                                   class="form-check-input issuance-checkbox" 
                                   value="${issuance.id}"
                                   ${isChecked ? 'checked' : ''}
                                   onchange="toggleIssuanceSelection(${issuance.id})">
                        </td>
                        <td><strong>${escapeHtml(issuance.transaction_id)}</strong></td>
                        <td>${formatDate(issuance.issuance_date)}</td>
                        <td>${escapeHtml(issuance.employee_name)}</td>
                        <td>
                            <span class="badge bg-secondary">
                                ${escapeHtml(issuance.site_assigned || 'N/A')}
                            </span>
                        </td>
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

            showResultsCount(allIssuances.length, startIndex + 1, Math.min(endIndex, allIssuances.length));
            updatePagination();
            updateBulkPrintButton();
        } else {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">${result.message}</td></tr>`;
            updatePagination();
        }
    } catch (error) {
        console.error('Error fetching issuances:', error);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">
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
    
    paginationHTML += `
        <li class="page-item ${window.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${window.currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i> Previous
            </a>
        </li>
    `;
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, window.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(window.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
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
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === window.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
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
    
    const tableCard = document.querySelector('.card .card-body');
    if (tableCard) {
        tableCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function printBulkIssuances() {
    if (window.selectedIssuances.size === 0) {
        NotificationUI.showToast('Please select at least one issuance to print', 'warning');
        return;
    }

    try {
        NotificationUI.showToast('Loading issuances for printing...', 'info');
        
        const issuanceIds = Array.from(window.selectedIssuances);
        const issuancePromises = issuanceIds.map(id => 
            fetch(`controller/issuance.php?action=getIssuanceById&id=${id}`).then(r => r.json())
        );
        
        const results = await Promise.all(issuancePromises);
        const validIssuances = results
            .filter(r => r.success)
            .map(r => r.data);

        if (validIssuances.length === 0) {
            NotificationUI.showError('Failed to load any issuances');
            return;
        }

        printMultipleReceipts(validIssuances);
        
    } catch (err) {
        console.error(err);
        NotificationUI.showError('Error loading issuances', err.message);
    }
}

function printMultipleReceipts(issuances) {
    const printWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes');
    
    let receiptsHTML = '';
    
    // Process issuances in pairs (2 per page)
    for (let i = 0; i < issuances.length; i += 2) {
        const issuance1 = issuances[i];
        const issuance2 = issuances[i + 1];
        
        receiptsHTML += `
            <div class="print-page">
                ${buildSingleReceipt(issuance1)}
                ${issuance2 ? buildSingleReceipt(issuance2) : ''}
            </div>
        `;
    }
    
    printWindow.document.write(`
        <html>
        <head>
            <style>
                @page { margin: 0; size: A4 portrait; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; }
                
                .print-page {
                    width: 210mm;
                    height: 297mm;
                    page-break-after: always;
                    padding: 5mm;
                    display: flex;
                    flex-direction: column;
                    gap: 5mm;
                }
                
                .receipt {
                    width: 100%;
                    height: calc(50% - 2.5mm);
                    border: 1px solid #333;
                    padding: 5mm;
                    background: white;
                    display: flex;
                    flex-direction: column;
                }
                
                .header-section {
                    text-align: center;
                    margin-bottom: 4px;
                    border-bottom: 1px solid #000;
                    padding-bottom: 4px;
                }
                
                .header-section img {
                    max-height: 30px;
                    display: block;
                    margin: 0 auto 2px;
                }
                
                .company-name {
                    font-weight: bold;
                    font-size: 12px;
                    margin-bottom: 1px;
                }
                
                .company-address {
                    font-size: 10px;
                    color: #333;
                    line-height: 1.2;
                }
                
                .details-table {
                    width: 100%;
                    margin-bottom: 4px;
                    font-size: 14px;
                }
                
                .details-table td {
                    padding: 1px 0;
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 4px;
                    font-size: 12px;
                    flex-grow: 1;
                }
                
                .items-table th,
                .items-table td {
                    border: 1px solid #000;
                    padding: 2px;
                }
                
                .items-table th {
                    background: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                }
                
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                
                .signature-section {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 8px;
                }
                
                .signature-box {
                    width: 45%;
                    text-align: center;
                }
                
                .signature-line {
                    border-top: 1px solid #000;
                    margin-top: 0;
                    padding-top: 1px;   
                }
                
                @media print {
                    .print-page {
                        page-break-after: always;
                    }
                    body { margin: 0; }
                    @page { margin: 0; }
                }
            </style>
        </head>
        <body>
            ${receiptsHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

function buildSingleReceipt(issuance) {
    const items = issuance.items || [];
    
    const itemsHtml = items.map((item, index) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${escapeHtml(item.item_name)}</td>
            <td class="text-center">${item.quantity}</td>
        </tr>
    `).join('') + Array(Math.max(0, 6 - items.length))
        .fill('<tr><td>&nbsp;</td><td></td><td></td></tr>')
        .join('');
    
    return `
        <div class="receipt">
            <div class="header-section">
                <img src="assets/images/SSILOGO.png" alt="Logo">
                <div class="company-name">STRONGLINK SERVICES</div>
                <div class="company-address">
                    RL Bldg. Francisco Village, Brgy. Pulong Sta. Cruz, Sta. Rosa, Laguna | (049) 543-9544
                </div>
            </div>
            
            <table class="details-table">
                <tr>
                    <td width="50%"><strong>Trans ID:</strong> ${escapeHtml(issuance.transaction_id)}</td>
                    <td width="50%" class="text-right"><strong>Date:</strong> ${formatDate(issuance.transaction_date)}</td>
                </tr>
                <tr>
                    <td><strong>Name:</strong> ${escapeHtml(issuance.employee_name)}</td>
                    <td class="text-right"><strong>Site:</strong> ${escapeHtml(issuance.site_assigned || 'N/A')}</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Type:</strong> ${escapeHtml(issuance.issuance_type)}</td>
                </tr>
            </table>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th width="30">NO.</th>
                        <th>ITEM DESCRIPTION</th>
                        <th width="50">QTY</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div style="font-weight: bold; margin-bottom: 20px; font-size: 12px; min-height: 20px;">
                        ${escapeHtml(issuance.employee_name)}
                    </div>
                    <div class="signature-line"></div>
                    <div style="font-size: 10px; margin-top: 2px;">Signature over printed name</div>
                </div>
                <div class="signature-box">
                    <div style="font-weight: bold; margin-bottom: 20px; font-size: 12px; min-height: 20px;">
                        &nbsp;
                    </div>
                    <div class="signature-line"></div>
                    <div style="font-size: 10px; margin-top: 2px;">Date Received</div>
                </div>
            </div>
        </div>
    `;
}

async function viewIssuanceDetails(id) {
    try {
        const response = await fetch(`controller/issuance.php?action=getIssuanceById&id=${id}`);
        const result = await response.json();

        if (!result.success) {
            return NotificationUI.showError('Failed to load issuance details', result.message);
        }

        const issuance = result.data;
        const items = issuance.items || [];
        const transactionDate = formatDateTime(issuance.transaction_date);

        const itemsHtml = items.map((item, index) => `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${escapeHtml(item.item_name)}</td>
                <td class="text-center">${item.quantity}</td>
            </tr>
        `).join('') + Array(Math.max(0, 10 - items.length))
            .fill('<tr><td>&nbsp;</td><td></td><td></td></tr>')
            .join('');

        const modalHtml = `
            <div class="modal fade" id="receiptModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"
                     style="width:8.3in; max-width:8.3in; height:5.85in; max-height:5.85in;">
                    <div class="modal-content" style="height:100%;">
                        
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-file-invoice me-2"></i>STRONGLINK SERVICES
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>

                        <div class="modal-body p-2 d-flex justify-content-center align-items-center">
                            <div id="receiptPrint" style="width:100%; height:100%; padding:0.2in;">

                                <div class="text-center mb-3">
                                    <img src="assets/images/SSILOGO.png"
                                         style="max-height:50px; display:block; margin:0 auto;">
                                    <div style="font-weight:bold; margin-top:5px;">
                                        RL Bldg. Francisco Village, Brgy. Pulong Sta. Cruz, Sta. Rosa, Laguna
                                    </div>
                                    <div>(049) 543-9544</div>
                                </div>

                                <table class="table table-borderless mb-3">
                                    <tr>
                                        <td><strong>Transaction ID:</strong> ${escapeHtml(issuance.transaction_id)}</td>
                                        <td class="text-end"><strong>Date:</strong> ${transactionDate}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Name:</strong> ${escapeHtml(issuance.employee_name)}</td>
                                        <td class="text-end">
                                            <strong>Assigned at:</strong> ${escapeHtml(issuance.site_assigned || 'N/A')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2">
                                            <strong>Status:</strong> ${escapeHtml(issuance.issuance_type)}
                                        </td>
                                    </tr>
                                </table>

                                <table class="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th width="50">NO.</th>
                                            <th>ITEM DESCRIPTION</th>
                                            <th width="100" class="text-center">QTY</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>

                                <div style="height:30px;"></div>

                                <table class="table table-borderless">
                                    <tr>
                                        <td width="50%" class="text-center">
                                            <div style="font-weight:bold;">
                                                ${escapeHtml(issuance.employee_name)}
                                            </div>
                                            <div style="border-top:1px solid #000; width:80%; margin:0 auto;"></div>
                                            <small>Signature over printed name</small>
                                        </td>
                                        <td width="50%" class="text-center">
                                            <div style="height:24px;"></div>
                                            <div style="border-top:1px solid #000; width:80%; margin:0 auto;"></div>
                                            <small>Date Received</small>
                                        </td>
                                    </tr>
                                </table>

                            </div>
                        </div>

                        <div class="modal-footer no-print">
                            <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>

                    </div>
                </div>
            </div>
        `;

        document.getElementById('receiptModal')?.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
        modal.show();

        document.getElementById('receiptModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
            document.querySelector('.modal-backdrop')?.remove();
            document.body.classList.remove('modal-open');
        });

    } catch (err) {
        console.error(err);
        NotificationUI.showError('Failed to load issuance details', err.message);
    }
}

async function printIssuance(id) {
    try {
        const response = await fetch(`controller/issuance.php?action=getIssuanceById&id=${id}`);
        const result = await response.json();

        if (!result.success) {
            return NotificationUI.showError('Failed to load issuance details', result.message);
        }

        printMultipleReceipts([result.data]);

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
    
    loadIssuances(1);
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