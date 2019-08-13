package util

import "time"

var (
	// Combinatorics is a namespace containing combinatoric functions.
	Combinatorics = combinatorics{}
)

type combinatorics struct{}

// CombinationsOfInt returns the "power set" of values less the empty set.
// Use "combinations" when the order of the resulting sets do not matter.
func (c combinatorics) CombinationsOfInt(values []int) [][]int {
	possibleValues := Math.PowOfInt(2, uint(len(values))) //less the empty entry
	output := make([][]int, possibleValues-1)

	for x := 0; x < possibleValues-1; x++ {
		row := []int{}
		for i := 0; i < len(values); i++ {
			y := 1 << uint(i)
			if y&x == 0 && y != x {
				row = append(row, values[i])
			}
		}
		if len(row) > 0 {
			output[x] = row
		}
	}
	return output
}

// CombinationsOfFloat returns the "power set" of values less the empty set.
// Use "combinations" when the order of the resulting sets do not matter.
func (c combinatorics) CombinationsOfFloat(values []float64) [][]float64 {
	possibleValues := Math.PowOfInt(2, uint(len(values))) //less the empty entry
	output := make([][]float64, possibleValues-1)

	for x := 0; x < possibleValues-1; x++ {
		row := []float64{}
		for i := 0; i < len(values); i++ {
			y := 1 << uint(i)
			if y&x == 0 && y != x {
				row = append(row, values[i])
			}
		}
		if len(row) > 0 {
			output[x] = row
		}
	}
	return output
}

// CombinationsOfString returns the "power set" of values less the empty set.
// Use "combinations" when the order of the resulting sets do not matter.
func (c combinatorics) CombinationsOfString(values []string) [][]string {
	possibleValues := Math.PowOfInt(2, uint(len(values))) //less the empty entry
	output := make([][]string, possibleValues-1)

	for x := 0; x < possibleValues-1; x++ {
		row := []string{}
		for i := 0; i < len(values); i++ {
			y := 1 << uint(i)
			if y&x == 0 && y != x {
				row = append(row, values[i])
			}
		}
		if len(row) > 0 {
			output[x] = row
		}
	}
	return output
}

// PermutationsOfInt returns the possible orderings of the values array.
// Use "permutations" when order matters.
func (c combinatorics) PermutationsOfInt(values []int) [][]int {
	if len(values) == 1 {
		return [][]int{values}
	}

	output := [][]int{}
	for x := 0; x < len(values); x++ {
		workingValues := make([]int, len(values))
		copy(workingValues, values)
		value := workingValues[x]
		pre := workingValues[0:x]
		post := workingValues[x+1 : len(values)]

		joined := append(pre, post...)

		for _, inner := range c.PermutationsOfInt(joined) {
			output = append(output, append([]int{value}, inner...))
		}
	}

	return output
}

// PermutationsOfFloat returns the possible orderings of the values array.
// Use "permutations" when order matters.
func (c combinatorics) PermutationsOfFloat(values []float64) [][]float64 {
	if len(values) == 1 {
		return [][]float64{values}
	}

	output := [][]float64{}
	for x := 0; x < len(values); x++ {
		workingValues := make([]float64, len(values))
		copy(workingValues, values)
		value := workingValues[x]
		pre := workingValues[0:x]
		post := workingValues[x+1 : len(values)]

		joined := append(pre, post...)

		for _, inner := range c.PermutationsOfFloat(joined) {
			output = append(output, append([]float64{value}, inner...))
		}
	}

	return output
}

// PermutationsOfString returns the possible orderings of the values array.
// Use "permutations" when order matters.
func (c combinatorics) PermutationsOfString(values []string) [][]string {
	if len(values) == 1 {
		return [][]string{values}
	}

	output := [][]string{}
	for x := 0; x < len(values); x++ {
		workingValues := make([]string, len(values))
		copy(workingValues, values)
		value := workingValues[x]
		pre := workingValues[0:x]
		post := workingValues[x+1 : len(values)]
		joined := append(pre, post...)
		for _, inner := range c.PermutationsOfString(joined) {
			output = append(output, append([]string{value}, inner...))
		}
	}

	return output
}

// PermuteDistributions returns all the possible ways you can split a total among buckets completely.
func (c combinatorics) PermuteDistributions(total, buckets int) [][]int {
	return c.PermuteDistributionsFromExisting(total, buckets, []int{})
}

// PermuteDistributionsFromExisting returns all the possible ways you can split the total among additional buckets
// given an existing distribution
func (c combinatorics) PermuteDistributionsFromExisting(total, buckets int, existing []int) [][]int {
	output := [][]int{}
	existingLength := len(existing)
	existingSum := Math.SumOfInt(existing)
	remainder := total - existingSum

	if buckets == 1 {
		newExisting := make([]int, existingLength+1)
		copy(newExisting, existing)
		newExisting[existingLength] = remainder
		output = append(output, newExisting)
		return output
	}

	for x := 0; x <= remainder; x++ {
		newExisting := make([]int, existingLength+1)
		copy(newExisting, existing)
		newExisting[existingLength] = x

		results := c.PermuteDistributionsFromExisting(total, buckets-1, newExisting)
		output = append(output, results...)
	}

	return output
}

// RandomInt returns a random int from an array.
func (c combinatorics) RandomInt(values []int) int {
	if len(values) == 0 {
		return 0
	}
	if len(values) == 1 {
		return values[0]
	}
	return values[RandomProvider().Intn(len(values))]
}

// RandomFloat64 returns a random int from an array.
func (c combinatorics) RandomFloat64(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	if len(values) == 1 {
		return values[0]
	}
	return values[RandomProvider().Intn(len(values))]
}

// RandomFloat64 returns a random int from an array.
func (c combinatorics) RandomString(values []string) string {
	if len(values) == 0 {
		return ""
	}
	if len(values) == 1 {
		return values[0]
	}
	return values[RandomProvider().Intn(len(values))]
}

// RandomFloat64 returns a random int from an array.
func (c combinatorics) RandomTime(values []time.Time) time.Time {
	if len(values) == 0 {
		return time.Time{}
	}
	if len(values) == 1 {
		return values[0]
	}
	return values[RandomProvider().Intn(len(values))]
}
