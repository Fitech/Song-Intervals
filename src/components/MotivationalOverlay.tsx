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
            className={`fixed flex items-center justify-start pointer-events-none z-50 ${isHighIntensity ? '-inset-4 shake-animation' : 'inset-0 float-animation'}`}
        >
            <div className="w-1/3 text-center left-layout-offset">
                <h2 className="text-8xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] tracking-tighter uppercase whitespace-pre-wrap">
                    {message}
                </h2>
            </div>
            {isHighIntensity && (
                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-red-600/20 to-transparent animate-pulse pointer-events-none" />
            )}
        </div>
    );
};
