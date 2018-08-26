# minecraft-server

A simple wrapper for a Minecraft server, which includes the following features:
- script to download any version of the Minecraft server
- process management with PM2

This project requires `node` and `npm`.

To setup:
```
git clone https://github.com/bentsherman/minecraft-server.git
cd minecraft-server

npm install
npm start

# additional helper commands
npm run logs
npm stop
```

You must agree to the EULA by updating `eula.txt` after the first attempt, and then the Minecraft server will start up properly. The server will create a world in a folder called "world" -- you can transfer a world from another server or even a local world by transferring that world's folder. For example, if you had a local world called "Earthland", you would have to find the folder called "Earthland" in your Minecraft install, copy it to the server directly and rename the folder to "world".

NOTE: The script `download.sh` may not work for newer versions of Minecraft. For newer versions, check the Minecraft website.
