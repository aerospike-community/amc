package response

type Basic struct {
	Nodes      []string
	Namespaces []string
}

type Connect struct {
	ClusterID string `json:"cluster_id"`
	Status    string
}
