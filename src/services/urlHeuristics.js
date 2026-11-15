// Binds the on-device engine to the shared threat-intel data file (same file the Python backend loads).
import INTEL from '../../shared/url_intel.json';
import { createUrlEngine } from './urlEngine';

export const urlEngine = createUrlEngine(INTEL);
