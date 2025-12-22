/**
 * Initialize the reports page
 */
window.init_reports = function() {
    loadRecentReports();
    setupReportModals();
};

/**
 * Load recent reports history
 */
async function loadRecentReports() {
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div> Loading recent reports...
    </td></tr>`;

    try {
        const response = await fetch('controller/reports.php?action=getRecentReports');
        const result = await response.json();

        if (result.success) {
            const reports = result.data || [];

            if (reports.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">
                    <i class="fas fa-file-alt fa-2x mb-2 d-block"></i>
                    No recent reports found.
                </td></tr>`;
                return;
            }

            tbody.innerHTML = reports.map(report => {
                const badgeColor = getReportBadgeColor(report.report_type);
                return `
                    <tr>
                        <td><strong>${escapeHtml(report.report_name)}</strong></td>
                        <td><span class="badge ${badgeColor}">${escapeHtml(report.report_type)}</span></td>
                        <td>${formatDate(report.generated_date)}</td>
                        <td>${escapeHtml(report.generated_by)}</td>
                        <td>${escapeHtml(report.period)}</td>
                        <td>
                            <button class="btn btn-sm btn-info" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" title="Print">
                                <i class="fas fa-print"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${result.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading recent reports:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error loading recent reports. Please try again.
        </td></tr>`;
    }
}

/**
 * Setup report generation modals
 */
function setupReportModals() {
    // Inventory Report
    const inventoryBtn = document.querySelector('#inventoryReportModal .btn-primary');
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', generateInventoryReport);
    }

    // Issuance Report
    const issuanceBtn = document.querySelector('#issuanceReportModal .btn-primary');
    if (issuanceBtn) {
        issuanceBtn.addEventListener('click', generateIssuanceReport);
    }
    
    // Delivery Report
    const deliveryBtn = document.querySelector('#deliveryReportModal .btn-primary');
    if (deliveryBtn) {
        deliveryBtn.addEventListener('click', generateDeliveryReport);
    }
    
    // Employee Report
    const employeeBtn = document.querySelector('#employeeReportModal .btn-primary');
    if (employeeBtn) {
        employeeBtn.addEventListener('click', generateEmployeeReport);
    }
    
    // Financial Report
    const financialBtn = document.querySelector('#financialReportModal .btn-primary');
    if (financialBtn) {
        financialBtn.addEventListener('click', generateFinancialReport);
    }
}

/**
 * Generate Inventory Report
 */
async function generateInventoryReport() {
    const modal = document.getElementById('inventoryReportModal');
    const period = modal.querySelector('select[class*="form-select"]')?.value || 'current_month';
    const category = modal.querySelectorAll('select[class*="form-select"]')[1]?.value || 'all';
    const includeStockLevels = modal.querySelector('input[type="checkbox"]')?.checked || false;
    const includeLowStock = modal.querySelectorAll('input[type="checkbox"]')[1]?.checked || false;
    const includeOutOfStock = modal.querySelectorAll('input[type="checkbox"]')[2]?.checked || false;
    const format = modal.querySelectorAll('select[class*="form-select"]')[2]?.value || 'pdf';

    try {
        showLoadingToast('Generating inventory report...');

        const params = new URLSearchParams({
            action: 'getInventoryReport',
            period: period,
            category: category,
            include_low_stock: includeLowStock,
            include_out_of_stock: includeOutOfStock
        });

        const response = await fetch(`controller/reports.php?${params}`);
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            
            if (format === 'pdf') {
                printInventoryReport(data);
            } else {
                downloadInventoryReport(data, format);
            }

            bootstrap.Modal.getInstance(modal).hide();
            showSuccessToast('Inventory report generated successfully!');
        } else {
            showErrorToast('Failed to generate report: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating inventory report:', error);
        showErrorToast('Error generating report. Please try again.');
    }
}

/**
 * Generate Issuance Report
 */
async function generateIssuanceReport() {
    const dateFrom = prompt('Enter start date (YYYY-MM-DD):', formatDateForInput(new Date(new Date().setDate(1))));
    const dateTo = prompt('Enter end date (YYYY-MM-DD):', formatDateForInput(new Date()));

    if (!dateFrom || !dateTo) return;

    try {
        showLoadingToast('Generating issuance report...');

        const params = new URLSearchParams({
            action: 'getIssuanceReport',
            date_from: dateFrom,
            date_to: dateTo,
            issuance_type: 'all',
            site: 'all'
        });

        const response = await fetch(`controller/reports.php?${params}`);
        const result = await response.json();

        if (result.success) {
            printIssuanceReport(result.data);
            showSuccessToast('Issuance report generated successfully!');
        } else {
            showErrorToast('Failed to generate report: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating issuance report:', error);
        showErrorToast('Error generating report. Please try again.');
    }
}

/**
 * Print Inventory Report
 */
function printInventoryReport(data) {
    const { items, summary } = data;
    
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    
    const itemsHtml = items.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.item_code)}</td>
            <td>${escapeHtml(item.item_name)}</td>
            <td>${escapeHtml(item.category)}</td>
            <td>${escapeHtml(item.size)}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-center">${item.reorder_point}</td>
            <td class="text-center">
                <span class="status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
            </td>
        </tr>
    `).join('');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inventory Report</title>
            <style>
                @page { margin: 15mm; size: A4 landscape; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 11px; }
                
                .header { text-align: center; margin-bottom: 20px; }
                .header img { max-height: 50px; margin-bottom: 10px; }
                .header h1 { font-size: 18px; margin-bottom: 5px; }
                .header p { font-size: 12px; color: #666; }
                
                .report-info { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 20px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 5px;
                }
                
                .summary-boxes {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .summary-box {
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    text-align: center;
                }
                
                .summary-box .value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                }
                
                .summary-box .label {
                    font-size: 11px;
                    color: #666;
                    margin-top: 5px;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px;
                }
                
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left;
                }
                
                th { 
                    background: #f0f0f0; 
                    font-weight: bold;
                    font-size: 10px;
                }
                
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                
                .status-normal { color: green; font-weight: bold; }
                .status-low-stock { color: orange; font-weight: bold; }
                .status-out-of-stock { color: red; font-weight: bold; }
                
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                }
                
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="assets/images/SSILOGO.png" alt="Logo">
                <h1>STRONGLINK SERVICES</h1>
                <p>INVENTORY REPORT</p>
                <p>Generated on ${formatDate(summary.report_date)}</p>
            </div>
            
            <div class="report-info">
                <div>
                    <strong>Period:</strong> ${escapeHtml(summary.period)}<br>
                    <strong>Category:</strong> ${escapeHtml(summary.category)}
                </div>
                <div>
                    <strong>Report Date:</strong> ${formatDate(summary.report_date)}
                </div>
            </div>
            
            <div class="summary-boxes">
                <div class="summary-box">
                    <div class="value">${summary.total_items}</div>
                    <div class="label">Total Items</div>
                </div>
                <div class="summary-box">
                    <div class="value" style="color: green;">${summary.normal_stock_count}</div>
                    <div class="label">Normal Stock</div>
                </div>
                <div class="summary-box">
                    <div class="value" style="color: orange;">${summary.low_stock_count}</div>
                    <div class="label">Low Stock</div>
                </div>
                <div class="summary-box">
                    <div class="value" style="color: red;">${summary.out_of_stock_count}</div>
                    <div class="label">Out of Stock</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th width="30">#</th>
                        <th>Code</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th width="80" class="text-center">Current Qty</th>
                        <th width="80" class="text-center">Reorder Point</th>
                        <th width="100" class="text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="footer">
                <div>
                    <strong>Prepared by:</strong><br><br>
                    _________________________<br>
                    Signature over Printed Name
                </div>
                <div>
                    <strong>Approved by:</strong><br><br>
                    _________________________<br>
                    Signature over Printed Name
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

/**
 * Print Issuance Report
 */
function printIssuanceReport(data) {
    const { issuances, summary } = data;
    
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    
    const itemsHtml = issuances.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.transaction_id)}</td>
            <td>${formatDate(item.issuance_date)}</td>
            <td>${escapeHtml(item.employee_name)}</td>
            <td>${escapeHtml(item.site_assigned || 'N/A')}</td>
            <td>${escapeHtml(item.item_name)}</td>
            <td>${escapeHtml(item.category)}</td>
            <td class="text-center">${item.quantity}</td>
            <td>${escapeHtml(item.issuance_type)}</td>
        </tr>
    `).join('');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Issuance Report</title>
            <style>
                @page { margin: 15mm; size: A4 landscape; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 11px; }
                
                .header { text-align: center; margin-bottom: 20px; }
                .header img { max-height: 50px; margin-bottom: 10px; }
                .header h1 { font-size: 18px; margin-bottom: 5px; }
                .header p { font-size: 12px; color: #666; }
                
                .report-info { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 20px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 5px;
                }
                
                .summary-boxes {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .summary-box {
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    text-align: center;
                }
                
                .summary-box .value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                }
                
                .summary-box .label {
                    font-size: 11px;
                    color: #666;
                    margin-top: 5px;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px;
                }
                
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left;
                }
                
                th { 
                    background: #f0f0f0; 
                    font-weight: bold;
                    font-size: 10px;
                }
                
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                }
                
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="assets/images/SSILOGO.png" alt="Logo">
                <h1>STRONGLINK SERVICES</h1>
                <p>ISSUANCE REPORT</p>
                <p>Generated on ${formatDate(summary.report_date)}</p>
            </div>
            
            <div class="report-info">
                <div>
                    <strong>Period:</strong> ${formatDate(summary.date_from)} to ${formatDate(summary.date_to)}
                </div>
                <div>
                    <strong>Report Date:</strong> ${formatDate(summary.report_date)}
                </div>
            </div>
            
            <div class="summary-boxes">
                <div class="summary-box">
                    <div class="value">${summary.total_transactions}</div>
                    <div class="label">Total Transactions</div>
                </div>
                <div class="summary-box">
                    <div class="value">${summary.total_items_issued}</div>
                    <div class="label">Total Items Issued</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th width="30">#</th>
                        <th>Trans ID</th>
                        <th>Date</th>
                        <th>Employee</th>
                        <th>Site</th>
                        <th>Item</th>
                        <th>Category</th>
                        <th width="50" class="text-center">Qty</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="footer">
                <div>
                    <strong>Prepared by:</strong><br><br>
                    _________________________<br>
                    Signature over Printed Name
                </div>
                <div>
                    <strong>Approved by:</strong><br><br>
                    _________________________<br>
                    Signature over Printed Name
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

/**
 * Download report in different formats
 */
function downloadInventoryReport(data, format) {
    const { items, summary } = data;
    
    if (format === 'csv') {
        downloadCSV(items, 'inventory_report');
    } else if (format === 'excel') {
        showErrorToast('Excel export not yet implemented');
    }
}

/**
 * Download data as CSV
 */
function downloadCSV(data, filename) {
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Get badge color for report type
 */
function getReportBadgeColor(type) {
    const colors = {
        'Inventory': 'badge-primary',
        'Issuance': 'badge-warning',
        'Delivery': 'badge-info',
        'Employee': 'badge-success',
        'Financial': 'badge-danger'
    };
    return colors[type] || 'badge-secondary';
}

/**
 * Toast notifications
 */
function showLoadingToast(message) {
    showToast(message, 'info');
}

function showSuccessToast(message) {
    showToast(message, 'success');
}

function showErrorToast(message) {
    showToast(message, 'danger');
}

function showToast(message, type) {
    const toastContainer = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function getToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Utility functions
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate Delivery Report
 */
async function generateDeliveryReport() {
    const dateFrom = prompt('Enter start date (YYYY-MM-DD):', formatDateForInput(new Date(new Date().setDate(1))));
    const dateTo = prompt('Enter end date (YYYY-MM-DD):', formatDateForInput(new Date()));

    if (!dateFrom || !dateTo) return;

    try {
        showLoadingToast('Generating delivery report...');

        const params = new URLSearchParams({
            action: 'getDeliveryReport',
            date_from: dateFrom,
            date_to: dateTo,
            supplier: 'all',
            status: 'all'
        });

        const response = await fetch(`controller/reports.php?${params}`);
        const result = await response.json();

        if (result.success) {
            printDeliveryReport(result.data);
            showSuccessToast('Delivery report generated successfully!');
        } else {
            showErrorToast('Failed to generate report: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating delivery report:', error);
        showErrorToast('Error generating report. Please try again.');
    }
}

/**
 * Generate Employee Report
 */
async function generateEmployeeReport() {
    const dateFrom = prompt('Enter start date (YYYY-MM-DD):', formatDateForInput(new Date(new Date().setDate(1))));
    const dateTo = prompt('Enter end date (YYYY-MM-DD):', formatDateForInput(new Date()));

    if (!dateFrom || !dateTo) return;

    try {
        showLoadingToast('Generating employee report...');

        const params = new URLSearchParams({
            action: 'getEmployeeReport',
            date_from: dateFrom,
            date_to: dateTo
        });

        const response = await fetch(`controller/reports.php?${params}`);
        const result = await response.json();

        if (result.success) {
            printEmployeeReport(result.data);
            showSuccessToast('Employee report generated successfully!');
        } else {
            showErrorToast('Failed to generate report: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating employee report:', error);
        showErrorToast('Error generating report. Please try again.');
    }
}

/**
 * Generate Financial Report
 */
async function generateFinancialReport() {
    const dateFrom = prompt('Enter start date (YYYY-MM-DD):', formatDateForInput(new Date(new Date().setDate(1))));
    const dateTo = prompt('Enter end date (YYYY-MM-DD):', formatDateForInput(new Date()));

    if (!dateFrom || !dateTo) return;

    try {
        showLoadingToast('Generating financial report...');

        const params = new URLSearchParams({
            action: 'getFinancialReport',
            date_from: dateFrom,
            date_to: dateTo
        });

        const response = await fetch(`controller/reports.php?${params}`);
        const result = await response.json();

        if (result.success) {
            printFinancialReport(result.data);
            showSuccessToast('Financial report generated successfully!');
        } else {
            showErrorToast('Failed to generate report: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating financial report:', error);
        showErrorToast('Error generating report. Please try again.');
    }
}

/**
 * Print Delivery Report
 */
function printDeliveryReport(data) {
    const { deliveries, summary } = data;
    
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    
    const itemsHtml = deliveries.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.transaction_number)}</td>
            <td>${formatDate(item.order_date)}</td>
            <td>${escapeHtml(item.supplier)}</td>
            <td>${escapeHtml(item.item_name)}</td>
            <td class="text-center">${item.quantity_ordered}</td>
            <td class="text-center">${item.quantity_delivered}</td>
            <td class="text-center">${item.quantity_pending}</td>
            <td>${item.delivery_status}</td>
        </tr>
    `).join('');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Delivery Report</title>
            <style>
                @page { margin: 15mm; size: A4 landscape; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 11px; }
                
                .header { text-align: center; margin-bottom: 20px; }
                .header img { max-height: 50px; margin-bottom: 10px; }
                .header h1 { font-size: 18px; margin-bottom: 5px; }
                .header p { font-size: 12px; color: #666; }
                
                .report-info { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 20px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 5px;
                }
                
                .summary-boxes {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .summary-box {
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    text-align: center;
                }
                
                .summary-box .value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                }
                
                .summary-box .label {
                    font-size: 11px;
                    color: #666;
                    margin-top: 5px;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px;
                }
                
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left;
                }
                
                th { 
                    background: #f0f0f0; 
                    font-weight: bold;
                    font-size: 10px;
                }
                
                .text-center { text-align: center; }
                
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                }
                
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="assets/images/SSILOGO.png" alt="Logo">
                <h1>STRONGLINK SERVICES</h1>
                <p>DELIVERY REPORT</p>
                <p>Generated on ${formatDate(summary.report_date)}</p>
            </div>
            
            <div class="report-info">
                <div>
                    <strong>Period:</strong> ${formatDate(summary.date_from)} to ${formatDate(summary.date_to)}
                </div>
                <div>
                    <strong>Report Date:</strong> ${formatDate(summary.report_date)}
                </div>
            </div>
            
            <div class="summary-boxes">
                <div class="summary-box">
                    <div class="value">${summary.total_deliveries}</div>
                    <div class="label">Total Deliveries</div>
                </div>
                <div class="summary-box">
                    <div class="value">${summary.total_items_ordered}</div>
                    <div class="label">Items Ordered</div>
                </div>
                <div class="summary-box">
                    <div class="value">${summary.total_items_delivered}</div>
                    <div class="label">Items Delivered</div>
                </div>
                <div class="summary-box">
                    <div class="value">${summary.total_items_pending}</div>
                    <div class="label">Items Pending</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th width="30">#</th>
                        <th>Trans #</th>
                        <th>Date</th>
                        <th>Supplier</th>
                        <th>Item</th>
                        <th width="60" class="text-center">Ordered</th>
                        <th width="70" class="text-center">Delivered</th>
                        <th width="60" class="text-center">Pending</th>
                        <th width="80">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="footer">
                <div>
                    <strong>Prepared by:</strong><br><br>
                    _________________________<br>
                    Signature over Printed Name
                </div>
                <div>
                    <strong>Approved by:</strong><br><br>
                    _________________________<br>
                    Signature over Printed Name
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

/**
 * Print Employee Report
 */
function printEmployeeReport(data) {
    const { employees, summary } = data;
    
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    
    const itemsHtml = employees.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.employee_name)}</td>
            <td>${escapeHtml(item.site_assigned || 'N/A')}</td>
            <td class="text-center">${item.total_transactions}</td>
            <td class="text-center">${item.total_quantity}</td>
            <td>${formatDate(item.last_issuance_date)}</td>
        </tr>
    `).join('');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Employee Report</title>
            <style>
                @page { margin: 15mm; size: A4; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 11px; }
                
                .header { text-align: center; margin-bottom: 20px; }
                .header img { max-height: 50px; margin-bottom: 10px; }
                .header h1 { font-size: 18px; margin-bottom: 5px; }
                .header p { font-size: 12px; color: #666; }
                
                .summary-boxes {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .summary-box {
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    text-align: center;
                }
                
                .summary-box .value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                }
                
                .summary-box .label {
                    font-size: 11px;
                    color: #666;
                    margin-top: 5px;
                }
                
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px;
                }
                
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left;
                }
                
                th { 
                    background: #f0f0f0; 
                    font-weight: bold;
                }
                
                .text-center { text-align: center; }
                
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="assets/images/SSILOGO.png" alt="Logo">
                <h1>STRONGLINK SERVICES</h1>
                <p>EMPLOYEE DISTRIBUTION REPORT</p>
                <p>Generated on ${formatDate(summary.report_date)}</p>
            </div>
            
            <div class="summary-boxes">
                <div class="summary-box">
                    <div class="value">${summary.total_employees}</div>
                    <div class="label">Total Employees</div>
                </div>
                <div class="summary-box">
                    <div class="value">${summary.total_transactions}</div>
                    <div class="label">Total Transactions</div>
                </div>
                <div class="summary-box">
                    <div class="value">${summary.total_items_issued}</div>
                    <div class="label">Total Items Issued</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th width="30">#</th>
                        <th>Employee Name</th>
                        <th>Site</th>
                        <th width="100" class="text-center">Transactions</th>
                        <th width="100" class="text-center">Items Received</th>
                        <th width="120">Last Issuance</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

/**
 * Print Financial Report
 */
function printFinancialReport(data) {
    const { summary } = data;
    
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Financial Report</title>
            <style>
                @page { margin: 15mm; size: A4; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 12px; }
                
                .header { text-align: center; margin-bottom: 30px; }
                .header img { max-height: 50px; margin-bottom: 10px; }
                .header h1 { font-size: 20px; margin-bottom: 5px; }
                .header p { font-size: 14px; color: #666; }
                
                .summary-boxes {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin: 30px 0;
                }
                
                .summary-box {
                    padding: 20px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    text-align: center;
                }
                
                .summary-box .value {
                    font-size: 32px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 10px;
                }
                
                .summary-box .label {
                    font-size: 14px;
                    color: #666;
                }
                
                .summary-box.positive { border-color: #28a745; }
                .summary-box.positive .value { color: #28a745; }
                
                .summary-box.negative { border-color: #dc3545; }
                .summary-box.negative .value { color: #dc3545; }
                
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="assets/images/SSILOGO.png" alt="Logo">
                <h1>STRONGLINK SERVICES</h1>
                <p>INVENTORY MOVEMENT REPORT</p>
                <p>${formatDate(summary.date_from)} to ${formatDate(summary.date_to)}</p>
            </div>
            
            <div class="summary-boxes">
                <div class="summary-box">
                    <div class="value">${summary.total_items_issued}</div>
                    <div class="label">Total Items Issued</div>
                </div>
                <div class="summary-box">
                    <div class="value">${summary.total_items_delivered}</div>
                    <div class="label">Total Items Delivered</div>
                </div>
                <div class="summary-box">
                    <div class="value">${summary.current_inventory}</div>
                    <div class="label">Current Inventory Level</div>
                </div>
                <div class="summary-box ${summary.net_change >= 0 ? 'positive' : 'negative'}">
                    <div class="value">${summary.net_change >= 0 ? '+' : ''}${summary.net_change}</div>
                    <div class="label">Net Inventory Change</div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
}