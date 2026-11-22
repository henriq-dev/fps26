# Arena FPS — P43

## Instanciamento dos neons do Hangar

O P43 transforma os pontos ciano e os halos transparentes do dressing industrial em quatro `THREE.InstancedMesh`:

- lâmpadas verticais;
- lâmpadas horizontais;
- halos verticais;
- halos horizontais.

A qualidade Alta continua usando as quatro colunas por parede do P42. A qualidade Média continua usando duas colunas por parede. A posição, escala, cor e leitura visual dos neons são preservadas, mas cada combinação de orientação/material passa a ser renderizada como um grupo instanciado, reduzindo o número de meshes individuais e draw calls.

Cada instância recebe `needsUpdate` e tem `computeBoundingSphere()` executado depois do preenchimento. A qualidade Baixa e `?simples=1` permanecem sem o dressing industrial.

## Escopo preservado

A mudança é somente de renderização. Não altera colisão, navegação, spawn, armas, dano, IA, progressão, controles ou os modos Sobrevivência, Operações e Incursão.

## Validação planejada

- `bash test.sh`
- `node --check` em todos os JavaScripts
- Smoke test HTTP e Chromium headless
- Inspeção de integridade do ZIP final

A medição definitiva de draw calls, overdraw e FPS deve ser realizada em GPU e dispositivos reais. O Chromium headless usa renderização por software.
