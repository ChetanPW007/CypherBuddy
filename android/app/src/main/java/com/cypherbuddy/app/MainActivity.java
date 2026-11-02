package com.cypherbuddy.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Entry point. Besides the normal Capacitor bootstrap, it turns links shared
 * through the Android Share Sheet (ACTION_SEND, text/plain) into a regular
 * ACTION_VIEW intent carrying the URL as its data.
 *
 * Capacitor's App plugin already turns VIEW intents into the JS "appUrlOpen"
 * event (warm start) and exposes them via App.getLaunchUrl() (cold start), so
 * shared links reuse exactly the same, already-working path as tapped links.
 * No JavaScript is built or injected from native code.
 */
public class MainActivity extends BridgeActivity {

    private static final Pattern URL_PATTERN =
            Pattern.compile("https?://[^\\s<>\"']+", Pattern.CASE_INSENSITIVE);

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate so the bridge sees the rewritten intent.
        normalizeSendIntent(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        normalizeSendIntent(intent);
        super.onNewIntent(intent);
    }

    /** Rewrites a text/plain SEND intent containing a URL into a VIEW intent. */
    private void normalizeSendIntent(Intent intent) {
        if (intent == null) return;
        if (!Intent.ACTION_SEND.equals(intent.getAction())) return;

        String type = intent.getType();
        if (type == null || !type.startsWith("text/")) return;

        CharSequence shared = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if (shared == null) return;

        Matcher matcher = URL_PATTERN.matcher(shared);
        if (!matcher.find()) return;

        String url = matcher.group();
        // Trim punctuation that commonly trails a link inside a chat message.
        while (url.length() > 0 && ".,;:!?)]}".indexOf(url.charAt(url.length() - 1)) >= 0) {
            url = url.substring(0, url.length() - 1);
        }
        if (url.isEmpty()) return;

        // setData() also clears the MIME type; calling setType() afterwards would wipe the data.
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(url));
        intent.removeExtra(Intent.EXTRA_TEXT);
        setIntent(intent);
    }
}
