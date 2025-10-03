import './style.css'
import appLogoImage from '/deadlock-logo-circle.png'

const app = document.getElementById('app')!;
const appLogo = document.getElementById('app-logo')!;
const appMenu = document.getElementById('app-menu')!;

appLogo.innerHTML = `
  <img src="${appLogoImage}" class="app-logo" alt="app logo"/>
`

// toggle appMenu.visibility when appLogo is clicked but not dragged
let wasDragged = false;

$(app).draggable({
  start: function() {
    wasDragged = false;
  },
  drag: function() {
    wasDragged = true;
  },
  stop: function() {
    setTimeout(() => wasDragged = false, 0);
  }
});

appLogo.addEventListener('click', () => {
  // toggle appMenu.visibility
  if (!wasDragged) {
    appMenu.style.display = appMenu.style.display === "block" ? "none" : "block";
  }
})
//


// -------------------------------
// App Menu Structure
// -------------------------------

type HeroId = number; // 1..12

interface WindowAppMenuApi {
  setHeroItems: (heroId: HeroId, items: string[]) => void;
  setMatchId: (matchId: string) => void;
}

declare global {
  interface Window {
    AppMenu: WindowAppMenuApi;
  }
}

const HERO_COUNT = 12;

function createHeroEntry(heroId: HeroId): string {
  const safeId = `hero-${heroId}`;
  return `
    <div class="menu-entry" data-hero-id="${heroId}">
      <button class="menu-icon hero-icon" aria-label="Hero ${heroId}">
        <span class="menu-icon-fallback">${heroId}</span>
      </button>
      <div class="menu-panel hero-panel panel-right" id="${safeId}-panel" role="dialog" aria-label="Hero ${heroId} Items">
        <div class="panel-header">Hero ${heroId}</div>
        <ul class="items" id="${safeId}-items">
          <li class="item placeholder">No items yet</li>
        </ul>
      </div>
    </div>
  `;
}

function createSettingsEntry(): string {
  return `
    <div class="menu-entry settings-entry">
      <button class="menu-icon settings-icon" aria-label="Settings">
        <span class="menu-icon-fallback">⚙</span>
      </button>
      <div class="menu-panel settings-panel panel-right" id="settings-panel" role="dialog" aria-label="Settings">
        <div class="panel-header">Settings</div>
        <div class="settings-row">
          <span class="label">Match ID:</span>
          <div class="match-id-container">
            <span class="value" id="match-id-value">—</span>
            <input type="text" id="match-id-input" class="match-id-input" placeholder="Enter match ID" style="display: none;" />
            <button id="edit-match-id" class="edit-button" aria-label="Edit match ID">✏️</button>
          </div>
        </div>
        <div class="settings-row">
          <button id="refresh-extension" class="refresh-button" aria-label="Refresh Extension">
            <span class="refresh-icon">🔄</span>
            Refresh Extension
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderMenu(container: HTMLElement): void {
  const entries: string[] = [];
  for (let hero = 1; hero <= HERO_COUNT; hero += 1) {
    entries.push(createHeroEntry(hero));
  }
  entries.push(createSettingsEntry());

  container.innerHTML = `
    <div class="app-menu-rail">
      ${entries.join('')}
    </div>
  `;
}

renderMenu(appMenu);

// -------------------------------
// Dynamic Panel Positioning
// -------------------------------

function calculateOptimalPanelPosition(iconElement: HTMLElement): 'left' | 'right' {
  const iconRect = iconElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  
  // Calculate space on both sides
  const spaceOnLeft = iconRect.left;
  const spaceOnRight = viewportWidth - iconRect.right;
  
  // If there's not enough space on either side, choose the side with more space
  if (spaceOnLeft < 20 && spaceOnRight < 20) {
    return spaceOnLeft > spaceOnRight ? 'right' : 'left';
  }
  
  // If there's enough space on both sides, choose the side with more space
  if (spaceOnLeft >= 20 && spaceOnRight >= 20) {
    return spaceOnLeft > spaceOnRight ? 'right' : 'left';
  }
  
  // If only one side has enough space, choose that side
  return spaceOnLeft >= 20 ? 'right' : 'left';
}

function updatePanelPosition(menuEntry: HTMLElement): void {
  const icon = menuEntry.querySelector('.menu-icon') as HTMLElement;
  const panel = menuEntry.querySelector('.menu-panel') as HTMLElement;
  
  if (!icon || !panel) return;
  
  const position = calculateOptimalPanelPosition(icon);
  
  // Remove existing position classes
  panel.classList.remove('panel-left', 'panel-right');
  
  // Add the appropriate position class
  panel.classList.add(`panel-${position}`);
}

function setupDynamicPositioning(): void {
  const menuEntries = document.querySelectorAll('#app-menu .menu-entry');
  
  menuEntries.forEach(entry => {
    const icon = entry.querySelector('.menu-icon');
    if (icon) {
      // Update position on hover
      icon.addEventListener('mouseenter', () => {
        updatePanelPosition(entry as HTMLElement);
      });
    }
  });
  
  // Update positions on window resize
  window.addEventListener('resize', () => {
    menuEntries.forEach(entry => {
      updatePanelPosition(entry as HTMLElement);
    });
  });
}

// Initialize dynamic positioning after menu is rendered
setTimeout(setupDynamicPositioning, 0);

// -------------------------------
// Settings Panel Functionality
// -------------------------------

function setupSettingsPanel(): void {
  const editButton = document.getElementById('edit-match-id');
  const matchIdValue = document.getElementById('match-id-value');
  const matchIdInput = document.getElementById('match-id-input') as HTMLInputElement;
  const refreshButton = document.getElementById('refresh-extension');

  if (!editButton || !matchIdValue || !matchIdInput) return;

  // Toggle between display and edit modes
  editButton.addEventListener('click', () => {
    const isEditing = matchIdInput.style.display !== 'none';
    
    if (isEditing) {
      // Save the input value and switch to display mode
      const newValue = matchIdInput.value.trim();
      if (newValue) {
        matchIdValue.textContent = newValue;
        // You could emit an event or call a callback here to notify other parts of the app
        if (window.AppMenu && window.AppMenu.setMatchId) {
          window.AppMenu.setMatchId(newValue);
        }
      }
      matchIdInput.style.display = 'none';
      matchIdValue.style.display = 'inline';
      editButton.textContent = '✏️';
    } else {
      // Switch to edit mode
      matchIdInput.value = matchIdValue.textContent === '—' ? '' : matchIdValue.textContent;
      matchIdValue.style.display = 'none';
      matchIdInput.style.display = 'inline';
      editButton.textContent = '💾';
      matchIdInput.focus();
      matchIdInput.select();
    }
  });

  // Handle Enter key to save
  matchIdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      editButton.click();
    } else if (e.key === 'Escape') {
      // Cancel editing
      matchIdInput.style.display = 'none';
      matchIdValue.style.display = 'inline';
      editButton.textContent = '✏️';
    }
  });

  // Handle clicking outside to save (optional)
  matchIdInput.addEventListener('blur', () => {
    // Small delay to allow for clicking the save button
    setTimeout(() => {
      if (matchIdInput.style.display !== 'none') {
        editButton.click();
      }
    }, 100);
  });

  // Handle refresh button click
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      const button = refreshButton as HTMLButtonElement;
      const originalContent = refreshButton.innerHTML;
      
      // Add visual feedback
      refreshButton.innerHTML = '<span class="refresh-icon">⏳</span> Loading...';
      button.disabled = true;
      
      try {
        // Get the current match ID
        const matchId = matchIdValue.textContent === '—' ? '' : matchIdValue.textContent;
        
        if (!matchId) {
          throw new Error('No match ID specified');
        }
        
        // Send GET request to backend
        const response = await fetch(`/spectate/${matchId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Success feedback
        refreshButton.innerHTML = '<span class="refresh-icon">✅</span> Success!';
        setTimeout(() => {
          refreshButton.innerHTML = originalContent;
          button.disabled = false;
        }, 2000);
        
      } catch (error) {
        console.error('Error fetching spectate data:', error);
        
        // Error feedback
        refreshButton.innerHTML = '<span class="refresh-icon">❌</span> Error';
        setTimeout(() => {
          refreshButton.innerHTML = originalContent;
          button.disabled = false;
        }, 2000);
      }
    });
  }
}

// Initialize settings panel after menu is rendered
setTimeout(setupSettingsPanel, 0);

// -------------------------------
// Public API for data updates
// -------------------------------

function setHeroItems(heroId: HeroId, items: string[]): void {
  if (heroId < 1 || heroId > HERO_COUNT) return;
  const list = document.getElementById(`hero-${heroId}-items`);
  if (!list) return;
  if (!items || items.length === 0) {
    list.innerHTML = `<li class="item placeholder">No items yet</li>`;
    return;
  }
  list.innerHTML = items.map((item) => `<li class="item">${item}</li>`).join('');
}

function setMatchId(matchId: string): void {
  const valueEl = document.getElementById('match-id-value');
  const inputEl = document.getElementById('match-id-input') as HTMLInputElement;
  
  if (valueEl) {
    valueEl.textContent = matchId ?? '—';
  }
  
  if (inputEl) {
    inputEl.value = matchId ?? '';
  }
}

window.AppMenu = { setHeroItems, setMatchId };

