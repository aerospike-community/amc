---
title: Configure AMC
description: Learn how to configure the Aerospike Management Console.
---

AMC uses a single configuration file located at /etc/amc/amc.conf.
The configuration file follows the  [TOML](https://github.com/toml-lang/toml) syntax.

The configuration is divided into six contexts. 
```
[AMC]              // (Required) Configuration related to the runtime behaviour of AMC

[amc.clusters]     // (Optional) List of clusters that will always be monitored by AMC

[mailer]           // (Optional) Configuration used by AMC to send out alert emails

[basic_auth]       // (Optional) The HTTP Basic Authentication credentials for AMC to use

[TLS]              // (Optional) The set of root certificate authorities that AMC uses when verifying server certificates

[tls.client_certs] // (Optional) ???
```

### Runtime Configurations 
These configurations define the runtime behaviour of AMC.
```
[AMC]
update_interval                 = 5
certfile                        = "/home/amc/cert.pem"  // optional
keyfile                         = "/home/amc/key.pem"   // optional 
database                        = "/home/amc/amc.db"
bind                            = ":8081"
loglevel                        = "info"
errorlog                        = "/home/amc/amc.log"
chdir                           = "/home/amc"
static_dir                      = "/home/amc/static"
timeout                         = 150
cluster_inactive_before_removal = 1800
```

*update_interval* - the time interval (in seconds) in which AMC should capture statitstics for the clusters that AMC is monitoring
```
update_interval = 5
```

*certfile, keyfile* (optional)  - the public/private key pair to run AMC in https mode. The files must contain PEM encoded data. The certificate file may contain intermediate certificates following the leaf certificate to form a certificate chain.
```
certfile = "/home/amc/cert.pem"
keyfile  = "/home/amc/key.pem"
```

*database*  - the file which will be used to store AMC book keeping information across restarts
```
database = "/home/amc/amc.db"
```

*bind* - the port which AMC should bind to 
```
bind = ":8081"
```

*loglevel*  - the level of detail at which AMC should log messages. One of
  debug, warn, error, info.
```
loglevel = "info" // one of debug, warn, error, info
```

*errorlog* - the file to which AMC will write the logs to
```
errorlog = "/home/amc/amc.log"
```

*chdir* -  the working directory of AMC
```
chdir = "/home/amc"
```

*static_dir*  - the directory which contains the static resources like css, html, js files.
```
static_dir = "/home/amc/static"
```

*timeout*  - ??? could not find its use in the code
```
timeout = 150
```

*cluster_inactive_before_removal* - if the user has not requested any statistics for a cluster for more than  *cluster_inactive_before_removal* seconds  then AMC stops monitoring the cluster. A value <= 0 implies the clusters will  never be removed
```
cluster_inactive_before_removal = 1800
```

### Cluster Configuration 
This configuration is *optional*.

List of Aerospike clusters that are always monitored by AMC.
```
[amc.clusters]

[clusterone] // unused
host     				= "192.168.121.121"         
port     				= 3000
tls_name 				= "clusteronetls"   // optional
user     				= "admin"           // optional
password 				= "admin123"        // optional 
alias    				= "clusterone"      // optional
use_services_alternate 	= true      		// optional

[clustertwo] // unused
host     				= "192.168.121.122"
port     				= 3000
tls_name 				= "clustertwotls"   // optional
user     				= "admin"           // optional
password 				= "admin123"        // optional 
alias    				= "clustertwo"      // optional
use_services_alternate 	= false      		// optional
```

Each cluster has the following configurations

*host, port* - the IP, port of a node in the Aerospike cluster
```
host = "192.168.121.121"
port = 3000
```

*user, password* (optional) - the user name, password for an *access
controlled* Aerospike cluster
```
user     = "admin"
password = "admin123"
```

*alias* (optional) - the alias of the Aeorspike cluster in AMC
```
alias = "clusterone"
```

*tls_name* (optional) - the name of the tls certificate used for secure connections.  
Warning - the tls certificate needs to be part of the system cert pool or needs 
to be specified as a configuration to AMC
```
tls_name = "clusteronetls"
```

*use_services_alternate* (optional) - Allows the use of services_alternate on the
server to be able to connect from a public netword to the cluster.
```
use_services_alternate = true
```

### Mail Configuration 
This configuration is *optional* and available only in the enterprise edition.

Configuration used by AMC to send out email alerts for the monitored clusters.

```
[mailer]
template_path       = "/home/amc/mailer/templates"
host                = "smtp.outlook.com"
port                = 587
user                = "user"
password            = "user123"
send_to             = ["monitorone@gmail.com", "monitortwo@yahoo.com"]
accept_invalid_cert = false
```


*template_path* - the directory containing the templates for the mails
```
template_path = "/home/amc/mailer/templates"
```

*host, port* - the host name and port of the smtp server
```
host = "smtp.outlook.com"
port = 587
```

*user, password* - the user name and password at the smtp server
```
user     = "user"
password = "user123"
```

*send_to* - the list of emails to send out alerts to
```
send_to = ["monitorone@gmail.com", "monitortwo@yahoo.com"]
```

### HTTP Basic Authentication
This configuration is *optional*.

The basic authentication credentials that AMC should use
```
[basic_auth]
user     = "user"
password = "user123"
```

*user, password* - the user name, password to use for HTTP Basic Authentication
```
[basic_auth]
user     = "user"
password = "user123"
```

### TLS Server Certificates 
This configuration is *optional* and available only in the enterprise edition.

The set of root certificate authorities that AMC uses when verifying server certificates

*server_cert_pool* - the list of root certificate authorities that AMC uses when verifying server certificates
```
[TLS]
server_cert_pool = ["/home/amc/certone.pem", "home/amc/certtwo.pem"]
```

### TLS Client Certificates
This configuration is *optional* and available only in the enterprise edition.
```
[tls.client_certs]
```
??? could not figure this out

