# Planos de Implementação: Sistema de Interfone Modular

Este documento detalha a implementação do sistema de interfone em duas fases distintas e independentes, garantindo uma entrega de valor incremental e uma arquitetura flexível para futuras expansões.

## Fase 1: Módulo de Comunicação (Interfone Virtual)

**Objetivo:** Implementar o núcleo de comunicação do sistema, permitindo chamadas de áudio/vídeo e mensagens entre todos os perfis de usuários, com uma arquitetura preparada para a futura integração de controle de acesso.

### Entregáveis da Fase 1

| Componente | Descrição Detalhada |
| :--- | :--- |
| **Aplicativo Mobile (iOS/Android)** | - Telas de login e cadastro de usuários (Morador, Zelador).
- Diretório de contatos para chamadas internas (outros moradores e zelador).
- Interface para recebimento de chamadas de visitantes e internas, com vídeo e áudio.
- Funcionalidade de mensagens de texto entre usuários cadastrados.
- **Botão "Abrir Porta" visível, porém desabilitado**, com uma mensagem informativa (ex: "Controle de acesso não configurado"). |
| **Painel Web Administrativo** | - Cadastro de condomínio, blocos e apartamentos.
- Gestão de usuários (Moradores, Zelador), associando-os às suas respectivas unidades.
- Interface para envio de comunicados gerais (mural de avisos). |
| **Interface do Visitante (Web)** | - Página acessada via QR Code ou link na entrada do condomínio.
- Campo de busca para encontrar moradores por nome ou número do apartamento.
- Opção para ligar diretamente para o zelador.
- Interface para realizar a chamada de vídeo para o morador/zelador selecionado. |
| **Backend e Infraestrutura** | - APIs para gestão de usuários, sinalização de chamadas (WebRTC) e troca de mensagens.
- Serviço de notificações push (FCM) para alertar sobre novas chamadas e mensagens.
- Arquitetura de microsserviços com um **serviço de comunicação** desacoplado. Haverá um endpoint de API para "abrir porta" (`/api/v1/access/{doorId}/open`) que, nesta fase, retornará uma resposta de sucesso simulado sem executar nenhuma ação física. |

### Arquitetura e Preparação para a Fase 2

A arquitetura será modular desde o início. O **Módulo de Comunicação** será totalmente independente do futuro **Módulo de Controle de Acesso**. A chamada de API para abrir uma porta será uma função isolada. Na Fase 1, essa função terá um comportamento "mock" (simulado). Na Fase 2, apenas a implementação interna dessa função será alterada para se comunicar com o novo módulo IoT, sem exigir qualquer alteração nos aplicativos ou no fluxo de comunicação já estabelecido.


## Fase 2: Módulo de Integração IoT (Controle de Acesso)

**Objetivo:** Ativar a funcionalidade de controle de acesso físico, integrando o sistema de comunicação existente com os dispositivos IoT escolhidos pelo cliente para a abertura de portões e portas.

### Entregáveis da Fase 2

| Componente | Descrição Detalhada |
| :--- | :--- |
| **Aplicativo Mobile (iOS/Android)** | - **Ativação do botão "Abrir Porta"**: A funcionalidade, que estava visível mas desabilitada na Fase 1, será conectada à API do backend. Nenhuma outra alteração visual ou de fluxo será necessária no aplicativo. |
| **Painel Web Administrativo** | - **Desenvolvimento da Seção de Integração IoT**: Criação da interface para que o administrador possa cadastrar e configurar os dispositivos de acesso (portões, portas).
- Para cada dispositivo, o administrador poderá informar o nome, o protocolo (API REST ou MQTT) e os parâmetros específicos (Endpoint, Método, Headers, Body, Tópico MQTT, etc.). |
| **Backend e Infraestrutura** | - **Criação do Microsserviço de Controle de Acesso**: Um novo serviço independente será desenvolvido para gerenciar a comunicação com os dispositivos IoT.
- **Implementação da Lógica de Acionamento**: A chamada de API para `/api/v1/access/{doorId}/open` será redirecionada para o novo microsserviço, que irá consultar as configurações salvas pelo administrador e disparar a requisição correta para o dispositivo IoT correspondente. |

### Estratégia de Integração e Modularidade

Esta fase exemplifica a vantagem da arquitetura modular. O **Módulo de Comunicação** (Fase 1) não sofrerá nenhuma alteração. Ele continuará chamando o mesmo endpoint de API que antes era simulado. A diferença é que agora este endpoint acionará um serviço real e independente, o **Módulo de Controle de Acesso**, que executa a lógica de hardware.

Essa abordagem garante:
- **Baixo Acoplamento:** Os sistemas são independentes. Uma falha em um dispositivo IoT ou no serviço de acesso não afetará as chamadas de vídeo ou as mensagens.
- **Manutenção Simplificada:** A lógica de comunicação com diferentes hardwares fica centralizada em um único serviço, facilitando atualizações e a adição de novos protocolos no futuro.
- **Impacto Zero no Usuário Final:** Para o morador, a experiência no aplicativo será a mesma. A única mudança é que o botão "Abrir Porta" passará a funcionar no mundo real.
