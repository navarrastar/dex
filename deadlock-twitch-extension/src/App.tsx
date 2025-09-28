import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import logo from '../../assets/deadlock-logo-circle.png';
import { MenuProvider } from './MenuContext';
import InfoMenuItem from './InfoMenuItem';
import PlayerMenuItem from './PlayerMenuItem';
import Menu from './Menu';

export default function App() {
  const [opened, setOpened] = useState(false);
  const toggleOpened = () => setOpened(!opened);
  const nodeRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const hasDragged = useRef(false);

  const handleStart = (_e: any, data: any) => {
    dragStartPos.current = { x: data.x, y: data.y };
    isDragging.current = false;
    hasDragged.current = false;
  };

  const handleDrag = (_e: any, data: any) => {
    const dx = Math.abs(data.x - dragStartPos.current.x);
    const dy = Math.abs(data.y - dragStartPos.current.y);
    
    if (dx > 5 || dy > 5) {
      isDragging.current = true;
      hasDragged.current = true;
    }
  };

  const handleStop = () => {
    if (!hasDragged.current && !opened) {
      toggleOpened();
    }
    // Reset dragging state after a short delay
    setTimeout(() => {
      isDragging.current = false;
      hasDragged.current = false;
    }, 10);
  };

  return (
    <MenuProvider>
      <Draggable 
        nodeRef={nodeRef}
        onStart={handleStart}
        onDrag={handleDrag}
        onStop={handleStop}
      >
        <div 
          ref={nodeRef}
          style={{
            display: 'inline-block',
            width: 'auto',
            height: 'auto'
          }}
        >
          {!opened ? (
            <ClosedApp onToggle={toggleOpened} hasDragged={hasDragged} />
          ) : (
            <OpenedApp onToggle={toggleOpened} hasDragged={hasDragged} />
          )}
        </div>
      </Draggable>
    </MenuProvider>
  );
}

function ClosedApp({ onToggle, hasDragged }: { onToggle: () => void; hasDragged: React.RefObject<boolean> }) {
  const handleClick = () => {
    if (!hasDragged.current) {
      onToggle();
    }
  };

  return (
    <img
      draggable="false"
      src={logo}
      onClick={handleClick}
      style={{ 
        width: 48, 
        height: 48, 
        cursor: 'pointer', 
        userSelect: 'none' 
      }}
    />
  );
}

function OpenedApp({ onToggle, hasDragged }: { onToggle: () => void; hasDragged: React.RefObject<boolean> }) {
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasDragged.current) {
      onToggle();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        draggable="false"
        src={logo}
        onClick={handleLogoClick}
        style={{ 
          width: 48, 
          height: 48, 
          cursor: 'pointer', 
          userSelect: 'none',
          position: 'relative',
          zIndex: 2
        }}
      />
      
      <Menu ref={menuRef}>
        <InfoMenuItem />
        <PlayerMenuItem />
      </Menu>
    </div>
  );
}