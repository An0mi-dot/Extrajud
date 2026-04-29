const { app, net } = require('electron');
const fs = require('fs');
app.whenReady().then(async () => {
  try {
    const insertRes = await net.fetch('https://lvicpvodestuhptsaqba.supabase.co/rest/v1/subsidios_trabalhistas', {
      method: 'POST',
      headers: {
        'apikey': 'sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1',
        'Authorization': 'Bearer sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ numero_processo: '0000000-00.0000.0.00.0000' })
    });
    const insertBody = await insertRes.text();
    fs.writeFileSync('output-insert.txt', `INSERT STATUS: ${insertRes.status}\nBODY: ${insertBody}`);
  } catch (e) {
    fs.writeFileSync('output-insert.txt', `ERROR: ${e.message}`);
  }
  app.quit();
});
