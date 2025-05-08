package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"agent-smith/llm"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatRequest represents the incoming chat request
type ChatRequest struct {
	Messages    []Message `json:"messages"`
	Model       string    `json:"model"`
	Temperature float64   `json:"temperature"`
	MaxTokens   *int      `json:"max_tokens,omitempty"`
	Stream      bool      `json:"stream"`
}

// ChatResponse represents the chat completion response
type ChatResponse struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Created int64    `json:"created"`
	Model   string   `json:"model"`
	Choices []Choice `json:"choices"`
	Usage   Usage    `json:"usage"`
}

// Choice represents a single response choice
type Choice struct {
	Index        int      `json:"index"`
	Message      Message  `json:"message"`
	FinishReason string   `json:"finish_reason"`
	Delta        *Message `json:"delta,omitempty"`
}

// Usage represents token usage information
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// LLMManager handles the LLM operations
type LLMManager struct {
	model *llm.MockLLM
}

// NewLLMManager creates a new LLM manager instance
func NewLLMManager() *LLMManager {
	return &LLMManager{
		model: llm.NewMockLLM(),
	}
}

// Initialize sets up the LLM
func (m *LLMManager) Initialize() error {
	// The mock LLM doesn't need initialization
	return nil
}

// GenerateResponse generates a response from the LLM
func (m *LLMManager) GenerateResponse(messages []Message, temperature float64, maxTokens *int) (string, error) {
	if len(messages) == 0 {
		return "", fmt.Errorf("no messages provided")
	}

	// Get the last message as the prompt
	lastMessage := messages[len(messages)-1]
	return m.model.GenerateResponse(lastMessage.Content)
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found")
	}

	// Initialize LLM manager
	llmManager := NewLLMManager()
	if err := llmManager.Initialize(); err != nil {
		log.Fatalf("Failed to initialize LLM: %v", err)
	}

	// Create Gin router
	router := gin.Default()

	// Add CORS middleware
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	})

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// Chat completion endpoint
	router.POST("/v1/chat/completions", func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Stream {
			handleStreamingResponse(c, req, llmManager)
			return
		}

		response, err := llmManager.GenerateResponse(req.Messages, req.Temperature, req.MaxTokens)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		resp := ChatResponse{
			ID:      fmt.Sprintf("chatcmpl-%d", time.Now().Unix()),
			Object:  "chat.completion",
			Created: time.Now().Unix(),
			Model:   req.Model,
			Choices: []Choice{
				{
					Index: 0,
					Message: Message{
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

		c.JSON(http.StatusOK, resp)
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	// Wrap the Gin router with CORS middleware
	handler := corsMiddleware.Handler(router)

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func handleStreamingResponse(c *gin.Context, req ChatRequest, llmManager *LLMManager) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	response, err := llmManager.GenerateResponse(req.Messages, req.Temperature, req.MaxTokens)
	if err != nil {
		c.SSEvent("error", gin.H{"error": err.Error()})
		return
	}

	// Send the response as a single chunk
	data := map[string]interface{}{
		"id":      fmt.Sprintf("chatcmpl-%d", time.Now().Unix()),
		"object":  "chat.completion.chunk",
		"created": time.Now().Unix(),
		"model":   req.Model,
		"choices": []map[string]interface{}{
			{
				"index": 0,
				"delta": map[string]string{
					"content": response,
				},
				"finish_reason": nil,
			},
		},
	}

	jsonData, _ := json.Marshal(data)
	c.SSEvent("data", string(jsonData))
	c.SSEvent("data", "[DONE]")
}
