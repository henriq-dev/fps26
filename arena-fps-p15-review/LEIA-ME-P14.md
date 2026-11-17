# Arena FPS — Pacote 14

Piloto visual industrial semi-realista aplicado somente ao Fuzil (índice 1), às mãos que o acompanham e à arena inicial (mapa 0). As outras sete armas, os demais mapas, o HUD e o balanceamento permanecem no caminho anterior.

## Executar

Sirva a pasta por HTTP/HTTPS (não abra `index.html` por `file://`, pois o service worker e o cache offline dependem de uma origem web):

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000/` no navegador. Se a versão anterior estiver instalada como PWA, feche/recarregue o jogo para o service worker buscar o cache `arena-fps-v8-p14`.

## Testes

```bash
./test.sh
```

A suíte verifica o núcleo, snapshots de atributos de combate, escopo do tema industrial no mapa 0, layout de obstáculos e sintaxe dos scripts. O relatório detalhado está em `RELATORIO_ATUAL.md`; `p14-rifle-playtest.png` e `p14-mobile-layout.png` são capturas de revisão, não benchmarks.

Não houve teste físico em celular nem benchmark de FPS nesta entrega. Nenhum asset ou serviço externo é necessário para executar o jogo.
