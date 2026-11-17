
## Pacote 14 — Direção visual industrial detalhada

A concept art aprovada orienta uma atualização visual incremental, sem trocar o motor Three.js clássico nem introduzir dependências remotas. A primeira etapa usa materiais procedurais locais gerados em CanvasTexture: concreto com fissuras e manchas, metal com painéis/juntas e madeira com veios. Os materiais usam `MeshStandardMaterial` com bump sutil, roughness e metalness por superfície.

Os obstáculos mantêm exatamente as mesmas caixas de colisão, mas recebem bordas estruturais, painéis frontais e barras emissivas visuais que não entram no raycast. O piso recebe juntas, desgaste e variações de manchas por mapa. As três arenas ganham identidades temáticas exibidas na transição: concreto/setor 07, doca/chuva âmbar e planta/núcleo ciano. Tudo permanece local, reutilizável e compatível com o cache offline.

A implementação é deliberadamente incremental: primeiro materiais, piso e obstáculos; depois props maiores, personagens e arsenal detalhados em pacotes separados após validação visual e de performance.
