# 🧠 ThreadWell Project Status

Last updated: 2025-05-13

---

## ✅ Core Architecture

- **Monorepo** with `/frontend` (React) and `/backend` (Go)
- Backend uses `net/http`, `swaggo` for OpenAPI, supports multiple pluggable storage backends
- Frontend uses React + Vite with threaded chat interface

---

## ✅ Backend Feature Status

| Option            | Description                                                                 | Status        |
|------------------|------------------------------------------------------------------------------|---------------|
| 🔐 Auth           | Add API key, token, or basic auth middleware                                | 🔜 Planned     |
| 🔁 Pagination     | Add limit/offset to `/messages`                                             | 🔜 Planned     |
| 🔍 Search         | Support full-text search (SQLite FTS5 / in-memory match)                    | 🔜 Planned     |
| 📤 Export         | Add `/export` or `/threads/{id}/export` for JSON download                  | 🔜 Planned     |
| 📂 Files          | Add optional attachments to messages                                        | 🔜 Planned     |
| 🔒 Rate limiting  | Useful for production/open deployment                                       | 🔜 Planned     |

### Implemented:
- ✅ Storage interface abstraction
- ✅ SQLite and in-memory implementations
- ✅ `MoveSubtree()` logic (copies ancestor chain, moves branch + descendants)
- ✅ Swagger docs via `swaggo`
- ✅ Configuration via `STORAGE_TYPE` and `STORAGE_PATH` env vars

---

## 🌐 Frontend Feature Status (React/Vite)

| Task                          | Description                                                       | Status        |
|-------------------------------|-------------------------------------------------------------------|---------------|
| 🧠 Hook up frontend to API     | Replace in-memory chat logic with fetch/axios                     | ✅ Complete    |
| 🧾 Fetch threads/messages on load | Populate UI from `/api/threads` and `/api/messages?threadId=...` | ✅ Complete    |
| 💬 Post messages via API       | `onSend` uses POST `/api/messages`                               | ✅ Complete    |
| 🔁 Move to chat                | `POST /api/move/{id}` works and updates thread view               | ✅ Complete    |
| ♻️ Refactor state              | Replaced local-only state with persistent fetched state           | ✅ Complete    |

---

## 🧪 Testing Coverage

- ✅ Unit tests for `memory` and `sqlite` storage backends
- ✅ Shared test helpers ensure backend parity
- ✅ Full CRUD + `MoveSubtree` tree logic tested
- ✅ SQLite test DB cleanup handled automatically

---

## 🧩 LLM Simulation

- ✅ Simulated replies via `**You said:**`
- 🔜 Plan to move LLM logic to a swappable backend service (Ollama, OpenAI, Claude)

---

## 🛠 Tooling & Ops

- ✅ Swagger/OpenAPI via `swaggo`
- ✅ `.env` support and proxy for frontend API
- ✅ Dockerfile and docker-compose scaffolded
- ⚠️ `.iml` IntelliJ module file detected — may want to `.gitignore`

---

## ⏭️ Next Steps

- [ ] Add settings/config endpoint
- [ ] Support real LLM inference
- [ ] Enable optional auth middleware
- [ ] Export chats as JSON
- [ ] Implement pagination + full-text search
- [ ] Add integration tests for HTTP endpoints
- [ ] Improve frontend design & error boundaries

---

## 📁 Suggested .gitignore additions

```gitignore
.idea/
*.iml
testdata/
sqlite.db
dist/
node_modules/
.env

