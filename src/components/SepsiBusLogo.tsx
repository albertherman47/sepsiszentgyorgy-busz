interface SepsiBusLogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'image';
  size?: number | string;
  alt?: string;
}

export function SepsiBusLogo({
  className = '',
  variant: _variant = 'full',
  size,
  alt = 'Sepsi Busz',
}: SepsiBusLogoProps) {
  return (
    <img
      src="/sepsibuszlogo.jpg"
      alt={alt}
      className={`object-contain select-none pointer-events-none ${className}`}
      style={
        size
          ? {
              width: typeof size === 'number' ? `${size}px` : size,
              height: typeof size === 'number' ? `${size}px` : size,
            }
          : undefined
      }
      loading="eager"
      referrerPolicy="no-referrer"
    />
  );
}
