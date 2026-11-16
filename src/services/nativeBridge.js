// Thin wrapper over Capacitor + our custom Android plugin (LinkOpenerPlugin.java).
// Every function degrades gracefully in a normal browser (npm run dev), so the UI can be developed on the web.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

const LinkOpener = registerPlugin('LinkOpener');

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Opens a (already verified safe) link in Chrome - or another installed browser, never in CypherBuddy itself -
 * and moves CypherBuddy to the background so Back from the browser returns the user to WhatsApp.
 * Never navigates CypherBuddy's own WebView to the link. Resolves true if a browser was launched.
 */
export async function openLinkExternally(url) {
  if (isNative()) {
    try {
      await LinkOpener.open({ url, background: true });
      return true;
    } catch (e) {
      console.warn('Native opener failed, trying Chrome Custom Tab:', e);
    }
    try {
      await Browser.open({ url });
      return true;
    } catch (e) {
      console.warn('Custom Tab failed:', e);
      return false;
    }
  }
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  return !!w;
}

/** Sends CypherBuddy to the background so the chat the user came from is visible again. */
export async function minimizeApp() {
  if (!isNative()) return;
  try {
    await CapApp.minimizeApp();
  } catch (e) {
    console.warn('minimizeApp failed:', e);
  }
}

/** Opens an official website (e.g. the cybercrime portal) in a Custom Tab / new tab. */
export async function openWebsite(url) {
  if (isNative()) {
    try {
      await Browser.open({ url });
      return true;
    } catch {
      return false;
    }
  }
  return !!window.open(url, '_blank', 'noopener,noreferrer');
}

/** Android 10+: shows the system "make CypherBuddy your default browser?" dialog (falls back to Settings). */
export async function requestDefaultBrowser() {
  if (!isNative()) return { supported: false, isDefault: false };
  try {
    const res = await LinkOpener.requestDefaultBrowser();
    return { supported: true, ...res };
  } catch (e) {
    console.warn('requestDefaultBrowser failed:', e);
    return { supported: true, isDefault: false, error: String(e) };
  }
}

export async function isDefaultBrowser() {
  if (!isNative()) return false;
  try {
    const res = await LinkOpener.isDefaultBrowser();
    return !!res.isDefault;
  } catch {
    return false;
  }
}

export { CapApp };
