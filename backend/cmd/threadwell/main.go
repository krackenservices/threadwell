cfg := LoadConfig()
var store storage.Storage

switch cfg.Storage.Type {
case "sqlite":
    store, err = sqlite.New(cfg.Storage.Path)
default:
    log.Fatalf("unsupported storage type: %s", cfg.Storage.Type)
}
