# Arena FPS — P47

## Faixas luminosas perimetrais

O P47 converte as quatro faixas luminosas das paredes em um único `THREE.InstancedMesh`. Essas faixas aparecem nos mapas e usam o `stripMat`, cuja cor também é alterada pelos estados de alerta e alarme da Incursão.

As posições, escalas e material continuam iguais aos do P46. O código preenche as quatro matrizes, atualiza `instanceMatrix.needsUpdate` e recalcula `computeBoundingSphere()`. A mudança reduz quatro meshes decorativas para uma chamada de desenho sem remover as faixas nem alterar sua resposta visual ao alarme.

As otimizações de stripes, painéis, trilhos, estrutura escura, skyline, neons e luzes vermelhas dos pacotes anteriores permanecem preservadas.

## Escopo preservado

A mudança é somente de renderização. Não altera colisão, navegação, spawn, armas, dano, IA, progressão, controles ou os modos Sobrevivência, Operações e Incursão.

## Validação planejada

- `bash test.sh`
- `node --check` em todos os JavaScripts
- Smoke test HTTP e Chromium headless
- Inspeção de integridade do ZIP final

A medição definitiva de draw calls e FPS deve ser realizada em GPU e dispositivos reais. O Chromium headless usa renderização por software.
