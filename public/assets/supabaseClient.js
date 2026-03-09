// Módulo Cliente Supabase - usando pacote local (node_modules) para evitar bloqueio de proxy corporativo
// As requisições são roteadas via IPC para o módulo net do Electron (main process),
// que usa o stack de rede do Chromium com autenticação NTLM/Kerberos nativa do Windows.
const { createClient } = window.require('@supabase/supabase-js');
const { ipcRenderer } = window.require('electron');

// Aqui entram as credenciais do seu projeto
const supabaseUrl = 'https://lvicpvodestuhptsaqba.supabase.co';
const supabaseKey = 'sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1'; // Sua publishable key

// Fetch personalizado: todas as requisições do Supabase passam pelo módulo net do Electron
// no processo principal, que tem autenticação de proxy NTLM/Kerberos automática via Windows.
async function electronNetFetch(url, init = {}) {
  const headers = {};
  if (init.headers) {
    // init.headers pode ser Headers instance ou plain object
    const h = init.headers instanceof Headers ? init.headers : new Headers(init.headers);
    h.forEach((value, key) => { headers[key] = value; });
  }

  const result = await ipcRenderer.invoke('net-fetch', url, {
    method: init.method || 'GET',
    headers,
    body: init.body || undefined,
  });

  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers: new Headers(result.headers),
  });
}

// Inicializa o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: electronNetFetch }
});

console.log("🟢 Cliente Supabase Inicializado com sucesso!");
