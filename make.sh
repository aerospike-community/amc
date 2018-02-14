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
version=`git describe`

# build content
rm -rf build/static
cd static
npm install
grunt

cd ..

case $platform in
	'linux')
		BASE_DIR="deployment/release/linux"

		rm -rf $BASE_DIR/opt/amc/static
		rm -rf $BASE_DIR/opt/amc/mailer
		rm -rf $BASE_DIR/etc/init.d

		mkdir -p $BASE_DIR/var/log
		mkdir -p $BASE_DIR/opt/amc
		mkdir -p $BASE_DIR/etc/amc

		cp -R build/static $BASE_DIR/opt/amc/
		mkdir -p $BASE_DIR/opt/amc/mailer
		cp -R mailer/templates $BASE_DIR/opt/amc/mailer/

		# build binary
		CGO_ENABLED=0 GOOS=$platform go build -a -tags "purego $edition" -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$version -X github.com/citrusleaf/amc/common.AMCEnv=$environ" -o $BASE_DIR/opt/amc/amc .

		# rpm systemd
		cp -f deployment/common/amc.service $BASE_DIR/opt/amc/
		fpm --rpm-os linux --after-install "deployment/common/systemd_after_install.sh" -f -s dir -t rpm -n "aerospike-amc-$edition" -v $version -C $BASE_DIR -m "$maintainer" --description "$description" --vendor "Aerospike" .
		mv aerospike-amc-${edition}-`echo $version | tr - _`-1.x86_64.rpm aerospike-amc-${edition}-`echo $version | tr - _`-1.x86_64.systemd.rpm
		rm $BASE_DIR/opt/amc/amc.service

		# rpm init.d
		mkdir -p $BASE_DIR/etc/init.d
		cp -f deployment/common/amc.rpm $BASE_DIR/etc/init.d/amc
		chmod +x $BASE_DIR/etc/init.d/amc
		fpm --rpm-os linux -f -s dir -t rpm -n "aerospike-amc-$edition" -v $version -C $BASE_DIR -m "$maintainer" --description "$description" --vendor "Aerospike" .

		# deb for init.d
		cp -f deployment/common/amc.deb $BASE_DIR/etc/init.d/amc
		chmod +x $BASE_DIR/etc/init.d/amc
		fpm -f -s dir -t deb -n "aerospike-amc-$edition" -v $version -C $BASE_DIR  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		## deb download need to be renamed from _ to -
		mv aerospike-amc-${edition}_${version}_amd64.deb aerospike-amc-${edition}-${version}_amd64.deb

		# deb for systemd
		rm -rf $BASE_DIR/etc/init.d
		cp -f deployment/common/amc.service $BASE_DIR/opt/amc/
		fpm --after-install "deployment/common/systemd_after_install.sh" -f -s dir -t deb -n "aerospike-amc-$edition" -v $version -C $BASE_DIR  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		## deb download need to be renamed from _ to -
		mv aerospike-amc-${edition}_${version}_amd64.deb aerospike-amc-${edition}-${version}_amd64.systemd.deb

		# zip, for all others with init.d
		mkdir $BASE_DIR/etc/init.d
		cp -f deployment/common/amc.other.sh $BASE_DIR/etc/init.d/amc
		chmod +x $BASE_DIR/etc/init.d/amc
		fpm -f -s dir -t tar -n "aerospike-amc-$edition" -v $version -C $BASE_DIR  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		gzip "aerospike-amc-$edition.tar"
		mv "aerospike-amc-$edition.tar.gz" "aerospike-amc-$edition-$version-linux.tar.gz"

		# zip, for all other with systemd
		rm -rf $BASE_DIR/etc/init.d
		cp -f deployment/common/amc.service $BASE_DIR/opt/amc/
		fpm -f -s dir -t tar -n "aerospike-amc-$edition" -v $version -C $BASE_DIR  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		gzip "aerospike-amc-$edition.tar"
		mv "aerospike-amc-$edition.tar.gz" "aerospike-amc-$edition-$version-linux.systemd.tar.gz"
		;;
	'darwin')
		BASE_DIR="deployment/release/darwin/amc"

		mkdir -p $BASE_DIR

		rm -rf $BASE_DIR/static
		rm -rf $BASE_DIR/mailer

		cp -R build/static $BASE_DIR/
		mkdir -p $BASE_DIR/mailer
		cp -R mailer/templates $BASE_DIR/mailer/

		# build binary
		CGO_ENABLED=0 GOOS=$platform go build -a -tags "purego $edition" -ldflags "-X github.com/citrusleaf/amc/common.AMCEdition=$edition -X github.com/citrusleaf/amc/common.AMCBuild=$build -X github.com/citrusleaf/amc/common.AMCVersion=$version -X github.com/citrusleaf/amc/common.AMCEnv=$environ" -o $BASE_DIR/amc .

		# zip
		sudo fpm --verbose -f -s dir -t tar -n "aerospike-amc-$edition" -v $version -C deployment/release/darwin  -m "$maintainer" --description "$description" --vendor "Aerospike" .
		gzip "aerospike-amc-$edition.tar"
		mv "aerospike-amc-$edition.tar.gz" "aerospike-amc-$edition-$version-darwin.tar.gz"
		;;
	*)
		echo "unrecognized platform ${platform}"
		exit 1
		;;
esac
