#!/bin/bash

VERSION="$1"

if [[ -z $VERSION ]]; then
    echo "warning: no version specified, defaulting to 1.7.10"
    VERSION="1.7.10"
fi

URL="https://apimon.de/mcversions/$VERSION/server"

FILENAME="minecraft_server.jar"

rm -f $FILENAME
wget -O $FILENAME $URL
