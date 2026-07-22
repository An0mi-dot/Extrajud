/*
  PJE TJBA - DevTools Console Standalone Extractor
  URL alvo (exemplo): https://pje.tjba.jus.br/pje/Painel/painel_usuario/advogado.seam

  USO:
    1) Abra a página no navegador (logado) e pressione F12.
    2) Cole TODO ESTE SCRIPT na Console.
    3) Rode.

  O script tenta:
    - Descobrir a tabela de resultados (tbExpedientes) e iterar paginação clicando "Próxima"/"fastforward"/controles do Rich
    - Extrair linhas (NPU/proc) de forma defensiva (pode precisar ajustar mapeamento conforme seu painel)
    - Retornar o dataset completo no console e fazer download JSON

  OBS:
    - O PJE é altamente dinâmico; seletores podem variar.
    - Este script é para SER COPIADO/COLADO no console, não depende do projeto.
*/

(() => {
  'use strict';

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const log = (...args) => {
    console.log('[PJE-EXTRACT]', ...args);
  };

  const normalizeText = (t) => (t == null ? '' : String(t)).replace(/\s+/g, ' ').trim();

  // Heurística: identifica a tabela principal de expedientes
  // (agora por scoring, pois o PJE pode criar tabelas “inofensivas” com 1 linha)
  const findMainTable = () => {
    const tables = Array.from(document.querySelectorAll('table'));
    if (!tables.length) return null;

    const scoreTable = (t) => {
      const tbodyTr = t.querySelectorAll('tbody tr').length;
      const tr = t.querySelectorAll('tr').length;
      const tds = Array.from(t.querySelectorAll('td'));
      const sampleTds = tds.slice(0, 30);
      const tdTextLen = sampleTds.reduce((acc, td) => {
        const txt = td.innerText || td.textContent || '';
        return acc + txt.trim().length;
      }, 0);
      const linkCount = t.querySelectorAll('a[href], a[onclick]').length;
      const richBtnCount = t.querySelectorAll('.rich-datascr-button').length;

      // Preferir tabelas com mais linhas reais
      // e com alguma densidade de texto (tdTextLen) — linkCount/richBtnCount entram como bonus.
      return (
        tbodyTr * 10 +
        tr * 1 +
        tdTextLen * 0.1 +
        linkCount * 2 +
        richBtnCount * 3
      );
    };

    // Preferência forte por id terminando em tbExpedientes (quando existir)
    const strongCandidates = Array.from(document.querySelectorAll("table[id$='tbExpedientes']"));
    if (strongCandidates.length) {
      let best = strongCandidates[0];
      let bestScore = scoreTable(best);
      for (const t of strongCandidates.slice(1)) {
        const s = scoreTable(t);
        if (s > bestScore) {
          best = t;
          bestScore = s;
        }
      }
      return best;
    }

    let best = null;
    let bestScore = -Infinity;
    for (const t of tables) {
      const s = scoreTable(t);
      // ignora tabelas “vazias”/sem tbody tr
      if (t.querySelectorAll('tbody tr').length === 0) continue;
      if (s > bestScore) {
        bestScore = s;
        best = t;
      }
    }

    return best;
  }; 


  // Encontra botão de próxima página no contexto da tabela (Rich)
  const findNextButton = (tableEl) => {
    if (!tableEl) return null;

    const isDisabledEl = (c) => {
      const cls = (c.className || '').toLowerCase();
      return (
        cls.includes('inact') ||
        c.getAttribute('aria-disabled') === 'true' ||
        (c.style && (c.style.display === 'none' || c.style.visibility === 'hidden'))
      );
    };

    const strictSel = ".rich-datascr-button[onclick*='fastforward' i], .rich-datascr-button[onclick*='next' i], a[title='próxima' i], a[alt='próxima' i]";

    // Tenta uma busca mais localizada no wrapper mais próximo
    const wrapper = tableEl.closest ? tableEl.closest('div,section,form,table,body') : null;
    if (wrapper && wrapper.querySelector) {
      const direct = wrapper.querySelector(strictSel);
      if (direct && !isDisabledEl(direct)) return direct;
    }

    // Varrre ancestrais e usa heurística por atributos/texto
    let el = tableEl;
    for (let i = 0; i < 15 && el && el !== document.body; i++) {
      if (el.querySelectorAll) {
        const cands = Array.from(el.querySelectorAll(
          ".rich-datascr-button, a[title], a[alt], a, button, img, span[aria-label], [aria-label], [onclick]"
        ));

        for (const c of cands) {
          if (isDisabledEl(c)) continue;

          const txt = normalizeText(c.innerText || c.textContent || c.getAttribute('title') || c.getAttribute('alt') || c.getAttribute('aria-label') || '');
          const oc = (c.getAttribute('onclick') || '').toLowerCase();
          const href = (c.getAttribute('href') || '').toLowerCase();
          const src = (c.getAttribute('src') || '').toLowerCase();

          const isNext =
            oc.includes('fastforward') ||
            oc.includes('next') ||
            href.includes('next') ||
            txt.match(/\b(próxima|proxima|next)\b/i) ||
            src.includes('seta_direita') ||
            txt === '»' || txt === '>>' || txt === '>';

          if (isNext) return c;
        }
      }
      el = el.parentElement;
    }

    // Fallback global estrito
    const globalBtn = document.querySelector(strictSel);
    if (globalBtn && !isDisabledEl(globalBtn)) return globalBtn;

    // Fallback global heurístico: pega qualquer rich-datascr-button que pareça next e não esteja desabilitado
    const paginatorButtons = document.querySelectorAll('.rich-datascr-button');
    for (const c of paginatorButtons) {
      if (isDisabledEl(c)) continue;
      const oc = (c.getAttribute('onclick') || '').toLowerCase();
      const txt = normalizeText(c.innerText || c.textContent || '');
      if (oc.includes('next') || oc.includes('fastforward') || txt.match(/\b(próxima|proxima|next)\b/i)) return c;
    }

    return null;
  };


  // Extrai registros da tabela atual
  const extractRows = (tableEl) => {
    if (!tableEl) return [];

    const rows = Array.from(tableEl.querySelectorAll('tbody tr'));
    if (!rows.length) {
      // fallback se não houver tbody
      const anyRows = Array.from(tableEl.querySelectorAll('tr')).filter(tr => tr.querySelectorAll('td').length > 0);
      if (anyRows.length) {
        // eslint-disable-next-line
        return anyRows.map(tr => tr);
      }
    }

    const data = [];
    const npuRegex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;

    for (const tr of rows) {
      const tds = Array.from(tr.querySelectorAll('td'));
      if (!tds.length) continue;

      // Alguns layouts não colocam o texto todo em innerText (ou fica vazio no momento).
      // Tentar reconstruir texto com tds melhora a chance de capturar NPU.
      const rowText = normalizeText(tds.map(td => td.innerText || '').join(' '));
      const npuMatch = rowText.match(npuRegex);
      const npu = npuMatch ? npuMatch[0] : '';

      if (npu) {
        data.push({ npu, raw: rowText });
      } else {
        data.push({ npu: '', raw: rowText });
      }
    }

    return data;
  };


  // Download JSON no client
  const downloadJSON = (obj, filename) => {
    try {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      log('Download iniciado:', filename);
    } catch (e) {
      console.warn('Download JSON falhou:', e);
    }
  };

  // Loop de paginação até terminar
  const paginateAll = async (opts = {}) => {
    const {
      maxPages = 500,
      waitAfterClickMs = 900,
      stopWhenFirstRepeat = true,
    } = opts;

    const results = [];
    const seenFirstFingerprints = new Set();
    let pageIndex = 0;

    while (pageIndex < maxPages) {
      pageIndex++;

      // Espera o DOM consolidar
      await sleep(250);

      const tableEl = findMainTable();
      if (!tableEl) {
        throw new Error('Tabela principal não encontrada (tbExpedientes). Navegue até a lista antes de rodar o script.');
      }

      // Debug rápido (evita “cegueira” do layout)
      try {
        const trCount = tableEl.querySelectorAll('tbody tr').length;
        const anyTr = tableEl.querySelectorAll('tr').length;
        const sampleTr = tableEl.querySelector('tbody tr');
        const sampleTdText = sampleTr ? Array.from(sampleTr.querySelectorAll('td')).slice(0, 3).map(td => normalizeText(td.innerText || td.textContent || '')).filter(Boolean) : [];
        const sampleTrText = sampleTr ? normalizeText(sampleTr.innerText || sampleTr.textContent || '') : '';
        log('DEBUG page', {
          pageIndex,
          tableTag: tableEl.tagName,
          tableId: tableEl.id || '',
          tableClass: tableEl.className || '',
          trCount,
          anyTr,
          sampleTrText: sampleTrText.slice(0, 160),
          sampleTdText,
        });
      } catch (_) {}



      const extracted = extractRows(tableEl);
      if (extracted.length) {
        // dedo: primeiro raw
        const firstRaw = extracted[0]?.raw || '';
        if (stopWhenFirstRepeat) {
          if (seenFirstFingerprints.has(firstRaw)) {
            log(`Paginação terminou: repetiu primeiro registro. page=${pageIndex}`);
            break;
          }
          seenFirstFingerprints.add(firstRaw);
        }
      }

      // Append sem duplicar por npu (se existir)
      for (const item of extracted) {
        const key = item.npu ? `npu:${item.npu}` : `raw:${item.raw}`;
        // Para performance, evitamos set global enorme em memória com fallback simples.
        // Mas se quiser, pode trocar por Set completo.
        if (!key) continue;
        // Checagem leve: só evita duplicar npu quando já existe no array.
        if (item.npu) {
          const already = results.some(r => r.npu === item.npu);
          if (!already) results.push(item);
        } else {
          results.push(item);
        }
      }

      // Encontra próximo
      const nextBtn = findNextButton(tableEl);
      if (!nextBtn) {
        log('Sem botão de próxima página detectado. Parando.', { pageIndex, results: results.length });
        break;
      }

      // Se o botão aparenta desabilitado, para
      const cls = (nextBtn.className || '').toLowerCase();
      const disabled = cls.includes('inact') || nextBtn.getAttribute('aria-disabled') === 'true' || nextBtn.style?.display === 'none';
      if (disabled) {
        log('Botão de próxima parece desabilitado. Parando.', { pageIndex, results: results.length });
        break;
      }

      // Clica e aguarda
      log('Clicando próxima página...', { pageIndex, extracted: extracted.length });
      nextBtn.click();
      await sleep(waitAfterClickMs);
    }

    return results;
  };

  // Execução principal
  (async () => {
    try {
      log('Iniciando extração completa via paginação (standalone DevTools)...');

      // Se quiser, ajuste manualmente para reduzir volume
      const dataset = await paginateAll({ maxPages: 300, waitAfterClickMs: 1000 });

      // Consolida
      const onlyNpu = dataset.filter(x => x.npu);
      log('Extração concluída.', {
        totalItems: dataset.length,
        totalWithNpu: onlyNpu.length,
        sample: onlyNpu.slice(0, 3),
      });

      // Mostra no console
      console.table(onlyNpu.slice(0, 50).map(x => ({ npu: x.npu, raw: x.raw.slice(0, 120) })));

      // Download JSON (opcional)
      const dt = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const fname = `pje_extract_${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}_${pad(dt.getHours())}${pad(dt.getMinutes())}.json`;
      downloadJSON({ at: location.href, total: dataset.length, records: dataset }, fname);

      // Também retorna para quem rodar script
      return dataset;
    } catch (e) {
      console.error('[PJE-EXTRACT] ERRO:', e);
      alert('Erro no extrator PJE DevTools. Veja o console.');
    }
  })();
})();

