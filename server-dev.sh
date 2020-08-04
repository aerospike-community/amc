#!/bin/sh

set -x
set -e

cd $GOPATH/src/github.com/aerospike-community/amc

edition=$1

build=`date -u +%Y%m%d.%H%M%S`
version=`git describe --tags $(git rev-list --tags --max-count=1)`
# tag=`git rev-parse --short HEAD`
version_build="$edition-$version"

# build binary
#godep go build -race -a -tags $edition -ldflags "-X github.com/aerospike-community/amc/common.AMCEdition=$edition -X github.com/aerospike-community/amc/common.AMCBuild=$build -X github.com/aerospike-community/amc/common.AMCVersion=$version -X github.com/aerospike-community/amc/common.AMCEnv=dev" -o amc .
go build -race -a -tags $edition -ldflags "-X github.com/aerospike-community/amc/common.AMCEdition=$edition -X github.com/aerospike-community/amc/common.AMCBuild=$build -X github.com/aerospike-community/amc/common.AMCVersion=$version -X github.com/aerospike-community/amc/common.AMCEnv=dev" -o amc .

./amc -config-file=$GOPATH/src/github.com/aerospike-community/amc/amc.dev.conf -profile
