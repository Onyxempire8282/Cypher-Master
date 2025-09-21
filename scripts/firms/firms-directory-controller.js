/**
 * Firms Directory Controller
 * Manages firms directory, billing firms, and client catalog
 */

class FirmsDirectoryController {
    constructor() {
        this.billingFirms = [];
        this.catalogFirms = [];
        this.hiringFirms = [];
        
        this.init();
    }

    init() {
        console.log('🏢 Initializing Firms Directory Controller...');
        
        // Load data
        this.loadBillingFirms();
        this.loadCatalogFirms();
        this.loadHiringFirms();
        
        // Bind events
        this.bindEvents();
        
        console.log('✅ Firms Directory Controller ready');
    }

    bindEvents() {
        // Add billing firm button
        const addBillingBtn = document.getElementById('addBillingFirmBtn');
        if (addBillingBtn) {
            addBillingBtn.addEventListener('click', () => this.showAddBillingFirmModal());
        }

        // Add directory firm button
        const addDirectoryBtn = document.getElementById('addDirectoryFirmBtn');
        if (addDirectoryBtn) {
            addDirectoryBtn.addEventListener('click', () => this.showAddDirectoryFirmModal());
        }

        // Add catalog firm button
        const addCatalogBtn = document.getElementById('addCatalogFirmBtn');
        if (addCatalogBtn) {
            addCatalogBtn.addEventListener('click', () => this.showAddCatalogFirmModal());
        }
    }

    loadBillingFirms() {
        const container = document.getElementById('billingFirmsContainer');
        if (!container) return;

        // Get billing firms from job billing service
        if (window.masterInterface?.jobBillingService) {
            const firms = window.masterInterface.jobBillingService.getAllFirmConfigs();
            this.billingFirms = firms;
            this.renderBillingFirms(container, firms);
        } else {
            // Show empty state
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏢</div>
                    <h4>No Billing Firms Configured</h4>
                    <p>Add your first billing firm to start tracking earnings</p>
                    <button class="action-btn primary" onclick="window.firmsDirectory.showAddBillingFirmModal()">
                        Add Billing Firm
                    </button>
                </div>
            `;
        }
    }

    renderBillingFirms(container, firms) {
        if (!firms || firms.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <h4>No Billing Firms Yet</h4>
                    <p>Configure billing firms to track your earnings</p>
                </div>
            `;
            return;
        }

        const firmsHTML = firms.map(firm => `
            <div class="billing-firm-card">
                <div class="firm-header">
                    <div class="firm-logo">💰</div>
                    <div class="firm-info">
                        <h4>${firm.name}</h4>
                        <p class="firm-type">Billing Firm</p>
                    </div>
                    <div class="firm-status established">Active</div>
                </div>
                <div class="firm-details">
                    <div class="detail-item">
                        <span class="detail-label">Daily Rate:</span>
                        <span class="detail-value">$${firm.dailyRate || 'Not set'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Mileage Rate:</span>
                        <span class="detail-value">$${firm.mileageRate || '0.67'}/mile</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Travel Rate:</span>
                        <span class="detail-value">${firm.travelTimeRate || 'Standard'}</span>
                    </div>
                </div>
                <div class="firm-actions">
                    <button class="action-btn primary" onclick="window.firmsDirectory.editBillingFirm('${firm.id}')">
                        Edit Rates
                    </button>
                    <button class="action-btn secondary" onclick="window.firmsDirectory.viewFirmHistory('${firm.id}')">
                        View History
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = firmsHTML;
    }

    loadCatalogFirms() {
        // Load from localStorage or database
        const savedFirms = localStorage.getItem('catalogFirms');
        this.catalogFirms = savedFirms ? JSON.parse(savedFirms) : [];
    }

    loadHiringFirms() {
        // This would typically come from an API
        // For now, using static data as shown in the HTML
        console.log('📊 Hiring firms loaded from static data');
    }

    showAddBillingFirmModal() {
        console.log('💰 Opening add billing firm modal...');
        
        // Trigger firm configuration modal
        if (window.firmConfiguration) {
            window.firmConfiguration.showIntro();
        } else if (window.modalManager) {
            window.modalManager.showModal('firmSetupOverlay');
        }
    }

    showAddDirectoryFirmModal() {
        console.log('🏢 Opening add directory firm modal...');
        
        // Could open a different modal for directory firms
        this.showAddCatalogFirmModal();
    }

    showAddCatalogFirmModal() {
        console.log('📂 Opening add catalog firm modal...');
        
        // Simple prompt for now - could be replaced with proper modal
        const firmName = prompt('Enter firm name:');
        if (firmName) {
            const newFirm = {
                id: Date.now().toString(),
                name: firmName,
                type: 'catalog',
                addedDate: new Date().toISOString()
            };
            
            this.catalogFirms.push(newFirm);
            this.saveCatalogFirms();
            this.loadCatalogFirms(); // Refresh display
        }
    }

    editBillingFirm(firmId) {
        console.log('✏️ Editing billing firm:', firmId);
        
        // Open billing firm configuration
        if (window.firmConfiguration) {
            window.firmConfiguration.editFirmConfiguration(firmId);
        }
    }

    viewFirmHistory(firmId) {
        console.log('📊 Viewing firm history:', firmId);
        
        // Could open analytics or history modal
        alert('Firm history feature coming soon!');
    }

    saveCatalogFirms() {
        localStorage.setItem('catalogFirms', JSON.stringify(this.catalogFirms));
    }

    // Public methods for integration
    refresh() {
        this.loadBillingFirms();
        this.loadCatalogFirms();
        this.loadHiringFirms();
    }

    addFirmToCatalog(firmData) {
        this.catalogFirms.push({
            id: Date.now().toString(),
            ...firmData,
            addedDate: new Date().toISOString()
        });
        this.saveCatalogFirms();
        this.refresh();
    }
}

// Make available globally
window.FirmsDirectoryController = FirmsDirectoryController;