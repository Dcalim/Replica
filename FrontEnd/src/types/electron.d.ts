export interface ElectronAPI {
  isElectron: true;
  selectFolder: () => Promise<string | null>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
