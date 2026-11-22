#!/usr/bin/env python3
"""Smoke test de runtime (Chromium headless): carrega cada mapa em cada qualidade, renderiza um quadro,
falha em qualquer exceção JS e imprime draw calls (renderer.info). Uso: python3 tests/e2e-smoke.py [diretorio-do-jogo]
Requer: pip install playwright && playwright install chromium"""
import sys, os, threading, http.server, functools
from playwright.sync_api import sync_playwright
root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=root, **k)
    def log_message(self, *a): pass
h = Quiet
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h); threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_port}/'
errs = []; rows = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 960, 'height': 540})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url + '?test=1'); pg.wait_for_timeout(1500)
    for q in ['low', 'medium', 'high', 'medium']:          # medium repetido: valida a troca de qualidade (cache do P48)
        pg.evaluate(f"__arenaTest.setQuality('{q}')")
        for m in [0, 1, 2, -2, -3, -4]:
            pg.evaluate(f"__arenaTest.loadMap({m})")
            r = pg.evaluate("__arenaTest.frame()")
            rows.append((q, m, r['calls'], r['tris'], r['objs']))
    b.close()
print('qualidade  mapa  draw_calls  triangulos  objetos')
for r in rows: print(f'{r[0]:9} {r[1]:5} {r[2]:11} {r[3]:11} {r[4]:8}')
print('erros JS:', errs or 'nenhum')
sys.exit(1 if errs else 0)
