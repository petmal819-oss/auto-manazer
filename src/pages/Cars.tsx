import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Car as CarIcon, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Car } from '../types';
import { CarForm } from '../components/CarForm';

export function Cars() {
  const { data, addCar } = useStore();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCar = (newCar: Partial<Car>) => {
    if (newCar.plate && newCar.make && newCar.model && newCar.year) {
      addCar({
        id: uuidv4(),
        plate: newCar.plate.toUpperCase(),
        make: newCar.make,
        model: newCar.model,
        year: Number(newCar.year),
        color: newCar.color,
        vin: newCar.vin?.toUpperCase(),
        engineCapacity: newCar.engineCapacity ? Number(newCar.engineCapacity) : undefined,
        powerKw: newCar.powerKw ? Number(newCar.powerKw) : undefined,
        photo: newCar.photo,
        registrationCard: newCar.registrationCard,
        stkEkCard: newCar.stkEkCard,
        stkValidTo: newCar.stkValidTo,
        insuranceCompany: newCar.insuranceCompany,
        insurancePolicyNumber: newCar.insurancePolicyNumber,
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <header className="pt-4 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Moje Autá</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Spravujte svoj vozový park</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="icon" className="rounded-full w-10 h-10">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </header>

      {isAdding && (
        <Card className="border-blue-200 dark:border-blue-800 shadow-md">
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Pridať nové auto</h3>
            <CarForm 
              initialData={{}} 
              onSubmit={handleAddCar} 
              onCancel={() => setIsAdding(false)} 
              submitLabel="Uložiť auto" 
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {data.cars.length === 0 && !isAdding ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <CarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>Zatiaľ nemáte pridané žiadne autá.</p>
            <Button variant="link" onClick={() => setIsAdding(true)}>Pridať prvé auto</Button>
          </div>
        ) : (
          data.cars.map(car => (
            <Card 
              key={car.id} 
              className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer overflow-hidden"
              onClick={() => navigate(`/cars/${car.id}`)}
            >
              <div className="flex items-stretch h-24">
                {car.photo ? (
                  <div className="w-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                    <img src={car.photo} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 flex-shrink-0 bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-300 dark:text-blue-700">
                    <CarIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{car.make} {car.model}</h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2 mt-1">
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono text-gray-800 dark:text-gray-200">{car.plate}</span>
                      <span>•</span>
                      <span>{car.year}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
