#!/bin/bash

if [[ $# != 2 ]]; then
	echo "usage: $0 <keyfile> <endpoint>"
	exit -1
fi

KEYFILE="$1"
ENDPOINT="$2"

curl -sS -X GET -H "Content-Type: application/json" \
	-H "Authorization: Bearer $(cat $KEYFILE)" \
	"https://api.digitalocean.com/v2/$ENDPOINT" | python -m json.tool
