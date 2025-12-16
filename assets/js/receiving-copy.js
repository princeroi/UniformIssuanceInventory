// receiving-copy.js - Receiving Copy Layout Designer
function init_receiving_copy() {
    console.log('Initializing Receiving Copy Designer...');
    
    initDesignTools();
    initLivePreview();
    initTemplates();
    initZoomControls();
    initSaveLoad();
    initPrintPreview();
}

/**
 * Initialize design tools controls
 */
function initDesignTools() {
    // Template selector
    document.getElementById('templateSelect').addEventListener('change', function() {
        applyTemplate(this.value);
    });
    
    // Paper size and orientation
    document.getElementById('paperSize').addEventListener('change', updatePageSize);
    document.getElementById('orientation').addEventListener('change', updatePageSize);
    
    // Header settings
    document.getElementById('headerText').addEventListener('input', function() {
        document.getElementById('previewHeader').textContent = this.value;
    });
    
    document.getElementById('headerSize').addEventListener('input', function() {
        document.getElementById('previewHeader').style.fontSize = this.value + 'px';
    });
    
    document.getElementById('headerAlign').addEventListener('change', function() {
        document.getElementById('headerSection').style.textAlign = this.value;
    });
    
    document.getElementById('showLogo').addEventListener('change', function() {
        const logo = document.getElementById('previewLogo');
        logo.style.display = this.checked ? 'block' : 'none';
    });
    
    // Company info
    document.getElementById('companyName').addEventListener('input', function() {
        document.getElementById('previewCompanyName').textContent = this.value;
    });
    
    document.getElementById('companyAddress').addEventListener('input', function() {
        document.getElementById('previewCompanyAddress').textContent = this.value;
    });
    
    // Logo upload
    document.getElementById('logoUpload').addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const logo = document.getElementById('previewLogo');
                logo.src = event.target.result;
                logo.style.display = 'block';
                document.getElementById('showLogo').checked = true;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Section toggles
    document.querySelectorAll('.section-toggle').forEach(toggle => {
        toggle.addEventListener('change', function() {
            toggleSection(this.id);
        });
    });
    
    // Table style
    document.getElementById('tableStyle').addEventListener('change', function() {
        applyTableStyle(this.value);
    });
    
    document.getElementById('showTableHeader').addEventListener('change', function() {
        const thead = document.querySelector('#itemsTable thead');
        thead.style.display = this.checked ? '' : 'none';
    });
    
    document.getElementById('alternateRows').addEventListener('change', function() {
        const tbody = document.querySelector('#itemsTable tbody');
        if (this.checked) {
            tbody.classList.add('table-striped');
        } else {
            tbody.classList.remove('table-striped');
        }
    });
    
    // Footer text
    document.getElementById('footerText').addEventListener('input', function() {
        document.getElementById('previewFooter').textContent = this.value;
    });
    
    // Action buttons
    document.getElementById('saveLayout').addEventListener('click', saveCurrentLayout);
    document.getElementById('previewBtn').addEventListener('click', openFullPreview);
    document.getElementById('printBtn').addEventListener('click', printReceivingCopy);
    document.getElementById('resetBtn').addEventListener('click', resetLayout);
}

/**
 * Toggle section visibility
 */
function toggleSection(toggleId) {
    const sectionMap = {
        'showReceivingNo': 'receivingNoSection',
        'showDate': 'dateSection',
        'showSupplier': 'supplierSection',
        'showDeliveryNo': 'deliveryNoSection',
        'showReceivedBy': 'receivedBySection',
        'showNotes': 'notesSection',
        'showSignatures': 'signaturesSection',
        'showQR': 'qrSection'
    };
    
    const sectionId = sectionMap[toggleId];
    const isChecked = document.getElementById(toggleId).checked;
    const section = document.getElementById(sectionId);
    
    if (section) {
        section.style.display = isChecked ? '' : 'none';
    }
}

/**
 * Apply template styles
 */
function applyTemplate(templateName) {
    const preview = document.getElementById('receivingPreview');
    const header = document.getElementById('headerSection');
    const table = document.getElementById('itemsTable');
    
    // Reset styles
    preview.style.padding = '30px';
    header.className = 'text-center mb-4 pb-3 border-bottom border-2';
    table.className = 'table';
    
    switch(templateName) {
        case 'modern':
            header.className = 'text-center mb-4 pb-3 border-bottom border-3 border-primary';
            header.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            header.style.color = 'white';
            header.style.marginLeft = '-30px';
            header.style.marginRight = '-30px';
            header.style.marginTop = '-30px';
            header.style.padding = '30px';
            table.className = 'table table-hover';
            document.getElementById('previewHeader').style.color = 'white';
            document.getElementById('previewCompanyName').style.color = 'white';
            document.getElementById('previewCompanyAddress').style.color = 'rgba(255,255,255,0.9)';
            break;
            
        case 'compact':
            preview.style.padding = '20px';
            header.className = 'mb-3 pb-2 border-bottom';
            document.getElementById('previewHeader').style.fontSize = '20px';
            table.className = 'table table-sm table-bordered';
            break;
            
        case 'detailed':
            header.className = 'text-center mb-4 pb-4 border-bottom border-2';
            header.style.background = '#f8f9fa';
            header.style.marginLeft = '-30px';
            header.style.marginRight = '-30px';
            header.style.marginTop = '-30px';
            header.style.padding = '30px';
            table.className = 'table table-bordered table-striped';
            break;
            
        default: // standard
            header.style.background = '';
            header.style.color = '';
            header.style.marginLeft = '';
            header.style.marginRight = '';
            header.style.marginTop = '';
            header.style.padding = '';
            document.getElementById('previewHeader').style.color = '';
            document.getElementById('previewCompanyName').style.color = '';
            document.getElementById('previewCompanyAddress').style.color = '';
            table.className = 'table table-bordered';
            break;
    }
}

/**
 * Apply table style
 */
function applyTableStyle(style) {
    const table = document.getElementById('itemsTable');
    
    switch(style) {
        case 'striped':
            table.className = 'table table-striped';
            break;
        case 'minimal':
            table.className = 'table table-borderless';
            break;
        default: // bordered
            table.className = 'table table-bordered';
            break;
    }
}

/**
 * Update page size
 */
function updatePageSize() {
    const paperSize = document.getElementById('paperSize').value;
    const orientation = document.getElementById('orientation').value;
    const preview = document.getElementById('receivingPreview');
    
    const sizes = {
        'A4': { width: 210, height: 297 }, // mm
        'Letter': { width: 216, height: 279 }, // mm (8.5 x 11 in)
        'Legal': { width: 216, height: 356 } // mm (8.5 x 14 in)
    };
    
    let width = sizes[paperSize].width;
    let height = sizes[paperSize].height;
    
    if (orientation === 'landscape') {
        [width, height] = [height, width];
    }
    
    // Convert mm to pixels (approximate)
    const pixelWidth = width * 3.78;
    preview.style.width = pixelWidth + 'px';
    preview.style.maxWidth = 'none';
}

/**
 * Initialize live preview features
 */
function initLivePreview() {
    // Make all contenteditable fields interactive
    document.querySelectorAll('[contenteditable="true"]').forEach(field => {
        field.addEventListener('focus', function() {
            this.style.backgroundColor = '#fff3cd';
        });
        
        field.addEventListener('blur', function() {
            this.style.backgroundColor = '';
        });
        
        // Save on blur
        field.addEventListener('blur', function() {
            saveToLocalStorage();
        });
    });
}

/**
 * Initialize template thumbnails
 */
function initTemplates() {
    document.querySelectorAll('.template-thumb').forEach(thumb => {
        thumb.addEventListener('click', function() {
            const template = this.getAttribute('data-template');
            document.getElementById('templateSelect').value = template;
            applyTemplate(template);
            
            // Visual feedback
            document.querySelectorAll('.template-thumb').forEach(t => {
                t.style.borderColor = '';
                t.style.borderWidth = '';
            });
            this.style.borderColor = '#007bff';
            this.style.borderWidth = '2px';
        });
    });
}

/**
 * Initialize zoom controls
 */
function initZoomControls() {
    let currentZoom = 1;
    const preview = document.getElementById('receivingPreview');
    const zoomDisplay = document.getElementById('zoomReset');
    
    document.getElementById('zoomIn').addEventListener('click', function() {
        currentZoom = Math.min(currentZoom + 0.1, 2);
        applyZoom(currentZoom);
    });
    
    document.getElementById('zoomOut').addEventListener('click', function() {
        currentZoom = Math.max(currentZoom - 0.1, 0.5);
        applyZoom(currentZoom);
    });
    
    document.getElementById('zoomReset').addEventListener('click', function() {
        currentZoom = 1;
        applyZoom(currentZoom);
    });
    
    function applyZoom(zoom) {
        preview.style.transform = `scale(${zoom})`;
        zoomDisplay.textContent = Math.round(zoom * 100) + '%';
    }
}

/**
 * Save current layout
 */
function saveCurrentLayout() {
    const layoutName = prompt('Enter a name for this layout:');
    if (!layoutName) return;
    
    const layout = {
        name: layoutName,
        template: document.getElementById('templateSelect').value,
        paperSize: document.getElementById('paperSize').value,
        orientation: document.getElementById('orientation').value,
        headerText: document.getElementById('headerText').value,
        headerSize: document.getElementById('headerSize').value,
        headerAlign: document.getElementById('headerAlign').value,
        companyName: document.getElementById('companyName').value,
        companyAddress: document.getElementById('companyAddress').value,
        footerText: document.getElementById('footerText').value,
        sections: {
            showReceivingNo: document.getElementById('showReceivingNo').checked,
            showDate: document.getElementById('showDate').checked,
            showSupplier: document.getElementById('showSupplier').checked,
            showDeliveryNo: document.getElementById('showDeliveryNo').checked,
            showReceivedBy: document.getElementById('showReceivedBy').checked,
            showNotes: document.getElementById('showNotes').checked,
            showSignatures: document.getElementById('showSignatures').checked,
            showQR: document.getElementById('showQR').checked,
            showLogo: document.getElementById('showLogo').checked
        },
        tableStyle: document.getElementById('tableStyle').value,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    let savedLayouts = JSON.parse(localStorage.getItem('receivingLayouts') || '[]');
    savedLayouts.push(layout);
    localStorage.setItem('receivingLayouts', JSON.stringify(savedLayouts));
    
    // Also save to server
    fetch('api/receiving-copy/save-layout.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(layout)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Layout saved successfully!');
            loadSavedLayouts();
        } else {
            alert('Error saving layout: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Layout saved locally only (server error)');
        loadSavedLayouts();
    });
}

/**
 * Load saved layouts
 */
function loadSavedLayouts() {
    const savedLayouts = JSON.parse(localStorage.getItem('receivingLayouts') || '[]');
    const container = document.getElementById('savedLayouts');
    
    if (savedLayouts.length === 0) {
        container.innerHTML = '<div class="text-muted text-center p-3">No saved layouts</div>';
        return;
    }
    
    container.innerHTML = '';
    savedLayouts.forEach((layout, index) => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <span><i class="fas fa-file-alt me-2"></i>${layout.name}</span>
            <div>
                <button class="btn btn-sm btn-outline-primary me-1 load-layout" data-index="${index}">
                    <i class="fas fa-upload"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-layout" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
    
    // Add event listeners
    document.querySelectorAll('.load-layout').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const index = this.getAttribute('data-index');
            loadLayout(savedLayouts[index]);
        });
    });
    
    document.querySelectorAll('.delete-layout').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const index = this.getAttribute('data-index');
            if (confirm('Delete this layout?')) {
                savedLayouts.splice(index, 1);
                localStorage.setItem('receivingLayouts', JSON.stringify(savedLayouts));
                loadSavedLayouts();
            }
        });
    });
}

/**
 * Load a layout
 */
function loadLayout(layout) {
    document.getElementById('templateSelect').value = layout.template;
    document.getElementById('paperSize').value = layout.paperSize;
    document.getElementById('orientation').value = layout.orientation;
    document.getElementById('headerText').value = layout.headerText;
    document.getElementById('headerSize').value = layout.headerSize;
    document.getElementById('headerAlign').value = layout.headerAlign;
    document.getElementById('companyName').value = layout.companyName;
    document.getElementById('companyAddress').value = layout.companyAddress;
    document.getElementById('footerText').value = layout.footerText;
    document.getElementById('tableStyle').value = layout.tableStyle;
    
    // Set sections
    Object.keys(layout.sections).forEach(key => {
        const checkbox = document.getElementById(key);
        if (checkbox) {
            checkbox.checked = layout.sections[key];
            if (key !== 'showLogo') {
                toggleSection(key);
            }
        }
    });
    
    // Apply template
    applyTemplate(layout.template);
    updatePageSize();
    applyTableStyle(layout.tableStyle);
    
    // Update preview text
    document.getElementById('previewHeader').textContent = layout.headerText;
    document.getElementById('previewCompanyName').textContent = layout.companyName;
    document.getElementById('previewCompanyAddress').textContent = layout.companyAddress;
    document.getElementById('previewFooter').textContent = layout.footerText;
    
    alert('Layout loaded successfully!');
}

/**
 * Initialize save/load functions
 */
function initSaveLoad() {
    loadSavedLayouts();
    
    // Auto-save to localStorage every 30 seconds
    setInterval(saveToLocalStorage, 30000);
}

/**
 * Save to localStorage
 */
function saveToLocalStorage() {
    const currentState = {
        headerText: document.getElementById('previewHeader').textContent,
        companyName: document.getElementById('previewCompanyName').textContent,
        companyAddress: document.getElementById('previewCompanyAddress').textContent,
        footerText: document.getElementById('previewFooter').textContent
    };
    localStorage.setItem('receivingCopyCurrentState', JSON.stringify(currentState));
}

/**
 * Open full preview
 */
function openFullPreview() {
    const previewContent = document.getElementById('receivingPreview').cloneNode(true);
    
    // Remove contenteditable
    previewContent.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable');
        el.style.cursor = 'default';
    });
    
    previewContent.style.transform = 'none';
    
    const previewWindow = window.open('', 'Preview', 'width=900,height=700');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receiving Copy Preview</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { padding: 20px; background: #f5f5f5; }
                @media print {
                    body { background: white; padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="text-end mb-3 no-print">
                <button onclick="window.print()" class="btn btn-primary">
                    <i class="fas fa-print"></i> Print
                </button>
                <button onclick="window.close()" class="btn btn-secondary">
                    Close
                </button>
            </div>
            ${previewContent.outerHTML}
        </body>
        </html>
    `);
    previewWindow.document.close();
}

/**
 * Print receiving copy
 */
function printReceivingCopy() {
    const previewContent = document.getElementById('receivingPreview').cloneNode(true);
    
    // Remove contenteditable
    previewContent.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable');
        el.style.cursor = 'default';
    });
    
    previewContent.style.transform = 'none';
    
    const printWindow = window.open('', 'Print', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receiving Copy</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                @page { margin: 15mm; }
                body { margin: 0; padding: 0; }
                @media print {
                    body { background: white; }
                }
            </style>
        </head>
        <body>
            ${previewContent.outerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

/**
 * Reset layout to default
 */
function resetLayout() {
    if (!confirm('Reset to default layout? This will clear all customizations.')) {
        return;
    }
    
    document.getElementById('templateSelect').value = 'standard';
    document.getElementById('paperSize').value = 'A4';
    document.getElementById('orientation').value = 'portrait';
    document.getElementById('headerText').value = 'RECEIVING REPORT';
    document.getElementById('headerSize').value = '24';
    document.getElementById('headerAlign').value = 'center';
    document.getElementById('companyName').value = 'ABC Corporation';
    document.getElementById('companyAddress').value = '123 Main Street, City, Country';
    document.getElementById('footerText').value = 'This is a computer-generated document.';
    document.getElementById('tableStyle').value = 'bordered';
    
    // Reset all checkboxes
    document.querySelectorAll('.section-toggle').forEach(cb => {
        cb.checked = true;
        toggleSection(cb.id);
    });
    document.getElementById('showLogo').checked = true;
    document.getElementById('showQR').checked = false;
    
    // Apply defaults
    applyTemplate('standard');
    updatePageSize();
    applyTableStyle('bordered');
    
    // Update preview
    document.getElementById('previewHeader').textContent = 'RECEIVING REPORT';
    document.getElementById('previewCompanyName').textContent = 'ABC Corporation';
    document.getElementById('previewCompanyAddress').textContent = '123 Main Street, City, Country';
    document.getElementById('previewFooter').textContent = 'This is a computer-generated document.';
    
    alert('Layout reset to default!');
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init_receiving_copy);
} else {
    init_receiving_copy();
}