# Arena FPS — P41

## Skyline adaptativo por qualidade

O P41 evolui a otimização visual do Hangar introduzida no P40 sem alterar o gameplay. O skyline exterior continua usando uma única `THREE.InstancedMesh`, mas escolhe a quantidade de torres do anel conforme a qualidade gráfica:

- **Alta:** 16 torres no anel + 1 torre central.
- **Média:** 8 torres no anel + 1 torre central.
- **Baixa:** mantém o comportamento existente de desligar o skyline.
- **`?simples=1`:** mantém o modo simples existente, sem skyline.

A torre central é preservada nas qualidades ativas para manter a leitura visual do Hangar. Depois de preencher as instâncias, o código atualiza a matriz e chama `computeBoundingSphere()` para manter os bounds corretos.

## Escopo preservado

A mudança é somente de apresentação e orçamento de renderização. Colisão, navegação, spawn, armas, dano, IA, progressão, modos Sobrevivência, Operações e Incursão, controles, PWA offline e telemetria permanecem preservados.

## Validação

- `bash test.sh`
- `node --check` em todos os JavaScripts
- Smoke test HTTP e Chromium headless
- Inspeção de integridade do ZIP final

A medição definitiva de FPS e draw calls ainda deve ser feita em GPU e dispositivos reais; o Chromium headless usa renderização por software.
