const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

async function generateAssets() {
    try {
        console.log("Loading logo...");
        const logoPath = path.join('public', 'assets', 'logo2.png');
        const logo = await Jimp.read(logoPath);

        // Colors
        const BRAND_GREEN = 0x10b981ff; // #10b981
        const DARK_ACCENT = 0x059669ff; // #059669
        const WHITE = 0xffffffff;

        console.log("Generating Sidebar (164x314)...");
        // 1. Sidebar (164x314) - Tall Vertical Image for Welcome Page
        const sidebar = new Jimp({ width: 164, height: 314, color: BRAND_GREEN });
        
        // Add subtle gradient/texture effect using pixel manipulation or overlay (simplified here)
        // Let's adapt logo to fit nicely
        const logoSidebar = logo.clone();
        logoSidebar.resize({ w: 140 }); // slightly smaller than width
        
        // Composite logo in the middle/top
        sidebar.composite(logoSidebar, 12, 100);
        
        // Add some "footer" text bar visual (just simple rects)
        const darkBar = new Jimp({ width: 164, height: 10, color: DARK_ACCENT });
        sidebar.composite(darkBar, 0, 304);

        await sidebar.write('public/assets/installerSidebar.bmp');
        console.log("Sidebar saved.");


        console.log("Generating Header (150x57)...");
        // 2. Header (150x57) - Top right image
        const header = new Jimp({ width: 150, height: 57, color: WHITE });
        
        const logoHeader = logo.clone();
        logoHeader.resize({ h: 50 }); // fit height
        
        // Composite on the right
        header.composite(logoHeader, 150 - logoHeader.width - 5, 3);
        
        await header.write('public/assets/installerHeader.bmp');
        console.log("Header saved.");

    } catch (error) {
        console.error("Error generating assets:", error);
        process.exit(1);
    }
}

generateAssets();