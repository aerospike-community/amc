#!/bin/sh

set -x
set -e

cd $GOPATH/src/github.com/aerospike/aerospike-console

edition=$1
build=`date -u +%Y%m%d.%H%M%S`
version=`git describe --tags $(git rev-list --tags --max-count=1)`
# tag=`git rev-parse --short HEAD`
version_build="$edition-$version"

# build binary
godep go build -a -tags $edition -ldflags "-X main.amcEdition=$edition -X main.amcBuild=$build -X main.amcVersion=$version" -o deployment/release/amc/opt/amc/amc .

# build content
# mkdir -p deployment/release/amc/opt/amc/
# rm -rf deployment/release/amc/opt/amc/public/dist
# cd public
# npm install
# grunt build:dist
# cp -R bower_components app/
# mv dist ../deployment/release/amc/opt/amc/public
# cd ..


# cd ascloud
# godep go build -o ../deployment/release/ascloud/usr/local/bin/ascloud .

# cd ..

rm -rf deployment/release/amc/opt/amc/static
mkdir -p deployment/release/amc/opt/amc/static/
cp -R static deployment/release/amc/opt/amc/

rm -f *.rpm
rm -f *.deb

rm -f deployment/release/amc/etc/init.d/*
cp -f deployment/common/amc.rpm deployment/release/amc/etc/init.d/amc
chmod +x deployment/release/amc/etc/init.d/amc
fpm -s dir -t rpm -n "aerospike-amc-$edition" -v $version  -C deployment/release/amc .

rm -f deployment/release/amc/etc/init.d/*
cp -f deployment/common/amc.deb deployment/release/amc/etc/init.d/amc
chmod +x deployment/release/amc/etc/init.d/amc
fpm -s dir -t deb -n "aerospike-amc-$edition" -v $version  -C deployment/release/amc .
