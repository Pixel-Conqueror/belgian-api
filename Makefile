dev:
	@docker compose -f dev.compose.yml up -d --wait
	@node ace migration:fresh
	@./dev.startup.sh
