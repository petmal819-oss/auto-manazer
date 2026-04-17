import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { AlertTriangle, CheckCircle2, Clock, Bell, X, Calendar } from 'lucide-react';
import { isBefore, addDays, parseISO, format, isAfter } from 'date-fns';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const { data } = useStore();
  const today = new Date();
  const warningDate = addDays(today, 30);
  const insuranceWarningDate = addDays(today, 70);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };

  const getCarName = (carId: string) => {
    const car = data.cars.find(c => c.id === carId);
    return car ? `${car.make} ${car.model} (${car.plate})` : 'Neznáme auto';
  };

  const expiringInsurances = data.cars.filter(c => {
    if (!c.insuranceValidTo) return false;
    const validTo = parseISO(c.insuranceValidTo);
    return isBefore(validTo, insuranceWarningDate);
  }).map(c => ({
    id: `ins-${c.id}`,
    type: 'Poistenie',
    carName: getCarName(c.id),
    date: c.insuranceValidTo!,
    isExpired: isBefore(parseISO(c.insuranceValidTo!), today)
  }));

  const expiringStk = data.cars.filter(c => {
    if (!c.stkValidTo) return false;
    const validTo = parseISO(c.stkValidTo);
    return isBefore(validTo, warningDate);
  }).map(c => ({
    id: `stk-${c.id}`,
    type: 'STK / EK',
    carName: getCarName(c.id),
    date: c.stkValidTo!,
    isExpired: isBefore(parseISO(c.stkValidTo!), today)
  }));

  const expiringVignettes = data.vignettes.filter(v => {
    const validTo = parseISO(v.validTo);
    return isBefore(validTo, warningDate);
  }).map(v => ({
    id: `vig-${v.id}`,
    type: `Diaľničná známka (${v.country})`,
    carName: getCarName(v.carId),
    date: v.validTo,
    isExpired: isBefore(parseISO(v.validTo), today)
  }));

  const expiringServices = data.services.filter(s => {
    if (!s.nextServiceDate) return false;
    const nextDate = parseISO(s.nextServiceDate);
    return isBefore(nextDate, warningDate);
  }).map(s => ({
    id: `srv-${s.id}`,
    type: `Servis: ${s.description}`,
    carName: getCarName(s.carId),
    date: s.nextServiceDate!,
    isExpired: isBefore(parseISO(s.nextServiceDate!), today)
  }));

  const allWarnings = [...expiringStk, ...expiringInsurances, ...expiringVignettes, ...expiringServices]
    .filter(w => !dismissedWarnings.includes(w.id))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  // Nadchádzajúce udalosti (udalosti v budúcnosti, vrátane STK, poistení, servisov atď. ktoré ešte neexpirovali)
  const upcomingEvents = [...data.cars.filter(c => c.insuranceValidTo && isAfter(parseISO(c.insuranceValidTo), today)).map(c => ({
    id: `upc-ins-${c.id}`, type: 'Poistenie', date: c.insuranceValidTo!, carName: getCarName(c.id)
  })), ...data.cars.filter(c => c.stkValidTo && isAfter(parseISO(c.stkValidTo), today)).map(c => ({
    id: `upc-stk-${c.id}`, type: 'STK / EK', date: c.stkValidTo!, carName: getCarName(c.id)
  })), ...data.vignettes.filter(v => isAfter(parseISO(v.validTo), today)).map(v => ({
    id: `upc-vig-${v.id}`, type: `Diaľničná známka (${v.country})`, date: v.validTo, carName: getCarName(v.carId)
  })), ...data.services.filter(s => s.nextServiceDate && isAfter(parseISO(s.nextServiceDate), today)).map(s => ({
    id: `upc-srv-${s.id}`, type: `Servis: ${s.description}`, date: s.nextServiceDate!, carName: getCarName(s.carId)
  }))].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()).slice(0, 5);

  return (
    <div className="p-4 space-y-6">
      <header className="pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prehľad</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Vitajte vo vašej garáži</p>
      </header>

      {notificationPermission === 'default' && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center text-blue-800 dark:text-blue-300">
              <Bell className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm">Povoľte notifikácie, aby sme vás mohli včas upozorniť na blížiace sa termíny (STK, poistenie).</p>
            </div>
            <Button size="sm" onClick={requestNotificationPermission} className="whitespace-nowrap">
              Povoliť
            </Button>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
          <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
          Upozornenia
        </h2>
        
        {allWarnings.length === 0 ? (
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900 shadow-sm">
            <CardContent className="p-4 flex items-center text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 mr-3" />
              <p className="text-sm font-medium">Všetko je v poriadku, nemáte žiadne aktívne upozornenia.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {allWarnings.map(warning => (
              <Card key={warning.id} className={`${warning.isExpired ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30" : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30"} relative overflow-hidden`}>
                <CardContent className="p-4 flex justify-between items-center pr-10">
                  <div>
                    <p className={`text-sm font-bold ${warning.isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {warning.type}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{warning.carName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${warning.isExpired ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`}>
                      {warning.isExpired ? 'Expirovalo' : 'Expiruje'}
                    </p>
                    <p className={`text-sm font-bold ${warning.isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {format(parseISO(warning.date), 'dd.MM.yyyy')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setDismissedWarnings(prev => [...prev, warning.id])}
                    className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
          <Calendar className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
          Nadchádzajúce udalosti
        </h2>
        
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Zatiaľ žiadne nadchádzajúce udalosti.</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <Card key={event.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{event.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{event.carName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 dark:text-blue-400">{format(parseISO(event.date), 'dd.MM.yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
