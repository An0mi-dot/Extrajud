/**
 * machine_identifier.js
 * 
 * Gera um identificador �nico da m�quina baseado em:
 * - MAC address do adaptador de rede principal
 * - Hostname do computador
 * - Serial do HD (se dispon�vel)
 * 
 * Usa SHA256 para criar um hash �nico
 */

const crypto = require('crypto');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Obter MAC address do adaptador de rede principal
 */
async function getMacAddress() {
    try {
        if (process.platform === 'win32') {
            // Windows - usar getmac
            const { stdout } = await execAsync('getmac /fo csv /nh', { encoding: 'utf8' });
            const mac = stdout.trim().split('\n')[0].replace(/"/g, '');
            return mac || 'unknown';
        } else if (process.platform === 'darwin') {
            // macOS - usar ifconfig
            const { stdout } = await execAsync("ifconfig | grep 'ether' | head -1 | awk '{print $2}'", { encoding: 'utf8' });
            return stdout.trim() || 'unknown';
        } else {
            // Linux - usar ip link
            const { stdout } = await execAsync("ip link | grep 'link/ether' | head -1 | awk '{print $2}'", { encoding: 'utf8' });
            return stdout.trim() || 'unknown';
        }
    } catch (error) {
        console.warn('[MachineID] Erro ao obter MAC:', error.message);
        return 'unknown';
    }
}

/**
 * Obter hostname do sistema
 */
function getHostname() {
    return os.hostname();
}

/**
 * Obter serial do HD (apenas Windows)
 */
async function getDriveSerial() {
    try {
        if (process.platform === 'win32') {
            // Windows - usar wmic
            const { stdout } = await execAsync(
                "wmic logicaldisk get serialnumber | findstr /r /v '^SerialNumber'",
                { encoding: 'utf8' }
            );
            const serials = stdout.trim().split('\n').filter(s => s.trim());
            return serials[0]?.trim() || 'unknown';
        }
        return 'unknown';
    } catch (error) {
        console.warn('[MachineID] Erro ao obter serial do HD:', error.message);
        return 'unknown';
    }
}

/**
 * Gerar machine identifier
 * @returns {Promise<string>} SHA256 hash do MAC + HOSTNAME + SERIAL
 */
async function generateMachineIdentifier() {
    try {
        const [mac, hostname, serial] = await Promise.all([
            getMacAddress(),
            Promise.resolve(getHostname()),
            getDriveSerial()
        ]);

        const combined = `${mac}|${hostname}|${serial}`;
        const hash = crypto
            .createHash('sha256')
            .update(combined)
            .digest('hex');

        console.log('[MachineID] Identificador gerado com sucesso');
        console.log('[MachineID] MAC:', mac);
        console.log('[MachineID] Hostname:', hostname);
        console.log('[MachineID] Serial:', serial);
        console.log('[MachineID] Hash:', hash);

        return hash;
    } catch (error) {
        console.error('[MachineID] Erro ao gerar identificador:', error);
        throw error;
    }
}

/**
 * Vers�o s�ncrona simplificada (sem serial do HD)
 * Usa apens MAC + HOSTNAME
 */
function generateMachineIdentifierSync() {
    try {
        const networks = os.networkInterfaces();
        let macAddress = 'unknown';

        // Pegar primeiro MAC address n�o vazio
        for (const [name, addrs] of Object.entries(networks)) {
            const mac = addrs.find(addr => addr.mac && addr.mac !== '00:00:00:00:00:00');
            if (mac) {
                macAddress = mac.mac;
                break;
            }
        }

        const hostname = os.hostname();
        const combined = `${macAddress}|${hostname}`;
        const hash = crypto
            .createHash('sha256')
            .update(combined)
            .digest('hex');

        console.log('[MachineID] Identificador gerado (sync)');
        console.log('[MachineID] MAC:', macAddress);
        console.log('[MachineID] Hostname:', hostname);
        console.log('[MachineID] Hash:', hash);

        return hash;
    } catch (error) {
        console.error('[MachineID] Erro ao gerar identificador (sync):', error);
        // Fallback - usar timestamp + random
        return crypto
            .randomBytes(32)
            .toString('hex');
    }
}

module.exports = {
    generateMachineIdentifier,
    generateMachineIdentifierSync,
    getMacAddress,
    getHostname,
    getDriveSerial
};
