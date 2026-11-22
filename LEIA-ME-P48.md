# Arena FPS — P48

## Correção do cache de cenário

Ao mudar a qualidade gráfica, o skyline e o dressing industrial do Hangar agora são recriados (`cachedSkyline` e `cachedIndustrialDressing` são zerados antes do `loadMap`). Antes, as versões adaptativas do P41 (torres) e P42 (neons) só se aplicavam após recarregar a página.

Escopo: somente renderização; gameplay, colisão, IA e modos inalterados. Cache PWA: `arena-fps-v8-p48`.

Validação: `bash test.sh` e `node --check`. Falta conferir em navegador real a troca Alta ↔ Média no menu.
