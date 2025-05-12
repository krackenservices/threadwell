package models

type Message struct {
    ID        string  `json:"id"`
    ThreadID  string  `json:"thread_id"`
    ParentID  *string `json:"parent_id"`
    RootID    *string `json:"root_id"`
    Role      string  `json:"role"`
    Content   string  `json:"content"`
    Timestamp int64   `json:"timestamp"`
}
