// CypherBuddy Central Production API Configuration
// Points to deployed Render FastAPI backend in production

export const API_BASE_URL = 
  import.meta.env?.VITE_API_BASE_URL || 
  import.meta.env?.VITE_API_URL || 
  'https://cypherbuddy-backend.onrender.com';

/**
 * Executes a network API call with robust error handling for Android environments.
 * Prevents raw "Failed to fetch" errors and returns clear, human-readable status messages.
 */
export async function safeApiCall(endpoint, options = {}) {
  const fullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach JWT Bearer token if present in localStorage or user session
  const token = localStorage.getItem('cypherbuddy_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set timeout controller for Android network calls (15 sec timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { detail: 'Unexpected server response format.' };
    }

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || getHttpStatusMessage(response.status);
      return { ok: false, status: response.status, error: errorMsg, data };
    }

    return { ok: true, status: response.status, data };

  } catch (err) {
    clearTimeout(timeoutId);

    // Differentiate root network causes on Android
    if (err.name === 'AbortError') {
      return {
        ok: false,
        error: 'The server took too long to respond. Please try again.'
      };
    }

    if (!navigator.onLine) {
      return {
        ok: false,
        error: 'No internet connection. Please check your network and try again.'
      };
    }

    return {
      ok: false,
      error: 'CypherBuddy server is temporarily starting up or unavailable. Please try again in a moment.'
    };
  }
}

function getHttpStatusMessage(status) {
  switch (status) {
    case 400: return 'Invalid input details. Please verify your information and try again.';
    case 401: return 'Invalid credentials or session expired. Please sign in again.';
    case 403: return 'Access denied. You do not have permission for this action.';
    case 404: return 'The requested resource was not found on CypherBuddy server.';
    case 429: return 'Too many attempts. Please wait a few minutes before trying again.';
    case 500: return 'Something went wrong on the server. Please try again later.';
    default: return `Server returned error (${status}). Please try again.`;
  }
}
