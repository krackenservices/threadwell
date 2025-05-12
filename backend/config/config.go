package config

type Config struct {
    Storage struct {
        Type string `json:"type"` // e.g. "sqlite"
        Path string `json:"path"` // e.g. "./threadwell.db"
    } `json:"storage"`
}
