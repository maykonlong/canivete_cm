/**
 * Canivete Suíço Dev - Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // Theme Persistence (Dark/Light)
    // ==========================================
    try {
        const savedTheme = localStorage.getItem('devtools_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            const btn = document.getElementById('themeToggle');
            if (btn) btn.innerHTML = savedTheme === 'dark' ? '🌙' : '☀️';
        }
    } catch (_) {}

    // ==========================================
    // UI & Navigation Logic
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const navGroups = document.querySelectorAll('.nav-group');
    const toolViews = document.querySelectorAll('.tool-view');
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('appSidebar') || document.querySelector('.sidebar');
    const mainTitle = document.getElementById('mainTitle');
    const navSearch = document.getElementById('navSearch');
    const navSearchEmpty = document.getElementById('navSearchEmpty');

    const isMobileNav = () => window.innerWidth <= 900;

    const openSidebar = () => {
        if (!sidebar) return;
        sidebar.classList.add('open');
        document.body.classList.add('sidebar-open');
        if (sidebarOverlay) sidebarOverlay.hidden = false;
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
        if (navSearch && isMobileNav()) setTimeout(() => navSearch.focus(), 50);
    };

    const closeSidebar = () => {
        if (!sidebar) return;
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if (sidebarOverlay) sidebarOverlay.hidden = true;
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    };

    const toggleSidebar = () => {
        if (sidebar.classList.contains('open')) closeSidebar();
        else openSidebar();
    };

    if (mobileToggle) mobileToggle.addEventListener('click', toggleSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
        // Atalho: / foca a busca do menu (quando não está digitando em input)
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            e.preventDefault();
            if (isMobileNav() && !sidebar.classList.contains('open')) openSidebar();
            if (navSearch) navSearch.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (!isMobileNav()) closeSidebar();
    });

    // Busca de ferramentas no menu
    if (navSearch) {
        navSearch.addEventListener('input', () => {
            const query = navSearch.value.trim().toLowerCase();
            let visibleCount = 0;

            navItems.forEach((item) => {
                const label = item.textContent.trim().toLowerCase();
                const match = !query || label.includes(query);
                item.classList.toggle('nav-hidden', !match);
                if (match) visibleCount++;
            });

            navGroups.forEach((group) => {
                const items = group.querySelectorAll('.nav-item');
                const hasVisible = Array.from(items).some(i => !i.classList.contains('nav-hidden'));
                const label = group.querySelector('.nav-group-label');
                group.style.display = (query && !hasVisible) ? 'none' : '';
                if (label) label.style.display = (query && !hasVisible) ? 'none' : '';
            });

            if (navSearchEmpty) navSearchEmpty.hidden = visibleCount > 0;
        });
    }

    // switchView function (global, used by Command Palette)
    window.switchView = function(targetId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        toolViews.forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(targetId);
        if (targetView) targetView.classList.add('active');
        const navItem = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (navItem) navItem.classList.add('active');
        if (mainTitle) mainTitle.textContent = navItem ? navItem.textContent.trim() : targetId;
        // Update breadcrumb
        const bcCurrent = document.getElementById('breadcrumbCurrent');
        if (bcCurrent) bcCurrent.textContent = navItem ? navItem.textContent.trim() : targetId;
        try { localStorage.setItem('devtools_last_tool', targetId); } catch (_) {}
        if (isMobileNav()) closeSidebar();
    };

    navItems.forEach(item => {
        if(item.classList.contains('nav-category')) return;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            switchView(targetId);
        });
    });

    // Restaura última ferramenta usada
    try {
        const lastTool = localStorage.getItem('devtools_last_tool');
        if (lastTool && document.getElementById(lastTool)) {
            const lastNav = document.querySelector(`.nav-item[data-target="${lastTool}"]`);
            if (lastNav) lastNav.click();
        }
    } catch (_) {}

    // Aviso quando aberto via file://
    if (location.protocol === 'file:') {
        const banner = document.getElementById('fileProtocolBanner');
        if (banner) banner.hidden = false;
    }

    const toastEl = document.getElementById('toast');
    let toastTimer;
    const showToast = (message, type = 'success') => {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.className = `toast toast-${type} show`;
        toastEl.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
            toastEl.hidden = true;
        }, 2200);
    };

    // Modal error popup (with OK button — must be dismissed)
    const showErrorModal = (message) => {
        const modal = document.getElementById('errorModal');
        const text = document.getElementById('errorModalText');
        const okBtn = document.getElementById('errorModalOk');
        if (!modal || !text || !okBtn) { alert(message); return; }
        text.textContent = message;
        modal.style.display = 'flex';
        okBtn.focus();
        const close = () => { modal.style.display = 'none'; okBtn.removeEventListener('click', close); modal.removeEventListener('click', closeBg); };
        const closeBg = (e) => { if (e.target === modal) close(); };
        okBtn.addEventListener('click', close);
        modal.addEventListener('click', closeBg);
        const onKey = (e) => { if (e.key === 'Enter' || e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
        document.addEventListener('keydown', onKey);
    };

    const showMessage = (elementId, message, type = 'success') => {
        const el = document.getElementById(elementId);
        if(!el) return;
        el.textContent = message;
        el.className = `alert alert-${type} show`;
        setTimeout(() => { if (el.textContent === message) el.classList.remove('show'); }, 3000);
    };

    // ==========================================
    // Structured Logger
    // ==========================================
    const Logger = {
        _log(level, message, data = {}) {
            const entry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                ...data
            };
            if (level === 'error') {
                console.error(JSON.stringify(entry));
            } else if (level === 'warn') {
                console.warn(JSON.stringify(entry));
            } else {
                console.log(JSON.stringify(entry));
            }
        },
        info(message, data) { this._log('info', message, data); },
        warn(message, data) { this._log('warn', message, data); },
        error(message, data) { this._log('error', message, data); }
    };

    // ==========================================
    // Global Toolbar (Upload, Download, Copy, Clear)
    // ==========================================
    const globalFileInput = document.getElementById('global_file_input');
    
    // Download Helper
    const downloadContent = (content, filename) => {
        const a = document.createElement('a');
        const file = new Blob([content], {type: 'text/plain'});
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // ===== COMPREHENSIVE AUTO-TOOLTIPS =====
    // Toolbar buttons
    document.querySelectorAll('.btn-toolbar').forEach(btn => {
        if (!btn.title) {
            if (btn.classList.contains('upload-btn')) btn.title = 'Upload arquivo';
            else if (btn.classList.contains('download-btn')) btn.title = 'Baixar';
            else if (btn.classList.contains('copy-btn')) btn.title = 'Copiar';
            else if (btn.classList.contains('clear-btn')) btn.title = 'Limpar';
        }
    });

    // Main action buttons (by ID or class)
    const tooltipMap = {
        'b64img_to_base64': 'Extrair código Base64 da imagem',
        'b64img_to_img': 'Renderizar imagem a partir do Base64',
        'txtb64_encode': 'Codificar texto para Base64',
        'txtb64_decode': 'Decodificar Base64 para texto',
        'url_btn_encode': 'Codificar URL (encodeURIComponent)',
        'url_btn_decode': 'Decodificar URL (decodeURIComponent)',
        'html_btn_encode': 'Codificar HTML entities',
        'html_btn_decode': 'Decodificar HTML entities',
        'jwt_btn_decode': 'Decodificar token JWT em header/payload/signature',
        'time_to_date': 'Converter timestamp para data humana',
        'time_to_ts': 'Converter data para timestamp Unix',
        'qr_btn_gen': 'Gerar QR Code a partir do texto',
        'qr_btn_read': 'Ler QR Code de uma imagem',
        'bin_encode': 'Converter texto para código binário (0/1)',
        'bin_decode': 'Converter código binário para texto',
        'hex_encode': 'Converter texto para hexadecimal',
        'hex_decode': 'Converter hexadecimal para texto',
        'csv_to_json': 'Converter CSV para formato JSON',
        'json_to_csv': 'Converter JSON para formato CSV',
        'json_btn_format': 'Formatar/indentar JSON (Beautify)',
        'json_btn_minify': 'Comprimir JSON em uma linha (Minify)',
        'sql_btn_format': 'Formatar/indentar consulta SQL',
        'regex_btn_test': 'Testar expressão regular contra o texto',
        'xml_btn_format': 'Formatar/indentar XML ou HTML',
        'xml_btn_minify': 'Comprimir XML/HTML em uma linha',
        'cert_btn_info': 'Extrair informações do certificado ou PFX',
        'cert_btn_pair': 'Verificar se certificado e chave são par válido',
        'btn_convert_exec': 'Executar a conversão selecionada',
        'btn_pfx_exec': 'Extrair conteúdo do arquivo PFX',
        'cert_smart_upload': 'Upload inteligente: detecta .pfx/.pem/.cer/.key automaticamente',
        'securityBadge': 'Clique para ver informações de segurança'
    };
    Object.entries(tooltipMap).forEach(([id, tip]) => {
        const el = document.getElementById(id);
        if (el && !el.title) el.title = tip;
    });

    // Clear-all buttons
    document.querySelectorAll('.btn-clear-all').forEach(btn => {
        if (!btn.title) btn.title = 'Limpar todos os campos desta ferramenta';
    });

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        if (!item.title) item.title = 'Abrir ' + item.textContent.trim();
    });

    // Selects
    const selectTips = {
        'convert_type': 'Selecione o tipo de conversão desejada',
        'pfx_extract_type': 'Selecione o que extrair do arquivo PFX',
        'regex_flags': 'Flags da RegEx (g=global, i=case-insensitive, m=multiline)'
    };
    Object.entries(selectTips).forEach(([id, tip]) => {
        const el = document.getElementById(id);
        if (el && !el.title) el.title = tip;
    });

    // Textarea placeholders as fallback titles
    document.querySelectorAll('textarea[placeholder]').forEach(ta => {
        if (!ta.title && ta.placeholder.length > 10) {
            ta.title = ta.placeholder.substring(0, 80);
        }
    });

    // Password inputs
    document.querySelectorAll('input[type="password"]').forEach(inp => {
        if (!inp.title) inp.title = inp.placeholder || 'Digite a senha';
    });

    // Initialize Toolbars
    document.querySelectorAll('.btn-toolbar').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if(!targetEl) return;

            // COPY
            if(btn.classList.contains('copy-btn')) {
                const val = targetEl.tagName === 'IMG' ? targetEl.src : (targetEl.value ?? targetEl.textContent);
                if(!val) return;
                navigator.clipboard.writeText(val).then(() => {
                    const originalSvg = btn.innerHTML;
                    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    showToast('Copiado!');
                    setTimeout(() => btn.innerHTML = originalSvg, 2000);
                }).catch(() => showToast('Falha ao copiar', 'error'));
            }
            
            // CLEAR
            if(btn.classList.contains('clear-btn')) {
                if(targetEl.tagName === 'IMG') {
                    targetEl.src = '';
                    const drop = targetEl.closest('.drop-zone');
                    if(drop) {
                        drop.querySelector('svg').style.display = 'block';
                        drop.querySelector('span').style.display = 'block';
                    }
                } else if(targetEl.tagName === 'DIV' && targetEl.classList.contains('canvas-container')) {
                    targetEl.innerHTML = '';
                    targetEl.classList.add('empty');
                } else {
                    targetEl.value = '';
                }
                // Dispara um evento para as ferramentas limparem suas variáveis de cache locais
                targetEl.dispatchEvent(new Event('cleared'));
            }

            // DOWNLOAD — with smart file extension
            if(btn.classList.contains('download-btn')) {
                if(targetEl.tagName === 'IMG' || (targetEl.tagName === 'DIV' && targetEl.querySelector('canvas'))) {
                    const src = targetEl.tagName === 'IMG' ? targetEl.src : targetEl.querySelector('canvas')?.toDataURL('image/png');
                    if(!src) return;
                    const a = document.createElement('a');
                    a.href = src;
                    a.download = `download_${Date.now()}.png`;
                    a.click();
                } else {
                    if(!targetEl.value) return;
                    // Smart extension based on data-ext attribute or content detection
                    let ext = btn.getAttribute('data-ext') || '.txt';
                    if (ext === '.txt') {
                        const val = targetEl.value;
                        if (val.includes('BEGIN CERTIFICATE')) ext = '.pem';
                        else if (val.includes('BEGIN PRIVATE KEY') || val.includes('BEGIN RSA PRIVATE KEY')) ext = '.key';
                        else if (val.includes('BEGIN CERTIFICATE REQUEST')) ext = '.csr';
                        else if (val.startsWith('{')) ext = '.json';
                        else if (val.startsWith('-----BEGIN')) ext = '.pem';
                        else if (val.startsWith('MIID') || val.startsWith('MII')) ext = '.pem';
                    }
                    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    downloadContent(targetEl.value, `${targetId}_${ts}${ext}`);
                }
            }

            // UPLOAD
            if(btn.classList.contains('upload-btn')) {
                globalFileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => targetEl.value = ev.target.result;
                    reader.readAsText(file);
                    globalFileInput.value = ''; // reset
                };
                globalFileInput.click();
            }
        });
    });

    // Central "Limpar Tudo" Buttons
    document.querySelectorAll('.btn-clear-all').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target'); // prefixo, ex: txtb64
            // Procurar todos os botoes de clear que tem data-target começando com esse prefixo
            document.querySelectorAll(`.clear-btn[data-target^="${target}"]`).forEach(clearBtn => clearBtn.click());
            const msg = document.getElementById(`${target}_msg`);
            if(msg) msg.classList.remove('show');
        });
    });

    // ==========================================
    // Tool 1: Base64 ↔ Imagem
    // ==========================================
    const initBase64Image = () => {
        const inputB64 = document.getElementById('b64img_input');
        const dropZone = document.getElementById('b64img_drop');
        const fileInput = document.getElementById('b64img_file');
        const imgPreview = document.getElementById('b64img_preview');
        const btnToImg = document.getElementById('b64img_to_img');
        const btnToB64 = document.getElementById('b64img_to_base64');
        
        let currentImgSrc = '';

        // Limpa o cache quando o botão Limpar é acionado
        imgPreview.addEventListener('cleared', () => { currentImgSrc = ''; fileInput.value = ''; });

        btnToImg.addEventListener('click', () => {
            let pureBase64 = inputB64.value.trim();
            if(!pureBase64) return showMessage('b64img_msg', 'Cole o texto Base64 primeiro', 'error');

            let finalSrc = pureBase64.startsWith('data:') ? pureBase64.replace(/\s/g, '') : `data:image/png;base64,${pureBase64.replace(/\s/g, '')}`;

            const imgTest = new Image();
            imgTest.onload = () => {
                imgPreview.src = finalSrc;
                currentImgSrc = finalSrc;
                document.querySelector('#b64img_drop svg').style.display = 'none';
                document.querySelector('#b64img_drop span').style.display = 'none';
                showMessage('b64img_msg', 'Imagem renderizada com sucesso!');
            };
            imgTest.onerror = () => showMessage('b64img_msg', 'Base64 inválido ou corrompido', 'error');
            imgTest.src = finalSrc;
        });

        const processImage = (file) => {
            if(!file.type.startsWith('image/')) return showMessage('b64img_msg', 'Formato inválido', 'error');
            const reader = new FileReader();
            reader.onload = (e) => {
                imgPreview.src = e.target.result;
                currentImgSrc = e.target.result;
                document.querySelector('#b64img_drop svg').style.display = 'none';
                document.querySelector('#b64img_drop span').style.display = 'none';
            };
            reader.readAsDataURL(file);
        };

        btnToB64.addEventListener('click', () => {
            if(currentImgSrc) {
                inputB64.value = currentImgSrc;
                showMessage('b64img_msg', 'Base64 extraído!');
            } else {
                fileInput.click();
            }
        });

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if(e.dataTransfer.files.length) processImage(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', e => { 
            if(e.target.files.length) processImage(e.target.files[0]);
            fileInput.value = '';
        });
    };

    // ==========================================
    // Tool 2: Texto ↔ Base64
    // ==========================================
    const initTextBase64 = () => {
        document.getElementById('txtb64_encode').addEventListener('click', () => {
            try {
                const utf8str = encodeURIComponent(document.getElementById('txtb64_txt').value).replace(/%([0-9A-F]{2})/g, 
                    (m, p1) => String.fromCharCode('0x' + p1));
                document.getElementById('txtb64_b64').value = btoa(utf8str);
                showMessage('txtb64_msg', 'Codificado com sucesso');
            } catch(e) { showMessage('txtb64_msg', 'Erro ao codificar', 'error'); }
        });

        document.getElementById('txtb64_decode').addEventListener('click', () => {
            try {
                const decoded = atob(document.getElementById('txtb64_b64').value.trim());
                document.getElementById('txtb64_txt').value = decodeURIComponent(decoded.split('').map(c => 
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                showMessage('txtb64_msg', 'Decodificado com sucesso');
            } catch(e) { showMessage('txtb64_msg', 'Base64 inválido', 'error'); }
        });
    };

    // ==========================================
    // Tool 3: URL Encode / Decode
    // ==========================================
    const initUrlEncode = () => {
        document.getElementById('url_btn_encode').addEventListener('click', () => {
            document.getElementById('url_encoded').value = encodeURIComponent(document.getElementById('url_raw').value);
            showMessage('url_msg', 'URL codificada');
        });
        document.getElementById('url_btn_decode').addEventListener('click', () => {
            try {
                document.getElementById('url_raw').value = decodeURIComponent(document.getElementById('url_encoded').value);
                showMessage('url_msg', 'URL decodificada');
            } catch(e) { showMessage('url_msg', 'String codificada inválida', 'error'); }
        });
    };

    // ==========================================
    // Tool 4: HTML Entities
    // ==========================================
    const initHTML = () => {
        const raw = document.getElementById('html_raw');
        const encoded = document.getElementById('html_encoded');
        
        document.getElementById('html_btn_encode').addEventListener('click', () => {
            const div = document.createElement('div');
            div.innerText = raw.value;
            encoded.value = div.innerHTML;
            showMessage('html_msg', 'HTML Codificado');
        });
        document.getElementById('html_btn_decode').addEventListener('click', () => {
            const div = document.createElement('div');
            div.innerHTML = encoded.value;
            raw.value = div.innerText;
            showMessage('html_msg', 'HTML Decodificado');
        });
    };

    // ==========================================
    // Tool 5: JWT Decode
    // ==========================================
    const initJWT = () => {
        const tokenInput = document.getElementById('jwt_token');
        document.getElementById('jwt_btn_decode').addEventListener('click', () => {
            const token = tokenInput.value.trim();
            if(!token) return;
            const parts = token.split('.');
            if(parts.length !== 3) return showMessage('jwt_msg', 'Token JWT inválido (precisa ter 3 partes)', 'error');
            
            try {
                const headStr = decodeURIComponent(atob(parts[0]).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const playStr = decodeURIComponent(atob(parts[1]).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                
                const headerArea = document.getElementById('jwt_header');
                const payloadArea = document.getElementById('jwt_payload');
                const signArea = document.getElementById('jwt_signature');

                headerArea.textContent = JSON.stringify(JSON.parse(headStr), null, 2);
                payloadArea.textContent = JSON.stringify(JSON.parse(playStr), null, 2);
                signArea.textContent = parts[2];
                
                // Com <pre>, a altura é auto-ajustada pelo conteúdo e limitada pelo CSS max-height, não é necessário JS.
                showMessage('jwt_msg', 'JWT Decodificado');
            } catch(e) {
                showMessage('jwt_msg', 'Falha ao decodificar partes do Token', 'error');
            }
        });
    };

    // ==========================================
    // Tool 6: Hash Generator
    // ==========================================
    const initHash = () => {
        const input = document.getElementById('hash_input');
        
        const bufferToHex = (buffer) => {
            return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        };

        const generateHashes = async () => {
            const text = input.value;
            if(!text) {
                ['sha1', 'sha256', 'sha512'].forEach(id => document.getElementById(`hash_${id}`).value = '');
                return;
            }
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            
            try {
                const hash1 = await crypto.subtle.digest('SHA-1', data);
                document.getElementById('hash_sha1').value = bufferToHex(hash1);
                
                const hash256 = await crypto.subtle.digest('SHA-256', data);
                document.getElementById('hash_sha256').value = bufferToHex(hash256);
                
                const hash512 = await crypto.subtle.digest('SHA-512', data);
                document.getElementById('hash_sha512').value = bufferToHex(hash512);
            } catch(e) {
                Logger.error('Hash generation error', { error: e.message });
            }
        };

        input.addEventListener('input', generateHashes);
    };

    // ==========================================
    // Tool 7: Timestamp ↔ Data
    // ==========================================
    const initTime = () => {
        const tsIn = document.getElementById('time_ts');
        const dateIn = document.getElementById('time_date');

        document.getElementById('time_to_date').addEventListener('click', () => {
            let val = parseInt(tsIn.value);
            if(isNaN(val)) return showMessage('time_msg', 'Timestamp inválido', 'error');
            if(val < 10000000000) val *= 1000; // Assume in seconds if too small
            
            const date = new Date(val);
            // Format to YYYY-MM-DDTHH:mm
            const iso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
            dateIn.value = iso;
            showMessage('time_msg', 'Data gerada!');
        });

        document.getElementById('time_to_ts').addEventListener('click', () => {
            const d = new Date(dateIn.value);
            if(isNaN(d.getTime())) return showMessage('time_msg', 'Data inválida', 'error');
            tsIn.value = Math.floor(d.getTime() / 1000); // Em Segundos
            showMessage('time_msg', 'Timestamp gerado!');
        });
    };

    const initColor = () => {
        const picker = document.getElementById('color_picker');
        const hexIn = document.getElementById('color_hex');
        const rgbIn = document.getElementById('color_rgb');
        const hslIn = document.getElementById('color_hsl');
        const hsvIn = document.getElementById('color_hsv');
        const cmykIn = document.getElementById('color_cmyk');
        const box = document.getElementById('color_box');

        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
        };

        const rgbToHex = (r, g, b) => {
            return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
        };

        const rgbToHsl = (r, g, b) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            if (max === min) h = s = 0;
            else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
        };

        const rgbToHsv = (r, g, b) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const d = max - min;
            let h, s = max === 0 ? 0 : d / max, v = max;
            if (max === min) h = 0;
            else {
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
        };

        const rgbToCmyk = (r, g, b) => {
            let c = 1 - (r / 255);
            let m = 1 - (g / 255);
            let y = 1 - (b / 255);
            let k = Math.min(c, Math.min(m, y));
            if (k === 1) return [0, 0, 0, 100];
            c = (c - k) / (1 - k);
            m = (m - k) / (1 - k);
            y = (y - k) / (1 - k);
            return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
        };

        const updateAllFromRgb = (r, g, b, source) => {
            const hex = rgbToHex(r, g, b);
            const hsl = rgbToHsl(r, g, b);
            const hsv = rgbToHsv(r, g, b);
            const cmyk = rgbToCmyk(r, g, b);

            if(source !== 'picker') picker.value = hex;
            if(source !== 'hex') hexIn.value = hex;
            if(source !== 'rgb') rgbIn.value = `${r}, ${g}, ${b}`;
            
            hslIn.value = `${hsl[0]}°, ${hsl[1]}%, ${hsl[2]}%`;
            hsvIn.value = `${hsv[0]}°, ${hsv[1]}%, ${hsv[2]}%`;
            cmykIn.value = `${cmyk[0]}%, ${cmyk[1]}%, ${cmyk[2]}%, ${cmyk[3]}%`;
            box.style.backgroundColor = hex;
        };

        picker.addEventListener('input', (e) => {
            const rgb = hexToRgb(e.target.value);
            if(rgb) updateAllFromRgb(rgb[0], rgb[1], rgb[2], 'picker');
        });

        hexIn.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if(val.length === 6 && !val.startsWith('#')) val = '#' + val;
            const rgb = hexToRgb(val);
            if(rgb) updateAllFromRgb(rgb[0], rgb[1], rgb[2], 'hex');
        });

        rgbIn.addEventListener('input', (e) => {
            const parts = e.target.value.split(',').map(n => parseInt(n.trim()));
            if(parts.length === 3 && !parts.some(isNaN) && parts.every(n => n >= 0 && n <= 255)) {
                updateAllFromRgb(parts[0], parts[1], parts[2], 'rgb');
            }
        });
        
        // Initial setup
        updateAllFromRgb(50, 168, 82, 'none'); // Starting with the green from user's screenshot
    };

    // ==========================================
    // Outras Ferramentas Mantidas
    // ==========================================
    const initQR = () => {
        const txtInput = document.getElementById('qr_txt');
        const btnGen = document.getElementById('qr_btn_gen');
        const btnRead = document.getElementById('qr_btn_read');
        const canvasContainer = document.getElementById('qr_canvas_container');
        const fileInput = document.getElementById('qr_file');
        
        btnGen.addEventListener('click', () => {
            if(!txtInput.value.trim()) return showMessage('qr_msg', 'Insira o texto primeiro', 'error');
            if(typeof QRCode === 'undefined') return showMessage('qr_msg', 'Lib QRCode não carregada', 'error');
            canvasContainer.innerHTML = ''; canvasContainer.classList.remove('empty');
            new QRCode(canvasContainer, { text: txtInput.value.trim(), width: 200, height: 200 });
            showMessage('qr_msg', 'QR Code gerado!');
        });

        let currentQRDataUrl = null;

        // Limpa o cache interno quando a UI for limpa
        canvasContainer.addEventListener('cleared', () => { currentQRDataUrl = null; fileInput.value = ''; });

        const doRead = (dataUrl) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Evita imagens gigantes travando o jsQR
                const MAX_SIZE = 1000;
                let w = img.width;
                let h = img.height;
                if (w > MAX_SIZE || h > MAX_SIZE) {
                    const r = Math.min(MAX_SIZE / w, MAX_SIZE / h);
                    w = w * r; h = h * r;
                }
                canvas.width = w; canvas.height = h;
                
                // Preenche fundo branco (evita problemas com PNGs transparentes ficando pretos)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                
                const imageData = ctx.getImageData(0, 0, w, h);
                let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
                
                // Fallback de Binarização para QR Codes coloridos/gradientes
                if (!code) {
                    const thresholds = [200, 160, 220, 120];
                    for (let t of thresholds) {
                        const imgDataCopy = ctx.getImageData(0, 0, w, h);
                        const data = imgDataCopy.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const luminance = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
                            const val = luminance > t ? 255 : 0;
                            data[i] = data[i+1] = data[i+2] = val;
                        }
                        code = jsQR(imgDataCopy.data, imgDataCopy.width, imgDataCopy.height, { inversionAttempts: "attemptBoth" });
                        if (code) break;
                    }
                }
                
                canvasContainer.innerHTML = '';
                canvasContainer.classList.remove('empty');
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.objectFit = 'contain';
                canvasContainer.appendChild(img);

                if(code) {
                    txtInput.value = code.data;
                    showMessage('qr_msg', 'QR Code lido com sucesso!');
                } else {
                    showMessage('qr_msg', 'QR Code ilegível. Tente aumentar o contraste da imagem.', 'error');
                }
            };
            img.src = dataUrl;
        };

        // Read QR from File
        const processQRImage = (file) => {
            if(!file) return showMessage('qr_msg', 'Nenhum arquivo selecionado', 'error');
            if(typeof jsQR === 'undefined') return showMessage('qr_msg', 'Erro: Biblioteca jsQR não foi carregada. Verifique o arquivo ./libs/jsQR.min.js', 'error');
            
            const reader = new FileReader();
            reader.onload = (e) => {
                currentQRDataUrl = e.target.result;
                doRead(currentQRDataUrl);
            };
            reader.readAsDataURL(file);
        };

        btnRead.addEventListener('click', () => {
            if(typeof jsQR === 'undefined') return showMessage('qr_msg', 'Erro: jsQR não carregada.', 'error');
            
            let srcToRead = currentQRDataUrl;
            
            // Se não tem um arquivo recente, mas o container não está vazio (tem canvas/img gerado)
            if (!srcToRead && !canvasContainer.classList.contains('empty')) {
                const canvas = canvasContainer.querySelector('canvas');
                const img = canvasContainer.querySelector('img');
                if (canvas) srcToRead = canvas.toDataURL();
                else if (img && img.src) srcToRead = img.src;
            }

            if (srcToRead) {
                doRead(srcToRead);
            } else {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', e => {
            if(e.target.files.length) processQRImage(e.target.files[0]);
            fileInput.value = '';
        });

        // Click to open file dialog
        canvasContainer.addEventListener('click', () => fileInput.click());
        canvasContainer.style.cursor = 'pointer';

        // Dropzone for QR reading
        canvasContainer.addEventListener('dragover', e => { 
            e.preventDefault(); 
            canvasContainer.style.borderColor = 'var(--primary)';
            canvasContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        });
        canvasContainer.addEventListener('dragleave', () => { 
            canvasContainer.style.borderColor = ''; 
            canvasContainer.style.backgroundColor = '';
        });
        canvasContainer.addEventListener('drop', e => {
            e.preventDefault();
            canvasContainer.style.borderColor = '';
            canvasContainer.style.backgroundColor = '';
            if(e.dataTransfer.files.length) processQRImage(e.dataTransfer.files[0]);
        });
    };

    const initBinaryText = () => {
        document.getElementById('bin_encode').addEventListener('click', () => {
            document.getElementById('bin_bin').value = document.getElementById('bin_txt').value.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
            showMessage('bin_msg', 'Binário gerado');
        });
        document.getElementById('bin_decode').addEventListener('click', () => {
            try {
                document.getElementById('bin_txt').value = document.getElementById('bin_bin').value.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
                showMessage('bin_msg', 'Texto gerado');
            } catch(e) { showMessage('bin_msg', 'Binário inválido', 'error'); }
        });
    };

    const initHexText = () => {
        document.getElementById('hex_encode').addEventListener('click', () => {
            document.getElementById('hex_hex').value = document.getElementById('hex_txt').value.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ').toUpperCase();
            showMessage('hex_msg', 'Hexadecimal gerado');
        });
        document.getElementById('hex_decode').addEventListener('click', () => {
            try {
                const hexStr = document.getElementById('hex_hex').value.replace(/\s+/g, '');
                let str = '';
                for (let i = 0; i < hexStr.length; i += 2) str += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
                document.getElementById('hex_txt').value = str;
                showMessage('hex_msg', 'Texto gerado');
            } catch(e) { showMessage('hex_msg', 'Hex inválido', 'error'); }
        });
    };

    const initCSVJSON = () => {
        document.getElementById('csv_to_json').addEventListener('click', () => {
            try {
                if(typeof Papa === 'undefined') return showMessage('csv_msg', 'PapaParse não carregado. Verifique ./libs/papaparse.min.js', 'error');
                const val = document.getElementById('csv_input').value.trim();
                if(!val) return showMessage('csv_msg', 'Insira o CSV primeiro', 'error');

                // PapaParse retorna resultado síncrono para strings
                const result = Papa.parse(val, {
                    header: true,
                    skipEmptyLines: true
                });

                if (result.errors && result.errors.length > 0) {
                    Logger.warn('CSV Parse warnings', { errors: result.errors.length });
                }

                if (!result.data || result.data.length === 0) {
                    showMessage('csv_msg', 'Nenhum dado encontrado. Verifique o formato CSV (separador vírgula, linhas com quebra).', 'error');
                    return;
                }

                document.getElementById('csv_json').value = JSON.stringify(result.data, null, 2);
                showMessage('csv_msg', `Convertido com sucesso! ${result.data.length} registro(s).`);
            } catch(e) {
                Logger.error('Erro ao ler CSV', { error: e.message });
                showMessage('csv_msg', 'Erro ao ler CSV: ' + e.message, 'error');
            }
        });

        document.getElementById('json_to_csv').addEventListener('click', () => {
            try {
                if(typeof Papa === 'undefined') return showMessage('csv_msg', 'PapaParse não carregado. Verifique ./libs/papaparse.min.js', 'error');
                const val = document.getElementById('csv_json').value.trim();
                if(!val) return showMessage('csv_msg', 'Insira o JSON primeiro', 'error');

                const parsedJSON = JSON.parse(val);

                // Aceita array direto ou objeto único
                const data = Array.isArray(parsedJSON) ? parsedJSON : [parsedJSON];
                if (data.length === 0) {
                    showMessage('csv_msg', 'JSON vazio, nada para converter.', 'error');
                    return;
                }

                const csvStr = Papa.unparse(data);
                document.getElementById('csv_input').value = csvStr;
                showMessage('csv_msg', `Convertido para CSV! ${data.length} registro(s).`);
            } catch(e) {
                Logger.error('JSON inválido', { error: e.message });
                showMessage('csv_msg', 'JSON inválido ou mal formatado: ' + e.message, 'error');
            }
        });
    };

    const initJSON = () => {
        const input = document.getElementById('json_input');
        const output = document.getElementById('json_output');
        
        document.getElementById('json_btn_format').addEventListener('click', () => {
            try {
                if(!input.value.trim()) return showMessage('json_msg', 'Insira o JSON primeiro', 'error');
                const parsed = JSON.parse(input.value);
                output.value = JSON.stringify(parsed, null, 4);
                showMessage('json_msg', 'JSON Formatado com Sucesso!');
            } catch(e) {
                showMessage('json_msg', 'Erro de Sintaxe JSON: ' + e.message, 'error');
            }
        });

        document.getElementById('json_btn_minify').addEventListener('click', () => {
            try {
                if(!input.value.trim()) return showMessage('json_msg', 'Insira o JSON primeiro', 'error');
                const parsed = JSON.parse(input.value);
                output.value = JSON.stringify(parsed);
                showMessage('json_msg', 'JSON Minificado com Sucesso!');
            } catch(e) {
                showMessage('json_msg', 'Erro de Sintaxe JSON: ' + e.message, 'error');
            }
        });
    };

    const initSQL = () => {
        const input = document.getElementById('sql_input');
        const output = document.getElementById('sql_output');

        document.getElementById('sql_btn_format').addEventListener('click', () => {
            if(!input.value.trim()) return showMessage('sql_msg', 'Insira o SQL primeiro', 'error');
            if(typeof sqlFormatter === 'undefined') return showMessage('sql_msg', 'Biblioteca SQL Formatter não carregada.', 'error');
            
            try {
                output.value = sqlFormatter.format(input.value, { language: 'sql', uppercase: true });
                showMessage('sql_msg', 'SQL Formatado com Sucesso!');
            } catch (e) {
                showMessage('sql_msg', 'Erro ao formatar SQL: ' + e.message, 'error');
            }
        });
    };

    const initRegex = () => {
        const patternIn = document.getElementById('regex_pattern');
        const flagsIn = document.getElementById('regex_flags');
        const textIn = document.getElementById('regex_text');
        const output = document.getElementById('regex_output');

        document.getElementById('regex_btn_test').addEventListener('click', () => {
            if(!patternIn.value) return showMessage('regex_msg', 'Insira o Pattern (Expressão)', 'error');
            if(!textIn.value) return showMessage('regex_msg', 'Insira o texto para testar', 'error');

            try {
                const regex = new RegExp(patternIn.value, flagsIn.value);
                const str = textIn.value;
                let match;
                let results = [];
                
                if (regex.global) {
                    while ((match = regex.exec(str)) !== null) {
                        results.push(`Found: "${match[0]}" at Index: ${match.index}`);
                        if(match.length > 1) {
                            for(let i=1; i<match.length; i++) {
                                results.push(`  Group ${i}: "${match[i]}"`);
                            }
                        }
                    }
                } else {
                    match = regex.exec(str);
                    if (match) {
                        results.push(`Found: "${match[0]}" at Index: ${match.index}`);
                        if(match.length > 1) {
                            for(let i=1; i<match.length; i++) {
                                results.push(`  Group ${i}: "${match[i]}"`);
                            }
                        }
                    }
                }

                if (results.length > 0) {
                    output.textContent = results.join('\n');
                    output.style.color = 'var(--success)';
                    showMessage('regex_msg', `${results.filter(r => r.startsWith('Found')).length} match(es) encontrados!`);
                } else {
                    output.textContent = "Nenhum match encontrado.";
                    output.style.color = 'var(--error)';
                    showMessage('regex_msg', 'Nenhum match encontrado.', 'error');
                }
            } catch(e) {
                output.textContent = "Erro na expressão regular:\n" + e.message;
                output.style.color = 'var(--error)';
                showMessage('regex_msg', 'RegEx Inválida', 'error');
            }
        });
    };

    const initXML = () => {
        const input = document.getElementById('xml_input');
        const output = document.getElementById('xml_output');

        document.getElementById('xml_btn_format').addEventListener('click', () => {
            if(!input.value.trim()) return showMessage('xml_msg', 'Insira o código XML/HTML primeiro', 'error');
            if(typeof vkbeautify === 'undefined') return showMessage('xml_msg', 'Biblioteca vkbeautify não carregada.', 'error');
            
            try {
                output.value = vkbeautify.xml(input.value);
                showMessage('xml_msg', 'Código Formatado!');
            } catch (e) {
                showMessage('xml_msg', 'Erro ao formatar', 'error');
            }
        });

        document.getElementById('xml_btn_minify').addEventListener('click', () => {
            if(!input.value.trim()) return showMessage('xml_msg', 'Insira o código XML/HTML primeiro', 'error');
            if(typeof vkbeautify === 'undefined') return showMessage('xml_msg', 'Biblioteca vkbeautify não carregada.', 'error');
            
            try {
                output.value = vkbeautify.xmlmin(input.value);
                showMessage('xml_msg', 'Código Minificado!');
            } catch (e) {
                showMessage('xml_msg', 'Erro ao minificar', 'error');
            }
        });
    };

    // ==========================================
    // Shared: QR Code Image Reading with Binarization Fallback
    // ==========================================
    const readQRFromImage = (dataUrl, onSuccess, onError) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const MAX_SIZE = 1000;
            let w = img.width;
            let h = img.height;
            if (w > MAX_SIZE || h > MAX_SIZE) {
                const r = Math.min(MAX_SIZE / w, MAX_SIZE / h);
                w = w * r; h = h * r;
            }
            canvas.width = w; canvas.height = h;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            const imageData = ctx.getImageData(0, 0, w, h);
            let code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

            // Fallback de Binarização para QR Codes coloridos/gradientes
            if (!code) {
                const thresholds = [200, 160, 220, 120];
                for (const t of thresholds) {
                    const imgDataCopy = ctx.getImageData(0, 0, w, h);
                    const data = imgDataCopy.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const luminance = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
                        const val = luminance > t ? 255 : 0;
                        data[i] = data[i+1] = data[i+2] = val;
                    }
                    code = jsQR(imgDataCopy.data, imgDataCopy.width, imgDataCopy.height, { inversionAttempts: "attemptBoth" });
                    if (code) break;
                }
            }

            onSuccess(code, img);
        };
        img.onerror = () => onError('Erro ao carregar imagem');
        img.src = dataUrl;
    };

    // ==========================================
    // Tool: Texto para QR Code (moved inside handler)
    // ==========================================
    const initTextQR = () => {
        const textInput = document.getElementById('text_qr_input');
        const canvasContainer = document.getElementById('text_qr_canvas_container');
        const fileInput = document.getElementById('text_qr_file');

        canvasContainer.addEventListener('cleared', () => {
            fileInput.value = '';
            canvasContainer.innerHTML = '';
            canvasContainer.classList.add('empty');
        });

        let typingTimer;
        textInput.addEventListener('input', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                if (textInput.value.trim()) {
                    generateQRCodeFromText();
                } else {
                    canvasContainer.innerHTML = '';
                    canvasContainer.classList.add('empty');
                }
            }, 500);
        });

        function generateQRCodeFromText() {
            const text = textInput.value.trim();
            if (!text) return;

            if (text.length > 4000) {
                showMessage('text_qr_msg', 'Texto muito longo para QR Code. Limite de 4000 caracteres.', 'error');
                canvasContainer.innerHTML = '';
                canvasContainer.classList.add('empty');
                return;
            }

            try {
                canvasContainer.innerHTML = '';
                canvasContainer.classList.remove('empty');

                const canvas = document.createElement('canvas');
                new QRCode(canvas, {
                    text: text,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });

                canvasContainer.appendChild(canvas);
                showMessage('text_qr_msg', 'QR Code gerado com sucesso!');
                addToHistory('text_qr', text);
            } catch (error) {
                Logger.error('Erro ao gerar QR Code', { error: error.message });
                showMessage('text_qr_msg', 'Erro ao gerar QR Code. Tente novamente.', 'error');
                canvasContainer.innerHTML = '';
                canvasContainer.classList.add('empty');
            }
        }

        // Uses shared readQRFromImage helper (no duplicate code)
        const processQRImage = (file) => {
            if (!file) return showMessage('text_qr_msg', 'Nenhum arquivo selecionado', 'error');
            if (typeof jsQR === 'undefined') return showMessage('text_qr_msg', 'Erro: jsQR não carregada.', 'error');

            const reader = new FileReader();
            reader.onload = (e) => {
                readQRFromImage(e.target.result, (code, img) => {
                    canvasContainer.innerHTML = '';
                    canvasContainer.classList.remove('empty');
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.objectFit = 'contain';
                    canvasContainer.appendChild(img);

                    if (code) {
                        textInput.value = code.data;
                        showMessage('text_qr_msg', 'QR Code lido com sucesso!');
                        addToHistory('text_qr_read', code.data);
                    } else {
                        showMessage('text_qr_msg', 'QR Code ilegível. Tente aumentar o contraste da imagem.', 'error');
                    }
                }, (err) => {
                    showMessage('text_qr_msg', err, 'error');
                });
            };
            reader.readAsDataURL(file);
        };

        canvasContainer.addEventListener('click', () => fileInput.click());
        canvasContainer.style.cursor = 'pointer';

        canvasContainer.addEventListener('dragover', e => {
            e.preventDefault();
            canvasContainer.style.borderColor = 'var(--primary)';
            canvasContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        });
        canvasContainer.addEventListener('dragleave', () => {
            canvasContainer.style.borderColor = '';
            canvasContainer.style.backgroundColor = '';
        });
        canvasContainer.addEventListener('drop', e => {
            e.preventDefault();
            canvasContainer.style.borderColor = '';
            canvasContainer.style.backgroundColor = '';
            if (e.dataTransfer.files.length) processQRImage(e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', e => {
            if (e.target.files.length) processQRImage(e.target.files[0]);
            fileInput.value = '';
        });
    };

    // ==========================================
    // History (moved inside handler — fixes scope for showMessage)
    // ==========================================
    const addToHistory = (type, content) => {
        try {
            let history = JSON.parse(localStorage.getItem('devtools_history') || '[]');
            history.unshift({
                id: Date.now(),
                type: type,
                content: content,
                timestamp: new Date().toISOString()
            });
            if (history.length > 50) history = history.slice(0, 50);
            localStorage.setItem('devtools_history', JSON.stringify(history));
            Logger.info('Histórico atualizado', { type, entriesCount: history.length });
        } catch (e) {
            Logger.error('Erro ao adicionar ao histórico', { error: e.message });
        }
    };

    const loadHistory = () => {
        try {
            return JSON.parse(localStorage.getItem('devtools_history') || '[]');
        } catch (e) {
            Logger.error('Erro ao carregar histórico', { error: e.message });
            return [];
        }
    };

    const clearHistory = () => {
        localStorage.removeItem('devtools_history');
        Logger.info('Histórico limpo');
        showMessage('history_msg', 'Histórico limpo com sucesso!', 'success');
    };

    const displayHistory = () => {
        const historyList = document.getElementById('history_list');
        const history = loadHistory();

        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Nenhuma entrada no histórico</p>';
            return;
        }

        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem;';

        history.forEach(entry => {
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            let typeLabel = 'Entrada';
            if (entry.type === 'text_qr') typeLabel = 'QR Code Gerado';
            else if (entry.type === 'text_qr_read') typeLabel = 'QR Code Lido';

            const displayContent = entry.content.length > 100
                ? entry.content.substring(0, 100) + '...'
                : entry.content;

            const card = document.createElement('div');
            card.style.cssText = 'background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.9rem;';

            const header = document.createElement('div');
            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;';

            const typeSpan = document.createElement('span');
            typeSpan.style.cssText = 'font-weight: 600; color: var(--primary);';
            typeSpan.textContent = typeLabel;

            const dateSpan = document.createElement('span');
            dateSpan.style.cssText = 'font-size: 0.8rem; color: var(--text-muted);';
            dateSpan.textContent = formattedDate;

            const contentP = document.createElement('p');
            contentP.style.cssText = 'margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            contentP.textContent = displayContent; // textContent = safe, no XSS

            header.appendChild(typeSpan);
            header.appendChild(dateSpan);
            card.appendChild(header);
            card.appendChild(contentP);
            container.appendChild(card);
        });

        historyList.innerHTML = '';
        historyList.appendChild(container);
    };

    // ==========================================
    // Tool: Certificados SSL (via node-forge)
    // ==========================================
    const initCertificates = () => {
        if (typeof forge === 'undefined') {
            Logger.warn('node-forge não carregado — Certificados SSL indisponível');
            return;
        }

        // Binary file upload for PFX only (cert/key files use text upload via global handler)
        const binaryFileInput = document.getElementById('global_binary_file_input');
        const pfxUploadBtn = document.querySelector('#cert_pfx .upload-btn[data-target="pfx_input"]');
        if (pfxUploadBtn) {
            pfxUploadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const targetEl = document.getElementById('pfx_input');
                if (!targetEl) return;
                binaryFileInput.onchange = (ev) => {
                    const file = ev.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (rev) => {
                        const b64 = rev.target.result.split(',')[1];
                        targetEl.value = b64;
                        showMessage('certs_msg', `Arquivo "${file.name}" carregado (${(file.size / 1024).toFixed(1)} KB)`);
                    };
                    reader.readAsDataURL(file);
                    binaryFileInput.value = '';
                };
                binaryFileInput.click();
            }, true);
        }

        // Tab switching
        document.querySelectorAll('.cert-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.cert-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.cert-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });

        // Helper: buffer to hex
        const bufToHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(':');
        const bufToHexClean = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

        // Helper: get public key hash (SHA-256 via forge)
        const getPublicKeyHash = (publicKeyDer) => {
            const bytes = String.fromCharCode.apply(null, new Uint8Array(publicKeyDer));
            return forge.md.sha256.create().update(bytes).digest().toHex();
        };

        // Helper: extract public key DER from cert or key
        const extractPublicKeyDer = (pem, isKey) => {
            try {
                let publicKey;
                if (isKey) {
                    const privateKey = forge.pki.privateKeyFromPem(pem);
                    publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
                } else {
                    const cert = forge.pki.certificateFromPem(pem);
                    publicKey = cert.publicKey;
                }
                const pubKeyPem = forge.pki.publicKeyToPem(publicKey);
                // Extract base64 from PEM
                const b64 = pubKeyPem.replace(/-----.*-----/g, '').replace(/\s/g, '');
                const bytes = forge.util.decode64(b64);
                const arr = new Uint8Array(bytes.length);
                for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                return arr.buffer;
            } catch (e) {
                return null;
            }
        };

        // Helper: extract public key SPKI DER
        const extractSpkiDer = (pem, isKey) => {
            try {
                let publicKey;
                if (isKey) {
                    const privateKey = forge.pki.privateKeyFromPem(pem);
                    publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
                } else {
                    const cert = forge.pki.certificateFromPem(pem);
                    publicKey = cert.publicKey;
                }
                const spkiAsn1 = forge.pki.publicKeyToAsn1(publicKey);
                const spkiDer = forge.asn1.toDer(spkiAsn1).getBytes();
                const arr = new Uint8Array(spkiDer.length);
                for (let i = 0; i < spkiDer.length; i++) arr[i] = spkiDer.charCodeAt(i);
                return arr.buffer;
            } catch (e) {
                return null;
            }
        };

        // Smart upload: single button, auto-detects file type
        const smartUploadBtn = document.getElementById('cert_smart_upload');
        if (smartUploadBtn) {
            smartUploadBtn.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.cer,.crt,.pem,.pfx,.p12,.key,.der';
                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const ext = file.name.split('.').pop().toLowerCase();
                    const isBinary = ['pfx', 'p12', 'der', 'cer'].includes(ext);
                    const passPanel = document.getElementById('cert_info_pass_panel');

                    if (isBinary) {
                        // Read as base64 for binary formats
                        const reader = new FileReader();
                        reader.onload = (rev) => {
                            const b64 = rev.target.result.split(',')[1];
                            document.getElementById('cert_input').value = b64;
                            passPanel.style.display = 'block';
                            showMessage('certs_msg', `"${file.name}" carregado (${(file.size / 1024).toFixed(1)} KB). Digite a senha e clique Extrair.`);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        // Read as text for PEM formats
                        const reader = new FileReader();
                        reader.onload = (rev) => {
                            const text = rev.target.result;
                            document.getElementById('cert_input').value = text;
                            // Show password only if encrypted key or looks like PFX
                            if (text.includes('ENCRYPTED') || (!text.includes('BEGIN CERTIFICATE') && !text.includes('BEGIN PRIVATE KEY'))) {
                                passPanel.style.display = 'block';
                            } else {
                                passPanel.style.display = 'none';
                            }
                            showMessage('certs_msg', `"${file.name}" carregado.`);
                        };
                        reader.readAsText(file);
                    }
                };
                fileInput.click();
            });
        }

        // Reset state when clearing cert_input
        document.getElementById('cert_input').addEventListener('cleared', () => {
            const passPanel = document.getElementById('cert_info_pass_panel');
            if (passPanel) passPanel.style.display = 'none';
            const passInput = document.getElementById('cert_info_pfx_pass');
            if (passInput) passInput.value = '';
            const output = document.getElementById('cert_info_output');
            if (output) output.textContent = '';
        });

        // Auto-detect content type when pasting
        document.getElementById('cert_input').addEventListener('input', () => {
            const val = document.getElementById('cert_input').value.trim();
            const passPanel = document.getElementById('cert_info_pass_panel');
            if (!val) { passPanel.style.display = 'none'; return; }
            // Show password for encrypted keys or PFX (base64 without PEM headers)
            if (val.includes('ENCRYPTED')) { passPanel.style.display = 'block'; return; }
            if (!val.includes('BEGIN CERTIFICATE') && !val.includes('BEGIN PRIVATE KEY') && !val.includes('BEGIN RSA')) {
                try { forge.asn1.fromDer(forge.util.decode64(val)); passPanel.style.display = 'block'; } catch (_) { passPanel.style.display = 'none'; }
            } else {
                passPanel.style.display = 'none';
            }
        });

        // ===== Tab 1: Certificate Info =====
        document.getElementById('cert_btn_info').addEventListener('click', async () => {
            const raw = document.getElementById('cert_input').value.trim();
            if (!raw) return showMessage('certs_msg', 'Cole o certificado ou PFX primeiro', 'error');

            // Try PEM first
            if (raw.includes('BEGIN CERTIFICATE')) {
                try {
                    const cert = forge.pki.certificateFromPem(raw);
                    const issuer = cert.issuer.getField('CN') ? cert.issuer.getField('CN').value : 'N/A';
                    const subject = cert.subject.getField('CN') ? cert.subject.getField('CN').value : 'N/A';
                    const serial = cert.serialNumber;
                    const notBefore = cert.validity.notBefore.toLocaleString('pt-BR');
                    const notAfter = cert.validity.notAfter.toLocaleString('pt-BR');
                    const now = new Date();
                    const isExpired = now > cert.validity.notAfter;
                    const daysLeft = Math.ceil((cert.validity.notAfter - now) / (1000 * 60 * 60 * 24));
                    const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
                    const fingerprint = forge.md.sha256.create().update(derBytes).digest().toHex();
                    const pubKeyDer = extractSpkiDer(raw, false);
                    const pubKeyHash = pubKeyDer ? getPublicKeyHash(pubKeyDer) : 'N/A';
                    const modulusHex = cert.publicKey.n.toString(16);
                    const modulusMd5 = forge.md.md5.create().update(modulusHex).digest().toHex();
                    let output = `═══════════════════════════════════════════\n  INFORMAÇÕES DO CERTIFICADO\n═══════════════════════════════════════════\n\n`;
                    output += `Subject (CN): ${subject}\nIssuer (CN):  ${issuer}\nSerial:       ${serial}\n\n`;
                    output += `Válido De:    ${notBefore}\nVálido Até:   ${notAfter}\n`;
                    output += `Status:       ${isExpired ? '❌ EXPIRADO' : '✅ Válido'} (${isExpired ? 'vencido há ' + Math.abs(daysLeft) : daysLeft + ' dias restantes'})\n\n`;
                    output += `SHA-256 Fingerprint:\n  ${fingerprint}\n\nPublic Key SHA-256:\n  ${pubKeyHash}\n\n`;
                    output += `Modulus (MD5):\n  ${modulusMd5}\n`;
                    document.getElementById('cert_info_output').textContent = output;
                    showMessage('certs_msg', 'Informações extraídas com sucesso!');
                } catch (e) {
                    Logger.error('Erro ao analisar certificado', { error: e.message });
                    showMessage('certs_msg', 'Erro: ' + e.message, 'error');
                }
                return;
            }

            // Try PFX
            try {
                const pfxPass = document.getElementById('cert_info_pfx_pass').value;
                const asn1 = forge.asn1.fromDer(forge.util.decode64(raw.replace(/\s/g, '')));
                const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, pfxPass);
                const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
                const certs = certBags[forge.pki.oids.certBag] || [];
                if (certs.length === 0) return showMessage('certs_msg', 'Nenhum certificado encontrado no PFX', 'error');

                let output = `═══════════════════════════════════════════\n  INFORMAÇÕES DO PFX/PKCS#12\n═══════════════════════════════════════════\n\n`;
                output += `Certificados encontrados: ${certs.length}\n\n`;

                certs.forEach((bag, i) => {
                    const cert = bag.cert;
                    const subject = cert.subject.getField('CN')?.value || 'N/A';
                    const issuer = cert.issuer.getField('CN')?.value || 'N/A';
                    const serial = cert.serialNumber;
                    const notBefore = cert.validity.notBefore.toLocaleString('pt-BR');
                    const notAfter = cert.validity.notAfter.toLocaleString('pt-BR');
                    const now = new Date();
                    const isExpired = now > cert.validity.notAfter;
                    const daysLeft = Math.ceil((cert.validity.notAfter - now) / (1000 * 60 * 60 * 24));
                    const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
                    const fingerprint = forge.md.sha256.create().update(derBytes).digest().toHex();

                    output += `── Certificado ${i + 1} ──\n`;
                    output += `Subject (CN): ${subject}\nIssuer (CN):  ${issuer}\nSerial:       ${serial}\n`;
                    output += `Válido De:    ${notBefore}\nVálido Até:   ${notAfter}\n`;
                    output += `Status:       ${isExpired ? '❌ EXPIRADO' : '✅ Válido'} (${isExpired ? 'vencido há ' + Math.abs(daysLeft) : daysLeft + ' dias restantes'})\n`;
                    output += `SHA-256:      ${fingerprint}\n\n`;
                });

                document.getElementById('cert_info_output').textContent = output;
                showMessage('certs_msg', 'Informações do PFX extraídas!');
            } catch (e) {
                Logger.error('Erro ao analisar PFX/certificado', { error: e.message });
                showMessage('certs_msg', 'Erro: ' + e.message + (e.message.includes('password') ? ' — Verifique a senha.' : ''), 'error');
            }
            return;
        });

        // ===== Tab 2: Validate Pair =====
        document.getElementById('cert_btn_pair').addEventListener('click', async () => {
            const certPem = document.getElementById('pair_cert_input').value.trim();
            const keyPem = document.getElementById('pair_key_input').value.trim();
            if (!certPem || !keyPem) return showMessage('certs_msg', 'Cole o certificado E a chave privada', 'error');

            try {
                const certSpki = extractSpkiDer(certPem, false);
                const keySpki = extractSpkiDer(keyPem, true);

                if (!certSpki || !keySpki) {
                    showMessage('certs_msg', 'Erro ao extrair chave pública de um dos arquivos', 'error');
                    return;
                }

                const certHash = getPublicKeyHash(certSpki);
                const keyHash = getPublicKeyHash(keySpki);
                const match = certHash === keyHash;

                // Also compute modulus MD5 (compatível com openssl)
                const cert = forge.pki.certificateFromPem(certPem);
                const key = forge.pki.privateKeyFromPem(keyPem);
                const certModulusMd5 = forge.md.md5.create().update(cert.publicKey.n.toString(16)).digest().toHex();
                const keyModulusMd5 = forge.md.md5.create().update(key.n.toString(16)).digest().toHex();

                let output = `═══════════════════════════════════════════\n`;
                output += `  VALIDAÇÃO DE PAR (CERT + KEY)\n`;
                output += `═══════════════════════════════════════════\n\n`;
                output += `Cert Public Key SHA-256: ${certHash}\n`;
                output += `Key  Public Key SHA-256: ${keyHash}\n\n`;
                output += `Cert Modulus MD5: ${certModulusMd5}\n`;
                output += `Key  Modulus MD5: ${keyModulusMd5}\n\n`;
                output += match
                    ? '✅ PAR VÁLIDO — Certificado e chave são correspondentes!'
                    : '❌ PAR INVÁLIDO — Certificado e chave NÃO correspondem!';

                document.getElementById('cert_pair_output').textContent = output;
                document.getElementById('cert_pair_output_text').value = output;
                showMessage('certs_msg', match ? 'Par válido!' : 'Par NÃO corresponde!', match ? 'success' : 'error');
            } catch (e) {
                Logger.error('Erro ao validar par', { error: e.message });
                showMessage('certs_msg', 'Erro: ' + e.message, 'error');
            }
        });

        // ===== Tab 3: Conversions (searchable dropdown) =====
        const convertTypeHidden = document.getElementById('convert_type');
        const convertSearch = document.getElementById('convert_type_search');
        const convertDropdown = document.getElementById('convert_type_dropdown');
        const passPanel = document.getElementById('convert_pass_panel');
        const extraPanel = document.getElementById('convert_extra_panel');

        // Conversion options data
        const CONV_OPTIONS = [
            { group: '📦 PFX → PEM (mais usados)', items: [
                { value: 'pfx_to_pem', label: '📦➡️📄+🔑 PFX → PEM + Key (.pem + .key)' },
                { value: 'pfx_to_pem_only', label: '📦➡️📄 PFX → Apenas PEM (.pem)' },
                { value: 'pfx_to_key_only', label: '📦➡️🔑 PFX → Apenas Key (.key)' },
            ]},
            { group: '📦 PFX → CER', items: [
                { value: 'pfx_to_cer_key', label: '📦➡️📄+🔑 PFX → CER + Key (.cer + .key)' },
                { value: 'pfx_to_cer_only', label: '📦➡️📄 PFX → Apenas CER (.cer)' },
            ]},
            { group: '📦 Empacotar', items: [
                { value: 'pem_to_pfx', label: '📄+🔑➡️📦 Cert + Key → PFX (empacotar)' },
            ]},
            { group: '📜 Certificado (conversões)', items: [
                { value: 'pem_to_der', label: '📜➡️📄 PEM → DER (.cer binário)' },
                { value: 'der_to_pem', label: '📄➡️📜 DER (Base64) → PEM' },
                { value: 'cert_to_text', label: '📜➡️📝 Cert → Resumo legível' },
                { value: 'cert_to_fulltext', label: '📜➡️📋 Cert → Texto completo (x509 -text)' },
                { value: 'cert_to_json', label: '📜➡️{} Cert → JSON estruturado' },
            ]},
            { group: '🔍 Fingerprint / Hashes', items: [
                { value: 'cert_fingerprint_sha256', label: '📜→ SHA-256 Fingerprint' },
                { value: 'cert_fingerprint_sha1', label: '📜→ SHA-1 Fingerprint' },
                { value: 'cert_fingerprint_md5', label: '📜→ MD5 Fingerprint' },
            ]},
            { group: '📋 Extrair informações', items: [
                { value: 'extract_sans', label: '📜→ SANs (Subject Alt Names)' },
                { value: 'extract_urls', label: '📜→ URLs (CRL, OCSP, AIA)' },
                { value: 'extract_pubkey', label: '📜/🔑→ Chave Pública PEM' },
                { value: 'cert_days_left', label: '📜→ Dias restantes de validade' },
            ]},
            { group: '🔑 Chaves (conversões)', items: [
                { value: 'key_pkcs1_to_pkcs8', label: '🔑 PKCS#1 → PKCS#8' },
                { value: 'key_pkcs8_to_pkcs1', label: '🔑 PKCS#8 → PKCS#1' },
                { value: 'remove_key_pass', label: '🔑🔒→🔓 Remover senha da Key' },
                { value: 'key_to_jwk', label: '🔑→ JWK (JSON Web Key)' },
                { value: 'jwk_to_pem', label: 'JWK→🔑 PEM (RSA)' },
            ]},
            { group: '🆕 Gerar', items: [
                { value: 'generate_rsa_key', label: '🆕 Gerar par de chaves RSA' },
                { value: 'generate_csr', label: '🆕 Gerar CSR (Key + CN)' },
                { value: 'csr_to_text', label: '📝 CSR → Ler informações' },
                { value: 'cert_to_selfsigned', label: '🆕 Gerar cert auto-assinado (Key)' },
            ]},
            { group: '🔧 Utilitários', items: [
                { value: 'chain_concat', label: '🔗 Concatenar cadeia de certs' },
            ]},
        ];

        const getConvLabel = (val) => {
            for (const g of CONV_OPTIONS) {
                const item = g.items.find(i => i.value === val);
                if (item) return item.label;
            }
            return '';
        };

        // Smart content detection
        const detectContentType = (raw) => {
            if (!raw || raw.length < 5) return { type: 'unknown', suggestions: [] };
            const trimmed = raw.trim();

            // PEM Certificate
            if (trimmed.includes('-----BEGIN CERTIFICATE-----') && !trimmed.includes('CERTIFICATE REQUEST')) {
                return {
                    type: 'cert',
                    suggestions: ['cert_to_text', 'cert_fingerprint_sha256', 'cert_to_json', 'extract_sans', 'extract_urls', 'extract_pubkey', 'cert_days_left', 'cert_to_fulltext', 'pem_to_der', 'cert_fingerprint_sha1', 'cert_fingerprint_md5', 'cert_to_selfsigned', 'pem_to_pfx', 'chain_concat']
                };
            }
            // CSR
            if (trimmed.includes('CERTIFICATE REQUEST')) {
                return { type: 'csr', suggestions: ['csr_to_text', 'extract_pubkey', 'generate_csr'] };
            }
            // Encrypted key
            if (trimmed.includes('ENCRYPTED') && trimmed.includes('PRIVATE KEY')) {
                return { type: 'enc_key', suggestions: ['remove_key_pass', 'key_pkcs8_to_pkcs1', 'key_to_jwk', 'generate_csr', 'pem_to_pfx', 'cert_to_selfsigned'] };
            }
            // PKCS#8 private key
            if (trimmed.includes('-----BEGIN PRIVATE KEY-----')) {
                return {
                    type: 'key_pkcs8',
                    suggestions: ['key_pkcs8_to_pkcs1', 'extract_pubkey', 'key_to_jwk', 'remove_key_pass', 'generate_csr', 'cert_to_selfsigned', 'pem_to_pfx']
                };
            }
            // PKCS#1 private key
            if (trimmed.includes('RSA PRIVATE KEY')) {
                return {
                    type: 'key_pkcs1',
                    suggestions: ['key_pkcs1_to_pkcs8', 'extract_pubkey', 'key_to_jwk', 'remove_key_pass', 'generate_csr', 'cert_to_selfsigned', 'pem_to_pfx']
                };
            }
            // Public key
            if (trimmed.includes('-----BEGIN PUBLIC KEY-----')) {
                return { type: 'pubkey', suggestions: ['extract_pubkey', 'key_to_jwk'] };
            }
            // JWK JSON
            if (trimmed.startsWith('{') && trimmed.includes('"kty"')) {
                return { type: 'jwk', suggestions: ['jwk_to_pem', 'key_to_jwk'] };
            }
            // Looks like PFX/P12 (base64 without PEM headers)
            if (!trimmed.includes('BEGIN') && trimmed.length > 50) {
                try {
                    forge.asn1.fromDer(forge.util.decode64(trimmed));
                    return {
                        type: 'pfx',
                        suggestions: ['pfx_to_pem', 'pfx_to_cer_key', 'pfx_to_key_only', 'pfx_to_pem_only', 'pfx_to_cer_only']
                    };
                } catch (_) {}
            }
            return { type: 'unknown', suggestions: [] };
        };

        const renderDropdown = (filter = '') => {
            const q = filter.toLowerCase().trim();
            const inputVal = document.getElementById('convert_input').value.trim();
            const detection = detectContentType(inputVal);
            let html = '';
            let total = 0;

            // If no filter and content detected, show suggestions first
            if (!q && detection.suggestions.length > 0) {
                html += `<div class="convert-dropdown-group">`;
                html += `<div class="convert-dropdown-label">⭐ Sugestões (${detection.type === 'pfx' ? 'PFX detectado' : detection.type === 'cert' ? 'Cert detectado' : detection.type === 'key_pkcs8' ? 'Chave PKCS#8' : detection.type === 'key_pkcs1' ? 'Chave PKCS#1' : detection.type === 'csr' ? 'CSR detectado' : detection.type === 'jwk' ? 'JWK detectado' : detection.type === 'enc_key' ? 'Chave encriptada' : detection.type === 'pubkey' ? 'Chave pública' : 'Detectado'})</div>`;
                detection.suggestions.forEach(val => {
                    const label = getConvLabel(val);
                    if (!label) return;
                    const sel = val === convertTypeHidden.value ? ' selected' : '';
                    html += `<div class="convert-dropdown-item suggested${sel}" data-value="${val}">${label}</div>`;
                    total++;
                });
                html += `</div>`;
                html += `<div class="convert-dropdown-divider"></div>`;
            }

            // All options (filtered or not)
            CONV_OPTIONS.forEach(group => {
                const filtered = q ? group.items.filter(i => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q)) : group.items;
                if (filtered.length === 0) return;
                html += `<div class="convert-dropdown-group">`;
                html += `<div class="convert-dropdown-label">${group.group}</div>`;
                filtered.forEach(item => {
                    // Skip if already in suggestions (when no filter)
                    if (!q && detection.suggestions.includes(item.value)) return;
                    const sel = item.value === convertTypeHidden.value ? ' selected' : '';
                    html += `<div class="convert-dropdown-item${sel}" data-value="${item.value}">${item.label}</div>`;
                    total++;
                });
                html += `</div>`;
            });
            if (total === 0 && detection.suggestions.length === 0) html = '<div class="convert-dropdown-empty">Nenhuma conversão encontrada</div>';
            convertDropdown.innerHTML = html;
            // Bind click
            convertDropdown.querySelectorAll('.convert-dropdown-item').forEach(el => {
                el.addEventListener('click', () => {
                    selectConvOption(el.dataset.value);
                });
            });
        };

        const selectConvOption = (val) => {
            convertTypeHidden.value = val;
            convertSearch.value = getConvLabel(val);
            convertDropdown.classList.remove('open');
            convertTypeHidden.dispatchEvent(new Event('change'));
        };

        // Init: search starts EMPTY
        convertSearch.value = '';
        convertSearch.placeholder = '🔍 Digite para buscar (ex: pem, cer, key, pfx...)';

        convertSearch.addEventListener('focus', () => {
            renderDropdown(convertSearch.value);
            convertDropdown.classList.add('open');
        });
        convertSearch.addEventListener('input', () => {
            renderDropdown(convertSearch.value);
            convertDropdown.classList.add('open');
        });
        convertSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { convertDropdown.classList.remove('open'); convertSearch.blur(); }
            if (e.key === 'Enter') { e.preventDefault(); const first = convertDropdown.querySelector('.convert-dropdown-item'); if (first) selectConvOption(first.dataset.value); }
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#cert_convert .panel-content')) convertDropdown.classList.remove('open');
        });

        // Expose convertType for compatibility with existing code
        const convertType = { get value() { return convertTypeHidden.value; }, set value(v) { convertTypeHidden.value = v; convertSearch.value = getConvLabel(v); } };

        // Smart upload for conversion input — intercept binary files (PFX)
        const convertUploadBtn = document.querySelector('#cert_convert .upload-btn[data-target="convert_input"]');
        if (convertUploadBtn) {
            convertUploadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const fi = document.createElement('input');
                fi.type = 'file';
                fi.accept = '.cer,.crt,.pem,.pfx,.p12,.key,.der';
                fi.onchange = (ev) => {
                    const file = ev.target.files[0];
                    if (!file) return;
                    const ext = file.name.split('.').pop().toLowerCase();
                    const isBinary = ['pfx', 'p12', 'der', 'cer'].includes(ext);
                    if (isBinary) {
                        const reader = new FileReader();
                        reader.onload = (rev) => {
                            const b64 = rev.target.result.split(',')[1];
                            document.getElementById('convert_input').value = b64;
                            // Auto-select PFX conversion type
                            if (ext === 'pfx' || ext === 'p12') {
                                convertType.value = 'pfx_to_pem';
                                convertType.dispatchEvent(new Event('change'));
                            }
                            showMessage('certs_msg', `"${file.name}" carregado (${(file.size / 1024).toFixed(1)} KB).`);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        const reader = new FileReader();
                        reader.onload = (rev) => {
                            document.getElementById('convert_input').value = rev.target.result;
                            showMessage('certs_msg', `"${file.name}" carregado.`);
                        };
                        reader.readAsText(file);
                    }
                };
                fi.click();
            }, true);
        }

        // Auto-detect PFX in conversion input — show password panel
        document.getElementById('convert_input').addEventListener('input', () => {
            const val = document.getElementById('convert_input').value.trim();
            if (!val) return;
            // If content looks like PFX (base64 without PEM headers), auto-select PFX type
            if (!val.includes('BEGIN') && !val.includes('PRIVATE KEY')) {
                try {
                    forge.asn1.fromDer(forge.util.decode64(val));
                    // Looks like valid DER/PFX - auto-select if current type isn't PFX-related
                    const v = convertType.value;
                    if (!v.startsWith('pfx_') && v !== 'pem_to_pfx') {
                        convertType.value = 'pfx_to_pem';
                        convertType.dispatchEvent(new Event('change'));
                    }
                } catch (_) {}
            }
        });

        // Show/hide extra panels based on conversion type
        convertTypeHidden.addEventListener('change', () => {
            const v = convertTypeHidden.value;
            const needsPass = ['remove_key_pass', 'pem_to_pfx', 'pfx_to_pem', 'pfx_to_cer_key', 'pfx_to_pem_only', 'pfx_to_cer_only', 'pfx_to_key_only', 'generate_csr', 'cert_to_selfsigned', 'generate_rsa_key'].includes(v);
            const needsExtra = ['pem_to_pfx'].includes(v);
            passPanel.style.display = needsPass ? 'block' : 'none';
            extraPanel.style.display = needsExtra ? 'block' : 'none';
            if (v === 'pem_to_pfx') {
                passPanel.querySelector('h3').textContent = 'Senha para o PFX';
                passPanel.querySelector('input').placeholder = 'Senha para proteger o PFX';
            } else if (v === 'remove_key_pass') {
                passPanel.querySelector('h3').textContent = 'Senha da Chave Privada';
                passPanel.querySelector('input').placeholder = 'Digite a senha da chave';
            } else if (v.startsWith('pfx_')) {
                passPanel.querySelector('h3').textContent = 'Senha do PFX';
                passPanel.querySelector('input').placeholder = 'Senha do arquivo PFX';
            } else if (v === 'generate_rsa_key') {
                passPanel.querySelector('h3').textContent = 'Tamanho da Chave (bits)';
                passPanel.querySelector('input').placeholder = '2048 ou 4096 (padrão: 2048)';
                passPanel.querySelector('input').type = 'number';
            } else if (v === 'generate_csr') {
                passPanel.querySelector('h3').textContent = 'Common Name (CN) do CSR';
                passPanel.querySelector('input').placeholder = 'ex: meusite.com.br';
            } else if (v === 'cert_to_selfsigned') {
                passPanel.querySelector('h3').textContent = 'Dias de Validade do Cert';
                passPanel.querySelector('input').placeholder = '365 (padrão)';
                passPanel.querySelector('input').type = 'number';
            } else {
                passPanel.querySelector('input').type = 'password'; // reset
            }
        });

        document.getElementById('btn_convert_exec').addEventListener('click', async () => {
            const input = document.getElementById('convert_input').value.trim();
            const type = convertType.value;
            const output = document.getElementById('convert_output');

            if (!input && type !== 'pem_to_pfx') return showMessage('certs_msg', 'Cole o conteúdo na entrada', 'error');

            try {
                switch (type) {
                    case 'pem_to_der': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const asn1 = forge.pki.certificateToAsn1(forge.pki.certificateFromPem(input));
                        const derBytes = forge.asn1.toDer(asn1).getBytes();
                        const b64 = forge.util.encode64(derBytes);
                        output.value = `Formato DER (Base64):\n${b64}\n\nTamanho: ${derBytes.length} bytes`;
                        // Auto-download
                        const arr = new Uint8Array(derBytes.length);
                        for (let i = 0; i < derBytes.length; i++) arr[i] = derBytes.charCodeAt(i);
                        const blob = new Blob([arr], { type: 'application/octet-stream' });
                        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'certificado.cer'; a.click(); URL.revokeObjectURL(a.href);
                        showMessage('certs_msg', 'Certificado convertido para DER e download iniciado!');
                        break;
                    }
                    case 'der_to_pem': {
                        const bytes = forge.util.decode64(input.replace(/\s/g, ''));
                        const asn1 = forge.asn1.fromDer(bytes);
                        const cert = forge.pki.certificateFromAsn1(asn1);
                        output.value = forge.pki.certificateToPem(cert);
                        showMessage('certs_msg', 'DER convertido para PEM!');
                        break;
                    }
                    case 'extract_pubkey': {
                        let pubKeyPem;
                        if (input.includes('BEGIN CERTIFICATE')) {
                            const cert = forge.pki.certificateFromPem(input);
                            pubKeyPem = forge.pki.publicKeyToPem(cert.publicKey);
                        } else if (input.includes('PRIVATE KEY')) {
                            const key = forge.pki.privateKeyFromPem(input);
                            pubKeyPem = forge.pki.publicKeyToPem(forge.pki.setRsaPublicKey(key.n, key.e));
                        } else { return showMessage('certs_msg', 'Formato não reconhecido', 'error'); }
                        const spkiDer = extractSpkiDer(input, input.includes('PRIVATE KEY'));
                        const hash = spkiDer ? getPublicKeyHash(spkiDer) : 'N/A';
                        output.value = `${pubKeyPem}\n\nSHA-256 da Chave Pública:\n${hash}`;
                        showMessage('certs_msg', 'Chave pública extraída!');
                        break;
                    }
                    case 'key_pkcs1_to_pkcs8': {
                        if (!input.includes('RSA PRIVATE KEY')) return showMessage('certs_msg', 'Cole uma chave no formato PKCS#1 (BEGIN RSA PRIVATE KEY)', 'error');
                        const key = forge.pki.privateKeyFromPem(input);
                        output.value = forge.pki.privateKeyToPem(key); // node-forge stores as PKCS#8 by default
                        showMessage('certs_msg', 'Chave convertida para PKCS#8!');
                        break;
                    }
                    case 'key_pkcs8_to_pkcs1': {
                        if (!input.includes('PRIVATE KEY') || input.includes('RSA PRIVATE KEY')) return showMessage('certs_msg', 'Cole uma chave no formato PKCS#8 (BEGIN PRIVATE KEY)', 'error');
                        const key = forge.pki.privateKeyFromPem(input);
                        // Manual PKCS#1 PEM
                        const rsaAsn1 = forge.pki.privateKeyToAsn1(key);
                        const rsaDer = forge.asn1.toDer(rsaAsn1).getBytes();
                        output.value = '-----BEGIN RSA PRIVATE KEY-----\n' + forge.util.encode64(rsaDer).match(/.{1,64}/g).join('\n') + '\n-----END RSA PRIVATE KEY-----';
                        showMessage('certs_msg', 'Chave convertida para PKCS#1!');
                        break;
                    }
                    case 'remove_key_pass': {
                        const pass = document.getElementById('convert_key_pass').value;
                        if (!input.includes('ENCRYPTED')) return showMessage('certs_msg', 'Esta chave não parece estar protegida por senha', 'error');
                        if (!pass) return showMessage('certs_msg', 'Digite a senha da chave privada', 'error');
                        const decryptedKey = forge.pki.decryptRsaPrivateKey(input, pass);
                        if (!decryptedKey) return showMessage('certs_msg', 'Senha incorreta ou formato inválido', 'error');
                        output.value = forge.pki.privateKeyToPem(decryptedKey);
                        showMessage('certs_msg', 'Senha removida com sucesso!');
                        break;
                    }
                    case 'cert_to_text': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const cert = forge.pki.certificateFromPem(input);
                        const issuer = cert.issuer.getField('CN')?.value || 'N/A';
                        const subject = cert.subject.getField('CN')?.value || 'N/A';
                        const serial = cert.serialNumber;
                        const nb = cert.validity.notBefore.toLocaleString('pt-BR');
                        const na = cert.validity.notAfter.toLocaleString('pt-BR');
                        const days = Math.ceil((cert.validity.notAfter - new Date()) / 86400000);
                        let txt = `Subject: ${subject}\nIssuer: ${issuer}\nSerial: ${serial}\nVálido De: ${nb}\nVálido Até: ${na}\nDias restantes: ${days}\n\n`;
                        // SANs
                        try {
                            const sanExt = cert.getExtension('subjectAltName');
                            if (sanExt && sanExt.altNames) {
                                txt += 'Subject Alt Names (SAN):\n';
                                sanExt.altNames.forEach(n => { txt += `  ${n.type === 2 ? 'DNS' : n.type === 7 ? 'IP' : n.type}: ${n.value || n.ip}\n`; });
                            }
                        } catch (_) {}
                        output.value = txt;
                        showMessage('certs_msg', 'Informações extraídas!');
                        break;
                    }
                    case 'pem_to_pfx': {
                        const extra = document.getElementById('convert_extra').value.trim();
                        const pass = document.getElementById('convert_key_pass').value;
                        if (!input.includes('BEGIN CERTIFICATE') && !extra.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole o certificado PEM na entrada ou no campo adicional', 'error');
                        if (!input.includes('PRIVATE KEY') && !extra.includes('PRIVATE KEY')) return showMessage('certs_msg', 'Cole a chave privada PEM na entrada ou no campo adicional', 'error');
                        const certPem = input.includes('CERTIFICATE') ? input : extra;
                        const keyPem = input.includes('PRIVATE KEY') ? input : extra;
                        const cert = forge.pki.certificateFromPem(certPem);
                        const key = forge.pki.privateKeyFromPem(keyPem);
                        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(key, [cert], pass || '', { algorithm: '3des' });
                        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
                        const p12B64 = forge.util.encode64(p12Der);
                        output.value = p12B64;
                        // Auto-download
                        const arr = new Uint8Array(p12Der.length);
                        for (let i = 0; i < p12Der.length; i++) arr[i] = p12Der.charCodeAt(i);
                        const blob = new Blob([arr], { type: 'application/x-pkcs12' });
                        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'certificado.pfx'; a.click(); URL.revokeObjectURL(a.href);
                        showMessage('certs_msg', 'PFX gerado e download iniciado!');
                        break;
                    }
                    // ===== New conversions: Full text, JSON, Fingerprints, SANs, URLs, JWK, CSR, Key Gen, Self-signed, Chain, Days =====
                    case 'cert_to_fulltext': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const c = forge.pki.certificateFromPem(input);
                        const exts = c.extensions || [];
                        let txt = `Certificate:\n`;
                        txt += `  Data:\n`;
                        txt += `    Version: ${(c.version + 1)} (0x${c.version.toString(16)})\n`;
                        txt += `    Serial Number: ${c.serialNumber}\n`;
                        txt += `  Signature Algorithm: ${c.siginfo.algorithmOid || 'N/A'}\n`;
                        txt += `  Issuer: ${c.issuer.attributes.map(a => `${a.shortName || a.name}=${a.value}`).join(', ')}\n`;
                        txt += `  Validity:\n`;
                        txt += `    Not Before: ${c.validity.notBefore.toLocaleString('pt-BR')}\n`;
                        txt += `    Not After:  ${c.validity.notAfter.toLocaleString('pt-BR')}\n`;
                        txt += `  Subject: ${c.subject.attributes.map(a => `${a.shortName || a.name}=${a.value}`).join(', ')}\n`;
                        txt += `  Subject Public Key Info:\n`;
                        txt += `    Public Key Algorithm: rsaEncryption\n`;
                        txt += `    Public-Key: (${(c.publicKey.n.bitLength())} bit)\n`;
                        txt += `    Modulus:\n      ${c.publicKey.n.toString(16).match(/.{1,64}/g)?.join('\n      ')}\n`;
                        txt += `    Exponent: ${c.publicKey.e.toString()} (0x${c.publicKey.e.toString(16)})\n\n`;
                        txt += `  Extensions (${exts.length}):\n`;
                        exts.forEach(ext => {
                            txt += `    ${ext.name || ext.oid}: ${ext.value || JSON.stringify(ext)}\n`;
                        });
                        const derBytes2 = forge.asn1.toDer(forge.pki.certificateToAsn1(c)).getBytes();
                        txt += `\n  Fingerprint SHA-256: ${forge.md.sha256.create().update(derBytes2).digest().toHex()}\n`;
                        txt += `  Fingerprint SHA-1:   ${forge.md.sha1.create().update(derBytes2).digest().toHex()}\n`;
                        txt += `  Fingerprint MD5:     ${forge.md.md5.create().update(derBytes2).digest().toHex()}\n`;
                        output.value = txt;
                        showMessage('certs_msg', 'Texto completo extraído!');
                        break;
                    }
                    case 'cert_to_json': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const cj = forge.pki.certificateFromPem(input);
                        const derBytes3 = forge.asn1.toDer(forge.pki.certificateToAsn1(cj)).getBytes();
                        const sanExt = cj.getExtension('subjectAltName');
                        const jsonData = {
                            version: cj.version + 1,
                            serialNumber: cj.serialNumber,
                            issuer: Object.fromEntries(cj.issuer.attributes.map(a => [a.shortName || a.name, a.value])),
                            subject: Object.fromEntries(cj.subject.attributes.map(a => [a.shortName || a.name, a.value])),
                            validity: {
                                notBefore: cj.validity.notBefore.toISOString(),
                                notAfter: cj.validity.notAfter.toISOString(),
                                daysRemaining: Math.ceil((cj.validity.notAfter - new Date()) / 86400000)
                            },
                            publicKey: {
                                algorithm: 'RSA',
                                bits: cj.publicKey.n.bitLength(),
                                exponent: cj.publicKey.e.toString()
                            },
                            fingerprints: {
                                sha256: forge.md.sha256.create().update(derBytes3).digest().toHex(),
                                sha1: forge.md.sha1.create().update(derBytes3).digest().toHex(),
                                md5: forge.md.md5.create().update(derBytes3).digest().toHex()
                            },
                            san: sanExt?.altNames?.map(n => n.value || n.ip) || []
                        };
                        output.value = JSON.stringify(jsonData, null, 2);
                        showMessage('certs_msg', 'JSON gerado!');
                        break;
                    }
                    case 'cert_fingerprint_sha1': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const cs1 = forge.pki.certificateFromPem(input);
                        const d1 = forge.asn1.toDer(forge.pki.certificateToAsn1(cs1)).getBytes();
                        output.value = `SHA-1 Fingerprint:\n${forge.md.sha1.create().update(d1).digest().toHex()}`;
                        showMessage('certs_msg', 'SHA-1 gerado!');
                        break;
                    }
                    case 'cert_fingerprint_sha256': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const cs2 = forge.pki.certificateFromPem(input);
                        const d2 = forge.asn1.toDer(forge.pki.certificateToAsn1(cs2)).getBytes();
                        output.value = `SHA-256 Fingerprint:\n${forge.md.sha256.create().update(d2).digest().toHex()}`;
                        showMessage('certs_msg', 'SHA-256 gerado!');
                        break;
                    }
                    case 'cert_fingerprint_md5': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const cm = forge.pki.certificateFromPem(input);
                        const dm = forge.asn1.toDer(forge.pki.certificateToAsn1(cm)).getBytes();
                        output.value = `MD5 Fingerprint:\n${forge.md.md5.create().update(dm).digest().toHex()}`;
                        showMessage('certs_msg', 'MD5 gerado!');
                        break;
                    }
                    case 'extract_sans': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const cSan = forge.pki.certificateFromPem(input);
                        const sanExt = cSan.getExtension('subjectAltName');
                        if (!sanExt || !sanExt.altNames?.length) {
                            output.value = 'Nenhum SAN encontrado neste certificado.';
                        } else {
                            let txt = 'Subject Alt Names (SAN):\n\n';
                            sanExt.altNames.forEach((n, i) => {
                                const label = n.type === 2 ? 'DNS' : n.type === 7 ? 'IP' : n.type === 6 ? 'URI' : n.type === 1 ? 'Email' : `Type ${n.type}`;
                                txt += `  ${i + 1}. ${label}: ${n.value || n.ip}\n`;
                            });
                            output.value = txt;
                        }
                        showMessage('certs_msg', 'SANs extraídos!');
                        break;
                    }
                    case 'extract_urls': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const cUrl = forge.pki.certificateFromPem(input);
                        let urls = 'URLs do Certificado:\n\n';
                        // CRL Distribution Points
                        const crl = cUrl.getExtension('cRLDistributionPoints');
                        if (crl) {
                            urls += '── CRL Distribution Points ──\n';
                            const points = Array.isArray(crl) ? crl : [crl];
                            points.forEach(p => { if (p.value) urls += `  ${p.value}\n`; });
                            urls += '\n';
                        }
                        // Authority Info Access (OCSP, CA Issuers)
                        const aia = cUrl.getExtension('authorityInfoAccess');
                        if (aia) {
                            urls += '── Authority Info Access (AIA) ──\n';
                            const accs = Array.isArray(aia) ? aia : [aia];
                            accs.forEach(a => { if (a.value) urls += `  ${a.value}\n`; });
                            urls += '\n';
                        }
                        // Subject Alt Names
                        const sanExt = cUrl.getExtension('subjectAltName');
                        if (sanExt?.altNames?.length) {
                            urls += '── Subject Alt Names (SAN) ──\n';
                            sanExt.altNames.forEach(n => { urls += `  ${n.value || n.ip}\n`; });
                        }
                        if (urls === 'URLs do Certificado:\n\n') urls += 'Nenhuma URL encontrada.';
                        output.value = urls;
                        showMessage('certs_msg', 'URLs extraídas!');
                        break;
                    }
                    case 'key_to_jwk': {
                        if (!input.includes('PRIVATE KEY') && !input.includes('PUBLIC KEY')) return showMessage('certs_msg', 'Cole uma chave PEM (privada ou pública)', 'error');
                        let jwk;
                        if (input.includes('PRIVATE KEY') && !input.includes('PUBLIC KEY')) {
                            const k = forge.pki.privateKeyFromPem(input);
                            const n = forge.util.encode64(forge.util.binary.raw.encode(forge.util.hexToBytes(k.n.toString(16))));
                            const e = forge.util.encode64(forge.util.binary.raw.encode(forge.util.hexToBytes(k.e.toString(16))));
                            const d = forge.util.encode64(forge.util.binary.raw.encode(forge.util.hexToBytes(k.d.toString(16))));
                            jwk = { kty: 'RSA', n, e, d, p: '', q: '', dp: '', dq: '', qi: '' };
                            try { jwk.p = forge.util.encode64(forge.util.binary.raw.encode(forge.util.hexToBytes(k.p.toString(16)))); } catch(_) {}
                            try { jwk.q = forge.util.encode64(forge.util.binary.raw.encode(forge.util.hexToBytes(k.q.toString(16)))); } catch(_) {}
                        } else {
                            const cert = forge.pki.certificateFromPem(input);
                            const k = cert.publicKey;
                            const n = forge.util.encode64(forge.util.binary.raw.encode(forge.util.hexToBytes(k.n.toString(16))));
                            const e = forge.util.encode64(forge.util.binary.raw.encode(forge.util.hexToBytes(k.e.toString(16))));
                            jwk = { kty: 'RSA', n, e };
                        }
                        output.value = JSON.stringify(jwk, null, 2);
                        showMessage('certs_msg', 'JWK gerado!');
                        break;
                    }
                    case 'jwk_to_pem': {
                        let jwk;
                        try { jwk = JSON.parse(input); } catch (_) { return showMessage('certs_msg', 'Cole um JSON JWK válido', 'error'); }
                        if (jwk.kty !== 'RSA') return showMessage('certs_msg', 'Apenas chaves RSA são suportadas', 'error');
                        const nBytes = forge.util.binary.raw.decode(forge.util.decode64(jwk.n));
                        const eBytes = forge.util.binary.raw.decode(forge.util.decode64(jwk.e));
                        const nHex = forge.util.bytesToHex(nBytes);
                        const eHex = forge.util.bytesToHex(eBytes);
                        if (jwk.d) {
                            // Private key
                            const dBytes = forge.util.binary.raw.decode(forge.util.decode64(jwk.d));
                            const pBytes = jwk.p ? forge.util.binary.raw.decode(forge.util.decode64(jwk.p)) : null;
                            const qBytes = jwk.q ? forge.util.binary.raw.decode(forge.util.decode64(jwk.q)) : null;
                            const privKey = forge.pki.setRsaPublicKey(
                                new forge.jsbn.BigInteger(nHex, 16),
                                new forge.jsbn.BigInteger(eHex, 16)
                            );
                            // This won't work directly for private keys; use a workaround
                            output.value = 'Nota: JWK → Private Key PEM requer campos completos (n, e, d, p, q, dp, dq, qi).\n\nPublic Key components:\n' + forge.pki.publicKeyToPem(privKey);
                        } else {
                            // Public key
                            const pubKey = forge.pki.setRsaPublicKey(
                                new forge.jsbn.BigInteger(nHex, 16),
                                new forge.jsbn.BigInteger(eHex, 16)
                            );
                            output.value = forge.pki.publicKeyToPem(pubKey);
                        }
                        showMessage('certs_msg', 'Chave PEM gerada!');
                        break;
                    }
                    case 'generate_rsa_key': {
                        const bits = parseInt(document.getElementById('convert_key_pass').value) || 2048;
                        if (bits < 1024 || bits > 8192) return showMessage('certs_msg', 'Tamanho deve ser entre 1024 e 8192', 'error');
                        showMessage('certs_msg', `Gerando chave RSA de ${bits} bits... (pode demorar)`);
                        output.value = 'Gerando...';
                        forge.pki.rsa.generateKeyPair({ bits, workers: -1 }, (err, keypair) => {
                            if (err) { output.value = 'Erro: ' + err.message; return; }
                            const privPem = forge.pki.privateKeyToPem(keypair.privateKey);
                            const pubPem = forge.pki.publicKeyToPem(keypair.publicKey);
                            output.value = `════ RSA ${bits}-bit Key Pair ════\n\n── Private Key ──\n${privPem}\n── Public Key ──\n${pubPem}`;
                            showMessage('certs_msg', `Chave RSA ${bits} gerada!`);
                        });
                        break;
                    }
                    case 'generate_csr': {
                        const cn = document.getElementById('convert_key_pass').value.trim();
                        if (!cn) return showMessage('certs_msg', 'Digite o Common Name (CN) no campo acima', 'error');
                        if (!input.includes('PRIVATE KEY')) return showMessage('certs_msg', 'Cole a chave privada PEM na entrada', 'error');
                        const kCsr = forge.pki.privateKeyFromPem(input);
                        const csr = forge.pki.createCertificationRequest();
                        csr.publicKey = forge.pki.setRsaPublicKey(kCsr.n, kCsr.e);
                        csr.setSubject([{ name: 'commonName', value: cn }]);
                        csr.sign(kCsr);
                        output.value = forge.pki.certificationRequestToPem(csr);
                        showMessage('certs_msg', 'CSR gerado!');
                        break;
                    }
                    case 'csr_to_text': {
                        if (!input.includes('CERTIFICATE REQUEST')) return showMessage('certs_msg', 'Cole um CSR PEM (BEGIN CERTIFICATE REQUEST)', 'error');
                        const csr = forge.pki.certificationRequestFromPem(input);
                        let txt = `═══════════════════════════════════════════\n`;
                        txt += `  INFORMAÇÕES DO CSR\n`;
                        txt += `═══════════════════════════════════════════\n\n`;
                        txt += `Subject: ${csr.subject.attributes.map(a => `${a.shortName || a.name}=${a.value}`).join(', ')}\n`;
                        txt += `Signature Algorithm: ${csr.siginfo?.algorithmOid || 'N/A'}\n`;
                        txt += `Public Key: RSA ${(csr.publicKey.n.bitLength())} bits\n`;
                        txt += `Assinatura Válida: ${csr.verify() ? '✅ Sim' : '❌ Não'}\n`;
                        output.value = txt;
                        showMessage('certs_msg', 'CSR lido!');
                        break;
                    }
                    case 'pfx_to_pem':
                    case 'pfx_to_cer_key':
                    case 'pfx_to_pem_only':
                    case 'pfx_to_cer_only':
                    case 'pfx_to_key_only': {
                        const pfxPass = document.getElementById('convert_key_pass').value;
                        let asn1;
                        try { asn1 = forge.asn1.fromDer(forge.util.decode64(input.replace(/\s/g, ''))); } catch (_) {}
                        if (!asn1) return showMessage('certs_msg', 'Cole o PFX em Base64', 'error');
                        const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, pfxPass);
                        const cBags = p12.getBags({ bagType: forge.pki.oids.certBag });
                        const certs = cBags[forge.pki.oids.certBag] || [];
                        const kShr = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
                        const kPlain = p12.getBags({ bagType: forge.pki.oids.keyBag });
                        const key = (kShr[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key) || (kPlain[forge.pki.oids.keyBag]?.[0]?.key);

                        const keyBlock = document.getElementById('convert_key_block');
                        const out1Label = document.getElementById('convert_out1_label');
                        const out2Label = document.getElementById('convert_out2_label');
                        const keyOutput = document.getElementById('convert_key_output');
                        keyOutput.value = '';
                        keyBlock.style.display = 'none';

                        const certExt = (type === 'pfx_to_cer_key' || type === 'pfx_to_cer_only') ? '.cer' : '.pem';
                        const certLabel = certExt === '.cer' ? 'CER' : 'PEM';

                        if (type === 'pfx_to_pem' || type === 'pfx_to_cer_key') {
                            out1Label.textContent = `📜 Certificado (${certExt})`;
                            out2Label.textContent = '🔑 Chave Privada (.key)';
                            document.querySelector('#convert_output')?.closest('.panel')?.querySelector('.download-btn')?.setAttribute('data-ext', certExt);
                            document.querySelector('#convert_key_output')?.closest('.panel')?.querySelector('.download-btn')?.setAttribute('data-ext', '.key');
                            if (certs.length > 0) {
                                output.value = certs.map(b => forge.pki.certificateToPem(b.cert)).join('\n');
                            } else {
                                output.value = '# Nenhum certificado encontrado no PFX';
                            }
                            if (key) {
                                keyOutput.value = forge.pki.privateKeyToPem(key);
                                keyBlock.style.display = 'block';
                            }
                            showMessage('certs_msg', `PFX → ${certLabel} + Key extraído!`);
                        } else if (type === 'pfx_to_pem_only' || type === 'pfx_to_cer_only') {
                            out1Label.textContent = `📜 Certificado (${certExt})`;
                            document.querySelector('#convert_output')?.closest('.panel')?.querySelector('.download-btn')?.setAttribute('data-ext', certExt);
                            if (certs.length > 0) {
                                output.value = certs.map(b => forge.pki.certificateToPem(b.cert)).join('\n');
                            } else {
                                return showMessage('certs_msg', 'Nenhum certificado encontrado no PFX', 'error');
                            }
                            showMessage('certs_msg', `PFX → ${certLabel} extraído!`);
                        } else if (type === 'pfx_to_key_only') {
                            out1Label.textContent = '🔑 Chave Privada (.key)';
                            document.querySelector('#convert_output')?.closest('.panel')?.querySelector('.download-btn')?.setAttribute('data-ext', '.key');
                            if (key) {
                                output.value = forge.pki.privateKeyToPem(key);
                            } else {
                                return showMessage('certs_msg', 'Nenhuma chave privada encontrada no PFX', 'error');
                            }
                            showMessage('certs_msg', 'PFX → Key extraído!');
                        }
                        break;
                    }
                    case 'cert_to_selfsigned': {
                        if (!input.includes('PRIVATE KEY')) return showMessage('certs_msg', 'Cole a chave privada PEM na entrada', 'error');
                        const days = parseInt(document.getElementById('convert_key_pass').value) || 365;
                        const kSelf = forge.pki.privateKeyFromPem(input);
                        const certSelf = forge.pki.createCertificate();
                        certSelf.serialNumber = '01';
                        certSelf.validity.notBefore = new Date();
                        certSelf.validity.notAfter = new Date();
                        certSelf.validity.notAfter.setDate(certSelf.validity.notAfter.getDate() + days);
                        certSelf.setSubject([{ name: 'commonName', value: 'Self-Signed Certificate' }]);
                        certSelf.setIssuer(certSelf.subject);
                        certSelf.publicKey = forge.pki.setRsaPublicKey(kSelf.n, kSelf.e);
                        certSelf.sign(kSelf);
                        output.value = forge.pki.certificateToPem(certSelf);
                        showMessage('certs_msg', `Cert auto-assinado (${days} dias) gerado!`);
                        break;
                    }
                    case 'chain_concat': {
                        // Extract all PEM blocks from input and extra
                        const extraChain = document.getElementById('convert_extra').value.trim();
                        const allText = input + '\n' + extraChain;
                        const regex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
                        const matches = allText.match(regex);
                        if (!matches || matches.length === 0) return showMessage('certs_msg', 'Nenhum certificado PEM encontrado na entrada', 'error');
                        let chain = `Cadeia concatenada: ${matches.length} certificado(s)\n${'═'.repeat(50)}\n\n`;
                        chain += matches.join('\n\n');
                        output.value = chain;
                        showMessage('certs_msg', `${matches.length} certificado(s) concatenado(s)!`);
                        break;
                    }
                    case 'cert_days_left': {
                        if (!input.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Cole um certificado PEM', 'error');
                        const cDays = forge.pki.certificateFromPem(input);
                        const now = new Date();
                        const diff = Math.ceil((cDays.validity.notAfter - now) / 86400000);
                        let txt = `═══════════════════════════════════════════\n`;
                        txt += `  VALIDADE DO CERTIFICADO\n`;
                        txt += `═══════════════════════════════════════════\n\n`;
                        txt += `Subject: ${cDays.subject.getField('CN')?.value || 'N/A'}\n`;
                        txt += `Válido De: ${cDays.validity.notBefore.toLocaleString('pt-BR')}\n`;
                        txt += `Válido Até: ${cDays.validity.notAfter.toLocaleString('pt-BR')}\n\n`;
                        if (diff > 0) {
                            txt += `✅ Válido — Faltam ${diff} dias\n`;
                            if (diff <= 30) txt += `⚠️ Atenção: expira em menos de 30 dias!\n`;
                            if (diff <= 7) txt += `🚨 Urgente: expira em menos de 7 dias!\n`;
                        } else {
                            txt += `❌ EXPIRADO — Vencido há ${Math.abs(diff)} dias\n`;
                        }
                        output.value = txt;
                        showMessage('certs_msg', diff > 0 ? `Válido por mais ${diff} dias` : 'Certificado expirado!', diff > 0 ? 'success' : 'error');
                        break;
                    }
                    default:
                        showMessage('certs_msg', 'Selecione um tipo de conversão', 'error');
                }
            } catch (e) {
                Logger.error('Erro na conversão', { error: e.message });
                const msg = e.message || '';
                if (msg.includes('password') || msg.includes('Password') || msg.includes('MAC') || msg.includes('mac') || msg.includes('invalid')) {
                    showErrorModal('Senha incorreta ou PFX corrompido.\n\nVerifique a senha digitada e tente novamente.');
                    showMessage('certs_msg', '❌ Senha incorreta ou PFX corrompido', 'error');
                } else {
                    showMessage('certs_msg', 'Erro: ' + msg, 'error');
                }
            }
        });

        // ===== Tab 4: PFX Extraction (unified via select) =====
        const readPfxInput = () => {
            const raw = document.getElementById('pfx_input').value.trim();
            if (!raw) return null;
            try { return forge.asn1.fromDer(forge.util.decode64(raw)); } catch (_) {}
            try { return forge.asn1.fromDer(raw); } catch (_) {}
            return null;
        };

        document.getElementById('btn_pfx_exec').addEventListener('click', () => {
            const pass = document.getElementById('pfx_pass').value;
            const extractType = document.getElementById('pfx_extract_type').value;
            const asn1 = readPfxInput();
            if (!asn1) return showMessage('certs_msg', 'PFX inválido ou vazio. Cole em Base64.', 'error');

            try {
                const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, pass);

                // Get bags
                const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
                const certs = certBags[forge.pki.oids.certBag] || [];
                const keyBagsShrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
                const keyBagsPlain = p12.getBags({ bagType: forge.pki.oids.keyBag });
                const shroudedKeys = keyBagsShrouded[forge.pki.oids.pkcs8ShroudedKeyBag] || [];
                const plainKeys = keyBagsPlain[forge.pki.oids.keyBag] || [];

                switch (extractType) {
                    case 'cert': {
                        if (certs.length > 0) {
                            document.getElementById('pfx_cert_output').value = forge.pki.certificateToPem(certs[0].cert);
                            document.getElementById('pfx_key_output').value = '';
                        } else {
                            showMessage('certs_msg', 'Nenhum certificado encontrado no PFX', 'error');
                        }
                        break;
                    }
                    case 'key': {
                        const key = shroudedKeys[0]?.key || plainKeys[0]?.key;
                        if (key) {
                            document.getElementById('pfx_key_output').value = forge.pki.privateKeyToPem(key);
                            document.getElementById('pfx_cert_output').value = '';
                        } else {
                            showMessage('certs_msg', 'Nenhuma chave privada encontrada no PFX', 'error');
                        }
                        break;
                    }
                    case 'both': {
                        if (certs.length > 0) {
                            document.getElementById('pfx_cert_output').value = forge.pki.certificateToPem(certs[0].cert);
                        } else {
                            document.getElementById('pfx_cert_output').value = 'Nenhum certificado encontrado.';
                        }
                        const key = shroudedKeys[0]?.key || plainKeys[0]?.key;
                        document.getElementById('pfx_key_output').value = key ? forge.pki.privateKeyToPem(key) : 'Nenhuma chave privada encontrada.';
                        break;
                    }
                    case 'chain': {
                        let chainPem = '';
                        certs.forEach((bag, i) => {
                            const c = bag.cert;
                            const cn = c.subject.getField('CN')?.value || 'N/A';
                            const issuerCn = c.issuer.getField('CN')?.value || 'N/A';
                            chainPem += `══════ Certificado ${i + 1} ══════\n`;
                            chainPem += `Subject: ${cn}\nIssuer: ${issuerCn}\nSerial: ${c.serialNumber}\n\n`;
                            chainPem += forge.pki.certificateToPem(c) + '\n\n';
                        });
                        document.getElementById('pfx_cert_output').value = chainPem || 'Nenhum certificado encontrado.';
                        const key = shroudedKeys[0]?.key || plainKeys[0]?.key;
                        document.getElementById('pfx_key_output').value = key ? forge.pki.privateKeyToPem(key) : 'Nenhuma chave privada encontrada.';
                        break;
                    }
                    case 'info': {
                        let info = `═══════════════════════════════════════════\n`;
                        info += `  INFORMAÇÕES DO PFX/PKCS#12\n`;
                        info += `═══════════════════════════════════════════\n\n`;
                        info += `Certificados encontrados: ${certs.length}\n`;
                        info += `Chaves encontradas: ${shroudedKeys.length + plainKeys.length}\n\n`;
                        certs.forEach((bag, i) => {
                            const c = bag.cert;
                            const nb = c.validity.notBefore.toLocaleString('pt-BR');
                            const na = c.validity.notAfter.toLocaleString('pt-BR');
                            const days = Math.ceil((c.validity.notAfter - new Date()) / 86400000);
                            info += `── Certificado ${i + 1} ──\n`;
                            info += `  Subject: ${c.subject.getField('CN')?.value || 'N/A'}\n`;
                            info += `  Issuer:  ${c.issuer.getField('CN')?.value || 'N/A'}\n`;
                            info += `  Serial:  ${c.serialNumber}\n`;
                            info += `  Válido:  ${nb} → ${na}\n`;
                            info += `  Status:  ${days > 0 ? '✅ Válido (' + days + ' dias)' : '❌ Expirado'}\n\n`;
                        });
                        document.getElementById('pfx_cert_output').value = info;
                        document.getElementById('pfx_key_output').value = '';
                        break;
                    }
                }
                showMessage('certs_msg', 'Extração concluída!');
            } catch (e) {
                Logger.error('Erro ao extrair PFX', { error: e.message });
                if (e.message.includes('password')) {
                    showErrorModal('Senha incorreta ou PFX corrompido.\n\nVerifique a senha digitada e tente novamente.');
                    showMessage('certs_msg', '❌ Senha incorreta', 'error');
                } else {
                    showMessage('certs_msg', 'Erro: ' + e.message, 'error');
                }
            }
        });

        // Security badge: tap to toggle on mobile
        const secBadge = document.getElementById('securityBadge');
        if (secBadge) {
            secBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                secBadge.classList.toggle('active');
            });
            document.addEventListener('click', () => secBadge.classList.remove('active'));
        }

        Logger.info('Certificados SSL tool initialized');
    };

    const initHistory = () => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === 'view_history') {
                item.addEventListener('click', () => displayHistory());
            }
        });

        const clearBtn = document.querySelector('.clear-btn[data-target="history_list"]');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                clearHistory();
                displayHistory();
            });
        }
    };

    // Init All
    initBase64Image();
    initTextBase64();
    initUrlEncode();
    initHTML();
    initJWT();
    initHash();
    initTime();
    initColor();
    initQR();
    initBinaryText();
    initHexText();
    initCSVJSON();
    initJSON();
    initSQL();
    initRegex();
    initXML();
    initCertificates();
    initTextQR();
    initHistory();

    Logger.info('Canivete Suíço Dev initialized', { tools: 19 });

    // Set initially active view's title
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && mainTitle) mainTitle.textContent = activeNav.textContent.trim();

    // ==========================================
    // Command Palette (Ctrl+K)
    // ==========================================
    window.openCmdPalette = function() {
        const overlay = document.getElementById('cmdPalette');
        if (!overlay) return;
        overlay.classList.add('open');
        const input = document.getElementById('cmdInput');
        if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
        // Reset all items visible
        document.querySelectorAll('#cmdResults .cmd-item').forEach(i => i.style.display = '');
    };

    window.closeCmdPalette = function() {
        const overlay = document.getElementById('cmdPalette');
        if (overlay) overlay.classList.remove('open');
    };

    // Cmd palette filter
    const cmdInput = document.getElementById('cmdInput');
    if (cmdInput) {
        cmdInput.addEventListener('input', () => {
            const q = cmdInput.value.toLowerCase();
            document.querySelectorAll('#cmdResults .cmd-item').forEach(item => {
                const label = item.querySelector('.cmd-label')?.textContent?.toLowerCase() || '';
                const hint = item.querySelector('.cmd-hint')?.textContent?.toLowerCase() || '';
                item.style.display = (label.includes(q) || hint.includes(q)) ? '' : 'none';
            });
        });
        cmdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeCmdPalette();
        });
    }

    // Click outside to close
    const cmdOverlay = document.getElementById('cmdPalette');
    if (cmdOverlay) {
        cmdOverlay.addEventListener('click', (e) => { if (e.target === cmdOverlay) closeCmdPalette(); });
    }

    // Ctrl+K shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const overlay = document.getElementById('cmdPalette');
            if (overlay?.classList.contains('open')) closeCmdPalette();
            else openCmdPalette();
        }
    });

    // ==========================================
    // Theme Toggle (global)
    // ==========================================
    window.toggleTheme = function() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        try { localStorage.setItem('devtools_theme', next); } catch (_) {}
        // Update all theme toggle buttons
        const icon = next === 'dark' ? '🌙' : '☀️';
        document.querySelectorAll('#themeToggle, #themeToggleHeader').forEach(btn => {
            if (btn) btn.textContent = icon;
        });
    };

    Logger.info('Command Palette + Theme Toggle initialized');

    // ==========================================
    // Geradores Module
    // ==========================================
    const _rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const _randChar = (chars) => chars[_rand(0, chars.length - 1)];
    const _pad = (n, len) => String(n).padStart(len, '0');
    const _uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); });

    function _calcDVCPF(digits, peso) {
        let sum = 0;
        for (let i = 0; i < digits.length; i++) sum += parseInt(digits[i]) * (peso - i);
        return sum % 11 < 2 ? 0 : 11 - (sum % 11);
    }
    function _gerarCPFNum() {
        const n = Array.from({length: 9}, () => _rand(0, 9));
        const d1 = _calcDVCPF(n, 10);
        const d2 = _calcDVCPF([...n, d1], 11);
        return [...n, d1, d2].join('');
    }
    function _isValidCPF(cpf) {
        cpf = cpf.replace(/[\.\-\s]/g, '').toUpperCase();
        if (cpf.length !== 11) return { valid: false, reason: 'Deve ter 11 caracteres' };
        const isAlpha = /[A-Z]/.test(cpf);
        if (isAlpha) {
            const charVal = c => c >= '0' && c <= '9' ? parseInt(c) : c.charCodeAt(0) - 55;
            const calcDV = (d, p) => { let s=0; for(let i=0;i<d.length;i++) s+=charVal(d[i])*(p-i); return s%11<2?0:11-(s%11); };
            const base = cpf.slice(0,9);
            if (parseInt(cpf[9])!==calcDV(base,10)||parseInt(cpf[10])!==calcDV([...base,cpf[9]],11)) return {valid:false,reason:'DV inválido'};
            return {valid:true,type:'Alfanumérico'};
        }
        if (/^(\d)\1{10}$/.test(cpf)) return {valid:false,reason:'Todos dígitos iguais'};
        const n=cpf.split('').map(Number);
        if(n[9]!==_calcDVCPF(n.slice(0,9),10)||n[10]!==_calcDVCPF(n.slice(0,10),11)) return {valid:false,reason:'DV inválido'};
        return {valid:true,type:'Numérico'};
    }
    function _isValidCNPJ(cnpj) {
        cnpj=cnpj.replace(/[\.\-\/\s]/g,'').toUpperCase();
        if(cnpj.length!==14) return {valid:false,reason:'Deve ter 14 caracteres'};
        const isAlpha=/[A-Z]/.test(cnpj);
        const charVal=c=>c>='0'&&c<='9'?parseInt(c):c.charCodeAt(0)-55;
        const p1=[5,4,3,2,9,8,7,6,5,4,3,2],p2=[6,5,4,3,2,9,8,7,6,5,4,3,2];
        const calcDV=(d,p)=>{let s=0;for(let i=0;i<d.length;i++)s+=charVal(d[i])*p[i];return s%11<2?0:11-(s%11)};
        if(!isAlpha&&/^(\d)\1{13}$/.test(cnpj)) return {valid:false,reason:'Todos dígitos iguais'};
        const a=cnpj.split('');
        if(charVal(a[12])!==calcDV(a.slice(0,12),p1)||charVal(a[13])!==calcDV(a.slice(0,13),p2)) return {valid:false,reason:'DV inválido'};
        return {valid:true,type:isAlpha?'Alfanumérico':'Numérico'};
    }
    function _gerarCNPJNum(filial) {
        const base=Array.from({length:8},()=>_rand(0,9));
        const filArr=String(filial).padStart(4,'0').split('').map(Number);
        const arr=[...base,...filArr];
        const p1=[5,4,3,2,9,8,7,6,5,4,3,2],p2=[6,5,4,3,2,9,8,7,6,5,4,3,2];
        const d1=(()=>{let s=0;for(let i=0;i<arr.length;i++)s+=arr[i]*p1[i];return s%11<2?0:11-(s%11)})();
        const d2=(()=>{let s=0;for(let i=0;i<arr.length;i++)s+=arr[i]*p2[i];s+=d1*p2[12];return s%11<2?0:11-(s%11)})();
        return [...arr,d1,d2].join('');
    }
    const _CHARS='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function _randChar(){return _CHARS[_rand(0,35)];}
    function _charVal(c){return c>='0'&&c<='9'?parseInt(c):c.charCodeAt(0)-55;}
    function _calcDVAlfaCPF(digits,peso){
        let s=0;for(let i=0;i<digits.length;i++)s+=_charVal(digits[i])*(peso-i);
        return s%11<2?0:11-(s%11);
    }
    function _gerarCPFAlfa(){
        const base=Array.from({length:9},()=>_randChar());
        const d1=_calcDVAlfaCPF(base,10);
        const d2=_calcDVAlfaCPF([...base,String(d1)],11);
        return [...base,d1,d2].join('');
    }
    function _gerarCNPJAlfa(filial){
        const p1=[5,4,3,2,9,8,7,6,5,4,3,2],p2=[6,5,4,3,2,9,8,7,6,5,4,3,2];
        const base=Array.from({length:8},()=>_randChar());
        const filArr=String(filial).padStart(4,'0').split('');
        const arr=[...base,...filArr];
        const d1=(()=>{let s=0;for(let i=0;i<arr.length;i++)s+=_charVal(arr[i])*p1[i];return s%11<2?0:11-(s%11)})();
        const d2=(()=>{let s=0;for(let i=0;i<arr.length;i++)s+=_charVal(arr[i])*p2[i];s+=d1*p2[12];return s%11<2?0:11-(s%11)})();
        return [...arr,d1,d2].join('');
    }
    const _NOMES=['Ana','João','Maria','Pedro','Lucas','Julia','Gabriel','Beatriz','Matheus','Larissa','Rafael','Camila','Bruno','Amanda','Felipe','Letícia','Gustavo','Isabela','Leonardo','Mariana'];
    const _SOBR=['Silva','Santos','Oliveira','Souza','Pereira','Costa','Rodrigues','Almeida','Nascimento','Lima'];
    const _CID=['São Paulo','Rio de Janeiro','Belo Horizonte','Brasília','Salvador','Curitiba','Porto Alegre','Recife','Fortaleza','Manaus'];
    const _UF=['SP','RJ','MG','BA','PR','RS','PE','CE','AM','GO'];
    const _LOG=['Rua','Avenida','Travessa'];
    const _RUA=['das Flores','da Paz','Brasil','São Paulo','Paulista','Atlântica','Augusta'];
    const _SEG=['Tecnologia','Comércio','Serviços','Indústria','Alimentação','Saúde','Educação'];
    const _ATV=['Consultoria','Desenvolvimento','Soluções','Assessoria','Distribuidora'];
    const _pick=a=>a[_rand(0,a.length-1)];

    function _criarItem(valor) {
        const row=document.createElement('div');
        row.className='output-item';
        const span=document.createElement('span');
        span.className='output-value';
        span.textContent=valor;
        const btn=document.createElement('button');
        btn.className='btn-copy-item';
        btn.title='Copiar';
        btn.textContent='ðŸ“‹';
        btn.onclick=()=>navigator.clipboard.writeText(valor).then(()=>{btn.textContent='âœ…';setTimeout(()=>btn.textContent='ðŸ“‹',1200);}).catch(()=>{});
        row.appendChild(span);
        row.appendChild(btn);
        return row;
    }
    window.Geradores = {
        copiar(id) {
            const el=document.getElementById(id);
            if(!el)return;
            navigator.clipboard.writeText(el.textContent||el.innerText).then(()=>showToast('Copiado!')).catch(()=>{});
        },
        gerarCPF() {
            const qtd=parseInt(document.getElementById('spi_cpf_qtd')?.value)||10;
            const fmt=document.getElementById('spi_cpf_fmt')?.value||'limpo';
            const alpha=document.getElementById('spi_cpf_alpha')?.checked;
            const out=[];
            for(let i=0;i<qtd;i++){
                let cpf=_gerarCPFNum();
                if(fmt==='mascarado') cpf=cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4');
                out.push(cpf);
            }
            const el=document.getElementById('spi_cpf_out');
            if(el) el.textContent=out.join('\n');
        },
        validarCPFLive() {
            const input=document.getElementById('spi_cpf_val')?.value?.trim();
            const div=document.getElementById('spi_cpf_val_r');
            if(!div)return;
            if(!input){div.innerHTML='';return;}
            const r=_isValidCPF(input);
            div.innerHTML=r.valid
                ?`<div style="padding:0.5rem;color:var(--success);">✅ ${r.type} válido</div>`
                :`<div style="padding:0.5rem;color:var(--danger);">❌ ${r.reason}</div>`;
        },
        gerarCNPJ() {
            const qtd=parseInt(document.getElementById('spi_cnpj_qtd')?.value)||10;
            const filial=parseInt(document.getElementById('spi_cnpj_filial')?.value)||1;
            const fmt=document.getElementById('spi_cnpj_fmt')?.value||'limpo';
            const out=[];
            for(let i=0;i<qtd;i++){
                let cnpj=_gerarCNPJNum(filial);
                if(fmt==='mascarado') cnpj=cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5');
                out.push(cnpj);
            }
            const el=document.getElementById('spi_cnpj_out');
            if(el) el.textContent=out.join('\n');
        },
        validarCNPJLive() {
            const input=document.getElementById('spi_cnpj_val')?.value?.trim();
            const div=document.getElementById('spi_cnpj_val_r');
            if(!div)return;
            if(!input){div.innerHTML='';return;}
            const r=_isValidCNPJ(input);
            div.innerHTML=r.valid
                ?`<div style="padding:0.5rem;color:var(--success);">✅ ${r.type} válido</div>`
                :`<div style="padding:0.5rem;color:var(--danger);">❌ ${r.reason}</div>`;
        },
        gerarPix() {
            const tipo=document.getElementById('spi_pix_tipo')?.value||'cpf';
            const qtd=parseInt(document.getElementById('spi_pix_qtd')?.value)||5;
            const chaves=[];
            for(let i=0;i<qtd;i++){
                switch(tipo){
                    case'cpf':chaves.push(_gerarCPFNum());break;
                    case'cnpj':chaves.push(_gerarCNPJNum(_rand(1,9999)));break;
                    case'email':chaves.push(`teste${_rand(1000,9999)}@exemplo${_rand(1,99)}.com.br`);break;
                    case'telefone':chaves.push(`+55${_rand(11,99)}9${_rand(10000000,99999999)}`);break;
                    case'evp':chaves.push(_uuid());break;
                }
            }
            const el=document.getElementById('spi_pix_out');
            if(el) el.textContent=chaves.join('\n');
        },
        identificarPix() {
            const input=document.getElementById('spi_pix_id')?.value?.trim();
            const div=document.getElementById('spi_pix_id_r');
            if(!div)return;
            if(!input){div.innerHTML='';return;}
            let tipo='Desconhecido',val='';
            const clean=input.replace(/[\.\-\/\+\s()]/g,'');
            if(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input)){tipo='EVP (UUID)';val='UUID v4 válido';}
            else if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)){tipo='Email';val='Formato válido';}
            else if(clean.length===14&&/^\d{14}$/.test(clean)){const r=_isValidCNPJ(clean);if(r.valid){tipo='CNPJ';val=r.type+' válido';}}
            else if(clean.length===11&&/^\d{11}$/.test(clean)){const r=_isValidCPF(clean);if(r.valid){tipo='CPF';val=r.type+' válido';}}
            else if(/^(55)?\d{10,11}$/.test(clean)){tipo='Telefone';val='Possível telefone';}
            div.innerHTML=`<div style="padding:0.5rem;"><span style="background:rgba(99,102,241,0.15);color:var(--primary);padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">${tipo}</span> <span style="font-size:0.85rem;color:var(--text-muted);">${val}</span></div>`;
        },
        gerarPacs008() {
            const now=new Date().toISOString().replace(/\.\d{3}Z$/,'.000Z');
            const valor=parseFloat(document.getElementById('iso_valor')?.value)||100;
            const ispb=document.getElementById('iso_ispb_c')?.value||'00000000';
            const nome=document.getElementById('iso_nome_c')?.value||'RECEBEDOR TESTE';
            const doc=document.getElementById('iso_doc_c')?.value||'00000000000191';
            const e2e=`E2E${_uuid().replace(/-/g,'').slice(0,28).toUpperCase()}`;
            const txid=`TX${_uuid().replace(/-/g,'').slice(0,23).toUpperCase()}`;
            const xml=`<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>MSG${_uuid().replace(/-/g,'').slice(0,28).toUpperCase()}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>INDA</SttlmMtd></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>INSTR${_uuid().replace(/-/g,'').slice(0,23).toUpperCase()}</InstrId>
        <EndToEndId>${e2e}</EndToEndId>
        <TxId>${txid}</TxId>
      </PmtId>
      <PmtTpInf><SvcLvl><Cd>PRPT</Cd></SvcLvl><LclInstrm><Cd>PIX</Cd></LclInstrm></PmtTpInf>
      <IntrBkSttlmAmt Ccy="BRL">${valor.toFixed(2)}</IntrBkSttlmAmt>
      <ChrgBr>SLEV</ChrgBr>
      <InstgAgt><FinInstnId><ClrSysMmbId><MmbId>${ispb}</MmbId></ClrSysMmbId></FinInstnId></InstgAgt>
      <Cdtr><Nm>${nome}</Nm></Cdtr>
      <CdtrAcct><Id><Othr><Id>${doc}</Id></Othr></Id></CdtrAcct>
      <RmtInf><Ustrd>Pagamento SPI teste - ${txid}</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
            const el=document.getElementById('iso_out');
            if(el) el.textContent=xml;
        },
        gerarFakePF() {
            const nome=_pick(_NOMES),sob=_pick(_SOBR);
            const data={
                nome_completo:`${nome} ${sob}`,
                cpf:_gerarCPFNum(),
                rg:`${_pad(_rand(10000000,99999999),8)}-${_rand(0,9)}`,
                data_nascimento:`${_pad(_rand(1,28),2)}/${_pad(_rand(1,12),2)}/${_rand(1960,2005)}`,
                telefone:`(${_pad(_rand(11,99),2)}) 9${_pad(_rand(1000,9999),4)}-${_pad(_rand(1000,9999),4)}`,
                email:`${nome.toLowerCase()}.${sob.toLowerCase()}${_rand(1,99)}@email.com`,
                endereco:{logradouro:`${_pick(_LOG)} ${_pick(_RUA)}`,_num:_rand(1,9999),bairro:'Centro',cidade:_pick(_CID),uf:_pick(_UF),cep:`${_pad(_rand(10000,99999),5)}${_pad(_rand(0,999),3)}`},
                banco:{ispb:_pad(_rand(0,99999999),8),agencia:_pad(_rand(1,9999),4),conta:_pad(_rand(1,9999999),7)}
            };
            const el=document.getElementById('fake_out');
            if(el) el.textContent=JSON.stringify(data,null,2);
        },
        gerarFakePJ() {
            const nf=`${_pick(_SOBR)} ${_pick(_ATV)}`;
            const data={
                razao_social:`${nf} ${_pick(['LTDA','EIRELI','S.A.','ME'])}`,
                nome_fantasia:nf,
                cnpj:_gerarCNPJNum(_rand(1,99)),
                segmento:_pick(_SEG),
                telefone:`(${_pad(_rand(11,99),2)}) ${_pad(_rand(2000,4999),4)}-${_pad(_rand(1000,9999),4)}`,
                email:`contato@${nf.toLowerCase().replace(/\s+/g,'')}.com.br`,
                endereco:{logradouro:`${_pick(_LOG)} ${_pick(_RUA)}`,numero:_rand(1,9999),cidade:_pick(_CID),uf:_pick(_UF)},
                representante:{nome:`${_pick(_NOMES)} ${_pick(_SOBR)}`,cpf:_gerarCPFNum(),cargo:_pick(['Sócio','Diretor','Presidente'])}
            };
            const el=document.getElementById('fake_out');
            if(el) el.textContent=JSON.stringify(data,null,2);
        }
    };
    Logger.info('Geradores module initialized');
});
