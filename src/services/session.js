// Persistent login. The session lives in localStorage, so it survives closing the app, a phone restart and
// a link-launch of a closed app. It is cleared only by the explicit Logout button, or when the server says the
// session is really gone (refresh token rejected). A slow or offline server never logs the user out.

const TOKEN_KEY = 'cypherbuddy_token';
const REFRESH_KEY = 'cypherbuddy_refresh';
const USER_KEY = 'cypherbuddy_user';

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null || value === undefined || value === '') localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage blocked: session just won't persist */
  }
}

export const getAccessToken = () => read(TOKEN_KEY);
export const getRefreshToken = () => read(REFRESH_KEY);

export function getStoredUser() {
  const token = read(TOKEN_KEY);
  if (!token) return null;
  try {
    const user = JSON.parse(read(USER_KEY) || 'null');
    if (user && typeof user === 'object') return user;
  } catch {
    /* fall through */
  }
  return { role: 'USER' }; // sessions saved by an older app version
}

export function saveSession({ accessToken, refreshToken, user }) {
  write(TOKEN_KEY, accessToken);
  if (refreshToken) write(REFRESH_KEY, refreshToken);
  if (user) write(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  write(TOKEN_KEY, null);
  write(REFRESH_KEY, null);
  write(USER_KEY, null);
}
