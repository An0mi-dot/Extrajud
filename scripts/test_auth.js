const { createClient } = require('@supabase/supabase-js');
const { net, app } = require('electron');

// Replicando exatamente o que o app faz: net.fetch com auth-server-whitelist
app.commandLine.appendSwitch('auth-server-whitelist', '*');
app.commandLine.appendSwitch('auth-negotiate-delegate-whitelist', '*');

async function electronNetFetch(url, init = {}) {
  const headers = {};
  if (init.headers) {
    const h = init.headers instanceof Headers ? init.headers : new Headers(init.headers);
    h.forEach((value, key) => { headers[key] = value; });
  }
  const fetchOpts = { method: init.method || 'GET', headers };
  if (init.body !== undefined && init.body !== null) fetchOpts.body = init.body;

  const response = await net.fetch(url, fetchOpts);
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

const supabase = createClient(
  'https://lvicpvodestuhptsaqba.supabase.co',
  'sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1',
  { global: { fetch: electronNetFetch } }
);

app.whenReady().then(async () => {
  const testEmail = 'copilot_test_' + Date.now() + '@mailinator.com';
  const testPass = 'Teste@12345';

  console.log('--- 1. CADASTRO via net.fetch ---');
  console.log('Email:', testEmail);
  const { data: s, error: se } = await supabase.auth.signUp({
    email: testEmail, password: testPass,
    options: { data: { first_name: 'Teste', full_name: 'Teste CI' } }
  });
  if (se) { console.error('ERRO cadastro:', se.message); app.exit(1); return; }
  console.log('Cadastro OK | session imediata:', !!s.session);

  console.log('--- 2. LOGIN via net.fetch ---');
  const { data: l, error: le } = await supabase.auth.signInWithPassword({
    email: testEmail, password: testPass
  });
  if (le) { console.error('ERRO login:', le.message); app.exit(1); return; }
  console.log('Login OK:', l.user.email, '| token:', !!l.session?.access_token);
  console.log('=== TUDO OK ===');
  app.exit(0);
}).catch(e => { console.error('FALHA:', e.message); app.exit(1); });

