# Arena FPS — P46

## Estrutura escura da ponte e do guindaste

O P46 agrupa os cinco blocos estruturais escuros da ponte elevada e do guindaste do Hangar em um único `THREE.InstancedMesh`. Os elementos são:

- duas barras horizontais da ponte;
- uma coluna de suporte;
- uma barra superior do guindaste;
- uma coluna fina do guindaste.

As posições, escalas, material e composição visual permanecem iguais ao P45. O código atualiza `instanceMatrix.needsUpdate` e executa `computeBoundingSphere()` após preencher as cinco matrizes, reduzindo cinco meshes decorativas para uma chamada de desenho.

As otimizações de stripes, painéis, trilhos, skyline, neons ciano e luzes vermelhas dos pacotes anteriores permanecem preservadas.

## Escopo preservado

A mudança é somente de renderização. Não altera colisão, navegação, spawn, armas, dano, IA, progressão, controles ou os modos Sobrevivência, Operações e Incursão.

## Validação planejada

- `bash test.sh`
- `node --check` em todos os JavaScripts
- Smoke test HTTP e Chromium headless
- Inspeção de integridade do ZIP final

A medição definitiva de draw calls e FPS deve ser realizada em GPU e dispositivos reais. O Chromium headless usa renderização por software.
