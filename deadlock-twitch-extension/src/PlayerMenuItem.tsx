import { useState } from 'react';
import MenuItem from './MenuItem';

interface PlayerMenuItemProps {
  size?: number;
  onHover?: () => void;
  onLeave?: () => void;
}

export default function PlayerMenuItem({ 
  size = 32,
  onHover,
  onLeave 
}: PlayerMenuItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const playerIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isPlaying ? (
        <>
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </>
      ) : (
        <polygon points="5,3 19,12 5,21"></polygon>
      )}
    </svg>
  );

  const panel = (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '100%',
        transform: 'translateY(-50%)',
        marginLeft: 10,
        zIndex: 1000,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: 180,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>
        Player Controls
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handlePlayPause}
          style={{
            background: isPlaying ? '#ff4444' : '#4CAF50',
            border: 'none',
            borderRadius: 4,
            padding: '6px 12px',
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {isPlaying ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"></polygon>
              </svg>
              Play
            </>
          )}
        </button>
        
        <span style={{ fontSize: 12, color: '#666' }}>
          {isPlaying ? 'Playing' : 'Stopped'}
        </span>
      </div>
      
      <div style={{ fontSize: 11, color: '#999' }}>
        Click to {isPlaying ? 'pause' : 'play'} the stream
      </div>
    </div>
  );

  return (
    <MenuItem
      icon={playerIcon}
      panelId="player"
      onHover={onHover}
      onLeave={onLeave}
      size={size}
    >
      {panel}
    </MenuItem>
  );
}
