/**
 * Canivete Suíço Dev - Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // UI & Navigation Logic
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const navCategories = document.querySelectorAll('.nav-category');
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

            navCategories.forEach((cat) => {
                let next = cat.nextElementSibling;
                let hasVisible = false;
                while (next && !next.classList.contains('nav-category')) {
                    if (next.classList.contains('nav-item') && !next.classList.contains('nav-hidden')) {
                        hasVisible = true;
                        break;
                    }
                    next = next.nextElementSibling;
                }
                cat.classList.toggle('nav-hidden', !hasVisible);
            });

            if (navSearchEmpty) navSearchEmpty.hidden = visibleCount > 0;
        });
    }

    navItems.forEach(item => {
        if(item.classList.contains('nav-category')) return;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            toolViews.forEach(view => view.classList.remove('active'));
            
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.add('active');
            
            if (mainTitle) mainTitle.textContent = item.textContent.trim();
            try { localStorage.setItem('devtools_last_tool', targetId); } catch (_) {}
            if (isMobileNav()) closeSidebar();
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

            // DOWNLOAD
            if(btn.classList.contains('download-btn')) {
                if(targetEl.tagName === 'IMG' || (targetEl.tagName === 'DIV' && targetEl.querySelector('canvas'))) {
                    // Image download handled inside specific tools, but let's try generic
                    const src = targetEl.tagName === 'IMG' ? targetEl.src : targetEl.querySelector('canvas')?.toDataURL('image/png');
                    if(!src) return;
                    const a = document.createElement('a');
                    a.href = src;
                    a.download = `download_${Date.now()}.png`;
                    a.click();
                } else {
                    if(!targetEl.value) return;
                    downloadContent(targetEl.value, `${targetId}_${Date.now()}.txt`);
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

        // Binary file upload for PFX/cert files
        const binaryFileInput = document.getElementById('global_binary_file_input');
        document.querySelectorAll('#view_certs .upload-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetId = btn.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                if (!targetEl) return;

                if (targetId === 'pfx_input') {
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
                }
            }, true);
        });

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

        // ===== Tab 1: Certificate Info =====
        document.getElementById('cert_btn_info').addEventListener('click', async () => {
            const pem = document.getElementById('cert_input').value.trim();
            if (!pem) return showMessage('certs_msg', 'Cole o certificado primeiro', 'error');
            if (!pem.includes('BEGIN CERTIFICATE')) return showMessage('certs_msg', 'Formato inválido. Cole em formato PEM.', 'error');

            try {
                const cert = forge.pki.certificateFromPem(pem);
                const issuer = cert.issuer.getField('CN') ? cert.issuer.getField('CN').value : 'N/A';
                const subject = cert.subject.getField('CN') ? cert.subject.getField('CN').value : 'N/A';
                const serial = cert.serialNumber;
                const notBefore = cert.validity.notBefore.toLocaleString('pt-BR');
                const notAfter = cert.validity.notAfter.toLocaleString('pt-BR');
                const now = new Date();
                const isExpired = now > cert.validity.notAfter;
                const daysLeft = Math.ceil((cert.validity.notAfter - now) / (1000 * 60 * 60 * 24));

                // SHA256 fingerprint (via forge)
                const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
                const fingerprint = forge.md.sha256.create().update(derBytes).digest().toHex();

                // Public key info
                const pubKeyDer = extractSpkiDer(pem, false);
                const pubKeyHash = pubKeyDer ? getPublicKeyHash(pubKeyDer) : 'N/A';

                // Modulus (MD5 via forge — WebCrypto doesn't support MD5)
                const pubKey = cert.publicKey;
                const modulusHex = pubKey.n.toString(16);
                const modulusMd5 = forge.md.md5.create().update(modulusHex).digest().toHex();

                let output = `═══════════════════════════════════════════\n`;
                output += `  INFORMAÇÕES DO CERTIFICADO\n`;
                output += `═══════════════════════════════════════════\n\n`;
                output += `Subject (CN): ${subject}\n`;
                output += `Issuer (CN):  ${issuer}\n`;
                output += `Serial:       ${serial}\n\n`;
                output += `Válido De:    ${notBefore}\n`;
                output += `Válido Até:   ${notAfter}\n`;
                output += `Status:       ${isExpired ? '❌ EXPIRADO' : '✅ Válido'} (${isExpired ? 'vencido há ' + Math.abs(daysLeft) : daysLeft + ' dias restantes'})\n\n`;
                output += `SHA-256 Fingerprint:\n  ${fingerprint}\n\n`;
                output += `Public Key SHA-256:\n  ${pubKeyHash}\n\n`;
                output += `Modulus (MD5, compatível com openssl x509 -modulus | md5sum):\n  ${modulusMd5}\n`;

                document.getElementById('cert_info_output').textContent = output;
                // Mirror to hidden textarea for copy/download toolbar
                document.getElementById('cert_info_output').dataset.text = output;
                showMessage('certs_msg', 'Informações extraídas com sucesso!');
            } catch (e) {
                Logger.error('Erro ao analisar certificado', { error: e.message });
                showMessage('certs_msg', 'Erro: ' + e.message, 'error');
            }
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

        // ===== Tab 3: Conversions (unified via select) =====
        const convertType = document.getElementById('convert_type');
        const passPanel = document.getElementById('convert_pass_panel');
        const extraPanel = document.getElementById('convert_extra_panel');

        // Show/hide extra panels based on conversion type
        convertType.addEventListener('change', () => {
            const v = convertType.value;
            passPanel.style.display = (v === 'remove_key_pass' || v === 'pem_to_pfx') ? 'block' : 'none';
            extraPanel.style.display = v === 'pem_to_pfx' ? 'block' : 'none';
            if (v === 'pem_to_pfx') {
                passPanel.querySelector('h3').textContent = 'Senha para o PFX';
                passPanel.querySelector('input').placeholder = 'Senha para proteger o PFX';
            } else if (v === 'remove_key_pass') {
                passPanel.querySelector('h3').textContent = 'Senha da Chave Privada';
                passPanel.querySelector('input').placeholder = 'Digite a senha da chave';
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
                    default:
                        showMessage('certs_msg', 'Selecione um tipo de conversão', 'error');
                }
            } catch (e) {
                Logger.error('Erro na conversão', { error: e.message });
                showMessage('certs_msg', 'Erro: ' + e.message, 'error');
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
                showMessage('certs_msg', 'Erro: ' + e.message + (e.message.includes('password') ? ' — Verifique a senha.' : ''), 'error');
            }
        });

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
});
