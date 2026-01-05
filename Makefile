.PHONY: update pull up down client server

update: pull up 

pull:
	git pull

up:
	docker compose up -d --build

down:
	docker compose down

client:
	npm run dev --prefix client/

server:
	cd server && node server.js