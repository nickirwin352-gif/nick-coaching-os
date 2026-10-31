# Use Nick's Coaching OS offline on a phone

1. Connect to the internet and visit the Coaching OS site **once**. Wait for the app to finish loading and for the service worker to cache the app files.
2. On iPhone, open in Safari, tap **Share** → **Add to Home Screen**, and launch it from the new icon. On Android, open Chrome's menu and choose **Install app** or **Add to Home screen**.
3. Open the installed app online at least once. Your practice and session data must already have been loaded or saved **on that device**; an offline device cannot fetch data it has never downloaded.
4. Disconnect and reopen it. You can consult cached practice diagrams, build sessions and write review notes locally. New saves are queued for cloud sync when connectivity returns.

## Important limitations
- Offline caching covers the site's own HTML, CSS and JavaScript. Remote Firebase services and external integrations do not work without a connection; cloud sync resumes when online.
- Private/incognito browsing, clearing site data, uninstalling the web app or OS storage eviction can remove the cached app and local unsynced data. Keep an export backup, and verify cloud status after reconnecting.
- For a reliable first-time offline test, open the installed app online, wait for the page to finish loading, then use Airplane Mode and reopen it. Avoid editing the same unsynced session simultaneously on multiple devices.
- A service worker does not enable background push alerts from this release; practice review history badges appear when viewing the relevant practice in the app.
