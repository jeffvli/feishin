/// <reference types="vite-electron-plugin/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    DIST: string;
    DIST_ELECTRON: string;
    /** /dist/ or /public/ */
    PUBLIC: string;
    VSCODE_DEBUG?: 'true';
  }
}
