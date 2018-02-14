# move systemd startup
mv /opt/amc/amc.service /etc/systemd/system/
systemctl enable amc.service
