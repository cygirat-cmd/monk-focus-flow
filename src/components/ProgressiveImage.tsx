import React, { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '',
  onLoad,
  onError
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      setError(true);
      onError?.();
    };
    
    img.src = src;
  }, [src, onLoad, onError]);

  if (error) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">Failed to load</span>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className={`bg-muted animate-pulse ${className}`}>
        {placeholder && (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          </div>
        )}
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
};

export default ProgressiveImage;