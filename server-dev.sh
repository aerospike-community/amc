#!/bin/sh

set -x
set -e

cd $GOPATH/src/github.com/citrusleaf/amc

edition=$1

build=`date -u +%Y%m%d.%H%M%S`
version=`git describe --tags $(git rev-list --tags --max-count=1)`
# tag=`git rev-parse --short HEAD`
version_build="$edition-$version"

# build binary
godep go build -a -tags $edition -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$version -X github.com/citrusleaf/amc/common.AMCEnv=dev" -o deployment/release/amc/opt/amc/amc .

./amc -config-file=$GOPATH/src/github.com/citrusleaf/amc/amc.dev.conf