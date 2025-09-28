import React, { useState, useEffect } from 'react';
import { useMenu } from './MenuContext';

interface MenuItemProps {
  icon: React.ReactNode;
  panelId: string;
  children?: React.ReactNode;
  size?: number;
  onHover?: () => void;
  onLeave?: () => void;
}

export default function MenuItem({ 
  icon, 
  panelId,
  children, 
  size = 32,
  onHover,
  onLeave
}: MenuItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { activePanelId, setActivePanel, registerMenuItem, unregisterMenuItem } = useMenu();

  // Register this menu item when component mounts
  useEffect(() => {
    registerMenuItem(panelId);
    return () => unregisterMenuItem(panelId);
  }, [panelId, registerMenuItem, unregisterMenuItem]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setActivePanel(panelId);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Don't clear the active panel here - let the Menu component handle it
    onLeave?.();
  };

  const isPanelActive = activePanelId === panelId;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: size,
        height: size,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        transition: 'background-color 0.2s',
        position: 'relative',
        backgroundColor: isHovered ? '#f0f0f0' : 'transparent'
      }}
    >
      {icon}
      {isPanelActive && children}
    </div>
  );
}
