#!/bin/bash

VERSION=$1

if [ -z $VERSION ]; then
    echo "warning: no version specified, defaulting to 1.7.10"
    VERSION="1.7.10"
fi

FILENAME="minecraft_server.jar"

if [ -f $FILENAME ]; then
    echo "error: $FILENAME already exists"
    exit 1
fi

wget -O $FILENAME https://s3.amazonaws.com/Minecraft.Download/versions/$VERSION/minecraft_server.$VERSION.jar
