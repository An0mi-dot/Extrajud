const themeConfig = {
    // Sistema de trocas de tema
    // Configurações e estado
    
    init() {
        const saved = localStorage.getItem('theme-preference') || 'system';
        this.apply(saved);
        
        // Listeners for system changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', e => {
                if (this.current() === 'system') {
                    // Re-apply to let CSS take over or explicit set?
                    this.apply('system');
                }
            });
        }
    },

    current() {
        return localStorage.getItem('theme-preference') || 'system';
    },

    cycle() {
        const current = this.current();
        let next = 'light';
        if (current === 'light') next = 'dark';
        else if (current === 'dark') next = 'system';
        
        this.apply(next);
        return next;
    },

    apply(mode) {
        localStorage.setItem('theme-preference', mode);
        const root = document.documentElement;
        
        let targetTheme = mode;
        if (mode === 'system') {
            targetTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        // Always remove explicit attribute first
        root.removeAttribute('data-theme');

        if (targetTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
        }

        // Atualiza UI se houver botões
        this.updateUI();
    },

    updateUI() {
        const mode = this.current();
        const iconClass = mode === 'light' ? 'fa-sun' : (mode === 'dark' ? 'fa-moon' : 'fa-desktop');
        const title = mode === 'light' ? 'Claro' : (mode === 'dark' ? 'Escuro' : 'Sistema');

        // Update settings modal buttons (.theme-option) - GENERIC
        document.querySelectorAll('.theme-option').forEach(btn => {
            const btnMode = btn.getAttribute('data-theme');
            if (btnMode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.querySelectorAll('.theme-toggle-btn i').forEach(icon => {
            icon.className = `fa-solid ${iconClass}`;
        });
        
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.title = `Tema: ${title}`;
        });
    }
};

// Expose globally
window.themeConfig = themeConfig;

document.addEventListener('DOMContentLoaded', () => {
    themeConfig.init();
    
    // Bind click events for main toggle
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            themeConfig.cycle();
        });
    });

    // Bind click events for settings modal options (generic handler)
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
           const mode = btn.getAttribute('data-theme');
           themeConfig.apply(mode);
        });
    });
});

