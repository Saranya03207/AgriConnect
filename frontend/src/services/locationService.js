/**
 * Farmer-Friendly Geolocation and Reverse-Geocoding Service
 * Safe browser geolocation handling with OpenStreetMap Nominatim reverse-geocoding
 */

export const locationService = {
  /**
   * Requests browser geolocation and returns { latitude, longitude }.
   * Translates native GeolocationPositionError codes to clear farmer-friendly instructions.
   */
  getCurrentCoordinates() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your device/browser. Please choose your location on the map.'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let message = 'Unable to detect your location. Please select your farm or mandi on the map.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access was denied. Please allow location permissions in your browser or select your farm location on the map.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'GPS signal is currently unavailable. Please pick your location using the map or enter your district.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again or select your location on the map.';
              break;
            default:
              message = error.message || message;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  },

  /**
   * Reverse-geocodes coordinates into human-readable Indian location, district, and state.
   * Uses OpenStreetMap Nominatim API with fallback.
   */
  async reverseGeocode(latitude, longitude) {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Reverse geocoding HTTP status ${response.status}`);
      }

      const data = await response.json();
      const addr = data.address || {};

      // Derive human-readable place name (village, town, suburb, or market)
      const locationName =
        addr.village ||
        addr.suburb ||
        addr.town ||
        addr.neighbourhood ||
        addr.city ||
        addr.hamlet ||
        addr.commercial ||
        addr.industrial ||
        '';

      // District: in India, often 'state_district', 'district', or 'county'
      const district =
        addr.state_district ||
        addr.district ||
        addr.county ||
        (addr.city !== locationName ? addr.city : '') ||
        '';

      // State: e.g. 'Tamil Nadu', 'Punjab', 'Maharashtra'
      const state = addr.state || '';

      const parts = [locationName, district, state].filter(Boolean);
      const formatted = parts.join(', ');

      return {
        location: locationName || (district ? `${district} Mandi` : ''),
        district: district,
        state: state,
        formattedAddress: formatted || data.display_name || '',
      };
    } catch (err) {
      console.warn('[locationService] Reverse geocode lookup failed or timed out:', err.message);
      // Fallback without inventing fake addresses
      return {
        location: '',
        district: '',
        state: '',
        formattedAddress: '',
      };
    }
  },
};

export default locationService;
