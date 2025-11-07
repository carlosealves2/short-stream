.PHONY: help install setup build build-affected build-go build-python build-node
.PHONY: test test-affected test-go test-python test-node
.PHONY: docker-up docker-down docker-build docker-logs docker-clean docker-restart
.PHONY: dev lint format clean nx-reset nx-graph affected
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ Help
help: ## Display this help message
	@echo "$(BLUE)Short Stream - Makefile Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make $(GREEN)<target>$(NC)\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup
install: ## Install all dependencies (pnpm, go, uv)
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@echo "$(YELLOW)Installing Node.js dependencies...$(NC)"
	pnpm install
	@echo "$(YELLOW)Syncing Go workspace...$(NC)"
	go work sync
	@echo "$(YELLOW)Installing Python dependencies...$(NC)"
	uv sync
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

setup: install ## Complete project setup
	@echo "$(BLUE)Setting up project...$(NC)"
	@echo "$(GREEN)✓ Project setup complete$(NC)"

##@ Build
build: ## Build all projects
	@echo "$(BLUE)Building all projects...$(NC)"
	pnpm nx run-many --target=build --all --parallel=3
	@echo "$(GREEN)✓ Build complete$(NC)"

build-affected: ## Build only affected projects
	@echo "$(BLUE)Building affected projects...$(NC)"
	pnpm nx affected --target=build --parallel=3
	@echo "$(GREEN)✓ Affected build complete$(NC)"

build-go: ## Build only Go services
	@echo "$(BLUE)Building Go services...$(NC)"
	@for dir in apps/auth_service apps/notification_service apps/video_conversor apps/video_metadata_service apps/video_uploader; do \
		echo "$(YELLOW)Building $$dir...$(NC)"; \
		cd $$dir && go build -o ../../dist/$$dir/main ./cmd && cd ../..; \
	done
	@echo "$(GREEN)✓ Go services built$(NC)"

build-python: ## Build only Python services
	@echo "$(BLUE)Building Python services...$(NC)"
	uv build --all
	@echo "$(GREEN)✓ Python services built$(NC)"

build-node: ## Build only Node.js services
	@echo "$(BLUE)Building Node.js services...$(NC)"
	pnpm nx run-many --target=build --projects=gateway,video-feed-provider,frontend --parallel=3
	@echo "$(GREEN)✓ Node.js services built$(NC)"

##@ Test
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	pnpm nx run-many --target=test --all --parallel=3
	@echo "$(GREEN)✓ All tests passed$(NC)"

test-affected: ## Run tests for affected projects only
	@echo "$(BLUE)Running tests for affected projects...$(NC)"
	pnpm nx affected --target=test --parallel=3
	@echo "$(GREEN)✓ Affected tests passed$(NC)"

test-go: ## Run Go tests
	@echo "$(BLUE)Running Go tests...$(NC)"
	go test ./... -v -coverprofile=coverage.out
	@echo "$(GREEN)✓ Go tests passed$(NC)"

test-python: ## Run Python tests
	@echo "$(BLUE)Running Python tests...$(NC)"
	uv run pytest
	@echo "$(GREEN)✓ Python tests passed$(NC)"

test-node: ## Run Node.js tests
	@echo "$(BLUE)Running Node.js tests...$(NC)"
	pnpm nx run-many --target=test --projects=gateway,video-feed-provider,frontend --parallel=3
	@echo "$(GREEN)✓ Node.js tests passed$(NC)"

##@ Docker
docker-up: ## Start all services with Docker Compose
	@echo "$(BLUE)Starting services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"

docker-down: ## Stop all services
	@echo "$(BLUE)Stopping services...$(NC)"
	docker compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

docker-build: ## Build all Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker compose build
	@echo "$(GREEN)✓ Docker images built$(NC)"

docker-logs: ## View logs from all services
	@echo "$(BLUE)Viewing logs...$(NC)"
	docker compose logs -f

docker-restart: ## Restart all services
	@echo "$(BLUE)Restarting services...$(NC)"
	docker compose restart
	@echo "$(GREEN)✓ Services restarted$(NC)"

docker-clean: ## Clean all Docker resources (containers, volumes, images)
	@echo "$(RED)Cleaning Docker resources...$(NC)"
	docker compose down -v --rmi all
	@echo "$(GREEN)✓ Docker resources cleaned$(NC)"

##@ Development
dev: ## Run services in development mode
	@echo "$(BLUE)Starting development environment...$(NC)"
	pnpm nx run-many --target=serve --all --parallel=5

lint: ## Run linters for all projects
	@echo "$(BLUE)Running linters...$(NC)"
	@echo "$(YELLOW)Linting Go code...$(NC)"
	go fmt ./...
	@echo "$(YELLOW)Linting Python code...$(NC)"
	uv run ruff check .
	@echo "$(YELLOW)Linting Node.js code...$(NC)"
	pnpm nx run-many --target=lint --all --parallel=3
	@echo "$(GREEN)✓ Linting complete$(NC)"

format: ## Format code for all projects
	@echo "$(BLUE)Formatting code...$(NC)"
	@echo "$(YELLOW)Formatting Go code...$(NC)"
	go fmt ./...
	@echo "$(YELLOW)Formatting Python code...$(NC)"
	uv run black .
	uv run ruff format .
	@echo "$(YELLOW)Formatting Node.js code...$(NC)"
	pnpm nx format:write
	@echo "$(GREEN)✓ Code formatted$(NC)"

clean: ## Clean build artifacts and cache
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf dist/
	rm -rf .nx/
	rm -rf node_modules/.cache/
	@for dir in apps/*/node_modules/.cache; do \
		rm -rf $$dir; \
	done
	@echo "$(GREEN)✓ Clean complete$(NC)"

##@ Nx
nx-reset: ## Reset Nx cache
	@echo "$(BLUE)Resetting Nx cache...$(NC)"
	pnpm nx reset
	@echo "$(GREEN)✓ Nx cache reset$(NC)"

nx-graph: ## Open Nx dependency graph
	@echo "$(BLUE)Opening Nx graph...$(NC)"
	pnpm nx graph

affected: ## Show affected projects
	@echo "$(BLUE)Affected projects:$(NC)"
	@pnpm nx show projects --affected --base=develop
