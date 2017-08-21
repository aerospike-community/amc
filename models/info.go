package models

func ttlInfoCmd(namespace string) string {
	return "hist-dump:ns=" + namespace + ";hist=ttl"
}

func objszInfoCmd(namespace string) string {
	return "hist-dump:ns=" + namespace + ";hist=objsz"
}
