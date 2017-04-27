package controllers

import (
	"strconv"
	"strings"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/models"
)

func toSeedsMedia(conn *models.Connection) ([]*app.NodeSeed, error) {
	seeds := strings.Split(conn.Seeds, "\n")

	var res []*app.NodeSeed
	for _, seed := range seeds {
		seedFrags := strings.Split(seed, "\t")
		var seed *app.NodeSeed
		if len(seedFrags) == 2 {
			port, _ := strconv.Atoi(seedFrags[1])
			seed = &app.NodeSeed{Host: seedFrags[0], Port: port}
		} else if len(seedFrags) == 3 {
			port, _ := strconv.Atoi(seedFrags[2])
			seed = &app.NodeSeed{Host: seedFrags[0], Port: port, TLSName: &seedFrags[1]}
		} else {
			// return nil, errors.New("Error parsing seed values from the database")
			return []*app.NodeSeed{}, nil
		}
		res = append(res, seed)
	}

	return res, nil
}

func toConnectionMedia(conn *models.Connection) (*app.AerospikeAmcConnectionQueryResponse, error) {
	seeds, err := toSeedsMedia(conn)
	if err != nil {
		return nil, err
	}

	return &app.AerospikeAmcConnectionQueryResponse{
		ID:    conn.Id,
		Name:  conn.Label,
		Seeds: seeds,
	}, nil
}

func toConnectionMedias(conns []*models.Connection) ([]*app.AerospikeAmcConnectionQueryResponse, error) {
	var res []*app.AerospikeAmcConnectionQueryResponse
	for _, conn := range conns {
		qr, err := toConnectionMedia(conn)
		if err != nil {
			return nil, err
		}

		res = append(res, qr)
	}

	return res, nil
}

func toConnection(ctx *app.SaveConnectionContext) *models.Connection {
	var seeds []string
	// for _, s := range ctx.Payload.Seeds {
	// 	if s.TLSName == nil {
	// 		seeds = append(seeds, strings.Join([]string{s.Host, strconv.Itoa(s.Port)}, "\t"))
	// 	} else {
	// 		seeds = append(seeds, strings.Join([]string{s.Host, *s.TLSName, strconv.Itoa(s.Port)}, "\t"))
	// 	}
	// }

	conn := &models.Connection{
		Label: ctx.Payload.Name,
	}

	if len(seeds) > 0 {
		conn.Seeds = strings.Join(seeds, "\n")
	}

	if ctx.Payload.ID != nil {
		conn.Id = *ctx.Payload.ID
	}

	return conn
}
