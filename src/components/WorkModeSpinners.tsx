import React from 'react';

const WorkModeSpinners: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="spinner-ring spinner-ring-1"></div>

            {/* Middle Ring */}
            <div className="spinner-ring spinner-ring-2"></div>

            {/* Inner Ring */}
            <div className="spinner-ring spinner-ring-3"></div>
        </div>
    );
};

export default WorkModeSpinners;
