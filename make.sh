#!/bin/sh

set -x
set -e

cd $GOPATH/src/github.com/citrusleaf/amc

edition=${1:-enterprise}
environ=${2:-dev}
platform=${3:-linux}
sysname=$(uname | tr '[:upper:]' '[:lower:]')

maintainer="Khosrow Afroozeh (khosrow@aerospike.com)"
description="Aerospike Management Console"

echo "platform is ${platform}"
echo "sysname is ${sysname}"

build=`date -u +%Y%m%d.%H%M%S`
# version=`git describe --tags $(git rev-list --tags --max-count=1)`
version=5.0-alpha

# build content
cd static_v5
rm -rf build/*
npm run buildprod
cd ..

case $platform in
	'linux')
		BASE_DIR="deployment/release/linux"

		rm -rf $BASE_DIR/opt/amc/static
		rm -rf $BASE_DIR/opt/amc/mailer

		mkdir -p $BASE_DIR/var/log
		mkdir -p $BASE_DIR/opt/amc
		mkdir -p $BASE_DIR/etc/amc

    mkdir -p $BASE_DIR/opt/amc/static
    cp static_v5/index.html $BASE_DIR/opt/amc/static
    cp -R static_v5/src/images $BASE_DIR/opt/amc/static
		cp -R static_v5/build $BASE_DIR/opt/amc/static
		mkdir -p $BASE_DIR/opt/amc/mailer
		cp -R mailer/templates $BASE_DIR/opt/amc/mailer/

		# build binary
		CGO_ENABLED=0 GOOS=$platform go build -a -tags "purego $edition" -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$version -X github.com/citrusleaf/amc/common.AMCEnv=$environ" -o $BASE_DIR/opt/amc/amc .

		# rpm
		rm -f $BASE_DIR/etc/init.d/*
		cp -f deployment/common/amc.rpm $BASE_DIR/etc/init.d/amc
		chmod +x $BASE_DIR/etc/init.d/amc
		fpm -f -s dir -t rpm -n "aerospike-amc-$edition" -v $version -C $BASE_DIR -m "$maintainer" --description "$description" --vendor "Aerospike" .

		# deb
		rm -f $BASE_DIR/etc/init.d/*
		cp -f deployment/common/amc.deb $BASE_DIR/etc/init.d/amc
		chmod +x $BASE_DIR/etc/init.d/amc
		fpm -f -s dir -t deb -n "aerospike-amc-$edition" -v $version -C $BASE_DIR  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		## deb download need to be renamed from _ to -
		mv aerospike-amc-${edition}_${version}_amd64.deb aerospike-amc-${edition}-${version}_amd64.deb

		# zip, for all others
		rm -f $BASE_DIR/etc/init.d/*
		cp -f deployment/common/amc.other.sh $BASE_DIR/etc/init.d/amc
		chmod +x $BASE_DIR/etc/init.d/amc
		fpm -f -s dir -t tar -n "aerospike-amc-$edition" -v $version -C $BASE_DIR  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		gzip "aerospike-amc-$edition.tar"
		mv "aerospike-amc-$edition.tar.gz" "aerospike-amc-$edition-$version-linux.tar.gz"
		;;
	'darwin')
		BASE_DIR="deployment/release/darwin/amc"

		mkdir -p $BASE_DIR

		rm -rf $BASE_DIR/static
		rm -rf $BASE_DIR/mailer

    mkdir -p $BASE_DIR/static
    cp static_v5/index.html $BASE_DIR/static
    cp -R static_v5/src/images $BASE_DIR/static
		cp -R static_v5/build $BASE_DIR/static
		mkdir -p $BASE_DIR/mailer
		cp -R mailer/templates $BASE_DIR/mailer/

		# build binary
		CGO_ENABLED=0 GOOS=$platform go build -a -tags "purego $edition" -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$version -X github.com/citrusleaf/amc/common.AMCEnv=$environ" -o $BASE_DIR/amc .

		# zip
		fpm --verbose -f -s dir -t tar -n "aerospike-amc-$edition" -v $version -C deployment/release/darwin  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		gzip "aerospike-amc-$edition.tar"
		mv "aerospike-amc-$edition.tar.gz" "aerospike-amc-$edition-$version-darwin.tar.gz"
		;;
	*)
		echo "unrecognized platform ${platform}"
		exit 1
		;;
esac
