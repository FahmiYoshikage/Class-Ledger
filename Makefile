.PHONY: update pull up down dev dev-stop dev-logs client server server-stop server-restart server-logs server-status

update: pull up 

pull:
	git pull

up:
	docker compose up -d --build

down:
	docker compose down

# Development - run both server and client
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
