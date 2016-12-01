// Copyright 2013-2016 Aerospike, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package rrd

import (
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	"testing"

	"github.com/aerospike/aerospike-console/common"
)

func TestRRD(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "RRD Suite")
}

var _ = Describe("Stats Bucket", func() {

	It("must Add the first values correctly", func() {
		bucket := NewBucket(5, 10, true)
		Expect(bucket.LastValue()).To(BeNil())

		tm1 := time.Now().Unix()
		val1 := float64(1)
		bucket.Add(tm1, val1)
		// fmt.Printf("%#v\n", *bucket)
		Expect(bucket.LastValue()).To(BeNil())

		tm2 := tm1 + 5
		val2 := float64(2)
		bucket.Add(tm2, val2)

		// fmt.Printf("%#v\n", *bucket)

		expectedTm2 := tm1 + 5
		expectedVal2 := float64(1) / 5 // delta / resolution
		Expect(*bucket.LastValue()).To(Equal(*common.NewSinglePointValue(&expectedTm2, &expectedVal2)))

		tm3 := tm2 + 5
		val3 := float64(7)
		bucket.Add(tm3, val3)

		// fmt.Printf("%#v\n", *bucket)

		expectedTm3 := tm2 + 5
		expectedVal3 := float64(5) / 5 // delta / resolution
		Expect(*bucket.LastValue()).To(Equal(*common.NewSinglePointValue(&expectedTm3, &expectedVal3)))

		// skip two slots
		tm4 := tm3 + 15
		val4 := float64(22)
		bucket.Add(tm4, val4)

		// fmt.Printf("%#v\n", *bucket)

		expectedTm4 := tm3 + 15
		expectedVal4 := float64(15) / (3 * 5) // delta / (empty ticks * resolution)
		Expect(*bucket.LastValue()).To(Equal(*common.NewSinglePointValue(&expectedTm4, &expectedVal4)))

		// check inside values
		expectedTm4_1 := tm3 + 5
		expectedTm4_2 := tm3 + 10
		Expect(bucket.ValuesSince(time.Unix(tm1-1, 0))).To(Equal([]*common.SinglePointValue{
			common.NewSinglePointValue(&expectedTm2, &expectedVal2),
			common.NewSinglePointValue(&expectedTm3, &expectedVal3),
			common.NewSinglePointValue(&expectedTm4_1, &expectedVal4),
			common.NewSinglePointValue(&expectedTm4_2, &expectedVal4),
			common.NewSinglePointValue(&expectedTm4, &expectedVal4),
		}))
	})
})
