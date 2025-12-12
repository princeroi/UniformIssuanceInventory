/**
 * Initialize the dashboard page
 */
window.init_dashboard = function() {
    loadDashboardStats();
    loadRecentIssuances();
    loadLowStockAlerts();
};

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        const response = await fetch('controller/dashboard.php?action=getStats');
        const result = await response.json();

        if (result.success) {
            const stats = result.data;
            const currentYear = new Date().getFullYear();
            
            // Update stat cards using more reliable selectors
            const statCards = document.querySelectorAll('.stats-card-value');
            const statLabels = document.querySelectorAll('.stats-card-label');
            
            if (statCards.length >= 4) {
                statCards[0].textContent = stats.total_items || 0;           // Total Items
                statCards[1].textContent = stats.total_issuances || 0;        // Total Issuances This Year
                statCards[2].textContent = stats.total_deliveries || 0;       // Total Deliveries
                statCards[3].textContent = stats.low_stock_items || 0;        // Low Stock Items
            }

            // Update the label to show current year
            if (statLabels.length >= 2) {
                statLabels[1].textContent = `Issuances (${currentYear})`;
            }

            // Add animation effect
            statCards.forEach((card, index) => {
                card.style.opacity = '0';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease-in';
                    card.style.opacity = '1';
                }, index * 100);
            });
        } else {
            console.error('Failed to load stats:', result.message);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Load recent issuances
 */
async function loadRecentIssuances() {
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="text-center">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div> Loading recent issuances...
    </td></tr>`;

    try {
        const response = await fetch('controller/dashboard.php?action=getRecentIssuances');
        const result = await response.json();

        if (result.success) {
            const issuances = result.data || [];

            if (issuances.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                    No recent issuances found.
                </td></tr>`;
                return;
            }

            tbody.innerHTML = issuances.map(item => {
                const statusBadge = getStatusBadge(item.status);
                const formattedDate = formatDate(item.issued_date);

                return `
                    <tr>
                        <td>#${escapeHtml(item.transaction_id)}</td>
                        <td>${escapeHtml(item.category)} - ${escapeHtml(item.size)}</td>
                        <td>${escapeHtml(item.item_name)}</td>
                        <td>${escapeHtml(item.quantity)}</td>
                        <td>${formattedDate}</td>
                        <td><span class="badge badge-${statusBadge.color}">${statusBadge.text}</span></td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
                ${result.message}
            </td></tr>`;
        }
    } catch (error) {
        console.error('Error loading recent issuances:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error loading recent issuances. Please try again.
        </td></tr>`;
    }
}

/**
 * Load low stock alerts
 */
async function loadLowStockAlerts() {
    const alertsContainer = document.querySelector('.card-body');
    if (!alertsContainer) return;

    // Find the alerts section (second card-body)
    const allCardBodies = document.querySelectorAll('.card-body');
    const alertsSection = allCardBodies[1];
    if (!alertsSection) return;

    const loadingHtml = `
        <div class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 mb-0">Loading alerts...</p>
        </div>
    `;
    alertsSection.innerHTML = loadingHtml;

    try {
        const response = await fetch('controller/dashboard.php?action=getLowStockAlerts');
        const result = await response.json();

        if (result.success) {
            const alerts = result.data || [];

            if (alerts.length === 0) {
                alertsSection.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-check-circle fa-2x mb-2 d-block"></i>
                        <p class="mb-0">All items are well stocked!</p>
                    </div>
                `;
                return;
            }

            const alertsHtml = alerts.map(item => {
                const alertClass = item.quantity === 0 ? 'danger' : 'warning';
                const icon = item.quantity === 0 ? 'times-circle' : 'exclamation-triangle';
                const message = item.quantity === 0 
                    ? 'Out of stock' 
                    : `Only ${item.quantity} units left`;

                return `
                    <div class="alert alert-${alertClass} d-flex align-items-center mb-3">
                        <i class="fas fa-${icon} me-2"></i>
                        <div>
                            <strong>${escapeHtml(item.item_name)}</strong><br>
                            <small>${message}</small>
                        </div>
                    </div>
                `;
            }).join('');

            alertsSection.innerHTML = alertsHtml + `
                <button class="btn btn-primary w-100" onclick="window.location.href='?page=inventory'">
                    View Inventory
                </button>
            `;
        } else {
            alertsSection.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${result.message}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading low stock alerts:', error);
        alertsSection.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error loading alerts. Please try again.
            </div>
        `;
    }
}

/**
 * Get status badge configuration
 */
function getStatusBadge(status) {
    const statusMap = {
        'completed': { text: 'Completed', color: 'success' },
        'pending': { text: 'Pending', color: 'warning' },
        'processing': { text: 'Processing', color: 'info' },
        'cancelled': { text: 'Cancelled', color: 'danger' }
    };

    return statusMap[status.toLowerCase()] || { text: status, color: 'secondary' };
}

/**
 * Format date to readable format
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
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