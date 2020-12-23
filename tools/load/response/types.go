package response

// Basic type struct
type Basic struct {
	Nodes      []string
	Namespaces []string
}

// Connect type struct
type Connect struct {
	ClusterID string `json:"cluster_id"`
	Status    string
}
