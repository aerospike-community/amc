package models

import (
	"strconv"
	"strings"

	"github.com/citrusleaf/amc/common"
)

// HistBucket represents a single bucket in a histogram
type HistBucket struct {
	Min   int `json:"min"`   // values less than Min are not counted towards this bucket
	Max   int `json:"max"`   // values greater than Max are not counted towards this bucket
	Count int `json:"count"` // count of the records whose values falls in this bucket [Min, Max]
}

// Width returns the width of the bucket
func (b *HistBucket) Width() int {
	return b.Max - b.Min
}

type Histogram []*HistBucket

// parseHistogram parses and returns a histogram
func parseHistogram(hist string) Histogram {
	hist = strings.Trim(hist, ";")
	vals := strings.Split(hist, ",")
	if len(vals) < 2 {
		return nil
	}

	width, _ := strconv.Atoi(vals[1])
	counts := vals[2:] // remove NUM_BUCKETS, BUCKET_WIDTH

	var buckets []*HistBucket
	for i := 0; i < len(counts); i++ {
		n, _ := strconv.Atoi(counts[i])
		bucket := &HistBucket{
			Min:   width * i,
			Max:   width * (i + 1),
			Count: n,
		}

		buckets = append(buckets, bucket)
	}

	return NewHistogram(buckets)
}

// NewHistogram returns an instance of histogram over the histogram buckets.
func NewHistogram(buckets []*HistBucket) Histogram {
	return Histogram(buckets)
}

// MaxWidth returns the maximum width of a bucket in a histogram.
func (h Histogram) MaxWidth() int {
	var max int

	for _, b := range h {
		if w := b.Width(); w > max {
			max = w
		}
	}

	return max
}

// Distribute distributes the histogram into buckets of the given width.
//
// width is assumed to be a multiple of h.MaxWidth().
func (h Histogram) Distribute(width int) Histogram {
	var buckets []*HistBucket
	for i := 0; i < h.NBuckets(); i++ {
		b := &HistBucket{
			Min: width * i,
			Max: width * (i + 1),
		}
		buckets = append(buckets, b)
	}

	// sum up the counts
	n := width / h.MaxWidth() // number of buckets in one new bucket
	for i, hb := range h {
		b := buckets[i/n]
		b.Count += hb.Count
	}

	return NewHistogram(buckets)
}

// CombineWith combines with the histograms and returns the combined histogram.
func (h Histogram) CombineWith(histograms ...Histogram) Histogram {
	histograms = append(histograms, h)

	// calculate new width of buckets
	widths := make([]int, len(histograms))
	for i, hist := range histograms {
		widths[i] = hist.MaxWidth()
	}
	newwidth := _combinedWidth(widths...)

	// all histograms distributed by the new width
	var newhists []Histogram
	for _, hist := range histograms {
		nh := hist.Distribute(newwidth)
		newhists = append(newhists, nh)
	}

	// create a new list of buckets to hold the sum
	buckets := make([]*HistBucket, h.NBuckets())
	for i := 0; i < h.NBuckets(); i++ {
		buckets[i] = &HistBucket{}
	}

	// sum up the corresponding buckets of all the histograms
	for _, hist := range newhists {
		hist.Apply(func(hb *HistBucket, i int) {
			b := buckets[i]
			b.Min = hb.Min
			b.Max = hb.Max
			b.Count += hb.Count
		})
	}

	return NewHistogram(buckets)
}

// NBuckets returns the number of buckets in the historgam.
func (h Histogram) NBuckets() int {
	return len(h)
}

// Apply applies a function on each bucket of the histogram.
func (h Histogram) Apply(f func(*HistBucket, int)) {
	for i, b := range h {
		f(b, i)
	}
}

// _combinedWidth calculates the new combined width of buckets.
func _combinedWidth(widths ...int) int {
	switch len(widths) {
	case 1:
		return widths[0]
	case 2:
		return common.LCM(widths[0], widths[1])
	default:
		return common.LCM(widths[0], widths[1], widths[2:]...)
	}
}
