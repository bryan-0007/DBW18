# Projeto DBW8

Este projeto é um website desenvolvido com Node.js, Express e MongoDB. Ele possui recursos como autenticação, gerenciamento de perguntas frequentes (FAQ) e tickets e atendimento ao cliente.

## Requisitos

- Node.js
- MongoDB

## Instalação

1. Clone este repositório:

```bash
git clone https://github.com/seu_usuario/yt.git
```

2. Instale as dependências do projeto:

```bash
npm install
```

## Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto e preencha com as seguintes variáveis:

```javascript
SESSION_SECRET=<sua_chave_secreta_para_sessão>
```

Substitua `<sua_chave_secreta_para_sessão>` por uma chave secreta aleatória para a sessão.

## Execução

Para iniciar o servidor, execute o seguinte comando:

```bash
npm run dev
```

Agora, acesse `http://localhost:3000` no browser para ver o website em execução.

## Estrutura do Projeto

- `models/`: Contém os modelos do Mongoose para os esquemas de usuário, perguntas frequentes e tickets.
- `public/`: Contém arquivos estáticos, como imagens e CSS.
- `views/`: Contém os arquivos EJS para as páginas do website.
- `middlewares/`: Contém os middlewares personalizados para autenticação e autorização.
- `server.js`: Contém o código principal do servidor Express e configurações do Socket.IO.
- `passport-config.js`: Contém a configuração do Passport.js para autenticação local.

## Contas para Teste

### Conta do Agente
- `E-mail:` Admin@gmail.com
- `Senha:` 123

### Conta do Usuário
- `E-mail:` josefa@gmail.com
- `Senha:` josefa
