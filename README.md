![ThreadWell Logo](./doc/img/threadwell_128x128.png)
# ThreadWell – Threaded Chat Interface for Contextual LLM Conversations

**ThreadWell** is a React-based threaded chat interface designed to make conversations with LLMs more structured, contextual, and distraction-free.

---

## 🧠 Problem Statement

Modern chat interactions—especially with LLMs—often diverge from the original topic. Traditional linear interfaces force users to scroll through irrelevant messages, leading to:

- **Loss of focus**
- **Polluted context windows**
- **Reduced LLM accuracy**

**ThreadWell** solves this by introducing a tree-based threaded message system, enabling users to branch conversations naturally and isolate lines of thought.

---

## ✨ Features

- 🧶 **Threaded Conversations**: Messages reference parents, forming reply trees.
- 🪄 **Move to Chat**: 
  - Copy the ancestor chain of any message.
  - Move that message and all its descendants into a new thread.
  - Cleanly remove the subtree from the original chat.
- 🧭 **Simulated Reply Logic**: Maintains realistic conversation structure and formatting.
- 💬 **Multiple Chats**: Switch easily between threads via the sidebar.
- 🧩 **Clear Message Indentation**: Visual hierarchy reflects reply structure.
- 🔍 **Thread Tracker**: Bottom bar shows active thread context.

---

## Quick Start (developer only currently)

Backend: (requires GO)
- Open a terminal
- `cd backend && STORAGE=memory go run cmd/threadwell/main.go`

Frontend: (requires Nodes) 
- Open a terminal
- `cd frontend && npm ci && node run dev`


---

## 🚧 Planned Enhancements

- 📚 **Message Grouping**: Group by author, timestamp gaps, or content similarity.
- 🔽 **Thread Collapse/Expand**: Make navigation of large trees more manageable.
- 🧠 **LLM Context Optimization**: Export message chains for efficient prompt seeding.

---

## 🔄 How It Works (Move to Chat)

1. User clicks “Move to Chat” on a message.
2. The app:
   - Copies all ancestors up to (but not including) the clicked message.
   - Moves the clicked message and all children into a new thread.
   - Prunes the moved subtree from the original thread.
3. A new thread is created with the copied ancestry + moved messages.
4. UI updates both threads without layout regressions.

---

## 🧪 Example Use Cases

- **Focused coding discussions**
- **Design branching**
- **Customer support with diverging issues**
- **LLM-driven planning with topic forks**

---

## 📜 License

[MIT + Commons Clause](./LICENSE)

---

## 🙌 Contributions

Pull requests welcome. To contribute:
1. Fork the repo
2. Create a branch
3. Commit your changes
4. Open a PR

---

---

## 🛠️ TODO

2. 🧠 **Integrate Real LLM APIs**  
   Move the current simulated response logic into a `service` abstraction. Enable plug-and-play backends such as:
   - [X] Ollama
   - [ ] OpenAI
   - [ ] Claude

3. ⚙️ **Configuration Interface**  
   Let users configure backend providers and preferences. Store in a dedicated settings database.

5. 🎨 **Improve UI/UX**  
   Polish the layout, spacing, message alignment, and visual clarity. Introduce dark mode, avatars, and better thread visualization.


--- 
Improvements:

| Option           | Description                                                              |
|------------------|---------------------------------------------------------------------------|
| 🔐 Auth          | Add API key, token, or basic auth middleware                              |
| 🔁 Pagination    | Add limit/offset to /messages                                              |
| 🔍 Search        | Support full-text search via SQLite FTS5 or in-memory match               |
| 📤 Export        | Add /export or /threads/{id}/export for JSON download                     |
| 📂 Files         | Add optional attachments to messages                                       |
| 🔒 Rate limiting | Useful for production/open deployment                                      |

### 🌐 Frontend (React/Vite)

| Task                          | Description                                                       |
|-------------------------------|-------------------------------------------------------------------|
| 🧠 Hook up frontend to API     | Replace in-memory chat logic with fetch/axios                     |
| 🧾 Fetch threads/messages on load | Populate UI from /api/threads and /api/messages?threadId=...   |
| 💬 Post messages via API       | Update onSend to use POST /api/messages                           |
| 🔁 Move to chat                | Wire MoveSubtree call (POST /api/move/{id})                        |
| ♻️ Refactor state              | Replace local-only state with persisted fetched state             |➜

---
