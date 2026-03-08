# ╔══════════════════════════════════════════════════════════════════════╗
# ║  Iterate — Monorepo Makefile                                       ║
# ║  Run `make` or `make help` for available targets.                   ║
# ╚══════════════════════════════════════════════════════════════════════╝

.DEFAULT_GOAL := help
SHELL := /bin/bash

# ── Colors ───────────────────────────────────────────────────────────
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
DIM    := \033[2m
RESET  := \033[0m
BOLD   := \033[1m

# ── Binaries ─────────────────────────────────────────────────────────
PNPM   := pnpm
TURBO  := pnpm turbo
DOCKER := docker compose

# ══════════════════════════════════════════════════════════════════════
#  Setup
# ══════════════════════════════════════════════════════════════════════

.PHONY: help
help: ## Show this help
	@echo ""
	@echo "  $(BOLD)$(CYAN)Iterate$(RESET) — Closed-loop AI Product Manager"
	@echo ""
	@grep -E '^[a-zA-Z_\-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""

.PHONY: setup
setup: ## First-time project setup (install deps, setup db, copy env)
	@echo "$(CYAN)▸ Setting up Iterate...$(RESET)"
	@test -f .env || (cp .env.example .env && echo "  $(GREEN)✓$(RESET) Created .env from .env.example")
	@$(PNPM) install
	@$(MAKE) db-up
	@$(MAKE) db-push
	@echo "$(GREEN)✓ Setup complete!$(RESET)"

.PHONY: install
install: ## Install all dependencies
	@$(PNPM) install

# ══════════════════════════════════════════════════════════════════════
#  Development
# ══════════════════════════════════════════════════════════════════════

.PHONY: dev
dev: ## Start all apps in development mode
	@$(TURBO) dev

.PHONY: dev-web
dev-web: ## Start only the web app
	@$(TURBO) dev --filter=web

.PHONY: dev-symphony
dev-symphony: ## Start only the Symphony backend
	@$(TURBO) dev --filter=symphony

.PHONY: build
build: ## Build all packages and apps
	@$(TURBO) build

.PHONY: lint
lint: ## Lint all packages and apps
	@$(TURBO) lint

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	@$(TURBO) build --filter=@iterate/ai --filter=@iterate/database

.PHONY: clean
clean: ## Remove all build artifacts and node_modules
	@echo "$(YELLOW)▸ Cleaning build artifacts...$(RESET)"
	@rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@rm -rf apps/web/.next
	@rm -rf packages/*/dist
	@echo "$(GREEN)✓ Clean complete$(RESET)"

# ══════════════════════════════════════════════════════════════════════
#  Database
# ══════════════════════════════════════════════════════════════════════

.PHONY: db-up
db-up: ## Start PostgreSQL via Docker Compose
	@echo "$(CYAN)▸ Starting PostgreSQL...$(RESET)"
	@$(DOCKER) up -d postgres
	@echo "$(GREEN)✓ PostgreSQL running on :5432$(RESET)"

.PHONY: db-down
db-down: ## Stop PostgreSQL
	@$(DOCKER) down

.PHONY: db-push
db-push: ## Push Prisma schema to database
	@cd packages/database && $(PNPM) run db:push

.PHONY: db-migrate
db-migrate: ## Run Prisma migrations
	@cd packages/database && $(PNPM) run db:migrate

.PHONY: db-generate
db-generate: ## Generate Prisma client
	@cd packages/database && $(PNPM) run db:generate

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	@cd packages/database && $(PNPM) run db:studio

.PHONY: db-reset
db-reset: ## Reset database (drop + recreate + seed)
	@echo "$(RED)▸ Resetting database...$(RESET)"
	@$(DOCKER) down -v
	@$(MAKE) db-up
	@sleep 2
	@$(MAKE) db-push
	@echo "$(GREEN)✓ Database reset complete$(RESET)"

# ══════════════════════════════════════════════════════════════════════
#  AI
# ══════════════════════════════════════════════════════════════════════

.PHONY: ai-check
ai-check: ## Verify AI provider API keys are configured
	@echo "$(CYAN)▸ Checking AI provider configuration...$(RESET)"
	@test -n "$${OPENAI_API_KEY}" && echo "  $(GREEN)✓$(RESET) OPENAI_API_KEY set" || echo "  $(DIM)○$(RESET) OPENAI_API_KEY not set"
	@test -n "$${ANTHROPIC_API_KEY}" && echo "  $(GREEN)✓$(RESET) ANTHROPIC_API_KEY set" || echo "  $(DIM)○$(RESET) ANTHROPIC_API_KEY not set"
	@test -n "$${GITHUB_TOKEN}" && echo "  $(GREEN)✓$(RESET) GITHUB_TOKEN set" || echo "  $(DIM)○$(RESET) GITHUB_TOKEN not set"
	@echo ""

.PHONY: ai-test
ai-test: ## Send a test prompt to verify AI connectivity
	@echo "$(CYAN)▸ Testing AI connectivity...$(RESET)"
	@if [ -n "$${ANTHROPIC_API_KEY}" ]; then \
		echo "  Testing Anthropic..." && \
		curl -s https://api.anthropic.com/v1/messages \
			-H "x-api-key: $${ANTHROPIC_API_KEY}" \
			-H "anthropic-version: 2023-06-01" \
			-H "content-type: application/json" \
			-d '{"model":"claude-sonnet-4-20250514","max_tokens":32,"messages":[{"role":"user","content":"Say ok"}]}' \
			| grep -q '"text"' && echo "  $(GREEN)✓$(RESET) Anthropic connected" || echo "  $(RED)✗$(RESET) Anthropic failed"; \
	fi
	@if [ -n "$${OPENAI_API_KEY}" ]; then \
		echo "  Testing OpenAI..." && \
		curl -s https://api.openai.com/v1/chat/completions \
			-H "Authorization: Bearer $${OPENAI_API_KEY}" \
			-H "Content-Type: application/json" \
			-d '{"model":"gpt-4.1-nano","max_tokens":32,"messages":[{"role":"user","content":"Say ok"}]}' \
			| grep -q '"choices"' && echo "  $(GREEN)✓$(RESET) OpenAI connected" || echo "  $(RED)✗$(RESET) OpenAI failed"; \
	fi

# ══════════════════════════════════════════════════════════════════════
#  CI / Quality
# ══════════════════════════════════════════════════════════════════════

.PHONY: ci
ci: ## Run full CI pipeline locally
	@echo "$(CYAN)▸ Running CI pipeline...$(RESET)"
	@$(MAKE) install
	@$(MAKE) lint
	@$(MAKE) build
	@echo "$(GREEN)✓ CI passed$(RESET)"

.PHONY: pre-commit
pre-commit: lint typecheck ## Pre-commit checks (lint + typecheck)
