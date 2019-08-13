package main

import (
	"fmt"
	"regexp"
)

// var myExp = regexp.MustCompile(`(?P<generation>\d+),(?P<port>\d+)(,)*`)

var myExp1 = regexp.MustCompile(`(?P<generation>\d+),(?P<port>\d+)(?P<peer_list>.*)`)

// var myExp2 = regexp.MustCompile(`(,\[(?P<node_name>(^,)+)?,(?P<tls_name>(^,)+)?,\[(?P<peers>(\[.+\]|.+)(:(?P<peer_port>\d{1,5}))?)*\]\])*`)
var myExp2 = regexp.MustCompile(`(,\[(?P<node_name>(^,)*),(?P<tls_name>(^,)*),\[(\[(^\])+\] | (^\])*)\]\])*`)

func main() {
	match := myExp1.FindStringSubmatch("1234567,3000,[n1,t1,[192.168.4.10, 192.168.3.10]],[n2,t2,[[2018::0001]:4000]],[n3,t3,[foo1.aerocluster.com]],[n4,t4,[foo2.aerocluster.com:5000]]")
	// match := myExp.FindStringSubmatch("1234567,3000,[n1,tls1,[192.168.4.10, 192.168.3.10:3010]]")
	result := make(map[string]string)
	//	fmt.Println(match)
	for i, name := range myExp1.SubexpNames() {
		fmt.Println(name, "=>", match[i])
		result[name] = match[i]
	}

	peers := result["peer_list"]
	fmt.Println(">>>>", peers)
	// for _, peer := range peers {
	match = myExp2.FindStringSubmatch(peers)
	fmt.Println("=>", match)

	// for i, name := range myExp2.SubexpNames() {
	// 	fmt.Println(name, "=>", match[i])
	// 	// result[name] = match[i]
	// }
	// }
}
