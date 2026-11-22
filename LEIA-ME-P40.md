# Arena FPS — P40

## Objetivo

O P40 é uma etapa de robustez e performance sobre o P39. O gameplay, o balanceamento, as dez armas, a IA, a progressão, a Incursão e os controles foram preservados.

## Alterações

- As 16 torres exteriores e a torre central do skyline do Hangar foram consolidadas em um `THREE.InstancedMesh` de 17 instâncias.
- O bounding sphere do conjunto instanciado é calculado explicitamente para manter o frustum culling correto.
- A textura das janelas agora usa um gerador pseudoaleatório determinístico com seed P40; o visual é reproduzível entre carregamentos.
- Foram adicionados checks estáticos em `tests/core.test.js` para proteger a instancing e a seed.
- O cache offline foi atualizado para `arena-fps-v8-p40`.
- O título HTML e o relatório principal identificam a release como P40.

## Executar

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000/` e, para diagnóstico de performance, use `http://localhost:8000/?perf=1`.

## Validar

```bash
bash test.sh
```

A suíte cobre as regras de combate, armas, IA, progressão, Incursão, terminais, cyberdeck, sintaxe e os checks de performance introduzidos no P40.

## Limites

O ganho de FPS e a redução de draw calls ainda devem ser medidos em GPU real e em celular. O P40 não substitui o playtest visual humano do Hangar.
