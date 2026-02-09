import { useState, useEffect, useRef } from 'react';
import { RoadScene } from './components/RoadScene';
import { MotivationalOverlay } from './components/MotivationalOverlay';
import { SpotifyProvider, useSpotify } from './context/SpotifyContext';
import SpotifyPlayer from './components/SpotifyPlayer';

import ParticleExplosion from './components/ParticleExplosion';
import WorkModeSpinners from './components/WorkModeSpinners';

function AppContent() {
  const [intensity, setIntensity] = useState(0);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const { dominantColor } = useSpotify();

  // Refs to avoid stale closures in event listener
  const activeMessageRef = useRef<string | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync ref with state
  useEffect(() => {
    activeMessageRef.current = activeMessage;
  }, [activeMessage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      // Handle number keys 0-9 (0 maps to 10)
      if (key >= '0' && key <= '9') {
        const value = key === '0' ? 10 : parseInt(key);
        setIntensity(value);
      }
      // Handle motivational triggers
      else {
        const triggers: { [key: string]: string } = {
          ' ': 'KEEP GOING!',
          'Enter': 'PUSH IT!',
          'ArrowUp': 'FASTER!',
          'ArrowDown': 'RECOVER',
          'f': '🔥 BURN 🔥',
          'p': 'POWER',
          's': 'STRONG',
        };

        if (triggers[key]) {
          const newMessage = triggers[key];

          // Clear existing timeout
          if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
            messageTimeoutRef.current = null;
          }

          // If the same message is already active, toggle it OFF
          if (activeMessageRef.current === newMessage) {
            setActiveMessage(null);
          } else {
            // Otherwise set the new message and start timer
            setActiveMessage(newMessage);

            messageTimeoutRef.current = setTimeout(() => {
              setActiveMessage(null);
            }, 2000);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="dashboard-container relative overflow-hidden bg-gray-900 w-full h-screen">
      <RoadScene intensity={intensity} dominantColor={dominantColor} />
      <MotivationalOverlay intensity={intensity} message={activeMessage} />
      {intensity === 8 && <ParticleExplosion variant="subtle" />}
      {intensity === 9 && <ParticleExplosion variant="medium" />}
      {intensity >= 10 && <ParticleExplosion variant="normal" />}
      {intensity >= 3 && <WorkModeSpinners />}
      <SpotifyPlayer />
    </div>
  );
}

function App() {
  return (
    <SpotifyProvider>
      <AppContent />
    </SpotifyProvider>
  );
}

export default App;
