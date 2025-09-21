/**
 * Earnings Summary Widget
 * Dashboard shortcut showing weekly and monthly totals
 */

class EarningsSummaryWidget {
    constructor(containerId, jobBillingService) {
        this.container = document.getElementById(containerId);
        this.jobBillingService = jobBillingService;
        this.loginDate = new Date().toISOString().split('T')[0];
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Earnings summary container not found');
            return;
        }

        this.render();
        this.bindEvents();
        
        // Auto-refresh every 30 minutes
        this.startAutoRefresh();
    }

    render() {
        const summaryData = this.calculateEarningsSummary();
        
        this.container.innerHTML = `
            <div class="earnings-summary-widget" data-action="view-analytics">
                <!-- Widget Header -->
                <div class="summary-header">
                    <div class="header-main">
                        <div class="header-icon">💰</div>
                        <div class="header-title">
                            <h4>Earnings Overview</h4>
                            <span class="header-subtitle">Click to view detailed analytics</span>
                        </div>
                    </div>
                    <div class="header-summary">
                        <div class="earnings-display">
                            <span class="earnings-amount">$${summaryData.today.earnings.toLocaleString()}</span>
                            <span class="earnings-jobs">${summaryData.today.jobs} jobs today</span>
                        </div>
                        <div class="expand-indicator ${this.isExpanded ? 'expanded' : ''}">
                            <span>▼</span>
                        </div>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="summary-cards">
                    <!-- Today's Earnings -->
                    <div class="summary-card today ${summaryData.today.hasJobs ? 'active' : 'inactive'}">
                        <div class="card-header">
                            <span class="card-icon">📊</span>
                            <span class="card-label">Today</span>
                        </div>
                        <div class="card-content">
                            <div class="card-amount">$${summaryData.today.earnings.toLocaleString()}</div>
                            <div class="card-details">
                                ${summaryData.today.jobs} jobs • ${summaryData.today.miles} miles
                            </div>
                        </div>
                        ${summaryData.today.isFinalized ? `
                            <div class="card-status finalized">✅ Finalized</div>
                        ` : summaryData.today.hasJobs ? `
                            <div class="card-status active">🔄 Active</div>
                        ` : `
                            <div class="card-status inactive">No jobs yet</div>
                        `}
                    </div>

                    <!-- This Week -->
                    <div class="summary-card week">
                        <div class="card-header">
                            <span class="card-icon">📅</span>
                            <span class="card-label">This Week</span>
                        </div>
                        <div class="card-content">
                            <div class="card-amount">$${summaryData.week.earnings.toLocaleString()}</div>
                            <div class="card-details">
                                ${summaryData.week.jobs} jobs • ${summaryData.week.workDays} work days
                            </div>
                        </div>
                        <div class="card-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${summaryData.week.progressPercent}%"></div>
                            </div>
                            <span class="progress-label">${summaryData.week.daysLeft} days left</span>
                        </div>
                    </div>

                    <!-- This Month -->
                    <div class="summary-card month">
                        <div class="card-header">
                            <span class="card-icon">📊</span>
                            <span class="card-label">This Month</span>
                        </div>
                        <div class="card-content">
                            <div class="card-amount">$${summaryData.month.earnings.toLocaleString()}</div>
                            <div class="card-details">
                                ${summaryData.month.jobs} jobs • ${Math.round(summaryData.month.avgPerDay)} daily avg
                            </div>
                        </div>
                        <div class="card-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${summaryData.month.progressPercent}%"></div>
                            </div>
                            <span class="progress-label">${summaryData.month.daysLeft} days left</span>
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="summary-card stats">
                        <div class="card-header">
                            <span class="card-icon">⚡</span>
                            <span class="card-label">Quick Stats</span>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-value">${summaryData.quickStats.activeFirms}</span>
                                <span class="stat-label">Active Firms</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">$${Math.round(summaryData.quickStats.avgPerJob)}</span>
                                <span class="stat-label">Avg per Job</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${Math.round(summaryData.quickStats.avgMilesPerJob)}</span>
                                <span class="stat-label">Avg Miles</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${summaryData.quickStats.upcomingPayments}</span>
                                <span class="stat-label">Pending Bills</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Trending Insights -->
                <div class="trending-insights">
                    <div class="insights-header">
                        <h5>📈 Trending</h5>
                    </div>
                    <div class="insights-list">
                        ${this.renderTrendingInsights(summaryData.trends)}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity">
                    <div class="activity-header">
                        <h5>🕒 Recent Activity</h5>
                        <span class="activity-count">${summaryData.recentActivity.length} recent</span>
                    </div>
                    <div class="activity-list">
                        ${this.renderRecentActivity(summaryData.recentActivity)}
                    </div>
                </div>
            </div>
        `;
    }

    calculateEarningsSummary() {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        // Get various time periods
        const weekStart = this.getWeekStart(today);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Today's data
        const todayTally = this.jobBillingService.getDailyTally(todayString) || {
            totalEarnings: 0,
            totalJobs: 0,
            totalMiles: 0,
            isFinalized: false
        };

        // Week data
        const weekData = this.getEarningsForPeriod(weekStart, today);
        const weekDaysElapsed = this.getDaysInPeriod(weekStart, today);
        const weekDaysTotal = 7;
        
        // Month data
        const monthData = this.getEarningsForPeriod(monthStart, today);
        const monthDaysElapsed = this.getDaysInPeriod(monthStart, today);
        const monthDaysTotal = this.getDaysInMonth(today);
        
        // Quick stats
        const last30DaysAnalytics = this.jobBillingService.getEarningsAnalytics(30);
        const currentBillingPeriods = this.jobBillingService.getCurrentBillingPeriods();
        
        return {
            today: {
                earnings: todayTally.totalEarnings,
                jobs: todayTally.totalJobs,
                miles: todayTally.totalMiles,
                hasJobs: todayTally.totalJobs > 0,
                isFinalized: todayTally.isFinalized
            },
            week: {
                earnings: weekData.totalEarnings,
                jobs: weekData.totalJobs,
                workDays: weekData.workDays,
                progressPercent: Math.round((weekDaysElapsed / weekDaysTotal) * 100),
                daysLeft: Math.max(0, weekDaysTotal - weekDaysElapsed)
            },
            month: {
                earnings: monthData.totalEarnings,
                jobs: monthData.totalJobs,
                avgPerDay: monthData.totalJobs > 0 ? monthData.totalEarnings / monthDaysElapsed : 0,
                progressPercent: Math.round((monthDaysElapsed / monthDaysTotal) * 100),
                daysLeft: Math.max(0, monthDaysTotal - monthDaysElapsed)
            },
            quickStats: {
                activeFirms: Object.keys(last30DaysAnalytics.firmBreakdown).length,
                avgPerJob: last30DaysAnalytics.averagePerJob,
                avgMilesPerJob: last30DaysAnalytics.totalJobs > 0 ? last30DaysAnalytics.totalMiles / last30DaysAnalytics.totalJobs : 0,
                upcomingPayments: Object.keys(currentBillingPeriods).length
            },
            trends: this.calculateTrends(last30DaysAnalytics),
            recentActivity: this.getRecentActivity()
        };
    }

    getEarningsForPeriod(startDate, endDate) {
        const dailyTallies = this.jobBillingService.dailyTallies;
        let totalEarnings = 0;
        let totalJobs = 0;
        let workDays = 0;
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            const tally = dailyTallies.get(dateString);
            
            if (tally) {
                totalEarnings += tally.totalEarnings;
                totalJobs += tally.totalJobs;
                if (tally.totalJobs > 0) workDays++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return { totalEarnings, totalJobs, workDays };
    }

    calculateTrends(analytics) {
        const trends = [];
        
        // Earnings trend
        if (analytics.totalEarnings > 0) {
            const dailyAvg = analytics.totalEarnings / 30;
            if (dailyAvg > 200) {
                trends.push({
                    icon: '📈',
                    text: `Strong $${Math.round(dailyAvg)} daily average`,
                    type: 'positive'
                });
            } else if (dailyAvg < 100) {
                trends.push({
                    icon: '📉',
                    text: `Below target daily average`,
                    type: 'neutral'
                });
            }
        }
        
        // Top firm performance
        const firmEntries = Object.entries(analytics.firmBreakdown);
        if (firmEntries.length > 0) {
            const topFirm = firmEntries.sort((a, b) => b[1].amount - a[1].amount)[0];
            const percentage = Math.round((topFirm[1].amount / analytics.totalEarnings) * 100);
            
            if (percentage > 60) {
                trends.push({
                    icon: '⚠️',
                    text: `${topFirm[0]} dominates ${percentage}% of earnings`,
                    type: 'warning'
                });
            } else {
                trends.push({
                    icon: '🏆',
                    text: `${topFirm[0]} leads with $${topFirm[1].amount.toLocaleString()}`,
                    type: 'positive'
                });
            }
        }
        
        // Efficiency trend
        if (analytics.totalJobs > 0) {
            const avgMiles = analytics.totalMiles / analytics.totalJobs;
            if (avgMiles < 30) {
                trends.push({
                    icon: '⚡',
                    text: `Efficient ${Math.round(avgMiles)} miles per job`,
                    type: 'positive'
                });
            }
        }
        
        return trends;
    }

    getRecentActivity() {
        const activities = [];
        const today = new Date();
        
        // Check recent jobs from last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            const tally = this.jobBillingService.getDailyTally(dateString);
            if (tally && tally.totalJobs > 0) {
                if (tally.isFinalized) {
                    activities.push({
                        icon: '✅',
                        text: `Finalized ${tally.totalJobs} jobs ($${tally.totalEarnings.toLocaleString()})`,
                        date: dateString,
                        type: 'finalized'
                    });
                } else if (dateString === today.toISOString().split('T')[0]) {
                    activities.push({
                        icon: '🔄',
                        text: `${tally.totalJobs} jobs in progress`,
                        date: dateString,
                        type: 'active'
                    });
                } else {
                    activities.push({
                        icon: '📋',
                        text: `${tally.totalJobs} jobs completed`,
                        date: dateString,
                        type: 'completed'
                    });
                }
            }
        }
        
        return activities.slice(0, 5); // Show only 5 most recent
    }

    renderTrendingInsights(trends) {
        if (trends.length === 0) {
            return '<div class="empty-insights">No trends available</div>';
        }
        
        return trends.map(trend => `
            <div class="insight-item ${trend.type}">
                <span class="insight-icon">${trend.icon}</span>
                <span class="insight-text">${trend.text}</span>
            </div>
        `).join('');
    }

    renderRecentActivity(activities) {
        if (activities.length === 0) {
            return '<div class="empty-activity">No recent activity</div>';
        }
        
        return activities.map(activity => `
            <div class="activity-item ${activity.type}">
                <span class="activity-icon">${activity.icon}</span>
                <div class="activity-content">
                    <span class="activity-text">${activity.text}</span>
                    <span class="activity-date">${this.formatActivityDate(activity.date)}</span>
                </div>
            </div>
        `).join('');
    }

    bindEvents() {
        // Click to navigate to analytics tab
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="view-analytics"]')) {
                this.navigateToAnalytics();
            }
        });

        // Listen for job completion and day finalization events
        window.addEventListener('job:completed', () => {
            this.refresh();
        });

        window.addEventListener('day:finalized', () => {
            this.refresh();
        });

        window.addEventListener('billing:updated', () => {
            this.refresh();
        });
    }

    navigateToAnalytics() {
        // Emit event to switch to analytics tab
        window.dispatchEvent(new CustomEvent('dashboard:navigate', {
            detail: { 
                tab: 'analytics',
                source: 'earnings-summary'
            }
        }));

        // If master interface controller is available, use it directly
        if (window.masterInterface && window.masterInterface.switchTab) {
            window.masterInterface.switchTab('analytics');
        }
    }

    startAutoRefresh() {
        // Refresh every 30 minutes
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, 30 * 60 * 1000);
    }

    refresh() {
        this.render();
    }

    /**
     * Utility Functions
     */
    getWeekStart(date) {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        start.setHours(0, 0, 0, 0);
        return start;
    }

    getDaysInPeriod(startDate, endDate) {
        const timeDiff = endDate.getTime() - startDate.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    }

    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    formatActivityDate(dateString) {
        const date = new Date(dateString);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        if (dateString === today) {
            return 'Today';
        } else if (dateString === yesterdayString) {
            return 'Yesterday';
        } else {
            const daysDiff = Math.floor((new Date(today) - date) / (1000 * 60 * 60 * 24));
            return `${daysDiff} days ago`;
        }
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Export for use in other modules
window.EarningsSummaryWidget = EarningsSummaryWidget;