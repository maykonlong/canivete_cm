# 🔧 Canivete Suíço Dev

Ferramentas de desenvolvimento offline — tudo num único HTML, sem dependências externas em tempo de execução.

![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Funcionalidades

| Categoria | Ferramenta |
|-----------|-----------|
| **Codificação** | Base64 ↔ Imagem · Texto ↔ Base64 · URL Encode/Decode · HTML Entities |
| **Segurança & Auth** | JWT Decode · Gerador de Hash (SHA-1, SHA-256, SHA-512) |
| **Dados & Utilities** | Timestamp ↔ Data · Conversor de Cores · Texto ↔ QR Code · Código de Barras/Boleto · RSS Reader · Histórico · Binário/Hex ↔ Texto · CSV ↔ JSON |
| **Formatadores** | JSON Formatter · SQL Formatter · RegEx Tester · XML/HTML Beautifier |

## 🚀 Como Usar

### Modo Offline (GitHub Pages / arquivo local)

Abra `index.html` diretamente no navegador. Tudo funciona offline via Service Worker.

### Servidor Local (com proxy RSS)

```bash
# Python 3.8+
python server.py
# Abre automaticamente http://127.0.0.1:8765
```

O servidor local oferece:
- Proxy `/api/proxy?url=` para feeds RSS com CORS
- Endpoint `/api/health` para monitoramento
- Auto-detecta porta disponível se 8765 estiver ocupada

### Iniciar com duplo-clique

Execute `iniciar.bat` (Windows) para iniciar o servidor automaticamente.

## 📁 Estrutura do Projeto

```
QRcode/
├── index.html              # App principal (SPA)
├── css/style.css           # Estilos
├── js/app.js               # Lógica principal
├── sw.js                   # Service Worker (PWA)
├── manifest.json           # Manifest PWA
├── server.py               # Servidor local Python
├── libs/                   # Bibliotecas vendored (offline)
│   ├── qrcode.min.js
│   ├── jsQR.min.js
│   ├── papaparse.min.js
│   ├── sql-formatter.min.js
│   ├── vkbeautify.min.js
│   ├── dompurify.min.js
│   └── JsBarcode.all.min.js
├── codigo_de_barras/       # Módulo código de barras
├── RSS_extensão/           # RSS Reader (extensão Chrome + iframe)
├── tests/                  # Testes unitários
├── .eslintrc.json          # Configuração ESLint
├── .github/workflows/ci.yml # CI GitHub Actions
└── package.json            # Dependências de desenvolvimento
```

## 🛠 Desenvolvimento

### Instalar dependências de dev

```bash
npm install
```

### Lint

```bash
npm run lint        # Verificar problemas
npm run lint:fix    # Corrigir automaticamente
```

### Testes

```bash
npm test
```

## 🔒 Segurança

- **CSP (Content-Security-Policy)** configurada no `index.html`
- **DOMPurify** para sanitização de HTML (RSS feeds, glossário)
- **Proxy local** com validação de esquema (apenas http/https)
- **Sem eval()** ou `new Function()` no código
- **CORS whitelist** no servidor Python

## 📋 Checklist de Melhorias Aplicadas

- [x] CSP (Content-Security-Policy) no index.html
- [x] DOMPurify integrado
- [x] RSS fetch direto (CORS do BCB)
- [x] package.json com scripts e ESLint
- [x] ESLint configurado
- [x] GitHub Actions CI
- [x] README.md
- [x] Testes unitários
- [x] Service Worker com versionamento
- [x] server.py com CORS whitelist
- [x] DOMPurify no popup.js
- [x] Código duplicado removido
- [x] Logs estruturados

## 📄 Licença

MIT © C&M Software