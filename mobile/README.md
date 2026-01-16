# InterfoneApp - Mobile

Aplicativo mobile para o sistema de interfone de condomínios, desenvolvido com React Native e Expo.

## Tecnologias

- **Expo** - Framework para React Native
- **React Navigation** - Navegação entre telas
- **Socket.io Client** - Comunicação em tempo real
- **Expo AV** - Áudio e vídeo
- **Expo Camera** - Acesso à câmera
- **Expo Secure Store** - Armazenamento seguro de tokens
- **Expo Linear Gradient** - Gradientes para UI premium

## Estrutura do Projeto

```
mobile/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   ├── context/
│   │   └── AuthContext.js   # Contexto de autenticação
│   ├── hooks/               # Hooks customizados
│   ├── navigation/
│   │   └── AppNavigator.js  # Configuração de navegação
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.js
│   │   ├── home/
│   │   │   ├── HomeScreen.js
│   │   │   ├── ContactsScreen.js
│   │   │   └── AnnouncementsScreen.js
│   │   ├── messages/
│   │   │   ├── MessagesScreen.js
│   │   │   └── ChatScreen.js
│   │   └── calls/
│   │       ├── CallsScreen.js
│   │       └── VideoCallScreen.js
│   ├── services/
│   │   ├── api.js           # Cliente HTTP (Axios)
│   │   └── socket.js        # Cliente Socket.io
│   └── utils/               # Utilitários
├── App.js                   # Entry point
├── app.json                 # Configuração Expo
└── package.json
```

## Funcionalidades

### Autenticação
- Login com email e senha
- Armazenamento seguro de tokens (JWT)
- Refresh token automático
- Logout

### Comunicação
- **Mensagens**: Chat em tempo real entre moradores, zelador e visitantes
- **Chamadas**: Chamadas de vídeo/áudio com sinalização WebRTC
- **Comunicados**: Visualização de comunicados da administração

### Perfis de Usuário
- **Morador**: Acesso completo às funcionalidades de comunicação
- **Zelador**: Comunicação com todos os moradores e visitantes

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar o projeto
npx expo start
```

## Configuração

Edite o arquivo `src/services/api.js` para configurar a URL do servidor:

```javascript
const API_URL = 'http://SEU_IP:3000/api/v1';
```

Edite o arquivo `src/services/socket.js` para configurar a URL do Socket:

```javascript
const SOCKET_URL = 'http://SEU_IP:3000';
```

## Executando

### iOS (Simulador)
```bash
npx expo start --ios
```

### Android (Emulador)
```bash
npx expo start --android
```

### Expo Go (Dispositivo físico)
1. Instale o app Expo Go no seu dispositivo
2. Escaneie o QR Code gerado pelo `npx expo start`

## Design

O aplicativo segue um design premium com:
- Gradientes azuis como cor primária
- Cards com sombras suaves
- Ícones do Ionicons
- Tipografia clara e legível
- Animações sutis

## Próximos Passos (Fase 2)

- [ ] Integração com WebRTC para chamadas reais
- [ ] Notificações push
- [ ] Integração com IoT para abertura de portões
- [ ] Modo offline com sincronização
