import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Plus, X, ShieldCheck, Map, Trash2, Bell, Moon, Lock, Shield, Key, Download, Upload, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Vignette } from '../types';
import { format, parseISO, addYears, addDays } from 'date-fns';
import { compressImage } from '../lib/utils';
import { useTheme } from '../hooks/useTheme';
import { useSecurity } from '../contexts/SecurityContext';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export function Settings() {
  const { data, addVignette, deleteVignette, importData } = useStore();
  const { theme, setTheme } = useTheme();
  const { isPinEnabled, togglePin, updatePin, hasPin, logout: lockApp } = useSecurity();
  const [activeTab, setActiveTab] = useState<'vignettes'>('vignettes');
  const [isPersistent, setIsPersistent] = useState<boolean>(false);
  
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(persistent => {
        setIsPersistent(persistent);
      });
    }
  }, []);

  const requestPersistentStorage = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const persistent = await navigator.storage.persist();
      setIsPersistent(persistent);
      if (persistent) {
        alert('Trvalé úložisko bolo úspešne povolené. Váš prehliadač nevymaže dáta automaticky pri nedostatku miesta.');
      } else {
        alert('Nepodarilo sa povoliť trvalé úložisko. Prehliadač to môže blokovať.');
      }
    } else {
      alert('Váš prehliadač nepodporuje túto funkciu.');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const dataStr = JSON.stringify(data);
    const exportFileDefaultName = `auto-manazer-zaloha-${new Date().toISOString().split('T')[0]}.json`;
    
    if (Capacitor.isNativePlatform()) {
      try {
        // Vytvoríme súbor v dočasnej pamäti zariadenia
        const result = await Filesystem.writeFile({
          path: exportFileDefaultName,
          data: dataStr,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        // Otvoríme natívne okno na zdieľanie/uloženie súboru
        await Share.share({
          title: 'Záloha Auto Manažér',
          text: 'Záloha vašich dát z aplikácie Auto Manažér',
          url: result.uri,
          dialogTitle: 'Uložiť alebo zdieľať zálohu'
        });
      } catch (e: any) {
        console.error('Export error', e);
        // Capacitor Share plugin throws an error if the user cancels the share sheet
        if (e && e.message && (e.message.includes('cancel') || e.message.includes('Abort'))) {
          // User just canceled the share dialog, no need to show an error
          return;
        }
        alert('Nepodarilo sa vytvoriť zálohu. Skontrolujte povolenia aplikácie.');
      }
    } else {
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        if (parsedData && Array.isArray(parsedData.cars)) {
          if (window.confirm('Naozaj chcete obnoviť dáta zo zálohy? Súčasné dáta budú prepísané.')) {
            importData(parsedData);
            alert('Dáta boli úspešne obnovené.');
          }
        } else {
          alert('Neplatný súbor zálohy.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Chyba pri čítaní súboru. Uistite sa, že ide o platný záložný súbor.');
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [isAddingVig, setIsAddingVig] = useState(false);
  const [newVig, setNewVig] = useState<Partial<Vignette>>({
    country: 'Slovensko',
    type: '365-dňová',
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    validTo: format(addDays(new Date(), 365), 'yyyy-MM-dd')
  });

  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setPinError('PIN musí mať 4 číslice');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PIN kódy sa nezhodujú');
      return;
    }
    updatePin(newPin);
    togglePin(true);
    setIsSettingPin(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    alert('PIN kód bol úspešne nastavený.');
  };

  const handleDisablePin = () => {
    if (window.confirm('Naozaj chcete vypnúť ochranu PIN kódom? Vaše doklady budú prístupné bez overenia.')) {
      togglePin(false);
    }
  };

  const handleAddVignette = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVig.carId && newVig.country && newVig.type && newVig.validFrom && newVig.validTo) {
      addVignette({
        id: uuidv4(),
        carId: newVig.carId,
        country: newVig.country,
        type: newVig.type as any,
        validFrom: newVig.validFrom,
        validTo: newVig.validTo,
      });
      setIsAddingVig(false);
      setNewVig({
        country: 'Slovensko',
        type: '365-dňová',
        validFrom: format(new Date(), 'yyyy-MM-dd'),
        validTo: format(addDays(new Date(), 365), 'yyyy-MM-dd')
      });
    }
  };

  const getCarName = (carId: string) => {
    const car = data.cars.find(c => c.id === carId);
    return car ? `${car.plate}` : 'Neznáme auto';
  };

  const requestNotificationPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display === 'granted') {
          alert('Notifikácie boli úspešne povolené. Budeme vás upozorňovať na blížiace sa konce platnosti (pri poistení aj 70 dní vopred).');
        } else {
          alert('Notifikácie boli zamietnuté. Pre upozornenia ich musíte povoliť v nastaveniach telefónu.');
        }
      } catch (e) {
        alert('Chyba pri nastavovaní notifikácií.');
      }
    } else {
      if (!('Notification' in window)) {
        alert('Tento prehliadač nepodporuje notifikácie.');
        return;
      }
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          alert('Notifikácie boli úspešne povolené. Budeme vás upozorňovať na blížiace sa konce platnosti (pri poistení aj 70 dní vopred).');
        } else {
          alert('Notifikácie boli zamietnuté. Pre upozornenia ich musíte povoliť v nastaveniach prehliadača.');
        }
      });
    }
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="p-4 space-y-6">
      <header className="pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nastavenia</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Správa aplikácie a dokladov</p>
      </header>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center text-gray-900 dark:text-gray-100">
            <Lock className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
            Zabezpečenie
          </h2>
        </div>
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-gray-100">Ochrana PIN kódom</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Vyžadovať PIN pri otvorení aplikácie</span>
              </div>
              {hasPin ? (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant={isPinEnabled ? "destructive" : "outline"} 
                    size="sm"
                    onClick={isPinEnabled ? handleDisablePin : () => togglePin(true)}
                  >
                    {isPinEnabled ? 'Vypnúť' : 'Zapnúť'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsSettingPin(true)}
                  >
                    Zmeniť
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={lockApp}
                  >
                    Zamknúť
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsSettingPin(true)}>
                  Nastaviť PIN
                </Button>
              )}
            </div>

            {isSettingPin && (
              <form onSubmit={handleSetPin} className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Nastaviť nový 4-miestny PIN</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSettingPin(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pin">Nový PIN</Label>
                    <Input 
                      id="new-pin" 
                      type="password" 
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="****"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pin">Potvrdiť PIN</Label>
                    <Input 
                      id="confirm-pin" 
                      type="password" 
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="****"
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>
                {pinError && <p className="text-sm text-red-500">{pinError}</p>}
                <Button type="submit" className="w-full">Uložiť PIN</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center text-gray-900 dark:text-gray-100">
            <Moon className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Vzhľad aplikácie
          </h2>
        </div>
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-select" className="text-base text-gray-900 dark:text-gray-100">Režim zobrazenia</Label>
              <select
                id="theme-select"
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
              >
                <option value="light">Svetlý</option>
                <option value="dark">Tmavý</option>
                <option value="system">Podľa systému</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center text-gray-900 dark:text-gray-100">
            <Download className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
            Záloha a Obnova dát
          </h2>
        </div>
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mr-2 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-400">
                <p className="font-semibold mb-1">Dôležité upozornenie</p>
                <p>Ak v prehliadači manuálne vymažete históriu a dáta stránok, <strong>prídete o všetky dáta</strong>. Prehliadač nám nedovoľuje tomu zabrániť. Odporúčame si dáta pravidelne zálohovať stiahnutím súboru.</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 dark:text-gray-100">Trvalé úložisko</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isNative ? 'V mobilnej aplikácii sú dáta trvalo uložené automaticky.' : 'Chráni dáta pred automatickým vymazaním systémom (pri nedostatku miesta)'}
                </span>
              </div>
              {!isNative && (
                <Button 
                  variant={isPersistent ? "outline" : "default"} 
                  size="sm"
                  onClick={requestPersistentStorage}
                  disabled={isPersistent}
                >
                  {isPersistent ? 'Povolené' : 'Povoliť'}
                </Button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={handleExport} className="flex-1" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Stiahnuť zálohu
              </Button>
              
              <div className="flex-1 relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  ref={fileInputRef}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full pointer-events-none">
                  <Upload className="w-4 h-4 mr-2" />
                  Obnoviť zo zálohy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center text-gray-900 dark:text-gray-100">
            <Bell className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Upozornenia
          </h2>
        </div>
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 mb-6">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center">
                Push Notifikácie
              </h3>
              <p className="text-xs text-blue-800 dark:text-blue-400 mt-1">
                Dostávajte upozornenia 30, 7 a 1 deň pred vypršaním STK, diaľničnej známky, poistenia (aj 70 dní vopred) alebo blížiaceho sa opakovaného servisu (napr. výmena oleja).
              </p>
            </div>
            <Button size="sm" variant="outline" className="bg-white dark:bg-gray-900 shrink-0 ml-4" onClick={requestNotificationPermission}>
              Povoliť
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4">
        <button
          onClick={() => setActiveTab('vignettes')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'vignettes' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Map className="w-4 h-4 mr-2" />
          Známky
        </button>
      </div>

      {data.cars.length === 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <CardContent className="p-4 text-amber-800 dark:text-amber-400 text-sm">
            Pre pridanie dokladov musíte najprv pridať auto v sekcii "Autá".
          </CardContent>
        </Card>
      )}

      {activeTab === 'vignettes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Moje diaľničné známky</h2>
            {!isAddingVig && data.cars.length > 0 && (
              <Button size="sm" onClick={() => setIsAddingVig(true)}>
                <Plus className="w-4 h-4 mr-1" /> Pridať
              </Button>
            )}
          </div>

          {isAddingVig && data.cars.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800 shadow-md">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Nová diaľničná známka</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingVig(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <form onSubmit={handleAddVignette} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="carIdVig">Auto *</Label>
                    <select 
                      id="carIdVig"
                      className="flex h-9 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                      value={newVig.carId || ''}
                      onChange={e => setNewVig({...newVig, carId: e.target.value})}
                      required
                    >
                      <option value="" disabled>Vyberte auto</option>
                      {data.cars.map(car => (
                        <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Krajina *</Label>
                      <Input 
                        id="country" 
                        placeholder="napr. Slovensko" 
                        value={newVig.country || ''} 
                        onChange={e => setNewVig({...newVig, country: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="typeVig">Typ *</Label>
                      <select 
                        id="typeVig"
                        className="flex h-9 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        value={newVig.type || ''}
                        onChange={e => {
                          const type = e.target.value as any;
                          let days = 365;
                          if (type === '10-dňová') days = 10;
                          if (type === '30-dňová') days = 30;
                          
                          setNewVig({
                            ...newVig, 
                            type,
                            validTo: newVig.validFrom ? format(addDays(parseISO(newVig.validFrom), days), 'yyyy-MM-dd') : newVig.validTo
                          });
                        }}
                        required
                      >
                        <option value="10-dňová">10-dňová</option>
                        <option value="30-dňová">30-dňová</option>
                        <option value="365-dňová">365-dňová</option>
                        <option value="Ročná">Ročná</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="validFromVig">Platnosť od *</Label>
                      <Input 
                        id="validFromVig" 
                        type="date"
                        value={newVig.validFrom || ''} 
                        onChange={e => {
                          const from = e.target.value;
                          let days = 365;
                          if (newVig.type === '10-dňová') days = 10;
                          if (newVig.type === '30-dňová') days = 30;
                          
                          setNewVig({
                            ...newVig, 
                            validFrom: from, 
                            validTo: format(addDays(parseISO(from), days), 'yyyy-MM-dd')
                          });
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="validToVig">Platnosť do *</Label>
                      <Input 
                        id="validToVig" 
                        type="date"
                        value={newVig.validTo || ''} 
                        onChange={e => setNewVig({...newVig, validTo: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">Uložiť známku</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {data.vignettes.length === 0 && !isAddingVig ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Zatiaľ žiadne diaľničné známky.</p>
            ) : (
              data.vignettes.map(vig => (
                <Card key={vig.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{vig.country} ({vig.type})</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{getCarName(vig.carId)}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-400 hover:text-red-600 -mr-2"
                        onClick={() => {
                          if(window.confirm('Naozaj vymazať túto známku?')) deleteVignette(vig.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
        </div>
      )}
    </div>
  );
}
