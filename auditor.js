// ==UserScript==
// @name         PSCIP - Auditor V7.7 (Tabela 5 Automático)
// @namespace    http://tampermonkey.net/
// @version      7.7
// @description  Auditor automático com suporte à Tabela 5 (área ≤ 900m² e H ≤ 10m). Executa ao carregar a página e ao clicar na aba de Segurança. Sem painel flutuante.
// @match        *://sistemas.bombeiros.ms.gov.br/analise-pscip/analisar.xhtml?projeto=*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ===================================================================
    // 1. FUNÇÕES AUXILIARES
    // ===================================================================
    function converterNumero(str) {
        if (!str) return 0;
        return parseFloat(str.replace(',', '.').trim());
    }

    // ===================================================================
    // 2. DETECTOR DE ALTURA
    // ===================================================================
    function detectarAltura() {
        const todasCelulas = document.querySelectorAll('td');
        for (let celula of todasCelulas) {
            const textoCompleto = celula.innerText || "";
            if (textoCompleto.includes("NT-03/4.31")) {
                const celulaValor = celula.nextElementSibling;
                if (celulaValor) {
                    const textoValor = celulaValor.innerText.trim();
                    const match = textoValor.match(/(\d+(?:[,\.]\d+)?)\s*(?:metros|m\b)/i);
                    if (match) {
                        const altura = parseFloat(match[1].replace(',', '.'));
                        console.log(`✅ Altura detectada: ${altura}m`);
                        return { valor: altura, sucesso: true, debug: `"${textoValor.substring(0, 50)}"` };
                    }
                }
            }
        }
        return { valor: 0, sucesso: false, debug: "Não encontrado" };
    }

    // ===================================================================
    // 3. DETECTOR DE ÁREA CONSTRUÍDA
    //    Busca a célula com texto "área a ser analisada" e lê o valor
    //    da célula irmã (próximo <td>).
    // ===================================================================
    function detectarArea() {
        const todasCelulas = document.querySelectorAll('td');
        for (let celula of todasCelulas) {
            const txt = celula.innerText || "";
            if (txt.includes("área a ser analisada") || txt.includes("somatória das áreas")) {
                const celulaValor = celula.nextElementSibling;
                if (celulaValor) {
                    const textoValor = celulaValor.innerText.trim();
                    // Aceita "480 m²", "480m2", "1.200,50 m²", etc.
                    const match = textoValor.match(/(\d[\d\.,]*)/);
                    if (match) {
                        // Remove separadores de milhar (ponto) e converte vírgula decimal
                        const numStr = match[1].replace(/\.(?=\d{3})/g, '').replace(',', '.');
                        const area = parseFloat(numStr);
                        if (!isNaN(area) && area > 0) {
                            console.log(`✅ Área detectada: ${area} m²`);
                            return { valor: area, sucesso: true, debug: `"${textoValor.substring(0, 50)}"` };
                        }
                    }
                }
            }
        }
        return { valor: 0, sucesso: false, debug: "Não encontrado" };
    }

    // ===================================================================
    // 4. DETECTOR DE OCUPAÇÃO
    // ===================================================================
    function detectarDivisao() {
        if (!window.DB_PSCIP) return null;
        let codigos = new Set();
        const regex = /\b([A-M]-[0-9]{1,2})\b/i;
        const elementos = document.querySelectorAll('button, td, span, label, div.ui-outputlabel, b, strong, select, input[type="text"]');

        elementos.forEach(el => {
            let txt = "";
            if (el.tagName === 'SELECT' && el.selectedIndex >= 0) txt = el.options[el.selectedIndex].text;
            else if (el.tagName === 'INPUT') txt = el.value;
            else txt = el.innerText;

            if (txt && txt.length < 100) {
                const match = txt.match(regex);
                if (match) {
                    const t = txt.toUpperCase();
                    if (!t.includes("LEI") && !t.includes("NT") && !t.includes("TABELA")) {
                        codigos.add(match[1].toUpperCase());
                    }
                }
            }
        });
        return codigos.size > 0 ? Array.from(codigos)[0] : null;
    }

    // ===================================================================
    // 5. EXIBIR NOTAS NA PÁGINA (LAYOUT CORRIGIDO)
    // ===================================================================
    function exibirNotasNaPagina(divisao, listaNotas) {
        const ID_ELEMENTO = 'auditor-notas-container-full';
        const existente = document.getElementById(ID_ELEMENTO);
        if (existente) existente.remove();

        if (!listaNotas || listaNotas.length === 0) return;

        let conteudoLi = "";
        listaNotas.forEach(nota => {
            conteudoLi += `<li style="margin-bottom:6px;padding-bottom:4px;border-bottom:1px dashed #eee;">${nota}</li>`;
        });

        const novoContainer = document.createElement('div');
        novoContainer.id = ID_ELEMENTO;
        novoContainer.className = 'row';
        novoContainer.style.marginBottom = "15px";

        novoContainer.innerHTML = `
            <div class="col-md-12">
                <fieldset class="scheduler-border">
                    <legend class="scheduler-border" style="font-weight:bold;color:#d9534f;border-bottom:none;margin-bottom:0;">
                        ⚠️ Notas Gerais das Medidas de Segurança
                    </legend>
                    <div class="row" style="margin-top:10px;">
                        <div class="col-md-4">
                            <div style="background:#f9f9f9;padding:15px;border-radius:4px;border-left:4px solid #d9534f;height:100%;">
                                <h4 style="margin-top:0;color:#555;">Ocupação <strong style="color:#d9534f;">${divisao}</strong></h4>
                                <p style="font-size:12px;color:#777;margin-bottom:0;">
                                    Verifique as notas ao lado para garantir a conformidade dos itens marcados acima.
                                </p>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div style="background:#fffbe6;border:1px solid #ffeeba;padding:15px;border-radius:4px;">
                                <ul style="margin:0;padding-left:20px;font-size:13px;color:#444;">
                                    ${conteudoLi}
                                </ul>
                            </div>
                        </div>
                    </div>
                </fieldset>
            </div>
        `;

        // Insere antes de "Riscos Especiais" ou depois de "Medidas de segurança"
        const legends = Array.from(document.querySelectorAll('legend'));
        let targetRow = null;
        let fallbackRow = null;

        for (let leg of legends) {
            if (leg.innerText && (leg.innerText.includes("Riscos Especiais") || leg.innerText.includes("Riscos especiais"))) {
                targetRow = leg.closest('.row');
                break;
            }
            if (leg.innerText && leg.innerText.includes("Medidas de segurança")) {
                fallbackRow = leg.closest('.row');
            }
        }

        if (targetRow) {
            targetRow.parentNode.insertBefore(novoContainer, targetRow);
        } else if (fallbackRow) {
            fallbackRow.parentNode.insertBefore(novoContainer, fallbackRow.nextSibling);
        } else {
            const form = document.querySelector('form');
            if (form) form.insertBefore(novoContainer, form.firstChild);
        }
    }

    // ===================================================================
    // 6. LÓGICA PRINCIPAL — AUDITAR
    // ===================================================================
    function auditar() {
        if (!window.DB_PSCIP) {
            console.warn("Auditor: DB_PSCIP ainda não carregado.");
            return false;
        }

        const divisao = detectarDivisao();
        if (!divisao) {
            console.warn("Auditor: Ocupação não detectada na página.");
            return false;
        }

        const dadosAltura = detectarAltura();
        const dadosArea   = detectarArea();
        const altura = dadosAltura.sucesso ? dadosAltura.valor : 0;
        const area   = dadosArea.sucesso   ? dadosArea.valor   : 0;

        // --- DECISÃO: TABELA 5 ou tabelas normais? ---
        // Tabela 5 aplica-se quando: área ≤ 900 m² E altura ≤ 10 m
        // Grupo M possui tabelas específicas próprias — nunca usa Tabela 5
        const grupoM = divisao.toUpperCase().startsWith('M');
        const usandoTabela5 = dadosArea.sucesso && area <= 900 && altura <= 10 && !grupoM;

        console.log(`Auditor: Divisão=${divisao} | H=${altura}m | Área=${area}m² | Tabela5=${usandoTabela5}`);

        const {
            REGRAS, NOTAS_ESPECIFICAS, NOTAS_GERAIS,
            REGRAS_TABELA5, NOTAS_ESP_TABELA5
        } = window.DB_PSCIP;

        const NOTAS_GER = NOTAS_GERAIS || {};

        // Seleciona a fonte de regras e notas conforme o caso
        const fonteRegras   = usandoTabela5 ? (REGRAS_TABELA5 || {}) : REGRAS;
        const fonteNotasEsp = usandoTabela5 ? (NOTAS_ESP_TABELA5 || {}) : (NOTAS_ESPECIFICAS || {});

        // Busca as regras para a divisão detectada
        let regrasRaw = null;
        for (const grupo in fonteRegras) {
            if (grupo.split(',').map(s => s.trim().toUpperCase()).includes(divisao)) {
                regrasRaw = fonteRegras[grupo];
                break;
            }
        }

        if (!regrasRaw) {
            // Se usou Tabela 5 mas não achou, tenta nas regras normais como fallback
            if (usandoTabela5) {
                console.warn(`Auditor: ${divisao} não encontrada na Tabela 5. Tentando regras normais...`);
                for (const grupo in REGRAS) {
                    if (grupo.split(',').map(s => s.trim().toUpperCase()).includes(divisao)) {
                        regrasRaw = REGRAS[grupo];
                        break;
                    }
                }
            }
            if (!regrasRaw) {
                console.warn(`Auditor: Ocupação ${divisao} sem regras no Banco de Dados.`);
                return false;
            }
        }

        // --- LIMPA visual anterior ---
        document.querySelectorAll('.auditoria-ok, .auditoria-erro').forEach(el => {
            el.classList.remove('auditoria-ok', 'auditoria-erro');
            el.style = "";
            el.querySelectorAll('.check-visual').forEach(s => s.remove());
        });

        let erros = 0;

        // --- MONTA lista de IDs obrigatórios (com condições de altura e área) ---
        const idsObrigatorios = [];
        regrasRaw.forEach(regra => {
            if (typeof regra === 'number') {
                idsObrigatorios.push(regra);
            } else if (typeof regra === 'object') {
                let aplica = true;
                if (regra.minH    !== undefined && altura < regra.minH)    aplica = false;
                if (regra.maxH    !== undefined && altura > regra.maxH)    aplica = false;
                if (regra.minArea !== undefined && area   < regra.minArea) aplica = false;
                if (regra.maxArea !== undefined && area   > regra.maxArea) aplica = false;
                if (aplica) idsObrigatorios.push(regra.id);
            }
        });

        // --- VERIFICA checkboxes ---
        const { MAPA_REQUISITOS } = window.DB_PSCIP;
        idsObrigatorios.forEach(id => {
            const nomeMedida = MAPA_REQUISITOS[id];
            if (!nomeMedida) return;

            // Busca nota específica para este item e divisão
            let notaTexto = null;
            for (const grupo in fonteNotasEsp) {
                if (grupo.split(',').map(s => s.trim().toUpperCase()).includes(divisao)) {
                    const notasGrupo = fonteNotasEsp[grupo];
                    const rawNota = notasGrupo && notasGrupo[id] ? notasGrupo[id] : null;
                    if (rawNota) {
                        if (typeof rawNota === 'string') notaTexto = rawNota;
                        else if (Array.isArray(rawNota)) {
                            const notaEncontrada = rawNota.find(n => {
                                if (n.minH    !== undefined && altura < n.minH)    return false;
                                if (n.maxH    !== undefined && altura > n.maxH)    return false;
                                if (n.minArea !== undefined && area   < n.minArea) return false;
                                if (n.maxArea !== undefined && area   > n.maxArea) return false;
                                return true;
                            });
                            if (notaEncontrada) notaTexto = notaEncontrada.text;
                        }
                        break;
                    }
                }
            }

            document.querySelectorAll('input[type="checkbox"]').forEach(chk => {
                let label = document.querySelector(`label[for="${chk.id}"]`);
                if (!label) label = chk.parentElement.querySelector('label');
                if (!label) label = chk.closest('td');
                if (!label) return;

                const textoLabel = label.innerText.trim();
                if (!textoLabel.toLowerCase().includes(nomeMedida.toLowerCase())) return;
                if (nomeMedida.includes("Geral") && textoLabel.includes("Específicas")) return;
                if (nomeMedida.includes("Específicas") && !textoLabel.includes("Específicas")) return;

                const htmlNota = notaTexto
                    ? `<br><span class="check-visual" style="font-size:10px;color:#0056b3;background:#e8f4fd;padding:2px;border-radius:3px;display:inline-block;margin-top:2px;">ℹ️ ${notaTexto}</span>`
                    : "";

                if (chk.checked) {
                    if (!label.classList.contains('auditoria-ok')) {
                        label.style.border = "2px solid #28a745";
                        label.classList.add('auditoria-ok');
                        label.insertAdjacentHTML('beforeend', `<span class="check-visual"> ✅${htmlNota}</span>`);
                    }
                } else {
                    if (!label.classList.contains('auditoria-erro')) {
                        label.style.border = "2px solid #dc3545";
                        label.classList.add('auditoria-erro');
                        label.insertAdjacentHTML('beforeend', `<span class="check-visual"> ❌${htmlNota}</span>`);
                        erros++;
                    }
                }
            });
        });

        // --- NOTAS GERAIS ---
        let listaNotasGerais = [];

        // Busca notas gerais normais da divisão
        for (const grupo in NOTAS_GER) {
            if (grupo.split(',').map(s => s.trim().toUpperCase()).includes(divisao)) {
                listaNotasGerais = [...NOTAS_GER[grupo]];
                break;
            }
        }

        // Prepend: aviso de Tabela 5 (destaque no topo das notas)
        if (usandoTabela5) {
            const notaTabela5 = `📋 <strong>Atenção — Tabela 5 aplicada:</strong> A edificação de ocupação <strong>${divisao}</strong> possui área de <strong>${area} m²</strong> (≤ 900 m²) e altura de <strong>${altura} m</strong> (≤ 10 m). Foram aplicadas as exigências simplificadas da <strong>Tabela 5</strong> (Decreto Estadual MS). Caso a área ou a altura seja reclassificada, utilize as tabelas completas.`;
            listaNotasGerais = [notaTabela5, ...listaNotasGerais];
        } else if (dadosArea.sucesso) {
            // Se a área foi detectada mas não se enquadra na Tabela 5, informa o motivo
            const motivo = area > 900
                ? `área de ${area} m² (> 900 m²)`
                : `altura de ${altura} m (> 10 m)`;
            const notaTabNormal = `ℹ️ <strong>Tabelas normais aplicadas:</strong> Ocupação <strong>${divisao}</strong> — ${motivo}. Exigências completas em vigor.`;
            listaNotasGerais = [notaTabNormal, ...listaNotasGerais];
        }

        exibirNotasNaPagina(divisao, listaNotasGerais);

        console.log(`Auditor: Concluído — ${erros === 0 ? '✅ Sem erros' : `❌ ${erros} erro(s)`}`);
        return true;
    }

    // ===================================================================
    // 7. AGUARDAR DB_PSCIP E EXECUTAR (com retry)
    // ===================================================================
    function aguardarEAuditar(tentativas) {
        tentativas = tentativas || 0;
        if (tentativas > 60) {
            console.warn("Auditor: DB_PSCIP não encontrado após 30s. Encerrando.");
            return;
        }
        const ok = auditar();
        if (!ok) {
            setTimeout(() => aguardarEAuditar(tentativas + 1), 500);
        }
    }

    // ===================================================================
    // 8. MONITORAR CLIQUE NA ABA DE SEGURANÇA
    //    Detecta cliques em abas com texto "segurança contra incêndio"
    //    e reexecuta a auditoria após renderização.
    // ===================================================================
    function monitorarCliquesDeAba() {
        document.addEventListener('click', function(event) {
            let alvo = event.target;
            for (let i = 0; i < 5; i++) {
                if (!alvo) break;
                const txt  = (alvo.innerText || alvo.textContent || "").toLowerCase();
                const role = alvo.getAttribute('role') || "";
                const isTab = role === 'tab'
                    || alvo.classList.contains('ui-tabs-header')
                    || alvo.tagName === 'LI'
                    || alvo.classList.contains('ui-tabmenuitem');
                const isAlvo = txt.includes("segurança contra incêndio")
                    || txt.includes("segurança contra incendio")
                    || txt.includes("incêndio e pânico")
                    || txt.includes("incendio e panico");

                if (isTab && isAlvo) {
                    console.log("Auditor: Aba de Segurança clicada. Reagendando auditoria...");
                    setTimeout(() => aguardarEAuditar(), 800);
                    break;
                }
                alvo = alvo.parentElement;
            }
        }, true);
    }

    // ===================================================================
    // 9. INICIALIZAÇÃO
    // ===================================================================
    function init() {
        monitorarCliquesDeAba();
        aguardarEAuditar();
    }

    if (document.readyState === 'complete') {
        setTimeout(init, 1500);
    } else {
        window.addEventListener('load', () => setTimeout(init, 1500));
    }

})();