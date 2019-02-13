#!/bin/bash

VERSION="$1"

if [[ -z $VERSION ]]; then
    echo "warning: no version specified, defaulting to 1.7.10"
    VERSION="1.7.10"
fi

if [[ $VERSION == "1.13.2" ]]; then
    URL="https://launcher.mojang.com/v1/objects/3737db93722a9e39eeada7c27e7aca28b144ffa7/server.jar"
else
    URL="https://s3.amazonaws.com/Minecraft.Download/versions/$VERSION/minecraft_server.$VERSION.jar"
fi

FILENAME="minecraft_server.jar"

rm -f $FILENAME
wget -O $FILENAME $URL
