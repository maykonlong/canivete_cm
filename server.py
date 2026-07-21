#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor local do Canivete Suíço Dev.
Serve os arquivos estáticos e um proxy /api/proxy?url= para feeds RSS (CORS).
"""

from __future__ import annotations

import json
import socket
import sys
import threading
import urllib.error
import urllib.request
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

HOST = "127.0.0.1"
PORT = 8765
ROOT = Path(__file__).resolve().parent


class DevToolsHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # Evita cache agressivo durante desenvolvimento
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/proxy":
            self.handle_proxy(parsed)
            return
        if parsed.path == "/api/health":
            self.send_json({"ok": True, "service": "canivete-suico-dev"})
            return
        super().do_GET()

    def handle_proxy(self, parsed):
        qs = parse_qs(parsed.query)
        target = (qs.get("url") or [None])[0]
        if not target:
            self.send_error_json(400, "Parâmetro url é obrigatório")
            return

        target = unquote(target)
        scheme = urlparse(target).scheme.lower()
        if scheme not in ("http", "https"):
            self.send_error_json(400, "URL inválida")
            return

        try:
            req = urllib.request.Request(
                target,
                headers={
                    "User-Agent": "CaniveteSuicoDev/1.0 (+local-proxy)",
                    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
                },
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=25) as resp:
                body = resp.read()
                content_type = resp.headers.get("Content-Type", "application/xml; charset=utf-8")

            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except urllib.error.HTTPError as err:
            self.send_error_json(err.code, f"Upstream HTTP {err.code}")
        except Exception as err:  # noqa: BLE001
            self.send_error_json(502, str(err))

    def send_json(self, payload, status=200):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_error_json(self, status, message):
        self.send_json({"ok": False, "error": message}, status=status)

    def log_message(self, fmt, *args):
        sys.stdout.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))


def port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((HOST, port)) != 0


def main():
    port = PORT
    if not port_free(port):
        for candidate in range(PORT + 1, PORT + 20):
            if port_free(candidate):
                port = candidate
                break

    server = ThreadingHTTPServer((HOST, port), DevToolsHandler)
    url = f"http://{HOST}:{port}/index.html"

    print("=" * 60)
    print("  Canivete Suíço Dev — servidor local")
    print("=" * 60)
    print(f"  Abrindo: {url}")
    print("  Proxy RSS: /api/proxy?url=<feed>")
    print("  Ctrl+C para encerrar")
    print("=" * 60)

    threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
