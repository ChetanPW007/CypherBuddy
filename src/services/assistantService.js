// CypherBuddy Digital Assistant Engine
// AI Troubleshooting, Visual Instruction Cards, and YouTube Recommendations Generator

export const TROUBLESHOOTING_DATABASE = [
  {
    id: 'wifi-problem',
    keywords: ['wifi', 'wi-fi', 'internet', 'connection', 'network', 'router', 'disconnecting', 'no internet'],
    title: 'Wi-Fi Not Connecting or Disconnecting',
    category: 'Network & Connectivity',
    deviceType: 'Android / Mobile / Windows',
    summary: 'Wi-Fi issues on mobile phones are usually caused by stale IP assignments, saved credential mismatches, or temporary network stack glitches.',
    steps: [
      {
        stepNumber: 1,
        title: 'Toggle Airplane Mode',
        desc: 'Swipe down from the top of your screen to open Quick Settings, tap Airplane Mode to turn it ON, wait 10 seconds, then turn it OFF.',
        icon: 'Plane',
        visualType: 'TOGGLE_SWITCH',
        visualLabel: 'Airplane Mode'
      },
      {
        stepNumber: 2,
        title: 'Forget and Reconnect Network',
        desc: 'Go to Settings > Network & Internet > Wi-Fi. Select your home network, tap "Forget", then tap it again to re-enter your password.',
        icon: 'WifiOff',
        visualType: 'SETTINGS_LIST',
        visualLabel: 'Wi-Fi Network -> Forget'
      },
      {
        stepNumber: 3,
        title: 'Reset Mobile Network Settings',
        desc: 'Go to Settings > System > Reset Options > Reset Wi-Fi, Mobile & Bluetooth. Confirm reset.',
        icon: 'RefreshCw',
        visualType: 'WARNING_ALERT',
        visualLabel: 'Reset Network Stack',
        warning: '⚠️ Note: This will erase all saved Wi-Fi network passwords and Bluetooth pairings.'
      },
      {
        stepNumber: 4,
        title: 'Restart Router & Device',
        desc: 'Unplug your home Wi-Fi router power cord for 30 seconds. Plug it back in and restart your phone.',
        icon: 'Power',
        visualType: 'ROUTER_RESET',
        visualLabel: 'Power Cycle Router (30s)'
      }
    ],
    youtubeVideos: [
      {
        id: 'WjK0Kk8Yx-Y',
        title: 'How to Fix Wi-Fi Not Connecting on Android (Step by Step)',
        channel: 'Tech Tips & Tricks',
        views: '1.2M views',
        url: 'https://www.youtube.com/results?search_query=how+to+fix+wifi+not+connecting+android'
      },
      {
        id: 'L0xKz2pG9jY',
        title: 'Fix Windows 11 Wi-Fi Connected But No Internet Access',
        channel: 'PC Solutions Lab',
        views: '850K views',
        url: 'https://www.youtube.com/results?search_query=fix+windows+wifi+connected+no+internet'
      }
    ]
  },
  {
    id: 'bluetooth-problem',
    keywords: ['bluetooth', 'headphone', 'earbuds', 'pairing', 'connect', 'audio', 'speaker'],
    title: 'Bluetooth Devices Not Pairing or Connecting',
    category: 'Accessories & Audio',
    deviceType: 'Android / iOS / Audio',
    summary: 'Pairing failures often happen when earbuds are still connected to another nearby phone or device cache needs clearing.',
    steps: [
      {
        stepNumber: 1,
        title: 'Turn Off Bluetooth on Nearby Devices',
        desc: 'Make sure your earphones are not automatically pairing to your laptop, tablet, or another family member’s phone.',
        icon: 'BluetoothOff',
        visualType: 'TOGGLE_SWITCH',
        visualLabel: 'Disconnect Nearby Devices'
      },
      {
        stepNumber: 2,
        title: 'Put Earbuds into Pairing Mode',
        desc: 'Place earbuds inside the charging case and hold the button for 5 seconds until the LED light flashes blue or white.',
        icon: 'Headphones',
        visualType: 'PAIRING_GIF',
        visualLabel: 'Hold Case Button (5 sec)'
      },
      {
        stepNumber: 3,
        title: 'Unpair and Re-pair in Phone Settings',
        desc: 'Open Settings > Connected Devices > Bluetooth. Tap the Gear icon next to your device name and select "Unpair / Forget". Pair again.',
        icon: 'Sliders',
        visualType: 'SETTINGS_LIST',
        visualLabel: 'Unpair Saved Device'
      }
    ],
    youtubeVideos: [
      {
        id: 'Y3qK9m_N7x8',
        title: 'Fix Bluetooth Earbuds Won\'t Connect / Pair (Universal Guide)',
        channel: 'AudioTech Hacks',
        views: '2.4M views',
        url: 'https://www.youtube.com/results?search_query=fix+bluetooth+earbuds+not+pairing'
      }
    ]
  },
  {
    id: 'apk-install-failed',
    keywords: ['apk', 'app not installed', 'install', 'play protect', 'package installer', 'blocked', 'download'],
    title: 'App Installation Blocked / "App Not Installed" Error',
    category: 'System & Apps',
    deviceType: 'Android Phone',
    summary: 'Android blocks app installation when Google Play Protect flags untrusted sources, storage space is insufficient, or an incompatible package already exists.',
    steps: [
      {
        stepNumber: 1,
        title: 'Check Safety with CypherBuddy Scanner First',
        desc: 'Before bypassing any installation block, upload the APK file into CypherBuddy Scanner to check for trojans or keyloggers.',
        icon: 'ShieldCheck',
        visualType: 'SAFETY_CHECK',
        visualLabel: 'CypherBuddy APK Shield'
      },
      {
        stepNumber: 2,
        title: 'Enable "Install Unknown Apps" Permission',
        desc: 'Go to Settings > Apps > Special App Access > Install Unknown Apps. Select your Web Browser or File Manager and switch to ON.',
        icon: 'CheckSquare',
        visualType: 'SETTINGS_LIST',
        visualLabel: 'Allow From This Source'
      },
      {
        stepNumber: 3,
        title: 'Check Play Protect Settings',
        desc: 'Open Google Play Store > tap Profile Icon > Play Protect > Settings Gear > turn off "Scan apps with Play Protect" if verified safe.',
        icon: 'AlertCircle',
        visualType: 'WARNING_ALERT',
        visualLabel: 'Play Protect Controls',
        warning: '⚠️ Warning: Disabling Play Protect reduces overall phone security. Re-enable it immediately after installation.'
      }
    ],
    youtubeVideos: [
      {
        id: 'Kx0099xXyZ',
        title: 'How to Fix App Not Installed Error on Any Android Phone',
        channel: 'Mobile Master Guide',
        views: '3.1M views',
        url: 'https://www.youtube.com/results?search_query=fix+app+not+installed+error+android'
      }
    ]
  },
  {
    id: 'storage-full',
    keywords: ['storage', 'space', 'memory', 'full', 'delete', 'clean', 'cache', 'slow'],
    title: 'Phone Storage Full / System Slowdown',
    category: 'Storage & Performance',
    deviceType: 'Android / Mobile',
    summary: 'Cached media from WhatsApp, Telegram, and streaming apps can secretly consume tens of gigabytes of phone storage.',
    steps: [
      {
        stepNumber: 1,
        title: 'Clear Cached Files (Safe & Instant)',
        desc: 'Go to Settings > Storage > Apps. Select heavy apps (Chrome, YouTube, Instagram) and tap "Clear Cache". (Do NOT tap Clear Data unless you want to log back in).',
        icon: 'Trash2',
        visualType: 'SETTINGS_LIST',
        visualLabel: 'Clear Cache Button'
      },
      {
        stepNumber: 2,
        title: 'Clean WhatsApp Media Storage',
        desc: 'Open WhatsApp > Settings > Storage and Data > Manage Storage. Review files larger than 5MB and delete unwanted videos.',
        icon: 'MessageSquare',
        visualType: 'APP_STORAGE',
        visualLabel: 'WhatsApp > Manage Storage'
      },
      {
        stepNumber: 3,
        title: 'Use Google Files App Clean Tool',
        desc: 'Open Google Files app, tap the "Clean" tab at the bottom, and select "Junk Files" to safely delete temporary system logs.',
        icon: 'Folder',
        visualType: 'FILE_CLEANER',
        visualLabel: 'Delete Temporary Junk Files'
      }
    ],
    youtubeVideos: [
      {
        id: 'Z9k88xX7mP',
        title: 'Clear Other/System Storage on Android Without Deleting Data',
        channel: 'Tech Explorer',
        views: '940K views',
        url: 'https://www.youtube.com/results?search_query=clear+other+storage+android'
      }
    ]
  }
];

export function troubleshootProblem(queryText, screenshotFile = null) {
  const query = queryText.toLowerCase();
  
  // Search matcher
  let matched = TROUBLESHOOTING_DATABASE.find(item => 
    item.keywords.some(kw => query.includes(kw))
  );

  // Default fallback if no exact keyword match
  if (!matched) {
    matched = {
      id: 'general-digital-issue',
      keywords: [],
      title: 'Digital Diagnostics & Troubleshooting',
      category: 'General Digital Support',
      deviceType: 'Mobile & Desktop',
      summary: `Analyzed query: "${queryText}". Here is a step-by-step diagnostic workflow to isolate hardware, app, or network glitches safely.`,
      steps: [
        {
          stepNumber: 1,
          title: 'Perform Full Soft Restart',
          desc: 'Press and hold the Power button for 10 seconds until your phone restarts. This clears volatile RAM memory and resolves 70% of temporary app freezes.',
          icon: 'RotateCcw',
          visualType: 'REBOOT_ANIM',
          visualLabel: 'Hold Power Button 10s'
        },
        {
          stepNumber: 2,
          title: 'Verify Application Permissions & Updates',
          desc: 'Open Google Play Store / App Store, search for the affected app, and ensure you are running the latest software update.',
          icon: 'Download',
          visualType: 'SETTINGS_LIST',
          visualLabel: 'Play Store -> Update App'
        },
        {
          stepNumber: 3,
          title: 'Reset Network & System Caches',
          desc: 'Go to Settings > System > Reset Options. Reset system app preferences without losing personal photos or personal files.',
          icon: 'ShieldAlert',
          visualType: 'WARNING_ALERT',
          visualLabel: 'Reset Preferences',
          warning: '⚠️ Always back up important photos or documents before performing system resets.'
        }
      ],
      youtubeVideos: [
        {
          id: 'gen-12345',
          title: 'Universal Android & Windows Troubleshooting Guide',
          channel: 'Digital Buddy Academy',
          views: '500K views',
          url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(queryText)
        }
      ]
    };
  }

  return {
    ...matched,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hasScreenshot: Boolean(screenshotFile)
  };
}
