# Funcionalidades atuais

Este projeto contem uma interface antiga para exibicao de conteudo do Holyrics e um observador Python para coletar amostras JSON do endpoint da aplicacao.

## Observador Python

O arquivo `watcher.py` executa uma verificacao continua em um endpoint HTTP que retorna JSON.

Funcionalidades:

- Le uma URL configurada no arquivo `config.json`.
- Permite configurar URL base, porta e caminho do endpoint.
- Executa a verificacao em intervalo definido em milissegundos.
- Recebe a resposta como JSON.
- Compara cada nova leitura com todos os arquivos `.json` existentes na pasta `samples`.
- Grava a resposta somente quando ela for diferente de todas as amostras ja salvas.
- Nomeia cada arquivo salvo usando a propriedade `map.type` da resposta e o timestamp atual.
- Cria automaticamente a pasta de saida, caso ela nao exista.
- Ignora arquivos de amostra invalidos e continua executando.

Exemplo de nome gerado:

```text
MUSIC_20260509_153012_123.json
```

## Configuracao

O arquivo `config.json` define os parametros usados pelo observador.

Configuracao atual:

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
- `timeout_seconds`: tempo maximo de espera por resposta.
- `output_dir`: pasta onde as respostas diferentes serao gravadas.

## Pasta de amostras

A pasta `samples` armazena os arquivos JSON capturados pelo observador.

Cada arquivo representa uma resposta unica encontrada durante a execucao. Se uma nova leitura for igual a qualquer arquivo existente nessa pasta, ela nao sera gravada novamente.

## Como executar

Execute o observador com:

```powershell
python watcher.py
```

Tambem e possivel informar outro arquivo de configuracao:

```powershell
python watcher.py --config config.json
```

Para encerrar a execucao, use `Ctrl+C` no terminal.

## Interface antiga

A pasta `old` contem a implementacao anterior em HTML, CSS e JavaScript:

- `old/holyrics.html`
- `old/holyrics.css`
- `old/holyrics.js`

Essa interface consulta o endpoint `/stage-view/text.json` do Holyrics e atualiza a tela de acordo com o tipo recebido em `response.map.type`.

Tipos tratados pela interface:

- `EMPTY`: oculta conteudos exibidos.
- `MUSIC`: exibe titulo, artista ou verso de musica.
- `BIBLE`: exibe referencia, texto e traducao biblica.
- `TEXT`: trata texto livre, incluindo exibicao de cronometro quando o texto estiver no formato `minuto:segundo`.

## Estado atual do projeto

Arquivos principais:

- `watcher.py`: observador Python.
- `config.json`: configuracao do observador.
- `samples/`: pasta de saida das amostras JSON.
- `old/`: versao antiga da interface visual.
