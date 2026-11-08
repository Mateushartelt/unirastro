# Qualidade: código limpo, plano de testes e Sonar

Entrega da aula de Projeto e Arquitetura de Software sobre qualidade. Vale para os dois
repositórios: este (Aplicação Web) e `unirastro-api` (API).

## 1. Código limpo

| Pergunta | Situação | O que foi feito |
|---|---|---|
| Quantas linhas tem cada método? | Funções de lógica com até 30 linhas; componentes React com até ~60 linhas (antes chegavam a 126). | `OrdersPage`, `AlertsPage`, `LoginPage`, `OrderDrawer`, `OrderTable` e `NewOrderModal` foram divididos em subcomponentes e hooks (`useSelectedOrder`, `useOrderActions`, `useAlertActions`, `useLoginForm`). Na API, `createBackend`, `createApp` e `SimulatedCarrierGateway.fetchUpdate` foram quebrados em funções menores. |
| E as classes? | A maior classe de lógica (`OrdersService`, na API) tem cerca de 140 linhas e uma responsabilidade: orquestrar o caso de uso. | O único arquivo acima de 200 linhas é `seed/orders.ts` / `mocks/orders.ts`, que é dado de demonstração e não tem lógica. |
| O SOLID está aplicado? | Sim. Veja `docs/solid-refatoracao.md`. | A troca do repositório em memória pelo SQLite exigiu só uma classe nova e uma linha no composition root, sem tocar no `OrdersService` (OCP + DIP na prática). |
| Variáveis padronizadas? | Nomes de código em inglês e camelCase, tipos em PascalCase, constantes em UPPER_SNAKE_CASE; textos de tela em português. | Removidos os aliases `TenantId` e `AnomalyRuleName`, que eram só outro nome para `string` (regra do Sonar). |
| Sem código comentado? | Nenhum trecho de código comentado nos dois repositórios. | Os comentários que restam explicam o porquê de uma decisão. |
| Exceções tratadas? | Sim. | API: middleware de erro devolve envelope 400 (JSON inválido) ou 500 sem stack trace. Front: `HttpClient` e o armazenamento local tratam falha de rede e `localStorage` indisponível. Falhas de negócio usam `Result`/`ApiResponse` em vez de exceção. |

## 2. Plano de testes (API)

Os testes ficam em `unirastro-api/test` e usam o `node:test`, sem dependência extra.

### Testes unitários das regras de negócio (`test/businessRules.test.ts`)

| # | Regra de negócio | O que o teste garante |
|---|---|---|
| 1 | RF01: identificação da transportadora | Cada formato de código cai na transportadora certa, com normalização de espaços e maiúsculas; código desconhecido devolve `null`. |
| 2 | RF01: validação do cadastro | Recusa código não reconhecido, destinatário vazio e código duplicado na mesma empresa. |
| 3 | RF04: parada prolongada | Mais de 36h sem movimento gera anomalia; vira "Crítico" com prazo em até 1 dia; encomenda entregue nunca dispara. |
| 4 | RF04: tentativas frustradas | Uma tentativa não dispara; a segunda dispara como "Crítico". |
| 5 | RF04: desvio de rota | Parada fora do plano de rota gera anomalia; rota seguida não gera. |
| 6 | RF04: risco preditivo de atraso | Prazo para amanhã sem ter saído para entrega é "Crítico"; se já saiu, não dispara. |
| 7 | RF04: ordenação | O detector devolve as anomalias da mais grave para a menos grave. |
| 8 | RF05: gatilhos | O cliente final só é avisado quando o gatilho da regra está ligado. |
| 9 | RF10: permissões | Suporte resolve incidentes, mas não cadastra encomendas nem altera gatilhos. |

As regras recebem o instante atual por parâmetro, então os testes usam um relógio fixo e dão o
mesmo resultado a qualquer hora em que rodarem.

### Teste de integração com o banco (`test/sqliteOrderRepository.test.ts`)

As encomendas passaram a ser gravadas em SQLite (`SqliteOrderRepository`, módulo nativo
`node:sqlite`). Cada teste usa um arquivo de banco novo numa pasta temporária.

| # | Cenário | Como prova a persistência |
|---|---|---|
| 1 | Gravar e reler | Grava, fecha a conexão, abre outra no mesmo arquivo e encontra a encomenda idêntica. |
| 2 | Atualizar | Status e linha do tempo alterados continuam alterados depois de reabrir. |
| 3 | Isolamento por empresa | A listagem só traz a empresa pedida, com os cadastros mais novos primeiro. |
| 4 | Unicidade | O banco recusa o mesmo código duas vezes na mesma empresa (`UNIQUE`). |
| 5 | Ponta a ponta | Cadastra pela API HTTP, derruba o servidor, sobe outro sobre o mesmo arquivo e busca a encomenda pela API. |

Os testes que já existiam continuam valendo: integração HTTP (`test/api.test.ts`) e o
`OrdersService` com dublês (`test/ordersService.test.ts`).

### Como rodar

```bash
cd ../unirastro-api
npm test                  # todos
npm run test:unit         # só regras de negócio
npm run test:integration  # SQLite + HTTP
```

Resultado: **34 testes, 34 passando, 0 falhas.** O log completo está em
`docs/evidencias/testes-api.log`.

## 3. Sonar

A varredura usou as regras do SonarJS, o mesmo motor de análise do SonarLint para
JavaScript/TypeScript. Antes da limpeza havia 12 apontamentos na API e 59 no front.

| Regra do Sonar | Onde | Correção |
|---|---|---|
| Ternário aninhado (`no-nested-conditional`) | Regras de anomalia, `Timeline`, `IncidentCard`, páginas | Extraído para funções com `if` (`describeDeadline`, `deadlineWarning`, `dotColor`, `IncidentAction`) e para o componente `AsyncContent`. |
| Props mutáveis (`prefer-read-only-props`) | 25 componentes | Props tipadas como `Readonly<...>`. |
| API depreciada (`deprecation`) | `FormEvent` do React | Trocado por `SubmitEvent`. |
| Variável não usada (`no-unused-vars`) | `_password` em `AuthService` | Sessão montada campo a campo, sem desestruturar a senha. |
| Alias redundante (`redundant-type-aliases`) | `TenantId`, `AnomalyRuleName` | Substituídos por `string`. |
| Gerador pseudoaleatório (`pseudo-random`) | Latência simulada | Trocado `Math.random` por `crypto.getRandomValues`. |

Resultado: **0 apontamentos do Sonar nos dois repositórios.** O print do painel do SonarLint
na IDE é a evidência pedida na atividade.

### Bug encontrado no caminho

Ao testar a tela depois da refatoração, o modal "Cadastrar pedido" reabria com os dados do
cadastro anterior, porque só o botão Cancelar limpava os campos. Agora o modal é recriado a
cada abertura (`key` no `OrdersPage`).
