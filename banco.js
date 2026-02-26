// ==UserScript==
// @name         PSCIP - Banco de Dados (V9.5 - autoupdate)
// @namespace    http://tampermonkey.net/
// @version      9.5
// @updateURL    https://raw.githubusercontent.com/deskwar034/PSCIP-Scripts/refs/heads/main/banco.js
// @downloadURL  https://raw.githubusercontent.com/deskwar034/PSCIP-Scripts/refs/heads/main/banco.js
// @description  Banco de dados atualizavel com tabela 5
// @match        *://sistemas.bombeiros.ms.gov.br/analise-pscip/analisar.xhtml?projeto=*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("📂 Carregando Banco de Dados V9.5...");

    // ====================================================================
    // 1. DICIONÁRIO DE IDs (FIXO - NÃO APAGAR)
    // ====================================================================
    // Estes números correspondem aos itens do sistema. Mantenha isso.
    const ID = {
        ALARME: 1, BRIGADA: 2, CMAR: 3, EXTINTORES: 4, ILUMINACAO: 5,
        SAIDAS_GERAL: 6, SINALIZACAO: 7, VIATURAS: 8, BOMBEIRO_CIVIL: 9,
        CHUVEIROS: 10, COMP_HORIZ: 11, COMP_VERT: 12, SILOS_IGNICAO: 13,
        FUMACA: 14, SILOS_POS: 15, SILOS_TEMP: 16, DETECCAO: 17,
        ELEVADOR: 18, ESCADA_PRESS: 19, ESPUMA: 20, HIDRANTES: 21,
        PLANO: 22, RESFRIAMENTO: 23, SPDA: 24, SAIDAS_ESTADIO: 25,
        ESTRUTURAL: 26, SEPARACAO: 27, GASES_LIMPOS: 28
    };

    // Mapeamento dos textos que o robô lê na tela (Mantenha isso)
    const MAPA_TEXTO = {
        [ID.ALARME]: "Alarme de incêndio",
        [ID.BRIGADA]: "Brigada de Incêndio",
        [ID.CMAR]: "Controle de Materiais de Acabamento e Revestimento (CMAR)",
        [ID.EXTINTORES]: "Extintores de Incêndio",
        [ID.ILUMINACAO]: "Iluminação de emergência",
        [ID.SAIDAS_GERAL]: "Saídas de Emergência para Edificações em Geral - NT11",
        [ID.SINALIZACAO]: "Sinalização de emergência",
        [ID.VIATURAS]: "Acesso de Viaturas",
        [ID.BOMBEIRO_CIVIL]: "Bombeiro Civil",
        [ID.CHUVEIROS]: "Chuveiros Automáticos",
        [ID.COMP_HORIZ]: "Compartimentação Horizontal",
        [ID.COMP_VERT]: "Compartimentação Vertical",
        [ID.SILOS_IGNICAO]: "Controle de fontes de ignição para silos",
        [ID.FUMACA]: "Controle de fumaça",
        [ID.SILOS_POS]: "Controle de pós para silos",
        [ID.SILOS_TEMP]: "Controle de temperatura para silos",
        [ID.DETECCAO]: "Detecção de incêndio",
        [ID.ELEVADOR]: "Elevador de emergência",
        [ID.ESCADA_PRESS]: "Escada pressurizada",
        [ID.ESPUMA]: "Espuma para líquidos combustíveis/inflamáveis",
        [ID.HIDRANTES]: "Hidrantes e mangotinhos",
        [ID.PLANO]: "Plano de emergência",
        [ID.RESFRIAMENTO]: "Resfriamento para gases/líquidos combustíveis/inflamáveis",
        [ID.SPDA]: "SPDA - Sistema de Proteção contra Descargas Atmosféricas",
        [ID.SAIDAS_ESTADIO]: "Saídas de Emergência Específicas para Estádios, Ginásios, Circos, Rodeios e Similares - NT12",
        [ID.ESTRUTURAL]: "Segurança Estrutural",
        [ID.SEPARACAO]: "Separação entre edificações - isolamento de risco por afastamento e/ou parede corta-fogo",
        [ID.GASES_LIMPOS]: "Sistema fixo de gases limpos e CO2"
    };

    // ====================================================================
    // 2. KITS DE REGRAS (MODELOS)
    // ====================================================================
    // Crie seus kits aqui para não repetir código.

    const KIT_EXEMPLO_BASICO = [ID.EXTINTORES, ID.SINALIZACAO];

    const KIT_EXEMPLO_ALTURA = [
        { id: ID.HIDRANTES, minH: 12 }, // Só exige se altura >= 12m
        { id: ID.SPDA, minH: 10 }       // Só exige se altura >= 10m
    ];

    // ====================================================================
    // 3. REGRAS (ONDE VOCÊ VAI COLAR OS DADOS REAIS)
    // ====================================================================
    const REGRAS = {

"A-2, A-3": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CMAR, minH: 12.01 },      // Exigido acima de 12m
    { id: ID.ELEVADOR, minH: 80.01 }   // Conforme Nota 1
],
        "B-1, B-2": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.DETECCAO, minH: 0.01 },   // Exigido a partir de H > 0 (Térrea tem traço)
    { id: ID.COMP_HORIZ, minH: 0.01 }, // Exigido a partir de H > 0 (Térrea tem traço)
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.PLANO, minH: 23.01 },     // Exigido acima de 23m
    { id: ID.CHUVEIROS, minH: 23.01 }, // Exigido acima de 23m
    { id: ID.FUMACA, minH: 60.01 },    // Nota 8: Acima de 60m
    { id: ID.ELEVADOR, minH: 60.01 }   // Nota 9: Acima de 60m
],

        "C-1, C-2, C-3": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    ID.PLANO,
    ID.DETECCAO,
    { id: ID.COMP_VERT, minH: 12.01 },  // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 23.01 },  // Exigido acima de 23m
    { id: ID.FUMACA, minH: 60.01 },     // Nota 7: Acima de 60m
    { id: ID.ELEVADOR, minH: 60.01 }    // Nota 6: Acima de 60m
],


        "D-1, D-2, D-3, D-4": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 },  // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 30.01 },  // Exigido acima de 30m
    { id: ID.DETECCAO, minH: 30.01 },   // Exigido acima de 30m
    { id: ID.PLANO, minH: 60.01 },      // Nota 4: Acima de 60m
    { id: ID.FUMACA, minH: 60.01 },     // Nota 4: Acima de 60m
    { id: ID.ELEVADOR, minH: 60.01 }    // Nota 5: Acima de 60m
],

         "E-1, E-2, E-3, E-4, E-5, E-6": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 },  // Exigido acima de 12m
    { id: ID.PLANO, minH: 23.01 },      // Exigido acima de 23m
    { id: ID.DETECCAO, minH: 23.01 },   // Exigido acima de 23m
    { id: ID.CHUVEIROS, minH: 30.01 },  // Exigido acima de 30m
    { id: ID.FUMACA, minH: 60.01 },     // Nota 4: Acima de 60m
    { id: ID.ELEVADOR, minH: 60.01 }    // Nota 3: Acima de 60m
],

        "F-1": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.DETECCAO,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 },
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 60.01 }     // Nota 6: Acima de 60m
],
        "F-2": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 },
    { id: ID.DETECCAO, minH: 23.01 },  // Exigido acima de 23m
    { id: ID.FUMACA, minH: 60.01 },    // Nota 6: Acima de 60m
    { id: ID.ELEVADOR, minH: 60.01 }   // Nota 5: Acima de 60m
],

        "F-3, F-9": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 },
    { id: ID.CHUVEIROS, minH: 12.01 },
    { id: ID.FUMACA, minH: 60.01 } // Nota 6: Acima de 60m
],

"F-4": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.DETECCAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    ID.CHUVEIROS,
    { id: ID.COMP_VERT, minH: 12.01 },
    { id: ID.FUMACA, minH: 60.01 } // Nota 6: Acima de 60m
],

"F-5, F-6": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.DETECCAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 },
    { id: ID.CHUVEIROS, minH: 30.01 },
    { id: ID.FUMACA, minH: 60.01 } // Nota 6: Acima de 60m
],

"F-8": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_HORIZ, minH: 12.01 },
    { id: ID.DETECCAO, minH: 12.01 },
    { id: ID.COMP_VERT, minH: 12.01 },
    { id: ID.CHUVEIROS, minH: 30.01 },
    { id: ID.FUMACA, minH: 60.01 } // Nota 6: Acima de 60m
],

        "F-7": [
    ID.VIATURAS,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.SINALIZACAO,
    ID.EXTINTORES
],

"F-10": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.DETECCAO, minH: 6.01 },
    { id: ID.COMP_VERT, minH: 12.01 },
    { id: ID.CHUVEIROS, minH: 23.01 },
    { id: ID.FUMACA, minH: 30.01 } // Nota 5: Acima de 60m (marcado na coluna >30)
],

        "G-1, G-2": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 23.01 }, // Exigido acima de 23m
    { id: ID.DETECCAO, minH: 30.01 },  // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

        "G-3": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 23.01 }, // Exigido acima de 23m
    { id: ID.DETECCAO, minH: 30.01 },  // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"G-4": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 23.01 }, // Exigido acima de 23m
    { id: ID.DETECCAO, minH: 30.01 },  // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

        "G-5": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.DETECCAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    ID.ESPUMA,
    { id: ID.COMP_VERT, minH: 0.01 } // Traço na Térrea (0), X nas demais (H > 0)
],

        "H-1": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.DETECCAO, minH: 30.01 },  // Exigido acima de 30m
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"H-2": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.DETECCAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

        "H-3": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.PLANO,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.DETECCAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_HORIZ, minH: 0.01 }, // Traço na Térrea, X nas demais
    { id: ID.COMP_VERT, minH: 6.01 },  // Exigido acima de 6m
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"H-4": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

        "H-5": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.DETECCAO, minH: 0.01 },   // Traço na Térrea, X nas demais
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"H-6": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.DETECCAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"I-1": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_HORIZ, minH: 0.01 }, // Traço na Térrea, X nas demais
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.DETECCAO, minH: 30.01 },  // Exigido acima de 30m
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"I-2": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_HORIZ, minH: 0.01 }, // Traço na Térrea, X nas demais
    { id: ID.PLANO, minH: 12.01 },     // Exigido acima de 12m
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.DETECCAO, minH: 23.01 },  // Exigido acima de 23m
    { id: ID.CHUVEIROS, minH: 23.01 }, // Exigido acima de 23m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],
        "I-3": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.DETECCAO, minH: 12.01 },   // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 12.01 },  // Exigido acima de 12m
    { id: ID.FUMACA, minH: 30.01 }      // Exigido acima de 30m
],

        "J-1": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    { id: ID.CMAR, minH: 0.01 },       // Traço na Térrea, X a partir de H>0
    { id: ID.ALARME, minH: 12.01 },    // Exigido acima de 12m
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.HIDRANTES, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.DETECCAO, minH: 30.01 },  // Exigido acima de 30m
    { id: ID.CHUVEIROS, minH: 30.01 }, // Exigido acima de 30m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"J-2": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.DETECCAO, minH: 23.01 },  // Exigido acima de 23m
    { id: ID.CHUVEIROS, minH: 23.01 }, // Exigido acima de 23m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"J-3": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.DETECCAO, minH: 12.01 },  // Exigido acima de 12m
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],

"J-4": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.DETECCAO, minH: 12.01 },  // Exigido acima de 12m
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.FUMACA, minH: 30.01 }     // Exigido acima de 30m
],


        "M-3": [
    ID.VIATURAS,
    ID.ESTRUTURAL,
    ID.COMP_HORIZ,
    ID.CMAR,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    { id: ID.DETECCAO, minH: 6.01 },   // Exigido acima de 6m
    { id: ID.COMP_VERT, minH: 12.01 }, // Exigido acima de 12m
    { id: ID.PLANO, minH: 12.01 },     // Exigido acima de 12m
    { id: ID.CHUVEIROS, minH: 12.01 }  // Exigido acima de 12m
],

"M-4": [
    ID.VIATURAS,
    ID.SAIDAS_GERAL,
    ID.ILUMINACAO,
    ID.BRIGADA,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES
],

"M-7": [
    ID.VIATURAS,
    ID.SAIDAS_GERAL,
    ID.BRIGADA,
    ID.SINALIZACAO,
    ID.EXTINTORES
],

"M-5": [
    ID.VIATURAS,
    ID.SAIDAS_GERAL,
    ID.PLANO,
    ID.BRIGADA,
    ID.ILUMINACAO,
    ID.SILOS_TEMP,
    ID.ALARME,
    ID.SINALIZACAO,
    ID.EXTINTORES,
    ID.HIDRANTES,
    ID.CHUVEIROS,
    ID.SILOS_IGNICAO,
    ID.SILOS_POS,
    ID.SPDA
],

// === Adicionar em NOTAS_ESP ===

        // --- EXEMPLO X-1 (Simples) ---
        // Se o sistema detectar "X-1" na tela, exige estes itens:
        "X-1": [
            ...KIT_EXEMPLO_BASICO, // Puxa Extintores e Sinalização
            ID.ILUMINACAO,         // Adiciona Iluminação
            { id: ID.SAIDAS_GERAL, maxH: 12 } // Saída Geral só se for baixo (<12m)
        ],

        // --- EXEMPLO X-2 (Complexo com Altura) ---
        "X-2": [
            ...KIT_EXEMPLO_BASICO,
            ...KIT_EXEMPLO_ALTURA, // Puxa Hidrante e SPDA condicionais
            { id: ID.BRIGADA, minH: 20 }, // Brigada só se for muito alto
            ID.ALARME // Alarme sempre
        ]

        // COLE SUAS REGRAS REAIS AQUI...
        // "A-2": [ ... ],
        // "F-6": [ ... ],
    };

    // ====================================================================
    // 4. NOTAS ESPECÍFICAS (Vinculadas ao Item)
    // ====================================================================
    const NOTAS_ESP = {


        "A-2, A-3": {
    [ID.SAIDAS_GERAL]: [{ minH: 30.01, text: "Nota 1: Deve haver Elevador de Emergência para altura maior que 80 m." }],
    [ID.COMP_VERT]: "Nota 2: Pode ser substituída por sistema de controle de fumaça somente nos átrios."
},


        "B-1, B-2": {
    [ID.COMP_HORIZ]: [
        { maxH: 12, text: "Nota 1: Pode ser substituído por sistema de chuveiros automáticos." },
        { minH: 12.01, maxH: 30, text: "Nota 2: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos." }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." },
        { minH: 30.01, text: "Nota 7: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT – Compartimentação horizontal e compartimentação vertical." }
    ],
    [ID.ILUMINACAO]: [
        { maxH: 6, text: "Nota 4: Estão isentos os motéis que não possuam corredores internos de serviço." }
    ],
    [ID.DETECCAO]: [
        { maxH: 12, text: "Nota 5: Os detectores de incêndio devem ser instalados em todos os quartos." }
    ],
    [ID.ALARME]: "Nota 6: Os acionadores manuais devem ser instalados nas áreas de circulação.",
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 9: Deve haver Elevador de Emergência para altura acima de 60 m." }
    ],
    [ID.FUMACA]: "Nota 8: Acima de 60 metros de altura."
},

        "C-1, C-2, C-3": {
    [ID.COMP_HORIZ]: [
        { maxH: 6, text: "Nota 1: Pode ser substituído por sistema de chuveiros automáticos." },
        { minH: 6.01, text: "Nota 2: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos." }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 8: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." },
        { minH: 12.01, maxH: 23, text: "Nota 9: Deve haver controle de fumaça nos átrios, podendo ser dimensionados como sendo padronizados conforme NT – Controle de Fumaça." },
        { minH: 23.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." },
        { minH: 30.01, text: "Nota 10: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT - Compartimentação horizontal e compartimentação vertical." }
    ],
    [ID.PLANO]: [
        { maxH: 23, text: "Nota 4: Para as edificações da divisão C-3 (shopping centers)." }
    ],
    [ID.DETECCAO]: [
        { maxH: 30, text: "Nota 5: Somente para as áreas de depósitos superiores a 750 m²." }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 6: Deve haver Elevador de Emergência para altura acima de 60 m." }
    ],
    [ID.FUMACA]: "Nota 7: Acima de 60 metros de altura."
},


        "D-1, D-2, D-3, D-4": {
    [ID.COMP_HORIZ]: [
        { maxH: 12, text: "Nota 1: Pode ser substituído por sistema de chuveiros automáticos." },
        { minH: 12.01, maxH: 30, text: "Nota 2: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos." }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 6: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." },
        { minH: 12.01, maxH: 23, text: "Nota 7: Deve haver controle de fumaça nos átrios, podendo ser dimensionados como sendo padronizados conforme NT – Controle de Fumaça." },
        { minH: 23.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." },
        { minH: 30.01, text: "Nota 8: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT - Compartimentação horizontal e compartimentação vertical." }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 5: Deve haver Elevador de Emergência para altura acima de 60 m." }
    ],
    [ID.PLANO]: "Nota 4: Edificações acima de 60 m de altura.",
    [ID.FUMACA]: "Nota 4: Edificações acima de 60 m de altura."
},


        "E-1, E-2, E-3, E-4, E-5, E-6": {
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 1: A compartimentação vertical será considerada para as fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 30.01, text: "Nota 2: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT - Compartimentação horizontal e compartimentação vertical;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 3: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.FUMACA]: "Nota 4: Acima de 60 m de altura."
},


        "F-1": {
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 2: Pode ser substituído por sistema de chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 23.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 30.01, text: "Nota 7: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT - Compartimentação horizontal e compartimentação vertical;" }
    ],
    [ID.PLANO]: "Nota 4: Somente para locais com público acima de 1000 pessoas;",
    [ID.FUMACA]: "Nota 6: Acima de 60 metros de altura."
},

"F-2": {
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 1: A compartimentação vertical será considerada para as fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 23.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 30.01, text: "Nota 7: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT - Compartimentação horizontal e compartimentação vertical;" }
    ],
    [ID.PLANO]: "Nota 4: Somente para locais com público acima de 1000 pessoas;",
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 5: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.FUMACA]: "Nota 6: Acima de 60 metros de altura."
},


        "F-3, F-9": {
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 1: A compartimentação vertical será considerada para as fachadas e selagens dos shafts e dutos de instalações." }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 5: Deve haver Elevador de Emergência para altura maior que 60 m." }
    ],
    [ID.PLANO]: "Nota 4: Somente para a divisão F-3.",
    [ID.CHUVEIROS]: "Nota 7: Não exigido nas arquibancadas. Nas áreas internas, verificar exigências conforme o uso ou ocupação específica. Para divisão F-3, verificar também NT-12.",
    [ID.FUMACA]: "Nota 6: Acima de 60 metros de altura."
},

"F-4": {
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 1: A compartimentação vertical será considerada para as fachadas e selagens dos shafts e dutos de instalações." },
        { minH: 23.01, maxH: 30, text: "Nota 1: A compartimentação vertical será considerada para as fachadas e selagens dos shafts e dutos de instalações. Nota 2: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 5: Deve haver Elevador de Emergência para altura maior que 60 m." }
    ],
    [ID.PLANO]: "Nota 3: Somente para locais com público acima de 1000 pessoas.",
    [ID.DETECCAO]: "Nota 9: Para os locais onde haja carga incêndio como depósitos, escritórios, cozinhas, pisos técnicos, casa de máquinas, etc., e nos locais de reunião de público onde houver teto ou forro falso com revestimento combustível.",
    [ID.CHUVEIROS]: [
        { maxH: 23, text: "Nota 8: Exigido para áreas edificadas superiores a 10.000 m². Nas áreas internas, verificar exigências conforme uso ou ocupação específica." }
    ],
    [ID.FUMACA]: "Nota 6: Acima de 60 metros de altura."
},

        "F-5, F-6": {
    [ID.COMP_HORIZ]: [
        { maxH: 12, text: "Nota 1: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos." }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 2: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 60.01, text: "Nota 5: Deve haver Elevador de Emergência para altura maior que 60 m." }
    ],
    [ID.PLANO]: "Nota 4: Somente para locais com público acima de 1000 pessoas.",
    [ID.DETECCAO]: [
        { maxH: 12, text: "Nota 3: Para os locais onde haja carga incêndio como depósitos, escritórios, cozinhas, pisos técnicos, casa de máquinas, etc., e nos locais de reunião de público onde houver teto ou forro falso com revestimento combustível." }
    ],
    [ID.FUMACA]: "Nota 6: Acima de 60 metros de altura."
},

"F-8": {
    [ID.COMP_HORIZ]: [
        { minH: 12.01, maxH: 23, text: "Nota 1: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos." }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 2: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 60.01, text: "Nota 5: Deve haver Elevador de Emergência para altura maior que 60 m." }
    ],
    [ID.PLANO]: "Nota 4: Somente para locais com público acima de 1000 pessoas.",
    [ID.FUMACA]: "Nota 6: Acima de 60 metros de altura."
},


        "F-7": {
    [ID.PLANO]: "Nota 3: Somente para locais com público acima de 1000 pessoas;"
},

"F-10": {
    [ID.COMP_HORIZ]: [
        { maxH: 23, text: "Nota 1: Pode ser substituído por sistema de chuveiros automáticos;" }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 2: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 4: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.PLANO]: "Nota 3: Somente para locais com público acima de 1000 pessoas;",
    [ID.FUMACA]: "Nota 5: Acima de 60 metros de altura."
},

        "G-1, G-2": {
    [ID.ALARME]: "1. Deve haver pelo menos uma acionador manual, por pavimento, a no máximo 5 m da saída de emergência;",
    [ID.SAIDAS_GERAL]: { minH: 30.01, text: "2. Deve haver Elevador de Emergência para altura maior que 60 m;" },
    [ID.FUMACA]: "3. Acima de 60 metros de altura, sendo dispensado caso a edificação seja aberta lateralmente;",
    [ID.COMP_VERT]: "4. Exigido para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;"
},

        "G-3": {
    [ID.ALARME]: "Nota 2: Deve haver pelo menos um acionador manual, por pavimento, a no máximo 5 m da saída de emergência.",
    [ID.SAIDAS_GERAL]: [{ minH: 30.01, text: "Nota 3: Deve haver Elevador de Emergência para altura maior que 60 m." }],
    [ID.FUMACA]: "Nota 4: Acima de 60 metros de altura.",
    [ID.COMP_VERT]: "Nota 5: Exigido para as compartimentações das fachadas e selagens dos shafts e dutos de instalações."
},

"G-4": {
    [ID.COMP_HORIZ]: [{ maxH: 30, text: "Nota 1: Pode ser substituído por sistema de chuveiros automáticos." }],
    [ID.ALARME]: "Nota 2: Deve haver pelo menos um acionador manual, por pavimento, a no máximo 5 m da saída de emergência.",
    [ID.SAIDAS_GERAL]: [{ minH: 30.01, text: "Nota 3: Deve haver Elevador de Emergência para altura maior que 60 m." }],
    [ID.FUMACA]: "Nota 4: Acima de 60 metros de altura.",
    [ID.COMP_VERT]: "Nota 5: Exigido para as compartimentações das fachadas e selagens dos shafts e dutos de instalações."
},

        "G-5": {
    [ID.PLANO]: "Nota 1: Somente para áreas superiores a 5.000 m²;",
    [ID.DETECCAO]: [
        { maxH: 0, text: "Nota 1: Somente para áreas superiores a 5.000 m²;" } // Nota apenas na coluna Térrea
    ],
    [ID.EXTINTORES]: "Nota 2: Prever extintores portáteis e extintores sobre rodas, conforme regradas da NT – Sistema de proteção por extintores de incêndio;",
    [ID.ESPUMA]: "Nota 3: Não exigido entre 750 m² e 2.000 m². Para áreas entre 2.000 m² e 5.000 m², o sistema de espuma pode ser manual. Para áreas superiores a 5.000 m², o sistema de espuma deve ser fixo por meio de chuveiros, tipo dilúvio, podendo ser setorizado; quando automatizado, deve-se interligar ao sistema de detecção automática de incêndio. Para o dimensionamento, ver NT – Sistema de chuveiros automáticos e NT – Segurança contra incêndio para líquidos combustíveis e inflamáveis."
},

        "H-1, H-2": {
    [ID.DETECCAO]: [
        { text: "Nota 1: Os detectores deverão ser instalados em todos os quartos;" } // Nota aplicada onde houver Detecção (H-2 geral, H-1 >30m)
    ],
    [ID.ALARME]: "Nota 2: Acionadores manuais serão obrigatórios nos corredores;",
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 3: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 23.01, maxH: 30, text: "Nota 4: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 30.01, text: "Nota 7: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT – Compartimentação horizontal e compartimentação vertical." }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 5: Deve haver Elevador de Emergência para altura acima de 60 m;" }
    ],
    [ID.FUMACA]: "Nota 6: Acima de 60 metros de altura;"
},

        "H-3": {
    [ID.ALARME]: "Nota 1: Acionadores manuais serão obrigatórios nos corredores;",
    [ID.COMP_HORIZ]: "Nota 6: Pode ser substituída por chuveiros automáticos;",
    [ID.COMP_VERT]: [
        { minH: 6.01, maxH: 12, text: "Nota 8: Exigido para selagens dos shafts e dutos de instalações;" },
        { minH: 12.01, maxH: 30, text: "Nota 2: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 30.01, text: "Nota 7: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT – Compartimentação horizontal e compartimentação vertical;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 12.01, text: "Nota 3: Deve haver Elevador de Emergência;" }
    ],
    [ID.FUMACA]: "Nota 5: Acima de 60 metros de altura;"
},

"H-4": {
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 2: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 30.01, text: "Nota 7: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT – Compartimentação horizontal e compartimentação vertical;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 4: Deve haver Elevador de Emergência para altura acima de 60 m;" }
    ],
    [ID.FUMACA]: "Nota 5: Acima de 60 metros de altura;"
},


"H-5": {
    [ID.DETECCAO]: "Nota 1: Para a Divisão H-5, as prisões em geral (Casas de Detenção, Penitenciárias, Presídios, etc.) não é necessário detecção automática de incêndio. Para os hospitais psiquiátricos e assemelhados, prever detecção em todos os quartos;",
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 4: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.FUMACA]: "Nota 5: Acima de 60 metros de altura;"
},

"H-6": {
    [ID.COMP_HORIZ]: [
        { maxH: 12, text: "Nota 6: Pode ser substituída por chuveiros automáticos;" },
        { minH: 12.01, maxH: 30, text: "Nota 7: Pode ser substituída por sistema de detecção de incêndio e chuveiros automáticos;" }
    ],
    [ID.DETECCAO]: [
        { maxH: 30, text: "Nota 2: Somente nos quartos, se houver;" }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 8: Pode ser substituído por sistema de detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações. Nota 9: Deverá haver controle de fumaça nos átrios, podendo ser dimensionada como sendo padronizados conforme NT-15;" },
        { minH: 23.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 30.01, text: "Nota 10: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, até 60 metros de altura, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações, sendo que para altura superior deve-se, adicionalmente, adotar as soluções contidas na NT – Compartimentação horizontal e compartimentação vertical;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 4: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.FUMACA]: "Nota 5: Acima de 60 metros de altura;"
},

"I-1": {
    [ID.COMP_HORIZ]: "Nota 1: Pode ser substituída por sistema de chuveiros automáticos;",
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 2: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.FUMACA]: "Nota 3: Acima de 60 metros de altura;"
},

"I-2": {
    [ID.COMP_HORIZ]: "Nota 1: Pode ser substituída por sistema de chuveiros automáticos;",
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 2: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.FUMACA]: "Nota 3: Acima de 60 metros de altura;"
},

        "J-1": {
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 2: Exigido para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 23.01, maxH: 30, text: "Nota 2: Exigido para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 3: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.FUMACA]: "Nota 4: Acima de 60 metros de altura;"
},

        "I-3": {
    [ID.COMP_HORIZ]: [
        { maxH: 23, text: "Nota 1: Pode ser substituída por sistema de chuveiros automáticos." }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 2: Deve haver Elevador de Emergência para altura maior que 60 m." }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações." }
    ]
},

"J-2": {
    [ID.COMP_HORIZ]: "Nota 1: Pode ser substituído por sistema de chuveiros automáticos;",
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 23, text: "Nota 5: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" },
        { minH: 23.01, maxH: 30, text: "Nota 5: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 3: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ],
    [ID.FUMACA]: "Nota 4: Acima de 60 metros de altura;"
},

"J-3, J-4": {
    [ID.COMP_HORIZ]: [
        { maxH: 30, text: "Nota 1: Pode ser substituído por sistema de chuveiros automáticos;" }
    ],
    [ID.COMP_VERT]: [
        { minH: 12.01, maxH: 30, text: "Nota 3: Pode ser substituído por sistema de controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para as compartimentações das fachadas e selagens dos shafts e dutos de instalações;" }
    ],
    [ID.SAIDAS_GERAL]: [
        { minH: 30.01, text: "Nota 2: Deve haver Elevador de Emergência para altura maior que 60 m;" }
    ]
},

        "M-3": {
    [ID.CHUVEIROS]: [
        { minH: 12.01, maxH: 30, text: "Nota 1: O sistema de chuveiros automáticos para a divisão M-3 pode ser substituído por sistema de gases, através de supressão total do ambiente." }
    ],
    [ID.HIDRANTES]: [
        { maxH: 12, text: "Nota 2: Somente para edificações com área construída superior a 900 m²." }
    ]
},

"M-4, M-7": {
    [ID.SAIDAS_GERAL]: "Nota 1: Para M-4: aceitam-se as próprias saídas da edificação, podendo as escadas ser do tipo NE. Para M-7: aceitam-se os arruamentos entre as quadras de armazenamento (vide NT - Pátio de contêiner)."
},

"M-5": {
    [ID.PLANO]: "Nota 1: Áreas de risco que possuam mais de um depósito de silagem;",
    [ID.ILUMINACAO]: "Nota 2: Somente para as áreas de circulação;",
    [ID.SILOS_TEMP]: "Nota 3: Observar regras e condições particulares para essa medida na NT- Armazenamento em silos;",
    [ID.HIDRANTES]: "Nota 3: Observar regras e condições particulares para essa medida na NT- Armazenamento em silos;",
    [ID.CHUVEIROS]: "Nota 3: Observar regras e condições particulares para essa medida na NT- Armazenamento em silos;",
    [ID.SILOS_IGNICAO]: "Nota 4: Nas áreas de acúmulo de pós;",
    [ID.SILOS_POS]: "Nota 4: Nas áreas de acúmulo de pós;"
},

        // Exemplo: Nota fixa para X-1 no item Iluminação
        "X-1": {
            [ID.ILUMINACAO]: "Nota de exemplo: Verificar autonomia de 1h."
        },

        // Exemplo: Nota variável por altura para X-2 no item Hidrantes
        "X-2": {
            [ID.HIDRANTES]: [
                { maxH: 12, text: "Nota Baixa: Hidrante Tipo 1." },
                { minH: 12.01, maxH: 30, text: "Nota Média: Hidrante Tipo 2." },
                { minH: 30.01, text: "Nota Alta: Hidrante Tipo 3 com Bomba Jóquei." }
            ]
        }
    };


    // ====================================================================
    // 5. NOTAS GERAIS (Vinculadas à Tabela/Grupo)
    // ====================================================================
    const NOTAS_GER = {

        "A-2, A-3": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "B-1, B-2": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "C-1, C-2, C-3": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "D-1, D-2, D-3, D-4": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],


"E-1, E-2, E-3, E-4, E-5, E-6": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Os locais destinados a laboratórios devem ter proteção em função dos produtos utilizados;",
    "d. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "F-1, F-2": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "F-3, F-9, F-4": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Os locais de comércio ou atividades distintas das divisões F-3, F-4 e F-9 terão as medidas de proteção conforme suas respectivas ocupações;",
    "d. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "F-5, F-6, F-8": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Nos locais de concentração de público, é obrigatória, antes do início de cada evento, a explanação ao público da localização das saídas de emergência, bem como dos sistemas de segurança contra incêndio e pânico existentes no local;",
    "d. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "F-7, F-10": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. A Divisão F-7 com altura superior a 6 metros será composta uma comissão para definição das medidas de Segurança Contra Incêndio e Pânico;",
    "d. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas, em especial a NT – Centros esportivos e de exibição – requisitos de segurança contra incêndio.."
],

        "G-1, G-2": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "G-3, G-4": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas"
],

        "G-5": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Deve haver sistema de drenagem de líquidos nos pisos dos hangares para bacias de contenção à distância;",
    "d. Não é permitido o armazenamento de líquidos combustíveis ou inflamáveis dentro dos hangares;",
    "e. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "H-1, H-2": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "H-3, H-4": [
    "Nota 9 (H-4): As áreas administrativas devem ser consideradas como D-1 e hotéis de trânsito devem ser enquadrados como B-1;",
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],


"H-5, H-6": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

"I-1, I-2, I-3": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

        "J-1, J-2": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas;",
    "d. Em qualquer tipo de ocupação, sempre que houver depósito de materiais combustíveis (J-2, J-3, J-4), dispostos em áreas descobertas, serão exigidos nestes locais: d1. Proteção por sistema de hidrantes e brigada de incêndio para áreas delimitadas de depósitos superiores a 2.500 m²; d2. Proteção por extintores, podendo os mesmos ficar agrupados em abrigos nas extremidades do terreno, com percurso máximo de 50m; d3. Recuos e afastamentos das divisas do lote (terreno): limite do passeio público de 3,0 m; limite das divisas laterais e dos fundos de 2,0 m; limite de bombas de combustíveis, equipamentos e máquinas que produzam calor e outras fontes de ignição de 3,0 m; d4. O depósito deverá estar disposto em lotes máximos de 20 m de comprimentos e largura, separados por corredores entre lotes com largura mínima de 1,5 m."
],

"J-3, J-4": [
    "a. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "b. Para subsolos ocupados ver Tabela 7;",
    "c. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas;",
    "d. Em qualquer tipo de ocupação, sempre que houver depósito de materiais combustíveis (J-2, J-3, J-4), dispostos em áreas descobertas, serão exigidos nestes locais: d1. Proteção por sistema de hidrantes e brigada de incêndio para áreas delimitadas de depósitos superiores a 2.500 m²; d2. Proteção por extintores, podendo os mesmos ficar agrupados em abrigos nas extremidades do terreno, com percurso máximo de 50m; d3. Recuos e afastamentos das divisas do lote (terreno): limite do passeio público de 3,0 m; limite das divisas laterais e dos fundos de 2,0 m; limite de bombas de combustíveis, equipamentos e máquinas que produzam calor e outras fontes de ignição de 3,0 m; d4. O depósito deverá estar disposto em lotes máximos de 20 m de comprimentos e largura, separados por corredores entre lotes com largura mínima de 1,5 m."
],

        "M-3": [
    "a. Para as subestações elétricas deve-se observar também os critérios da NT - Subestações elétricas;",
    "b. As instalações elétricas e SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "c. Para subsolos ocupados ver Tabela 7;",
    "d. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

"M-4, M-7": [
    "a. Observar também as exigências da NT - Pátio de contêiner;",
    "b. As áreas a serem consideradas para M-7 são as áreas dos terrenos abertos (lotes) onde há depósitos contêineres;",
    "c. Quando houver edificação (construção) dentro do terreno das áreas de riscos, deve-se também verificar as exigências particulares para cada ocupação. Casos específicos, compor comissão;",
    "d. As instalações elétricas e SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "e. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],

"M-5": [
    "a. Observar ainda as exigências particulares da NT - Armazenamento em silos;",
    "b. As instalações elétricas e o SPDA devem estar em conformidade com as normas técnicas oficiais;",
    "c. Para subsolos ocupados ver Tabela 7;",
    "d. Observar ainda as exigências para os riscos específicos das respectivas Normas Técnicas."
],
        // Estas notas aparecem no rodapé do painel para qualquer X-1 ou X-2
        "X-1, X-2": [
            "Nota Geral A: Esta é uma nota de rodapé de exemplo.",
            "Nota Geral B: Verificar validade do ART."
        ]
    };

    // ====================================================================

    // ====================================================================
    // 6. REGRAS DA TABELA 5
    //    Aplicável quando: área construída ≤ 900 m² E altura ≤ 10 m
    //    Fonte: Decreto Estadual MS - Tabela 5 (Lei nº 4.921/2016)
    // ====================================================================
    const REGRAS_TABELA5 = {

        // Colunas "A, D, E e G" — CMAR somente se área > 750 m² (X²)
        "A-1, A-2, A-3, D-1, D-2, D-3, D-4, E-1, E-2, E-3, E-4, E-5, E-6, G-1, G-2, G-3, G-4, G-5": [
            { id: ID.CMAR, minArea: 750.01 }, // X² — exigido apenas se área > 750 m²
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES
            // Brigada: traço (não exigida)
        ],

        // Coluna "B"
        "B-1, B-2": [
            ID.CMAR,
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES
            // Brigada: traço
        ],

        // Coluna "C" — CMAR somente se área > 750 m² (X²)
        "C-1, C-2, C-3": [
            { id: ID.CMAR, minArea: 750.01 }, // X²
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES
            // Brigada: traço
        ],

        // Coluna "F2, F3, F4, F6, F7 e F8" — Brigada X¹ (> 100 pessoas)
        "F-2, F-3, F-4, F-6, F-7, F-8": [
            ID.CMAR,
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES,
            ID.BRIGADA  // X¹ — ver nota específica
        ],

        // Coluna "F1 e F5" — Brigada X¹
        "F-1, F-5": [
            ID.CMAR,
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES,
            ID.BRIGADA  // X¹ — ver nota específica
        ],

        // Coluna "F9 e F10" — sem CMAR, Brigada X¹
        "F-9, F-10": [
            // CMAR: traço (não exigido)
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES,
            ID.BRIGADA  // X¹ — ver nota específica
        ],

        // Coluna "H1, H4 e H6" — sem CMAR, sem Brigada
        "H-1, H-4, H-6": [
            // CMAR: traço
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES
            // Brigada: traço
        ],

        // Coluna "H2, H3 e H5"
        "H-2, H-3, H-5": [
            ID.CMAR,
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES
            // Brigada: traço
        ],

        // Colunas "I e J" — CMAR somente se área > 750 m² (X²)
        "I-1, I-2, J-1, J-2, J-3, J-4": [
            { id: ID.CMAR, minArea: 750.01 }, // X²
            ID.SAIDAS_GERAL,
            ID.ILUMINACAO,
            ID.SINALIZACAO,
            ID.EXTINTORES
            // Brigada: traço
        ],

        // Coluna "L1" — sem Iluminação, Brigada sempre exigida (X)
        "L-1": [
            ID.CMAR,
            ID.SAIDAS_GERAL,
            // Iluminação: traço (não exigida para L-1)
            ID.SINALIZACAO,
            ID.EXTINTORES,
            ID.BRIGADA  // X — sempre exigida (não é X¹)
        ]
    };

    // ====================================================================
    // 7. NOTAS ESPECÍFICAS DA TABELA 5
    //    Nota X¹: Brigada exigida apenas se lotação > 100 pessoas
    //    Nota X²: CMAR exigido apenas se área > 750 m²
    // ====================================================================
    const NOTAS_ESP_TABELA5 = {

        // Brigada X¹ — grupos F (exceto L-1 que é X normal)
        "F-1, F-2, F-3, F-4, F-5, F-6, F-7, F-8, F-9, F-10": {
            [ID.BRIGADA]: "X¹ (Tabela 5) — Brigada de Incêndio exigida somente para edificações com lotação superior a 100 pessoas. Confirmar a capacidade/lotação do projeto."
        },

        // CMAR X² — grupos A, D, E, G, C, I, J
        "A-1, A-2, A-3, D-1, D-2, D-3, D-4, E-1, E-2, E-3, E-4, E-5, E-6, G-1, G-2, G-3, G-4, G-5, C-1, C-2, C-3, I-1, I-2, J-1, J-2, J-3, J-4": {
            [ID.CMAR]: "X² (Tabela 5) — Controle de Materiais de Acabamento exigido apenas para edificações com área construída superior a 750 m². (Acrescentado pela Lei Estadual nº 4.921 de 20/09/2016)"
        }
    };

    // ====================================================================
    // EXPORTAÇÃO (NÃO MEXER)
    // ====================================================================
    window.DB_PSCIP = {
        MAPA_REQUISITOS: MAPA_TEXTO,
        REGRAS: REGRAS,
        NOTAS_ESPECIFICAS: NOTAS_ESP,
        NOTAS_GERAIS: NOTAS_GER,
        // Tabela 5 (área ≤ 900m² e altura ≤ 10m)
        REGRAS_TABELA5: REGRAS_TABELA5,
        NOTAS_ESP_TABELA5: NOTAS_ESP_TABELA5
    };

})();
