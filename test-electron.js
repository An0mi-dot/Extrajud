const { app, net } = require('electron');
const fs = require('fs');
app.whenReady().then(async () => {
  try {
    const response = await net.fetch('https://lvicpvodestuhptsaqba.supabase.co/rest/v1/subsidios_trabalhistas?select=*', {
      headers: {
        'apikey': 'sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1',
        'Authorization': 'Bearer sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1'
      }
    });
    const body = await response.text();
    fs.writeFileSync('output.txt', `STATUS: ${response.status}\nBODY: ${body}`);
  } catch (e) {
    fs.writeFileSync('output.txt', `ERROR: ${e.message}`);
  }
  app.quit();
});
