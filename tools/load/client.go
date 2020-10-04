package load

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"math/rand"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"sync"

	"github.com/aerospike-community/amc/tools/load/response"
)

var BaseURL string

type Client struct {
	IP       string
	Port     string
	Username string
	Password string
	TLSName  string

	done       chan interface{}
	client     http.Client
	clusterID  string
	nodes      []string
	namespaces []string
	nerr       int
}

func (c *Client) Connect() error {
	jar, err := cookiejar.New(nil)
	if err != nil {
		return err
	}

	c.client = http.Client{
		Jar: jar,
	}

	v := url.Values{}
	v.Set("seed_node", c.IP+":"+c.Port)
	v.Set("username", c.Username)
	v.Set("password", c.Password)
	v.Set("tls_name", c.TLSName)

	resp, err := c.client.PostForm(BaseURL+"get-cluster-id", v)
	if err != nil {
		return err
	}

	var buf bytes.Buffer
	buf.ReadFrom(resp.Body)

	var b response.Connect
	err = json.Unmarshal(buf.Bytes(), &b)
	if err != nil {
		return err
	}

	if b.Status == "failure" {
		return errors.New("Failed to connect to " + c.IP + ":" + c.Port)
	}
	log.Println(buf.String())

	c.clusterID = b.ClusterID
	return nil
}

func (c *Client) Start(wg *sync.WaitGroup) {
	wg.Add(1)
	go c.makeRequests(wg)
}

func (c *Client) Stop() {
	c.done <- "stop"
}

func (c *Client) makeRequests(wg *sync.WaitGroup) {
	for {
		select {
		case <-c.done:
			wg.Done()
			return
		default:
			c.makeAnyRequest()
			if c.nerr > 100 {
				log.Printf("cluster %s:%s %s stop : too many errors", c.IP, c.Port, c.clusterID)
				wg.Done()
				return
			}
		}
	}
}

func (c *Client) concatNodes() string {
	return strings.Join(c.nodes[:], ",")
}

func (c *Client) concatNS() string {
	return strings.Join(c.namespaces[:], ",")
}

func (c *Client) makeAnyRequest() {
	switch rand.Intn(30) {
	case 0:
		c.get("alerts?last_id=0")
	case 1:
		c.get("nodes/" + c.concatNodes())
	case 2:
		c.get("namespaces/" + c.concatNS() + "?nodes=" + c.concatNodes())
	case 3:
		c.get("xdr/3004/nodes/" + c.concatNodes())
	case 4:
		c.get("throughput_history")
	case 5:
		c.get("throughput")
	case 6:
		if len(c.nodes) > 0 {
			var i = rand.Intn(len(c.nodes))
			c.get("nodes/" + c.nodes[i] + "/allstats?type=all")
		}
	case 7:
		if len(c.nodes) > 0 {
			var i = rand.Intn(len(c.nodes))
			c.get("nodes/" + c.nodes[i] + "/allstats?type=updated")
		}
	case 8:
		c.get("namespaces/test/sindexes")
	case 9:
		c.get("namespaces/test/sets")
	case 10:
		// c.get("namespaces/test/storage")
		// c.get("namespaces/test/storage")
	case 11:
		c.get("udfs")
	case 12:
		c.get("nodes/" + c.concatNodes() + "/jobs?offset=0&limit=1000")
	case 13:
		c.get("nodes/" + c.concatNodes() + "/latency_history")
	case 14:
		c.get("latency/" + c.concatNodes())
	case 15:
		if len(c.nodes) > 0 {
			var i = rand.Intn(len(c.nodes))
			c.get("nodes/" + c.nodes[i] + "/allconfig")
		}
	default:
		c.Basic()

	}
}

func (c *Client) Basic() {
	resp, err := c.client.Get(c.toURL("basic"))
	if resp != nil && resp.Body != nil {
		defer resp.Body.Close()
	}

	if err != nil {
		c.nerr++
		return
	}

	var buf bytes.Buffer
	buf.ReadFrom(resp.Body)

	var b response.Basic
	err = json.Unmarshal(buf.Bytes(), &b)
	if err != nil {
		log.Println("error in call basic ", err.Error())
		return
	}

	c.nodes = b.Nodes
	c.namespaces = b.Namespaces
}

func (c *Client) get(url string) {
	resp, err := c.client.Get(c.toURL(url))
	if resp != nil && resp.Body != nil {
		ioutil.ReadAll(resp.Body)
		defer resp.Body.Close()
	}
	if err != nil {
		log.Println(err)
		c.nerr++
	}

	// var buf bytes.Buffer
	// buf.ReadFrom(resp.Body)
	// log.Println("*******************\n", url, "\n", buf.String())
	return
}

func (c *Client) toURL(url string) string {
	return BaseURL + c.clusterID + "/" + url
}
