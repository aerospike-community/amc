package main

import (
	"fmt"

	as "github.com/aerospike/aerospike-client-go"
)

func main() {
	clnt, err := as.NewClient("ubvm", 3000)
	if err != nil {
		panic(err)
	}

	regTsk, err := clnt.RegisterUDF(nil, []byte(udf), "cv.lua", as.LUA)
	if err != nil {
		panic(err)
	}

	<-regTsk.OnComplete()

	fmt.Println("1=================================================================")

	k, _ := as.NewKey("test", "skill", "1")

	if _, err := clnt.Execute(nil, k, "cv", "add", as.NewValue("b"), as.NewValue("k"), as.NewValue(1)); err != nil {
		panic(err)
	}

	sets, err := clnt.ScanAll(nil, "test", "skill")
	if err != nil {
		panic(err)

	}

	rec, err := clnt.Get(nil, k)
	if err != nil {
		panic(err)
	}
	fmt.Printf("%#v\n", rec.Bins)

	fmt.Println("2=================================================================")
	for res := range sets.Results() {
		if res.Err != nil {
			panic(res.Err)
		} else {
			_, err = clnt.Delete(nil, res.Record.Key)
			if err != nil {
				panic(err)
			}
		}
	}

	fmt.Println("3=================================================================")
	if _, err := clnt.Execute(nil, k, "cv", "add", as.NewValue("b"), as.NewValue("k"), as.NewValue(1)); err != nil {
		panic(err)
	}

	fmt.Println("4=================================================================")
	if _, err := clnt.Execute(nil, k, "cv", "remove", as.NewValue("b"), as.NewValue("k"), as.NewValue(1)); err != nil {
		panic(err)
	}

	rec, err = clnt.Get(nil, k)
	if err != nil {
		panic(err)
	}
	fmt.Printf("%#v\n", rec.Bins)

	fmt.Println("5=================================================================")
	sets, err = clnt.ScanAll(nil, "test", "skill")
	if err != nil {
		panic(err)

	}
	for res := range sets.Results() {
		if res.Err != nil {
			panic(res.Err)
		} else {
			_, err = clnt.Delete(nil, res.Record.Key)
			if err != nil {
				panic(err)
			}
		}
	}
}

const udf = `
function add(rec, bin, key, value)
	if not aerospike:exists(rec) then
		--create record
		local m1 = map()
		local m2 = map()
		m2[value] = key

		m1[key] = m2			-- set map to map
		rec[bin] = m1		-- set map to record
		--create record
		return aerospike:create(rec)
	end

	--record existed, let's see if key exists
	local m1 = rec[bin]		--get map
	local m2 = m1[key]		--get second map

	--did list already exist?
	if m2 == nil then
		m2 = map() 		--map didn't exist yet, let's create it
	end
	local doesExist = m2[value]
	if doesExist ~= nil then
		return 0 --value already existed, no need to update record
	end

	m2[value] 	= key
	--done setting values, let's store information back to set
	m1[key] 		= m2		--map back to map
	rec[bin] 	= m1	--map back to record

	return aerospike:update(rec) --..and update aerospike :)
end

--remove from map[]map[]
function remove(rec, bin, key, value)
	if not aerospike:exists(rec) then
		return 0 --record does not exist, cannot remove so no error
	end

	local m1 = rec[bin]
	local m2 = m1[key]
	if m2 == nil then
		return 0 --key does not exist, cannot remove
	end

	--remove key from map
	local doesExist = m2[value]
	if doesExist == nil then
		return 0 --value does not exist
	end

	map.remove(m2, value) --remove value from map
	--done, let's update record with modified maps
	m1[key] 		= m2 --back to map
	rec[bin]		= m1 --back to record

	return aerospike:update(rec) --and update!
end
`
