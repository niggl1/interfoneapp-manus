# InterfoneApp - Web Visitor

Interface web responsiva para visitantes acessarem via QR Code e ligarem para moradores sem precisar instalar nenhum aplicativo.

## Tecnologias

- **React** + **Vite** - Framework e build tool
- **TailwindCSS** - Estilização
- **React Router** - Navegação
- **Socket.io Client** - Comunicação em tempo real
- **Axios** - Requisições HTTP
- **Lucide React** - Ícones

## Estrutura do Projeto

```
web-visitor/
├── src/
│   ├── pages/
│   │   ├── WelcomePage.jsx    # Página inicial
│   │   ├── EntryPage.jsx      # Entrada via QR Code
│   │   └── CallPage.jsx       # Tela de chamada
│   ├── services/
│   │   ├── api.js             # Cliente HTTP
│   │   └── socket.js          # Cliente Socket.io
│   ├── App.jsx                # Rotas
│   └── index.css              # Estilos globais
├── package.json
└── vite.config.js
```

## Fluxo do Visitante

1. **Escaneamento do QR Code**
   - Visitante escaneia o QR Code na entrada do condomínio
   - O QR Code contém uma URL como: `https://app.interfone.com/v/ABC123`

2. **Seleção do Morador**
   - Página exibe informações do condomínio/apartamento
   - Visitante pode:
     - Ver lista de moradores cadastrados
     - Buscar por nome ou número do apartamento
     - Ligar diretamente para o zelador

3. **Identificação**
   - Visitante informa seu nome
   - Nome é exibido para o morador ao receber a chamada

4. **Chamada**
   - Chamada de vídeo/áudio é iniciada
   - Morador recebe notificação no app mobile
   - Morador pode atender, rejeitar ou liberar acesso

## Rotas

| Rota | Descrição |
| :--- | :--- |
| `/` | Página inicial com instruções |
| `/unit/:qrCode` | Entrada via QR Code |
| `/v/:qrCode` | Entrada via QR Code (URL curta) |
| `/call/:residentId` | Tela de chamada |

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

## Design

A interface foi projetada para ser:
- **Mobile-first**: Otimizada para smartphones
- **Simples**: Fluxo intuitivo sem necessidade de cadastro
- **Rápida**: Carregamento mínimo, sem instalação
- **Acessível**: Contraste adequado e botões grandes

## Próximos Passos

- [ ] Integração com WebRTC para chamadas reais
- [ ] Suporte a câmera do visitante
- [ ] Histórico de visitas
- [ ] Pré-autorização de visitantes
