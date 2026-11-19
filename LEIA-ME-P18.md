# Arena FPS — Pacote 18 híbrido

O P18 combina os recursos leves de cenário do P17 com proteções contra travadas pontuais do P16.

## O que foi combinado

**Mantido do P17:** materiais albedo-only em superfícies ambientais (sem gerar mapas de altura/rugosidade para piso, blocos e decoração estática), PBR detalhado no Fuzil/mãos e cache de texturas de céu por paleta.

**Restaurado do P16:** pré-aquecimento de shaders, buffers e texturas antes do menu/partida; pré-aquecimento após trocar de arena (no banner); uma luz de explosão sempre presente na contagem de luzes, com intensidade variável em vez de alternar `visible`; geometria da antena e materiais básicos de identificação compartilhados entre rigs.

A recuperação da resolução adaptativa do P16 ficou para uma etapa separada. P18 mantém a política P17 nesta área. O combate, o conteúdo das armas e dos inimigos, a IA, os mapas e suas colisões não foram alterados.

## Rodar localmente

Na pasta do projeto:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8000/`. Para o modo diagnóstico, abra `http://127.0.0.1:8000/?perf=1` e inicie o cenário fixo de 12 inimigos.

- **F8:** mostrar/ocultar o painel.
- **F9:** reiniciar cenário e janela de amostragem.
- **F10:** exportar CSV.

Execute `./test.sh` para os testes do núcleo e checagens de sintaxe.

## Validação desta build

Testes de núcleo e sintaxe passaram. No Chromium headless/SwiftShader, com instrumentação de teste transitória (não incluída no código entregue), o pré-aquecimento ocorreu uma vez na inicialização e em cada chamada de troca de mapa. Foram observados 11 programas WebGL após o aquecimento e os mesmos 11 depois de simular o pulso de explosão, sem alternância de visibilidade da luz. Ao percorrer Hangar, Pátio e Fábrica, a contagem de geometrias ficou constante em 62; após carregar as paletas, as texturas ficaram constantes em 9 no menu do ensaio. O modo de diagnóstico exibiu o título P18, 12 inimigos e não gerou erros JavaScript.

Esses números confirmam o caminho de execução e a estabilidade de recursos nesse ensaio específico; **não são benchmark de GPU física nem de celular**. O pré-aquecimento custa trabalho ao abrir o menu e durante a transição de arenas; a duração perceptível deve ser avaliada no dispositivo-alvo. A retomada da resolução adaptativa e a comparação de frametimes entre P16/P17/P18 ainda não foram medidas nesta build.

## Arquivos úteis

- `RELATORIO_ATUAL.md`: histórico técnico P14–P18 e validações.
- `TODO.md`: escopo entregue e pendências.
- `p18-hybrid-playtest.png`: captura do cenário P18.
