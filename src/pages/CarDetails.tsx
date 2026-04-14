import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Trash2, Wrench, ShieldCheck, Map, Info, Edit, FileText, Fuel, Plus, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CarForm } from '../components/CarForm';
import { Car, Refueling } from '../types';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { v4 as uuidv4 } from 'uuid';
import { Lightbox } from '../components/Lightbox';

export function CarDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, deleteCar, updateCar, addRefueling, deleteRefueling, deleteService } = useStore();
  const [activeTab, setActiveTab] = useState<'info' | 'services' | 'vignettes' | 'refuelings'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingRefueling, setIsAddingRefueling] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const openLightbox = (images: string | string[], index: number = 0) => {
    const imgArray = Array.isArray(images) ? images : [images];
    setLightboxImages(imgArray);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const [newRefueling, setNewRefueling] = useState<Partial<Refueling>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    pricePerLiter: 0,
    totalCost: 0,
    mileage: 0,
    liters: 0,
    averageConsumption: 0
  });

  const handleLitersChange = (val: number) => {
    setNewRefueling(prev => {
      const updates: Partial<Refueling> = { liters: val };
      if (prev.pricePerLiter && prev.pricePerLiter > 0) {
        updates.totalCost = Number((val * prev.pricePerLiter).toFixed(2));
      } else if (prev.totalCost && prev.totalCost > 0) {
        updates.pricePerLiter = Number((prev.totalCost / val).toFixed(3));
      }
      return { ...prev, ...updates };
    });
  };

  const handlePriceChange = (val: number) => {
    setNewRefueling(prev => {
      const updates: Partial<Refueling> = { pricePerLiter: val };
      if (prev.liters && prev.liters > 0) {
        updates.totalCost = Number((prev.liters * val).toFixed(2));
      } else if (prev.totalCost && prev.totalCost > 0) {
        updates.liters = Number((prev.totalCost / val).toFixed(2));
      }
      return { ...prev, ...updates };
    });
  };

  const handleTotalChange = (val: number) => {
    setNewRefueling(prev => {
      const updates: Partial<Refueling> = { totalCost: val };
      if (prev.pricePerLiter && prev.pricePerLiter > 0) {
        updates.liters = Number((val / prev.pricePerLiter).toFixed(2));
      } else if (prev.liters && prev.liters > 0) {
        updates.pricePerLiter = Number((val / prev.liters).toFixed(3));
      }
      return { ...prev, ...updates };
    });
  };

  const car = data.cars.find(c => c.id === id);

  if (!car) {
    return (
      <div className="p-4 text-center mt-10 text-gray-900 dark:text-gray-100">
        <p>Auto sa nenašlo.</p>
        <Button onClick={() => navigate('/cars')} className="mt-4">Späť na zoznam</Button>
      </div>
    );
  }

  const carServices = data.services.filter(s => s.carId === id).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  const carVignettes = data.vignettes.filter(v => v.carId === id).sort((a, b) => parseISO(b.validTo).getTime() - parseISO(a.validTo).getTime());
  const carRefuelings = data.refuelings?.filter(r => r.carId === id).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()) || [];

  const handleDelete = () => {
    if (window.confirm('Naozaj chcete vymazať toto auto a všetky jeho záznamy?')) {
      deleteCar(car.id);
      navigate('/cars');
    }
  };

  const handleUpdateCar = (updatedData: Partial<Car>) => {
    if (updatedData.plate && updatedData.make && updatedData.model && updatedData.year) {
      updateCar({
        ...car,
        plate: updatedData.plate.toUpperCase(),
        make: updatedData.make,
        model: updatedData.model,
        year: Number(updatedData.year),
        color: updatedData.color,
        vin: updatedData.vin?.toUpperCase(),
        engineCapacity: updatedData.engineCapacity ? Number(updatedData.engineCapacity) : undefined,
        powerKw: updatedData.powerKw ? Number(updatedData.powerKw) : undefined,
        photo: updatedData.photo,
        registrationCard: updatedData.registrationCard,
        stkEkCard: updatedData.stkEkCard,
        whiteCardPhoto: updatedData.whiteCardPhoto,
        stkValidTo: updatedData.stkValidTo,
        insuranceValidTo: updatedData.insuranceValidTo,
        insuranceCompany: updatedData.insuranceCompany,
        insurancePolicyNumber: updatedData.insurancePolicyNumber,
      });
      setIsEditing(false);
    }
  };

  const handleEditRefueling = (refueling: Refueling) => {
    setNewRefueling(refueling);
    setIsAddingRefueling(true);
    // Scroll to top of the tab content if needed, but it's usually fine
  };

  const handleAddRefueling = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRefueling.date && newRefueling.pricePerLiter && newRefueling.totalCost && newRefueling.mileage) {
      
      let calculatedAvg = newRefueling.averageConsumption ? Number(newRefueling.averageConsumption) : undefined;
      
      if (!calculatedAvg) {
        const sortedRefuelings = [...carRefuelings].sort((a, b) => a.mileage - b.mileage);
        if (sortedRefuelings.length > 0) {
          const firstRefueling = sortedRefuelings[0];
          const currentMileage = Number(newRefueling.mileage);
          
          if (currentMileage > firstRefueling.mileage) {
            const totalDistance = currentMileage - firstRefueling.mileage;
            let totalLiters = newRefueling.liters ? Number(newRefueling.liters) : Number(newRefueling.totalCost) / Number(newRefueling.pricePerLiter);
            
            for (let i = 1; i < sortedRefuelings.length; i++) {
               if (sortedRefuelings[i].mileage < currentMileage && sortedRefuelings[i].id !== newRefueling.id) {
                 totalLiters += sortedRefuelings[i].liters ? sortedRefuelings[i].liters! : (sortedRefuelings[i].totalCost / sortedRefuelings[i].pricePerLiter);
               }
            }
            
            calculatedAvg = (totalLiters / totalDistance) * 100;
          }
        }
      }

      addRefueling({
        id: newRefueling.id || uuidv4(),
        carId: id as string,
        date: newRefueling.date,
        pricePerLiter: Number(newRefueling.pricePerLiter),
        totalCost: Number(newRefueling.totalCost),
        mileage: Number(newRefueling.mileage),
        liters: newRefueling.liters ? Number(newRefueling.liters) : Number((Number(newRefueling.totalCost) / Number(newRefueling.pricePerLiter)).toFixed(2)),
        averageConsumption: calculatedAvg
      });
      setIsAddingRefueling(false);
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

  let overallAverageConsumption: number | null = null;
  const sortedByMileage = [...carRefuelings].sort((a, b) => a.mileage - b.mileage);
  if (sortedByMileage.length > 1) {
    const firstRefueling = sortedByMileage[0];
    const lastRefueling = sortedByMileage[sortedByMileage.length - 1];
    const totalDistance = lastRefueling.mileage - firstRefueling.mileage;
    
    if (totalDistance > 0) {
      let totalLiters = 0;
      for (let i = 1; i < sortedByMileage.length; i++) {
        totalLiters += (sortedByMileage[i].totalCost / sortedByMileage[i].pricePerLiter);
      }
      overallAverageConsumption = (totalLiters / totalDistance) * 100;
    }
  }

  if (isEditing) {
    return (
      <div className="p-4 space-y-6">
        <header className="pt-4 pb-2 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upraviť auto</h1>
        </header>
        <Card className="border-blue-200 dark:border-blue-800 shadow-md">
          <CardContent className="p-4">
            <CarForm 
              initialData={car} 
              onSubmit={handleUpdateCar} 
              onCancel={() => setIsEditing(false)} 
              submitLabel="Uložiť zmeny" 
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cars')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate px-2">{car.make} {car.model}</h1>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="text-blue-600 dark:text-blue-400" onClick={() => setIsEditing(true)}>
              <Edit className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-red-500 dark:text-red-400" onClick={handleDelete}>
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 font-mono font-bold text-gray-800 dark:text-gray-200">{car.plate}</span>
          <span>•</span>
          <span>{car.year}</span>
          {car.color && (
            <>
              <span>•</span>
              <span>{car.color}</span>
            </>
          )}
        </div>

        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto hide-scrollbar">
          <TabButton 
            active={activeTab === 'info'} 
            onClick={() => setActiveTab('info')}
            icon={<Info className="w-4 h-4 mr-1.5" />}
            label="Info"
          />
          <TabButton 
            active={activeTab === 'refuelings'} 
            onClick={() => setActiveTab('refuelings')}
            icon={<Fuel className="w-4 h-4 mr-1.5" />}
            label="Tankovanie"
          />
          <TabButton 
            active={activeTab === 'services'} 
            onClick={() => setActiveTab('services')}
            icon={<Wrench className="w-4 h-4 mr-1.5" />}
            label="Servis"
          />
          <TabButton 
            active={activeTab === 'vignettes'} 
            onClick={() => setActiveTab('vignettes')}
            icon={<Map className="w-4 h-4 mr-1.5" />}
            label="Známky"
          />
        </div>
      </header>

      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="space-y-4">
            {car.photo && (
              <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex gap-2 overflow-x-auto">
                  {(Array.isArray(car.photo) ? car.photo : [car.photo]).map((img, idx, arr) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`${car.make} ${car.model} ${idx + 1}`} 
                      className="w-full h-48 object-cover flex-shrink-0 cursor-pointer" 
                      onClick={() => openLightbox(arr, idx)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold border-b border-gray-200 dark:border-gray-800 pb-2 mb-3 text-gray-900 dark:text-gray-100">Technické údaje</h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-gray-500 dark:text-gray-400">Značka:</div>
                  <div className="font-medium text-right text-gray-900 dark:text-gray-100">{car.make}</div>
                  
                  <div className="text-gray-500 dark:text-gray-400">Model:</div>
                  <div className="font-medium text-right text-gray-900 dark:text-gray-100">{car.model}</div>
                  
                  <div className="text-gray-500 dark:text-gray-400">Rok výroby:</div>
                  <div className="font-medium text-right text-gray-900 dark:text-gray-100">{car.year}</div>
                  
                  {car.color && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">Farba:</div>
                      <div className="font-medium text-right text-gray-900 dark:text-gray-100">{car.color}</div>
                    </>
                  )}
                  
                  {car.vin && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">VIN:</div>
                      <div className="font-medium font-mono text-right break-all text-gray-900 dark:text-gray-100">{car.vin}</div>
                    </>
                  )}
                  
                  {car.engineCapacity && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">Obsah motora:</div>
                      <div className="font-medium text-right text-gray-900 dark:text-gray-100">{car.engineCapacity} cm³</div>
                    </>
                  )}
                  
                  {car.powerKw && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">Výkon:</div>
                      <div className="font-medium text-right text-gray-900 dark:text-gray-100">{car.powerKw} kW</div>
                    </>
                  )}
                  
                  {car.stkValidTo && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">Platnosť STK/EK:</div>
                      <div className="font-medium text-right text-amber-600 dark:text-amber-500">{format(parseISO(car.stkValidTo), 'dd.MM.yyyy')}</div>
                    </>
                  )}
                  
                  {car.insuranceCompany && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">Poisťovňa:</div>
                      <div className="font-medium text-right text-gray-900 dark:text-gray-100">{car.insuranceCompany}</div>
                    </>
                  )}

                  {car.insurancePolicyNumber && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">Číslo poistky:</div>
                      <div className="font-medium text-right text-gray-900 dark:text-gray-100">{car.insurancePolicyNumber}</div>
                    </>
                  )}

                  {car.insuranceValidTo && (
                    <>
                      <div className="text-gray-500 dark:text-gray-400">Platnosť poistenia:</div>
                      <div className="font-medium text-right text-amber-600 dark:text-amber-500">{format(parseISO(car.insuranceValidTo), 'dd.MM.yyyy')}</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {(car.registrationCard || car.stkEkCard || car.whiteCardPhoto) && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold border-b border-gray-200 dark:border-gray-800 pb-2 mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <FileText className="w-4 h-4 mr-2" />
                    Dokumenty
                  </h3>
                  
                  {car.registrationCard && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Malý technický preukaz</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {(Array.isArray(car.registrationCard) ? car.registrationCard : [car.registrationCard]).map((img, idx, arr) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Technický preukaz ${idx + 1}`} 
                            className="w-3/4 flex-shrink-0 rounded border border-gray-200 dark:border-gray-800 object-cover cursor-pointer" 
                            onClick={() => openLightbox(arr, idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {car.stkEkCard && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Kartička STK / EK</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {(Array.isArray(car.stkEkCard) ? car.stkEkCard : [car.stkEkCard]).map((img, idx, arr) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`STK / EK ${idx + 1}`} 
                            className="w-3/4 flex-shrink-0 rounded border border-gray-200 dark:border-gray-800 object-cover cursor-pointer" 
                            onClick={() => openLightbox(arr, idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {car.whiteCardPhoto && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Biela karta (Poistenie)</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {(Array.isArray(car.whiteCardPhoto) ? car.whiteCardPhoto : [car.whiteCardPhoto]).map((img, idx, arr) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Biela karta ${idx + 1}`} 
                            className="w-3/4 flex-shrink-0 rounded border border-gray-200 dark:border-gray-800 object-cover cursor-pointer" 
                            onClick={() => openLightbox(arr, idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Servisné záznamy</h2>
              <Button size="sm" onClick={() => navigate('/services', { state: { preselectCar: car.id } })}>Pridať</Button>
            </div>
            
            {carServices.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Celkové náklady na servis:</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {carServices.reduce((sum, s) => sum + s.cost, 0).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
            )}

            {carServices.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Zatiaľ žiadne záznamy.</p>
            ) : (
              carServices.map(service => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{service.description}</p>
                      <div className="text-right flex flex-col items-end">
                        <p className="font-bold text-blue-600 dark:text-blue-400">{service.cost} €</p>
                        <div className="flex mt-1 -mr-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-500 hover:text-blue-700"
                            onClick={() => navigate('/services', { state: { editService: service } })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-400 hover:text-red-600"
                            onClick={() => {
                              if(window.confirm('Naozaj vymazať tento záznam?')) deleteService(service.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <p>{format(parseISO(service.date), 'dd.MM.yyyy')}</p>
                      <p>{service.mileage.toLocaleString('sk-SK')} km</p>
                    </div>
                    {service.isRecurring && (service.nextServiceDate || service.nextServiceMileage) && (
                      <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs text-blue-800 dark:text-blue-300 flex justify-between items-center">
                        <span className="font-medium">Ďalší servis:</span>
                        <div className="text-right">
                          {service.nextServiceDate && <span>{format(parseISO(service.nextServiceDate), 'dd.MM.yyyy')}</span>}
                          {service.nextServiceDate && service.nextServiceMileage && <span> alebo </span>}
                          {service.nextServiceMileage && <span>{service.nextServiceMileage.toLocaleString('sk-SK')} km</span>}
                        </div>
                      </div>
                    )}
                    {service.notes && <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">{service.notes}</p>}
                    {service.photo && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                        {(Array.isArray(service.photo) ? service.photo : [service.photo]).map((img, idx, arr) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Servis ${idx + 1}`} 
                            className="w-3/4 flex-shrink-0 rounded border border-gray-200 dark:border-gray-800 object-cover max-h-48 cursor-pointer" 
                            onClick={() => openLightbox(arr, idx)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'vignettes' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Diaľničné známky</h2>
              <Button size="sm" onClick={() => navigate('/settings')}>Spravovať</Button>
            </div>
            {carVignettes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Zatiaľ žiadne známky.</p>
            ) : (
              carVignettes.map(vig => (
                <Card key={vig.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{vig.country}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{vig.type}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Platnosť od</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{format(parseISO(vig.validFrom), 'dd.MM.yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 dark:text-gray-400">Platnosť do</p>
                        <p className="font-medium text-amber-600 dark:text-amber-500">{format(parseISO(vig.validTo), 'dd.MM.yyyy')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'refuelings' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tankovanie</h2>
              {!isAddingRefueling && (
                <Button size="sm" onClick={() => setIsAddingRefueling(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Pridať
                </Button>
              )}
            </div>

            {overallAverageConsumption !== null && (
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 mb-4">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-400 font-medium">Priemerná spotreba</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">od začiatku merania</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {overallAverageConsumption.toFixed(1)} <span className="text-sm font-normal">l/100km</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAddingRefueling && (
              <Card className="mb-4 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {newRefueling.id ? 'Upraviť tankovanie' : 'Nové tankovanie'}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setIsAddingRefueling(false);
                      setNewRefueling({
                        date: format(new Date(), 'yyyy-MM-dd'),
                        pricePerLiter: 0,
                        totalCost: 0,
                        mileage: 0,
                        liters: 0,
                        averageConsumption: 0
                      });
                    }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <form onSubmit={handleAddRefueling} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ref-date">Dátum</Label>
                      <Input 
                        id="ref-date" 
                        type="date" 
                        required 
                        value={newRefueling.date} 
                        onChange={(e) => setNewRefueling({...newRefueling, date: e.target.value})} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="ref-liters">Počet litrov *</Label>
                        <Input 
                          id="ref-liters" 
                          type="number" 
                          step="0.01" 
                          required 
                          value={newRefueling.liters || ''} 
                          onChange={(e) => handleLitersChange(Number(e.target.value))} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ref-price">Cena za liter (€) *</Label>
                        <Input 
                          id="ref-price" 
                          type="number" 
                          step="0.001" 
                          required 
                          value={newRefueling.pricePerLiter || ''} 
                          onChange={(e) => handlePriceChange(Number(e.target.value))} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="ref-total">Celková suma (€) *</Label>
                        <Input 
                          id="ref-total" 
                          type="number" 
                          step="0.01" 
                          required 
                          value={newRefueling.totalCost || ''} 
                          onChange={(e) => handleTotalChange(Number(e.target.value))} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ref-mileage">Stav km *</Label>
                        <Input 
                          id="ref-mileage" 
                          type="number" 
                          required 
                          value={newRefueling.mileage || ''} 
                          onChange={(e) => setNewRefueling({...newRefueling, mileage: Number(e.target.value)})} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ref-cons">Spotreba (l/100km)</Label>
                      <Input 
                        id="ref-cons" 
                        type="number" 
                        step="0.1" 
                        value={newRefueling.averageConsumption || ''} 
                        onChange={(e) => setNewRefueling({...newRefueling, averageConsumption: Number(e.target.value)})} 
                        placeholder="Voliteľné - inak sa vypočíta automaticky"
                      />
                    </div>
                    <Button type="submit" className="w-full">Uložiť tankovanie</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {!isAddingRefueling && carRefuelings.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Zatiaľ žiadne záznamy o tankovaní.</p>
            ) : (
              carRefuelings.map(refueling => (
                <Card key={refueling.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{format(parseISO(refueling.date), 'dd.MM.yyyy')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{refueling.mileage.toLocaleString('sk-SK')} km</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">{refueling.totalCost.toFixed(2)} €</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{refueling.pricePerLiter.toFixed(3)} €/l</p>
                      </div>
                    </div>
                    {refueling.averageConsumption ? (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Priemerná spotreba:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{refueling.averageConsumption.toFixed(1)} l/100km</span>
                      </div>
                    ) : null}
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-blue-500 h-6 px-2 mr-1" onClick={() => handleEditRefueling(refueling)}>
                        <Edit className="w-3 h-3 mr-1" /> Upraviť
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 h-6 px-2" onClick={() => {
                        if (window.confirm('Naozaj vymazať toto tankovanie?')) {
                          deleteRefueling(refueling.id);
                        }
                      }}>
                        <Trash2 className="w-3 h-3 mr-1" /> Vymazať
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      
      <Lightbox 
        images={lightboxImages} 
        initialIndex={lightboxIndex} 
        isOpen={isLightboxOpen} 
        onClose={() => setIsLightboxOpen(false)} 
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center py-2 px-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
        active ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
