#!/bin/bash

PROJECT="/opt/amc"
PIDFILE="/tmp/amc.pid"
CONFIG="/etc/amc/amc.conf"

CMD="${PROJECT}/amc -config-file=${CONFIG}"

# Fill out conffile with above values
if [ -f /etc/amc/amc.template.conf ]; then
        envsubst < /etc/amc/amc.template.conf > ${CONFIG}
fi

check_amc_status(){
    status=1
    if [ -z "`ps aux | grep /opt/amc/amc | grep -v grep`" ]; then
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

if [ "$1" = 'amc' ]; then
    start_amc
fi

# the command isn't amc so run the command the user specified
exec "$@"