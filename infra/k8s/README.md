# Kubernetes Infrastructure - Short Stream

Configuração completa da infraestrutura Kubernetes para o projeto Short Stream usando Kustomize.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura](#estrutura)
- [Componentes](#componentes)
- [Pré-requisitos](#pré-requisitos)
- [Deploy](#deploy)
- [Ambientes](#ambientes)
- [Gestão de Secrets](#gestão-de-secrets)
- [Monitoramento](#monitoramento)
- [Comandos Úteis](#comandos-úteis)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

Esta infraestrutura gerencia **14 serviços** distribuídos em **2 namespaces**:

- **`infrastructure`**: Serviços de infraestrutura (Postgres, Redis, RabbitMQ, MinIO)
- **`short-stream`**: Aplicações do projeto (11 microserviços)

**Tecnologias:**
- Kubernetes 1.28+
- Kustomize para gerenciamento de configurações
- 3 linguagens: Go, Python, Node.js

---

## Estrutura

```
infra/k8s/
├── base/                          # Configuração base (comum a todos ambientes)
│   ├── namespaces/
│   │   ├── infrastructure-namespace.yaml
│   │   └── apps-namespace.yaml
│   ├── configmaps/
│   │   └── app-config.yaml        # URLs de conexão
│   ├── secrets/
│   │   ├── postgres-secret.yaml
│   │   ├── rabbitmq-secret.yaml
│   │   ├── minio-secret.yaml
│   │   └── app-secret.yaml        # JWT secret
│   ├── deployments/               # 17 deployments
│   │   ├── postgres.yaml
│   │   ├── rabbitmq.yaml
│   │   ├── minio.yaml
│   │   ├── auth-service.yaml
│   │   └── ...
│   ├── services/                  # Services correspondentes
│   │   └── ...
│   └── kustomization.yaml         # Base kustomization
└── overlays/
    ├── dev/
    │   └── kustomization.yaml     # Configurações de desenvolvimento
    ├── staging/                   # TODO
    └── prod/                      # TODO
```

---

## Componentes

### Infraestrutura (Namespace: `infrastructure`)

| Serviço | Imagem | Portas | Função |
|---------|--------|--------|--------|
| **Postgres** | `postgres:16-alpine` | 5432 | Banco de dados relacional |
| **Redis** | `redis:7-alpine` | 6379 | Cache e sessões |
| **RabbitMQ** | `rabbitmq:3-management-alpine` | 5672, 15672 | Message broker |
| **MinIO** | `minio/minio:latest` | 9000, 9001 | Object storage (S3-compatible) |

### Aplicações Go (Namespace: `short-stream`)

| Serviço | Réplicas Base | Recursos | Função |
|---------|---------------|----------|--------|
| **auth-service** | 2 | 256Mi/500m | Autenticação e autorização |
| **notification-service** | 2 | 256Mi/500m | Envio de notificações |
| **video-conversor** | 2 | 1Gi/1000m | Conversão de vídeos |
| **video-metadata-service** | 2 | 512Mi/500m | Metadados de vídeos |
| **video-uploader** | 2 | 512Mi/500m | Upload de vídeos |

### Aplicações Python (Namespace: `short-stream`)

| Serviço | Réplicas Base | Recursos | Função |
|---------|---------------|----------|--------|
| **video-auto-legend** | 2 | 2Gi/1000m | Geração automática de legendas |
| **video-schene-analyzer** | 2 | 2Gi/1000m | Análise de cenas |
| **moderation-service** | 2 | 2Gi/1000m | Moderação de conteúdo |

### Aplicações Node.js (Namespace: `short-stream`)

| Serviço | Réplicas Base | Recursos | Função |
|---------|---------------|----------|--------|
| **gateway** | 3 | 512Mi/500m | API Gateway (GraphQL) |
| **video-feed-provider** | 3 | 512Mi/500m | Feed de vídeos |
| **frontend** | 3 | 512Mi/500m | Interface web (Next.js) |

---

## Pré-requisitos

### Ferramentas Necessárias

```bash
# kubectl
kubectl version --client

# kustomize (já integrado no kubectl 1.14+)
kubectl kustomize --help

# Cluster Kubernetes (escolha um)
# - minikube
# - kind
# - k3s
# - EKS/GKE/AKS
```

### Configurar kubectl

```bash
# Verificar contexto atual
kubectl config current-context

# Listar contextos disponíveis
kubectl config get-contexts

# Trocar contexto
kubectl config use-context <context-name>
```

---

## Deploy

### 1. Deploy Base (Todos os Serviços)

```bash
# Visualizar o que será aplicado
kubectl kustomize infra/k8s/base

# Aplicar configuração base
kubectl apply -k infra/k8s/base

# Verificar recursos criados
kubectl get all -n infrastructure
kubectl get all -n short-stream
```

### 2. Deploy Ambiente Específico

#### Desenvolvimento (Dev)

```bash
# Aplicar overlay de dev
kubectl apply -k infra/k8s/overlays/dev

# Verificar
kubectl get deployments -n short-stream -l environment=dev
```

#### Staging (TODO)

```bash
kubectl apply -k infra/k8s/overlays/staging
```

#### Produção (TODO)

```bash
kubectl apply -k infra/k8s/overlays/prod
```

### 3. Verificar Deploy

```bash
# Status dos pods
kubectl get pods -n infrastructure
kubectl get pods -n short-stream

# Logs de um serviço específico
kubectl logs -n short-stream deployment/auth-service -f

# Descrever um pod com problemas
kubectl describe pod -n short-stream <pod-name>
```

---

## Ambientes

### Dev (Desenvolvimento)

**Características:**
- 1 réplica por serviço
- Tag: `dev-latest`
- Prefix: `dev-`
- Debug habilitado
- Log level: `debug`

**Uso:**
```bash
kubectl apply -k infra/k8s/overlays/dev
```

### Staging (TODO)

**Características:**
- 2 réplicas por serviço
- Tag: `staging-<version>`
- Recursos intermediários
- Log level: `info`

### Prod (TODO)

**Características:**
- 3-5 réplicas por serviço (com HPA)
- Tag: `v<version>`
- Recursos completos
- Backups automáticos
- Log level: `warning`

---

## Gestão de Secrets

### ⚠️ IMPORTANTE

Os secrets atualmente estão em **base64** simples. Para produção, use:
- **Sealed Secrets**
- **External Secrets Operator**
- **HashiCorp Vault**
- **AWS Secrets Manager / Azure Key Vault / GCP Secret Manager**

### Secrets Atuais

| Secret | Namespace | Valores |
|--------|-----------|---------|
| `postgres-secret` | infrastructure | username, password |
| `rabbitmq-secret` | infrastructure | username, password |
| `minio-secret` | infrastructure | root-user, root-password |
| `app-secret` | short-stream | jwt-secret |

### Como Atualizar Secrets

```bash
# Criar secret a partir de arquivo
kubectl create secret generic my-secret \
  --from-file=key=./secret-file \
  -n short-stream

# Criar secret a partir de literal
kubectl create secret generic my-secret \
  --from-literal=username=admin \
  --from-literal=password=secret123 \
  -n short-stream

# Editar secret existente
kubectl edit secret postgres-secret -n infrastructure

# Deletar e recriar
kubectl delete secret postgres-secret -n infrastructure
kubectl apply -f infra/k8s/base/secrets/postgres-secret.yaml
```

---

## Monitoramento

### Health Checks

Todos os serviços têm:
- **Liveness Probe**: Verifica se o pod está vivo
- **Readiness Probe**: Verifica se o pod está pronto para receber tráfego

### Endpoints de Saúde

| Serviço | Endpoint |
|---------|----------|
| Go Services | `/health`, `/ready` |
| Python Services | `/health` |
| Node Services | `/health` |

### Verificar Saúde dos Pods

```bash
# Ver status detalhado
kubectl get pods -n short-stream -o wide

# Ver eventos
kubectl get events -n short-stream --sort-by='.lastTimestamp'

# Ver métricas (requer metrics-server)
kubectl top pods -n short-stream
kubectl top nodes
```

---

## Comandos Úteis

### Gerenciamento de Pods

```bash
# Listar pods
kubectl get pods -n short-stream

# Ver logs
kubectl logs -n short-stream <pod-name>
kubectl logs -n short-stream <pod-name> -c <container-name>
kubectl logs -n short-stream <pod-name> --previous  # logs do container anterior

# Seguir logs em tempo real
kubectl logs -n short-stream deployment/auth-service -f

# Executar comando no pod
kubectl exec -n short-stream <pod-name> -it -- /bin/sh
kubectl exec -n short-stream <pod-name> -- env

# Port forward para debug local
kubectl port-forward -n short-stream service/auth-service 8000:8000
```

### Gerenciamento de Deployments

```bash
# Escalar deployment
kubectl scale -n short-stream deployment/auth-service --replicas=5

# Restart deployment (recreate pods)
kubectl rollout restart -n short-stream deployment/auth-service

# Ver histórico de rollout
kubectl rollout history -n short-stream deployment/auth-service

# Rollback para versão anterior
kubectl rollout undo -n short-stream deployment/auth-service

# Status do rollout
kubectl rollout status -n short-stream deployment/auth-service
```

### Gerenciamento de Services

```bash
# Listar services
kubectl get services -n short-stream

# Descrever service
kubectl describe service -n short-stream auth-service

# Ver endpoints
kubectl get endpoints -n short-stream
```

### ConfigMaps e Secrets

```bash
# Ver configmap
kubectl get configmap -n short-stream app-config -o yaml

# Ver secrets (decodificado)
kubectl get secret -n short-stream app-secret -o jsonpath='{.data.jwt-secret}' | base64 -d

# Editar configmap
kubectl edit configmap -n short-stream app-config
```

### Debugging

```bash
# Ver todos os recursos
kubectl get all -n short-stream

# Ver recursos com labels
kubectl get pods -n short-stream -l app=auth-service

# Ver recursos com wide output
kubectl get pods -n short-stream -o wide

# Descrever recurso (debug detalhado)
kubectl describe pod -n short-stream <pod-name>

# Ver eventos do namespace
kubectl get events -n short-stream --sort-by='.lastTimestamp'

# Ver recursos em formato JSON/YAML
kubectl get deployment -n short-stream auth-service -o yaml
kubectl get deployment -n short-stream auth-service -o json | jq .
```

### Cleanup

```bash
# Deletar recursos de um overlay
kubectl delete -k infra/k8s/overlays/dev

# Deletar namespace (deleta tudo dentro)
kubectl delete namespace short-stream
kubectl delete namespace infrastructure

# Deletar recurso específico
kubectl delete deployment -n short-stream auth-service
kubectl delete service -n short-stream auth-service
```

---

## Troubleshooting

### Pod não inicia (CrashLoopBackOff)

```bash
# Ver logs
kubectl logs -n short-stream <pod-name>
kubectl logs -n short-stream <pod-name> --previous

# Ver eventos
kubectl describe pod -n short-stream <pod-name>

# Verificar probes
kubectl get pod -n short-stream <pod-name> -o yaml | grep -A 10 "livenessProbe"
```

**Causas comuns:**
- Imagem não existe ou tag errada
- Falta de recursos (CPU/Memory)
- Health check falhando
- Dependência não disponível

### Service não responde

```bash
# Verificar endpoints
kubectl get endpoints -n short-stream <service-name>

# Verificar se pods estão ready
kubectl get pods -n short-stream -l app=<service-name>

# Testar conectividade de dentro do cluster
kubectl run -n short-stream curl-test --image=curlimages/curl -it --rm -- sh
# dentro do pod:
curl http://auth-service:8000/health
```

### ImagePullBackOff

```bash
# Ver erro detalhado
kubectl describe pod -n short-stream <pod-name>
```

**Causas comuns:**
- Imagem não existe no registry
- Tag incorreta
- Falta credenciais de registry privado
- Rate limit do Docker Hub

**Solução para registry privado:**
```bash
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<password> \
  -n short-stream

# Adicionar ao deployment
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
```

### Secrets não carregam

```bash
# Verificar se secret existe
kubectl get secret -n short-stream

# Ver conteúdo do secret
kubectl get secret -n short-stream app-secret -o yaml

# Verificar se pod referencia corretamente
kubectl get deployment -n short-stream <name> -o yaml | grep -A 5 secretKeyRef
```

### Conexão entre serviços falha

**Formato correto de DNS interno:**
```
<service-name>.<namespace>.svc.cluster.local:<port>
```

**Exemplos:**
- `postgres-service.infrastructure.svc.cluster.local:5432`
- `redis-service.infrastructure.svc.cluster.local:6379`
- `auth-service.short-stream.svc.cluster.local:8000`

**Dentro do mesmo namespace:**
```
<service-name>:<port>
```

---

## Performance e Otimização

### Resource Requests e Limits

```yaml
resources:
  requests:
    memory: "128Mi"  # Garantido
    cpu: "100m"      # Garantido
  limits:
    memory: "256Mi"  # Máximo permitido
    cpu: "500m"      # Máximo permitido
```

### Horizontal Pod Autoscaler (HPA)

```bash
# Criar HPA
kubectl autoscale deployment -n short-stream auth-service \
  --cpu-percent=70 \
  --min=2 \
  --max=10

# Ver HPA
kubectl get hpa -n short-stream

# Descrever HPA
kubectl describe hpa -n short-stream auth-service
```

### Persistent Volumes

Para produção, substitua `emptyDir` por `PersistentVolumeClaim`:

```yaml
volumes:
- name: postgres-data
  persistentVolumeClaim:
    claimName: postgres-pvc
```

---

## Próximos Passos

- [ ] Criar overlays para staging e prod
- [ ] Implementar Ingress Controller (nginx/traefik)
- [ ] Configurar cert-manager para SSL/TLS
- [ ] Implementar External Secrets Operator
- [ ] Configurar HPA para todos serviços
- [ ] Adicionar NetworkPolicies
- [ ] Configurar PodDisruptionBudgets
- [ ] Implementar Service Mesh (Istio/Linkerd)
- [ ] Configurar observabilidade (Prometheus/Grafana)
- [ ] Configurar logging centralizado (ELK/Loki)

---

## Recursos

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

---

## Suporte

Para dúvidas ou problemas:
1. Verificar logs: `kubectl logs -n short-stream <pod-name>`
2. Verificar eventos: `kubectl get events -n short-stream`
3. Consultar este README
4. Abrir issue no repositório
