package api

import (
    "math/rand"
    "time"
)

func RandID() string {
    const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
    b := make([]byte, 8)
    for i := range b {
        b[i] = charset[rand.Intn(len(charset))]
    }
    return string(b)
}

func UnixNow() int64 {
    return time.Now().Unix()
}