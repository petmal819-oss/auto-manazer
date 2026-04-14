import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, isOpen, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  if (!isOpen || images.length === 0) return null;

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>

      {images.length > 1 && (
        <>
          <button 
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
            onClick={handlePrevious}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          
          <button 
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
            onClick={handleNext}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}

      <div 
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <TransformWrapper
          key={currentIndex} // Reset zoom when changing image
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          centerOnInit={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-4 z-50 bg-black/50 px-4 py-2 rounded-full">
                <button onClick={() => zoomOut()} className="text-white hover:text-blue-400"><ZoomOut className="w-6 h-6" /></button>
                <button onClick={() => resetTransform()} className="text-white hover:text-blue-400"><Maximize className="w-6 h-6" /></button>
                <button onClick={() => zoomIn()} className="text-white hover:text-blue-400"><ZoomIn className="w-6 h-6" /></button>
              </div>
              <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                <img 
                  src={images[currentIndex]} 
                  alt={`Náhľad ${currentIndex + 1}`} 
                  className="max-w-full max-h-[100vh] object-contain cursor-grab active:cursor-grabbing"
                  draggable={false}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
        
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-1.5 rounded-full text-sm z-50 font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
