# Auth Service

Microserviço de autenticação OIDC para o projeto Short-Stream. Gerencia o fluxo de autenticação com provedores OIDC (como Keycloak), entrega tokens JWT via cookies HTTP-only e gerencia sessões com Redis.

## Funcionalidades

- ✅ Fluxo completo de autenticação OIDC (Authorization Code Flow)
- ✅ Integração com Keycloak
- ✅ Entrega de tokens (access token e ID token) via cookies HTTP-only
- ✅ Gerenciamento de sessões com Redis
- ✅ Refresh de tokens automático
- ✅ Logout com limpeza de sessão
- ✅ Logging estruturado com detecção automática de terminal (JSON ou pretty logs)
- ✅ Health checks para Kubernetes
- ✅ CORS configurável

## Arquitetura

O projeto segue boas práticas de Go e princípios SOLID:

```
authservice/
├── cmd/                    # Entry point da aplicação
│   └── main.go
├── internal/               # Código interno da aplicação
│   ├── bootstrap/          # Inicialização da aplicação
│   ├── config/             # Configuração (App, OIDC, Redis)
│   ├── handlers/           # HTTP handlers
│   ├── middleware/         # Middlewares (CORS, Logger, Recovery)
│   ├── oidc/              # Cliente OIDC
│   └── storage/           # Storage (interface + implementação Redis)
├── pkg/                   # Código reutilizável
│   └── logger/           # Logger com injeção de dependência
└── development/          # Configurações de desenvolvimento
    └── k8s/             # Manifests Kubernetes
```

### Padrões de Design

- **Dependency Injection**: Logger e dependências injetadas via construtores
- **Interface Segregation**: Storage definido como interface, implementação Redis injetável
- **Builder Pattern**: Configuração carregada via ConfigBuilder
- **Bootstrap Pattern**: Inicialização centralizada no package bootstrap

## Pré-requisitos

- Go 1.24.7+
- Redis
- Keycloak (ou outro provedor OIDC)

## Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
# Server
PORT=8080

# OIDC Provider
OIDC_PROVIDER_URL=https://oauth.alvescloud.net/realms/short-stream
OIDC_CLIENT_ID=authservice
OIDC_CLIENT_SECRET=seu-client-secret
OIDC_REDIRECT_URL=http://localhost:8080/auth/callback

# Frontend
FRONTEND_URL=http://localhost:3000

# Cookies
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=Lax

# Session
SESSION_MAX_AGE=3600

# Redis
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Configurar Keycloak

1. Crie o realm `short-stream`
2. Crie o client `authservice` com:
   - Client authentication: ON
   - Standard flow: ON
   - Valid redirect URIs: `http://localhost:8080/auth/callback`
   - Web origins: `http://localhost:3000`
3. Copie o Client Secret para o `.env`

## Desenvolvimento

### Executar localmente

```bash
# Instalar dependências
go mod download

# Executar
go run cmd/main.go
```

### Build

```bash
go build -o build/authservice ./cmd
```

### Executar com Docker

```bash
docker build -t authservice:latest .
docker run -p 8080:8080 --env-file .env authservice:latest
```

## Endpoints

### Autenticação

- `GET /auth/login` - Inicia o fluxo de autenticação OIDC
- `GET /auth/callback` - Callback do OIDC (recebe o authorization code)
- `POST /auth/refresh` - Renova o access token usando refresh token
- `POST /auth/logout` - Faz logout e limpa cookies/sessão

### Utilidade

- `GET /health` - Health check (retorna `{"status":"ok"}`)

## Fluxo de Autenticação

1. Frontend redireciona para `/auth/login`
2. Serviço redireciona para o provedor OIDC (Keycloak)
3. Usuário faz login no Keycloak
4. Keycloak redireciona para `/auth/callback?code=...&state=...`
5. Serviço:
   - Valida o state (CSRF protection)
   - Troca o code por tokens (access + refresh + ID)
   - Cria sessão no Redis com o refresh token
   - Seta cookies HTTP-only com os tokens
   - Redireciona para o frontend
6. Frontend usa os cookies automaticamente nas requisições

## Logging

O logger detecta automaticamente se está rodando em terminal:

- **Terminal**: Logs coloridos e formatados (pretty)
- **Produção/Docker**: Logs em formato JSON estruturado

Exemplo de log:
```json
{
  "time":"12:03:11",
  "level":"info",
  "caller":"logger/logger.go:58",
  "method":"GET",
  "path":"/health",
  "status":200,
  "duration":0.884125,
  "message":"HTTP request"
}
```

## Deploy

### Kubernetes

Os manifests estão em `development/k8s/`:

```bash
# Criar namespace
kubectl apply -f development/k8s/namespace.yaml

# Criar ConfigMap e Secret
kubectl apply -f development/k8s/configmap.yaml
kubectl apply -f development/k8s/secret.yaml

# Deploy da aplicação
kubectl apply -f development/k8s/deployment.yaml
```

### Tilt (Desenvolvimento)

```bash
tilt up
```

## Tecnologias

- **Gin** - Framework HTTP
- **coreos/go-oidc** - Cliente OIDC
- **redis/go-redis** - Cliente Redis
- **phuslu/log** - Logging estruturado
- **godotenv** - Carregamento de .env

## Segurança

- ✅ Cookies HTTP-only (não acessíveis via JavaScript)
- ✅ CSRF protection via state validation
- ✅ Tokens armazenados apenas em cookies seguros
- ✅ Refresh tokens armazenados no Redis (nunca no frontend)
- ✅ CORS configurável
- ✅ Client Secret nunca exposto ao frontend

## Licença

MIT
