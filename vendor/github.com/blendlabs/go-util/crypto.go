package util

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha512"
	"fmt"
	"io"

	exception "github.com/blendlabs/go-exception"
)

// Crypto is a namespace for crypto related functions.
var Crypto = cryptoUtil{}

type cryptoUtil struct{}

func (cu cryptoUtil) CreateKey(keySize int) []byte {
	key := make([]byte, keySize)
	io.ReadFull(rand.Reader, key)
	return key
}

// Encrypt encrypts data with the given key.
func (cu cryptoUtil) Encrypt(key, plainText []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	ciphertext := make([]byte, aes.BlockSize+len(plainText))
	iv := ciphertext[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}
	cfb := cipher.NewCFBEncrypter(block, iv)
	cfb.XORKeyStream(ciphertext[aes.BlockSize:], plainText)
	return ciphertext, nil
}

// Decrypt decrypts data with the given key.
func (cu cryptoUtil) Decrypt(key, cipherText []byte) ([]byte, error) {
	if len(cipherText) < aes.BlockSize {
		return nil, exception.New(fmt.Sprintf("Cannot decrypt string: `cipherText` is smaller than AES block size (%v)", aes.BlockSize))
	}

	iv := cipherText[:aes.BlockSize]
	cipherText = cipherText[aes.BlockSize:]

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	cfb := cipher.NewCFBDecrypter(block, iv)
	cfb.XORKeyStream(cipherText, cipherText)
	return cipherText, nil
}

// Hash hashes data with the given key.
func (cu cryptoUtil) Hash(key, plainText []byte) []byte {
	mac := hmac.New(sha512.New, key)
	mac.Write([]byte(plainText))
	return mac.Sum(nil)
}
