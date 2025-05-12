package config

type Config struct {
	Storage struct {
		Type string `json:"type"` // "sqlite" or "memory"
		Path string `json:"path"` // e.g. "data.db"
	} `json:"storage"`
}

func Load() Config {
	return Config{
		Storage: struct {
			Type string `json:"type"`
			Path string `json:"path"`
		}{
			Type: "memory", // or "sqlite"
			Path: "./data/threadwell.db",
		},
	}
}
