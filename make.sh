#!/bin/sh

set -x
set -e

cd $GOPATH/src/github.com/citrusleaf/amc

edition=$1
environ=$2

build=`date -u +%Y%m%d.%H%M%S`
version=`git describe --tags $(git rev-list --tags --max-count=1)`
# tag=`git rev-parse --short HEAD`
version_build="$edition-$version"

# build binary
go build -a -tags $edition -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$version -X github.com/citrusleaf/amc/common.AMCEnv=$environ" -o deployment/release/amc/opt/amc/amc .

# build content
rm -rf build/static
cd static
npm install
grunt

cd ..

rm -rf deployment/release/amc/opt/amc/static
mkdir -p deployment/release/amc/opt/amc/static/
cp -R build/static/ deployment/release/amc/opt/amc/static

rm -rf deployment/release/amc/opt/amc/mailer
mkdir -p deployment/release/amc/opt/amc/mailer/templaes
cp -R mailer/templates/ deployment/release/amc/opt/amc/mailer/templates

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
