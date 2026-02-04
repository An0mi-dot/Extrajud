const fs = require('fs');

(async () => {
    try {
        const pngToIco = (await import('png-to-ico')).default;
        const buf = await pngToIco('public/assets/logo2.png');
        fs.writeFileSync('public/assets/icon.ico', buf);
        console.log('Icon generated successfully at public/assets/icon.ico');
    } catch (err) {
        console.error('Error converting icon:', err);
        process.exit(1);
    }
})();