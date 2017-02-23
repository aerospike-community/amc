#!/bin/sh

PROJECT="/opt/amc"
PIDFILE="/tmp/amc.pid"
CONFIG="/etc/amc/amc.conf"

CMD="${PROJECT}/amc -daemon -config-file=${CONFIG}"
port="8081"
check_amc_status(){
    status=1
    if [ -z "`ps aux | grep amc | grep -v grep`" ]; then
        status=0
    fi
    echo $status
}

start_amc(){
  status=$(check_amc_status)
  if [ $status -eq 0 ] ; then
      rm -f $PIDFILE
      ${CMD}
  fi
}

echo 0 > $PROJECT/stop_signal
finish=0
while [ $finish -eq 0 ]
do
   $(start_amc)
   sleep 2
   finish=$(cat $PROJECT/stop_signal)
done
