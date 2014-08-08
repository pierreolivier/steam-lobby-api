Steam lobby api
=============================

Images provide from Steam

http://steampowered.com/

This Google Chrome app allows players to see against who they are playing.

INSTALL
=============================

1) install nodejs packages

	npm update



2) create a certificate

	openssl genrsa -out key.pem 1024

	openssl req -new -key key.pem -out csr.pem

	openssl x509 -req -in csr.pem -signkey key.pem -out cert.pem



3) rename configuration.js.sample to configuration.js



4) (optional) set the passphare in configuration.js


WHY YOU NEED TO BE CONNECTED TO STEAM COMMUNITY ?
=============================

Theses pages are private

	http://steamcommunity.com/id/CUSTOM_NAME/friends/players/

or

	http://steamcommunity.com/profiles/NUMBERS/friends/players/
