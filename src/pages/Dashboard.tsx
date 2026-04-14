import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertTriangle, CheckCircle2, Clock, Bell } from 'lucide-react';
import { isBefore, addDays, parseISO, format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Button } from '../components/ui/Button';

export function Dashboard() {
  const { data } = useStore();
  const today = new Date();
  const warningDate = addDays(today, 30);
  const insuranceWarningDate = addDays(today, 70);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

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

  const expiringInsurances = data.cars.filter(c => {
    if (!c.insuranceValidTo) return false;
    const validTo = parseISO(c.insuranceValidTo);
    return isBefore(validTo, insuranceWarningDate);
  }).sort((a, b) => parseISO(a.insuranceValidTo!).getTime() - parseISO(b.insuranceValidTo!).getTime());

  const expiringStk = data.cars.filter(c => {
    if (!c.stkValidTo) return false;
    const validTo = parseISO(c.stkValidTo);
    return isBefore(validTo, warningDate);
  }).sort((a, b) => parseISO(a.stkValidTo!).getTime() - parseISO(b.stkValidTo!).getTime());

  const expiringVignettes = data.vignettes.filter(v => {
    const validTo = parseISO(v.validTo);
    return isBefore(validTo, warningDate);
  }).sort((a, b) => parseISO(a.validTo).getTime() - parseISO(b.validTo).getTime());

  const recentServices = [...data.services]
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 3);

  const getCarName = (carId: string) => {
    const car = data.cars.find(c => c.id === carId);
    return car ? `${car.make} ${car.model} (${car.plate})` : 'Neznáme auto';
  };

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
        
        {expiringInsurances.length === 0 && expiringVignettes.length === 0 && expiringStk.length === 0 ? (
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900">
            <CardContent className="p-4 flex items-center text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 mr-3" />
              <p className="text-sm font-medium">Všetko je v poriadku, nič neexpiruje v najbližších 30 dňoch.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {expiringStk.map(car => {
              const isExpired = isBefore(parseISO(car.stkValidTo!), today);
              return (
                <Card key={`stk-${car.id}`} className={isExpired ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30" : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30"}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className={`text-sm font-bold ${isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        STK / EK
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{car.make} {car.model} ({car.plate})</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${isExpired ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`}>
                        {isExpired ? 'Expirovalo' : 'Expiruje'}
                      </p>
                      <p className={`text-sm font-bold ${isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {format(parseISO(car.stkValidTo!), 'dd.MM.yyyy')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {expiringInsurances.map(car => {
              const isExpired = isBefore(parseISO(car.insuranceValidTo!), today);
              return (
                <Card key={`ins-${car.id}`} className={isExpired ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30" : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30"}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className={`text-sm font-bold ${isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        Poistenie
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{car.make} {car.model} ({car.plate})</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${isExpired ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`}>
                        {isExpired ? 'Expirovalo' : 'Expiruje'}
                      </p>
                      <p className={`text-sm font-bold ${isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {format(parseISO(car.insuranceValidTo!), 'dd.MM.yyyy')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {expiringVignettes.map(vig => {
              const isExpired = isBefore(parseISO(vig.validTo), today);
              return (
                <Card key={vig.id} className={isExpired ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30" : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30"}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className={`text-sm font-bold ${isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        Diaľničná známka ({vig.country})
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{getCarName(vig.carId)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${isExpired ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`}>
                        {isExpired ? 'Expirovalo' : 'Expiruje'}
                      </p>
                      <p className={`text-sm font-bold ${isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {format(parseISO(vig.validTo), 'dd.MM.yyyy')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
          <Clock className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
          Posledné servisy
        </h2>
        
        {recentServices.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Zatiaľ žiadne servisné záznamy.</p>
        ) : (
          <div className="space-y-3">
            {recentServices.map(service => (
              <Card key={service.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{service.description}</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">{service.cost} €</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <p>{getCarName(service.carId)}</p>
                    <p>{format(parseISO(service.date), 'dd.MM.yyyy')}</p>
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
