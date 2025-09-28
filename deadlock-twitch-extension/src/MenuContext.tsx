import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface MenuContextType {
  activePanelId: string | null;
  setActivePanel: (panelId: string | null) => void;
  registerMenuItem: (panelId: string) => void;
  unregisterMenuItem: (panelId: string) => void;
  isMenuHovered: boolean;
  setMenuHovered: (hovered: boolean) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export function MenuProvider({ children }: MenuProviderProps) {
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [isMenuHovered, setIsMenuHovered] = useState(false);

  const setActivePanel = useCallback((panelId: string | null) => {
    setActivePanelId(panelId);
  }, []);

  const setMenuHovered = useCallback((hovered: boolean) => {
    setIsMenuHovered(hovered);
    // If menu is no longer hovered, clear the active panel
    if (!hovered) {
      setActivePanelId(null);
    }
  }, []);

  const registerMenuItem = useCallback((_panelId: string) => {
    // No-op for now, but keeping the interface for future use
  }, []);

  const unregisterMenuItem = useCallback((panelId: string) => {
    // If the unregistered item was active, clear the active panel
    if (activePanelId === panelId) {
      setActivePanelId(null);
    }
  }, [activePanelId]);

  return (
    <MenuContext.Provider
      value={{
        activePanelId,
        setActivePanel,
        registerMenuItem,
        unregisterMenuItem,
        isMenuHovered,
        setMenuHovered,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
