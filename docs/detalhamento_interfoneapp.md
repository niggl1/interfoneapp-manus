# Detalhamento Completo do Projeto InterfoneApp

## Visão Geral do Projeto

Sistema de interfone virtual para condomínios, com aplicativos para Android, iOS e Web, focado em comunicação entre moradores, visitantes e zeladores.

---

## 1. Especificações Iniciais

| Item | Especificação |
| :--- | :--- |
| **Plataformas** | Android, iOS e Web |
| **Público-alvo** | Condomínios residenciais |
| **Funcionalidades principais** | Chamadas de voz/vídeo e mensagens |
| **Infraestrutura** | Sistema novo, 100% baseado em software |

---

## 2. Fases de Implementação

### Fase 1: Módulo de Comunicação (Implementada)

Funcionalidades de comunicação entre os diferentes perfis:

| Comunicação | Descrição |
| :--- | :--- |
| **Morador ↔ Morador** | Chamadas de vídeo/áudio e mensagens entre moradores |
| **Visitante → Morador** | Visitante escaneia QR Code e liga para o morador |
| **Visitante → Zelador** | Visitante pode ligar diretamente para o zelador |
| **Zelador ↔ Moradores** | Comunicação bidirecional e envio de comunicados |

### Fase 2: Integração IoT (Futura)

Preparada para integração com dispositivos IoT para abertura de portões. A arquitetura suporta qualquer dispositivo via API (REST ou MQTT), incluindo Shelly, Sonoff, ESP32, entre outros.

---

## 3. Cadastro de Apartamentos e QR Code

### Funcionalidades da Página de Cadastro

- Cadastro de unidades com número, bloco/torre, andar e status
- Cadastro de moradores vinculados a cada apartamento (nome, telefone, e-mail, foto)
- Geração automática de QR Code exclusivo para cada unidade
- Regeneração de QR Code por motivos de segurança
- Exportação e impressão dos QR Codes em PDF ou imagem

### Fluxo de Acesso do Visitante via QR Code

1. O visitante escaneia o QR Code na entrada com seu smartphone
2. Uma página web abre automaticamente (sem necessidade de instalar app)
3. O visitante pode:
   - Digitar o número do apartamento
   - Pesquisar pelo nome do morador
   - Visualizar a lista de todos os moradores cadastrados naquela unidade
4. Ao selecionar o morador, inicia uma chamada de vídeo/áudio
5. O morador atende e pode liberar o acesso remotamente

---

## 4. Integração IoT Genérica

### Arquitetura de Integração

O sistema suporta qualquer dispositivo IoT que possua API:

| Protocolo | Descrição |
| :--- | :--- |
| **API REST (HTTP/S)** | Envia comandos GET/POST para acionar o relé |
| **MQTT** | Publica mensagens em tópicos para dispositivos compatíveis |

### Interface de Configuração para o Administrador

Campos disponíveis no painel administrativo:

| Campo | Descrição |
| :--- | :--- |
| Nome do Acesso | Identificação amigável (ex: "Portão Principal") |
| Tipo de Integração | Seleção do protocolo (REST ou MQTT) |
| Endpoint (URL) | Endereço do dispositivo na rede |
| Método HTTP | GET ou POST |
| Headers | Cabeçalhos para autenticação, se necessário |
| Body | Corpo da requisição para métodos POST |

### Dispositivos Compatíveis Sugeridos

| Dispositivo | Protocolo/API | Preço Aproximado |
| :--- | :--- | :--- |
| Shelly 1 / Shelly Plus 1 | REST API + MQTT | R$ 80-150 |
| Sonoff Basic / Mini | eWeLink API ou Tasmota | R$ 40-80 |
| ESP32/ESP8266 + Relé | Customizável | R$ 30-60 |
| Tuya Smart Switch | Tuya Cloud API | R$ 50-100 |

---

## 5. Função "Estou Chegando" (Em Implementação)

### Fluxo Principal

1. Na tela de login, o morador clica 2 vezes no ícone do sistema
2. Abre tela solicitando o PIN de segurança
3. Morador confirma e seleciona o tipo de transporte
4. Porteiro recebe PUSH + aviso sonoro (som contínuo até confirmar)
5. Porteiro confirma recebimento e visualiza localização em tempo real no mapa
6. Sistema envia confirmações automáticas em 500m, 200m e 50m

### Configurações do Morador (Minha Conta)

| Campo | Descrição |
| :--- | :--- |
| **PIN de Segurança** | Código de 4-6 dígitos para ativar a função |
| **Veículos Cadastrados** | Placa, modelo e cor dos veículos próprios |
| **Veículo Padrão** | Veículo selecionado automaticamente |

### Tipos de Transporte

| Tipo | Campos |
| :--- | :--- |
| **Veículo Próprio** | Seleciona veículo cadastrado |
| **Uber/Taxi/99** | Preenche: Placa, Modelo, Cor, Nome do motorista (opcional) |
| **A Pé** | Apenas localização |
| **Outro** | Apenas localização |

### Informações Exibidas para o Porteiro

- Nome do morador
- Apartamento (Bloco + Número)
- Tipo de transporte
- Dados do veículo (placa, modelo, cor)
- Localização em tempo real no mapa
- Tempo estimado de chegada (ETA)
- Status: 500m → 200m → 50m → Chegou

### Alertas do Porteiro

- **Push notification** com som de alerta
- **Som contínuo** que só para quando o porteiro confirma
- **Sem modo silencioso** (conforme solicitado)

---

## 6. Componentes Implementados

### Backend (Node.js + Express + Prisma)

| Módulo | Endpoints |
| :--- | :--- |
| **Auth** | POST /register, /login, /refresh-token, GET /me |
| **Users** | GET /contacts, /residents, /janitors, PUT /profile |
| **Units** | CRUD de condomínios, blocos, apartamentos, QR Codes |
| **Communication** | Chamadas, Mensagens, Comunicados |
| **Arrival** | PIN, Veículos, Avisos de chegada (em implementação) |

### Web Admin (React + Vite + TailwindCSS)

| Tela | Funcionalidades |
| :--- | :--- |
| Login | Autenticação JWT |
| Dashboard | Estatísticas, cards de resumo |
| Condomínios | CRUD, gerar QR Code |
| Blocos | CRUD com filtro por condomínio |
| Apartamentos | CRUD, gerar QR Code |
| Usuários | Listagem geral com filtros |
| Moradores | CRUD com vinculação a apartamento |
| Zeladores | CRUD com vinculação a condomínio |

### Mobile App (React Native + Expo)

| Tela | Funcionalidades |
| :--- | :--- |
| Login | Autenticação JWT, design premium |
| Home | Dashboard, ações rápidas, botão de emergência |
| Contatos | Listagem com busca, chamada e mensagem |
| Comunicados | Visualização de avisos |
| Mensagens | Lista de conversas, indicador de não lidas |
| Chat | Conversa em tempo real |
| Chamadas | Histórico (realizadas/recebidas/perdidas) |
| VideoCall | Interface de chamada com controles |

### Web Visitor (React + Vite + TailwindCSS)

| Tela | Funcionalidades |
| :--- | :--- |
| Welcome | Página inicial com instruções |
| Entry | Entrada via QR Code, lista de moradores, busca |
| Call | Interface de chamada de vídeo |

---

## 7. Tecnologias Utilizadas

| Componente | Tecnologias |
| :--- | :--- |
| **Backend** | Node.js, Express, Prisma, PostgreSQL, Socket.io, JWT |
| **Web Admin** | React, Vite, TailwindCSS, Axios, React Router |
| **Mobile** | React Native, Expo, Socket.io Client |
| **Web Visitor** | React, Vite, TailwindCSS, Socket.io Client |
| **Comunicação** | WebRTC (vídeo/áudio), Socket.io (sinalização) |

---

## 8. Repositório GitHub

**URL:** https://github.com/niggl1/interfoneapp-manus

### Estrutura do Repositório

```
interfoneapp-manus/
├── backend/           # API REST + WebSocket
├── web-admin/         # Painel administrativo
├── mobile/            # App React Native/Expo
├── web-visitor/       # Interface do visitante
└── docs/              # Documentação
```

---

## 9. Credenciais de Teste

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| Admin | admin@interfoneapp.com | admin123 |
| Zelador | zelador@condmanus.com.br | zelador123 |
| Morador | maria@email.com | morador123 |

---

## 10. Próximos Passos Pendentes

1. **Finalizar função "Estou Chegando"**
   - Completar service do backend
   - Implementar telas no mobile
   - Implementar tela do porteiro com mapa

2. **Melhorias Sugeridas (Alta Prioridade)**
   - Integração com Câmeras de Segurança
   - Botão de Pânico
   - Rastreamento de Encomendas
   - Reserva de Áreas Comuns
   - Mural de Avisos e Enquetes

---

*Documento gerado em 16/01/2026*
