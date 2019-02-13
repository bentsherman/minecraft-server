#!/bin/bash

# install package dependencies
sudo apt install default-jre git npm unzip
sudo npm install -g pm2

# install this repository
git clone https://github.com/bentsherman/minecraft-server.git

# download minecraft server jar
cd minecraft-server

./scripts/download.sh 1.13.2

echo "eula=true" > eula.txt

# create pm2 startup script
# pm2 startup --service-name minecraft-server
# sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
# pm2 save
