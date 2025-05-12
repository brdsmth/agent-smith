package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/cors"

	"agent-smith/llm"
)

// ChatRequest represents the incoming chat request
type ChatRequest struct {
	Messages    []llm.Message `json:"messages"`
	Model       string        `json:"model"`
	Temperature float64       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
}

// ChatResponse represents the response format
type ChatResponse struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Created int64    `json:"created"`
	Model   string   `json:"model"`
	Choices []Choice `json:"choices"`
	Usage   Usage    `json:"usage"`
}

type Choice struct {
	Index        int         `json:"index"`
	Message      llm.Message `json:"message"`
	FinishReason string      `json:"finish_reason"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// ModelCreateRequest represents the request to create a new model
type ModelCreateRequest struct {
	BaseModel    string  `json:"base_model"`
	NewModelName string  `json:"new_model_name"`
	SystemPrompt string  `json:"system_prompt"`
	Temperature  float64 `json:"temperature"`
}

// Global variables
var (
	modelRegistry *llm.ModelRegistry
	mistralModel  *llm.MistralLLM
)

func main() {
	// Initialize model registry
	modelRegistry = llm.NewModelRegistry()

	// Initialize Mistral model
	mistralModel = llm.NewMistralLLM()
	if err := mistralModel.Initialize(context.Background()); err != nil {
		log.Fatalf("Failed to initialize Mistral model: %v", err)
	}

	// Register the model
	modelRegistry.RegisterModel(mistralModel)

	// Create Gin router
	router := gin.Default()

	// Configure CORS
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept"},
		ExposedHeaders:   []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           43200, // 12 hours in seconds
	})

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// List available models
	router.GET("/v1/models", func(c *gin.Context) {
		models := modelRegistry.ListModels()
		c.JSON(200, gin.H{
			"data": models,
		})
	})

	// Chat completion endpoint
	router.POST("/v1/chat/completions", func(c *gin.Context) {
		var req ChatRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request format"})
			return
		}

		// Get the requested model
		model, err := modelRegistry.GetModel(req.Model)
		if err != nil {
			c.JSON(400, gin.H{"error": fmt.Sprintf("Model not found: %v", err)})
			return
		}

		// Update model config with request parameters
		config := model.GetConfig()
		if req.Temperature > 0 {
			config.Temperature = req.Temperature
		}
		if req.MaxTokens > 0 {
			config.MaxTokens = req.MaxTokens
		}

		// Generate response
		response, err := model.GenerateResponse(c.Request.Context(), req.Messages, config)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to generate response: %v", err)})
			return
		}

		// Create response
		chatResponse := ChatResponse{
			ID:      fmt.Sprintf("chatcmpl-%d", time.Now().Unix()),
			Object:  "chat.completion",
			Created: time.Now().Unix(),
			Model:   req.Model,
			Choices: []Choice{
				{
					Index: 0,
					Message: llm.Message{
						Role:    "assistant",
						Content: response,
					},
					FinishReason: "stop",
				},
			},
			Usage: Usage{
				PromptTokens:     0, // TODO: Implement token counting
				CompletionTokens: 0,
				TotalTokens:      0,
			},
		}

		c.JSON(200, chatResponse)
	})

	// Create new model endpoint
	router.POST("/v1/models/create", func(c *gin.Context) {
		var req ModelCreateRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request format"})
			return
		}

		// Validate that base model exists
		baseModelReq := struct {
			Name string `json:"name"`
		}{
			Name: req.BaseModel,
		}

		baseModelData, err := json.Marshal(baseModelReq)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to marshal base model check request: %v", err)})
			return
		}

		// Check if base model exists
		checkResp, err := http.Post("http://localhost:11434/api/show", "application/json", bytes.NewBuffer(baseModelData))
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to check base model: %v", err)})
			return
		}
		defer checkResp.Body.Close()

		if checkResp.StatusCode != http.StatusOK {
			c.JSON(400, gin.H{"error": fmt.Sprintf("Base model '%s' not found", req.BaseModel)})
			return
		}

		// Create Modelfile
		modelfilePath, err := llm.CreateModelfile(req.NewModelName, req.BaseModel, req.Temperature, req.SystemPrompt)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to create Modelfile: %v", err)})
			return
		}

		// Create the model using the Modelfile
		if err := llm.CreateOllamaModel(req.NewModelName, modelfilePath); err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to create model: %v", err)})
			return
		}

		// Register the new model
		newModel := llm.NewCustomModel(req.NewModelName, req.NewModelName, req.BaseModel, req.Temperature)
		if err := modelRegistry.RegisterModel(newModel); err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to register model: %v", err)})
			return
		}

		c.JSON(200, gin.H{
			"status": "success",
			"model":  newModel.GetConfig(),
		})
	})

	// Start server
	handler := corsMiddleware.Handler(router)
	if err := http.ListenAndServe(":8000", handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
