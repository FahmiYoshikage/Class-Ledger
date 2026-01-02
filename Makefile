.PHONY: update pull up

update: pull up 

pull:
	git pull

up:
	docker compose up -d --build