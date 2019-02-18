#!/bin/bash

# parse command-line arguments
VERSION="$1"
WORLD_URL="$2"

if [[ -z $VERSION ]]; then
	VERSION="1.13.2"
fi

# TODO: create non-root user

# install package dependencies
sudo apt install default-jre git npm unzip
sudo npm install -g pm2

# install this repository
git clone https://github.com/bentsherman/minecraft-server.git

# download minecraft server jar
cd minecraft-server

./scripts/download.sh $VERSION

echo "eula=true" > eula.txt

# download existing minecraft world
if [[ ! -z $WORLD_URL ]]; then
	wget -O world.zip $WORLD_URL
	unzip world.zip
	rm -rf world.zip
fi

# start minecraft server
npm start

# create pm2 startup script
pm2 startup --service-name minecraft-server | tail -n 1 | bash
pm2 save
