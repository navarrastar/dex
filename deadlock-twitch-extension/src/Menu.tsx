import React, { forwardRef } from 'react';
import { useMenu } from './MenuContext';

interface MenuProps {
  children: React.ReactNode;
}

const Menu = forwardRef<HTMLDivElement, MenuProps>(({ children }, ref) => {
  const { setMenuHovered } = useMenu();

  const handleMouseEnter = () => {
    setMenuHovered(true);
  };

  const handleMouseLeave = () => {
    setMenuHovered(false);
  };

  return (
    <div 
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 8,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: 8,
        gap: 10,
        width: 48,
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}
    >
      {children}
    </div>
  );
});

Menu.displayName = 'Menu';

export default Menu;
