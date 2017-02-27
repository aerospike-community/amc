

## Configure
There are multiple sections that need to be configured. Each section begins on a new line with the section name in square brackets. All config values which are not integers need to be specified within double quotes

### AMC configs 
Configs related to the runtime behaviour of AMC
```
[AMC]
update_interval = 5
certfile = "/home/amc/cert.pem"
keyfile = "/home/amc/key.pem"
database = "/home/amc/amc.db"
bind = "localhost:8081"
loglevel = "info"
errorlog = "/home/amc/amc.log"
static_dir = "/home/amc/static"
timeout = 150
cluster_inactive_before_removal = 1800
```


* update_interval- the time interval (in seconds) in which AMC should capture statitstics for the clusters that AMC is monitoring
```
update_interval = 5
```


* certfile, keyfile (optional)  - the public/private key pair to run AMC in secure mode. The files must contain PEM encoded data. The certificate file may contain intermediate certificates following the leaf certificate to form a certificate chain.
```
certfile = "/home/amc/cert.pem"
keyfile = "/home/amc/key.pem"
```

* database  - the file which will be used as a database to store AMC book keeping information across restarts.
```
database = "/home/amc/amc.db"
```
* bind - the IP, Port which AMC should bind to 
```
bind = "localhost:8081"
```
* loglevel  - the level of detail at which AMC should log messages.
```
loglevel = "info"
```
Valid values are debug, warn, error, info.

* errorlog - the file to which the logs will be written to
```
errorlog = "/home/amc/amc.log"
```
* chdir -  ??? could not figure this out
* static_dir  - the directory which contains the static resources like css, html, js files.
```
static_dir = "/home/amc/static"
```
* timeout  - ??? could not find its use in the code
```
timeout = 150
```
* cluster_inactive_before_removal (seconds) - if the user has not requested any statistics for a cluster for more than  cluster_inactive_before_removal seconds  then AMC stops monitoring the cluster. A value <= 0 implies the clusters will  never be removed
```
cluster_inactive_before_removal = 1800
```

### Cluster Configs 
List of clusters that will always be monitored by AMC.
```
[amc.clusters]
host = "192.168.121.121"
port = 3000
tls_name = "clusteronetls"
user = "admin"
password = "admin"
alias = "clusterone"

host = "192.168.121.122"
port = 3000
tls_name = "clustertwotls"
user = "admin"
password = "admin"
alias = "clustertwo"
```

A newline separates the clusters. Each cluster has the following parameters

* host - the host of the cluster
```
host = "192.168.121.121"
```

* port - the port of the cluster
```
port = 3000
```
* user, password (optional) - the user name, password for a secure cluster
```
user = "admin"
password = "admin"
```
* alias (optional) - the alias of the cluster in AMC
```
alias = "clusterone"
```
* tls_name (optional) - the name of the tls certificate used for secure connections.  Warning - the tls certificate needs to be part of the system cert pool or needs to be specified as a config to AMC
```
tls_name = "clusteronetls"
```

### Mail Configs
Configuration used by AMC to send out alert emails.
```
[mailer]
template_path = "/home/amc/mailer/templates"
host = "smtp.outlook.com"
port = 587
user = "user"
password = "password"
send_to = ["monitorone@gmail.com", "monitortwo@yahoo.com"]
```


* template_path - the directory containing the templates for the mails
```
template_path = "/home/amc/mailer/templates"
```

* host - the smtp host name
```
host = "smtp.outlook.com"
```

* port - the port of the smtp server
```
port = 587
```

* user, password - the user name and password at the smtp host
```
user = "user"
password = "password"
```

* send_to - the list of users to send email alerts to
```
send_to = ["monitorone@gmail.com", "monitortwo@yahoo.com"]
```

### HTTP Basic Authentication 
The basic authentication credentials that AMC should use
```
[basic_auth]
user = "user"
password = "user123"
```

* user, password - the user name, password to use for basic authentication
```
[basic_auth]
user = "user"
password = "user123"
```


### TLS Server Certificates [TLS]
The set of root certificate authorities that AMC uses when verifying server certificates

* server_cert_pool - the list of root certificate authorities that AMC uses when verifying server certificates
```
server_cert_pool = ["/home/amc/certone.pem", "home/amc/certtwo.pem"]
```

### TLS Client Certificates [tls.client_certs]
??? could not figure this out
