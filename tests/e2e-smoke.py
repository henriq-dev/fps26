#!/usr/bin/env python3
"""Smoke test de runtime (Chromium headless): carrega cada mapa em cada qualidade, renderiza um quadro,
falha em qualquer exceção JS e imprime draw calls (renderer.info). Uso: python3 tests/e2e-smoke.py [diretorio-do-jogo]
Requer: pip install playwright && playwright install chromium"""
import sys, os, shutil, threading, http.server, functools
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
    # Preferir um caminho explícito, depois Chromium/Chrome do sistema,
    # e por fim o navegador gerenciado pelo Playwright.
    browser_path = os.environ.get('ARENA_CHROMIUM', '').strip()
    if not browser_path:
        for candidate in ('chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'):
            browser_path = shutil.which(candidate) or ''
            if browser_path:
                break
    launch = {'args': ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']}
    if browser_path:
        launch['executable_path'] = browser_path
    b = p.chromium.launch(**launch)
    pg = b.new_page(viewport={'width': 960, 'height': 540})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url + '?test=1'); pg.wait_for_timeout(1500)
    for q in ['low', 'medium', 'high', 'medium']:          # medium repetido: valida a troca de qualidade (cache do P48)
        pg.evaluate(f"__arenaTest.setQuality('{q}')")
        for m in [0, 1, 2, -2, -3, -4, -5]:
            pg.evaluate(f"__arenaTest.loadMap({m})")
            r = pg.evaluate("__arenaTest.frame()")
            rows.append((q, m, r['calls'], r['tris'], r['objs']))
    pg.evaluate("__arenaTest.setQuality('high')")
    maps = [0, 1, 2, -2, -3, -4, -5]
    for _ in range(2):
        for m in maps:
            pg.evaluate(f"__arenaTest.loadMap({m})")
            pg.evaluate("__arenaTest.frame()")
    map_baselines = {}
    for m in maps:
        pg.evaluate(f"__arenaTest.loadMap({m})")
        pg.evaluate("__arenaTest.frame()")
        map_baselines[m] = pg.evaluate("__arenaTest.resources()")
    memory_errors = []
    for i in range(30):
        m = maps[i % len(maps)]
        pg.evaluate(f"__arenaTest.loadMap({m})")
        pg.evaluate("__arenaTest.frame()")
        current = pg.evaluate("__arenaTest.resources()")
        for key, value in current.items():
            if value > map_baselines[m][key]: memory_errors.append(f'mapa {m}: {key} {map_baselines[m][key]} → {value}')
    after = pg.evaluate("__arenaTest.resources()")
    final_map = maps[29 % len(maps)]
    baseline = map_baselines[final_map]
    growth = {key: after[key] - baseline[key] for key in baseline}
    print('memória após 30 trocas (mapa final', final_map, '):', baseline, '→', after, '(crescimento:', growth, ')')
    if memory_errors: errs.append('recursos gráficos cresceram acima do baseline do mapa após aquecimento e 30 trocas: ' + '; '.join(memory_errors[:8]))
    b.close()
print('qualidade  mapa  draw_calls  triangulos  objetos')
for r in rows: print(f'{r[0]:9} {r[1]:5} {r[2]:11} {r[3]:11} {r[4]:8}')
print('erros JS:', errs or 'nenhum')
sys.exit(1 if errs else 0)
