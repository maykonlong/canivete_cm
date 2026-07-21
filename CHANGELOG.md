# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2026-07-21

### Adicionado
- **package.json** com scripts start/lint/test e dependência ESLint
- **ESLint** (.eslintrc.json) com regras de segurança (no-eval, no-implied-eval, eqeqeq)
- **GitHub Actions CI** (.github/workflows/ci.yml) com Node 18/20, lint e testes automáticos
- **README.md** completo com funcionalidades, estrutura, desenvolvimento e segurança
- **CHANGELOG.md** (este arquivo)
- **AUDITORIA_PROJETO.md** com análise técnica completa (13 categorias)
- **Testes unitários** (tests/test_utils.mjs) — 39 testes cobrindo utilitários core
- **Structured Logger** (Logger.info/warn/error) com output JSON formatado
- **Shared readQRFromImage()** helper para leitura de QR Code com fallback de binarização
- **CORS Whitelist** no server.py com origins configuráveis e prefixos dinâmicos
- **SSRF Protection** no server.py — bloqueia acesso a localhost via proxy
- **Service Worker versionamento** com APP_VERSION, skipWaiting e clients.claim
- **Service Worker** estratégia Cache First para assets + Network First para API
- **DOMPurify** no popup.js — sanitização de conteúdo RSS com ALLOWED_TAGS restritivos

### Corrigido
- **Escopo de funções globais** — initTextQR, addToHistory, loadHistory, clearHistory, initHistory e displayHistory movidos para dentro do DOMContentLoaded handler (corrigia ReferenceError de showMessage)
- **Código duplicado** — lógica de leitura QR (~80 linhas) extraída para readQRFromImage()
- **console.error residual** substituído por Logger.error em initHash e initCSVJSON
- **displayHistory** usa DOM-safe textContent em vez de innerHTML com conteúdo do usuário

### Segurança
- CSP (Content-Security-Policy) no index.html
- DOMPurify para sanitização de HTML (RSS feeds, glossário)
- CORS whitelist no servidor Python
- SSRF protection no proxy
- Sem eval() ou new Function() no código

## [1.0.0] - Data anterior

### Adicionado
- 18 ferramentas de desenvolvimento
- PWA com Service Worker
- RSS Reader com extensão Chrome
- Código de Barras / Boleto
- Suporte offline