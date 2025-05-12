cfg := LoadConfig()
var store storage.Storage

import "github.com/krackenservices/threadwell/storage/memory"

switch cfg.Storage.Type {
case "sqlite":
store, err = sqlite.New(cfg.Storage.Path)
case "memory":
store = memory.New()
default:
log.Fatalf("unsupported storage type: %s", cfg.Storage.Type)
}

