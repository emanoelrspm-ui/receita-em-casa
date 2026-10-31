# Receita em Casa 🍲

Aplicação web que transforma ingredientes disponíveis em três sugestões de receitas, com imagens geradas por IA.

## Stack

- React + TypeScript + Vite
- Cloudflare Workers (API e hospedagem de assets)
- Cloudflare Workers AI (texto + imagens)
- Wrangler para desenvolvimento e deploy

## Pré-requisitos

- Node.js 20.19+ ou 22.12+
- npm
- Conta Cloudflare com Workers AI habilitado
- Wrangler autenticado (`npx wrangler login`)

## Executar localmente

```bash
npm install
npm run dev
```

O frontend abre em `http://localhost:5173`. Para testar a API e o binding de IA localmente:

```bash
npm run build
npx wrangler dev
```

A interface usa `/api/recipes`; o Worker chama o modelo de texto e gera três imagens individuais. O uso local de Workers AI pode exigir autenticação e configuração de conta.

## Publicar na Cloudflare

1. Faça login: `npx wrangler login`.
2. Confira o nome do Worker em `wrangler.jsonc`.
3. Gere os tipos, se desejar: `npm run cf-typegen`.
4. Publique: `npm run deploy`.

O Worker serve os arquivos estáticos de `dist` e roteia `/api/*` para o backend. O binding `AI` é configurado no `wrangler.jsonc`; não coloque tokens no frontend.

## Modelos

- Texto: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (JSON Mode).
- Imagem: `@cf/black-forest-labs/flux-1-schnell`.

Confira disponibilidade, limites e preços atuais na documentação da Cloudflare antes de colocar em produção. A franquia gratuita pode mudar e a geração de três imagens consome mais recursos que gerar apenas texto.

## Estrutura

```text
receita-em-casa/
├── src/
│   ├── App.tsx
│   ├── api.ts
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── worker/
│   └── index.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc
```

## Próximas melhorias antes de produção

- Adicionar rate limiting por IP e proteção contra abuso.
- Adicionar validação mais rigorosa do JSON retornado pela IA.
- Persistir favoritos e histórico (Cloudflare D1).
- Implementar consentimento e política de privacidade.
- Considerar gerar as imagens sob demanda se os limites de uso forem atingidos.
- Incluir avisos de alergênicos e segurança alimentar.

## Observação

A IA pode errar quantidades, tempos ou instruções. Revise as receitas antes de cozinhar, especialmente temperaturas internas e segurança de carnes, ovos e alimentos perecíveis.