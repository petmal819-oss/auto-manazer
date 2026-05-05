import React from 'react';
import { Car } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { compressImage } from '../lib/utils';
import { X, Camera as CameraIcon } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface CarFormProps {
  initialData: Partial<Car>;
  onSubmit: (car: Partial<Car>) => void;
  onCancel: () => void;
  submitLabel: string;
}

export function CarForm({ initialData, onSubmit, onCancel, submitLabel }: CarFormProps) {
  const [car, setCar] = React.useState<Partial<Car>>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(car);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Car, multiple: boolean = false) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        if (multiple) {
          const newImages = await Promise.all(
            Array.from(e.target.files).map(file => compressImage(file as File))
          );
          const existingImages = Array.isArray(car[field]) ? car[field] as string[] : (car[field] ? [car[field] as string] : []);
          setCar({ ...car, [field]: [...existingImages, ...newImages] });
        } else {
          const base64 = await compressImage(e.target.files[0]);
          setCar({ ...car, [field]: base64 });
        }
      } catch (error) {
        console.error("Failed to compress image", error);
      }
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleNativeCamera = async (field: keyof Car) => {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1200
      });

      if (image.dataUrl) {
        const current = car[field];
        const existingImages = Array.isArray(current) ? current as string[] : (current ? [current as string] : []);
        setCar({ ...car, [field]: [...existingImages, image.dataUrl] });
      }
    } catch (error) {
      console.error('Camera error', error);
    }
  };

  const removeImage = (field: keyof Car, indexToRemove: number) => {
    const current = car[field];
    if (Array.isArray(current)) {
      setCar({ ...car, [field]: current.filter((_, idx) => idx !== indexToRemove) });
    } else {
      setCar({ ...car, [field]: undefined });
    }
  };

  const renderImagePreviews = (field: keyof Car) => {
    const current = car[field];
    if (!current) return null;
    
    const images = Array.isArray(current) ? current : [current];
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative group">
            <img src={img as string} alt="Náhľad" className="h-20 w-20 object-cover rounded border border-gray-200 dark:border-gray-700" />
            <button
              type="button"
              onClick={() => removeImage(field, idx)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="plate">EČV / ŠPZ *</Label>
        <Input id="plate" placeholder="napr. BA123XY" value={car.plate || ''} onChange={e => setCar({...car, plate: e.target.value})} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="make">Značka *</Label>
          <Input id="make" placeholder="napr. Škoda" value={car.make || ''} onChange={e => setCar({...car, make: e.target.value})} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Model *</Label>
          <Input id="model" placeholder="napr. Octavia" value={car.model || ''} onChange={e => setCar({...car, model: e.target.value})} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="year">Rok výroby *</Label>
          <Input id="year" type="number" placeholder="napr. 2018" value={car.year || ''} onChange={e => setCar({...car, year: Number(e.target.value)})} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="color">Farba</Label>
          <Input id="color" placeholder="napr. Biela" value={car.color || ''} onChange={e => setCar({...car, color: e.target.value})} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vin">VIN</Label>
        <Input id="vin" placeholder="napr. TMB..." value={car.vin || ''} onChange={e => setCar({...car, vin: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="engineCapacity">Obsah motora (cm³)</Label>
          <Input id="engineCapacity" type="number" placeholder="napr. 1968" value={car.engineCapacity || ''} onChange={e => setCar({...car, engineCapacity: Number(e.target.value)})} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="powerKw">Výkon (kW)</Label>
          <Input id="powerKw" type="number" placeholder="napr. 110" value={car.powerKw || ''} onChange={e => setCar({...car, powerKw: Number(e.target.value)})} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="stkValidTo">Platnosť STK / EK do</Label>
        <Input id="stkValidTo" type="date" value={car.stkValidTo || ''} onChange={e => setCar({...car, stkValidTo: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="insuranceCompany">Poisťovňa</Label>
          <Input id="insuranceCompany" placeholder="napr. Allianz" value={car.insuranceCompany || ''} onChange={e => setCar({...car, insuranceCompany: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="insurancePolicyNumber">Číslo poistky</Label>
          <Input id="insurancePolicyNumber" placeholder="napr. 123456789" value={car.insurancePolicyNumber || ''} onChange={e => setCar({...car, insurancePolicyNumber: e.target.value})} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="insuranceValidTo">Platnosť poistenia do</Label>
        <Input id="insuranceValidTo" type="date" value={car.insuranceValidTo || ''} onChange={e => setCar({...car, insuranceValidTo: e.target.value})} />
      </div>
      
      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Dokumenty a fotky</h4>
        <div className="space-y-1.5">
          <Label htmlFor="photo">Fotka auta</Label>
          <div className="flex gap-2">
            <Input id="photo" type="file" accept="image/*" multiple onChange={e => handleImageUpload(e, 'photo', true)} className="flex-1" />
            {Capacitor.isNativePlatform() && (
              <Button type="button" variant="outline" onClick={() => handleNativeCamera('photo')} className="px-3 shrink-0" title="Odfotiť">
                <CameraIcon className="w-5 h-5" />
              </Button>
            )}
          </div>
          {renderImagePreviews('photo')}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="registrationCard">Malý technický preukaz (aj viac fotiek)</Label>
          <div className="flex gap-2">
            <Input id="registrationCard" type="file" accept="image/*" multiple onChange={e => handleImageUpload(e, 'registrationCard', true)} className="flex-1" />
            {Capacitor.isNativePlatform() && (
              <Button type="button" variant="outline" onClick={() => handleNativeCamera('registrationCard')} className="px-3 shrink-0" title="Odfotiť">
                <CameraIcon className="w-5 h-5" />
              </Button>
            )}
          </div>
          {renderImagePreviews('registrationCard')}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stkEkCard">Kartička STK / EK (aj viac fotiek)</Label>
          <div className="flex gap-2">
            <Input id="stkEkCard" type="file" accept="image/*" multiple onChange={e => handleImageUpload(e, 'stkEkCard', true)} className="flex-1" />
            {Capacitor.isNativePlatform() && (
              <Button type="button" variant="outline" onClick={() => handleNativeCamera('stkEkCard')} className="px-3 shrink-0" title="Odfotiť">
                <CameraIcon className="w-5 h-5" />
              </Button>
            )}
          </div>
          {renderImagePreviews('stkEkCard')}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whiteCardPhoto">Biela karta (Poistenie)</Label>
          <div className="flex gap-2">
            <Input id="whiteCardPhoto" type="file" accept="image/*" multiple onChange={e => handleImageUpload(e, 'whiteCardPhoto', true)} className="flex-1" />
            {Capacitor.isNativePlatform() && (
              <Button type="button" variant="outline" onClick={() => handleNativeCamera('whiteCardPhoto')} className="px-3 shrink-0" title="Odfotiť">
                <CameraIcon className="w-5 h-5" />
              </Button>
            )}
          </div>
          {renderImagePreviews('whiteCardPhoto')}
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Zrušiť</Button>
        <Button type="submit" className="flex-1">{submitLabel}</Button>
      </div>
    </form>
  );
}
