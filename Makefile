# Enemy Eyes - Makefile
# Common commands for development

.PHONY: install dev build preview clean

# Install dependencies
install:
	npm install

# Run development server (hot reload)
dev:
	npm run dev

# Build for production
build:
	npm run build

# Preview production build
preview:
	npm run preview

# Clean build artifacts and dependencies
clean:
	rm -rf node_modules dist

# Install and run in one command
start: install dev

# Help
help:
	@echo "Available commands:"
	@echo "  make install  - Install npm dependencies"
	@echo "  make dev      - Run development server"
	@echo "  make build    - Build for production"
	@echo "  make preview  - Preview production build"
	@echo "  make clean    - Remove node_modules and dist"
	@echo "  make start    - Install deps and run dev server"
