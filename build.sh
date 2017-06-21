rm -rf vendor
goagen app -d github.com/citrusleaf/amc/api_design
git checkout vendor
./run.sh
