# GitHub Actions Workflows

Este diretório contém as pipelines de CI/CD do monorepo, otimizadas com Nx.

## Pipelines Ativas

### 1. `nx-ci.yml` - Continuous Integration
**Trigger:** Push/PR para `develop` ou `main`

**O que faz:**
- ✅ Detecta projetos afetados usando `nx affected`
- ✅ Roda lint, test e build apenas no que mudou
- ✅ Cache inteligente do Nx (local + distribuído)
- ✅ Análise de segurança (gosec, govulncheck)
- ✅ Upload de coverage reports

**Benefícios:**
- 🚀 **10-100x mais rápido** que rodar tudo sempre
- 💰 **Economia de CI minutes** significativa
- ⚡ Feedback mais rápido em PRs

**Exemplo:**
```bash
# Se você mudar apenas go-commons:
# ✅ Testa: go-commons, auth-service (depende dele)
# ❌ NÃO testa: frontend, video-conversor (não dependem)
```

---

### 2. `nx-deploy.yml` - Deployment
**Trigger:** Push para `main`

**O que faz:**
- ✅ Detecta apps afetados usando `nx affected`
- ✅ Roda testes dos apps afetados
- ✅ Builda os apps
- ✅ Cria e faz push de imagens Docker para Docker Hub
- ✅ Versionamento automático

**Benefícios:**
- 🎯 Deploy apenas do que mudou
- 🔄 Paralelização de builds
- 📦 Multi-stage builds otimizados

**Tags criadas:**
- `latest` - Sempre a versão mais recente
- `v1.2.3` - Versão semântica
- `v1.2.3-abc1234` - Versão + commit SHA
- `main-abc1234` - Branch + SHA

---

### 3. `release-dev.yml` - Release Management
**Trigger:** Push para `develop`

**O que faz:**
- ✅ Analisa commits convencionais
- ✅ Gera CHANGELOGs automáticos
- ✅ Cria PRs de release para `main`
- ✅ Bumpa versões (SemVer)
- ✅ Suporta múltiplos pacotes/serviços

**Conventional Commits:**
```bash
feat: adiciona nova feature      → bump MINOR (0.1.0 → 0.2.0)
fix: corrige bug                 → bump PATCH (0.1.0 → 0.1.1)
feat!: breaking change           → bump MAJOR (0.1.0 → 1.0.0)
chore: atualiza deps             → não cria release
```

---

## Setup Necessário

### Secrets do GitHub

Configure em: `Settings > Secrets and variables > Actions`

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `DOCKERHUB_USERNAME` | Usuário Docker Hub | ✅ Para deploy |
| `DOCKERHUB_TOKEN` | Token Docker Hub | ✅ Para deploy |
| `GH_PAT` | Personal Access Token | ✅ Para releases |
| `NX_CLOUD_ACCESS_TOKEN` | Token Nx Cloud | ⚪ Opcional (cache) |
| `SONAR_TOKEN` | Token SonarQube | ⚪ Opcional |
| `SONAR_HOST_URL` | URL SonarQube | ⚪ Opcional |

### Nx Cloud (Opcional mas Recomendado)

Para cache distribuído entre máquinas:

1. Crie conta em https://nx.app
2. Conecte o repositório
3. Adicione `NX_CLOUD_ACCESS_TOKEN` aos secrets

**Benefícios:**
- Cache compartilhado entre desenvolvedores e CI
- Dashboard de builds
- Análise de performance

---

## Comparação: Antes vs Depois

### Antes (Pipelines Antigas)

```yaml
# ❌ Roda TUDO sempre
on:
  push:
    paths:
      - 'apps/authservice/**'  # Path errado

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: go test ./...  # Testa tudo
```

**Problemas:**
- 🐌 Lento (roda tudo sempre)
- 💸 Caro (desperdiça CI minutes)
- 🔧 Manutenção manual (adicionar cada serviço)
- 🐛 Paths errados (`authservice` vs `auth_service`)

### Depois (Pipelines Nx)

```yaml
# ✅ Roda apenas o que mudou
on:
  push:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npx nx affected --target=test  # Testa só o afetado
```

**Benefícios:**
- ⚡ Rápido (cache + affected)
- 💰 Econômico (roda menos)
- 🤖 Automático (detecta novos serviços)
- 🎯 Preciso (dependency graph)

---

## Exemplo Prático

### Cenário: Você muda `packages/go-commons/utils/logger.go`

**Antes:**
```
✅ Test auth-service     (3 min)
❌ Test video-conversor  (2 min) ← Não usa go-commons!
❌ Test frontend         (1 min) ← Não usa go-commons!
Total: 6 minutos
```

**Depois:**
```
✅ Test go-commons      (0.5 min)
✅ Test auth-service    (1 min) ← Depende de go-commons
Total: 1.5 minutos (75% mais rápido!)
```

---

## Adicionando Novos Serviços

Quando criar um novo serviço:

1. **Crie `project.json`** no serviço
   ```json
   {
     "name": "novo-servico",
     "targets": {
       "build": { ... },
       "test": { ... },
       "lint": { ... }
     }
   }
   ```

2. **Adicione ao workspace** (Go/Python/Node)

3. **Pronto!** 🎉
   - Nx detecta automaticamente
   - Pipelines funcionam sem alteração
   - Affected tracking funciona

---

## Troubleshooting

### Pipeline não rodou

**Causa:** Nenhum projeto afetado
**Solução:** Normal! Significa que suas mudanças não afetam código (ex: apenas README)

### Cache não funcionando

**Causa:** Não configurou Nx Cloud
**Solução:** Adicione `NX_CLOUD_ACCESS_TOKEN` ou use cache local

### "No Dockerfile found"

**Causa:** Serviço sem Dockerfile
**Solução:** Normal! Deploy pula serviços sem Docker

---

## Recursos

- [Nx Documentation](https://nx.dev)
- [Nx Affected](https://nx.dev/concepts/affected)
- [Release Please](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
