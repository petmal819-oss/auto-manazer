import { useEffect } from 'react';
import { useStore } from './useStore';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useNotifications() {
  const { data } = useStore();

  useEffect(() => {
    const checkPermissionsAndRun = async () => {
      let canNotify = false;
      if (Capacitor.isNativePlatform()) {
        try {
          const permStatus = await LocalNotifications.checkPermissions();
          canNotify = permStatus.display === 'granted';
        } catch (e) {
          console.error("LocalNotifications check error", e);
        }
      } else {
        canNotify = 'Notification' in window && Notification.permission === 'granted';
      }

      if (!canNotify) return;

      const today = startOfDay(new Date());
      const notifiedKeys = JSON.parse(localStorage.getItem('notified_alerts') || '{}');
      let updated = false;

      const checkAndNotify = async (id: string, title: string, dateStr: string, isInsurance: boolean = false) => {
        if (!dateStr) return;
        try {
          const targetDate = startOfDay(parseISO(dateStr));
          const daysLeft = differenceInDays(targetDate, today);

          let threshold: number | null = null;
          
          // Check exact thresholds to avoid spamming every day within the range
          // We trigger notifications when daysLeft is exactly or just crossed the threshold
          if (isInsurance && daysLeft <= 70 && daysLeft > 30) threshold = 70;
          else if (daysLeft <= 30 && daysLeft > 7) threshold = 30;
          else if (daysLeft <= 7 && daysLeft > 1) threshold = 7;
          else if (daysLeft === 1) threshold = 1;
          else if (daysLeft === 0) threshold = 0; // expires today
          else if (daysLeft < 0) threshold = -1; // expired

          if (threshold !== null) {
            const key = `${id}_${threshold}`;
            if (!notifiedKeys[key]) {
              let body = '';
              if (threshold === -1) body = `${title} už expirovala!`;
              else if (threshold === 0) body = `${title} expiruje dnes!`;
              else if (threshold === 1) body = `${title} expiruje zajtra!`;
              else body = `${title} expiruje o ${daysLeft} dní.`;

              if (Capacitor.isNativePlatform()) {
                // Generate a numeric ID from the string key
                const numericId = Math.abs(key.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: 'Auto Manažér',
                      body,
                      id: numericId,
                      schedule: { at: new Date(Date.now() + 1000) } // trigger in 1 second
                    }
                  ]
                });
              } else {
                new Notification('Auto Manažér', {
                  body,
                  icon: '/vite.svg'
                });
              }
              
              notifiedKeys[key] = true;
              updated = true;
            }
          }
        } catch (e) {
          console.error('Error parsing date for notification', e);
        }
      };

      // Check STK and Insurance
      for (const car of data.cars) {
        if (car.stkValidTo) await checkAndNotify(`stk_${car.id}`, `STK/EK pre ${car.plate}`, car.stkValidTo);
        if (car.insuranceValidTo) await checkAndNotify(`ins_${car.id}`, `Poistenie pre ${car.plate}`, car.insuranceValidTo, true);
      }

      // Check Vignettes
      for (const vig of data.vignettes) {
        const car = data.cars.find(c => c.id === vig.carId);
        await checkAndNotify(`vig_${vig.id}`, `Diaľničná známka (${vig.country}) pre ${car?.plate || 'auto'}`, vig.validTo);
      }

      // Check Recurring Services
      for (const service of data.services) {
        if (service.isRecurring) {
          const car = data.cars.find(c => c.id === service.carId);
          const carName = car ? car.plate : 'auto';
          
          // Time-based check
          if (service.nextServiceDate) {
            await checkAndNotify(`srv_time_${service.id}`, `Servis (${service.description}) pre ${carName}`, service.nextServiceDate);
          }

          // Mileage-based check
          if (service.nextServiceMileage) {
            // Find current mileage for this car
            const carRefuelings = data.refuelings?.filter(r => r.carId === service.carId) || [];
            const carServices = data.services.filter(s => s.carId === service.carId);
            
            let currentMileage = 0;
            carRefuelings.forEach(r => { if (r.mileage > currentMileage) currentMileage = r.mileage; });
            carServices.forEach(s => { if (s.mileage > currentMileage) currentMileage = s.mileage; });

            if (currentMileage > 0) {
              const kmLeft = service.nextServiceMileage - currentMileage;
              let threshold: number | null = null;

              if (kmLeft <= 1000 && kmLeft > 500) threshold = 1000;
              else if (kmLeft <= 500 && kmLeft > 100) threshold = 500;
              else if (kmLeft <= 100 && kmLeft > 0) threshold = 100;
              else if (kmLeft <= 0) threshold = 0; // expired

              if (threshold !== null) {
                const key = `srv_km_${service.id}_${threshold}`;
                if (!notifiedKeys[key]) {
                  let body = '';
                  if (threshold === 0) body = `Servis (${service.description}) pre ${carName} je potrebný ihneď (limit km prekročený)!`;
                  else body = `Servis (${service.description}) pre ${carName} bude potrebný o ${kmLeft} km.`;

                  if (Capacitor.isNativePlatform()) {
                    const numericId = Math.abs(key.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
                    await LocalNotifications.schedule({
                      notifications: [
                        {
                          title: 'Auto Manažér',
                          body,
                          id: numericId,
                          schedule: { at: new Date(Date.now() + 1000) }
                        }
                      ]
                    });
                  } else {
                    new Notification('Auto Manažér', {
                      body,
                      icon: '/vite.svg'
                    });
                  }
                  
                  notifiedKeys[key] = true;
                  updated = true;
                }
              }
            }
          }
        }
      }

      if (updated) {
        localStorage.setItem('notified_alerts', JSON.stringify(notifiedKeys));
      }
    };

    checkPermissionsAndRun();
  }, [data]);
}
