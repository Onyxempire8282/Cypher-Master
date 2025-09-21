class CalendarController {
    constructor() {
        this.currentDate = new Date();
        this.appointments = [];
        this.completedJobs = [];
        this.firmPayments = [];
        this.billingTotals = {
            monthly: 0,
            pending: 0,
            completed: 0
        };
        
        console.log('📅 CalendarController initialized');
    }

    async initialize() {
        console.log('📅 Initializing Calendar Controller...');
        
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderCalendar();
            this.updateBillingSummary();
            
            console.log('✅ Calendar Controller initialized successfully');
        } catch (error) {
            console.error('❌ Calendar Controller initialization failed:', error);
            this.showNotification('Failed to initialize calendar', 'error');
        }
    }

    async loadData() {
        // Load appointments from localStorage (scheduled from route optimizer)
        try {
            const storedAppointments = localStorage.getItem('cc_calendar_appointments');
            this.appointments = storedAppointments ? JSON.parse(storedAppointments) : [];
            
            console.log('📅 Loaded appointments from localStorage:', this.appointments);
        } catch (error) {
            console.error('❌ Failed to load appointments:', error);
            this.appointments = [];
        }
        
        // Add some mock data if no appointments exist (for demonstration)
        if (this.appointments.length === 0) {
            this.appointments = [
                {
                    id: 'demo-1',
                    date: '2025-01-15',
                    time: '10:00',
                    duration: 45,
                    address: '123 Main St, Charlotte, NC',
                    firm: 'State Farm',
                    type: 'auto',
                    notes: 'Property inspection',
                    status: 'scheduled'
                },
                {
                    id: 'demo-2', 
                    date: '2025-01-16',
                    time: '14:30',
                    duration: 60,
                    address: '456 Oak Ave, Raleigh, NC',
                    firm: 'Allstate',
                    type: 'property',
                    notes: 'Roof damage assessment',
                    status: 'scheduled'
                }
            ];
        }

        this.completedJobs = [
            {
                id: 'job-001',
                completedDate: '2025-01-10',
                firm: 'State Farm',
                type: 'Auto Claim',
                amount: 275.00,
                billable: true,
                mileage: 45.2
            },
            {
                id: 'job-002',
                completedDate: '2025-01-12',
                firm: 'GEICO',
                type: 'Property Claim', 
                amount: 350.00,
                billable: true,
                mileage: 62.8
            }
        ];

        this.firmPayments = [
            {
                firm: 'State Farm',
                amount: 1250.00,
                dueDate: '2025-01-25',
                status: 'pending'
            },
            {
                firm: 'Allstate',
                amount: 890.00,
                dueDate: '2025-01-28',
                status: 'pending'
            }
        ];

        this.calculateBillingTotals();
    }

    calculateBillingTotals() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Calculate completed jobs this month
        const thisMonthCompleted = this.completedJobs.filter(job => {
            const jobDate = new Date(job.completedDate);
            return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
        });
        
        this.billingTotals.completed = thisMonthCompleted.reduce((total, job) => total + job.amount, 0);
        this.billingTotals.pending = this.firmPayments.reduce((total, payment) => total + payment.amount, 0);
        this.billingTotals.monthly = this.billingTotals.completed + this.billingTotals.pending;
    }

    setupEventListeners() {
        // Date navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());
        
        // Schedule appointment
        document.getElementById('scheduleBtn')?.addEventListener('click', () => this.openScheduleModal());
        
        // Export buttons
        document.getElementById('exportGoogle')?.addEventListener('click', () => this.exportToGoogle());
        document.getElementById('exportApple')?.addEventListener('click', () => this.exportToApple());
        document.getElementById('exportOutlook')?.addEventListener('click', () => this.exportToOutlook());
        
        // Schedule form
        document.getElementById('scheduleForm')?.addEventListener('submit', (e) => this.handleScheduleSubmit(e));
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.updateMonthDisplay();
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.updateMonthDisplay();
        this.renderCalendar();
    }

    updateMonthDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) {
            currentMonthEl.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    }

    renderCalendar() {
        const calendarView = document.getElementById('calendarView');
        if (!calendarView) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        let calendarHTML = `
            <div class="calendar-header">
                <div class="calendar-weekdays">
                    <div class="weekday">Sun</div>
                    <div class="weekday">Mon</div>
                    <div class="weekday">Tue</div>
                    <div class="weekday">Wed</div>
                    <div class="weekday">Thu</div>
                    <div class="weekday">Fri</div>
                    <div class="weekday">Sat</div>
                </div>
            </div>
            <div class="calendar-body">
                <div class="calendar-grid">
        `;
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDay = new Date(year, month, day);
            const dateStr = currentDay.toISOString().split('T')[0];
            const isToday = currentDay.toDateString() === today.toDateString();
            
            // Find appointments for this day
            const dayAppointments = this.appointments.filter(apt => apt.date === dateStr);
            const dayJobs = this.completedJobs.filter(job => job.completedDate === dateStr);
            
            let dayClasses = 'calendar-day';
            if (isToday) dayClasses += ' today';
            if (dayAppointments.length > 0) dayClasses += ' has-appointments';
            if (dayJobs.length > 0) dayClasses += ' has-completed-jobs';
            
            calendarHTML += `
                <div class="${dayClasses}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    <div class="day-events">
            `;
            
            // Add appointment indicators (show up to 3, then show count)
            if (dayAppointments.length > 0) {
                const showCount = Math.min(dayAppointments.length, 2);
                for (let i = 0; i < showCount; i++) {
                    const apt = dayAppointments[i];
                    calendarHTML += `
                        <div class="event appointment" title="${apt.time} - ${apt.firm || 'Inspection'}: ${apt.address || 'No address'}">
                            📅 ${apt.time}
                        </div>
                    `;
                }
                
                if (dayAppointments.length > 2) {
                    calendarHTML += `
                        <div class="event appointment more" title="${dayAppointments.length - 2} more appointments">
                            +${dayAppointments.length - 2} more
                        </div>
                    `;
                }
            }
            
            // Add completed job indicators
            dayJobs.forEach(job => {
                calendarHTML += `
                    <div class="event completed-job" title="$${job.amount} - ${job.firm}">
                        ✅ $${job.amount}
                    </div>
                `;
            });
            
            calendarHTML += `
                    </div>
                </div>
            `;
        }
        
        calendarHTML += `
                </div>
            </div>
        `;
        
        calendarView.innerHTML = calendarHTML;
        
        // Add click listeners to calendar days
        document.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const date = e.currentTarget.dataset.date;
                if (date) {
                    this.onDayClick(date);
                }
            });
        });
        
        this.updateMonthDisplay();
    }

    onDayClick(dateStr) {
        // Open schedule modal with selected date
        const appointmentDate = document.getElementById('appointmentDate');
        if (appointmentDate) {
            appointmentDate.value = dateStr;
        }
        this.openScheduleModal();
    }

    openScheduleModal() {
        const modal = document.getElementById('scheduleModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeScheduleModal() {
        const modal = document.getElementById('scheduleModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Reset form
        const form = document.getElementById('scheduleForm');
        if (form) {
            form.reset();
        }
    }

    async handleScheduleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const appointmentData = {
            id: Date.now().toString(),
            date: formData.get('appointmentDate') || document.getElementById('appointmentDate').value,
            time: formData.get('appointmentTime') || document.getElementById('appointmentTime').value,
            duration: parseInt(document.getElementById('appointmentDuration').value),
            address: document.getElementById('appointmentAddress').value,
            firm: document.getElementById('appointmentFirm').value,
            type: document.getElementById('appointmentType').value,
            notes: document.getElementById('appointmentNotes').value,
            status: 'scheduled'
        };
        
        try {
            // Add appointment to local array (in real app, save to database)
            this.appointments.push(appointmentData);
            
            // Close modal and refresh calendar
            this.closeScheduleModal();
            this.renderCalendar();
            this.showNotification('Appointment scheduled successfully!', 'success');
            
            console.log('✅ Appointment scheduled:', appointmentData);
            
        } catch (error) {
            console.error('❌ Failed to schedule appointment:', error);
            this.showNotification('Failed to schedule appointment', 'error');
        }
    }

    updateBillingSummary() {
        // Update billing totals display
        document.getElementById('monthlyTotal').textContent = `$${this.billingTotals.monthly.toFixed(2)}`;
        document.getElementById('pendingTotal').textContent = `$${this.billingTotals.pending.toFixed(2)}`;
        document.getElementById('completedTotal').textContent = `$${this.billingTotals.completed.toFixed(2)}`;
        
        // Update payment schedule
        this.renderPaymentSchedule();
        
        // Update completed jobs list
        this.renderCompletedJobs();
    }

    renderPaymentSchedule() {
        const container = document.getElementById('paymentSchedule');
        if (!container) return;
        
        if (this.firmPayments.length === 0) {
            container.innerHTML = '<div class="no-payments"><p>No scheduled payments</p></div>';
            return;
        }
        
        let html = '';
        this.firmPayments.forEach(payment => {
            const dueDate = new Date(payment.dueDate);
            const formattedDate = dueDate.toLocaleDateString();
            
            html += `
                <div class="payment-item">
                    <div class="payment-firm">${payment.firm}</div>
                    <div class="payment-amount">$${payment.amount.toFixed(2)}</div>
                    <div class="payment-date">Due: ${formattedDate}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderCompletedJobs() {
        const container = document.getElementById('completedJobsList');
        if (!container) return;
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthJobs = this.completedJobs.filter(job => {
            const jobDate = new Date(job.completedDate);
            return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
        });
        
        if (thisMonthJobs.length === 0) {
            container.innerHTML = '<div class="no-completed-jobs"><p>No completed jobs this month</p></div>';
            return;
        }
        
        let html = '';
        thisMonthJobs.forEach(job => {
            const completedDate = new Date(job.completedDate);
            const formattedDate = completedDate.toLocaleDateString();
            
            html += `
                <div class="completed-job-item">
                    <div class="job-firm">${job.firm}</div>
                    <div class="job-type">${job.type}</div>
                    <div class="job-amount">$${job.amount.toFixed(2)}</div>
                    <div class="job-date">${formattedDate}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Export Functions
    async exportToGoogle() {
        console.log('📅 Exporting to Google Calendar...');
        
        // Generate Google Calendar URL
        const events = this.appointments.map(apt => {
            const startDate = new Date(`${apt.date}T${apt.time}`);
            const endDate = new Date(startDate.getTime() + (apt.duration * 60000));
            
            return {
                title: `${apt.firm} - ${apt.type}`,
                start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
                end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
                details: `Address: ${apt.address}\nNotes: ${apt.notes}`,
                location: apt.address
            };
        });
        
        if (events.length > 0) {
            const firstEvent = events[0];
            const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(firstEvent.title)}&dates=${firstEvent.start}/${firstEvent.end}&details=${encodeURIComponent(firstEvent.details)}&location=${encodeURIComponent(firstEvent.location)}`;
            
            window.open(calendarUrl, '_blank');
            this.showNotification('Opening Google Calendar...', 'success');
        } else {
            this.showNotification('No appointments to export', 'warning');
        }
    }

    async exportToApple() {
        console.log('🍎 Exporting to Apple Calendar...');
        
        // Generate .ics file for Apple Calendar
        let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Claim Cipher//Calendar Export//EN\n';
        
        this.appointments.forEach(apt => {
            const startDate = new Date(`${apt.date}T${apt.time}`);
            const endDate = new Date(startDate.getTime() + (apt.duration * 60000));
            
            icsContent += 'BEGIN:VEVENT\n';
            icsContent += `UID:${apt.id}@claimcipher.com\n`;
            icsContent += `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
            icsContent += `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
            icsContent += `SUMMARY:${apt.firm} - ${apt.type}\n`;
            icsContent += `DESCRIPTION:${apt.notes}\n`;
            icsContent += `LOCATION:${apt.address}\n`;
            icsContent += 'END:VEVENT\n';
        });
        
        icsContent += 'END:VCALENDAR';
        
        // Create and download .ics file
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'claim-cipher-appointments.ics';
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Calendar file downloaded!', 'success');
    }

    async exportToOutlook() {
        console.log('📧 Exporting to Outlook...');
        
        // Generate .ics file (same format works for Outlook)
        await this.exportToApple();
        this.showNotification('Import the downloaded file into Outlook', 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        });
        
        // Set background color based on type
        const colors = {
            success: '#34a853',
            error: '#ea4335',
            warning: '#fbbc04', 
            info: '#1a73e8'
        };
        notification.style.background = colors[type] || colors.info;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global function to close modal (called by onclick in HTML)
window.closeScheduleModal = function() {
    if (window.calendarController) {
        window.calendarController.closeScheduleModal();
    }
};

// Export class
window.CalendarController = CalendarController;