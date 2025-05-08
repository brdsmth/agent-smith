package llm

import (
	"fmt"
	"time"
)

// MockLLM is a simple mock implementation of an LLM
type MockLLM struct {
	responses map[string]string
}

// NewMockLLM creates a new mock LLM instance
func NewMockLLM() *MockLLM {
	return &MockLLM{
		responses: map[string]string{
			"hello": "Hi there! How can I help you today?",
			"help":  "I'm a mock LLM. I can respond to basic queries, but I'm not very smart yet.",
			"bye":   "Goodbye! Have a great day!",
		},
	}
}

// GenerateResponse generates a mock response
func (m *MockLLM) GenerateResponse(prompt string) (string, error) {
	// Simulate some processing time
	time.Sleep(100 * time.Millisecond)

	// Check for known responses
	for key, response := range m.responses {
		if prompt == key {
			return response, nil
		}
	}

	// Default response
	return fmt.Sprintf("I received your message: %s", prompt), nil
}

// AddResponse adds a new response to the mock LLM
func (m *MockLLM) AddResponse(prompt, response string) {
	m.responses[prompt] = response
}
