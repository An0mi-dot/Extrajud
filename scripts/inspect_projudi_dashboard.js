const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// URL Base
const PROJUDI_BASE = "https://projudi.tjba.jus.br/projudi";

// Função auxiliar para encontrar o Edge (reaproveitada)
async function findEdge() {
    const edgePaths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ];
    return edgePaths.find(p => fs.existsSync(p));
}

async function inspectDashboard() {
    console.log("=== INSPEÇÃO DASHBOARD PROJUDI ===");
    
    // 1. LOGIN COM BROWSER
    const edgeExe = await findEdge();
    if (!edgeExe) { console.error("Edge não encontrado."); process.exit(1); }

    const browser = await chromium.launch({
        executablePath: edgeExe,
        headless: false,
        args: ["--start-maximized", "--disable-blink-features=AutomationControlled"]
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navega para Login
    await page.goto(PROJUDI_BASE, { waitUntil: 'domcontentloaded' });
    
    console.log("--> Tentando login automático...");
    
    try {
        const USER = "05296357558.rep";
        const PASS = "neocoelba@2023";

        // Tenta preencher login (se encontrar frames)
        let loginFrame = null;
        for (let i = 0; i < 10; i++) {
            for (const frame of page.frames()) {
                if (await frame.locator('input[name="login"]').count() > 0) {
                    loginFrame = frame;
                    break;
                }
            }
            if (loginFrame) break;
            await page.waitForTimeout(1000);
        }

        if (loginFrame) {
            console.log("Campos de login encontrados! Preenchendo...");
            await loginFrame.fill('input[name="login"]', USER);
            await page.waitForTimeout(500);
            await loginFrame.fill('input[name="senha"]', PASS);
            await page.waitForTimeout(500);
            await loginFrame.press('input[name="senha"]', 'Enter');
        }

    } catch (e) {
        console.error("Erro no preenchimento automático:", e.message);
    }

    console.log("Aguardando login completo (Resolva o Captcha)...");
    
    try {
        // Espera de 5min pelo login
        await Promise.race([
            page.waitForURL(url => !url.href.includes("Logon") && url.href.length > PROJUDI_BASE.length + 5, { timeout: 300000 }),
            page.waitForSelector('frame[name="mainFrame"]', { timeout: 300000 })
        ]);

        console.log("Login Detectado! URL:", page.url());
        console.log("Aguardando carregamento completo do Dashboard (10s)...");
        await page.waitForTimeout(10000); // Garante que frames carreguem

        // Salvar HTML de todos os frames
        console.log("Salvando HTML dos frames...");
        
        let framesContent = "";
        for (const frame of page.frames()) {
            try {
                const title = await frame.title().catch(() => "Sem Titulo");
                const html = await frame.content();
                framesContent += `\n<!-- FRAME: ${frame.name()} | URL: ${frame.url()} | Title: ${title} -->\n${html}\n`;
            } catch (err) {
                framesContent += `\n<!-- FRAME ERROR: ${frame.name()} -->\n`;
            }
        }

        fs.writeFileSync('dashboard_projudi.html', framesContent);
        console.log("SUCESSO: HTML salvo em 'dashboard_projudi.html'");

    } catch (e) {
        console.error("Timeout ou erro na inspeção.", e);
    } finally {
        await browser.close();
    }
}

inspectDashboard().catch(console.error);
