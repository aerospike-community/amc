#!/bin/sh

# this file generates code

set -x
set -e

cd $GOPATH/src/github.com/citrusleaf/amc

mv vendor _vendor

# generate code

rm -rf app
# rm -rf client
rm -rf swagger
# rm -rf tool

rm -rf temp
mkdir -p temp
goagen bootstrap -d github.com/citrusleaf/amc/api_design -o temp

mv temp/app .
# mv temp/client/ .
mv temp/swagger .
# mv temp/tool/ .

mv _vendor vendor
