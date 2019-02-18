#!/bin/bash

# parse command-line arguments
if [[ $# != 1 ]]; then
	echo "usage: $0 <username>"
fi

# create sudo user
adduser $USERNAME
usermod -aG sudo $USERNAME

# move SSH keys to user directory
if [[ -d .ssh ]]; then
	mv .ssh /home/$USERNAME
	chmod $USERNAME:$USERNAME /home/$USERNAME/.ssh
fi
