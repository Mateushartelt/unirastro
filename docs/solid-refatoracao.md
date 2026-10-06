# Refatoração SOLID do frontend UNIRASTRO

Este documento registra a atividade de revisão do código da Aplicação Web segundo os
princípios SOLID: o que cada princípio pede, quais infrações existiam, como foram corrigidas e
o checklist de conformidade com o Modelo C4.

O comportamento da aplicação não mudou. Antes de substituir o código antigo, os serviços novos
foram executados lado a lado com os antigos em 47 cenários (listagem de encomendas e
incidentes dos dois tenants, cadastro válido e inválido, consultas de status sucessivas,
resolução de incidente, alternância de gatilho, login e permissões por papel) e as respostas
foram idênticas. Depois, a aplicação foi exercitada no navegador com as quatro contas de
demonstração.

## 1. O que é SOLID

SOLID é um conjunto de cinco princípios de projeto orientado a objetos, reunidos por Robert C.
Martin, cujo objetivo é deixar o código fácil de entender, de testar e de mudar sem quebrar o
que já funciona.

| Sigla | Princípio | O que pede, em uma frase |
| --- | --- | --- |
| **S** | Single Responsibility (Responsabilidade Única) | Um módulo deve ter um único motivo para mudar, ou seja, responder a um único ator ou assunto do negócio. |
| **O** | Open/Closed (Aberto/Fechado) | O código deve estar aberto para extensão e fechado para modificação: comportamento novo entra como código novo, não como edição do código que já funciona. |
| **L** | Liskov Substitution (Substituição de Liskov) | Qualquer implementação de um contrato deve poder substituir outra sem que quem usa perceba: sem exceções inesperadas, sem métodos vazios, sem retornos que violem o tipo prometido. |
| **I** | Interface Segregation (Segregação de Interfaces) | Ninguém deve depender de métodos que não usa. Várias interfaces pequenas e específicas são melhores que uma interface "gorda". |
| **D** | Dependency Inversion (Inversão de Dependência) | Módulos de alto nível (regras, casos de uso) não dependem de detalhes (banco, armazenamento, mocks); ambos dependem de abstrações. Quem liga a abstração ao detalhe é um ponto central de montagem (composition root). |

Na prática, os cinco se reforçam. Separar responsabilidades (S) cria peças pequenas; essas
peças conversam por interfaces específicas (I); as interfaces permitem trocar implementações
sem surpresa (L) e sem editar quem usa (O); e um composition root decide quais implementações
concretas entram (D).

## 2. Infrações encontradas no código original

| # | Onde | Princípio | Problema |
| --- | --- | --- | --- |
| 1 | `services/ordersService.ts` | S | Fazia cinco coisas: casos de uso de encomenda, acesso direto ao store global, simulação da transportadora (`nextEvent`), cálculo de datas (`inDays`) e status dos workers (`getWorkerStatus`), que nem é assunto de encomenda. |
| 2 | `services/authService.ts` | S | Autenticava, gravava a sessão no `localStorage` e decidia permissões por papel: três motivos de mudança diferentes. |
| 3 | `services/alertsService.ts` | S, I | Juntava incidentes e gatilhos no mesmo módulo, com a regra de ordenação e a política de notificação embutidas. A AlertsPage e a AppShell dependiam do pacote inteiro. |
| 4 | `services/store.ts` | S, I, D | Objeto global único com todas as fatias de estado. Todo serviço lia e escrevia em tudo; nenhum declarava do que realmente precisava. |
| 5 | `lib/anomalyRules.ts` | O | As regras ficavam num array fixo (`RULES`). Criar uma regra nova obrigava a editar o arquivo do núcleo do produto, e também a união `ANOMALY_RULES` em `types/` e o mapa `RULE_TO_TRIGGER`. |
| 6 | `mocks/triggers.ts` (`RULE_TO_TRIGGER`) | S, D | A correspondência regra × gatilho, que é regra de negócio, estava guardada junto dos dados simulados, e o serviço de alertas importava `mocks/` direto. |
| 7 | `lib/anomalyRules.ts` → `lib/format.ts` | D | O domínio dependia de um módulo de formatação de tela para calcular horas e dias. A direção estava invertida. |
| 8 | `lib/carrierDetection.ts` | S | Misturava a regra de detecção com os textos de interface ("Aguardando código…"). |
| 9 | `SEVERITY_WEIGHT` em dois arquivos | S | A mesma regra de negócio duplicada em `anomalyRules.ts` e `alertsService.ts`. |
| 10 | `pages/auth/LoginPage.tsx` | D | Importava `mocks/users.ts` direto, furando a regra do próprio README de que páginas só falam com `services/`. |
| 11 | Páginas, AppShell e AuthContext | D | Importavam os módulos concretos (`import * as authService`, `listOrders` etc.). Não havia interface nem ponto de montagem: trocar mock por HTTP exigiria editar telas. |
| 12 | `types/index.ts` (`ApiResponse`) e `services/client.ts` (`fail`) | L | Uma falha devolvia `data: null as T`, mentindo para o tipo. A AppShell lia `incidents.data.filter(...)` sem checar `success` e quebraria em tempo de execução se o serviço falhasse. |
| 13 | `types/index.ts` (`TenantId`) | O, D | O modelo de domínio era a união dos dois tenants dos mocks (`'tenant-aurora' \| 'tenant-bonsai'`). Uma empresa nova exigiria editar o domínio. |
| 14 | `authService` (`canEditTriggers`, `canCreateOrders`…) | O | Permissões como `if` espalhados; cada permissão nova exigia uma função nova e uma edição na AuthContext. |
| 15 | OrdersPage, AlertsPage, AppShell | S | O mesmo bloco de carregamento (efeito, flag `active`, erro, loading) copiado três vezes; a OrdersPage também carregava a lógica de filtragem. |

## 3. O que foi feito

### Camadas novas

```
src/
  domain/            regras de negócio puras
    anomalies/       AnomalyRule (interface), AnomalyDetector, rules/ (uma classe por regra)
    carriers/        CarrierDetector + carrierPatterns
    incidents/       NotificationPolicy + derivação e ordenação de incidentes
    orders/          validação e montagem do cadastro
    permissions.ts   matriz papel × ação
    severity.ts      ordem de gravidade (antes duplicada)
    time.ts          cálculos de tempo (antes em lib/format.ts)
  services/
    contracts.ts     IAuthService, IOrdersService, IIncidentsService, ITriggersService,
                     IWorkerStatusService, IDemoAccounts, ICarrierDetection
    response.ts      leitura do envelope pelas telas
    simulated/       backend simulado: Simulated*Service, SimulatedNetwork, ports.ts
  infrastructure/
    memory/          repositórios em memória + MockUserDirectory + InMemoryWorkerMonitor
    browser/         LocalStorageSessionStorage
    carriers/        SimulatedCarrierGateway
  composition/       container.ts (composition root) + ServicesProvider + useServices
  hooks/             useServiceQuery
```

Removidos: `services/store.ts`, `services/client.ts`, `services/authService.ts`,
`services/ordersService.ts`, `services/alertsService.ts`, `lib/anomalyRules.ts`,
`lib/carrierDetection.ts`.

### Correção de cada infração

| # | Correção |
| --- | --- |
| 1 | `SimulatedOrdersService` só orquestra. Simulação da transportadora virou `SimulatedCarrierGateway` (porta `ICarrierTrackingGateway`), datas foram para `domain/time.ts`, validação e montagem para `domain/orders/newOrder.ts`, status dos workers ganhou `SimulatedWorkerStatusService`. |
| 2 | `SimulatedAuthService` só autentica. Sessão no navegador é `LocalStorageSessionStorage` (porta `ISessionStorage`), usuários vêm de `IUserDirectory`, permissões estão em `domain/permissions.ts`. |
| 3 | Incidentes e gatilhos viraram dois serviços com dois contratos. Derivação e ordenação são funções puras em `domain/incidents/incidents.ts`; a política de notificação é `NotificationPolicy`. |
| 4 | O store global foi dividido em repositórios, um por fatia, cada um atrás da sua porta em `services/simulated/ports.ts`. A semente dos mocks é passada pelo construtor no composition root. |
| 5 | `AnomalyRule` é uma interface; cada regra é uma classe em `domain/anomalies/rules/`. O `AnomalyDetector` recebe a lista pelo construtor. Regra nova = classe nova + uma linha em `ANOMALY_RULES` no composition root. |
| 6 | Cada regra declara o próprio `triggerId`. `RULE_TO_TRIGGER` foi removido dos mocks. |
| 7 | `hoursBetween` e `calendarDaysUntil` foram para `domain/time.ts`, aceitando o instante atual como parâmetro (regras puras e testáveis). `lib/format.ts` agora depende do domínio. |
| 8 | Textos de interface foram para `components/orders/carrierFeedback.ts`. |
| 9 | `domain/severity.ts` é a única fonte. |
| 10 | Contas de demonstração chegam pelo contrato `IDemoAccounts`. |
| 11 | Telas e contextos usam `useServices()` e recebem apenas interfaces. O composition root é chamado em `main.tsx` e entregue por `ServicesProvider`. |
| 12 | `ApiResponse<T>` virou união discriminada (`ApiSuccess<T> \| ApiFailure`). O compilador obriga a checar `success` antes de ler `data`. |
| 13 | `TenantId` virou `string`. |
| 14 | Permissões são uma matriz de dados; a AuthContext resolve todas com `permissionsFor(role)`. |
| 15 | `useServiceQuery` concentra o carregamento; filtragem foi para `components/orders/orderFilters.ts`. As ações da AlertsPage compartilham uma rotina única. |

Correção extra encontrada no caminho: resolver um incidente gravava só o id, sem o tenant. A
resolução agora é registrada por tenant (`IIncidentResolutionRepository`).

## 4. Checklist

| # | Item | Situação | Evidência |
| --- | --- | --- | --- |
| 1 | Cada componente do C3 possui módulo correspondente no código? | Sim | Todo componente do C3 traz entre colchetes a pasta ou arquivo correspondente, e todos existem. |
| 2 | Domínio isolado de infraestrutura? | Sim | `domain/` importa apenas `types/` e o próprio `domain/`. Não conhece React, mocks nem `localStorage`. O `npm run arch` falha se isso mudar. |
| 3 | Relações do C4 coincidem com injeções e interfaces do código? | Sim | Cada seta do C3 corresponde a uma dependência real: telas → contratos, serviços → portas, infraestrutura implementa portas, composition root instancia tudo. O `npm run arch` verifica essas camadas a cada execução. |
| 4 | Cada classe tem uma única responsabilidade? | Sim | Serviços não fazem acesso a dados nem formatação; repositórios só guardam; regras só avaliam; textos de tela ficam na interface. |
| 5 | Sem God Classes? | Sim | O store global e os três serviços "faz-tudo" foram divididos. A maior classe nova (`SimulatedOrdersService`) só orquestra quatro casos de uso. |
| 6 | Validação, notificação e persistência delegadas? | Sim | Validação: `domain/orders/newOrder.ts`. Notificação: `NotificationPolicy`. Persistência: repositórios em `infrastructure/`. |
| 7 | Comportamento novo entra como classe nova, sem alterar código existente? | Sim | Regra de anomalia nova = classe que implementa `AnomalyRule`. Integração real com transportadora = classe que implementa `ICarrierTrackingGateway`. Backend real = classes `Http*Service` que implementam os contratos. Transportadora nova = um `CarrierPattern` a mais no registro. Em todos os casos, só o composition root recebe uma linha. |
| 8 | Mudança de requisito não exige editar as classes centrais? | Sim | Limites das regras (36 h, 2 tentativas, 1 dia) são parâmetros de construtor; permissões são dados; tenants não estão mais no tipo de domínio. |
| 9 | Nenhuma implementação lança "não implementado"? | Sim | Todas as implementações cumprem o contrato inteiro. A falha do envelope deixou de mentir para o tipo (união discriminada). |
| 10 | Interfaces coesas, sem Fat Interface? | Sim | Sete contratos de serviço e nove portas, cada um com um papel. O monitor de workers, por exemplo, tem uma porta de escrita e outra de leitura. |
| 11 | Nenhuma classe forçada a deixar métodos vazios ou retornar null sem motivo? | Sim | Nenhum método vazio. Os `null` que existem são parte do contrato ("não encontrado", "sem novidade") e estão declarados no tipo. |
| 12 | Classes de alto nível dependem de interfaces? | Sim | Serviços recebem `IOrderRepository`, `ISessionStorage`, `ICarrierTrackingGateway` etc. Telas recebem `IOrdersService`, `IAuthService` etc. Nenhuma tela importa classe concreta. |
| 13 | O ponto de entrada configura as dependências? | Sim | `main.tsx` chama `createServices()` (composition root) e entrega o resultado à árvore por `ServicesProvider`. |

Observações honestas para a defesa:

- As telas também importam funções puras do domínio (`domain/time.ts`, `domain/permissions.ts`).
  Isso é intencional: domínio é a camada mais estável e não traz detalhe de infraestrutura. O
  que as telas não podem importar (mocks, adaptadores, serviços concretos) é bloqueado pelo
  `npm run arch`.
- A união `Carrier` continua fechada em `types/`. Integrar uma transportadora nova exige
  acrescentar o nome nessa união e o formato no registro, mas nenhuma lógica muda. Foi mantida
  assim pela segurança de tipos nas telas.

## 5. Consistência com o Modelo C4

- **C2:** a Aplicação Web estava descrita como "React / Next.js", mas o projeto usa Vite.
  Corrigido para "React / Vite".
- **C3 Aplicação Web:** redesenhado com as camadas reais (Interface, Contratos, Backend
  simulado com Portas, Domínio, Infraestrutura, Composition root).
- **C4 Código:** redesenhado para `domain/anomalies`, mostrando a interface `AnomalyRule`, as
  quatro implementações e a montagem no composition root.
- **C1 e C3 API Backend:** sem alteração. O C3 do backend planejado já previa Serviços,
  Repositórios e Integrações, que são exatamente as portas que o backend simulado declara hoje.

Os fontes PlantUML continuam no README, e os SVGs em `docs/diagrams/` foram regenerados.
