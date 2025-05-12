package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

type OllamaCreateRequest struct {
	Name      string `json:"name"`
	Modelfile string `json:"modelfile"`
}

type OllamaCreateResponse struct {
	Error  string `json:"error,omitempty"`
	Status int    `json:"status"`
}

// CreateModelfile creates a physical Modelfile in the specified directory
func CreateModelfile(name, baseModel string, temperature float64, systemPrompt string) (string, error) {
	// Get absolute path for models directory
	workDir, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("failed to get working directory: %w", err)
	}

	// Create models and archive directories if they don't exist
	modelsDir := filepath.Join(workDir, "../models")
	archiveDir := filepath.Join(modelsDir, "archive")
	fmt.Printf("Creating models directory at: %s\n", modelsDir)
	fmt.Printf("Creating archive directory at: %s\n", archiveDir)

	if err := os.MkdirAll(archiveDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create archive directory: %w", err)
	}

	// Create Modelfile content
	modelfileContent := fmt.Sprintf("FROM %s\n\nPARAMETER temperature %0.2f\n\nSYSTEM %s\n",
		baseModel,
		temperature,
		systemPrompt,
	)

	// Generate timestamp for unique archival
	timestamp := time.Now().Format("20060102_150405")

	// Write Modelfile to both locations
	modelfilePath := filepath.Join(modelsDir, fmt.Sprintf("Modelfile.%s", name))
	archivePath := filepath.Join(archiveDir, fmt.Sprintf("Modelfile.%s.%s", name, timestamp))

	fmt.Printf("Writing Modelfile to: %s\n", modelfilePath)
	fmt.Printf("Archiving Modelfile to: %s\n", archivePath)
	fmt.Printf("Modelfile content:\n%s\n", modelfileContent)

	// Write the current Modelfile
	if err := os.WriteFile(modelfilePath, []byte(modelfileContent), 0644); err != nil {
		return "", fmt.Errorf("failed to write Modelfile: %w", err)
	}

	// Write to archive
	if err := os.WriteFile(archivePath, []byte(modelfileContent), 0644); err != nil {
		return "", fmt.Errorf("failed to archive Modelfile: %w", err)
	}

	return modelfilePath, nil
}

// ArchiveModelfile moves a Modelfile to the archive directory with a timestamp
func ArchiveModelfile(modelfilePath string) error {
	// Get the archive directory path
	archiveDir := filepath.Join(filepath.Dir(filepath.Dir(modelfilePath)), "models", "archive")

	// Ensure archive directory exists
	if err := os.MkdirAll(archiveDir, 0755); err != nil {
		return fmt.Errorf("failed to create archive directory: %w", err)
	}

	// Generate archive filename with timestamp
	timestamp := time.Now().Format("20060102_150405")
	baseFileName := filepath.Base(modelfilePath)
	archivePath := filepath.Join(archiveDir, fmt.Sprintf("%s.%s", baseFileName, timestamp))

	// Copy file to archive
	content, err := os.ReadFile(modelfilePath)
	if err != nil {
		return fmt.Errorf("failed to read Modelfile: %w", err)
	}

	if err := os.WriteFile(archivePath, content, 0644); err != nil {
		return fmt.Errorf("failed to write archive file: %w", err)
	}

	return nil
}

// DeleteModelfile is kept for compatibility but now just removes the working copy
func DeleteModelfile(modelfilePath string) error {
	// Optional: Remove the working copy if you don't want to keep it
	// return os.Remove(modelfilePath)

	// Instead of deleting, we'll keep both copies
	return nil
}

// CreateOllamaModel creates a new model using the Ollama CLI
func CreateOllamaModel(name, modelfilePath string) error {
	fmt.Printf("Creating model '%s' using Modelfile at: %s\n", name, modelfilePath)

	// Check if Modelfile exists
	if _, err := os.Stat(modelfilePath); os.IsNotExist(err) {
		return fmt.Errorf("Modelfile does not exist at path: %s", modelfilePath)
	}

	// Use ollama create command
	cmd := exec.Command("ollama", "create", name, "-f", modelfilePath)
	fmt.Printf("Running command: %s\n", cmd.String())

	output, err := cmd.CombinedOutput()
	fmt.Printf("Command output: %s\n", string(output))

	if err != nil {
		return fmt.Errorf("failed to create model: %s, error: %w", string(output), err)
	}

	return nil
}

// CreateOllamaModelViaAPI sends a model creation request to Ollama API and returns the response.
// This is the older API-based approach, prefer using CreateOllamaModel with a Modelfile instead.
func CreateOllamaModelViaAPI(baseURL, name, modelfile string) (*OllamaCreateResponse, error) {
	reqBody := OllamaCreateRequest{
		Name:      name,
		Modelfile: modelfile,
	}
	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := http.Post(baseURL+"/create", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var createResp OllamaCreateResponse
	if err := json.Unmarshal(body, &createResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Attach HTTP status if not present
	if createResp.Status == 0 {
		createResp.Status = resp.StatusCode
	}

	// For debugging: print the request and response
	fmt.Printf("[Ollama] Sent model create request: %s\n", string(data))
	fmt.Printf("[Ollama] Received response: %s\n", string(body))

	return &createResp, nil
}
