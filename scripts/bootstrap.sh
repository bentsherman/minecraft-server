#!/bin/bash

# TODO: create non-root user

# install package dependencies
sudo apt install default-jre git npm unzip
sudo npm install -g pm2

# install this repository
git clone https://github.com/bentsherman/minecraft-server.git

# download minecraft server jar
cd minecraft-server

./scripts/download.sh 1.13.2

echo "eula=true" > eula.txt

# TODO: download existing minecraft world

# start minecraft server
npm start

# create pm2 startup script
pm2 startup --service-name minecraft-server | tail -n 1 | bash
pm2 save
