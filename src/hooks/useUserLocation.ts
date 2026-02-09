import { useEffect, useState } from "react";

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

export const useUserLocation = (): UserLocation => {
  const [location, setLocation] = useState<UserLocation>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, loading: false, error: "Géolocalisation non supportée" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setLocation((prev) => ({ ...prev, loading: false, error: err.message }));
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return location;
};

/** Haversine distance in km */
export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
