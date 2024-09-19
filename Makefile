dev:
	@docker compose -f dev.compose.yml up -d --wait
	@node ace migration:fresh
	@pnpm run dev
