# Arena FPS — P71

P70 unificado + otimização segura da troca de mapas.

## O que mudou

- Recursos exclusivos de cada mapa (geometrias e materiais de placas, portas, mezaninos e poças) agora são descartados ao trocar de mapa. Recursos compartilhados/cacheados e terminais mantêm seu ciclo de vida próprio.
- O smoke test aquece duas vezes os sete mapas do seletor interno (Hangar, Pátio, Fábrica, Complexo, Refinaria, Laboratório e Campus), registra um baseline por arena, repete 30 trocas em qualidade Alta e falha se `renderer.info.memory.geometries` ou `textures` crescerem em relação ao baseline da mesma arena.
- Os rótulos P19 do diagnóstico foram substituídos por “DIAGNÓSTICO DE DESEMPENHO”.
- Resolução adaptativa, redução adaptativa de faíscas e simplificações existentes da qualidade Média foram auditadas e preservadas.

## Verificação

`./test.sh` passou. No Chromium com SwiftShader, comparando o retorno ao mapa 1 após 30 trocas, o P70 original cresceu de 706 para 1206 geometrias; P71 ficou em 122 antes e depois, com texturas estáveis em 77. Isso confirma estabilidade do contador de recursos, não ganho de FPS. Ainda falta medir em GPU real e em celular físico.

Nenhuma regra de combate ou de gameplay foi alterada. O cache offline foi atualizado para P71. Consulte `RELATORIO_ATUAL.md` para detalhes.
