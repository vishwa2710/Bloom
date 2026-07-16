# Bloom — common developer tasks.
# Run `make` or `make help` to list targets.

.DEFAULT_GOAL := help

# Override on the CLI, e.g. `make docker-up HOST=192.168.1.42`
HOST ?= 0.0.0.0

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# --- Setup -----------------------------------------------------------------

.PHONY: install
install: ## Install JS dependencies
	npm install

# --- Run (device / emulator) ----------------------------------------------

.PHONY: android
android: ## Build + run the dev client on Android (device/emulator)
	npx expo run:android

.PHONY: ios
ios: ## Build + run the dev client on iOS (macOS + Xcode only)
	npx expo run:ios

.PHONY: start
start: ## Start the Metro dev server for an existing dev-client build
	npx expo start --dev-client

.PHONY: web
web: ## Run in the browser (limited: native modules like PDF won't work)
	npx expo start --web

# --- Native project --------------------------------------------------------

.PHONY: prebuild
prebuild: ## Generate the native android/ & ios/ projects
	npx expo prebuild

.PHONY: prebuild-clean
prebuild-clean: ## Regenerate native projects from scratch (after config changes)
	npx expo prebuild --clean

# --- Quality checks --------------------------------------------------------

.PHONY: typecheck
typecheck: ## Run the TypeScript type checker
	npx tsc --noEmit

.PHONY: doctor
doctor: ## Run Expo's project health check
	npx expo-doctor

.PHONY: bundle-check
bundle-check: ## Sanity-bundle the app with Metro (catches import errors)
	npx expo export --platform android --output-dir .bundle-check
	@rm -rf .bundle-check
	@echo "Bundle OK"

# --- Docker (Metro dev server) ---------------------------------------------

.PHONY: docker-up
docker-up: ## Run the Metro dev server in Docker (set HOST=<your-LAN-IP>)
	REACT_NATIVE_PACKAGER_HOSTNAME=$(HOST) docker compose up --build

.PHONY: docker-down
docker-down: ## Stop the Docker dev server
	docker compose down

# --- Cleanup ---------------------------------------------------------------

.PHONY: clean
clean: ## Remove native projects, caches, and build output
	rm -rf android ios .expo dist .bundle-check

.PHONY: reset
reset: clean ## Full reset: clean, then reinstall dependencies
	rm -rf node_modules
	npm install
