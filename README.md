# InterfoneApp Manus

Sistema de Interfone Virtual para Condomínios - Comunicação por vídeo, áudio e mensagens.

## Visão Geral

O InterfoneApp é uma solução moderna de interfonia baseada em software, projetada para substituir sistemas de interfone tradicionais em condomínios residenciais. O sistema permite comunicação em tempo real entre moradores, visitantes e zeladores através de chamadas de vídeo, áudio e mensagens de texto.

## Arquitetura

O projeto segue uma arquitetura modular e escalável:

```
interfoneapp-manus/
├── backend/                 # API e serviços do servidor
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/        # Autenticação e autorização
│   │   │   ├── users/       # Gestão de usuários
│   │   │   ├── units/       # Gestão de unidades/apartamentos
│   │   │   ├── communication/  # Chamadas e mensagens (WebRTC)
│   │   │   └── access/      # [Futuro] Controle de acesso IoT
│   │   └── ...
│   └── ...
├── mobile/                  # Aplicativo React Native (iOS/Android)
├── web-admin/               # Painel administrativo (React)
├── web-visitor/             # Interface do visitante (React)
└── docs/                    # Documentação
```

## Tecnologias

| Componente | Tecnologia |
|------------|------------|
| Backend | Node.js + Express.js |
| Mobile | React Native |
| Web | React.js |
| Banco de Dados | PostgreSQL |
| Comunicação em Tempo Real | WebRTC |
| Notificações Push | Firebase Cloud Messaging |

## Funcionalidades (Fase 1)

- **Comunicação por Vídeo/Áudio**: Chamadas em tempo real entre usuários
- **Mensagens de Texto**: Chat entre moradores e zelador
- **Gestão de Condomínio**: Cadastro de blocos, unidades e moradores
- **Interface do Visitante**: Acesso via QR Code para contatar moradores
- **Mural de Avisos**: Comunicados da administração

## Instalação

*Instruções de instalação serão adicionadas conforme o desenvolvimento avança.*

## Licença

Projeto privado - Todos os direitos reservados.
