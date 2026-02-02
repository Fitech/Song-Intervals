import React, { useMemo } from 'react';

interface ParticleExplosionProps {
    variant?: 'normal' | 'subtle' | 'medium';
}

const ParticleExplosion: React.FC<ParticleExplosionProps> = ({ variant = 'normal' }) => {
    const particles = useMemo(() => {
        let count = 150;
        if (variant === 'subtle') count = 30;
        if (variant === 'medium') count = 80;

        return Array.from({ length: count }).map((_, i) => {
            // Size adjustment based on variant
            let sizeBase = 8;
            let sizeRandom = 15;

            if (variant === 'subtle') {
                sizeBase = 3;
                sizeRandom = 6;
            } else if (variant === 'medium') {
                sizeBase = 5;
                sizeRandom = 10;
            }

            const size = Math.floor(Math.random() * sizeRandom + sizeBase) + 'px';

            // Random destination across the screen
            const x = Math.floor(Math.random() * 100);
            const y = Math.floor(Math.random() * 100);

            const hue = Math.floor(Math.random() * 60);
            // Saturation/Lightness adjustment
            let saturation = '80%';
            let lightness = '55%';

            if (variant === 'subtle') {
                saturation = '60%';
                lightness = '50%';
            } else if (variant === 'medium') {
                saturation = '70%';
                lightness = '52%';
            }

            const color = `hsl(${hue}, ${saturation}, ${lightness})`;

            const duration = (1 + Math.random() * 2).toFixed(2) + 's';
            const delay = '-' + (Math.random() * 2).toFixed(2) + 's';

            return {
                id: i,
                style: {
                    width: size,
                    height: size,
                    backgroundColor: color,
                    transform: `translate(${x}vw, ${y}vh)`,
                    animationDuration: duration,
                    animationDelay: delay,
                } as React.CSSProperties
            };
        });
    }, [variant]);

    return (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle absolute rounded-full"
                    style={p.style}
                />
            ))}
        </div>
    );
};

export default ParticleExplosion;
