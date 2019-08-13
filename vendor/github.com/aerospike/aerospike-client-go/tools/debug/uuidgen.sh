#!/bin/bash
for i in `seq 1 1000000`;
do
    echo $(uuidgen) >> keys
done  
