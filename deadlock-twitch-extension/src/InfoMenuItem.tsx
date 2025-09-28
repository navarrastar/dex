import React, { useState, useRef, useEffect } from 'react';
import MenuItem from './MenuItem';

interface InfoMenuItemProps {
  size?: number;
  onHover?: () => void;
  onLeave?: () => void;
}

export default function InfoMenuItem({ 
  size = 32,
  onHover,
  onLeave 
}: InfoMenuItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [matchId, setMatchId] = useState<string>('');
  const [tempMatchId, setTempMatchId] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempMatchId(matchId);
    setIsEditing(true);
  };

  const handleSave = () => {
    setMatchId(tempMatchId);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempMatchId(matchId);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Focus search input when editing starts
  useEffect(() => {
    if (isEditing && searchRef.current) {
      searchRef.current.focus();
      searchRef.current.select();
    }
  }, [isEditing]);

  const infoIcon = (
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
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 16v-4"></path>
      <path d="M12 8h.01"></path>
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
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}
    >
      <span style={{ fontSize: 14, color: '#666' }}>match id:</span>
      {isEditing ? (
        <input
          ref={searchRef}
          type="text"
          value={tempMatchId}
          onChange={(e) => setTempMatchId(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleSave}
          placeholder="Enter match id"
          style={{
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 14,
            outline: 'none',
            flex: 1,
            minWidth: 100
          }}
        />
      ) : (
        <span style={{ fontSize: 14, color: matchId ? '#333' : '#999' }}>
          {matchId || 'not tracking'}
        </span>
      )}
      {!isEditing && (
        <button
          onClick={handleEditClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: 3,
            fontSize: 12,
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <MenuItem
      icon={infoIcon}
      panelId="info"
      onHover={onHover}
      onLeave={onLeave}
      size={size}
    >
      {panel}
    </MenuItem>
  );
}
