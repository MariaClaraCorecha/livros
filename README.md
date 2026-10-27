# Leitura

Leitor de **PDF** e **EPUB** feito com Angular 22 + Angular Material (M3). Tem destaques em 12 cores, comentários com texto, emojis e áudio, marcadores de página coloridos, **bibliotecas personalizadas** (estantes por categoria), login com Google e perfil personalizável.

No EPUB você escolhe entre 10 fontes de leitura (Literata, Merriweather, Lora, Lexend, Atkinson Hyperlegible…), o espaçamento entre linhas e a animação ao virar a página (deslizar, esmaecer ou nenhuma). Também dá para virar a página tocando nas laterais ou deslizando o dedo.

## Como rodar

```bash
npm install
npm start          # http://localhost:4200
npm run build      # build de produção em dist/leitor
```

## Login com Google

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie uma credencial **OAuth Client ID** do tipo *Aplicativo da Web*.
2. Em **Origens JavaScript autorizadas**, adicione `http://localhost:4200` e o domínio de produção.
3. Coloque o Client ID em `src/environments/environment.ts` e em `environment.development.ts` (`googleClientId`).

Em desenvolvimento, `allowGuest: true` mostra o botão **Entrar como convidado**.

> O ID token do Google é decodificado no navegador para obter nome, e-mail e foto. Se no futuro houver um backend, ele deve **validar** esse token.

## Arquitetura

```
src/app
├── core/
│   ├── domain/            # Regras puras: modelos, contratos (repositórios e portas)
│   ├── application/       # Casos de uso e estado (signals): auth, biblioteca, perfil, sessão de leitura
│   ├── infrastructure/    # Adaptadores: IndexedDB, Google Identity, PDF.js, epub.js
│   ├── provide-core.ts    # Composition root: liga contratos às implementações
│   └── guards.ts
├── shared/                # UI reutilizável (cores, emojis, gravador/player de áudio, avatar) e utilitários
├── layout/                # Shell com barra superior (desktop) e navegação inferior (celular)
└── features/              # Cada feature é um módulo com rotas carregadas sob demanda
    ├── auth/              # Login
    ├── library/           # Estante, importação (botão ou arrastar e soltar), busca e filtros
    ├── reader/            # Leitor, barra de seleção, painel de anotações e diálogo de comentários
    └── profile/           # Perfil, paleta, modo claro/escuro, moldura do avatar e preferências de leitura
```

- **Dependências apontam para dentro**: `features` → `application` → `domain`. A infraestrutura só implementa os contratos do domínio (`BookRepository`, `AuthProvider`, `ReaderEngineFactory`…), então trocar o IndexedDB por uma API, por exemplo, mexe só em `provide-core.ts`.
- **Motores de leitura**: `ReaderEngine` é uma interface comum. `PdfReaderEngine` (rolagem contínua, renderização sob demanda, camada de texto, zoom) e `EpubReaderEngine` (paginado, temas e fonte) são carregados apenas quando um livro é aberto.
- **Persistência local**: livros, destaques, marcadores, áudios (`Blob`) e perfis ficam no IndexedDB, separados por usuário.
- **Temas**: as 5 paletas (Sálvia, Oceano, Lavanda, Rosé e Âmbar) foram geradas com `ng generate @angular/material:theme-color` em `src/styles/palettes` e são trocadas por classe no `<html>`.
