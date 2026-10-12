# Preditor de Redes

Aplicativo mobile em desenvolvimento acadêmico, voltado ao monitoramento de redes e à identificação de possíveis sinais de degradação ou indisponibilidade por meio de medições ICMP.

O projeto integra conhecimentos de desenvolvimento mobile, redes de computadores e análise e projeto de sistemas, com o objetivo de construir uma aplicação organizada, documentada e preparada para evoluir ao longo das etapas de desenvolvimento.

> **Status:** Em desenvolvimento.

## Objetivos do projeto

- Apresentar informações relacionadas ao monitoramento de hosts na rede.
- Trabalhar com medições ICMP para identificar possíveis sinais de degradação ou indisponibilidade.
- Organizar e apresentar informações de monitoramento por meio de uma interface mobile.
- Evoluir a aplicação de forma incremental, seguindo a documentação e os requisitos definidos para o projeto.

## Tecnologias

- **React Native:** desenvolvimento da interface mobile.
- **Expo:** ferramentas e ambiente de desenvolvimento da aplicação.
- **TypeScript:** tipagem estática e organização do código.
- **Expo Router:** estruturação das rotas e navegação entre telas.
- **Git e GitHub:** versionamento do código e colaboração entre os integrantes da equipe.

## Estrutura atual do projeto

```text
PreditorDeRedes/
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── hosts.tsx
│   │   └── historico.tsx
│   ├── components/
│   │   ├── test/
│   │   │   └── TextComponent.tsx
│   │   ├── hostCard.tsx
│   │   ├── metricCard.tsx
│   │   └── statusBadge.tsx
│   ├── screens/
│   │   └── VisaoGeral.tsx
│   └── global.css
├── assets/
├── scripts/
├── app.json
├── package.json
└── README.md
```

### Organização do código

- **`src/app/`**: contém os arquivos de rota reconhecidos pelo Expo Router.
- **`src/app/_layout.tsx`**: configura a estrutura compartilhada de navegação.
- **`src/app/index.tsx`**: representa a rota inicial do aplicativo.
- **`src/screens/`**: destinada às telas completas da aplicação, como a Visão Geral.
- **`src/components/`**: destinada aos componentes visuais reutilizáveis.
- **`assets/`**: reúne recursos estáticos utilizados pela aplicação.

A estrutura representa o estágio inicial de organização do código. A implementação e a integração dos componentes e das telas serão evoluídas ao longo do desenvolvimento.

## Configuração do ambiente

### Pré-requisitos

- Node.js em uma versão compatível com a versão do Expo utilizada pelo projeto.
- npm, instalado junto com o Node.js.
- Git.
- Um editor de código, como o Visual Studio Code.

### Instalação

Clone o repositório e entre na pasta do projeto:

```bash
git clone https://github.com/PedroNov4es/PreditorDeRedes
cd PreditorDeRedes
```

Instale as dependências:

```bash
npm install
```

### Execução

Inicie o servidor de desenvolvimento do Expo:

```bash
npx expo start
```

Siga as instruções exibidas no terminal para abrir o aplicativo no ambiente de execução disponível.

## Funcionalidades planejadas

As funcionalidades serão implementadas de forma incremental, conforme os requisitos e o planejamento do projeto.

- [ ] Estruturar e evoluir a tela de Visão Geral.
- [ ] Desenvolver a apresentação dos hosts monitorados.
- [ ] Implementar a exibição de métricas e indicadores de estado.
- [ ] Desenvolver a consulta ao histórico de medições.
- [ ] Integrar a aplicação mobile à API do projeto.
- [ ] Apresentar informações de monitoramento e possíveis sinais de degradação da rede.

A lista representa objetivos de desenvolvimento, não funcionalidades já concluídas.

## Documentação

A documentação técnica e acadêmica do projeto orienta o planejamento, as decisões de arquitetura e a evolução da aplicação. Os documentos devem ser consultados pela equipe durante o desenvolvimento e atualizados conforme as decisões e entregas forem consolidadas.

## Colaboração

O projeto utiliza Git e GitHub para o controle de versão e a colaboração entre os integrantes da equipe.

Antes de contribuir:

1. Atualize sua cópia local do repositório.
2. Confira a branch em que está trabalhando.
3. Faça alterações relacionadas à tarefa atribuída.
4. Revise as modificações antes de registrá-las.
5. Utilize commits com mensagens claras.
6. Compartilhe as alterações com a equipe por meio do fluxo de versionamento adotado pelo projeto.

## Status do desenvolvimento

O projeto encontra-se na fase inicial de estruturação do aplicativo mobile. A organização das pastas, das rotas e dos componentes constitui a base para as próximas etapas de implementação.

Este README será atualizado à medida que novas funcionalidades forem desenvolvidas, testadas e integradas ao projeto.