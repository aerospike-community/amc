# AMC: Aerospike Management Console

# Environment setup

You need to install Go and setup your GOPATH.

Download: https://golang.org/dl/

You can find instructions here:

https://golang.org/doc/install

You also need to install `npm`

After getting and installing `npm`, install grunt: `npm install -g grunt`

You need `godep` to be able to manage dependencies and build the app server:

`go get github.com/tools/godep`

Install reflex to watch files and automatically rebuild server code:

`go get github.com/cespare/reflex`

# Getting the Code

`go get github.com/citrusleaf/amc`

# Developing the Application Server

You can have a look inside the `./server-dev.sh` to find out the details. The command inside this file will pass a dev config file to the app server.

`reflex -R node_modules -R static -R build -R deployment -R vendor -r '\.go$' ./server-dev.sh enterprise`

# Building the UI

```shell
$ cd static
$ npm install
$ grunt build
```

The built files will be in `build/static`

Keep in mind that you don't need to build the UI to be able to develop. The original source files are used for the development.

# MacOS instructions:

You can find the log file in `/Library/Logs/amc/amc.log`
Configuration file is in `/Library/amc/amc.conf`

## installation
`sudo tar -xvf aerospike-amc-<edition>-<version>-darwin.tar.gz -C /Library`

## Start
`sudo launchctl load  /Library/LaunchAgents/com.aerospike.amc.plist`

## Stop
`sudo launchctl unload  /Library/LaunchAgents/com.aerospike.amc.plist`

## Uninstallation
`sudo /Library/amc/uninstall.sh`

