// Módulo Cliente Supabase via CDN Pattern (Para rodar no Browser / Electron UI)
/**
 * Como não temos npm/node instalados globalmente e não há permissão de administrador,
 * a forma mais robusta e oficial de integrar o Supabase no lado do cliente 
 * (render process do Electron) é usando o import em módulo a partir da CDN oficial.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Aqui entram as credenciais do seu projeto
const supabaseUrl = 'https://lvicpvodestuhptsaqba.supabase.co';
const supabaseKey = 'sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1'; // Sua publishable key

// Inicializa o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("🟢 Cliente Supabase Inicializado com sucesso!");
