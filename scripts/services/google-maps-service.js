/**
 * Google Maps Service
 * Handles mileage calculations and route optimization
 */

class GoogleMapsService {
    constructor() {
        this.apiKey = null;
        this.isLoaded = false;
        this.distanceMatrixService = null;
        this.directionsService = null;
        this.placesService = null;
        this.loadPromise = null;
        
        this.init();
    }

    async init() {
        try {
            // Get API key from environment or config
            this.apiKey = await this.getApiKey();
            
            if (!this.apiKey) {
                console.warn('Google Maps API key not found. Mileage calculations will use estimates.');
                return;
            }

            // Load Google Maps API
            await this.loadGoogleMapsAPI();
            this.initializeServices();
            
        } catch (error) {
            console.error('Google Maps initialization failed:', error);
        }
    }

    async getApiKey() {
        // In production, this would come from your backend environment
        // For development, we'll check multiple sources
        
        // Check if running in GitHub Actions or similar CI environment
        if (typeof process !== 'undefined' && process.env) {
            return process.env.GOOGLE_MAPS_API_KEY_RESTRICTED;
        }
        
        // Check window.ENV if set by build process
        if (window.ENV && window.ENV.GOOGLE_MAPS_API_KEY) {
            return window.ENV.GOOGLE_MAPS_API_KEY;
        }
        
        // Check local config file (for development)
        try {
            if (window.devConfig && window.devConfig.googleMapsApiKey) {
                return window.devConfig.googleMapsApiKey;
            }
        } catch (error) {
            // Dev config not available
        }
        
        // For production deployment, the key should be injected by your build process
        // This is a placeholder that should be replaced during deployment
        return null;
    }

    loadGoogleMapsAPI() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise((resolve, reject) => {
            // Check if Google Maps is already loaded
            if (window.google && window.google.maps) {
                this.isLoaded = true;
                resolve();
                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                this.isLoaded = true;
                console.log('✅ Google Maps API loaded successfully');
                resolve();
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Google Maps API');
                reject(new Error('Failed to load Google Maps API'));
            };
            
            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    initializeServices() {
        if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded');
        }

        this.distanceMatrixService = new window.google.maps.DistanceMatrixService();
        this.directionsService = new window.google.maps.DirectionsService();
        
        // Create a dummy element for places service (required by API)
        const dummyElement = document.createElement('div');
        this.placesService = new window.google.maps.places.PlacesService(dummyElement);
        
        console.log('✅ Google Maps services initialized');
    }

    /**
     * Calculate roundtrip mileage between two addresses
     */
    async calculateRoundtripMileage(originAddress, destinationAddress) {
        try {
            if (!this.isLoaded || !this.distanceMatrixService) {
                return this.getFallbackMileage(originAddress, destinationAddress);
            }

            const result = await this.getDistanceMatrix(originAddress, destinationAddress);
            
            if (result && result.distance && result.duration) {
                const oneWayMiles = result.distance.value * 0.000621371; // Convert meters to miles
                const roundtripMiles = Math.round(oneWayMiles * 2 * 100) / 100; // Round to 2 decimal places
                
                return {
                    success: true,
                    miles: roundtripMiles,
                    oneWayMiles: Math.round(oneWayMiles * 100) / 100,
                    duration: result.duration.text,
                    routeDetails: {
                        origin: originAddress,
                        destination: destinationAddress,
                        oneWayDistance: result.distance.text,
                        oneWayDuration: result.duration.text,
                        calculatedAt: new Date().toISOString(),
                        method: 'google_maps_api'
                    }
                };
            } else {
                throw new Error('Invalid response from Distance Matrix API');
            }
            
        } catch (error) {
            console.error('Mileage calculation error:', error);
            return this.getFallbackMileage(originAddress, destinationAddress);
        }
    }

    /**
     * Get distance matrix data from Google Maps API
     */
    getDistanceMatrix(origin, destination) {
        return new Promise((resolve, reject) => {
            this.distanceMatrixService.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                unitSystem: window.google.maps.UnitSystem.IMPERIAL,
                travelMode: window.google.maps.TravelMode.DRIVING,
                avoidHighways: false,
                avoidTolls: false,
                drivingOptions: {
                    departureTime: new Date(),
                    trafficModel: window.google.maps.TrafficModel.BEST_GUESS
                }
            }, (response, status) => {
                if (status === 'OK') {
                    const element = response.rows[0].elements[0];
                    
                    if (element.status === 'OK') {
                        resolve({
                            distance: element.distance,
                            duration: element.duration,
                            duration_in_traffic: element.duration_in_traffic
                        });
                    } else {
                        reject(new Error(`Route calculation failed: ${element.status}`));
                    }
                } else {
                    reject(new Error(`Google Maps API error: ${status}`));
                }
            });
        });
    }

    /**
     * Optimize route for multiple stops
     */
    async optimizeRoute(homeAddress, jobAddresses) {
        try {
            if (!this.isLoaded || !this.directionsService) {
                return this.getFallbackRouteOptimization(homeAddress, jobAddresses);
            }

            const waypoints = jobAddresses.map(address => ({
                location: address,
                stopover: true
            }));

            const result = await this.getOptimizedDirections(homeAddress, homeAddress, waypoints);
            
            return {
                success: true,
                optimizedOrder: result.routes[0].waypoint_order,
                totalDistance: this.calculateTotalDistance(result.routes[0]),
                totalDuration: this.calculateTotalDuration(result.routes[0]),
                routeDetails: {
                    origin: homeAddress,
                    destination: homeAddress,
                    waypoints: jobAddresses,
                    optimizedAt: new Date().toISOString(),
                    method: 'google_maps_directions'
                }
            };
            
        } catch (error) {
            console.error('Route optimization error:', error);
            return this.getFallbackRouteOptimization(homeAddress, jobAddresses);
        }
    }

    /**
     * Get optimized directions from Google Maps API
     */
    getOptimizedDirections(origin, destination, waypoints) {
        return new Promise((resolve, reject) => {
            this.directionsService.route({
                origin: origin,
                destination: destination,
                waypoints: waypoints,
                optimizeWaypoints: true,
                travelMode: window.google.maps.TravelMode.DRIVING,
                unitSystem: window.google.maps.UnitSystem.IMPERIAL,
                avoidHighways: false,
                avoidTolls: false
            }, (response, status) => {
                if (status === 'OK') {
                    resolve(response);
                } else {
                    reject(new Error(`Directions API error: ${status}`));
                }
            });
        });
    }

    /**
     * Validate and geocode address
     */
    async validateAddress(address) {
        try {
            if (!this.isLoaded) {
                return { success: false, address: address, method: 'no_validation' };
            }

            const result = await this.geocodeAddress(address);
            
            return {
                success: true,
                originalAddress: address,
                formattedAddress: result.formatted_address,
                coordinates: {
                    lat: result.geometry.location.lat(),
                    lng: result.geometry.location.lng()
                },
                addressComponents: result.address_components,
                method: 'google_geocoding'
            };
            
        } catch (error) {
            console.warn('Address validation failed:', error);
            return { 
                success: false, 
                address: address, 
                method: 'no_validation',
                error: error.message 
            };
        }
    }

    /**
     * Geocode address using Google Maps API
     */
    geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            const geocoder = new window.google.maps.Geocoder();
            
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    resolve(results[0]);
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });
    }

    /**
     * Fallback methods when Google Maps is not available
     */
    getFallbackMileage(origin, destination) {
        console.warn('Using fallback mileage calculation');
        
        // Simple estimation based on address strings
        // In reality, you might use a simpler mapping service or database
        const estimatedMiles = this.estimateDistanceFromAddresses(origin, destination);
        
        return {
            success: false,
            miles: estimatedMiles,
            oneWayMiles: estimatedMiles / 2,
            duration: 'N/A',
            routeDetails: {
                origin: origin,
                destination: destination,
                calculatedAt: new Date().toISOString(),
                method: 'estimated'
            }
        };
    }

    getFallbackRouteOptimization(homeAddress, jobAddresses) {
        console.warn('Using fallback route optimization');
        
        return {
            success: false,
            optimizedOrder: jobAddresses.map((_, index) => index), // Keep original order
            totalDistance: jobAddresses.length * 25, // Estimate 25 miles per job
            totalDuration: `${jobAddresses.length * 45} minutes`, // Estimate 45 min per job
            routeDetails: {
                origin: homeAddress,
                destination: homeAddress,
                waypoints: jobAddresses,
                optimizedAt: new Date().toISOString(),
                method: 'estimated'
            }
        };
    }

    estimateDistanceFromAddresses(origin, destination) {
        // Very basic estimation - in production you might use ZIP code distances
        // or a simple lat/lng estimation
        
        if (origin === destination) return 0;
        
        // Extract potential ZIP codes or city names for basic estimation
        const originParts = origin.toLowerCase().split(/[,\s]+/);
        const destParts = destination.toLowerCase().split(/[,\s]+/);
        
        // If addresses seem to be in the same area (same ZIP or city), estimate shorter distance
        const hasCommonArea = originParts.some(part => 
            destParts.some(destPart => 
                part.length > 3 && destPart.includes(part)
            )
        );
        
        if (hasCommonArea) {
            return Math.random() * 20 + 10; // 10-30 miles for same area
        } else {
            return Math.random() * 60 + 20; // 20-80 miles for different areas
        }
    }

    /**
     * Utility methods
     */
    calculateTotalDistance(route) {
        let totalMeters = 0;
        route.legs.forEach(leg => {
            totalMeters += leg.distance.value;
        });
        return Math.round(totalMeters * 0.000621371 * 100) / 100; // Convert to miles
    }

    calculateTotalDuration(route) {
        let totalSeconds = 0;
        route.legs.forEach(leg => {
            totalSeconds += leg.duration.value;
        });
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Service status and health checks
     */
    isApiLoaded() {
        return this.isLoaded && this.apiKey !== null;
    }

    getServiceStatus() {
        return {
            isLoaded: this.isLoaded,
            hasApiKey: this.apiKey !== null,
            services: {
                distanceMatrix: this.distanceMatrixService !== null,
                directions: this.directionsService !== null,
                places: this.placesService !== null
            }
        };
    }

    /**
     * Development and testing methods
     */
    async testApiConnection() {
        if (!this.isApiLoaded()) {
            return { success: false, error: 'API not loaded' };
        }

        try {
            // Test with a simple distance calculation
            const result = await this.calculateRoundtripMileage(
                'New York, NY',
                'Boston, MA'
            );
            
            return {
                success: result.success,
                testResult: result,
                status: 'API connection working'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: 'API connection failed'
            };
        }
    }
}

// Create global instance
window.googleMapsService = new GoogleMapsService();

// Export for use in other modules
window.GoogleMapsService = GoogleMapsService;