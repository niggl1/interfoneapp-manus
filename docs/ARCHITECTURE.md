# Arquitetura do Sistema

## Visão Geral

O InterfoneApp segue uma arquitetura modular baseada em microsserviços, permitindo escalabilidade e manutenção independente de cada componente.

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                  │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Mobile App     │  Web Admin      │  Web Visitor                │
│  (iOS/Android)  │  (React)        │  (React - via QR Code)      │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                     │
         └─────────────────┼─────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   API REST   │
                    │   Gateway    │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐
   │   Auth    │    │Communication│   │   Users/    │
   │  Module   │    │   Module    │   │   Units     │
   └───────────┘    │  (WebRTC)   │   │   Module    │
                    └─────────────┘   └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   Access    │  ← [FASE 2 - Oculto]
                    │   Module    │
                    │    (IoT)    │
                    └─────────────┘
```

## Módulos

### 1. Auth Module (Autenticação)
Responsável por:
- Login/Logout de usuários
- Geração e validação de tokens JWT
- Controle de sessões
- Recuperação de senha

### 2. Users Module (Usuários)
Responsável por:
- Cadastro de moradores
- Cadastro de zeladores
- Perfis de usuário
- Gestão de permissões

### 3. Units Module (Unidades)
Responsável por:
- Cadastro de condomínios
- Cadastro de blocos/torres
- Cadastro de apartamentos
- Geração de QR Codes
- Vinculação morador-unidade

### 4. Communication Module (Comunicação)
Responsável por:
- Sinalização WebRTC para chamadas
- Gerenciamento de salas de chamada
- Histórico de chamadas
- Mensagens de texto
- Notificações push

### 5. Access Module (Controle de Acesso) - FASE 2
**[OCULTO NA INTERFACE - Preparado para implementação futura]**

Responsável por:
- Integração com dispositivos IoT
- Acionamento de portões/portas
- Configuração de endpoints de hardware
- Logs de acesso físico

## Fluxos Principais

### Fluxo de Chamada (Visitante → Morador)

1. Visitante escaneia QR Code na entrada
2. Sistema abre interface web do visitante
3. Visitante busca morador por nome ou apartamento
4. Visitante inicia chamada
5. Sistema envia notificação push ao morador
6. Morador atende no aplicativo mobile
7. Conexão WebRTC P2P é estabelecida
8. Chamada de vídeo/áudio em tempo real

### Fluxo de Mensagem (Morador ↔ Zelador)

1. Morador abre chat no aplicativo
2. Seleciona zelador como destinatário
3. Envia mensagem de texto
4. Sistema persiste mensagem no banco
5. Sistema envia notificação push ao zelador
6. Zelador visualiza e responde

## Tecnologias por Camada

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Mobile | React Native | Cross-platform, código único |
| Web | React.js | Componentização, performance |
| API | Node.js + Express | Async, escalável, JS full-stack |
| WebRTC | Peer.js / Simple-peer | Abstração WebRTC simplificada |
| Database | PostgreSQL | Relacional, robusto, ACID |
| Cache | Redis | Sessões, filas de mensagens |
| Push | Firebase FCM | Gratuito, confiável, cross-platform |

## Considerações de Segurança

- Todas as comunicações via HTTPS/WSS
- Autenticação via JWT com refresh tokens
- Senhas hasheadas com bcrypt
- Rate limiting nas APIs
- Validação de entrada em todas as rotas
- CORS configurado por ambiente
