package encryption

import (
	"crypto/rand"
	"encoding/base64"
	"sync"

	"golang.org/x/crypto/nacl/box"
)

var (
	serverKeys     *KeyPair
	serverKeysOnce sync.Once
)

// KeyPair holds the server's public and private keys
type KeyPair struct {
	PublicKey  *[32]byte
	PrivateKey *[32]byte
}

// GetServerKeys returns the server's keypair, generating it if it doesn't exist
func GetServerKeys() *KeyPair {
	serverKeysOnce.Do(func() {
		pub, priv, err := box.GenerateKey(rand.Reader)
		if err != nil {
			panic("Failed to generate server keys: " + err.Error())
		}
		serverKeys = &KeyPair{
			PublicKey:  pub,
			PrivateKey: priv,
		}
	})
	return serverKeys
}

// EncryptMessage encrypts a message using the client's public key and server's private key
func (kp *KeyPair) EncryptMessage(message []byte, clientPublicKey []byte) ([]byte, []byte, error) {
	var clientPubKey [32]byte
	copy(clientPubKey[:], clientPublicKey)

	// Generate a random nonce
	var nonce [24]byte
	if _, err := rand.Read(nonce[:]); err != nil {
		return nil, nil, err
	}

	// Encrypt the message
	encrypted := box.Seal(nil, message, &nonce, &clientPubKey, kp.PrivateKey)

	return encrypted, nonce[:], nil
}

// DecryptMessage decrypts a message using the client's public key and server's private key
func (kp *KeyPair) DecryptMessage(encrypted []byte, nonce []byte, clientPublicKey []byte) ([]byte, error) {
	var clientPubKey [32]byte
	copy(clientPubKey[:], clientPublicKey)

	var nonceArray [24]byte
	copy(nonceArray[:], nonce)

	// Decrypt the message
	decrypted, ok := box.Open(nil, encrypted, &nonceArray, &clientPubKey, kp.PrivateKey)
	if !ok {
		return nil, ErrDecryptionFailed
	}

	return decrypted, nil
}

// EncryptedMessage represents an encrypted message with its nonce
type EncryptedMessage struct {
	Encrypted string `json:"encrypted"`
	Nonce     string `json:"nonce"`
}

// Error types
type Error string

func (e Error) Error() string { return string(e) }

const (
	ErrDecryptionFailed = Error("failed to decrypt message")
)

// Helper functions for base64 encoding/decoding
func EncodeBase64(data []byte) string {
	return base64.StdEncoding.EncodeToString(data)
}

func DecodeBase64(data string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(data)
}
