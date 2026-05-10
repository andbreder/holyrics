# Holyrics Live Overlay

Este projeto contem uma interface live para exibir conteudo do Holyrics em paginas separadas por tipo, uma interface antiga em `old/` e um observador Python para capturar amostras JSON do endpoint da aplicacao.

## Paginas live

As paginas em `live/` consomem o endpoint `/stage-view/text.json` e renderizam apenas o tipo correspondente ao `response.map.type`.

- `live/music.html`: conteudo do tipo `MUSIC`.
- `live/bible.html`: conteudo do tipo `BIBLE`.
- `live/text.html`: conteudo do tipo `TEXT`.
- `live/image.html`: conteudo do tipo `IMAGE`.

Para usar no navegador ou OBS, abra a pagina desejada. Por padrao o frontend consulta:

```text
http://localhost:7575/stage-view/text.json
```

## Configuracao do frontend

A configuracao geral pode ser sobrescrita antes de carregar `core.js`:

```html
<script>
  window.HolyricsConfig = {
    servers: ["http://localhost:7575"],
    requestPath: "/stage-view/text.json",
    intervalMs: 400,
    timeoutMs: 3000,
    debug: false
  };
</script>
```

Campos:

- `servers`: lista de servidores Holyrics. Em erro, o renderer tenta o proximo servidor.
- `requestPath`: caminho do JSON.
- `intervalMs`: intervalo de leitura em milissegundos.
- `timeoutMs`: timeout da requisicao em milissegundos.
- `debug`: quando `true`, registra logs no console.

## Configuracao visual aplicada

Configuracoes globais em `live/assets/css/base.css`:

- Fonte padrao: Rubik via Google Fonts.
- Peso padrao: `--font-weight: 600`.
- Duracao padrao das animacoes: `--motion-duration: 200ms`.
- Todas as letras sao apresentadas em maiusculas com `text-transform: uppercase`.
- Cores principais expostas por variaveis CSS:

```css
:root {
  --motion-duration: 200ms;
  --overlay-text-color: #fafafa;
  --overlay-accent-color: rgb(0, 170, 255);
  --overlay-stroke-color: rgb(0, 20, 100);
  --overlay-surface-color: rgba(0, 20, 100, 0.72);
  --font-weight: 600;
}
```

Configuracoes compartilhadas em `live/assets/css/text-shared.css`:

- `MUSIC`, `TEXT` e `BIBLE` usam texto centralizado.
- O contorno das letras usa `-webkit-text-stroke`.
- Caso `-webkit-text-stroke` nao esteja disponivel, ha fallback com `text-shadow`.
- Linhas de musica e texto sao renderizadas como blocos.

## MUSIC

Renderer: `live/assets/js/music.js`

Estilo: `live/assets/css/music.css`

Comportamentos aplicados:

- `custom_class === "music_title"` exibe titulo e artista.
- Versos comuns sao exibidos em `.music-lines`.
- Comentarios recebidos como `<span class="comment">...</span>` sao reconhecidos.
- Comentarios sao ignorados por padrao.
- Quando comentarios estiverem ativos, linhas de comentario recebem `class="comment"` e cor laranja.
- `[FIM]` nunca e exibido.
- Payloads que resultam somente em `[FIM]` ou conteudo ignorado limpam/nao exibem a tela.
- Conteudo iniciado com `...` representa proximo conteudo.
- `...` so aparece quando for o unico conteudo util e `showNextContent` estiver ativo.
- Quando `...` aparece, a exibicao usa visual cinza (`music-preview`).
- O texto bruto recebido (`rawText`) faz parte da chave de comparacao, entao mudancas no payload disparam animacao mesmo se o texto sanitizado for igual.
- O caractere `+` em `.music-name` e `.music-artist` recebe destaque com `.music-plus`.

Configuracao especifica de MUSIC:

```html
<script>
  window.HolyricsMusicConfig = {
    ignoreComments: true,
    showNextContent: true
  };
</script>
```

Campos:

- `ignoreComments`: quando `true`, oculta `<span class="comment">...</span>`.
- `showNextContent`: quando `true`, permite exibir linha unica iniciada com `...`.

Exemplo para exibir comentarios e ocultar proximo conteudo:

```html
<script>
  window.HolyricsMusicConfig = {
    ignoreComments: false,
    showNextContent: false
  };
</script>
```

## BIBLE

Renderer: `live/assets/js/bible.js`

Estilo: `live/assets/css/bible.css`

Comportamentos aplicados:

- Layout em tres regioes: referencia superior, texto central e versao inferior.
- Container com `width: 200%` e gradiente horizontal para suavizar transicoes laterais.
- Conteudo usa `--overlay-content-gutter: 26vw` para evitar vazamento lateral.
- `.bible-header` e `.text-title` usam o mesmo tamanho base: `clamp(28px, 4vw, 72px)`.
- `.bible-text` tem ajuste dinamico de fonte via `fitTextToBox`, reduzindo ate caber na area disponivel.
- Troca de versiculo/capitulo anima somente o texto central:
  - Avanco: texto atual sai para a esquerda, novo entra pela direita.
  - Retrocesso: texto atual sai para a direita, novo entra pela esquerda.
- A entrada do novo texto central so inicia depois da saida do anterior.
- Mudanca de versao anima somente a versao inferior:
  - antigo sai com `fadeOutBottom`;
  - novo entra com `fadeIn`;
  - entrada tambem aguarda a saida terminar.
- Mudanca de livro anima somente o texto superior:
  - antigo sai com `fadeOutTop`;
  - novo entra com `fadeIn`;
  - entrada tambem aguarda a saida terminar.

## TEXT

Renderer: `live/assets/js/text.js`

Estilo: `live/assets/css/text.css`

Comportamentos aplicados:

- Layout com titulo superior fixado e linhas centralizadas vertical e horizontalmente.
- Container com `width: 200%` e gradiente horizontal para suavizar transicoes laterais.
- Conteudo usa `--overlay-content-gutter: 26vw` para evitar vazamento lateral.
- `.text-lines` tem ajuste dinamico de fonte via `fitTextToBox`, reduzindo ate caber na area disponivel.
- Alteracao somente no conteudo anima apenas `.text-lines` com `fadeOut`/`fadeIn`.
- Alteracao da origem/titulo anima `.text-title` e `.text-lines` com `fadeOut`/`fadeIn`.
- Ao fechar ou trocar de tipo, toda a section sai com `fadeOut`.
- Quando o texto possui uma unica linha no formato `minuto:segundo`, a pagina exibe cronometro com data.

## IMAGE

Renderer: `live/assets/js/image.js`

Estilo: `live/assets/css/image.css`

A pagina `image.html` existe para conteudos do tipo `IMAGE` e usa a mesma infraestrutura de polling e transicao do `core.js`.

## Scripts Python

Atualmente existe um script Python no projeto:

```text
watcher.py
```

### watcher.py

O `watcher.py` observa continuamente um endpoint JSON e salva em disco apenas respostas ainda nao registradas.

Comando basico:

```powershell
python watcher.py
```

Com arquivo de configuracao explicito:

```powershell
python watcher.py --config config.json
```

Forma curta:

```powershell
python watcher.py -c config.json
```

Argumentos:

- `-c`, `--config`: caminho do arquivo de configuracao. Padrao: `config.json`.

Arquivo de configuracao padrao:

```json
{
  "endpoint": {
    "url": "http://localhost",
    "port": 7575,
    "path": "/stage-view/text.json"
  },
  "interval_ms": 400,
  "timeout_seconds": 5,
  "output_dir": "samples"
}
```

Campos:

- `endpoint.url`: URL base do servidor.
- `endpoint.port`: porta do servidor.
- `endpoint.path`: caminho do endpoint JSON.
- `interval_ms`: intervalo entre verificacoes, em milissegundos.
- `timeout_seconds`: tempo maximo de espera por resposta, em segundos.
- `output_dir`: pasta onde respostas novas serao gravadas.

Saida esperada no terminal ao iniciar:

```text
Observando http://localhost:7575/stage-view/text.json
Intervalo: 400 ms
Saida: C:\...\holyrics\samples
```

Saida quando uma resposta nova e salva:

```text
[novo] samples\MUSIC_20260509_153012_123.json
```

Saida quando a resposta ja existe em `samples/`:

```text
[igual] resposta ja registrada
```

Saida quando ocorre erro de rede, timeout, JSON invalido ou erro de arquivo:

```text
[erro] <detalhes do erro>
```

Saida quando um arquivo de amostra existente nao pode ser lido como JSON:

```text
[aviso] ignorando sample invalido samples\arquivo.json: <detalhes do erro>
```

Arquivos gerados:

- Sao gravados em `output_dir`, por padrao `samples/`.
- O nome usa `map.type` e timestamp.
- Exemplo:

```text
MUSIC_20260509_153012_123.json
```

Para encerrar:

```text
Ctrl+C
```

## Interface antiga

A pasta `old/` contem a implementacao anterior:

- `old/holyrics.html`
- `old/holyrics.css`
- `old/holyrics.js`

Ela tambem consulta `/stage-view/text.json`, mas nao contem as melhorias atuais do renderer em `live/`.

## Arquivos principais

- `live/`: paginas atuais por tipo.
- `live/assets/js/core.js`: polling, normalizacao geral, transicoes e utilitarios.
- `live/assets/js/music.js`: renderer de musica.
- `live/assets/js/bible.js`: renderer de Biblia.
- `live/assets/js/text.js`: renderer de texto livre e timer.
- `live/assets/css/`: estilos e animacoes.
- `watcher.py`: observador Python.
- `config.json`: configuracao padrao do observador.
- `samples/`: saida das amostras JSON.
- `old/`: interface antiga.
