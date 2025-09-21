/**
 * Daily Tally Widget
 * Shows daily earnings summary with End Day functionality
 */

class DailyTallyWidget {
    constructor(containerId, jobBillingService) {
        this.container = document.getElementById(containerId);
        this.jobBillingService = jobBillingService;
        this.currentDate = new Date().toISOString().split('T')[0];
        this.isExpanded = false;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Daily tally container not found');
            return;
        }

        this.render();
        this.bindEvents();
        
        // Auto-refresh every 5 minutes during work hours
        this.startAutoRefresh();
    }

    render() {
        const currentTally = this.jobBillingService.getCurrentDailyTally();
        
        this.container.innerHTML = `
            <div class="daily-tally-widget">
                <!-- Widget Header -->
                <div class="tally-header" data-action="toggle-expand">
                    <div class="header-main">
                        <div class="tally-icon">📊</div>
                        <div class="tally-title">
                            <h4>Today's Earnings</h4>
                            <span class="tally-date">${this.formatTallyDate(currentTally.date)}</span>
                        </div>
                    </div>
                    
                    <div class="header-summary">
                        <div class="earnings-display">
                            <span class="earnings-amount">$${currentTally.totalEarnings.toLocaleString()}</span>
                            <span class="earnings-jobs">${currentTally.totalJobs} jobs</span>
                        </div>
                        <div class="expand-indicator ${this.isExpanded ? 'expanded' : ''}">
                            <span>▼</span>
                        </div>
                    </div>
                </div>

                <!-- Expanded Content -->
                <div class="tally-content ${this.isExpanded ? 'expanded' : 'collapsed'}">
                    
                    <!-- Quick Stats -->
                    <div class="tally-stats">
                        <div class="stat-item">
                            <span class="stat-label">Total Miles</span>
                            <span class="stat-value">${currentTally.totalMiles}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Avg per Job</span>
                            <span class="stat-value">$${currentTally.totalJobs > 0 ? Math.round(currentTally.totalEarnings / currentTally.totalJobs) : 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Status</span>
                            <span class="stat-value ${currentTally.isFinalized ? 'finalized' : 'active'}">${currentTally.isFinalized ? 'Finalized' : 'Active'}</span>
                        </div>
                    </div>

                    <!-- Firm Breakdown -->
                    <div class="firm-breakdown">
                        <h5>Firm Breakdown</h5>
                        <div class="firm-list" id="firmBreakdownList">
                            ${this.renderFirmBreakdown(currentTally.firmBreakdown)}
                        </div>
                    </div>

                    <!-- Recent Jobs -->
                    <div class="recent-jobs">
                        <h5>Recent Jobs</h5>
                        <div class="jobs-list" id="recentJobsList">
                            ${this.renderRecentJobs(currentTally.completedJobIds)}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="tally-actions">
                        ${!currentTally.isFinalized ? `
                            <button class="action-btn primary" data-action="end-day">
                                🏁 End Day & Finalize
                            </button>
                            <button class="action-btn secondary" data-action="export-day">
                                📤 Export Summary
                            </button>
                        ` : `
                            <div class="finalized-message">
                                <span>✅ Day finalized at ${this.formatTime(currentTally.finalizedAt)}</span>
                                <button class="action-btn secondary" data-action="export-day">
                                    📤 Export Summary
                                </button>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Minimized Quick View -->
                <div class="tally-quick-view ${this.isExpanded ? 'hidden' : 'visible'}">
                    <div class="quick-stats">
                        <span class="quick-stat">💰 $${currentTally.totalEarnings.toLocaleString()}</span>
                        <span class="quick-stat">📋 ${currentTally.totalJobs} jobs</span>
                        <span class="quick-stat">🛣️ ${currentTally.totalMiles}mi</span>
                    </div>
                    ${!currentTally.isFinalized && currentTally.totalJobs > 0 ? `
                        <button class="quick-end-day" data-action="end-day">End Day</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderFirmBreakdown(firmBreakdown) {
        if (Object.keys(firmBreakdown).length === 0) {
            return '<div class="empty-state">No jobs completed today</div>';
        }

        return Object.entries(firmBreakdown).map(([firmName, data]) => `
            <div class="firm-breakdown-item">
                <div class="firm-info">
                    <span class="firm-name">${firmName}</span>
                    <span class="firm-jobs">${data.jobs} jobs</span>
                </div>
                <div class="firm-earnings">
                    <span class="firm-amount">$${data.amount.toLocaleString()}</span>
                    <span class="firm-miles">${data.miles}mi</span>
                </div>
            </div>
        `).join('');
    }

    renderRecentJobs(jobIds) {
        if (jobIds.length === 0) {
            return '<div class="empty-state">No jobs completed today</div>';
        }

        // Get the last 5 jobs
        const recentJobIds = jobIds.slice(-5).reverse();
        
        return recentJobIds.map(jobId => {
            const job = this.jobBillingService.jobs.get(jobId);
            if (!job) return '';
            
            return `
                <div class="job-item" data-job-id="${jobId}">
                    <div class="job-info">
                        <span class="job-claim">${job.claimNumber}</span>
                        <span class="job-firm">${job.firmName}</span>
                        <span class="job-time">${this.formatJobTime(job.completedDate)}</span>
                    </div>
                    <div class="job-earnings">
                        <span class="job-amount">$${job.totalJobValue.toLocaleString()}</span>
                        <span class="job-miles">${job.roundtripMiles}mi</span>
                    </div>
                    <button class="job-edit-btn" data-action="edit-job" data-job-id="${jobId}">✏️</button>
                </div>
            `;
        }).join('');
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const jobId = e.target.dataset.jobId;
            
            switch (action) {
                case 'toggle-expand':
                    this.toggleExpand();
                    break;
                case 'end-day':
                    this.handleEndDay();
                    break;
                case 'export-day':
                    this.handleExportDay();
                    break;
                case 'edit-job':
                    this.handleEditJob(jobId);
                    break;
            }
        });

        // Also listen for job completion events to auto-refresh
        window.addEventListener('job:completed', () => {
            this.refresh();
        });

        window.addEventListener('job:updated', () => {
            this.refresh();
        });
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        this.render();
    }

    handleEndDay() {
        const currentTally = this.jobBillingService.getCurrentDailyTally();
        
        if (currentTally.totalJobs === 0) {
            this.showNotification('No jobs to finalize today', 'warning');
            return;
        }

        // Show confirmation dialog
        if (confirm(`Finalize today's earnings of $${currentTally.totalEarnings.toLocaleString()} from ${currentTally.totalJobs} jobs?`)) {
            try {
                const finalizedTally = this.jobBillingService.finalizeDay(currentTally.date);
                
                if (finalizedTally) {
                    this.showNotification('Day finalized successfully! 🎉', 'success');
                    this.refresh();
                    
                    // Trigger event for other widgets
                    window.dispatchEvent(new CustomEvent('day:finalized', {
                        detail: { tally: finalizedTally }
                    }));
                } else {
                    this.showNotification('Error finalizing day', 'error');
                }
            } catch (error) {
                console.error('Error finalizing day:', error);
                this.showNotification('Error finalizing day', 'error');
            }
        }
    }

    handleExportDay() {
        const currentTally = this.jobBillingService.getCurrentDailyTally();
        const exportData = this.generateExportData(currentTally);
        
        // Create downloadable CSV
        const csvContent = this.generateCSV(exportData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-earnings-${currentTally.date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Daily summary exported 📊', 'success');
    }

    handleEditJob(jobId) {
        // Emit event for job editing modal/form
        window.dispatchEvent(new CustomEvent('job:edit-requested', {
            detail: { jobId }
        }));
    }

    generateExportData(tally) {
        const exportData = {
            summary: {
                date: tally.date,
                totalEarnings: tally.totalEarnings,
                totalJobs: tally.totalJobs,
                totalMiles: tally.totalMiles,
                isFinalized: tally.isFinalized
            },
            firms: [],
            jobs: []
        };

        // Add firm breakdown
        Object.entries(tally.firmBreakdown).forEach(([firmName, data]) => {
            exportData.firms.push({
                firmName,
                jobs: data.jobs,
                amount: data.amount,
                miles: data.miles
            });
        });

        // Add job details
        tally.completedJobIds.forEach(jobId => {
            const job = this.jobBillingService.jobs.get(jobId);
            if (job) {
                exportData.jobs.push({
                    claimNumber: job.claimNumber,
                    firmName: job.firmName,
                    amount: job.totalJobValue,
                    miles: job.roundtripMiles,
                    completedTime: job.completedDate
                });
            }
        });

        return exportData;
    }

    generateCSV(exportData) {
        let csv = 'Daily Earnings Summary\n';
        csv += `Date,${exportData.summary.date}\n`;
        csv += `Total Earnings,$${exportData.summary.totalEarnings}\n`;
        csv += `Total Jobs,${exportData.summary.totalJobs}\n`;
        csv += `Total Miles,${exportData.summary.totalMiles}\n`;
        csv += `Status,${exportData.summary.isFinalized ? 'Finalized' : 'Active'}\n\n`;
        
        csv += 'Firm Breakdown\n';
        csv += 'Firm Name,Jobs,Amount,Miles\n';
        exportData.firms.forEach(firm => {
            csv += `${firm.firmName},${firm.jobs},$${firm.amount},${firm.miles}\n`;
        });
        
        csv += '\nJob Details\n';
        csv += 'Claim Number,Firm,Amount,Miles,Completed Time\n';
        exportData.jobs.forEach(job => {
            csv += `${job.claimNumber},${job.firmName},$${job.amount},${job.miles},${job.completedTime}\n`;
        });
        
        return csv;
    }

    startAutoRefresh() {
        // Refresh every 5 minutes during work hours (6 AM - 8 PM)
        this.refreshInterval = setInterval(() => {
            const now = new Date();
            const hour = now.getHours();
            
            if (hour >= 6 && hour <= 20) {
                this.refresh();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    refresh() {
        this.render();
    }

    updateDate(date) {
        this.currentDate = date;
        this.render();
    }

    /**
     * Utility Functions
     */
    formatTallyDate(dateString) {
        const date = new Date(dateString);
        const today = new Date().toISOString().split('T')[0];
        
        if (dateString === today) {
            return 'Today';
        }
        
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    formatTime(isoString) {
        if (!isoString) return '';
        
        const time = new Date(isoString);
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    formatJobTime(isoString) {
        if (!isoString) return '';
        
        const time = new Date(isoString);
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
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

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Export for use in other modules
window.DailyTallyWidget = DailyTallyWidget;