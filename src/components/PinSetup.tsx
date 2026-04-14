import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Shield, Delete, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PinSetupProps {
  onSetupComplete: (pin: string) => void;
}

export function PinSetup({ onSetupComplete }: PinSetupProps) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const currentPin = step === 'enter' ? firstPin : confirmPin;
  const setCurrentPin = step === 'enter' ? setFirstPin : setConfirmPin;

  const handleNumberClick = (num: string) => {
    if (currentPin.length < 4) {
      setCurrentPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setCurrentPin(prev => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    if (step === 'enter' && firstPin.length === 4) {
      setTimeout(() => setStep('confirm'), 300);
    } else if (step === 'confirm' && confirmPin.length === 4) {
      if (firstPin === confirmPin) {
        onSetupComplete(firstPin);
      } else {
        setError(true);
        setConfirmPin('');
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
      }
    }
  }, [firstPin, confirmPin, step, onSetupComplete]);

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {step === 'enter' ? 'Vytvorte si PIN kód' : 'Potvrďte PIN kód'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {step === 'enter' ? 'Tento PIN bude chrániť vaše údaje' : 'Zadajte rovnaký PIN pre kontrolu'}
        </p>
      </motion.div>

      <div className="flex space-x-4 mb-12">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`w-4 h-4 rounded-full border-2 ${
              currentPin.length > i 
                ? 'bg-blue-600 border-blue-600 dark:bg-blue-400 dark:border-blue-400' 
                : 'border-gray-300 dark:border-gray-700'
            } ${error ? 'border-red-500 dark:border-red-500' : ''}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        {numbers.map((num, i) => (
          <div key={i} className="flex items-center justify-center">
            {num === 'delete' ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-16 h-16 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleDelete}
              >
                <Delete className="w-6 h-6" />
              </Button>
            ) : num === '' ? (
              <div className="w-16 h-16" />
            ) : (
              <Button 
                variant="outline" 
                className="w-16 h-16 rounded-full text-2xl font-semibold border-gray-200 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100"
                onClick={() => handleNumberClick(num)}
              >
                {num}
              </Button>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 text-red-500 font-medium"
          >
            PIN kódy sa nezhodujú. Skúste to znova.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
