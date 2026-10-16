// Native iOS extras through Capacitor. Every call is a safe no-op in a normal browser.
(function (SA) {
  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const plugin = name => (isNative && cap.Plugins && cap.Plugins[name]) || null;
  const quiet = p => { if (p && p.catch) p.catch(() => {}); };

  // Sound effects that also get a little buzz on iPhone.
  const HAPTICS = {
    pop: 'light', jump: 'light', wrong: 'light', click: 'light', squeak: 'light', boing: 'light',
    collect: 'medium', shutter: 'medium',
    bump: 'heavy', zap: 'heavy', thud: 'medium', munch: 'light',
    cheer: 'success', card: 'success',
  };

  SA.native = {
    isNative,

    // iOS may clear web storage when the device is low on space, so saves are mirrored
    // in native Preferences and restored from there if the web copy is missing.
    async restore() {
      const prefs = plugin('Preferences');
      if (!prefs) return;
      try {
        let has = false;
        try { has = !!localStorage.getItem(SA.SAVE_KEY); } catch (e) { /* ignore */ }
        if (has) return;
        const r = await prefs.get({ key: SA.SAVE_KEY });
        if (r && r.value) localStorage.setItem(SA.SAVE_KEY, r.value);
      } catch (e) { /* play without the backup */ }
    },

    persist(json) {
      const prefs = plugin('Preferences');
      if (prefs) quiet(prefs.set({ key: SA.SAVE_KEY, value: json }));
    },

    hapticFor(sfx) {
      const kind = HAPTICS[sfx];
      const h = plugin('Haptics');
      if (!kind || !h) return;
      try {
        if (kind === 'success') quiet(h.notification({ type: 'SUCCESS' }));
        else quiet(h.impact({ style: kind.toUpperCase() }));
      } catch (e) { /* ignore */ }
    },

    // Hide the launch screen once the first frame is ready.
    ready() {
      const s = plugin('SplashScreen');
      if (s) quiet(s.hide({ fadeOutDuration: 300 }));
    },
  };
})(window.SA);
