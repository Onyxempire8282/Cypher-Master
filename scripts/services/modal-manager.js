/**
 * Modal Manager
 * Ensures modals are properly isolated and don't appear everywhere
 */

class ModalManager {
    constructor() {
        this.activeModals = new Map();
        this.modalStack = [];
        this.init();
    }

    init() {
        // Listen for escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalStack.length > 0) {
                this.closeTopModal();
            }
        });

        // Prevent body scroll when modals are open
        this.setupBodyScrollLock();
    }

    setupBodyScrollLock() {
        const observer = new MutationObserver(() => {
            const hasVisibleModals = document.querySelector('.firm-setup-overlay.visible');
            
            if (hasVisibleModals) {
                document.body.style.overflow = 'hidden';
                document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
            } else {
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    getScrollbarWidth() {
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        outer.style.msOverflowStyle = 'scrollbar';
        document.body.appendChild(outer);

        const inner = document.createElement('div');
        outer.appendChild(inner);

        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
        outer.parentNode.removeChild(outer);

        return scrollbarWidth;
    }

    registerModal(modalId, modalInstance) {
        this.activeModals.set(modalId, modalInstance);
    }

    unregisterModal(modalId) {
        this.activeModals.delete(modalId);
        this.modalStack = this.modalStack.filter(id => id !== modalId);
    }

    showModal(modalId) {
        if (this.activeModals.has(modalId)) {
            const modal = this.activeModals.get(modalId);
            
            // Close any existing modals first
            this.closeAllModals();
            
            // Show the requested modal
            if (typeof modal.show === 'function') {
                modal.show();
            }
            
            // Add to stack
            this.modalStack.push(modalId);
            
            console.log(`📱 Modal opened: ${modalId}`);
        }
    }

    closeModal(modalId) {
        if (this.activeModals.has(modalId)) {
            const modal = this.activeModals.get(modalId);
            
            if (typeof modal.hide === 'function') {
                modal.hide();
            }
            
            // Remove from stack
            this.modalStack = this.modalStack.filter(id => id !== modalId);
            
            console.log(`📱 Modal closed: ${modalId}`);
        }
    }

    closeTopModal() {
        if (this.modalStack.length > 0) {
            const topModalId = this.modalStack[this.modalStack.length - 1];
            this.closeModal(topModalId);
        }
    }

    closeAllModals() {
        [...this.modalStack].forEach(modalId => {
            this.closeModal(modalId);
        });
    }

    isModalOpen(modalId = null) {
        if (modalId) {
            return this.modalStack.includes(modalId);
        }
        return this.modalStack.length > 0;
    }

    getCurrentModal() {
        return this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
    }

    // Static method to check if any modal overlay exists
    static hasActiveOverlay() {
        return document.querySelector('.firm-setup-overlay.visible') !== null;
    }

    // Static method to clean up any orphaned overlays
    static cleanupOrphanedOverlays() {
        const overlays = document.querySelectorAll('.firm-setup-overlay:not(.visible)');
        overlays.forEach(overlay => {
            // Remove overlays that have been hidden for more than 1 second
            setTimeout(() => {
                if (overlay.parentNode && !overlay.classList.contains('visible')) {
                    overlay.remove();
                }
            }, 1000);
        });
    }

    destroy() {
        this.closeAllModals();
        this.activeModals.clear();
        this.modalStack = [];
        
        // Restore body styles
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
}

// Create global instance
window.modalManager = new ModalManager();

// Clean up orphaned overlays periodically
setInterval(() => {
    ModalManager.cleanupOrphanedOverlays();
}, 5000);

// Export class
window.ModalManager = ModalManager;