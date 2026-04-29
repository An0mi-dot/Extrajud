// Módulo Cliente Supabase - usando pacote local (node_modules) para evitar bloqueio de proxy corporativo
// As requisições são roteadas via IPC para o módulo net do Electron (main process),
// que usa o stack de rede do Chromium com autenticação NTLM/Kerberos nativa do Windows.
const { createClient } = window.require('@supabase/supabase-js');
const { ipcRenderer } = window.require('electron');

// Aqui entram as credenciais do seu projeto
const supabaseUrl = 'https://lvicpvodestuhptsaqba.supabase.co';
const supabaseKey = 'sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1'; // Sua publishable key

// Inicializa o cliente do Supabase usando o fetch nativo (Chromium) nativo do Electron integrado com proxy (NTLM/Kerberos/Zscaler)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

console.log("🟢 Cliente Supabase Inicializado com sucesso!");
