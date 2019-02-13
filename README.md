# minecraft-server

This repository provides a simple setup for running a [Minecraft](https://minecraft.net/) server inexpensively in the cloud. It includes the following features:
- Script to download any version of the Minecraft server
- Process management with PM2
- Static website to manage a Minecraft server through [DigitalOcean](https://www.digitalocean.com/)

## Dependencies

You need `java` to run the Minecraft server and `npm` to install and use PM2.

## Installation

The basic setup:
```
git clone https://github.com/bentsherman/minecraft-server.git

cd minecraft-server
./scripts/download.sh
npm install
```

NOTE: The `download.sh` script may not work for newer versions of Minecraft. For newer versions, check the Minecraft website.

## Usage

There are several `npm` helper commands provided by `package.json` that you can use:
```
# start the server
npm start

# view the server logs in real time
npm run logs

# stop the server
npm stop
```

You must agree to the EULA by updating `eula.txt` after the first attempt, and then the Minecraft server will start up properly. The server will use the world in the `world` folder, or create a new world if this folder doesn't exist. This way you can transfer a world from another server or even a local world by transferring that world's folder. For example, if you had a local world called `Earthland`, you would have to find the folder called `Earthland` in your Minecraft install, copy it to the server directly and rename the folder to `world`.

## Running in the Cloud

This repository can be used to create a server on DigitalOcean which can be managed through a static website. This setup is ideal for a Minecraft server that needs to be accessible from anywhere but does not need to be available all the time. Using the static website, you can "start" a server by creating a Droplet from a snapshot, and then "stop" a server by creating a new snapshot from the Droplet and then deleting the Droplet and the old snapshot. This way, the cost of hosting the Minecraft server is much lower, as you only pay for the time that you actually use the server, as well as the storage cost of the snapshot.

To get started, you must create an account on DigitalOcean and create an API key, which will allow you to use the static website to access your resources on DigitalOcean. You will also need to create a "bootstrap" Droplet with the Minecraft server installed. The `bootstrap.sh` script provides a rough outline of how to setup the Minecraft server on a Droplet. Once your bootstrap Droplet is ready, create a snapshot of it called "minecraft-server" and delete the old Droplet. You should then be able to use the static website.
