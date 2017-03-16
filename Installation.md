# Debian Based Systems 

1. uninstall the older amc version 
* community
```
sudo dpkg -P aerospike-amc-community
```
* enterprise
```
sudo dpkg -P aerospike-amc-enterprise
```

2. download AMC 4.0 from the repositories 
_TODO_

3. install AMC 4.0 on the machine
* community
```
sudo dpkg -i aerospike-amc-community.deb
```
* enterprise
```
sudo dpkg -i aerospike-amc-enterprise.deb
```

4. run amc
* community
```
sudo service amc start
```
* enterprise
```
sudo service amc start
```


# RPM Based Systems
1. uninstall the older amc version
* community
```
sudo rpm -e aerospike-amc-community
```
* enterprise
```
sudo rpm -e aerospike-amc-enterprise
```

2. download the AMC 4.0 from the repositories 
_TODO_

 It is dependent on systemd and initscripts
_TODO_ systemd
```
sudo yum install -y initscripts
```

3. install AMC 4.0 on the machine
* community
```
sudo rpm -i aerospike-amc-community.rpm
```
* enterprise
```
sudo rpm -i aerospike-amc-enterprise.rpm
```
4. run AMC 4.0 on machine
* community
```
sudo service amc start
```
* enterprise
```
sudo service amc start
```

# zip based (works on debian, centos, opensuse, arhclinux and fedora)
1. download the AMC 4.0 zip version from the repository
_TODO_

2. install AMC 4.0 on the machine
* community
```
tar -xvf aerospike-amc-community.tar.gz -C /
```
* enterprise
```
tar -xvf aerospike-amc-enterprise.tar.gz -C /
```

3. run amc
* community
```
sudo /etc/init.d/amc start
```
* enterprise
```
sudo /etc/init.d/amc start
```

# mac _TODO_ 
