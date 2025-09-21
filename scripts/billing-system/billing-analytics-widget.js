/**
 * Billing Analytics Widget
 * Dashboard analytics showing billing periods and firm performance
 */

class BillingAnalyticsWidget {
    constructor(containerId, jobBillingService) {
        this.container = document.getElementById(containerId);
        this.jobBillingService = jobBillingService;
        this.selectedPeriod = 30; // Default to 30 days
        this.selectedView = 'overview'; // overview, firms, trends
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Billing analytics container not found');
            return;
        }

        this.render();
        this.bindEvents();
        
        // Auto-refresh every 15 minutes
        this.startAutoRefresh();
    }

    render() {
        this.container.innerHTML = `
            <div class="billing-analytics-widget">
                <!-- Widget Header -->
                <div class="analytics-header">
                    <div class="header-title">
                        <h3>📊 Billing Analytics</h3>
                        <p class="header-subtitle">Performance insights & trends</p>
                    </div>
                    
                    <!-- Controls -->
                    <div class="analytics-controls">
                        <div class="period-selector">
                            <select class="period-select" data-control="period">
                                <option value="7" ${this.selectedPeriod === 7 ? 'selected' : ''}>Last 7 days</option>
                                <option value="30" ${this.selectedPeriod === 30 ? 'selected' : ''}>Last 30 days</option>
                                <option value="90" ${this.selectedPeriod === 90 ? 'selected' : ''}>Last 3 months</option>
                                <option value="365" ${this.selectedPeriod === 365 ? 'selected' : ''}>Last year</option>
                            </select>
                        </div>
                        
                        <div class="view-tabs">
                            <button class="view-tab ${this.selectedView === 'overview' ? 'active' : ''}" data-view="overview">Overview</button>
                            <button class="view-tab ${this.selectedView === 'firms' ? 'active' : ''}" data-view="firms">Firms</button>
                            <button class="view-tab ${this.selectedView === 'trends' ? 'active' : ''}" data-view="trends">Trends</button>
                        </div>
                    </div>
                </div>

                <!-- Analytics Content -->
                <div class="analytics-content" id="analyticsContent">
                    ${this.renderAnalyticsContent()}
                </div>
            </div>
        `;
    }

    renderAnalyticsContent() {
        const analytics = this.jobBillingService.getEarningsAnalytics(this.selectedPeriod);
        
        switch (this.selectedView) {
            case 'overview':
                return this.renderOverviewContent(analytics);
            case 'firms':
                return this.renderFirmsContent(analytics);
            case 'trends':
                return this.renderTrendsContent(analytics);
            default:
                return this.renderOverviewContent(analytics);
        }
    }

    renderOverviewContent(analytics) {
        const currentBillingPeriods = this.jobBillingService.getCurrentBillingPeriods();
        
        return `
            <!-- Key Metrics -->
            <div class="key-metrics">
                <div class="metric-card primary">
                    <div class="metric-icon">💰</div>
                    <div class="metric-details">
                        <div class="metric-value">$${analytics.totalEarnings.toLocaleString()}</div>
                        <div class="metric-label">Total Earnings</div>
                        <div class="metric-period">${this.selectedPeriod} days</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">📋</div>
                    <div class="metric-details">
                        <div class="metric-value">${analytics.totalJobs}</div>
                        <div class="metric-label">Jobs Completed</div>
                        <div class="metric-trend">$${Math.round(analytics.averagePerJob)} avg</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">🛣️</div>
                    <div class="metric-details">
                        <div class="metric-value">${analytics.totalMiles.toLocaleString()}</div>
                        <div class="metric-label">Miles Driven</div>
                        <div class="metric-trend">${Math.round(analytics.totalMiles / analytics.totalJobs || 0)} per job</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">🏢</div>
                    <div class="metric-details">
                        <div class="metric-value">${Object.keys(analytics.firmBreakdown).length}</div>
                        <div class="metric-label">Active Firms</div>
                        <div class="metric-trend">${Object.keys(currentBillingPeriods).length} pending</div>
                    </div>
                </div>
            </div>

            <!-- Current Billing Periods -->
            <div class="current-billing-section">
                <h4>Current Billing Periods</h4>
                <div class="billing-periods-grid">
                    ${this.renderCurrentBillingPeriods(currentBillingPeriods)}
                </div>
            </div>

            <!-- Quick Insights -->
            <div class="quick-insights">
                <h4>Quick Insights</h4>
                <div class="insights-grid">
                    ${this.renderQuickInsights(analytics)}
                </div>
            </div>
        `;
    }

    renderFirmsContent(analytics) {
        const firmStats = Object.entries(analytics.firmBreakdown)
            .sort((a, b) => b[1].amount - a[1].amount);
            
        return `
            <div class="firms-analysis">
                <!-- Firm Performance Rankings -->
                <div class="firm-rankings">
                    <h4>Firm Performance (${this.selectedPeriod} days)</h4>
                    <div class="rankings-list">
                        ${firmStats.map((([firmName, stats], index) => `
                            <div class="firm-ranking-item">
                                <div class="ranking-position">#${index + 1}</div>
                                <div class="firm-info">
                                    <h5 class="firm-name">${firmName}</h5>
                                    <div class="firm-stats">
                                        <span class="stat">${stats.jobs} jobs</span>
                                        <span class="stat">${stats.miles} miles</span>
                                        <span class="stat">$${Math.round(stats.amount / stats.jobs)} avg</span>
                                    </div>
                                </div>
                                <div class="firm-earnings">
                                    <div class="earnings-amount">$${stats.amount.toLocaleString()}</div>
                                    <div class="earnings-percentage">${Math.round((stats.amount / analytics.totalEarnings) * 100)}%</div>
                                </div>
                            </div>
                        `)).join('')}
                    </div>
                </div>

                <!-- Firm Configurations -->
                <div class="firm-configs">
                    <h4>Firm Rate Configurations</h4>
                    <div class="config-list">
                        ${this.renderFirmConfigurations()}
                    </div>
                </div>
            </div>
        `;
    }

    renderTrendsContent(analytics) {
        const dailyTrends = analytics.dailyTrends.slice(-14); // Last 14 days for trends
        
        return `
            <div class="trends-analysis">
                <!-- Earnings Trend Chart -->
                <div class="trend-chart-section">
                    <h4>Daily Earnings Trend</h4>
                    <div class="trend-chart" id="earningsTrendChart">
                        ${this.renderSimpleTrendChart(dailyTrends)}
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="performance-metrics">
                    <div class="metrics-grid">
                        <div class="performance-card">
                            <h5>Best Day</h5>
                            <div class="performance-value">${this.getBestDay(dailyTrends)}</div>
                        </div>
                        <div class="performance-card">
                            <h5>Most Jobs</h5>
                            <div class="performance-value">${this.getMostJobsDay(dailyTrends)}</div>
                        </div>
                        <div class="performance-card">
                            <h5>Avg Daily</h5>
                            <div class="performance-value">$${Math.round(analytics.totalEarnings / Math.max(dailyTrends.length, 1))}</div>
                        </div>
                        <div class="performance-card">
                            <h5>Work Days</h5>
                            <div class="performance-value">${dailyTrends.filter(d => d.jobs > 0).length} of ${dailyTrends.length}</div>
                        </div>
                    </div>
                </div>

                <!-- Weekly Comparison -->
                <div class="weekly-comparison">
                    <h4>Weekly Performance</h4>
                    <div class="weekly-stats">
                        ${this.renderWeeklyComparison(dailyTrends)}
                    </div>
                </div>
            </div>
        `;
    }

    renderCurrentBillingPeriods(billingPeriods) {
        if (Object.keys(billingPeriods).length === 0) {
            return '<div class="empty-state">No active billing periods</div>';
        }

        return Object.entries(billingPeriods).map(([firmName, period]) => `
            <div class="billing-period-card">
                <div class="period-header">
                    <h5 class="firm-name">${firmName}</h5>
                    <span class="period-type">${this.formatPaymentSchedule(period.paymentSchedule)}</span>
                </div>
                
                <div class="period-details">
                    <div class="period-amount">$${period.totalAmount.toLocaleString()}</div>
                    <div class="period-stats">
                        <span>${period.totalFiles} files</span>
                        <span>${period.totalMiles} miles</span>
                    </div>
                </div>
                
                <div class="period-timeline">
                    <div class="timeline-dates">
                        <span class="start-date">${this.formatDate(period.startDate)}</span>
                        <span class="end-date">${this.formatDate(period.endDate)}</span>
                    </div>
                    <div class="timeline-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${this.calculatePeriodProgress(period)}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="period-actions">
                    <button class="action-btn small" data-action="view-period" data-firm="${firmName}">View Details</button>
                </div>
            </div>
        `).join('');
    }

    renderQuickInsights(analytics) {
        const insights = this.generateInsights(analytics);
        
        return insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h6 class="insight-title">${insight.title}</h6>
                    <p class="insight-description">${insight.description}</p>
                </div>
            </div>
        `).join('');
    }

    renderFirmConfigurations() {
        const firmConfigs = this.jobBillingService.getAllFirmConfigs();
        
        if (firmConfigs.length === 0) {
            return '<div class="empty-state">No firm configurations</div>';
        }

        return `
            <div class="firms-accordion">
                ${firmConfigs.map((config, index) => `
                    <div class="accordion-item" data-accordion-item="${index}">
                        <!-- Accordion Header -->
                        <div class="accordion-header" data-accordion-toggle="${index}">
                            <div class="accordion-title">
                                <div class="firm-summary">
                                    <h6 class="firm-name">${config.name}</h6>
                                    <div class="firm-quick-info">
                                        <span class="payment-schedule">${this.formatPaymentSchedule(config.paymentSchedule)}</span>
                                        <span class="file-rate">$${config.fileRate}/claim</span>
                                    </div>
                                </div>
                                <div class="accordion-actions">
                                    <button class="delete-firm-btn" data-action="delete-firm" data-firm="${config.name}" title="Delete Firm">
                                        🗑️
                                    </button>
                                    <button class="edit-firm-btn" data-action="edit-firm-config" data-firm="${config.name}" title="Edit Configuration">
                                        ✏️
                                    </button>
                                    <div class="accordion-chevron">
                                        <span>▼</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Accordion Content -->
                        <div class="accordion-content" data-accordion-content="${index}">
                            <div class="config-details">
                                <div class="config-section">
                                    <h6>Billing Rates</h6>
                                    <div class="config-rates">
                                        <div class="rate-item">
                                            <span class="rate-label">File Rate</span>
                                            <span class="rate-value">$${config.fileRate}</span>
                                        </div>
                                        <div class="rate-item">
                                            <span class="rate-label">Mileage</span>
                                            <span class="rate-value">$${config.mileageRate}/mi after ${config.freeMileage}mi</span>
                                        </div>
                                        ${config.timeExpenseRate > 0 ? `
                                            <div class="rate-item">
                                                <span class="rate-label">Time/Expense</span>
                                                <span class="rate-value">$${config.timeExpenseRate}/hr</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <div class="config-section">
                                    <h6>Payment Schedule</h6>
                                    <div class="schedule-info">
                                        <div class="schedule-item">
                                            <span class="schedule-label">Frequency</span>
                                            <span class="schedule-value">${this.formatPaymentSchedule(config.paymentSchedule)}</span>
                                        </div>
                                        <div class="schedule-item">
                                            <span class="schedule-label">Payment Day</span>
                                            <span class="schedule-value">${config.paymentDay}</span>
                                        </div>
                                    </div>
                                </div>

                                ${config.contactInfo ? `
                                    <div class="config-section">
                                        <h6>Contact Information</h6>
                                        <div class="contact-info">
                                            ${config.contactInfo.email ? `
                                                <div class="contact-item">
                                                    <span class="contact-label">Email</span>
                                                    <span class="contact-value">${config.contactInfo.email}</span>
                                                </div>
                                            ` : ''}
                                            ${config.contactInfo.phone ? `
                                                <div class="contact-item">
                                                    <span class="contact-label">Phone</span>
                                                    <span class="contact-value">${config.contactInfo.phone}</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSimpleTrendChart(dailyTrends) {
        if (dailyTrends.length === 0) {
            return '<div class="empty-state">No trend data available</div>';
        }

        const maxEarnings = Math.max(...dailyTrends.map(d => d.earnings));
        const chartHeight = 120;
        
        return `
            <div class="simple-chart">
                <div class="chart-bars">
                    ${dailyTrends.map((day, index) => {
                        const height = maxEarnings > 0 ? (day.earnings / maxEarnings) * chartHeight : 0;
                        return `
                            <div class="chart-bar-container">
                                <div class="chart-bar" 
                                     style="height: ${height}px;"
                                     title="$${day.earnings} - ${day.jobs} jobs">
                                </div>
                                <div class="chart-label">${this.formatChartDate(day.date)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="chart-y-axis">
                    <span class="y-label">$${Math.round(maxEarnings)}</span>
                    <span class="y-label">$${Math.round(maxEarnings / 2)}</span>
                    <span class="y-label">$0</span>
                </div>
            </div>
        `;
    }

    renderWeeklyComparison(dailyTrends) {
        const weeks = this.groupByWeek(dailyTrends);
        
        return weeks.map((week, index) => `
            <div class="week-comparison-item">
                <div class="week-header">
                    <h6>Week ${index + 1}</h6>
                    <span class="week-dates">${this.formatWeekRange(week.dates)}</span>
                </div>
                <div class="week-stats">
                    <div class="week-stat">
                        <span class="stat-value">$${week.earnings.toLocaleString()}</span>
                        <span class="stat-label">Earnings</span>
                    </div>
                    <div class="week-stat">
                        <span class="stat-value">${week.jobs}</span>
                        <span class="stat-label">Jobs</span>
                    </div>
                    <div class="week-stat">
                        <span class="stat-value">${week.workDays}</span>
                        <span class="stat-label">Work Days</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    bindEvents() {
        this.container.addEventListener('change', (e) => {
            if (e.target.dataset.control === 'period') {
                this.selectedPeriod = parseInt(e.target.value);
                this.refreshContent();
            }
        });

        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const firmName = e.target.dataset.firm;
            
            switch (action) {
                case 'view-period':
                    this.handleViewPeriod(firmName);
                    break;
                case 'edit-firm-config':
                    this.handleEditFirmConfig(firmName);
                    break;
                case 'delete-firm':
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleDeleteFirm(firmName);
                    break;
            }

            // Handle accordion toggle
            const accordionToggle = e.target.dataset.accordionToggle;
            if (accordionToggle !== undefined) {
                this.toggleAccordionItem(accordionToggle);
            }

            // Handle view tab clicks
            if (e.target.classList.contains('view-tab')) {
                this.selectedView = e.target.dataset.view;
                this.updateActiveTab();
                this.refreshContent();
            }
        });
    }

    updateActiveTab() {
        this.container.querySelectorAll('.view-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === this.selectedView);
        });
    }

    refreshContent() {
        const contentContainer = document.getElementById('analyticsContent');
        if (contentContainer) {
            contentContainer.innerHTML = this.renderAnalyticsContent();
        }
    }

    handleViewPeriod(firmName) {
        // Emit event for detailed period view
        window.dispatchEvent(new CustomEvent('billing:view-period', {
            detail: { firmName }
        }));
    }

    handleEditFirmConfig(firmName) {
        // Emit event for firm configuration editing
        window.dispatchEvent(new CustomEvent('firm:edit-config', {
            detail: { firmName }
        }));
    }

    handleDeleteFirm(firmName) {
        if (!firmName) return;
        
        // Show confirmation dialog
        if (confirm(`Are you sure you want to delete the billing configuration for "${firmName}"?\n\nThis will remove all billing rates and payment schedules for this firm. This action cannot be undone.`)) {
            try {
                // Call the JobBillingService delete method
                const success = this.jobBillingService.deleteFirmConfig(firmName);
                
                if (success) {
                    this.showNotification(`${firmName} configuration deleted successfully`, 'success');
                    
                    // Refresh the content to reflect changes
                    this.refreshContent();
                    
                    // Emit event for other widgets to update
                    window.dispatchEvent(new CustomEvent('firm:deleted', {
                        detail: { firmName }
                    }));
                } else {
                    this.showNotification('Failed to delete firm configuration', 'error');
                }
            } catch (error) {
                console.error('Error deleting firm:', error);
                this.showNotification('Error deleting firm configuration', 'error');
            }
        }
    }

    toggleAccordionItem(itemIndex) {
        const accordionItem = this.container.querySelector(`[data-accordion-item="${itemIndex}"]`);
        const accordionContent = this.container.querySelector(`[data-accordion-content="${itemIndex}"]`);
        const accordionChevron = accordionItem.querySelector('.accordion-chevron span');
        
        if (!accordionItem || !accordionContent) return;
        
        const isExpanded = accordionContent.style.maxHeight;
        
        if (isExpanded) {
            // Collapse
            accordionContent.style.maxHeight = null;
            accordionItem.classList.remove('expanded');
            if (accordionChevron) accordionChevron.style.transform = '';
        } else {
            // Expand
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            accordionItem.classList.add('expanded');
            if (accordionChevron) accordionChevron.style.transform = 'rotate(180deg)';
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease-out'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Utility Functions
     */
    generateInsights(analytics) {
        const insights = [];
        
        // Top earning firm
        const topFirm = Object.entries(analytics.firmBreakdown)
            .sort((a, b) => b[1].amount - a[1].amount)[0];
            
        if (topFirm) {
            insights.push({
                type: 'success',
                icon: '🏆',
                title: 'Top Performer',
                description: `${topFirm[0]} generated $${topFirm[1].amount.toLocaleString()} (${Math.round((topFirm[1].amount / analytics.totalEarnings) * 100)}% of total)`
            });
        }

        // High mileage efficiency
        if (analytics.totalJobs > 0) {
            const avgMilesPerJob = analytics.totalMiles / analytics.totalJobs;
            if (avgMilesPerJob < 30) {
                insights.push({
                    type: 'info',
                    icon: '⚡',
                    title: 'Efficient Routes',
                    description: `Average ${Math.round(avgMilesPerJob)} miles per job shows good route optimization`
                });
            }
        }

        // Daily average insights
        const dailyAvg = analytics.totalEarnings / this.selectedPeriod;
        if (dailyAvg > 200) {
            insights.push({
                type: 'success',
                icon: '📈',
                title: 'Strong Daily Average',
                description: `$${Math.round(dailyAvg)} daily average over ${this.selectedPeriod} days`
            });
        }

        return insights;
    }

    getBestDay(trends) {
        if (trends.length === 0) return 'No data';
        
        const bestDay = trends.reduce((max, day) => 
            day.earnings > max.earnings ? day : max
        );
        
        return `$${bestDay.earnings} (${this.formatDate(bestDay.date)})`;
    }

    getMostJobsDay(trends) {
        if (trends.length === 0) return 'No data';
        
        const mostJobsDay = trends.reduce((max, day) => 
            day.jobs > max.jobs ? day : max
        );
        
        return `${mostJobsDay.jobs} jobs (${this.formatDate(mostJobsDay.date)})`;
    }

    groupByWeek(dailyTrends) {
        const weeks = [];
        let currentWeek = null;
        
        dailyTrends.forEach(day => {
            const date = new Date(day.date);
            const weekStart = this.getWeekStart(date);
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!currentWeek || currentWeek.key !== weekKey) {
                currentWeek = {
                    key: weekKey,
                    earnings: 0,
                    jobs: 0,
                    workDays: 0,
                    dates: [day.date]
                };
                weeks.push(currentWeek);
            } else {
                currentWeek.dates.push(day.date);
            }
            
            currentWeek.earnings += day.earnings;
            currentWeek.jobs += day.jobs;
            if (day.jobs > 0) currentWeek.workDays++;
        });
        
        return weeks;
    }

    getWeekStart(date) {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        return start;
    }

    calculatePeriodProgress(period) {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        const now = new Date();
        
        const totalDuration = end - start;
        const elapsed = now - start;
        
        return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }

    formatPaymentSchedule(schedule) {
        const schedules = {
            'weekly': 'Weekly',
            'bi-weekly': 'Bi-weekly',
            'monthly': 'Monthly'
        };
        return schedules[schedule] || schedule;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatChartDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'numeric', 
            day: 'numeric' 
        });
    }

    formatWeekRange(dates) {
        if (dates.length === 0) return '';
        
        const firstDate = new Date(dates[0]);
        const lastDate = new Date(dates[dates.length - 1]);
        
        return `${this.formatDate(firstDate.toISOString())} - ${this.formatDate(lastDate.toISOString())}`;
    }

    startAutoRefresh() {
        // Refresh every 15 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshContent();
        }, 15 * 60 * 1000);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Export for use in other modules
window.BillingAnalyticsWidget = BillingAnalyticsWidget;