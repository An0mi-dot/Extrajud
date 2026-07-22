/**
 * Legacy compatibility stub.
 * Kept to avoid runtime/parse errors from older references.
 */
(function () {
    'use strict';

    if (window.__extrajudSettingsCompleteLoaded) return;
    window.__extrajudSettingsCompleteLoaded = true;

    window.SettingsModal = window.SettingsModal || {
        render: function (container) {
            if (!container) return;
            container.innerHTML = '<p style="margin:0;color:var(--text-secondary)">Configurações disponíveis via componente global.</p>';
        }
    };
})();
