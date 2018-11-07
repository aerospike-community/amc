# move systemd startup
cp /opt/amc/amc.service /etc/systemd/system/
systemctl enable amc.service
