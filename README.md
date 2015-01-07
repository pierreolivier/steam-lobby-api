Steam lobby api
=============================

Images provide from Steam

http://steampowered.com/

This app allows players to see against who they are playing.

INSTALL
=============================

1) install nodejs

	http://nodejs.org/

	For Windows users : add C:\Program Files\nodejs to your PATH



2) install nodejs packages

	npm update



3) create a certificate (if you set a passphrase, don't forget step 5)

	openssl genrsa -out key.pem 1024

	openssl req -new -key key.pem -out csr.pem

	openssl x509 -req -in csr.pem -signkey key.pem -out cert.pem



4) rename configuration.js.sample to configuration.js



5) (optional) set the passphrase in configuration.js

INSTALL
=============================

	node ./bin/www



WHY YOU NEED TO BE CONNECTED TO STEAM COMMUNITY ?
=============================

Theses pages are private

	http://steamcommunity.com/id/CUSTOM_NAME/friends/players/

or

	http://steamcommunity.com/profiles/NUMBERS/friends/players/
