#!/bin/sh

set -x
set -e

cd $GOPATH/src/github.com/aerospike/aerospike-console

build=`date -u +%Y%m%d.%H%M%S`
version=`git rev-parse --short HEAD`
version_build="$version-$build"

# build binary
godep go build -a -tags $1 -ldflags "-X controllers.amcBuild $build -X controllers.amcVersion $version" -o deployment/release/amc/usr/local/bin/amc .

# build content
# mkdir -p deployment/release/amc/opt/amc/public
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

# rm  *.rpm
# fpm -s dir -t rpm -n "stellar" -v $version_build  -C deployment/release/stellar .
# fpm -s dir -t rpm -n "ascloud" -v $version_build  -C deployment/release/ascloud .

