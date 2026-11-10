// Android QA hook. Compiled in only when VITE_QA_HOOK=true (npm run android:debug). The release bundle never imports this module.
import type { ToastAccent } from '../ui/toasts';

export interface QaDrive {
  screen(): string;
  state(): unknown;
  trayPoint(slot: number): { x: number; y: number };
  dropPoint(slot: number, row: number, col: number): { x: number; y: number };
  toast(message: string, accent: ToastAccent): void;
  /** Places a tray piece without touch input, the same as a completed drag. */
  place(slot: number, row: number, col: number): void;
  /** Loads a debug scene from a query string such as `demo=feel&scene=line`. Returns false when the scene is unknown. */
  scene(query: string): boolean;
}

export interface QaWindow { __gloopQa?: unknown }

export function installQaHook(drive: QaDrive): void {
  (window as Window & QaWindow).__gloopQa = {
    screen: () => drive.screen(),
    state: () => drive.state(),
    trayPoint: (slot: number) => drive.trayPoint(slot),
    dropPoint: (slot: number, row: number, col: number) => drive.dropPoint(slot, row, col),
    toast: (message: string, accent: ToastAccent = 'gold') => drive.toast(message, accent),
    place: (slot: number, row: number, col: number) => drive.place(slot, row, col),
    scene: (query: string) => drive.scene(query),
  };
}
