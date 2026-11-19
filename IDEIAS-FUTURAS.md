# Ideias futuras — Arena FPS

## Conceito: invasão hacker em terminais da arena

**Status:** primeira versão implementada no Pacote 20 (modo Incursão). Faltam portas animadas, torretas/câmeras e o prédio em vários blocos.

O personagem pode encontrar computadores ou terminais durante as fases e usá-los para invadir a rede do complexo. A invasão acrescentaria um objetivo além de eliminar inimigos: o jogador acessa um terminal, inicia a quebra de segurança e precisa concluí-la enquanto se defende.

### Possível ciclo de jogo

1. Localizar um terminal numa área da arena.

1. Interagir para iniciar a invasão e escolher um alvo do sistema.

1. Defender a posição durante um curto tempo de progresso, talvez resolvendo uma interação simples de hacking.

1. Receber uma consequência temporária no mapa ou na onda.

### Efeitos possíveis da invasão

- Destrancar uma porta, atalho ou sala de suprimentos.

- Desativar por instantes um escudo, câmera, alarme ou sistema de segurança.

- Virar uma torreta automatizada contra os inimigos.

- Interromper reforços ou atrasar a chegada de uma unidade.

- Revelar posições inimigas no radar.

### Pontos ainda em aberto

- Se será um modo/campanha com narrativa ou objetivos opcionais dentro das ondas atuais.

- Se a interação será uma sequência curta de teclas, um minijogo ou apenas uma barra de progresso sob pressão.

- Quais efeitos duram pouco e quais alteram a arena permanentemente durante a partida.

- Como comunicar risco e recompensa sem deixar o combate parado ou prejudicar o ritmo de FPS.

A ideia deve ser retomada mais adiante para escolher tema, fluxo de missão e regras antes de qualquer implementação. Não modificar armas, dano ou balanceamento existente sem decisão explícita.

## Expansão: incursão em prédio e complexo de dados

A missão começa com o protagonista entrando num prédio ocupado por inimigos. O avanço acontece por setores: corredores e salas de combate, áreas de segurança e, mais adiante, salas de servidores e um datacenter. Cada ambiente pode dar pistas visuais e narrativas sobre a rede que será invadida; os terminais importantes ficam protegidos em áreas de maior risco.

### Estações e consoles como pontos de interação ficcionais

- **Console KVM de rack:** conjunto visível de monitor, teclado e mouse ligado a um rack. Serve como ponto de acesso local para abrir o próximo objetivo ou identificar qual rack contém o sistema procurado.

- **Porta de console de gerenciamento de rede:** ponto de manutenção de equipamentos de rede. No jogo, pode permitir desativar um setor, abrir uma rota ou interromper temporariamente reforços.

- **Console de software/gerenciamento centralizado:** estação da sala de controle que apresenta uma visão geral do complexo. Pode revelar câmeras, portas, alarmes, torretas e a localização do datacenter.

### Possível progressão da missão

1. Infiltrar-se no prédio e avançar sob combate.

1. Encontrar uma estação local para obter acesso inicial e descobrir o objetivo principal.

1. Atravessar salas de segurança e escolher quais sistemas desativar para reduzir o risco.

1. Chegar ao datacenter, localizar os racks certos e executar o objetivo final — por exemplo, extrair dados fictícios, interromper a operação inimiga ou abrir a saída.

1. Escapar do prédio, com as escolhas anteriores alterando alarmes, rotas e a pressão dos inimigos.

Os nomes e equipamentos são referências cenográficas para dar verossimilhança à fase; as ações de hacking devem permanecer abstratas e fictícias, apresentadas como escolhas de jogo, sem simular procedimentos reais de invasão. Ainda falta decidir se isso será uma missão linear, um modo de campanha ou uma nova fase jogável dentro do formato atual.

## Expansão: derrubar a rede fictícia e apoio de drone

O objetivo maior da incursão pode ser interromper a infraestrutura digital da corporação antagonista dentro da história. O jogador chegaria ao datacenter e iniciaria uma sequência de sabotagem **inteiramente fictícia e simulada no jogo**. A interface poderia ter estética de distribuições Linux conhecidas (por exemplo, Arch ou Kali), mas seria uma tela cenográfica própria: comandos inventados, indicadores e animações, sem terminal real, acesso à rede ou procedimentos executáveis.

### Visualização 3D da invasão

Ao interagir com o console, a tela poderia mostrar uma representação 3D estilizada da rede do edifício: racks, servidores, enlaces, setores e sistemas de segurança como nós conectados. O jogador selecionaria o sistema-alvo e acompanharia a invasão por etapas visuais — conexão, bloqueios, avanço e resultado — enquanto alarmes, luzes dos racks e telas do cenário reagem. A ação pode acontecer como um minijogo curto sob pressão, intercalado com o combate.

### Objetivos alternativos e decisões do jogador

A missão pode ser dividida em fases, com liberdade para escolher o que fazer ao alcançar os sistemas centrais. Em vez de uma única solução, cada opção muda a resposta da instalação e a rota de fuga:

- **Derrubar o sistema:** interromper a rede do prédio por meio de uma sequência fictícia no console, apagando câmeras e controles por um período.

- **Destruir o datacenter:** provocar uma explosão cenográfica ou uma sobrecarga dentro do jogo, com uma saída mais urgente e um alerta geral.

- **Inserir um vírus fictício:** acionar efeitos visuais de corrupção nos nós 3D e fazer os sistemas da instalação falharem de forma imprevisível, como distração ou vantagem temporária.

- **Roubar dados:** copiar um arquivo ou pacote de dados fictício e escapar antes que o alarme localize o personagem.

- **Combinar objetivos:** por exemplo, copiar dados antes de derrubar a rede, aceitando mais tempo exposto e maior resposta inimiga.

As decisões podem alterar alarmes, portas, reforços, iluminação, rotas e a cena de extração; algumas podem ser silenciosas, outras barulhentas. Isso dá espaço para rejogar a missão e experimentar consequências diferentes, sem mudar armas ou dano do FPS. Todas as ações são abstrações fictícias de gameplay; o jogo não executa vírus, comandos nem operações reais.

### Drone como ferramenta de missão

Um drone de reconhecimento pode ser lançado para explorar salas próximas sem expor imediatamente o personagem. Possíveis funções de jogo:

- Revelar inimigos, câmeras, portas e rotas no mapa.

- Inspecionar os racks e identificar visualmente o terminal-alvo.

- Marcar ameaças para a HUD ou criar uma distração breve.

- Servir como ponto de observação ou relé em áreas onde a conexão do terminal é instável.

Para manter escolhas interessantes, o drone pode ter bateria limitada, produzir ruído ou ficar vulnerável a defesas da arena. O jogador decide entre explorar primeiro com mais segurança ou avançar diretamente, aceitando maior risco.

**Limite de escopo:** a queda da rede, os sistemas Linux, os terminais e o drone são elementos narrativos e mecânicas simuladas localmente no jogo. Nenhuma conexão, comando ou ataque a sistemas reais deve ocorrer.