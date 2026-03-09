// Módulo Cliente Supabase - usando pacote local (node_modules) para evitar bloqueio de proxy corporativo
// window.require() está sempre disponível no renderer do Electron (nodeIntegration: true, contextIsolation: false)
const { createClient } = window.require('@supabase/supabase-js');

// Aqui entram as credenciais do seu projeto
const supabaseUrl = 'https://lvicpvodestuhptsaqba.supabase.co';
const supabaseKey = 'sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1'; // Sua publishable key

// Inicializa o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("🟢 Cliente Supabase Inicializado com sucesso!");
