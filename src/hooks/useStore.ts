import { useState, useEffect, useCallback } from 'react';
import { AppData, Car, ServiceRecord, Vignette, Refueling } from '../types';
import localforage from 'localforage';

const defaultData: AppData = {
  cars: [],
  services: [],
  vignettes: [],
  refuelings: [],
};

// Initialize localforage
localforage.config({
  name: 'AutoManager',
  storeName: 'auto_manager_data'
});

export function useStore() {
  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await localforage.getItem<AppData>('app_data');
        if (storedData) {
          // Ensure all arrays exist in case of older data formats
          setData({
            cars: storedData.cars || [],
            services: storedData.services || [],
            vignettes: storedData.vignettes || [],
            refuelings: storedData.refuelings || [],
          });
        }
      } catch (error) {
        console.error("Error loading data from local storage", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (!loading) {
      localforage.setItem('app_data', data).catch(error => {
        console.error("Error saving data to local storage", error);
      });
    }
  }, [data, loading]);

  const addCar = useCallback(async (car: Car) => {
    setData(prev => ({ ...prev, cars: [...prev.cars, car] }));
  }, []);

  const updateCar = useCallback(async (car: Car) => {
    setData(prev => ({
      ...prev,
      cars: prev.cars.map(c => c.id === car.id ? car : c)
    }));
  }, []);

  const deleteCar = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      cars: prev.cars.filter(c => c.id !== id),
      services: prev.services.filter(s => s.carId !== id),
      vignettes: prev.vignettes.filter(v => v.carId !== id),
      refuelings: prev.refuelings.filter(r => r.carId !== id),
    }));
  }, []);

  const addService = useCallback(async (service: ServiceRecord) => {
    setData(prev => {
      const exists = prev.services.some(s => s.id === service.id);
      if (exists) {
        return { ...prev, services: prev.services.map(s => s.id === service.id ? service : s) };
      }
      return { ...prev, services: [...prev.services, service] };
    });
  }, []);

  const deleteService = useCallback(async (id: string) => {
    setData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }));
  }, []);

  const addVignette = useCallback(async (vignette: Vignette) => {
    setData(prev => {
      const exists = prev.vignettes.some(v => v.id === vignette.id);
      if (exists) {
        return { ...prev, vignettes: prev.vignettes.map(v => v.id === vignette.id ? vignette : v) };
      }
      return { ...prev, vignettes: [...prev.vignettes, vignette] };
    });
  }, []);

  const deleteVignette = useCallback(async (id: string) => {
    setData(prev => ({ ...prev, vignettes: prev.vignettes.filter(v => v.id !== id) }));
  }, []);

  const addRefueling = useCallback(async (refueling: Refueling) => {
    setData(prev => {
      const exists = prev.refuelings.some(r => r.id === refueling.id);
      if (exists) {
        return { ...prev, refuelings: prev.refuelings.map(r => r.id === refueling.id ? refueling : r) };
      }
      return { ...prev, refuelings: [...prev.refuelings, refueling] };
    });
  }, []);

  const deleteRefueling = useCallback(async (id: string) => {
    setData(prev => ({ ...prev, refuelings: prev.refuelings.filter(r => r.id !== id) }));
  }, []);

  const importData = useCallback(async (importedData: AppData) => {
    setData(importedData);
  }, []);

  return {
    data,
    loading,
    addCar,
    updateCar,
    deleteCar,
    addService,
    deleteService,
    addVignette,
    deleteVignette,
    addRefueling,
    deleteRefueling,
    importData,
  };
}
