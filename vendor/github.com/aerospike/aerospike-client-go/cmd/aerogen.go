package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/zpatrick/go-parser"
)

const (
	ptInvalid = iota
	ptInt
	ptString
	ptFloat
	ptBool
	ptList
	ptMap
)

type TypeField struct {
	Name          string
	ParticleType  int
	CaseSensitive bool
}

var allTypes = make(map[string][]TypeField)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: ./aerogen [file.go, ...]")
		os.Exit(255)
	}

	for _, filename := range os.Args[1:] {
		if filename == "-" {
			continue
		}
		goFile, err := parser.ParseSingleFile(filename)
		if err != nil {
			log.Fatal(err)
		}

		for _, goStruct := range goFile.Structs {
			log.Println(goStruct.Name, goStruct.Docs)
			for _, goField := range goStruct.Fields {
				log.Println("\t", goField.Name, goField.Type, goField.Tag)
			}
		}

	}

	fmt.Println(allTypes)
}

// func nodeParser(n ast.Node) bool {
// 	switch t := n.(type) {
// 	// find variable declarations
// 	case *ast.GenDecl:
// 		if t.Tok == token.TYPE && strings.Contains(t.Doc.Text(), "+aerogen") {
// 			for _, spec := range t.Specs {
// 				ast.Inspect(spec, structParser)
// 			}
// 		}
// 	}
// 	return true
// }

// func structParser(n ast.Node) bool {
// 	switch t := n.(type) {
// 	// find variable declarations
// 	case *ast.GenDecl:
// 		fmt.Println(t.Doc.Text(), t.Tok)
// 		for _, spec := range t.Specs {
// 			ast.Inspect(spec, nodeParser)
// 		}
// 	case *ast.TypeSpec:
// 		// which are public
// 		switch o := t.Type.(type) {
// 		// and are interfaces
// 		// case *ast.InterfaceType:
// 		// 	fmt.Println(t.Name.Name, "interface")
// 		case *ast.StructType:
// 			fmt.Println(t.Name.Name, t.Name.IsExported(), "struct", t.Doc.Text())

// 			for _, f := range o.Fields.List {
// 				fmt.Println(f.Names, f.Type, f.Tag)
// 				tf := TypeField{Name: f.Names[0].Name, ParticleType: particleType(f.Type), CaseSensitive: false}
// 				allTypes[t.Name.Name] = append(allTypes[t.Name.Name], tf)
// 			}
// 			// default:
// 			// fmt.Println(t.Name.Name, t.Name.IsExported())
// 		}
// 	}
// 	return true
// }

// func isBasic(t types.Type) bool {
// 	switch x := t.(type) {
// 	case *types.Basic:
// 		return true
// 	case *types.Slice:
// 		return true
// 	case *types.Map:
// 		return true
// 	case *types.Pointer:
// 		return isBasic(x.Elem())
// 	default:
// 		return false
// 	}
// }

// func particleType(t types.Type) int {
// 	switch x := t.(type) {
// 	case *types.Basic:
// 		switch x.Kind() {
// 		case types.String:
// 			return ptString
// 		case types.Int, types.Int8, types.Int16, types.Int32, types.Int64, types.Uint, types.Uint8, types.Uint16, types.Uint32, types.Uint64:
// 			return ptInt
// 		case types.Float64, types.Float32:
// 			return ptFloat
// 		}
// 	case *types.Slice:
// 		return ptList
// 	case *types.Map:
// 		return ptMap
// 		// case *types.Pointer:
// 		// 	return isBasic(x.Elem())
// 	}

// 	fmt.Printf("Type %v not recognized, nor supported.")
// 	return ptInvalid
// }

// user +aerogen
type user struct {
	// counter is awesome
	Counter    int    `as:-`
	Id         string `asm:key`
	Index      int
	Guid       string
	IsActive   bool
	Balance    uint64
	Picture    string
	Age        uint8
	EyeColor   string
	Name       string
	Gender     string
	Company    string
	Email      string
	Phone      string
	Address    string
	About      string
	Registered time.Time
	Latitude   float64
	Longitude  float64
	// Tags          []string
	// Friends       []map[string]interface{}
	Greeting      string
	FavoriteFruit string
	Randstr       string
}
