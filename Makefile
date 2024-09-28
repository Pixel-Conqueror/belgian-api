dev:
	@docker compose -f dev.compose.yml up -d --wait
	@pnpx prisma generate
	@npx tsc
	@node ace migration:fresh
	@./dev.startup.sh
