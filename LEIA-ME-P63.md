# Arena FPS P63 — segundo piso na Incursão

O P63 implementa a opção A escolhida: um segundo piso central com rampas nos quatro prédios da Incursão.

## O que mudou

- Cada prédio recebeu um `upperDeck` comum, com plataforma elevada, rampa de acesso, guarda-corpos e sinalização luminosa.
- O jogador usa uma altura de chão variável: térreo, rampa e plataforma. Salto, gravidade, aterrissagem, câmera, corrida e agachamento continuam no mesmo loop do jogo.
- Inimigos nascem e acompanham a altura do piso enquanto percorrem os corredores e a rampa.
- O A* permanece em grade X/Z para preservar compatibilidade e desempenho, mas a linha direta deixa de ser usada quando origem e destino estão em pisos diferentes; assim a rampa continua sendo a conexão jogável.
- Marcadores de Incursão passam a ser desenhados na altura do piso correspondente.

## Gameplay preservado

Armas, dano, portas, terminais, cyberdeck, progressão, objetivos, chefes, modos Sobrevivência e Operações e controles existentes foram mantidos. O deck elevado não é uma caixa de bloqueio horizontal: a passagem é física pela rampa e o centro dos mapas continua navegável.

## Limitações conhecidas

A navegação ainda é 2D em X/Z; a altura é derivada da posição contínua na rampa, sem uma malha navmesh tridimensional. Tiros e linha de visão continuam usando a colisão horizontal existente, com a altura vertical usada principalmente pelo movimento, mira e projéteis.

## Validação

Foram executados `node --check` em `script.js` e `incursion.js`, além da suíte `test.sh`. O pacote mantém os arquivos estáticos diretamente na raiz para execução offline no navegador.
