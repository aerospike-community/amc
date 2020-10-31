# Aerospike Management Console Release Notes

## 4.1.2 
Release Date: October 31, 2020

* Fix error messages in pre and post 5.1 becuase of the latency-latencies (https://github.com/aerospike-community/amc/issues/21).
* Convert use of Vendor packages to Go Modules.
* Update packacges and some cleanup.


## 4.1.1
Release Date: October 27, 2020

* Fix display bug when not enough values return to the latency graph, graph doesn't chart latencies (just total ops).
* Fix display bug where latency values could be displayed twice in the mouse hover legend sometimes.
* Change removal of values from the latency graph to use unix timestamp instead of local time.
* Add support for microsecond-histograms (5.1+).
* Reformat JS code for readability.


## 4.1.0
Release Date: October 21, 2020

* First community-lead release, no more CE and EE seperation (some EE features require EE server).
* Support asinfo latencies command in 5.1+, the old latency command was removed at 5.2.

## 4.0.27

Release Date: August 13, 2019

### Bug Fixes
Enterprise Only
* [TOOLS-1384] - (AMC) Console does not load with cluster nodes running version 4.6.0.2+ when security is enabled.

## 4.0.25

Release Date: June 4, 2019

### Improvements

Enterprise & Community Community
Show cluster name instead of seed in multi cluster view.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-1340] - (AMC) Disk and RAM column values display incorrectly.

## 4.0.24

Release Date: April 23, 2019

### Improvements

Enterprise & Community Community
* [TOOLS-834] - (AMC) Add missing "Cluster Integrity" column.
Enterprise Only
* [TOOLS-1307] - (AMC) XDR writes not showing on 4.5.1+ server releases.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-908] - (AMC) Fix broken user interface latency graphs.
* [TOOLS-1173] - (AMC) Spikes in the UDF, Batch Read, XDR Read and XDR Write graphs.
* [TOOLS-1279] - (AMC) Fix XSS vulnerability in Aerospike Management Console Portal.
* [TOOLS-1318] - (AMC) Shows spike across all the metrics/graphs when refreshing.
* [TOOLS-1319] - (AMC) Displays the incorrect count of objects.
* [TOOLS-1320] - (AMC) Re-evaluate AMC write totals.

## 4.0.22

Release Date: January 25, 2019

### Improvements

Enterprise & Community Community
* [TOOLS-1160] - (AMC) The command 'hist-dump' has been replaced with `histogram` and the parameters have also changed.
* [TOOLS-1161] - (AMC) Deprecated namespace level config: 'obj-size-hist-max'.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-1151] - (AMC) Tracking stats appears to be broken in AMC.
Enterprise Only
* [TOOLS-1248] - (AMC) Config Editor update one parameter only.
* [TOOLS-1258] - (AMC) Shows wrong number of clusters.

## 4.0.20

Release Date: November 20, 2018

### New Features

enterprise Enterprise & Community Community
* [TOOLS-1234] - (AMC) Ability to provide non email format as user in the alerting section of amc.conf.

### Bug Fixes

enterprise Enterprise & Community Community
* [TOOLS-977] - (AMC) 4.0.13 Latency tab does not work with CentOS Aerospike builds.
* [TOOLS-983] - (AMC) Security risk: Cluster password exposed in amc.log.
* [TOOLS-1165] - (AMC) Existing amc.conf is overwritten with default amc.conf.
Enterprise Only
* [TOOLS-1207] - (AMC) Would crash when loading System certificates.
* [TOOLS-1243] - (AMC) Does not show all nodes when connecting to TLS-enabled server version 4.3.1.4 and 4.3.1.3.

## 4.0.19

Release Date: May 17, 2018

If having modified the amc.conf file and wanting to keep these changes please make a backup of the amc.conf file before installing the new version of amc. After installing the new version of amc please replace the amc.conf file with the backup copy.

### Bug Fixes
Enterprise Only
* [TOOLS-1148] - (AMC) TLS cluster configuration not working in 4.0.17.

## 4.0.17

Release Date: April 6, 2018
If having modified the amc.conf file and wanting to keep these changes please make a backup of the amc.conf file before installing the new version of amc. After installing the new version of amc please replace the amc.conf file with the backup copy.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-1101] - (AMC) Allow login by a user without a password.
* [TOOLS-1120] - (AMC) Replication factor is reported as zero.

## 4.0.16

Release Date: March 13, 2018

If having modified the amc.conf file and wanting to keep these changes please make a backup of the amc.conf file before installing the new version of amc. After installing the new version of amc please replace the amc.conf file with the backup copy.

### Improvements

Enterprise & Community Community
* [TOOLS-1081] - (AMC) Display the "commit-to-device" setting in the namespace details.

## 4.0.15

Release Date: February 28, 2018
If having modified the amc.conf file and wanting to keep these changes please make a backup of the amc.conf file before installing the new version of amc. After installing the new version of amc please replace the amc.conf file with the backup copy.

### New Features

Enterprise & Community Community
* [TOOLS-839] - (AMC) Add incremental backup to advanced features.
* [TOOLS-895] - (AMC) Use systemd on EL7.
* [TOOLS-949] - (AMC) Support for alternate-access-address.
* [TOOLS-1011] - (AMC) Allow read-only access to statistics for user with no roles defined.
* [TOOLS-1030] - (AMC) Pre-configured clusters in amc.conf should be displayed in the AMC UI.
* [TOOLS-1036] - (AMC) Add feature to allow ignoring certificate flag when sending email.

### Improvements

enterprise Enterprise & Community Community
* [TOOLS-835] - (AMC) Use slash for delimiter of master and replica objects at namespace level.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-919] - (AMC) Fix TPS report when refresh rate set to 1 second.
* [TOOLS-920] - (AMC) Fix stopping/starting the AMC service.
* [TOOLS-921] - (AMC) Fix the Stop Write status in the display.
* [TOOLS-1055] - (AMC) Fix installation on OS X.
Enterprise Only
* [TOOLS-966] - (AMC) Display XDR arrows consistently across all browsers.

## 4.0.13

Release Date: June 14, 2017

If having modified the amc.conf file and wanting to keep these changes please make a backup of the amc.conf file before installing the new version of amc. After installing the new version of amc please replace the amc.conf file with the backup copy.

### New Features
Enterprise Only
* [TOOLS-929] - (AMC) Add ability to force TLS version.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-914] - (AMC) Further upgrade of Echo library to address undesired file access.

## 4.0.12

Release Date: June 1, 2017

Please use / upgrade to version 4.0.13 for security issue fix (TOOLS-914).


### Bug Fixes

Enterprise & Community Community
* [TOOLS-914] - (AMC) Upgrade Echo to revision 466d509e for commit d259f88 which allowed undesired file access. Thanks Thu Nguyen Dang.
* (AMC) Fixed potential negative free disk and memory values.

## 4.0.11

Release Date: March 21, 2017

Please use / upgrade to version 4.0.13 for security issue fix (TOOLS-914).

AMC 4.0 has been rewritten in Go to bring many performance and stability improvements. It is easier to deploy, snappier and can handle large Aerospike clusters. It contains some important new features as well as many bug fixes. For details, please see Upgrade to AMC 4.0


### New Features

Enterprise Only
* [TOOLS-780] - (AMC) Connect to a TLS enabled secure Aerospike cluster.
* (AMC) Configure emails to receive the Aerospike cluster alerts.
* (AMC) Persist notifications and show them even after you close your browser.
* (AMC) Configure clusters to be always monitored.

### Improvements
Enterprise Only
* [TOOLS-570] - (AMC) Support SSH-key based login for backup and restore.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-708] - (AMC) Charting related bugs have been fixed.
* (AMC) Some API have been altered to avoid fetching data per node to perform better on big clusters.
* (AMC) Many other little bugs have been fixed.

## 3.6.13

Release Date: October 20, 2016

### Improvements
Enterprise Only
* [TOOLS-709] - (AMC) It is possible now to show chart timestamps in the browser's Local Timezone. Go to settings to change it.

### Bug Fixes

Enterprise & Community Community
* (AMC) Fixes an issue where adding a node might crash a node.
* (AMC) Fixes an issue where incorrect data-in-memory attribute was shown for specific configurations.
* [TOOLS-758] - (AMC) Fixes an issue where AMC UI showed cluster size and visibility in wrong columns.
* [TOOLS-759] - (AMC) Fixes an issue where cluster names were not updated dynamically.

## 3.6.12

Release Date: October 7, 2016

### New Features

Enterprise & Community Community
* [TOOLS-719] - (AMC) Support for durable deletes and show tombstones for server v3.10+.
* [TOOLS-720] - (AMC) Supports Cluster Name for server v3.10+.
* [TOOLS-723] - (AMC) Query peer list from server and support IPv6 and DNS names for server v3.10+.

## 3.6.11

Release Date: August 18, 2016

### Bug Fixes

Enterprise & Community Community
* [TOOLS-713] - (AMC) Sets details not displayed in definition tab.

## 3.6.10.1

Release Date: August 3, 2016

### Bug Fixes

Enterprise & Community Community
* (AMC) Fixes a few alias names for server statistics.
Enterprise Only
* (AMC) Fixes multi-cluster view not working if empty DC stanza's configured.

## 3.6.10

Release Date: August 1, 2016

### New Features

Enterprise & Community Community
* (AMC) Adds new charts for monitoring the server throughput.

### Bug Fixes

Enterprise & Community Community
* (AMC) Can now handle partially upgraded clusters to server v3.9.0.
* (AMC) Fixes a few stability issues.
* (AMC) Fixes a few resource leak problems.
* (AMC) Fixes a few compatibility warnings with newer versions of Python.

## 3.6.9

Release Date: July 11, 2016

### New Features

Enterprise & Community Community
* (AMC) Adds compatibility with Aerospike server 3.9.0.

### Bug Fixes
Enterprise Only
* (AMC) Fixes an issue where XDR statistics were not queried correctly.
* (AMC) Fixes an issue where some scan stats were not shown correctly.

## 3.6.8.2

Release Date: June 21, 2016

### New Features
Enterprise Only
* (AMC) Ability to end the session and reconnect and login again.
* (AMC) Ability to rename clusters.
* (AMC) Ability to remove clusters from the session.
* (AMC) Multi-Cluster view is now deterministic in rendering the clusters.

### Bug Fixes
Community Only
* (AMC) Fixes an issue where AMC wouldn't recover from having no nodes in the cluster to connect to.

## 3.6.8.1

Release Date: April 15, 2016

### Bug Fixes
Enterprise Only
* (AMC) Support for XDR 3.8.0 (new statistic name for lag: xdr_timelag).

## 3.6.8

Release Date: March 24, 2016

### New Features

Enterprise & Community Community
* [TOOLS-557] - (AMC) Support private to public IP mapping.

### Bug Fixes
Enterprise Only
* [TOOLS-519] - (AMC) Use int-ext-ipmap from xdr config to discover cluster.
* [TOOLS-575] - (AMC) Handle changed command of get-dc-config.

## 3.6.6

Release Date: January 29, 2016

### New Features

Enterprise & Community Community
* [TOOLS-510] - (AMC) Collectinfo/Debug feature.
Enterprise Only
* [TOOLS-412] - (AMC) Support for key based login for AWS.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-510], * [TOOLS-412] - (AMC) Support for new migration statistics, supported by Aerospike Server 3.7.0 and higher.
* [TOOLS-547] - (AMC) Consistent reporting of Aerospike node uptime.
Enterprise Only
* [TOOLS-541] - (AMC) Support for XDR on port 3000 with security enabled.

## 3.6.5

Release Date: December 31, 2015

### New Features
Enterprise Only
* [TOOLS-234] - (AMC) Login credentials should be asked only once within a session.

### Bug Fixes

* [TOOLS-532] - (AMC) Secondary index bin is missing in AMC for Aerospike server 3.7.0.2 and higher.
Enterprise Only
* [TOOLS-57] - (AMC) Ansible installation should not be required for executing commands on localhost.
* [TOOLS-532] - (AMC) Secondary index bin is missing in AMC for Aerospike server 3.7.0.2 and higher.
* [TOOLS-522] - (AMC) AMC does not work with Aerospike server dev builds when security is turned ON.
* [TOOLS-527] - (AMC) AMC cluster view does not work with Aerospike server dev build when security is turned ON.
* [TOOLS-528] - (AMC) AMC does not show XDR stats.

## 3.6.4

Release Date: November 9, 2015

### New Features
Enterprise Only
* [TOOLS-284] - (AMC) Multi cluster view using cluster discovery supported from Aerospike server v3.6.0 and higher.

### Bug Fixes

Enterprise & Community Community
* [TOOLS-48] - (AMC) Bug fix in packaging for debian distribution.

## 3.6.3

Release Date: September 25, 2015

### New Features

Enterprise & Community Community
* [AER-2439] - (AMC) Enable log rotation for AMC logs.
* [AER-4425] - (AMC) Support Aerospike scan and batch changes for AMC Jobs page.

### Improvements

Enterprise & Community Community
* [AER-4428] - (AMC) AMC dashboard namespace UI improvements.
* [AER-4210] - (AMC) Remove 90% stop write indicator for disk.
* [AER-4295] - (AMC) Change AMC service status code.

### Bug Fixes

Enterprise & Community Community
* [AER-1893] - (AMC) Mapping NodeID of Aerospike along with NodeIP.
* [AER-2744] - (AMC) Better handling of AMC install failures.
* [AER-4352] - (AMC) Handling alpha-numeric build numbers for Aerospike server builds.
Enterprise Only
* [AER-3019] - (AMC) Handling service list with private and public ips.
* [AER-3570] - (AMC) Duplicate nodes displayed when node published private and public IP addresses.
* [AER-3750] - (AMC) Error handling when wrong port for XDR is provided.

## 3.6.2

Release Date: August 11, 2015

### New Features
Enterprise Only
* [AER-4055] - (AMC) Added support for data admin role.

### Improvements
Enterprise Only
* [AER-4150] - (AMC) Added support for node-id and node-ip mapping.

### Bug Fixes

Enterprise & Community Community
* [AER-4128] - (AMC) AMC installation issue when /etc and /opt folders are on different devices.
* [AER-3880] - (AMC) Switch cluster using old style a href and ajax issues.
Enterprise Only
* [AER-3881] - (AMC) AMC Enterprise Edition authorization error - cannot connect to server.

## 3.6.1

Release Date: June 17, 2015

### New Features

Enterprise & Community Community
* [AER-3698] - (AMC) Total and successful reads/writes without pointing on graph.
* [AER-3699] - (AMC) Better View of X Label in R/W TPS graphs.
Enterprise Only
* (AMC) Info commands.

### Bug Fixes

Enterprise & Community Community
* [AER-3606] - (AMC) Forum reported issues for AMC.
* [AER-3820] - (AMC) Automatic addition of node in dashboard.

## 3.6.0

Release Date: April 29, 2015

### New Features

Enterprise & Community Community
* [AER-3334] - (AMC) Cluster wide total and successful charts in Throughput section.
* [AER-3335] - (AMC) Customize which sections appear on the Dashboard by default.
* (AMC) Added simple statistics tracking.
Enterprise Only
* (AMC) Support for Role Management.

### Bug Fixes

Enterprise & Community Community
* [AER-3564] - (AMC) Gracefully handle situation where a node in the cluster goes down.
* [AER-3126] - (AMC) Fix some stats that were only shown for seed node rather then whole cluster.
* [AER-3289] - (AMC) Fix Mac OS installation error.
Enterprise Only
* (AMC) Fixed User Management Aerospike Compatibility.

## 3.5.4

Release Date: February 3, 2015

### Bug Fixes

Enterprise & Community Community
* [AER-3273] - (AMC) Fix for throughput shoot up issue.
Enterprise Only
* [AER-3278] - (AMC) Config Editor Bug.

## 3.5.2

Release Date: January 21, 2015

### Known Issues

Enterprise & Community Community
If there are no AMC sessions against a cluster for 30 mins or more, on resuming a session, AMC will show a straight line on the TPS graph joining the previous value and the latest value. This is until the polling resumes when the new session is established.

### New Features

Enterprise & Community Community
* (AMC) Improved UI for better usability.
* (AMC) Added Index and UDF management.

### Bug Fixes

* [AER-3006] - (AMC) Fix AMC showing RAM usage in weird numbers (cosmetic bug).
* (AMC) Implemented connection pooling.
Enterprise Only
* (AMC) Removed restriction of having 'sys-admin' role to login to AMC.

## 3.5.1

Release Date: December 16, 2014
Bug fix release.


### Bug Fixes
Enterprise Only
* [AER-3087] - (AMC) Fix for erroneous stats shown in AMC.

## 3.5.0

Release Date: November 25, 2014

### Known Issues
Enterprise Only
* [AER-3087] Erroneous stats (number of objects) shown in AMC. Fixed in version 3.5.1.

### New Features
Enterprise Only
* (AMC) User-Management: User with user-admin privileges now have the ability to manage other user's profiles such as updating roles and passwords.
* (AMC) Revamped UI components.
* (AMC) Performance Improvement: Implemented connection pooling.Support for Role Management.

### Bug Fixes

Enterprise & Community Community
* [AER-2848] - (AMC) Fix for Namespace RAM showing negative bytes.
* [AER-2904] - (AMC) Resolved issue of browser stuck in 'Setting up environment' mode on upgrading AMC version.

## 3.4.9

Release Date: October 21, 2014

### New Features
Enterprise Only
* (AMC) Multi-cluster feature: Ability to add and toggle between multiple clusters in the same user session.

### Bug Fixes
Enterprise Only
* [AER-2745] - (AMC) Fixed some installation failures.

## 3.4.7

Release Date: September 26, 2014

### New Features

Enterprise & Community Community
* [AER-2793] - (AMC) Add support for cluster sizes up to 50 nodes.
* [AER-2794] - (AMC) Move throughput graph data conversion logic to server for performance improvement on large clusters (> 16 nodes).

### Bug Fixes
Enterprise Only

* [AER-2791] - (AMC) Unable to handle IPv6 entries in hosts file.
* [AER-2792] - (AMC) Config_manager will not read config file each time get_update_interval is called.
* [AER-2790] - (AMC) Unable to load manage tab while AMC is setting up.
* [AER-2789] - (AMC) Node status showing off during high load even if asd is running.
* [AER-2788] - (AMC) In Aerospike without security build 'Unauthorized access' error message is coming while editing values in config editor in namespace and xdr section.
* [AER-2743] - (AMC) Fix AMC-Config Editor to dynamically get configuration entries.
* [AER-2801] - (AMC) Null gets appended in URL for first time in case of AMC restart.

## 3.4.6

Release Date: August 28, 2014

### New Features

Enterprise & Community Community
* (AMC) Added 'Select All' button.
Enterprise Only
* [AER-2633] - (AMC) Implemented time interval selection options for latency graph.
* (AMC) Support for beta security features and optional HTTPS support.

### Bug Fixes

Enterprise & Community Community
* [AER-2632] - (AMC) Throughput graph showing incorrect time if system time of AMC server is in UTC.
* (AMC) Performance improvements - Changed MIME type to application/json.

## 3.4.5

Release Date: July 18, 2014

### New Features

Enterprise & Community Community
* (AMC) Performance improvements - Merged CSS and JS files and implemented sprite for all images.
* [AER-2439] - (AMC) Enabled log rotation for AMC logs for all Linux distros. Log rotation is currently not supported on Mac.

### Bug Fixes

Enterprise & Community Community
* [AER-2559] - (AMC) Localhost/IP with space should be accepted as seed node in AMC.
* [AER-2407] - (AMC) Fix for issue where graphs froze when no network.
* [AER-2075], * [AER-2520] - (AMC) Segregated warnings from libraries during installation into separate file.
* [AER-2500] - (AMC) AMC Startup message compatibility on Amazon Linux EC2. For machines where OS cannot be detected, message is not applied any color.
* [AER-2501] - (AMC) Updated AMC footer link to point to new site pages. Added Help link.

## 3.4.3

Release Date: June 12, 2014

The Aerospike Management Console (AMC) Community Edition is a Web based tool to monitor/manage an Aerospike cluster. It provides live updates to the current status of a cluster:

* Dashboard
* Statistics
* Jobs
* Definitions

### New Features

enterprise Enterprise & Community Community
* (AMC) Merged node, namespace, XDR, Latency calls.
* (AMC) Statistics call only return updated values.


### Bug Fixes

Enterprise & Community Community
* [AER-2433] - (AMC) Updated service to support chkconfig on CentOS and other startup method on Debian and Ubuntu.
* [AER-2385] - (AMC) Converted Throughput graph time stamps in GMT.
* [AER-2344] - (AMC) Fixed issue when AMC is kept running for multiple days on different browsers.
* [AER-2345] - (AMC) Highlighted changing statistics fields.
* [AER-2291] - (AMC) AMC automatically adds nodes, when added from command prompt.
* [AER-2303] - (AMC) Changed Namespace UI transition on Dashboard.
* [AER-2293] - (AMC) Highlighted the Totals button to make it more user friendly.
* (AMC) Fixed gzip issue on CentOS. All images, CSS and Javascript files are now zipped, to reduce the size of the files.

Enterprise Only
* [AER-2363] - (AMC) Admin Console is always kept visible.
* [AER-2040] - (AMC) Fixed issue in Latency graph, when one node is down.

## 3.3.1

Release Date: April 16, 2014

The Aerospike Management Console (AMC) Enterprise Edition is a Web based tool to monitor/manage an Aerospike cluster. It provides live updates to the current status of a cluster:

* Dashboard with XDR
* Statistics
* Latency
* Jobs
* Definitions
* Admin module


### New Features
Enterprise Only
* (AMC) Desktop notifications for alerts.
* (AMC) Admin login no longer required to add/remove node from AMC.
* (AMC) Added total and successful read/write TPS in throughput graphs.
* (AMC) Option to view total throughput graph for all the selected nodes.
* (AMC) Added available percentage for disk namespaces in per node view and least available percentage in cluster wide view of namespace panel on dashboard.


### Bug Fixes
Enterprise Only
* (AMC) AMC version displayed in the footer.
* (AMC) Wider range of resolution support (above 360 px).
* (AMC) Bug fixes for throughput graph selection and replication factor mismatch alert retry mechanism.

