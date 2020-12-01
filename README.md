# AMC: Aerospike Management Console

The Aerospike Management Console (AMC) is a web-based tool to monitor/manage an
Aerospike cluster. It provides live updates to the current status of a cluster.

It includes features to let you see at a glance the throughput, storage usage,
and configuration of a cluster.

This repo includes both editions of AMC, Community and Enterprise. Going forward
AMC builds will be AMC Enterprise ones.

## Aerospike Monitoring Stack
For monitoring and alerting you should consider using the Prometheus and Grafana based [Aerospike Monitoring Stack](https://github.com/aerospike/aerospike-monitoring). This is the monitoring solution being developed by Aerospike.

## AMC Community Development

AMC has been turned over to the community. If you wish to contribute code,
go ahead and clone this repo, modify the code, and create a pull request.

Active contributors can then ask to become maintainers for the repo.
The wiki can similarly be modified by any code contributor who has been granted
pull permissions.

## Installing AMC

## Docker
Building the Docker image manually
```bash
docker image build . -t aerospike/amc
```

Running the Docker container
```bash
docker run -d --name amc -p 8081:8081 aerospike/amc
```

### Docker Hub [Not Updated]
Note: the Docker Hub version is currently not update - please use the Docker instructions above.
See [aerospike/amc](https://hub.docker.com/r/aerospike/amc) on Docker Hub.

```bash
docker pull aerospike/amc
```

### Releases
The latest binaries for Redhat, Ubuntu, Debian, generic Linux and macOS are
available in the repo's releases section.

See the [release notes](CHANGELOG.md).

## User Guide

The AMC user guide is available on the [wiki](https://github.com/aerospike-community/amc/wiki).


## Building the Project

### Environment setup

You need to install Go 1.15+ and setup your GOPATH.

Download: https://golang.org/dl/

You can find instructions here:

https://golang.org/doc/install

You also need to install `npm`, we recommend using `nvm`:

Install nvm: `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.1/install.sh | bash`

Install node (lts) and latest npm: `nvm install --lts`

After getting and installing `npm`, install grunt: `npm install -g grunt`

Install reflex to watch files and automatically rebuild server code:

`go get github.com/cespare/reflex`

### Getting the Code

`go get github.com/aerospike-community/amc`

### Developing the Application Server

You can have a look inside the `./server-dev.sh` to find out the details. The command inside this file will pass a dev config file to the app server.

`reflex -R node_modules -R static -R build -R deployment -R vendor -r '\.go$' ./server-dev.sh enterprise`

### Building the UI

```shell
$ cd static
$ npm install
$ grunt
```

The built files will be in `build/static`

Keep in mind that you don't need to build the UI to be able to develop. The original source files are used for the development.

### macOS instructions:

You can find the log file in `/Library/Logs/amc/amc.log`
Configuration file is in `/Library/amc/amc.conf`

#### installation
`sudo tar -xvf aerospike-amc-<edition>-<version>-darwin.tar.gz -C /Library`

#### Start
`sudo launchctl load  /Library/LaunchAgents/com.aerospike.amc.plist`

#### Stop
`sudo launchctl unload  /Library/LaunchAgents/com.aerospike.amc.plist`

#### Uninstallation
`sudo /Library/amc/uninstall.sh`

