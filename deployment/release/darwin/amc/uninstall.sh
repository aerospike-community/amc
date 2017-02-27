#/bin/sh

if [ `id -u` -ne 0 ] ; then
    echo "This script should be run as root only"
    exit 1
fi

set +e

launchctl unload /Library/LaunchAgents/com.aerospike.amc.plist

rm -rf /Library/amc
rm -rf /Library/Logs/amc
rm -rf /Library/LaunchAgents/com.aerospike.amc.plist

echo "AMC was uninstalled successfully."
