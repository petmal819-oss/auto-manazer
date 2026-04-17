import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Plus, X, Fuel, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Refueling } from '../types';
import { format, parseISO } from 'date-fns';

export function Refuelings() {
  const { data, addRefueling, deleteRefueling } = useStore();
  const location = useLocation();
  const [isAdding, setIsAdding] = useState(false);
  const [newRefueling, setNewRefueling] = useState<Partial<Refueling>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    pricePerLiter: 0,
    totalCost: 0,
    mileage: 0,
    liters: 0,
    averageConsumption: 0
  });

  useEffect(() => {
    if (location.state?.preselectCar) {
      setNewRefueling(prev => ({ ...prev, carId: location.state.preselectCar }));
      setIsAdding(true);
    }
  }, [location.state]);

  const handleLitersChange = (val: string) => {
    setNewRefueling(prev => ({ ...prev, liters: val === '' ? 0 : Number(val) }));
  };

  const handleTotalChange = (val: string) => {
    setNewRefueling(prev => ({ ...prev, totalCost: val === '' ? 0 : Number(val) }));
  };

  const handleAddRefueling = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto vypočítať pricePerLiter ak nie je nastavená
    const liters = Number(newRefueling.liters);
    const totalCost = Number(newRefueling.totalCost);
    const mileage = Number(newRefueling.mileage);
    const computedPricePerLiter = (totalCost > 0 && liters > 0) ? totalCost / liters : 0;
    
    if (newRefueling.carId && newRefueling.date && liters && totalCost && mileage) {
      
      let calculatedAvg = undefined;
      
      const carRefuelings = data.refuelings.filter(r => r.carId === newRefueling.carId);
      const sortedRefuelings = [...carRefuelings].sort((a, b) => a.mileage - b.mileage);
      if (sortedRefuelings.length > 0) {
        const firstRefueling = sortedRefuelings[0];
        const currentMileage = mileage;
        
        if (currentMileage > firstRefueling.mileage) {
          const totalDistance = currentMileage - firstRefueling.mileage;
          let totalLiters = liters;
          
          for (let i = 1; i < sortedRefuelings.length; i++) {
             if (sortedRefuelings[i].mileage < currentMileage) {
               totalLiters += sortedRefuelings[i].liters ? sortedRefuelings[i].liters! : (sortedRefuelings[i].totalCost / sortedRefuelings[i].pricePerLiter);
             }
          }
          
          calculatedAvg = (totalLiters / totalDistance) * 100;
        }
      }

      addRefueling({
        id: uuidv4(),
        carId: newRefueling.carId,
        date: newRefueling.date,
        pricePerLiter: Number(computedPricePerLiter.toFixed(3)),
        totalCost: totalCost,
        mileage: mileage,
        liters: liters,
        averageConsumption: calculatedAvg
      });
      
      setIsAdding(false);
      setNewRefueling({
        date: format(new Date(), 'yyyy-MM-dd'),
        pricePerLiter: 0,
        totalCost: 0,
        mileage: 0,
        liters: 0,
        averageConsumption: 0
      });
    }
  };

  const getCarName = (carId: string) => {
    const car = data.cars.find(c => c.id === carId);
    return car ? `${car.make} ${car.model} (${car.plate})` : 'Neznáme auto';
  };

  const sortedRefuelings = [...(data.refuelings || [])].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  return (
    <div className="p-4 space-y-6">
      <header className="pt-4 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tankovanie</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Evidencia tankovaní a spotreby</p>
        </div>
        {!isAdding && data.cars.length > 0 && (
          <Button onClick={() => setIsAdding(true)} size="icon" className="rounded-full w-10 h-10">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </header>

      {isAdding && (
        <Card className="border-blue-200 dark:border-blue-800 shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Nové tankovanie</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleAddRefueling} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="car">Vozidlo *</Label>
                <select 
                  id="car" 
                  className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 text-gray-900 dark:text-gray-100"
                  value={newRefueling.carId || ''}
                  onChange={e => setNewRefueling({...newRefueling, carId: e.target.value})}
                  required
                >
                  <option value="" disabled>Vyberte vozidlo</option>
                  {data.cars.map(car => (
                    <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date">Dátum *</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={newRefueling.date || ''} 
                  onChange={e => setNewRefueling({...newRefueling, date: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="liters">Počet litrov *</Label>
                  <Input 
                    id="liters" 
                    type="number" 
                    step="any"
                    value={newRefueling.liters === 0 ? '' : newRefueling.liters} 
                    onChange={e => handleLitersChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="total">Celková suma (€) *</Label>
                  <Input 
                    id="total" 
                    type="number" 
                    step="any"
                    value={newRefueling.totalCost === 0 ? '' : newRefueling.totalCost} 
                    onChange={e => handleTotalChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mileage">Stav km *</Label>
                <Input 
                  id="mileage" 
                  type="number" 
                  step="any"
                  value={newRefueling.mileage === 0 ? '' : newRefueling.mileage} 
                  onChange={e => setNewRefueling({...newRefueling, mileage: e.target.value === '' ? 0 : Number(e.target.value)})}
                  required
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-gray-500 dark:text-gray-400 text-xs">Cena za liter (vypočítaná)</Label>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {newRefueling.totalCost && newRefueling.liters ? (newRefueling.totalCost / newRefueling.liters).toFixed(3) : '0.000'} €/l
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500 dark:text-gray-400 text-xs">Predpokladaná spotreba</Label>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Bude vypočítaná po uložení
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full">Uložiť záznam</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {!isAdding && sortedRefuelings.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex justify-between items-center mb-4">
            <span className="font-medium text-blue-800 dark:text-blue-300">Celkové náklady na palivo:</span>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {sortedRefuelings.reduce((sum, r) => sum + r.totalCost, 0).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
        )}

        {sortedRefuelings.length === 0 && !isAdding ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Fuel className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>Zatiaľ nemáte pridané žiadne záznamy o tankovaní.</p>
            {data.cars.length > 0 && (
              <Button variant="link" onClick={() => setIsAdding(true)}>Pridať prvé tankovanie</Button>
            )}
          </div>
        ) : (
          sortedRefuelings.map(refueling => (
            <Card key={refueling.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{format(parseISO(refueling.date), 'dd.MM.yyyy')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getCarName(refueling.carId)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 dark:text-blue-400">{refueling.totalCost.toFixed(2)} €</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{refueling.pricePerLiter.toFixed(3)} €/l</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p>{refueling.mileage.toLocaleString('sk-SK')} km</p>
                  {refueling.averageConsumption && (
                    <p className="font-medium text-gray-900 dark:text-gray-100">{refueling.averageConsumption.toFixed(1)} l/100km</p>
                  )}
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 h-6 px-2" 
                    onClick={() => {
                      if(window.confirm('Naozaj vymazať tento záznam?')) deleteRefueling(refueling.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Vymazať
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
