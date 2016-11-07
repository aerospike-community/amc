package observer

import (
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

type observerT struct {
	clusters []*cluster
	mutex    sync.Mutex

	notifyCloseChan chan struct{}
}

func New() *observerT {
	o := &observerT{}
	go o.observe()

	return o
}

func (o *observerT) stop() {
	close(o.notifyCloseChan)
}

func (o *observerT) updateClusters() {
	o.mutex.Lock()
	defer o.mutex.Unlock()

	wg := new(sync.WaitGroup)
	wg.Add(len(o.clusters))
	for _, c := range o.clusters {
		// No need to manage panics here, since update codes are
		// running in an isolated go routine
		go c.update(wg)
	}
	wg.Wait()
}

func (o *observerT) observe() {
	// update as soon as initiated once
	o.updateClusters()

	for {
		select {

		case <-time.After(time.Second * 5):
			o.updateClusters()

		case <-o.notifyCloseChan:
			o.mutex.Lock()
			for _, c := range o.clusters {
				go c.close()
			}
			o.clusters = nil
			o.mutex.Unlock()

			return
		}
	}
}

func (o *observerT) appendCluster(cluster *cluster) {
	o.mutex.Lock()
	defer o.mutex.Unlock()

	o.clusters = append(o.clusters, cluster)
}

func (o *observerT) Register(policy *as.ClientPolicy, host string, port uint16) error {
	client, err := as.NewClientWithPolicy(policy, host, int(port))
	if err != nil {
		return err
	}

	o.appendCluster(newCluster(client))
	o.updateClusters()

	return nil
}
