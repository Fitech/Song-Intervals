import React from 'react';

interface MotivationalOverlayProps {
    intensity: number;
    message: string | null;
}

export const MotivationalOverlay: React.FC<MotivationalOverlayProps> = ({ intensity, message }) => {
    const isHighIntensity = intensity >= 8;

    if (!message) return null;

    return (
        <div
            key={message}
            className={`fixed inset-0 flex items-center justify-center pointer-events-none z-50 ${isHighIntensity ? 'shake-animation' : ''}`}
        >
            {/* Centered message above intensity number */}
            <div className="text-center" style={{ marginBottom: '20vh' }}>
                <h2 className={`font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] tracking-tighter uppercase whitespace-pre-wrap ${isHighIntensity ? 'text-9xl' : 'text-8xl float-animation'}`}>
                    {message}
                </h2>
            </div>
            {isHighIntensity && (
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-red-600/20 to-transparent animate-pulse pointer-events-none" />
            )}
        </div>
    );
};
