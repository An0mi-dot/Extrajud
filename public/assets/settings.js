// Legacy compatibility stub.
// The active implementation is in assets/settings-component.js
(function () {
  'use strict';

  if (window.__extrajudSettingsLegacyLoaded) return;
  window.__extrajudSettingsLegacyLoaded = true;

  window.extrajudSettingsLegacy = {
    version: 'legacy-stub',
    open: function () {
      if (window.extrajudOpenSettings && typeof window.extrajudOpenSettings === 'function') {
        window.extrajudOpenSettings();
      }
    }
  };
})();
