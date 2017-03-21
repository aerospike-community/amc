---
title: Upgrade to AMC 4.0
description: Learn how to upgrade to AMC 4.0
---

Upgrade to AMC 4.0 and above from previous versions.

### Debian Based Systems like Debian, Ubuntu

1. uninstall the older amc version 
```
sudo dpkg -P aerospike-amc-<edition>
```

2. install AMC 
```
sudo dpkg -i aerospike-amc-<edition>-<version>.deb
```

3. start AMC
```
sudo service amc start
```

3. stop AMC
```
sudo service amc stop
```

### RPM Based Systems like CentOS, Red Hat
1. uninstall the older amc version
```
sudo rpm -e aerospike-amc-<edition>
```

2. install dependencies
```
sudo yum install -y initscripts
```

3. install AMC 
```
sudo rpm -i aerospike-amc-<edition>-<version>.rpm
```

4. start AMC
```
sudo service amc start
```

5. stop AMC
```
sudo service amc stop
```

### zip installation
1. install AMC
```
tar -xvf aerospike-amc-<edition>-<version>.tar.gz -C /
```

2. start AMC
```
sudo /etc/init.d/amc start
```

3. stop AMC
```
sudo /etc/init.d/amc stop
```

### MacOS

1. install AMC
```
sudo tar -xvf aerospike-amc-<edition>-<version>-darwin.tar.gz -C /Library
```

2. start AMC
```
sudo launchctl load  /Library/LaunchAgents/com.aerospike.amc.plist
```

3. stop AMC
```
sudo launchctl unload  /Library/LaunchAgents/com.aerospike.amc.plist
```

