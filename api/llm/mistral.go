package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// MistralLLM implements the LLM interface for Mistral models via Ollama
type MistralLLM struct {
	config  ModelConfig
	client  *http.Client
	baseURL string
}

// OllamaRequest represents the request format for Ollama API
type OllamaRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
	Options  struct {
		Temperature float64 `json:"temperature"`
	} `json:"options"`
}

// OllamaResponse represents the response format from Ollama API
type OllamaResponse struct {
	Message struct {
		Content string `json:"content"`
	} `json:"message"`
}

// NewMistralLLM creates a new Mistral LLM instance
func NewMistralLLM() *MistralLLM {
	return &MistralLLM{
		config: ModelConfig{
			ModelID:       "mistral",
			Name:          "Mistral 7B",
			Description:   "High-performance 7B parameter model via Ollama",
			ContextWindow: 8192,
			MaxTokens:     2048,
			Temperature:   0.5,
			BaseModel:     "mistral",
		},
		client:  &http.Client{},
		baseURL: "http://localhost:11434/api",
	}
}

// NewCustomModel creates a new model instance with custom configuration
func NewCustomModel(modelID string, name string, baseModel string, temperature float64) *MistralLLM {
	return &MistralLLM{
		config: ModelConfig{
			ModelID:       modelID,
			Name:          name,
			Description:   fmt.Sprintf("Custom model based on %s", baseModel),
			ContextWindow: 8192,
			MaxTokens:     2048,
			Temperature:   temperature,
			BaseModel:     baseModel,
		},
		client:  &http.Client{},
		baseURL: "http://localhost:11434/api",
	}
}

// Initialize sets up the Mistral model
func (m *MistralLLM) Initialize(ctx context.Context) error {
	// Check if Ollama is running by making a simple request
	req, err := http.NewRequestWithContext(ctx, "GET", m.baseURL+"/tags", nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to connect to Ollama: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Ollama API returned status: %d", resp.StatusCode)
	}

	return nil
}

// GenerateResponse generates a response from the Mistral model
func (m *MistralLLM) GenerateResponse(ctx context.Context, messages []Message, config ModelConfig) (string, error) {
	ollamaReq := OllamaRequest{
		Model:    m.config.ModelID,
		Messages: messages,
		Stream:   false,
	}
	ollamaReq.Options.Temperature = config.Temperature

	jsonData, err := json.Marshal(ollamaReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %v", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", m.baseURL+"/chat", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Ollama API returned status: %d", resp.StatusCode)
	}

	var ollamaResp OllamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %v", err)
	}

	return ollamaResp.Message.Content, nil
}

// GetConfig returns the model's configuration
func (m *MistralLLM) GetConfig() ModelConfig {
	return m.config
}
