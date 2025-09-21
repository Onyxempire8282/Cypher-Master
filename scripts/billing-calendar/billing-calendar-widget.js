/**
 * Billing Calendar Widget
 * Smart billing calendar display for independent adjusters
 */

class BillingCalendarWidget {
    constructor(containerId, jobBillingService = null) {
        this.container = document.getElementById(containerId);
        this.jobBillingService = jobBillingService;
        this.dataService = new BillingDataService(jobBillingService);
        this.currentView = 'upcoming'; // 'upcoming', 'month', 'week'
        this.selectedDate = new Date();
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Billing calendar container not found');
            return;
        }

        this.render();
        this.bindEvents();
        
        // Auto-refresh every hour to update payment status
        setInterval(() => this.refreshData(), 60 * 60 * 1000);
    }

    render() {
        this.container.innerHTML = this.generateHTML();
        this.updateData();
    }

    generateHTML() {
        return `
            <div class="billing-calendar">
                <!-- Calendar Header -->
                <div class="billing-calendar-header">
                    <div class="calendar-title">
                        <h3>💰 Billing Calendar</h3>
                        <p class="calendar-subtitle">Smart payment tracking</p>
                    </div>
                    
                    <!-- View Controls -->
                    <div class="calendar-controls">
                        <button class="view-btn ${this.currentView === 'upcoming' ? 'active' : ''}" 
                                data-view="upcoming">Upcoming</button>
                        <button class="view-btn ${this.currentView === 'week' ? 'active' : ''}" 
                                data-view="week">This Week</button>
                        <button class="view-btn ${this.currentView === 'month' ? 'active' : ''}" 
                                data-view="month">Month</button>
                    </div>
                </div>

                <!-- Calendar Summary -->
                <div class="billing-summary" id="billingSummary">
                    <!-- Summary stats populated dynamically -->
                </div>

                <!-- Calendar Content -->
                <div class="billing-content" id="billingContent">
                    <!-- View content populated dynamically -->
                </div>

                <!-- Quick Actions -->
                <div class="billing-actions">
                    <button class="action-btn" data-action="add-claim">
                        📋 Complete Claim
                    </button>
                    <button class="action-btn" data-action="mark-paid">
                        ✅ Mark Paid
                    </button>
                    <button class="action-btn" data-action="view-details">
                        📊 View Details
                    </button>
                </div>
                
                <!-- Payment Details Modal -->
                <div id="paymentModal" class="payment-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modalTitle">Payments for Date</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body" id="modalBody">
                            <!-- Payment details populated here -->
                        </div>
                        <div class="modal-footer">
                            <button class="action-btn modal-close-btn">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateData() {
        this.renderSummary();
        this.renderContent();
    }

    renderSummary() {
        const summary = this.dataService.getBillingSummary();
        const summaryContainer = document.getElementById('billingSummary');
        
        if (!summaryContainer) return;

        summaryContainer.innerHTML = `
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="card-value">${summary.upcomingPayments}</div>
                    <div class="card-label">Upcoming</div>
                </div>
                <div class="summary-card highlight">
                    <div class="card-value">${summary.totalUpcoming}</div>
                    <div class="card-label">Expected</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${summary.activeFirms}</div>
                    <div class="card-label">Active Firms</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${this.formatNextPaymentDate(summary.nextPaymentDate)}</div>
                    <div class="card-label">Next Payment</div>
                </div>
            </div>
        `;
    }

    renderContent() {
        const contentContainer = document.getElementById('billingContent');
        if (!contentContainer) return;

        switch (this.currentView) {
            case 'upcoming':
                this.renderUpcomingView(contentContainer);
                break;
            case 'week':
                this.renderWeekView(contentContainer);
                break;
            case 'month':
                this.renderMonthView(contentContainer);
                break;
        }
    }

    renderUpcomingView(container) {
        const upcomingPayments = this.dataService.getUpcomingPayments();
        
        if (upcomingPayments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h4>No upcoming payments</h4>
                    <p>Complete claims to see payment schedule</p>
                </div>
            `;
            return;
        }

        const paymentsHTML = upcomingPayments.map(payment => `
            <div class="payment-card ${this.getPaymentPriority(payment.date)}" data-event-id="${payment.id}">
                <div class="payment-header">
                    <div class="firm-info">
                        <h4 class="firm-name">${payment.firmName}</h4>
                        <span class="payment-type">${this.formatPaymentType(payment.type)}</span>
                    </div>
                    <div class="payment-amount">${payment.amount}</div>
                </div>
                
                <div class="payment-details">
                    <div class="payment-date">
                        <span class="date-label">${this.formatPaymentDate(payment.date)}</span>
                    </div>
                    <div class="payment-claims">
                        <span class="claims-completed">${payment.claimsCompleted} claims completed</span>
                        ${payment.claims.length > 0 ? `<span class="claims-count">${payment.claims.length} claims</span>` : ''}
                    </div>
                </div>

                <div class="payment-actions">
                    <button class="action-link" data-action="view-claims" data-event-id="${payment.id}">
                        View Claims
                    </button>
                    <button class="action-link" data-action="mark-paid" data-event-id="${payment.id}">
                        Mark Paid
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="upcoming-payments">
                <h4>Next 7 Days</h4>
                <div class="payments-list">
                    ${paymentsHTML}
                </div>
            </div>
        `;
    }

    renderWeekView(container) {
        // Week calendar view implementation
        const weekStart = this.getWeekStart(this.selectedDate);
        const weekDays = this.generateWeekDays(weekStart);
        const weekPayments = this.dataService.getBillingEvents(weekStart, this.getWeekEnd(weekStart));

        container.innerHTML = `
            <div class="week-view">
                <div class="week-header">
                    <button class="nav-btn" data-action="prev-week">‹</button>
                    <h4>${this.formatWeekRange(weekStart)}</h4>
                    <button class="nav-btn" data-action="next-week">›</button>
                </div>
                <div class="week-grid">
                    ${weekDays.map(day => this.renderDayColumn(day, weekPayments)).join('')}
                </div>
            </div>
        `;
    }

    renderMonthView(container) {
        // Month calendar view implementation
        const monthStart = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
        const monthEnd = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0);
        const monthPayments = this.dataService.getBillingEvents(monthStart, monthEnd);

        container.innerHTML = `
            <div class="month-view">
                <div class="month-header">
                    <button class="nav-btn" data-action="prev-month">‹</button>
                    <h4>${this.formatMonth(this.selectedDate)}</h4>
                    <button class="nav-btn" data-action="next-month">›</button>
                </div>
                <div class="month-grid">
                    <!-- Month calendar grid implementation -->
                    ${this.renderMonthGrid(monthPayments)}
                </div>
            </div>
        `;
    }

    /**
     * Event Handling
     */
    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const eventId = e.target.dataset.eventId;
            
            switch (action) {
                case 'upcoming':
                case 'week':
                case 'month':
                    this.switchView(action);
                    break;
                case 'mark-paid':
                    this.handleMarkPaid(eventId);
                    break;
                case 'view-claims':
                    this.handleViewClaims(eventId);
                    break;
                case 'add-claim':
                    this.handleAddClaim();
                    break;
                case 'prev-week':
                    this.navigateWeek(-1);
                    break;
                case 'next-week':
                    this.navigateWeek(1);
                    break;
                case 'prev-month':
                    this.navigateMonth(-1);
                    break;
                case 'next-month':
                    this.navigateMonth(1);
                    break;
            }
        });

        // Handle calendar day clicks for modal
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.calendar-day.has-payments')) {
                const dayElement = e.target.closest('.calendar-day');
                const date = dayElement.dataset.date;
                const payments = JSON.parse(dayElement.dataset.payments || '[]');
                this.showPaymentModal(date, payments);
            }
        });

        // View button handling
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-btn')) {
                const view = e.target.dataset.view;
                this.switchView(view);
            }
        });

        // Modal close handling
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-close-btn')) {
                document.getElementById('paymentModal').style.display = 'none';
            }
            
            // Close modal when clicking outside
            const modal = document.getElementById('paymentModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Update active button
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this.renderContent();
    }

    handleMarkPaid(eventId) {
        if (!eventId) return;
        
        this.dataService.markEventPaid(eventId);
        this.updateData();
        
        // Show success feedback
        this.showNotification('Payment marked as paid! 💰', 'success');
    }

    handleViewClaims(eventId) {
        // Integration with claims management system
        console.log('View claims for event:', eventId);
        // This would open a modal or navigate to claims detail
    }

    handleAddClaim() {
        // Open complete claim modal/form
        console.log('Complete claim workflow');
        // This would open a form to mark claims as completed for specific firms
    }

    showPaymentModal(date, payments) {
        const modal = document.getElementById('paymentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalTitle || !modalBody) {
            console.error('Modal elements not found');
            return;
        }
        
        // Format the date
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        modalTitle.textContent = `Payments for ${formattedDate}`;
        
        // Calculate total
        const total = payments.reduce((sum, payment) => {
            return sum + parseFloat(payment.amount.replace(/[$,]/g, ''));
        }, 0);
        
        // Generate payment details HTML
        const paymentsHTML = payments.map(payment => `
            <div class="modal-payment-card ${this.getPaymentPriority(payment.date)}">
                <div class="payment-header">
                    <div class="firm-info">
                        <h4>${payment.firmName}</h4>
                        <span class="payment-type">${this.formatPaymentType(payment.type)}</span>
                    </div>
                    <div class="payment-amount">${payment.amount}</div>
                </div>
                <div class="payment-details">
                    <div class="claims-info">
                        <span class="claims-completed">${payment.claimsCompleted || 0} claims completed</span>
                        ${payment.claims && payment.claims.length > 0 ? `<div class="claims-list">Claims: ${payment.claims.slice(0, 3).join(', ')}${payment.claims.length > 3 ? '...' : ''}</div>` : ''}
                    </div>
                </div>
                <div class="payment-actions">
                    <button class="action-link" data-action="mark-paid" data-event-id="${payment.id}">
                        Mark Paid
                    </button>
                    <button class="action-link" data-action="view-claims" data-event-id="${payment.id}">
                        View Claims
                    </button>
                </div>
            </div>
        `).join('');
        
        modalBody.innerHTML = `
            <div class="modal-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Payments:</span>
                    <span class="summary-value">$${total.toLocaleString()}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Number of Firms:</span>
                    <span class="summary-value">${payments.length}</span>
                </div>
            </div>
            <div class="modal-payments">
                ${paymentsHTML}
            </div>
        `;
        
        modal.style.display = 'flex';
    }

    /**
     * Utility Functions
     */
    formatPaymentDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (this.isSameDay(date, today)) return 'Today';
        if (this.isSameDay(date, tomorrow)) return 'Tomorrow';
        
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatNextPaymentDate(dateString) {
        if (!dateString) return 'None';
        
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays <= 7) return `${diffDays} days`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    formatPaymentType(type) {
        const types = {
            'weekly': 'Weekly',
            'bi-weekly': 'Bi-weekly',
            'monthly': 'Monthly'
        };
        return types[type] || type;
    }

    getPaymentPriority(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) return 'priority-urgent';
        if (diffDays <= 2) return 'priority-high';
        if (diffDays <= 5) return 'priority-medium';
        return 'priority-low';
    }

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    refreshData() {
        this.dataService.calculateUpcomingPayments();
        this.updateData();
    }

    // Additional utility methods for calendar navigation
    getWeekStart(date) {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        return start;
    }

    getWeekEnd(weekStart) {
        const end = new Date(weekStart);
        end.setDate(weekStart.getDate() + 6);
        return end;
    }

    generateWeekDays(weekStart) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            days.push(day);
        }
        return days;
    }

    renderDayColumn(date, payments) {
        const dayPayments = payments.filter(p => this.isSameDay(new Date(p.date), date));
        
        return `
            <div class="day-column">
                <div class="day-header">
                    <span class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span class="day-number">${date.getDate()}</span>
                </div>
                <div class="day-payments">
                    ${dayPayments.map(p => `
                        <div class="day-payment">
                            <span class="firm-name">${p.firmName}</span>
                            <span class="payment-amount">${p.amount}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderMonthGrid(payments) {
        const monthStart = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
        const monthEnd = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0);
        
        // Get first day of week for the month (0 = Sunday)
        const startDay = monthStart.getDay();
        const daysInMonth = monthEnd.getDate();
        
        // Create calendar grid
        let calendarHTML = `
            <div class="month-grid-container">
                <!-- Weekday headers -->
                <div class="weekday-headers">
                    <div class="weekday-header">Sun</div>
                    <div class="weekday-header">Mon</div>
                    <div class="weekday-header">Tue</div>
                    <div class="weekday-header">Wed</div>
                    <div class="weekday-header">Thu</div>
                    <div class="weekday-header">Fri</div>
                    <div class="weekday-header">Sat</div>
                </div>
                
                <!-- Calendar days -->
                <div class="calendar-grid">
        `;
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), day);
            const dateString = currentDate.toISOString().split('T')[0];
            
            // Get payments for this date
            const dayPayments = payments.filter(p => {
                const paymentDate = new Date(p.date);
                return this.isSameDay(paymentDate, currentDate);
            });
            
            // Calculate total for the day
            const dayTotal = dayPayments.reduce((sum, payment) => {
                return sum + parseFloat(payment.amount.replace(/[$,]/g, ''));
            }, 0);
            
            const isToday = this.isSameDay(currentDate, new Date());
            const hasPayments = dayPayments.length > 0;
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${hasPayments ? 'has-payments' : ''}" 
                     data-date="${dateString}" 
                     data-payments='${JSON.stringify(dayPayments)}'>
                    <div class="day-number">${day}</div>
                    ${hasPayments ? `
                        <div class="day-total">$${dayTotal.toLocaleString()}</div>
                        <div class="payments-count">${dayPayments.length} payment${dayPayments.length > 1 ? 's' : ''}</div>
                    ` : ''}
                </div>
            `;
        }
        
        calendarHTML += `
                </div>
            </div>
        `;
        
        return calendarHTML;
    }

    formatWeekRange(weekStart) {
        const weekEnd = this.getWeekEnd(weekStart);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    formatMonth(date) {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    navigateWeek(direction) {
        this.selectedDate.setDate(this.selectedDate.getDate() + (direction * 7));
        this.renderContent();
    }

    navigateMonth(direction) {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + direction);
        this.renderContent();
    }
}

// Export for use in other modules
window.BillingCalendarWidget = BillingCalendarWidget;
console.log('✅ BillingCalendarWidget loaded successfully');