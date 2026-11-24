# Arena FPS — P70 unificado

Esta é a versão única de continuidade do projeto: reúne o conteúdo completo do P69 com os recursos novos do P70 e as correções de testes do ZIP `arena-fps-p69-test-fixed`.

## O que foi preservado e incorporado

- Todo o conteúdo, mapas, armas, gameplay, configurações, documentos e assets já existentes no P69.
- Recursos adicionados no P70: controle independente do volume dos sons do deck e opção de HUD compacto, ambos opcionais e salvos nas preferências.
- Testes corrigidos do P69: `test.sh` mantém o resultado completo da suíte e `tests/e2e-smoke.py` procura Chromium/Chrome disponível no sistema, aceitando também o caminho `ARENA_CHROMIUM`.
- O service worker permanece versionado como P70.

Nenhuma regra de combate, atributo de arma, IA, colisão ou balanceamento foi alterada nesta unificação. Os testes de núcleo, sintaxe e navegador passaram nesta versão.

## Executar e testar

Execute `./test.sh` na pasta do projeto. Para diagnóstico de desempenho, inicie o jogo com `?perf=1`.

A continuação do plano de otimização foi entregue no P71: recursos exclusivos de mapa são descartados e o teste de 30 trocas compara cada arena com seu baseline. Ver `LEIA-ME-P71.md` e `RELATORIO_ATUAL.md`.
