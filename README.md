# UNIRASTRO — Painel operacional

Frontend do UNIRASTRO, um SaaS multi-tenant de rastreamento de encomendas.

A proposta não é mostrar onde o pacote está, porque o site da transportadora já faz isso. É
perceber que algo saiu do previsto **antes** do prazo estourar, para que a empresa avise o
cliente final em vez de ser cobrada por ele.

Esta é a entrega parcial de frontend (cerca de 35% do previsto). O backend não existe ainda:
os dados vêm de mocks locais atrás de uma camada de serviços preparada para ser trocada por
chamadas HTTP.

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

### Credenciais de teste

Também aparecem na própria tela de login, com um clique para preencher.

| Papel | E-mail | Senha | Empresa |
| --- | --- | --- | --- |
| Operador de Logística | marina@aurora.com.br | operador | Aurora Comércio |
| Admin | carlos@aurora.com.br | admin | Aurora Comércio |
| Suporte | tais@aurora.com.br | suporte | Aurora Comércio |
| Operador de Logística | diego@bonsai.com.br | bonsai | Bonsai Distribuidora |

As três primeiras contas pertencem à mesma empresa e servem para comparar permissões. A
quarta é de outra empresa e serve para verificar o isolamento multi-tenant: entrar com ela
não revela nenhuma encomenda da Aurora.

### Outros comandos

```bash
npm run typecheck   # checagem de tipos
npm run build       # build de produção
npm run lint        # análise estática
```

## Arquitetura

O padrão é **Cliente-Servidor** (RNF01). O frontend não conhece regra de persistência, e o
backend não conhece tela. Nesta entrega o servidor é simulado, mas a fronteira já está no
lugar certo.

```
src/
  types/        modelo de domínio
  mocks/        dados simulados
  services/     fronteira com o backend
  lib/          regras de domínio puras
  contexts/     sessão, avisos e sincronização
  components/   layout, interface e componentes por área
  pages/        telas, agrupadas por área
```

A regra que sustenta a separação: **as páginas nunca importam de `mocks/`, só de
`services/`.** Quando o backend existir, apenas os arquivos de `services/` trocam o mock por
`fetch`, e nenhuma tela muda.

Os serviços devolvem sempre o mesmo envelope, `{ success, message, errors, data }`, que é o
formato da API do outro projeto da disciplina. Manter a simetria significa que a troca não
mexe em como as telas leem a resposta.

Duas decisões que valem explicação:

**Latência artificial.** Todo serviço espera de 300 a 600 ms antes de responder. Uma tela que
nunca espera esconde exatamente os defeitos que aparecem quando o backend entra. O RNF03 fala
em consistência eventual, então esperar é o comportamento normal, não a exceção.

**Incidentes derivados, não armazenados.** A central de alertas não lê uma tabela de
incidentes. Ela aplica as regras de anomalia sobre as encomendas a cada consulta. Uma lista
gravada envelheceria em silêncio, e um pacote que voltasse a se mover continuaria aparecendo
como parado. O que persiste é só a decisão humana: quais incidentes o operador resolveu.

## Requisitos cobertos

| Requisito | Onde está |
| --- | --- |
| RF01 Cadastro de pedidos | `lib/carrierDetection.ts`, modal de cadastro |
| RF02 Consulta automática de status | `services/ordersService.ts`, botão de atualizar na gaveta |
| RF03 Histórico unificado | `components/orders/Timeline.tsx` |
| RF04 Detecção de anomalias | `lib/anomalyRules.ts` |
| RF05 Gatilhos de notificação | `components/alerts/TriggerPanel.tsx` |
| RF06 Painel de alertas | `pages/alerts/AlertsPage.tsx` |
| RF10 Multi-tenant e permissões | `contexts/AuthContext.tsx`, `services/authService.ts` |

### RF01 — identificação automática da transportadora

O usuário cola o código e a transportadora aparece enquanto ele digita, sem lista para
escolher. Quem cadastra cinquenta códigos por dia não quer selecionar a transportadora
cinquenta vezes, e o código já carrega essa informação.

| Transportadora | Formato |
| --- | --- |
| Correios | duas letras, nove dígitos, duas letras |
| Jadlog | catorze dígitos |
| Loggi | prefixo LG e dez dígitos |
| Total Express | prefixo TE e doze dígitos |

São aproximações didáticas. Formatos reais mudam e se sobrepõem entre operadores. Em produção
o palpite serviria apenas para escolher qual API consultar primeiro, e a confirmação viria da
resposta da própria transportadora.

### RF04 — as quatro regras de anomalia

É o núcleo do produto e o trecho de código mais interessante para revisar.

| Regra | Dispara quando | Severidade |
| --- | --- | --- |
| Parada prolongada | último evento há mais de 36h no mesmo local | crítico ou atenção, conforme o prazo |
| Tentativa frustrada | duas ou mais tentativas sem sucesso | crítico |
| Rota desviada | evento registrado fora da rota planejada | crítico ou atenção, conforme o prazo |
| Risco de atraso preditivo | prazo termina hoje ou amanhã e o pacote não saiu para entrega | crítico |

A quarta é a mais valiosa, porque dispara enquanto ainda dá tempo de agir, mesmo quando nada
até ali parece errado.

O limite de 36 horas é o mesmo número que aparece no gatilho "Parada prolongada" na tela de
alertas. O que o operador parametriza e o que a regra aplica precisam ser a mesma coisa.

### RF05 e RF06 — como se encaixam

O estado de cada gatilho decide se um incidente daquele tipo aparece como notificado ao
cliente final. Desligar "Rota desviada" faz os desvios passarem a aparecer sem a marca de
aviso enviado. É a parametrização do operador produzindo efeito visível na central.

### RF10 — permissões

| Ação | Admin | Operador | Suporte |
| --- | --- | --- | --- |
| Cadastrar encomenda | sim | sim | não |
| Alterar gatilhos | sim | sim | não |
| Resolver incidentes | sim | sim | sim |

Suporte enxerga a configuração de gatilhos, mas não a altera. Mudar um gatilho muda o que
milhares de clientes finais recebem, e isso é decisão de quem responde pela operação.

## Dados simulados

Os dados são ancorados no momento em que a aplicação carrega, nunca em datas fixas. A
encomenda parada continua parada há 52 horas em qualquer dia que o projeto for apresentado, e
as regras disparam de verdade em vez de ler um campo pronto.

Recarregar a página devolve tudo ao estado inicial. Para uma entrega de frontend isso é
aceitável, e até conveniente numa apresentação.

Os casos foram escolhidos de propósito: uma parada longa, duas tentativas frustradas, um
desvio de rota, entregas normais e uma recém postada. Sem essa variedade a central de
incidentes apareceria vazia.

## Design

O visual segue o protótipo feito no Claude Design, preservado em `design/` para consulta.

Os valores de cor, tipografia e espaçamento estão em `src/styles/tokens.css`. Vale um aviso
sobre um detalhe fácil de estragar: **nada tem cantos arredondados**, exceto as etiquetas de
contagem, os interruptores de gatilho e os pontos indicadores. É a assinatura do design e não
deve ser suavizado.

As fontes são Sora para títulos, IBM Plex Sans para corpo e IBM Plex Mono para códigos de
rastreio e números.

O protótipo é HTML de mockup, não código de produção. A estrutura interna dele não foi
copiada, só o resultado visual. Onde valeu a pena divergir, divergiu: a listagem de
encomendas é uma tabela de verdade, e não uma grade de divisões, porque um leitor de tela
precisa da relação entre cabeçalho e célula para anunciar "Status: Parado" em vez de ler seis
valores soltos.

## O que ficou de fora

Registrado aqui porque delimitar o escopo faz parte da entrega.

- **Tela de Desempenho por transportadora** (RF07 e RF09). Já está desenhada no protótipo,
  com gráficos comparativos, filtros por período e região, e exportação. Aparece desabilitada
  na navegação, marcada como próxima entrega.
- **Integração real com APIs de transportadoras.**
- **Backend, banco de dados, fila de mensagens e cache** (o que os RNF02, RNF03 e RNF04
  descrevem).
- **Testes automatizados.**
