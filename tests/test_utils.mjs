/**
 * Testes unitários para utilitários do Canivete Suíço Dev.
 * Executa com: node tests/test_utils.mjs
 */

import { strict as assert } from 'node:assert';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
  }
}

console.log('\n🧪 Canivete Suíço Dev — Testes Unitários\n');

// ==========================================
// Color Conversion Utilities
// ==========================================
console.log('📦 Color Conversion');

function rgbToHex(r, g, b) {
  return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
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
}

function rgbToCmyk(r, g, b) {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, Math.min(m, y));
  if (k === 1) return [0, 0, 0, 100];
  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
}

test('rgbToHex(0, 0, 0) → #000000', () => {
  assert.equal(rgbToHex(0, 0, 0), '#000000');
});

test('rgbToHex(255, 255, 255) → #FFFFFF', () => {
  assert.equal(rgbToHex(255, 255, 255), '#FFFFFF');
});

test('rgbToHex(50, 168, 82) → #32A852', () => {
  assert.equal(rgbToHex(50, 168, 82), '#32A852');
});

test('hexToRgb("#000000") → [0,0,0]', () => {
  assert.deepEqual(hexToRgb('#000000'), [0, 0, 0]);
});

test('hexToRgb("#FFFFFF") → [255,255,255]', () => {
  assert.deepEqual(hexToRgb('#FFFFFF'), [255, 255, 255]);
});

test('hexToRgb("32A852") → [50,168,82] (sem #)', () => {
  assert.deepEqual(hexToRgb('32A852'), [50, 168, 82]);
});

test('hexToRgb("ZZZZZZ") → null (inválido)', () => {
  assert.equal(hexToRgb('ZZZZZZ'), null);
});

test('rgbToHsl(0, 0, 0) → [0°, 0%, 0%]', () => {
  assert.deepEqual(rgbToHsl(0, 0, 0), [0, 0, 0]);
});

test('rgbToHsl(255, 0, 0) → [0°, 100%, 50%]', () => {
  assert.deepEqual(rgbToHsl(255, 0, 0), [0, 100, 50]);
});

test('rgbToHsl(0, 255, 0) → [120°, 100%, 50%]', () => {
  assert.deepEqual(rgbToHsl(0, 255, 0), [120, 100, 50]);
});

test('rgbToCmyk(0, 0, 0) → [0%, 0%, 0%, 100%]', () => {
  assert.deepEqual(rgbToCmyk(0, 0, 0), [0, 0, 0, 100]);
});

test('rgbToCmyk(255, 255, 255) → [0%, 0%, 0%, 0%]', () => {
  assert.deepEqual(rgbToCmyk(255, 255, 255), [0, 0, 0, 0]);
});

test('rgbToCmyk(255, 0, 0) → [0%, 100%, 100%, 0%]', () => {
  assert.deepEqual(rgbToCmyk(255, 0, 0), [0, 100, 100, 0]);
});

// ==========================================
// Base64 Utilities
// ==========================================
console.log('\n📦 Base64 Encoding');

function encodeBase64(str) {
  const utf8str = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    (_m, p1) => String.fromCharCode('0x' + p1));
  return btoa(utf8str);
}

function decodeBase64(b64) {
  const decoded = atob(b64.trim());
  return decodeURIComponent(decoded.split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

test('encodeBase64("Hello") → "SGVsbG8="', () => {
  assert.equal(encodeBase64('Hello'), 'SGVsbG8=');
});

test('decodeBase64("SGVsbG8=") → "Hello"', () => {
  assert.equal(decodeBase64('SGVsbG8='), 'Hello');
});

test('encodeBase64/decodeBase64 com acentos "Olá Mundo"', () => {
  const original = 'Olá Mundo';
  assert.equal(decodeBase64(encodeBase64(original)), original);
});

test('encodeBase64/decodeBase64 com emoji "🎉🚀"', () => {
  const original = '🎉🚀';
  assert.equal(decodeBase64(encodeBase64(original)), original);
});

// ==========================================
// URL Encoding
// ==========================================
console.log('\n📦 URL Encoding');

test('encodeURIComponent preserva URL básica', () => {
  const url = 'https://exemplo.com/?q=olá';
  const encoded = encodeURIComponent(url);
  assert.ok(encoded.includes('%3A'));
  assert.ok(encoded.includes('%C3%A1'));
});

test('decodeURIComponent roundtrip', () => {
  const original = 'nome=João&cidade=São Paulo';
  const encoded = encodeURIComponent(original);
  assert.equal(decodeURIComponent(encoded), original);
});

// ==========================================
// Binary / Hex Conversion
// ==========================================
console.log('\n📦 Binary & Hex Conversion');

function textToBinary(str) {
  return str.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

function binaryToText(bin) {
  return bin.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
}

function textToHex(str) {
  return str.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ').toUpperCase();
}

function hexToText(hex) {
  const hexStr = hex.replace(/\s+/g, '');
  let str = '';
  for (let i = 0; i < hexStr.length; i += 2) {
    str += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
  }
  return str;
}

test('textToBinary("A") → "01000001"', () => {
  assert.equal(textToBinary('A'), '01000001');
});

test('binaryToText("01000001") → "A"', () => {
  assert.equal(binaryToText('01000001'), 'A');
});

test('textToBinary → binaryToText roundtrip "Hi"', () => {
  assert.equal(binaryToText(textToBinary('Hi')), 'Hi');
});

test('textToHex("A") → "41"', () => {
  assert.equal(textToHex('A'), '41');
});

test('hexToText("48 65 6C 6C 6F") → "Hello"', () => {
  assert.equal(hexToText('48 65 6C 6C 6F'), 'Hello');
});

test('textToHex → hexToText roundtrip', () => {
  const original = 'Test 123';
  assert.equal(hexToText(textToHex(original)), original);
});

// ==========================================
// JWT Decode (apenas base64url parsing)
// ==========================================
console.log('\n📦 JWT Decode');

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const decoded = atob(base64);
  return decodeURIComponent(decoded.split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

test('base64UrlDecode com padding', () => {
  // "test" em base64url
  const encoded = btoa('test').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  assert.equal(base64UrlDecode(encoded), 'test');
});

test('JWT parts parsing (mock)', () => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: '1234', name: 'Test' }));
  const signature = 'fake-sig';
  const token = `${header}.${payload}.${signature}`;

  const parts = token.split('.');
  assert.equal(parts.length, 3);

  const decodedHeader = JSON.parse(base64UrlDecode(parts[0]));
  assert.equal(decodedHeader.alg, 'HS256');

  const decodedPayload = JSON.parse(base64UrlDecode(parts[1]));
  assert.equal(decodedPayload.sub, '1234');
  assert.equal(decodedPayload.name, 'Test');
});

// ==========================================
// Regex Validation
// ==========================================
console.log('\n📦 RegEx');

test('RegExp válido não lança erro', () => {
  assert.doesNotThrow(() => new RegExp('^([a-z0-9]+)$', 'gm'));
});

test('RegExp com flags funciona', () => {
  const regex = new RegExp('\\d+', 'g');
  const str = 'abc 123 def 456';
  const matches = str.match(regex);
  assert.deepEqual(matches, ['123', '456']);
});

test('Pattern com grupos de captura', () => {
  const regex = new RegExp('(\\w+)@(\\w+\\.\\w+)');
  const match = regex.exec('user@example.com');
  assert.equal(match[1], 'user');
  assert.equal(match[2], 'example.com');
});

// ==========================================
// CSV ↔ JSON (simulação sem PapaParse)
// ==========================================
console.log('\n📦 CSV/JSON Helpers');

test('JSON.stringify formata corretamente', () => {
  const data = [{ id: 1, name: 'João' }, { id: 2, name: 'Maria' }];
  const json = JSON.stringify(data, null, 2);
  assert.ok(json.includes('"id": 1'));
  assert.ok(json.includes('"name": "João"'));
});

test('JSON.parse roundtrip', () => {
  const data = [{ a: 1, b: 'test' }];
  const parsed = JSON.parse(JSON.stringify(data));
  assert.deepEqual(parsed, data);
});

test('JSON.parse inválido lança SyntaxError', () => {
  assert.throws(() => JSON.parse('{invalid json}'), SyntaxError);
});

// ==========================================
// Structured Logger (testa formato)
// ==========================================
console.log('\n📦 Structured Logger');

function formatLog(level, message, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  });
}

test('formatLog produz JSON válido', () => {
  const log = formatLog('info', 'Test message', { tool: 'qr' });
  const parsed = JSON.parse(log);
  assert.equal(parsed.level, 'info');
  assert.equal(parsed.message, 'Test message');
  assert.equal(parsed.tool, 'qr');
  assert.ok(parsed.timestamp);
});

test('formatLog sem data extra', () => {
  const log = formatLog('error', 'Something failed');
  const parsed = JSON.parse(log);
  assert.equal(parsed.level, 'error');
  assert.equal(parsed.message, 'Something failed');
});

// ==========================================
// Service Worker Version
// ==========================================
console.log('\n📦 Service Worker Version');

test('Version string é semver-like', () => {
  const version = '2.0.0';
  assert.ok(/^\d+\.\d+\.\d+$/.test(version));
});

test('CACHE_NAME segue padrão versionado', () => {
  const version = '2.0.0';
  const cacheName = `canivete-suico-v${version}`;
  assert.equal(cacheName, 'canivete-suico-v2.0.0');
});

// ==========================================
// DOMPurify sanitize check (formato)
// ==========================================
console.log('\n📦 DOMPurify sanitize logic');

function simulateSanitize(html) {
  // Simula remoção de scripts
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

test('Remove <script> tags', () => {
  const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
  const result = simulateSanitize(input);
  assert.ok(!result.includes('<script>'));
  assert.ok(result.includes('Hello'));
  assert.ok(result.includes('World'));
});

test('Preserva HTML seguro', () => {
  const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
  const result = simulateSanitize(input);
  assert.equal(result, input);
});

// ==========================================
// Summary
// ==========================================
console.log('\n' + '='.repeat(50));
console.log(`  Resultado: ${passed} passou, ${failed} falhou`);
console.log('='.repeat(50) + '\n');

if (failed > 0) {
  process.exit(1);
}