import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Plus, X, Wrench, Trash2, Edit2, Camera as CameraIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ServiceRecord } from '../types';
import { format, parseISO, addMonths } from 'date-fns';
import { compressImage } from '../lib/utils';
import { Lightbox } from '../components/Lightbox';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export function Services() {
  const { data, addService, deleteService } = useStore();
  const location = useLocation();
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState<Partial<ServiceRecord>>({
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (images: string | string[], index: number = 0) => {
    const imgArray = Array.isArray(images) ? images : [images];
    setLightboxImages(imgArray);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  useEffect(() => {
    if (location.state?.editService) {
      setNewService(location.state.editService);
      setIsAdding(true);
    } else if (location.state?.preselectCar) {
      setNewService(prev => ({ ...prev, carId: location.state.preselectCar }));
      setIsAdding(true);
    }
  }, [location.state]);

  const handleEditService = (service: ServiceRecord) => {
    setNewService(service);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (newService.carId && newService.date && newService.description && newService.cost !== undefined && newService.mileage !== undefined) {
      
      let nextServiceDate: string | undefined = undefined;
      let nextServiceMileage: number | undefined = undefined;

      if (newService.isRecurring) {
        if (newService.recurringMonthsInterval) {
          nextServiceDate = format(addMonths(parseISO(newService.date), newService.recurringMonthsInterval), 'yyyy-MM-dd');
        }
        if (newService.recurringMileageInterval) {
          nextServiceMileage = Number(newService.mileage) + Number(newService.recurringMileageInterval);
        }
      }

      addService({
        id: newService.id || uuidv4(),
        carId: newService.carId,
        date: newService.date,
        description: newService.description,
        cost: Number(newService.cost),
        mileage: Number(newService.mileage),
        notes: newService.notes,
        photo: newService.photo,
        isRecurring: newService.isRecurring,
        recurringMonthsInterval: newService.recurringMonthsInterval,
        recurringMileageInterval: newService.recurringMileageInterval,
        nextServiceDate,
        nextServiceMileage,
      });
      setIsAdding(false);
      setNewService({ date: format(new Date(), 'yyyy-MM-dd') });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const newImages = await Promise.all(
          Array.from(e.target.files).map(file => compressImage(file as File))
        );
        const existingImages = Array.isArray(newService.photo) ? newService.photo : (newService.photo ? [newService.photo] : []);
        setNewService({ ...newService, photo: [...existingImages, ...newImages] });
      } catch (error) {
        console.error("Failed to compress image", error);
      }
    }
    e.target.value = '';
  };

  const handleNativeCamera = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1200
      });

      if (image.dataUrl) {
        const current = newService.photo;
        const existingImages = Array.isArray(current) ? current : (current ? [current] : []);
        setNewService({ ...newService, photo: [...existingImages, image.dataUrl] });
      }
    } catch (error) {
      console.error('Camera error', error);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const current = newService.photo;
    if (Array.isArray(current)) {
      setNewService({ ...newService, photo: current.filter((_, idx) => idx !== indexToRemove) });
    } else {
      setNewService({ ...newService, photo: undefined });
    }
  };

  const getCarName = (carId: string) => {
    const car = data.cars.find(c => c.id === carId);
    return car ? `${car.make} ${car.model} (${car.plate})` : 'Neznáme auto';
  };

  const sortedServices = [...data.services].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  return (
    <div className="p-4 space-y-6">
      <header className="pt-4 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Servisné práce</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Evidencia opráv a údržby</p>
        </div>
        {!isAdding && data.cars.length > 0 && (
          <Button onClick={() => setIsAdding(true)} size="icon" className="rounded-full w-10 h-10">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </header>

      {data.cars.length === 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50">
          <CardContent className="p-4 text-amber-800 dark:text-amber-400 text-sm">
            Pre pridanie servisného záznamu musíte najprv pridať auto v sekcii "Autá".
          </CardContent>
        </Card>
      )}

      {isAdding && data.cars.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {newService.id ? 'Upraviť servisný záznam' : 'Nový servisný záznam'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => {
                setIsAdding(false);
                setNewService({ date: format(new Date(), 'yyyy-MM-dd') });
              }}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleAddService} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="carId">Auto *</Label>
                <select 
                  id="carId"
                  className="flex h-9 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 text-gray-900 dark:text-gray-100"
                  value={newService.carId || ''}
                  onChange={e => setNewService({...newService, carId: e.target.value})}
                  required
                >
                  <option value="" disabled>Vyberte auto</option>
                  {data.cars.map(car => (
                    <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="description">Popis práce *</Label>
                <Input 
                  id="description" 
                  placeholder="napr. Výmena oleja a filtrov" 
                  value={newService.description || ''} 
                  onChange={e => setNewService({...newService, description: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="date">Dátum *</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={newService.date || ''} 
                    onChange={e => setNewService({...newService, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cost">Cena (€) *</Label>
                  <Input 
                    id="cost" 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={newService.cost || ''} 
                    onChange={e => setNewService({...newService, cost: Number(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mileage">Stav tachometra (km) *</Label>
                <Input 
                  id="mileage" 
                  type="number" 
                  placeholder="napr. 150000" 
                  value={newService.mileage || ''} 
                  onChange={e => setNewService({...newService, mileage: Number(e.target.value)})}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Poznámka</Label>
                <textarea 
                  id="notes" 
                  className="flex min-h-[80px] w-full rounded-md border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 text-gray-900 dark:text-gray-100"
                  placeholder="Voliteľná poznámka k servisu" 
                  value={newService.notes || ''} 
                  onChange={e => setNewService({...newService, notes: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="photo">Fotografie (napr. faktúra, diel)</Label>
                <div className="flex gap-2">
                  <Input id="photo" type="file" accept="image/*" multiple onChange={handleImageUpload} className="flex-1" />
                  {Capacitor.isNativePlatform() && (
                    <Button type="button" variant="outline" onClick={handleNativeCamera} className="px-3 shrink-0" title="Odfotiť">
                      <CameraIcon className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                {newService.photo && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(Array.isArray(newService.photo) ? newService.photo : [newService.photo]).map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt="Náhľad" className="h-20 w-20 object-cover rounded border border-gray-200 dark:border-gray-700" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isRecurring" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={newService.isRecurring || false}
                    onChange={e => setNewService({...newService, isRecurring: e.target.checked})}
                  />
                  <Label htmlFor="isRecurring" className="font-medium">Opakovaný servis (napr. výmena oleja)</Label>
                </div>

                {newService.isRecurring && (
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="space-y-1.5">
                      <Label htmlFor="recurringMonthsInterval">Interval (mesiace)</Label>
                      <Input 
                        id="recurringMonthsInterval" 
                        type="number" 
                        placeholder="napr. 12" 
                        value={newService.recurringMonthsInterval || ''} 
                        onChange={e => setNewService({...newService, recurringMonthsInterval: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="recurringMileageInterval">Interval (km)</Label>
                      <Input 
                        id="recurringMileageInterval" 
                        type="number" 
                        placeholder="napr. 10000" 
                        value={newService.recurringMileageInterval || ''} 
                        onChange={e => setNewService({...newService, recurringMileageInterval: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">Uložiť záznam</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {!isAdding && sortedServices.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex justify-between items-center mb-4">
            <span className="font-medium text-blue-800 dark:text-blue-300">Celkové náklady na všetky servisy:</span>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {sortedServices.reduce((sum, s) => sum + s.cost, 0).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
        )}

        {sortedServices.length === 0 && !isAdding ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>Zatiaľ nemáte pridané žiadne servisné záznamy.</p>
            {data.cars.length > 0 && (
              <Button variant="link" onClick={() => setIsAdding(true)}>Pridať prvý záznam</Button>
            )}
          </div>
        ) : (
          sortedServices.map(service => (
            <Card key={service.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{service.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getCarName(service.carId)}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-bold text-blue-600 dark:text-blue-400">{service.cost} €</p>
                    <div className="flex mt-1 -mr-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit2 className="w-4 h-4" />
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
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
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
      
      <Lightbox 
        images={lightboxImages} 
        initialIndex={lightboxIndex} 
        isOpen={isLightboxOpen} 
        onClose={() => setIsLightboxOpen(false)} 
      />
    </div>
  );
}
