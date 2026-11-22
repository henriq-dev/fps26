# Arena FPS — pacote consolidado P38 (base P37)

Este diretório reúne os ZIPs P34, P35, P35-animation-checkpoint e P37 em uma única árvore de projeto.

## Regra de junção

P37 foi mantido como fonte principal de código. Ele já inclui a funcionalidade acumulada de P34/P35, incluindo terminais cenográficos, telas de computador, cyberdeck e os subsistemas anteriores. As alterações de câmera/corrida do checkpoint foram comparadas com a implementação P37: a versão P37 já contém câmera bob, transição de corrida, aterrissagem e animação da arma, além das mecânicas posteriores de agachar/deslizar, inspeção e câmera lenta. Por isso não foi substituído o `script.js` mais novo por uma cópia antiga do checkpoint.

Foram recuperados os documentos P14–P20 e P34 que não estavam no ZIP P37, além do registro `ANIMATIONS_PROGRESS.md`. O relatório atual recebeu uma seção de consolidação. Título, identificação do service worker/cache e rótulo da suíte foram atualizados para o pacote consolidado.

## Atualização P38

P37 continua sendo a fonte principal; esta continuação foi aplicada sobre a árvore consolidada, sem copiar versões antigas por cima. O P38 integra SMG Vespa e Carabina Íon (dez armas, atalho `0`), motas iônicas em pool, variações visuais das telas NEXUS por estado/tipo de terminal, detalhes físicos incorporados aos consoles e ajustes de responsividade. A habilidade reutilizável de auditoria e este guia de execução acompanham a pasta; `RELATORIO_ATUAL.md` registra validações e limites. O mapeamento de gamepad foi revisado por código, mas não testado com controle físico, indisponível no Sandbox.

## Executar

Sirva esta pasta por HTTP (necessário para o service worker e para o modo PWA):

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000/`. Para validar a suíte automatizada, execute:

```bash
bash test.sh
```

## Observação de validação

Os testes de origem foram executados durante a consolidação P37. Para P38, `bash test.sh` e as checagens de sintaxe passaram na árvore e novamente após extrair o ZIP final. Chromium headless renderizou os menus em 1280×720, 844×390 e 320×568, mas isso não é playtest da partida, benchmark de GPU ou teste em celular real. Permanecem pendentes playtests humanos, validação física de gamepad/toque e desempenho em hardware-alvo; o limite do controle consta no `RELATORIO_ATUAL.md`.
