// CypherBuddy Installation & Device Binding Utility
import { safeApiCall } from '../config/apiConfig';

const INSTALLATION_KEY = 'cypherbuddy_installation_id';

/**
 * Returns a persistent non-hardware installation identifier for the device.
 * Does not read IMEI, MAC address, serial number or restricted hardware identifiers.
 */
export function getInstallationId() {
  let installId = localStorage.getItem(INSTALLATION_KEY);
  if (!installId) {
    installId = 'CB-INST-' + (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
    localStorage.setItem(INSTALLATION_KEY, installId);
  }
  return installId;
}

/**
 * Returns public device metadata
 */
export function getDevicePublicInfo() {
  const ua = navigator.userAgent || '';
  let platform = 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) platform = 'iOS';
  else if (/Windows/.test(ua)) platform = 'Windows';
  else if (/Macintosh/.test(ua)) platform = 'macOS';

  return {
    installation_id: getInstallationId(),
    device_public_identifier: `${platform} Mobile Device (${navigator.language || 'en'})`,
    platform: platform,
    app_version: '2.4.0',
    protection_status: localStorage.getItem('cypherbuddy_setup_completed') === 'true' ? 'ACTIVE' : 'OFF'
  };
}

/**
 * Binds device installation to authenticated backend user record
 */
export async function bindDeviceToAccount() {
  try {
    const token = localStorage.getItem('cypherbuddy_token');
    if (!token) return null;

    const deviceInfo = getDevicePublicInfo();
    const response = await safeApiCall('/api/device/register', {
      method: 'POST',
      body: JSON.stringify(deviceInfo)
    });

    if (response.ok) {
      return response.data;
    }
  } catch (e) {
    console.warn('Device binding deferred:', e.message);
  }
  return null;
}
