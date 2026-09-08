.PHONY: deploy update pull up down dev dev-stop dev-logs client server server-stop server-restart server-logs status

# ── Production (VPS) ──────────────────────────────────
# Deploy lengkap: build frontend + docker compose build + up
deploy:
	./deploy.sh

# Quick update: git pull + deploy
update: pull deploy

pull:
	git pull

# Docker compose only (tanpa rebuild frontend - pakai dist/ yang sudah ada)
up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=50

# ── Development (lokal) ───────────────────────────────
dev:
	pm2 start ecosystem.config.js

dev-stop:
	pm2 stop all

dev-logs:
	pm2 logs

# Client only
client:
	pm2 start ecosystem.config.js --only client-dev

client-stop:
	pm2 stop client-dev

client-logs:
	pm2 logs client-dev

# Server only
server:
	pm2 start ecosystem.config.js --only api-server

server-stop:
	pm2 stop api-server

server-restart:
	pm2 restart api-server

server-logs:
	pm2 logs api-server

status:
	pm2 status
