/// <reference types="vite/client" />

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

export {};