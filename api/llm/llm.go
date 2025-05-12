package llm

import (
	"context"
	"fmt"
)

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ModelConfig contains configuration for a specific model
type ModelConfig struct {
	ModelID       string  `json:"model_id"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	ContextWindow int     `json:"context_window"`
	MaxTokens     int     `json:"max_tokens"`
	Temperature   float64 `json:"temperature"`
	BaseModel     string  `json:"base_model,omitempty"`
}

// LLM defines the interface for all LLM implementations
type LLM interface {
	// Initialize sets up the model
	Initialize(ctx context.Context) error

	// GenerateResponse generates a response from the model
	GenerateResponse(ctx context.Context, messages []Message, config ModelConfig) (string, error)

	// GetConfig returns the model's configuration
	GetConfig() ModelConfig
}

// ModelRegistry manages available models
type ModelRegistry struct {
	models map[string]LLM
}

// NewModelRegistry creates a new model registry
func NewModelRegistry() *ModelRegistry {
	return &ModelRegistry{
		models: make(map[string]LLM),
	}
}

// RegisterModel adds a model to the registry
func (r *ModelRegistry) RegisterModel(model LLM) error {
	config := model.GetConfig()
	if _, exists := r.models[config.ModelID]; exists {
		return fmt.Errorf("model %s already registered", config.ModelID)
	}
	r.models[config.ModelID] = model
	return nil
}

// GetModel retrieves a model by ID
func (r *ModelRegistry) GetModel(modelID string) (LLM, error) {
	model, exists := r.models[modelID]
	if !exists {
		return nil, fmt.Errorf("model %s not found", modelID)
	}
	return model, nil
}

// ListModels returns all registered models
func (r *ModelRegistry) ListModels() []ModelConfig {
	configs := make([]ModelConfig, 0, len(r.models))
	for _, model := range r.models {
		configs = append(configs, model.GetConfig())
	}
	return configs
}
