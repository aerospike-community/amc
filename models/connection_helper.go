package models

import (
	"strconv"
	"strings"

	as "github.com/aerospike/aerospike-client-go"

	"github.com/citrusleaf/amc/common"
)

func toHosts(s string) []*as.Host {
	seeds := strings.Split(s, "\n")

	var res []*as.Host
	for _, seed := range seeds {
		seedFrags := strings.Split(seed, "\t")
		var seed *as.Host
		if len(seedFrags) == 2 {
			port, _ := strconv.Atoi(seedFrags[1])
			seed = &as.Host{Name: seedFrags[0], Port: port}
		} else if len(seedFrags) == 3 {
			port, _ := strconv.Atoi(seedFrags[2])
			seed = &as.Host{Name: seedFrags[0], Port: port}
			if common.AMCIsEnterprise() {
				seed.TLSName = seedFrags[1]
			}
		} else {
			// don't do anything
			continue
		}
		res = append(res, seed)
	}

	return res
}
