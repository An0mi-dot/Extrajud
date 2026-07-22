(function(){
  'use strict';

  const CSS = `#extrajud-settings-btn{position:fixed;right:18px;bottom:18px;z-index:9999;background:var(--card-bg);border:1px solid var(--border-color);width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,0.12);cursor:pointer}#extrajud-settings-btn:hover{transform:translateY(-4px)}#extrajud-settings-modal{position:fixed;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:10000}#extrajud-settings-modal .modal{background:var(--card-bg);border-radius:12px;padding:20px;max-width:820px;width:92%;box-shadow:0 10px 30px rgba(0,0,0,0.24);color:var(--text-color)}#extrajud-settings-modal.show{display:flex}`;

  function injectStyles(){ if(document.getElementById('extrajud-settings-styles')) return; const s=document.createElement('style'); s.id='extrajud-settings-styles'; s.textContent=CSS; document.head.appendChild(s); }

  function createButton(){
    if(document.getElementById('extrajud-settings-btn')) return;
    const btn = document.createElement('div');
    btn.id = 'extrajud-settings-btn';
    btn.title = 'Configurações';
    btn.innerHTML = `<span aria-hidden="true" style="font-size:24px;line-height:1;color:var(--primary-color)">&#9881;</span>`;
    btn.addEventListener('click', openSettings);
    document.body.appendChild(btn);
  }

  function createModal(){
    if(document.getElementById('extrajud-settings-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'extrajud-settings-modal';
    overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="Configurações"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="margin:0">Configurações</h3><button id="extrajud-settings-close" aria-label="Fechar" style="background:none;border:none;font-size:20px;cursor:pointer">×</button></div><div id="extrajud-settings-content"><p>Carregando...</p></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#extrajud-settings-close').addEventListener('click', ()=> overlay.classList.remove('show'));
    overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.classList.remove('show'); });
  }

  async function openSettings(){
    injectStyles();
    createModal();
    const overlay = document.getElementById('extrajud-settings-modal');
    overlay.classList.add('show');
    const content = document.getElementById('extrajud-settings-content');

    // Prefer existing settings module if available
    if(window.SettingsModal && typeof window.SettingsModal.render === 'function'){
      content.innerHTML = '';
      try { window.SettingsModal.render(content); } catch(e){ content.innerHTML = '<p>Erro ao inicializar configurações.</p>'; }
      return;
    }

    // Load settings-complete.js dynamically if not present
    if(!document.querySelector('script[src="assets/settings-complete.js"]')){
      await new Promise((res)=>{
        const s = document.createElement('script');
        s.src = 'assets/settings-complete.js';
        s.onload = () => res();
        s.onerror = () => { content.innerHTML = '<p>Erro ao carregar módulo de configurações.</p>'; res(); };
        document.body.appendChild(s);
      });
    }

    // Small delay to allow module to register
    setTimeout(()=>{
      if(window.SettingsModal && typeof window.SettingsModal.render === 'function'){
        content.innerHTML = '';
        try { window.SettingsModal.render(content); } catch(e){ content.innerHTML = '<p>Erro ao renderizar configurações.</p>'; }
        return;
      }

      // Fallback simple UI
      const html = `<div style="display:flex;flex-direction:column;gap:12px"><label><strong>Tema</strong><div style="margin-top:6px"><button id="sj-theme-toggle" class="btn">Alternar Tema</button></div></label><div><strong>Versão</strong><div style="margin-top:6px"><span id="sj-app-ver">carregando...</span></div></div></div>`;
      content.innerHTML = html;
      const btn = document.getElementById('sj-theme-toggle');
      if(btn) btn.addEventListener('click', ()=>{ if(window.themeConfig && typeof window.themeConfig.cycle === 'function') window.themeConfig.cycle(); });
      if(window.api){ window.api.invoke('get-app-version').then(v=>{ const e=document.getElementById('sj-app-ver'); if(e) e.textContent = v; }).catch(()=>{}); }
    }, 150);
  }

  function init(){
    // Disable floating settings button globally (requested: remove gear button on all pages).
    // Keep modal/components available for explicit settings UI if pages implement their own triggers.
  }

  init();
})();

