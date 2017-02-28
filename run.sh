#!/bin/sh

set -x
set -e

cd $GOPATH/src/github.com/citrusleaf/amc

edition=${1:-enterprise}
environ=${2:-dev}

build=`date -u +%Y%m%d.%H%M%S`
version=`git describe`
# tag=`git rev-parse --short HEAD`
version_build="$edition-$version"

# build binary
go build -race -a -o amc -tags $edition -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$version -X github.com/citrusleaf/amc/common.AMCEnv=$environ"

./amc -config-file=$GOPATH/src/github.com/citrusleaf/amc/amc.dev.conf
