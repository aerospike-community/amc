#!/bin/sh

set -x
set -e

cd $GOPATH/src/github.com/citrusleaf/amc

edition=${1:-enterprise}
environ=${2:-dev}
platform=${3:-linux}
release=${4:-internal}
sysname=$(uname | tr '[:upper:]' '[:lower:]')

maintainer="Khosrow Afroozeh (khosrow@aerospike.com)"
description="Aerospike Management Console"

echo "platform is ${platform}"
echo "sysname is ${sysname}"

build=`date -u +%Y%m%d.%H%M%S`
# version=`git describe --tags $(git rev-list --tags --max-count=1)`
version=`git describe`

amc_version=version
# if [ $release != "release" ];	then
#	amc_version=`git describe --tags`;
# fi

# build content
rm -rf build/static
cd static
npm install
grunt

cd ..

rm -rf deployment/release/amc/opt/amc/static
mkdir -p deployment/release/amc/opt/amc/static/
cp -R build/static/ deployment/release/amc/opt/amc/

rm -rf deployment/release/amc/opt/amc/mailer
mkdir -p deployment/release/amc/opt/amc/mailer/templates
cp -R mailer/templates/ deployment/release/amc/opt/amc/mailer/


case $platform in
	'linux')
		# build binary
		CGO_ENABLED=0 GOOS=$platform go build -a -tags "purego $edition" -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$amc_version -X github.com/citrusleaf/amc/common.AMCEnv=$environ" -o deployment/release/amc/opt/amc/amc .

		# rpm
		rm -f deployment/release/amc/etc/init.d/*
		cp -f deployment/common/amc.rpm deployment/release/amc/etc/init.d/amc
		chmod +x deployment/release/amc/etc/init.d/amc
		fpm -f -s dir -t rpm -n "aerospike-amc-$edition" -v $version -C deployment/release/amc -m "$maintainer" --description "$description" --vendor "Aerospike" .

		# deb
		rm -f deployment/release/amc/etc/init.d/*
		cp -f deployment/common/amc.deb deployment/release/amc/etc/init.d/amc
		chmod +x deployment/release/amc/etc/init.d/amc
		fpm -f -s dir -t deb -n "aerospike-amc-$edition" -v $version -C deployment/release/amc  -m "$maintainer" --description "$description" --vendor "Aerospike" .

		# zip, for all others
		rm -f deployment/release/amc/etc/init.d/*
		cp -f deployment/common/amc.other.sh deployment/release/amc/etc/init.d/amc
		chmod +x deployment/release/amc/etc/init.d/amc
		fpm -f -s dir -t zip -n "aerospike-amc-$edition" -v $version -C deployment/release/amc  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		mv "aerospike-amc-$edition.zip" "aerospike-amc-$edition-$version.zip"
		;;
	'darwin')
		# build binary
		CGO_ENABLED=0 GOOS=$platform go build -a -tags "purego $edition" -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$amc_version -X github.com/citrusleaf/amc/common.AMCEnv=$environ" -o deployment/release/amc/opt/amc/amc .

		# zip
		rm -f deployment/release/amc/etc/init.d/*
		cp -f deployment/common/amc.other.sh deployment/release/amc/etc/init.d/amc
		chmod +x deployment/release/amc/etc/init.d/amc
		fpm -f -s dir -t zip -n "aerospike-amc-$edition" -v $version -C deployment/release/amc  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		mv "aerospike-amc-$edition.zip" "aerospike-amc-$edition-$version.zip"
		;;
	*)
		echo "unrecognized platform ${platform}"
		exit 1
		;;
esac
