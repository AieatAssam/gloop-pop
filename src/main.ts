import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './ui/styles.css';
import { setCssVars } from './ui/cssVars';
import { bootApp } from './app/app';
import { registerServiceWorker } from './platform/sw';

setCssVars();
void bootApp();
requestAnimationFrame(registerServiceWorker);
