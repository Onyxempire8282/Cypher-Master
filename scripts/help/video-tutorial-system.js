class VideoTutorialSystem {
    constructor() {
        this.isEnabled = true; // Can be active even when other services aren't
        this.currentVideo = null;
        this.watchedVideos = new Set(); // Track completed tutorials
        this.userProgress = new Map(); // Track user progress through tutorials
        
        // Tutorial video library organized by feature
        this.tutorialLibrary = {
            'getting-started': {
                title: 'Getting Started with Claim Cipher',
                description: 'Complete overview of the platform and workflow',
                duration: '8:30',
                thumbnail: 'assets/thumbnails/getting-started.jpg',
                videoUrl: 'videos/getting-started.mp4', // Will host on YouTube/Vimeo
                youtubeId: 'dQw4w9WgXcQ', // Placeholder - replace with actual
                sections: [
                    { time: '0:00', title: 'Platform Overview' },
                    { time: '1:30', title: 'Navigation Basics' },
                    { time: '3:00', title: 'Workflow Introduction' },
                    { time: '5:15', title: 'Account Setup' },
                    { time: '7:00', title: 'Next Steps' }
                ],
                difficulty: 'beginner',
                category: 'onboarding'
            },
            
            'route-optimizer': {
                title: 'Route Optimizer Masterclass',
                description: 'Plan efficient multi-stop inspection routes',
                duration: '12:45',
                thumbnail: 'assets/thumbnails/route-optimizer.jpg',
                videoUrl: 'videos/route-optimizer.mp4',
                youtubeId: 'dQw4w9WgXcQ', // Placeholder
                sections: [
                    { time: '0:00', title: 'Adding Inspection Addresses' },
                    { time: '2:30', title: 'Route Optimization Options' },
                    { time: '5:00', title: 'Time Windows & Scheduling' },
                    { time: '7:30', title: 'Customer Contact Management' },
                    { time: '10:15', title: 'Exporting to Mileage Calculator' }
                ],
                difficulty: 'intermediate',
                category: 'workflow'
            },

            'sms-customer-communication': {
                title: 'SMS Customer Communication',
                description: 'Automated appointment reminders and customer contact',
                duration: '9:20',
                thumbnail: 'assets/thumbnails/sms-communication.jpg',
                videoUrl: 'videos/sms-communication.mp4',
                youtubeId: 'dQw4w9WgXcQ',
                sections: [
                    { time: '0:00', title: 'SMS Templates Overview' },
                    { time: '2:00', title: 'Customizing Messages' },
                    { time: '4:30', title: 'Automated Reminders' },
                    { time: '6:45', title: 'Managing Responses' },
                    { time: '8:00', title: 'Best Practices' }
                ],
                difficulty: 'intermediate',
                category: 'communication'
            },

            'mileage-calculator': {
                title: 'Professional Mileage Tracking',
                description: 'Track and calculate reimbursable mileage',
                duration: '7:15',
                thumbnail: 'assets/thumbnails/mileage-calculator.jpg',
                videoUrl: 'videos/mileage-calculator.mp4',
                youtubeId: 'dQw4w9WgXcQ',
                sections: [
                    { time: '0:00', title: 'Import from Route Optimizer' },
                    { time: '1:45', title: 'Manual Mileage Entry' },
                    { time: '3:30', title: 'Firm-Specific Rates' },
                    { time: '5:00', title: 'Generating Reports' },
                    { time: '6:30', title: 'Export Options' }
                ],
                difficulty: 'beginner',
                category: 'workflow'
            },

            'jobs-management': {
                title: 'Jobs & Assignment Management',
                description: 'Create, track, and manage inspection jobs',
                duration: '11:30',
                thumbnail: 'assets/thumbnails/jobs-management.jpg',
                videoUrl: 'videos/jobs-management.mp4',
                youtubeId: 'dQw4w9WgXcQ',
                sections: [
                    { time: '0:00', title: 'Creating New Jobs' },
                    { time: '2:15', title: 'Job Status Tracking' },
                    { time: '4:45', title: 'Mobile Integration' },
                    { time: '7:00', title: 'Billing Integration' },
                    { time: '9:30', title: 'Completion Workflow' }
                ],
                difficulty: 'advanced',
                category: 'workflow'
            },

            'total-loss-processing': {
                title: 'Total Loss Document Processing',
                description: 'Upload CCC estimates and generate complete TPA packages',
                duration: '14:20',
                thumbnail: 'assets/thumbnails/total-loss.jpg',
                videoUrl: 'videos/total-loss.mp4',
                youtubeId: 'dQw4w9WgXcQ',
                sections: [
                    { time: '0:00', title: 'Uploading CCC Estimates' },
                    { time: '3:00', title: 'Data Extraction Process' },
                    { time: '6:30', title: 'BCIF Generation' },
                    { time: '9:45', title: 'Vehicle Valuation' },
                    { time: '12:00', title: 'Complete Package Export' }
                ],
                difficulty: 'advanced',
                category: 'documentation'
            },

            'analytics-reporting': {
                title: 'Analytics & Performance Reports',
                description: 'Track your efficiency and earnings with detailed analytics',
                duration: '6:45',
                thumbnail: 'assets/thumbnails/analytics.jpg',
                videoUrl: 'videos/analytics.mp4',
                youtubeId: 'dQw4w9WgXcQ',
                sections: [
                    { time: '0:00', title: 'Dashboard Overview' },
                    { time: '2:30', title: 'Earnings Analysis' },
                    { time: '4:15', title: 'Efficiency Metrics' },
                    { time: '5:30', title: 'Custom Reports' }
                ],
                difficulty: 'intermediate',
                category: 'analytics'
            },

            'firm-management': {
                title: 'Managing Multiple Insurance Firms',
                description: 'Configure and manage relationships with different firms',
                duration: '8:50',
                thumbnail: 'assets/thumbnails/firm-management.jpg',
                videoUrl: 'videos/firm-management.mp4',
                youtubeId: 'dQw4w9WgXcQ',
                sections: [
                    { time: '0:00', title: 'Adding New Firms' },
                    { time: '2:20', title: 'Rate Configuration' },
                    { time: '4:30', title: 'Billing Preferences' },
                    { time: '6:15', title: 'Contact Management' },
                    { time: '7:45', title: 'Performance Tracking' }
                ],
                difficulty: 'intermediate',
                category: 'administration'
            },

            // Advanced workflow tutorials
            'complete-workflow': {
                title: 'Complete Claims Workflow',
                description: 'End-to-end process from route planning to completion',
                duration: '18:30',
                thumbnail: 'assets/thumbnails/complete-workflow.jpg',
                videoUrl: 'videos/complete-workflow.mp4',
                youtubeId: 'dQw4w9WgXcQ',
                sections: [
                    { time: '0:00', title: 'Workflow Overview' },
                    { time: '2:00', title: 'Route Planning Phase' },
                    { time: '5:30', title: 'Customer Communication' },
                    { time: '8:45', title: 'Inspection Execution' },
                    { time: '12:00', title: 'Documentation & Reporting' },
                    { time: '15:15', title: 'Billing & Completion' }
                ],
                difficulty: 'advanced',
                category: 'workflow'
            },

            'troubleshooting': {
                title: 'Common Issues & Troubleshooting',
                description: 'Solve common problems and optimize your workflow',
                duration: '10:15',
                thumbnail: 'assets/thumbnails/troubleshooting.jpg',
                videoUrl: 'videos/troubleshooting.mp4',
                youtubeId: 'dQw4w9WgXcQ',
                sections: [
                    { time: '0:00', title: 'Route Optimization Issues' },
                    { time: '2:45', title: 'SMS Delivery Problems' },
                    { time: '5:30', title: 'Document Generation Errors' },
                    { time: '7:20', title: 'Performance Optimization' },
                    { time: '8:45', title: 'Getting Support' }
                ],
                difficulty: 'all',
                category: 'support'
            }
        };

        // Tutorial playlists for different user types
        this.playlists = {
            'new-user': {
                title: 'New User Onboarding',
                description: 'Everything you need to get started',
                videos: ['getting-started', 'route-optimizer', 'mileage-calculator', 'sms-customer-communication'],
                estimatedTime: '37:50'
            },
            'advanced-workflow': {
                title: 'Advanced Professional Workflow',
                description: 'Master all features for maximum efficiency',
                videos: ['complete-workflow', 'jobs-management', 'total-loss-processing', 'analytics-reporting'],
                estimatedTime: '51:25'
            },
            'firm-administrator': {
                title: 'Firm Administration',
                description: 'Managing multiple firms and billing',
                videos: ['firm-management', 'analytics-reporting', 'jobs-management'],
                estimatedTime: '28:05'
            }
        };

        console.log('📹 Video Tutorial System initialized');
    }

    // GET TUTORIAL BY ID
    getTutorial(tutorialId) {
        return this.tutorialLibrary[tutorialId] || null;
    }

    // GET ALL TUTORIALS BY CATEGORY
    getTutorialsByCategory(category) {
        return Object.entries(this.tutorialLibrary)
            .filter(([id, tutorial]) => tutorial.category === category)
            .map(([id, tutorial]) => ({ id, ...tutorial }));
    }

    // GET TUTORIALS BY DIFFICULTY
    getTutorialsByDifficulty(difficulty) {
        return Object.entries(this.tutorialLibrary)
            .filter(([id, tutorial]) => tutorial.difficulty === difficulty || tutorial.difficulty === 'all')
            .map(([id, tutorial]) => ({ id, ...tutorial }));
    }

    // GET PLAYLIST
    getPlaylist(playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return null;

        return {
            ...playlist,
            videos: playlist.videos.map(videoId => ({
                id: videoId,
                ...this.tutorialLibrary[videoId]
            }))
        };
    }

    // MARK VIDEO AS WATCHED
    markVideoWatched(videoId, userId = 'default') {
        this.watchedVideos.add(`${userId}:${videoId}`);
        
        // Update progress tracking
        if (!this.userProgress.has(userId)) {
            this.userProgress.set(userId, {
                watchedVideos: new Set(),
                completedPlaylists: new Set(),
                watchTime: 0
            });
        }
        
        const progress = this.userProgress.get(userId);
        progress.watchedVideos.add(videoId);
        
        // Add estimated watch time
        const tutorial = this.tutorialLibrary[videoId];
        if (tutorial) {
            const duration = this.parseDuration(tutorial.duration);
            progress.watchTime += duration;
        }

        console.log(`📹 Video marked as watched: ${videoId}`);
        return true;
    }

    // GET USER PROGRESS
    getUserProgress(userId = 'default') {
        const progress = this.userProgress.get(userId);
        if (!progress) {
            return {
                watchedVideos: 0,
                totalVideos: Object.keys(this.tutorialLibrary).length,
                completedPlaylists: 0,
                totalPlaylists: Object.keys(this.playlists).length,
                watchTime: 0,
                completionPercentage: 0
            };
        }

        const totalVideos = Object.keys(this.tutorialLibrary).length;
        const watchedCount = progress.watchedVideos.size;
        
        return {
            watchedVideos: watchedCount,
            totalVideos: totalVideos,
            completedPlaylists: progress.completedPlaylists.size,
            totalPlaylists: Object.keys(this.playlists).length,
            watchTime: progress.watchTime,
            completionPercentage: Math.round((watchedCount / totalVideos) * 100)
        };
    }

    // GET RECOMMENDED VIDEOS
    getRecommendedVideos(userId = 'default', currentFeature = null) {
        const progress = this.userProgress.get(userId);
        const watchedVideos = progress ? Array.from(progress.watchedVideos) : [];
        
        // If user is on a specific feature, recommend related videos
        if (currentFeature) {
            const relatedVideo = this.tutorialLibrary[currentFeature];
            if (relatedVideo && !watchedVideos.includes(currentFeature)) {
                return [{ id: currentFeature, ...relatedVideo, reason: 'current_feature' }];
            }
        }

        // For new users, recommend onboarding
        if (watchedVideos.length === 0) {
            return this.getPlaylist('new-user').videos.slice(0, 3);
        }

        // Recommend based on what they haven't watched
        const unwatchedVideos = Object.entries(this.tutorialLibrary)
            .filter(([id, tutorial]) => !watchedVideos.includes(id))
            .map(([id, tutorial]) => ({ id, ...tutorial }))
            .slice(0, 4);

        return unwatchedVideos;
    }

    // SEARCH TUTORIALS
    searchTutorials(query) {
        const searchTerm = query.toLowerCase();
        
        return Object.entries(this.tutorialLibrary)
            .filter(([id, tutorial]) => {
                return tutorial.title.toLowerCase().includes(searchTerm) ||
                       tutorial.description.toLowerCase().includes(searchTerm) ||
                       tutorial.category.toLowerCase().includes(searchTerm) ||
                       tutorial.sections.some(section => 
                           section.title.toLowerCase().includes(searchTerm)
                       );
            })
            .map(([id, tutorial]) => ({ id, ...tutorial }));
    }

    // GENERATE VIDEO EMBED CODE
    generateEmbedCode(tutorialId, startTime = 0) {
        const tutorial = this.tutorialLibrary[tutorialId];
        if (!tutorial) return null;

        // YouTube embed
        if (tutorial.youtubeId) {
            const startParam = startTime > 0 ? `&start=${startTime}` : '';
            return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${tutorial.youtubeId}?rel=0&modestbranding=1${startParam}" frameborder="0" allowfullscreen></iframe>`;
        }

        // Local video
        return `<video width="100%" height="400" controls>
                    <source src="${tutorial.videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>`;
    }

    // GENERATE HELP CONTENT FOR CURRENT PAGE
    generateContextualHelp(currentPage) {
        const helpMapping = {
            'route-optimizer': 'route-optimizer',
            'mileage-calculator': 'mileage-calculator',
            'jobs': 'jobs-management',
            'total-loss': 'total-loss-processing',
            'analytics': 'analytics-reporting',
            'firms': 'firm-management',
            'dashboard': 'getting-started'
        };

        const tutorialId = helpMapping[currentPage];
        if (!tutorialId) return null;

        const tutorial = this.tutorialLibrary[tutorialId];
        return {
            id: tutorialId,
            ...tutorial,
            embedCode: this.generateEmbedCode(tutorialId),
            contextualTips: this.getContextualTips(currentPage)
        };
    }

    // GET CONTEXTUAL TIPS FOR CURRENT PAGE
    getContextualTips(currentPage) {
        const tips = {
            'route-optimizer': [
                'Start by adding all your inspection addresses',
                'Use time windows for precise scheduling',
                'Export optimized routes to mileage calculator',
                'Save frequently used routes as templates'
            ],
            'mileage-calculator': [
                'Import routes automatically from route optimizer',
                'Set up firm-specific mileage rates',
                'Generate reports weekly for consistent billing',
                'Track both business and personal miles separately'
            ],
            'jobs': [
                'Create jobs directly from completed routes',
                'Use status tracking to manage workflow',
                'Integrate with mobile apps for field updates',
                'Set up automated billing for completed jobs'
            ],
            'total-loss': [
                'Upload clear, complete CCC estimates',
                'Review extracted data for accuracy',
                'Use generated documents as professional templates',
                'Save time with batch processing'
            ]
        };

        return tips[currentPage] || [];
    }

    // UTILITY METHODS
    parseDuration(duration) {
        const parts = duration.split(':');
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return (minutes * 60) + seconds;
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // GET ALL CATEGORIES
    getCategories() {
        const categories = new Set();
        Object.values(this.tutorialLibrary).forEach(tutorial => {
            categories.add(tutorial.category);
        });
        return Array.from(categories);
    }

    // EXPORT USER PROGRESS (for analytics)
    exportUserProgress(userId = 'default') {
        const progress = this.getUserProgress(userId);
        const watchedVideos = this.userProgress.get(userId)?.watchedVideos || new Set();
        
        return {
            ...progress,
            watchedVideoIds: Array.from(watchedVideos),
            exportedAt: new Date().toISOString()
        };
    }
}

// Global instance
window.VideoTutorialSystem = VideoTutorialSystem;

console.log('📹 Video Tutorial System loaded and ready');