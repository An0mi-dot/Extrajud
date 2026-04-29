# Sistema de Logging Modernizado - EXTRATJUD

## Resumo das Mudanças

O sistema de logging do aplicação Electron foi completamente refatorado para seguir padrões **ISO 8601, estrutura de código HTTP-like, e métricas profissionais**.

---

## ANTES (Formato "Bobo")

```
[INFO] Inicializando worker de automação (RPA Core).
[INFO] Usando navegador externo (Edge).
[INFO] Enviando requisição HTTP GET para endpoint: https://projudi.tjba.jus.br/projudi/
[WARN] Parada solicitada pelo usuário...
[INFO] [HEARTBEAT] Processo ativo: aguardando ciclo de execução ou I/O...
```

---

## DEPOIS (Formato Técnico/Profissional)

```
2026-03-24T14:32:55.123Z [00001] [INFO] [MAIN] Inicializando worker de automação RPA. | context=Kernel::ExecutionControl::ThreadMain
2026-03-24T14:32:56.450Z [00002] [INFO] [MAIN] Usando navegador externo (Edge). | context=Process::BrowserControl::ExternalBrowser
2026-03-24T14:32:58.789Z [00003] [INFO] [MAIN] Enviando requisição HTTP GET para endpoint PROJUDI. | context=Network::HTTP::Request
2026-03-24T14:33:02.100Z [00004] [WARN] [MAIN] Parada solicitada pelo usuário. | context=Process::SignalHandler
2026-03-24T14:33:05.200Z [00008] [DEBUG] [MAIN] Processo ativo e aguardando próximo ciclo. | context=System::Monitoring::Heartbeat
```

---

## Nova Função `log()`

```javascript
// Novo sistema de logging estruturado para aplicação
const logContext = {
    startTime: new Date(),
    logCounter: 0,
    moduleStack: ['MAIN']
};

const log = (eventSender, msg, tech = null, type = 'info', metadata = {}) => {
    const now = new Date();
    logContext.logCounter++;
    const isoTimestamp = now.toISOString();
    const logId = String(logContext.logCounter).padStart(5, '0');
    const levelMap = { info: 'INFO', warn: 'WARN', error: 'ERROR', debug: 'DEBUG' };
    const level = levelMap[type] || 'UNKNOWN';
    const module = logContext.moduleStack[logContext.moduleStack.length - 1] || 'MAIN';
    
    // Construir linha de log estruturada para console
    const consoleLog = `${isoTimestamp} [${logId}] [${level}] [${module}] ${msg}${tech ? ` | context=${tech}` : ''}`;
    console.log(consoleLog);
    
    // Para o Frontend, envia objeto estruturado
    if (eventSender) {
        eventSender.send('log-message', {
            id: logId,
            timestamp: isoTimestamp,
            msg: msg,
            tech: tech || null,
            type: type,
            module: module,
            metadata: metadata || {}
        });
    }

    // Para Arquivo - formato estruturado com separadores
    if (currentLogFile) {
        try {
            let fileLine = `${isoTimestamp} | ${logId} | ${level.padEnd(5)} | ${module.padEnd(20)} | ${msg}`;
            if (tech) fileLine += `\n                    └─ CONTEXT: ${tech}`;
            if (Object.keys(metadata).length > 0) fileLine += `\n                    └─ METADATA: ${JSON.stringify(metadata)}`;
            fileLine += '\n';
            fs.appendFileSync(currentLogFile, fileLine, 'utf8');
        } catch(e) {/* quiet failure */}
    }
};
```

---

## Características Implementadas

✅ **Timestamp ISO 8601** – `2026-03-24T14:32:55.123Z`  
✅ **ID de Log Sequencial** – `[00001]`, `[00002]`, ... permite rastreabilidade  
✅ **Níveis Padronizados** – `[INFO]`, `[WARN]`, `[ERROR]`, `[DEBUG]`  
✅ **Módulo de Contexto** – `[MAIN]`, `[WORKER]`, etc. (expansível com `logContext.moduleStack`)  
✅ **Contexto Técnico Hierárquico** – `Kernel::ExecutionControl::ThreadMain`  
✅ **Metadata Estruturada** – Dados adicionais em formato JSON navegável  
✅ **Formatação em Arquivo** – Hierarquia visual com `└─` para melhor leitura  
✅ **Zero Emojis** – Linguagem corporativa/técnica  

---

## Como Usar a Nova Função

### Antes:
```javascript
log(eventSender, "Conectado ao servidor", "server_connection", 'info');
```

### Depois (com metadata):
```javascript
log(eventSender, 
    "Conectado ao servidor PROJUDI com sucesso.", 
    "Network::Connection::Established", 
    'info',
    { 
        server: 'projudi.tjba.jus.br',
        protocol: 'HTTPS',
        status_code: 200,
        latency_ms: 1240
    }
);
```

### Resultado no Console:
```
2026-03-24T14:35:10.456Z [00015] [INFO] [MAIN] Conectado ao servidor PROJUDI com sucesso. | context=Network::Connection::Established
```

### Resultado no Arquivo:
```
2026-03-24T14:35:10.456Z | 00015 | INFO  | MAIN                 | Conectado ao servidor PROJUDI com sucesso.
                    └─ CONTEXT: Network::Connection::Established
                    └─ METADATA: {"server":"projudi.tjba.jus.br","protocol":"HTTPS","status_code":200,"latency_ms":1240}
```

---

## Integração Futura

Para modularizar logs em componentes diferentes, use:

```javascript
// Em uma classe/módulo interno
logContext.moduleStack.push('PDF_PROCESSOR');
log(eventSender, "Iniciando processamento de PDF...", "IO::FileSystem::PDF", 'info');
logContext.moduleStack.pop(); // Retira do stack ao terminar
```

---

## Benefícios

- **Auditoria**: Cada ação tem timestamp, ID único e contexto
- **Debugging**: Hierarquia clara de `context` facilita rastreabilidade  
- **Monitoramento**: Metadata estruturada permite parsing automatizado
- **Profissionalismo**: Formato compatível com ferramentas empresariais (ELK, Splunk, etc.)
- **Performance**: Lazy evaluation do JSON.stringify apenas se metadata existir
