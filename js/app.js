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
                console.error('Hash error', e);
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
                
                Papa.parse(val, {
                    header: true, 
                    skipEmptyLines: true,
                    complete: (res) => {
                        if (res.errors && res.errors.length > 0) {
                            console.error('CSV Parse Errors:', res.errors);
                            showMessage('csv_msg', 'CSV convertido com avisos (veja o console)', 'success');
                        } else {
                            showMessage('csv_msg', 'Convertido para JSON com sucesso!');
                        }
                        document.getElementById('csv_json').value = JSON.stringify(res.data, null, 2);
                    },
                    error: (err) => {
                        showMessage('csv_msg', 'Falha ao processar o CSV', 'error');
                    }
                });
            } catch(e) {
                console.error(e);
                showMessage('csv_msg', 'Erro crítico ao ler CSV: ' + e.message, 'error');
            }
        });

        document.getElementById('json_to_csv').addEventListener('click', () => {
            try {
                if(typeof Papa === 'undefined') return showMessage('csv_msg', 'PapaParse não carregado. Verifique ./libs/papaparse.min.js', 'error');
                const val = document.getElementById('csv_json').value.trim();
                if(!val) return showMessage('csv_msg', 'Insira o JSON primeiro', 'error');
                
                const parsedJSON = JSON.parse(val);
                const csvStr = Papa.unparse(parsedJSON);
                
                document.getElementById('csv_input').value = csvStr;
                showMessage('csv_msg', 'Convertido para CSV com sucesso!');
            } catch(e) {
                console.error(e);
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
    initTextQR(); // Nova funcionalidade de texto para QR Code
    initHistory(); // Funcionalidade de histórico

    // Set initially active view's title
    const activeNav = document.querySelector('.nav-item.active');
    if(activeNav && mainTitle) mainTitle.textContent = activeNav.textContent.trim();
});

/**
 * Tool: Texto para QR Code
 */
const initTextQR = () => {
    const textInput = document.getElementById('text_qr_input');
    const canvasContainer = document.getElementById('text_qr_canvas_container');
    const fileInput = document.getElementById('text_qr_file');

    // Limpa o cache quando o botão Limpar é acionado
    canvasContainer.addEventListener('cleared', () => {
        fileInput.value = '';
        canvasContainer.innerHTML = '';
        canvasContainer.classList.add('empty');
    });

    // Gera QR Code ao digitar (com delay para evitar processamento excessivo)
    let typingTimer;
    textInput.addEventListener('input', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if(textInput.value.trim()) {
                generateQRCodeFromText();
            } else {
                canvasContainer.innerHTML = '';
                canvasContainer.classList.add('empty');
            }
        }, 500); // Delay de 500ms
    });

    function generateQRCodeFromText() {
        const text = textInput.value.trim();
        if (!text) return;

        // Verifica se o texto é muito longo para um QR Code (limitação do formato)
        if (text.length > 4000) {
            showMessage('text_qr_msg', 'Texto muito longo para QR Code. Limite de 4000 caracteres.', 'error');
            canvasContainer.innerHTML = '';
            canvasContainer.classList.add('empty');
            return;
        }

        try {
            // Limpa o container
            canvasContainer.innerHTML = '';
            canvasContainer.classList.remove('empty');

            // Gera o QR Code diretamente no canvas do DOM para evitar problemas de renderização
            const canvas = document.createElement('canvas');
            new QRCode(canvas, {
                text: text,
                width: 200,
                height: 200,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });

            canvasContainer.appendChild(canvas);
            showMessage('text_qr_msg', 'QR Code gerado com sucesso!');

            // Adiciona ao histórico
            addToHistory('text_qr', text);
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            showMessage('text_qr_msg', 'Erro ao gerar QR Code. Tente novamente.', 'error');
            canvasContainer.innerHTML = '';
            canvasContainer.classList.add('empty');
        }
    }

    // Processa imagem para leitura de QR Code
    const processQRImage = (file) => {
        if(!file) return showMessage('text_qr_msg', 'Nenhum arquivo selecionado', 'error');
        if(typeof jsQR === 'undefined') return showMessage('text_qr_msg', 'Erro: Biblioteca jsQR não foi carregada. Verifique o arquivo ./libs/jsQR.min.js', 'error');

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
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
                    textInput.value = code.data;
                    showMessage('text_qr_msg', 'QR Code lido com sucesso!');

                    // Adiciona ao histórico
                    addToHistory('text_qr_read', code.data);
                } else {
                    showMessage('text_qr_msg', 'QR Code ilegível. Tente aumentar o contraste da imagem.', 'error');
                }
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    // Click para abrir o diálogo de arquivo
    canvasContainer.addEventListener('click', () => fileInput.click());
    canvasContainer.style.cursor = 'pointer';

    // Dropzone para leitura de QR Code
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

    // Processa o arquivo selecionado
    fileInput.addEventListener('change', e => {
        if(e.target.files.length) processQRImage(e.target.files[0]);
        fileInput.value = '';
    });
};

// ==========================================
// Funcionalidade de Histórico
// ==========================================

/**
 * Adiciona uma entrada ao histórico
 * @param {string} type - Tipo de entrada (text_qr, text_qr_read, base64_img)
 * @param {string} content - Conteúdo da entrada
 */
const addToHistory = (type, content) => {
    try {
        // Obter histórico existente
        let history = JSON.parse(localStorage.getItem('devtools_history') || '[]');

        // Criar nova entrada
        const entry = {
            id: Date.now(),
            type: type,
            content: content,
            timestamp: new Date().toISOString()
        };

        // Adicionar ao início do array
        history.unshift(entry);

        // Manter apenas as últimas 50 entradas
        if (history.length > 50) {
            history = history.slice(0, 50);
        }

        // Salvar de volta no localStorage
        localStorage.setItem('devtools_history', JSON.stringify(history));
    } catch (e) {
        console.error('Erro ao adicionar ao histórico:', e);
    }
};

/**
 * Carrega o histórico do localStorage
 * @returns {Array} Array com as entradas do histórico
 */
const loadHistory = () => {
    try {
        return JSON.parse(localStorage.getItem('devtools_history') || '[]');
    } catch (e) {
        console.error('Erro ao carregar histórico:', e);
        return [];
    }
};

/**
 * Limpa todo o histórico
 */
const clearHistory = () => {
    localStorage.removeItem('devtools_history');
    showMessage('history_msg', 'Histórico limpo com sucesso!', 'success');
};

/**
 * Inicializa a funcionalidade de histórico
 */
const initHistory = () => {
    const historyList = document.getElementById('history_list');

    // Carrega e exibe o histórico quando a aba for aberta
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-target') === 'view_history') {
            item.addEventListener('click', () => {
                displayHistory();
            });
        }
    });

    // Adiciona evento de limpeza no botão
    const clearBtn = document.querySelector('.clear-btn[data-target="history_list"]');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearHistory();
            displayHistory();
        });
    }
};

/**
 * Exibe o histórico na interface
 */
const displayHistory = () => {
    const historyList = document.getElementById('history_list');
    const history = loadHistory();

    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Nenhuma entrada no histórico</p>';
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';

    history.forEach(entry => {
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let typeLabel = '';
        switch(entry.type) {
            case 'text_qr':
                typeLabel = 'QR Code Gerado';
                break;
            case 'text_qr_read':
                typeLabel = 'QR Code Lido';
                break;
            default:
                typeLabel = 'Entrada';
        }

        // Limitar o conteúdo exibido
        let displayContent = entry.content;
        if (displayContent.length > 100) {
            displayContent = displayContent.substring(0, 100) + '...';
        }

        html += `
            <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.9rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                    <span style="font-weight: 600; color: var(--primary);">${typeLabel}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${formattedDate}</span>
                </div>
                <p style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayContent}</p>
            </div>
        `;
    });

    html += '</div>';
    historyList.innerHTML = html;
};
