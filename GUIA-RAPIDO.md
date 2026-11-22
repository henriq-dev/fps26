# Guia rápido — Arena FPS P38 consolidado

## 1. Requisitos

- Python 3 para servir a pasta localmente.
- Navegador moderno com WebGL (Chrome, Edge ou Firefox recomendado).
- **Não precisa instalar dependências npm** para executar o jogo: Three.js e scripts estão incluídos no projeto. Node.js é necessário apenas para executar a suíte automatizada.

## 2. Executar no computador

1. Baixe e extraia `arena-fps-p38-consolidado.zip`.
2. Abra um terminal na pasta extraída, onde ficam `index.html` e `test.sh`.
3. Inicie um servidor HTTP:

   ```bash
   python3 -m http.server 8000
   ```

   No Windows, se `python3` não funcionar, tente `py -m http.server 8000`.

4. Abra [http://localhost:8000](http://localhost:8000) no navegador.
5. Escolha modo, dificuldade, controles e qualidade e clique em **JOGAR**. O navegador pode pedir permissão para capturar o mouse; pressione Esc para liberar o ponteiro.

Não abra `index.html` diretamente com `file://`: o servidor local é necessário para que scripts e service worker/PWA funcionem corretamente. Para acesso por rede local, use `python3 -m http.server 8000 --bind 0.0.0.0` e navegue até `http://IP-DO-COMPUTADOR:8000` em um dispositivo na mesma rede.

## 3. Controles principais

| Ação | Controle |
|---|---|
| Mover | W, A, S, D |
| Olhar / mirar | Mouse; botão direito para mirar quando aplicável |
| Atirar | Botão esquerdo do mouse |
| Correr | Shift esquerdo |
| Agachar / deslizar | C ou Ctrl esquerdo; deslizar ao agachar em movimento rápido |
| Pular | Espaço |
| Dash | Q |
| Inspecionar arma | V |
| Recarregar | R |
| Trocar arma | 1–9 e 0 (décima arma) ou roda do mouse |
| Granada | G |
| Drone de reconhecimento | F |
| Interagir | E quando o objetivo permitir; segure em consoles de incursão |
| Cyberdeck | T durante a Incursão; Esc fecha |

### Armas do P38

- **SMG Vespa** — desbloqueia na onda 8; cadência alta e perfil leve.
- **Carabina Íon** — desbloqueia na onda 10; disparo energético e silhueta própria.
- No teclado, **0** seleciona a décima arma. Os oito arquétipos anteriores continuam disponíveis.

### Controle PlayStation / gamepad

**Sim: há suporte a gamepad** pelo Gamepad API do navegador. Um controle PlayStation 4/5 pode funcionar por USB ou Bluetooth se o sistema e o navegador o apresentarem com mapeamento padrão. Clique em **JOGAR** para iniciar e permitir o controle da câmera; em seguida, use os analógicos e botões:

| Botão padrão PlayStation | Ação no jogo |
|---|---|
| Analógico esquerdo | Movimento |
| Analógico direito | Olhar / câmera |
| Cruz (✕) | Pular |
| Círculo (○) | Dash |
| Quadrado (□) | Recarregar |
| Triângulo (△) | Granada |
| L1 / R1 | Arma anterior / próxima |
| L2 / R2 | Mirar / atirar |
| L3 (pressionar analógico esquerdo) | Interagir com objetivo |
| Options / Start | Pausar |

O mapeamento segue a ordem padrão Gamepad API e não é remapeável no menu. Agachar/deslizar, correr e inspecionar arma ainda não têm bindings dedicados no gamepad. Compatibilidade específica de cada modelo/driver e conexão Bluetooth não foi testada fisicamente nesta validação; se os botões estiverem trocados, o navegador provavelmente está expondo um mapeamento diferente do padrão.

Em telas sensíveis ao toque, selecione **Toque** ou **Automático**, mantenha o dispositivo na horizontal e use os botões virtuais. Algumas ações adicionadas ao teclado, como agachar/deslizar e inspeção, ainda não têm um botão móvel dedicado.

## 4. Testar o projeto

Na pasta do jogo, com Node.js instalado:

```bash
bash test.sh
```

A suíte executa testes de regras/módulos e `node --check` nos arquivos JavaScript. Uma execução local no navegador testa o fluxo básico e o WebGL, mas não substitui uma sessão manual em diferentes dispositivos.

## 5. Diagnóstico de desempenho

- Abra `http://localhost:8000/?perf=1` para acessar o modo de telemetria e cenário fixo, quando disponível.
- Teclas do painel de desempenho: **F8** mostrar/ocultar, **F9** reiniciar cenário e **F10** exportar CSV.
- Compare o resultado no computador ou celular real: Chromium headless e SwiftShader servem para verificar funcionamento, não para prever o FPS do aparelho.
- Se houver queda de fluidez, teste primeiro qualidade **Baixa**, feche abas pesadas e verifique se o navegador está usando aceleração gráfica.

## 6. PWA e modo offline

O jogo registra um service worker quando servido por `localhost` ou por HTTPS. Após a primeira carga completa, o navegador pode manter os arquivos essenciais em cache. Ao atualizar uma instalação já existente, recarregue o app conectado à internet para que o cache versionado novo seja instalado.

## 7. Resolução de problemas

- **Tela preta ou WebGL indisponível:** atualize o navegador e ative aceleração de hardware; confirme suporte WebGL em outro site de diagnóstico.
- **Os arquivos não carregam:** confirme que o servidor continua rodando e que o endereço contém `localhost:8000`.
- **O mouse não controla a câmera:** clique na área do jogo para ativar Pointer Lock; pressione Esc para sair dele.
- **O app parece desatualizado:** conecte à internet, recarregue a página e reabra a instalação PWA para atualizar o cache.
- **Teste falha ao executar:** confirme Node.js com `node --version` e execute o comando a partir da pasta do projeto.
