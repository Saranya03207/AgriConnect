import { useState, useCallback } from 'react';








export function useGeolocation() {
  const [state, setState] = useState({
    lat: null,
    lng: null,
    isLoading: false,
    error: null
  });

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation is not supported by this browser.' }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isLoading: false,
          error: null
        });
      },
      (err) => {
        setState({ lat: null, lng: null, isLoading: false, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, []);

  return { ...state, getCurrentPosition };
}