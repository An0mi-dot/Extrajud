const { chromium } = require('playwright-core');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// URL Base
const PROJUDI_BASE = "https://projudi.tjba.jus.br/projudi";

// Find Edge Logic (Copied)
async function findEdge() {
    const commonPaths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

(async () => {
    const executablePath = await findEdge();
    if (!executablePath) {
        console.error("Browser not found.");
        process.exit(1);
    }

    const browser = await chromium.launch({ 
        executablePath,
        headless: false,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-blink-features=AutomationControlled' 
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    try {
        // 1. LOGIN
        console.log("1. Logging in...");
        await page.goto(`${PROJUDI_BASE}/`, { waitUntil: 'networkidle' });
        
        // Check if login needed
        if (await page.locator('input[name="usuario"]').count() > 0) {
            await page.fill('input[name="usuario"]', 'BA25070');
            await page.fill('input[name="senha"]', 'Abc010203*');
            await page.press('input[name="senha"]', 'Enter');
            console.log("Waiting for login...");
            await page.waitForTimeout(5000); 
            // Wait for user to solve captcha if needed
            await page.waitForTimeout(5000);
        }

        // 2. ORGAO SELECTION
        console.log("2. Setting up Session (Orgao Selection)...");
        await page.waitForTimeout(3000);
        
        // Find Frame
        let representantFrame = page.frames().find(f => f.url().includes('CentroUsuarioRepresentante'));
        if (!representantFrame) {
             const mainFrame = page.frames().find(f => f.name() === 'mainFrame');
             if (mainFrame) {
                 const iframe = await mainFrame.locator('iframe');
                 if (await iframe.count() > 0) {
                     representantFrame = await iframe.contentFrame();
                 }
             }
        }

        if (representantFrame) {
             console.log("Found frame. Selecting Orgao...");
             // Select Comarca
             if (await representantFrame.locator('select[name="codComarca"]').count() > 0) {
                  await representantFrame.selectOption('select[name="codComarca"]', '-1');
             }
             // Click Link
             const link = representantFrame.locator('a[href*="submitForm"]');
             if (await link.count() > 0) {
                 await link.first().click();
                 await page.waitForLoadState('networkidle');
                 await page.waitForTimeout(3000);
             }
        }

        // 3. NAVIGATE TO ARCHIVED & SUBMIT FILTER
        console.log("3. Navigating to Arquivados and Applying Filter...");
        
        // Navigate to the list first to get the form
        const ARQUIVADOS_URL = `${PROJUDI_BASE}/listagens/ProcessosParte?tipo=arquivados&isParteOrgaoRep=true`;
        await page.goto(ARQUIVADOS_URL, { waitUntil: 'domcontentloaded' });
        
        // Find content frame
        let contentFrame = page;
        const mainFrame = page.frames().find(f => f.name() === 'mainFrame');
        if (mainFrame) {
            contentFrame = mainFrame;
            await mainFrame.waitForLoadState('domcontentloaded');
        }

        // Fill Filter Form
        console.log("Applying Date Filter: 01/01/2018 - 31/12/2018");
        
        await contentFrame.evaluate(() => {
            const f = document.querySelector('form#formEnvia');
            if (f) {
                // Set dates
                f.querySelector('input[name="dataInicio"]').value = '01/01/2018';
                f.querySelector('input[name="dataFim"]').value = '31/12/2018';
                // Reset page
                f.querySelector('input[name="pagina"]').value = '1';
                
                f.submit();
            }
        });

        console.log("Filter submitted. Waiting for results...");
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(5000); // Allow server processing

        // 4. ANALYZE RESULTS
        const html = await contentFrame.content();
        fs.writeFileSync('debug_filtered_2018.html', html);
        
        const $ = cheerio.load(html);
        const resultText = $('td:contains("resultados encontrados")').text().trim();
        console.log(`\n=== RESULTS FOR 2018 ===\nSummary: ${resultText}`);
        
        // Check a few rows
        console.log("Sample Rows:");
        let count = 0;
        $('tr').each((i, row) => {
             const txt = $(row).text().trim().replace(/\s+/g, ' ');
             if (txt.includes('2018') || /\d{7}-\d{2}\.\d{4}/.test(txt)) {
                 if (count < 5) console.log(txt.substring(0, 150) + "...");
                 count++;
             }
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        // await browser.close();
    }

})();