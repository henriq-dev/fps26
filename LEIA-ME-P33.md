# Arena FPS — P33
Base: p23 (NEXUS) + portas e câmeras do p22 + consoles leves.
Rodar: `python3 -m http.server 8000` e abrir http://localhost:8000 (ou deploy direto na Vercel/Netlify).
Testes: `./test.sh`. Desempenho: `?perf=1`.
Incursão: menu → Operações → Incursão. E segura no console; câmeras vermelhas = alerta (faixa vermelha, reforços mais rápidos).
Detalhes e conceitos: RELATORIO_ATUAL.md (Pacote 24).
Drone: tecla F marca inimigos, console e câmeras na tela por alguns segundos.
Consoles: a tela física mostra o mini NEXUS (grafo animado) quando você está a menos de 14 m.
Portas fechadas agora barram os projéteis dos inimigos e impedem que atirem através delas (só Incursão).
Torretas de segurança (2 por prédio) atiram 4 de dano a cada 1,6 s se te virem; 'Desativar câmeras' ou 'Derrubar o sistema' também as desliga.
Prédio 4 · Campus: cinco blocos A–E em fila (início no C), 8 portas, 3 câmeras, 2 torretas. Escolha em Operações → Incursão → Prédio.
Torretas agora podem ser destruídas a tiro (40 de vida, +50 pontos); também aparecem no drone (TORRETA).
Cyberdeck: na Incursão, tecla T (ou botão ⌨ DECK) abre o laptop. Comandos: help, scan, jam, theme kali|arch, neofetch, clear, exit. Esc fecha. Tudo simulado, sem rede.
Deck P33: boot animado, Tab completa comandos, chips de recarga no topo, sons de teclado/scan/jam, comandos status/date/uptime/ip a/history/echo.
Deck: 'connect' perto do console adianta 50% da barra de E (1 vez por setor).
Animações P33: tampa do laptop, chips pulsando, glitch no jam/erro, barra de progresso, anel do scan no chão, marcadores que travam no alvo, câmeras e torretas que 'desligam'.
