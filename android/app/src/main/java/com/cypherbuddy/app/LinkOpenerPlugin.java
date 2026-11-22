package com.cypherbuddy.app;

import android.app.Activity;
import android.app.role.RoleManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

/**
 * Opens a link that CypherBuddy has already verified as safe in a real browser (Chrome first),
 * and helps the user make CypherBuddy the default link handler.
 *
 * Why this exists: once CypherBuddy is the default browser, a plain ACTION_VIEW (or window.open(..., '_system'))
 * resolves straight back to CypherBuddy and loops forever. This plugin always targets a browser package that is
 * NOT CypherBuddy.
 */
@CapacitorPlugin(name = "LinkOpener")
public class LinkOpenerPlugin extends Plugin {

    private static final String CHROME = "com.android.chrome";
    private static final String YOUTUBE_PKG = "com.google.android.youtube";
    private static final String WHATSAPP_PKG = "com.whatsapp";
    private static final String WHATSAPP_BIZ_PKG = "com.whatsapp.w4b";

    private static final String[] PREFERRED = {
            CHROME,
            "com.chrome.beta",
            "com.sec.android.app.sbrowser",
            "org.mozilla.firefox",
            "com.microsoft.emmx",
            "com.brave.browser",
            "com.opera.browser",
            "com.android.browser"
    };

    private boolean isPackageInstalled(Context ctx, String packageName) {
        try {
            ctx.getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /**
     * Intelligently selects the best native application or browser to open the verified link:
     * - WhatsApp URLs (wa.me, chat.whatsapp.com, api.whatsapp.com) -> WhatsApp app
     * - YouTube URLs (youtu.be, youtube.com, m.youtube.com) -> YouTube app
     * - Standard URLs -> Chrome or other installed web browsers
     */
    private String pickTargetPackage(Context ctx, Uri uri) {
        String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";

        // 1. WhatsApp Links (chat invites, wa.me, direct message links)
        if (host.equals("wa.me") || host.equals("chat.whatsapp.com") || host.equals("api.whatsapp.com") || host.endsWith(".whatsapp.com")) {
            if (isPackageInstalled(ctx, WHATSAPP_PKG)) {
                return WHATSAPP_PKG;
            } else if (isPackageInstalled(ctx, WHATSAPP_BIZ_PKG)) {
                return WHATSAPP_BIZ_PKG;
            }
        }

        // 2. YouTube / Video Links
        if (host.equals("youtu.be") || host.equals("youtube.com") || host.endsWith(".youtube.com")) {
            if (isPackageInstalled(ctx, YOUTUBE_PKG)) {
                return YOUTUBE_PKG;
            }
        }

        // 3. Fallback to standard web browsers
        return pickBrowserPackage(ctx, uri);
    }

    /** Picks the browser package to use: Chrome if installed, else another preferred one, else any non-CypherBuddy handler. */
    private String pickBrowserPackage(Context ctx, Uri uri) {
        PackageManager pm = ctx.getPackageManager();
        Intent probe = new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE);
        List<ResolveInfo> handlers = pm.queryIntentActivities(probe, PackageManager.MATCH_ALL);
        String self = ctx.getPackageName();

        for (String preferred : PREFERRED) {
            for (ResolveInfo ri : handlers) {
                if (ri.activityInfo != null && preferred.equals(ri.activityInfo.packageName)) {
                    return preferred;
                }
            }
        }
        for (ResolveInfo ri : handlers) {
            if (ri.activityInfo != null && !self.equals(ri.activityInfo.packageName)) {
                return ri.activityInfo.packageName;
            }
        }
        return null;
    }

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        boolean background = Boolean.TRUE.equals(call.getBoolean("background", false));

        if (url == null || !(url.startsWith("http://") || url.startsWith("https://"))) {
            call.reject("Only http/https links can be opened.");
            return;
        }

        Activity activity = getActivity();
        Context ctx = getContext();
        Uri uri = Uri.parse(url);

        String pkg = pickTargetPackage(ctx, uri);
        if (pkg == null) {
            call.reject("No compatible application or browser is installed to open this link.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_VIEW, uri)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        if (!WHATSAPP_PKG.equals(pkg) && !WHATSAPP_BIZ_PKG.equals(pkg) && !YOUTUBE_PKG.equals(pkg)) {
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
        }
        intent.setPackage(pkg);

        try {
            ctx.startActivity(intent);
        } catch (ActivityNotFoundException e) {
            // Fallback: try opening with default browser if specialized native app launch fails
            try {
                String fallbackPkg = pickBrowserPackage(ctx, uri);
                if (fallbackPkg != null) {
                    Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, uri)
                            .addCategory(Intent.CATEGORY_BROWSABLE)
                            .setPackage(fallbackPkg)
                            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(fallbackIntent);
                    pkg = fallbackPkg;
                } else {
                    call.reject("Could not launch application or browser.");
                    return;
                }
            } catch (Exception ex) {
                call.reject("Could not launch target application.");
                return;
            }
        }

        if (background && activity != null) {
            // Push CypherBuddy behind the chat it was opened from, so Back in the browser returns to WhatsApp.
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try {
                    activity.moveTaskToBack(true);
                } catch (Exception ignored) {
                    // Best effort only; the link has already been opened.
                }
            }, 350);
        }

        JSObject ret = new JSObject();
        ret.put("browser", pkg);
        call.resolve(ret);
    }

    @PluginMethod
    public void isDefaultBrowser(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isDefault", isDefault());
        call.resolve(ret);
    }

    private boolean isDefault() {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            RoleManager rm = (RoleManager) ctx.getSystemService(Context.ROLE_SERVICE);
            if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_BROWSER)) {
                return rm.isRoleHeld(RoleManager.ROLE_BROWSER);
            }
        }
        Intent probe = new Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com"))
                .addCategory(Intent.CATEGORY_BROWSABLE);
        ResolveInfo ri = ctx.getPackageManager().resolveActivity(probe, PackageManager.MATCH_DEFAULT_ONLY);
        return ri != null && ri.activityInfo != null && ctx.getPackageName().equals(ri.activityInfo.packageName);
    }

    /** Android 10+: system dialog "Set CypherBuddy as your default browser app?". Older versions: Default apps settings. */
    @PluginMethod
    public void requestDefaultBrowser(PluginCall call) {
        if (isDefault()) {
            JSObject ret = new JSObject();
            ret.put("isDefault", true);
            call.resolve(ret);
            return;
        }

        Intent intent = null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            RoleManager rm = (RoleManager) getContext().getSystemService(Context.ROLE_SERVICE);
            if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_BROWSER)) {
                intent = rm.createRequestRoleIntent(RoleManager.ROLE_BROWSER);
            }
        }
        if (intent == null) {
            intent = new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
        }
        startActivityForResult(call, intent, "defaultBrowserResult");
    }

    @ActivityCallback
    private void defaultBrowserResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        ret.put("isDefault", isDefault());
        call.resolve(ret);
    }
}
