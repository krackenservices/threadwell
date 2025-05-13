package models

type Settings struct {
	ID           string `json:"id"`                    // always "default"
	LLMProvider  string `json:"llm_provider"`          // e.g. "ollama", "openai", "claude"
	LLMEndpoint  string `json:"llm_endpoint"`          // http://localhost:11434 etc.
	LLMApiKey    string `json:"llm_api_key,omitempty"` // (optional, not returned on GET)
	LLMName      string `json:"llm_model"`             // name of model to use e.g. qwen2.1
	SimulateOnly bool   `json:"simulate_only"`         // true = disable real calls
}
