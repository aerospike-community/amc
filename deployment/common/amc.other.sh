#!/bin/sh

SIGNAL=${1:-status}

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

stop_amc(){
  status=$(check_amc_status)
  if [ $status -nq 0 ] ; then
      "${CMD} -signal stop"
  fi
}

case $SIGNAL in
  'start')
    start_amc()
    ;;
  'stop')
    stop_amc()
    ;;
  'status')
    check_amc_status()
    ;;
  *)
    echo "Unrecognized signal"
    exit 1
    ;;
esac