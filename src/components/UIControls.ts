import * as L from 'leaflet';
import { WildfireMap } from './WildfireMap';

export class UIControls {
  private wildfireMap: WildfireMap;

  constructor(wildfireMap: WildfireMap) {
    this.wildfireMap = wildfireMap;
    this.init();
  }

  private init(): void {
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          // Fit to bounds
          this.wildfireMap.fitToBounds();
          break;

        case 'escape':
          // Close any open popups
          this.wildfireMap.map.closePopup();
          break;

        case '?':
          // Show help
          this.showHelp();
          break;
      }
    });
  }

  private showHelp(): void {
    const helpContent = `
      <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
        <h3 style="margin-top: 0;">Wildfire Map Controls</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 2px 8px 2px 0;"><kbd>F</kbd></td><td>Fit map to wildfire data</td></tr>
          <tr><td style="padding: 2px 8px 2px 0;"><kbd>ESC</kbd></td><td>Close popups</td></tr>
          <tr><td style="padding: 2px 8px 2px 0;"><kbd>?</kbd></td><td>Show this help</td></tr>
        </table>
      </div>
    `;

    // Create help popup
    const helpPopup = L.popup({
      maxWidth: 400,
      closeButton: true,
      autoClose: false,
      closeOnEscapeKey: true,
    })
      .setLatLng(this.wildfireMap.map.getCenter())
      .setContent(helpContent)
      .openOn(this.wildfireMap.map);
  }
}
