const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function test() {
    const code = fs.readFileSync('public/assets/supabaseClient.js', 'utf8');
    const urlMatch = code.match(/const supabaseUrl = '([^']+)'/);
    const keyMatch = code.match(/const supabaseKey = '([^']+)'/);
    if (!urlMatch || !keyMatch) return console.log('not found keys');
    
    const supabase = createClient(urlMatch[1], keyMatch[1]);
    const { data: sub } = await supabase.from('subsidios_trabalhistas').select('*');
    const { data: sol } = await supabase.from('solicitacoes_faturamentos').select('*');
    console.log('Subsidios rows:', sub ? sub.length : 'error');
    console.log('Solicitacoes rows:', sol ? sol.length : 'error');
}
test();
