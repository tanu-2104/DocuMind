# 📄 DocuMind AI

### Understand Your Documents. Think Beyond Pages.

**DocuMind AI** is an intelligent, AI-powered PDF assistant that transforms the way users interact with documents. Upload a PDF, ask questions, and receive contextual answers powered by Google Gemini AI.

<p align="center">
  <a href="https://documind-ai-workspace-26.vercel.app/">
    <strong>🚀 LIVE DEMO — TRY DOCUMIND AI</strong>
  </a>
</p>

---

## ✨ Features

- 📄 **PDF Upload:** Upload PDF documents through an intuitive interface.
- 🤖 **AI-Powered Conversations:** Ask questions about your uploaded documents.
- 🧠 **Intelligent Responses:** Get context-aware answers using Google Gemini AI.
- 📝 **Text Extraction:** Extract text from PDF documents using PyMuPDF.
- ☁️ **Cloud Storage:** Store uploaded PDFs using Supabase Storage.
- 💬 **Chat History:** Save document-related conversations in Supabase.
- 🌐 **Live Deployment:** Access DocuMind AI online through Vercel.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend development |
| Flask | Web application framework |
| HTML5 | Structure |
| CSS3 | Styling and UI |
| JavaScript | Frontend functionality |
| Google Gemini AI | AI-powered responses |
| PyMuPDF | PDF text extraction |
| Supabase | Cloud database and file storage |
| SQLite | Local database |
| Vercel | Cloud deployment |
| Git & GitHub | Version control |

## 🏗️ Architecture

```text
             USER
               |
               v
        DOCUMIND AI UI
         HTML / CSS / JS
               |
               v
          FLASK BACKEND
               |
        +------+------+
        |             |
        v             v
    PDF PROCESSING   GEMINI AI
     (PyMuPDF)       (Answers)
        |             |
        +------+------+
               |
               v
            SUPABASE
        +------+------+
        |             |
        v             v
    PDF STORAGE   DATABASE
                  Documents
                  Chat History
```

## 🚀 Getting Started

Follow these steps to run DocuMind AI locally.

### 1. Clone the Repository

```bash
git clone https://github.com/tanu-2104/DocuMind.git
```

### 2. Navigate to the Project

```bash
cd DocuMind
```

### 3. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the Application

```bash
python app.py
```

Open your browser:

```text
http://127.0.0.1:5000
```

## ☁️ Cloud Infrastructure

DocuMind AI uses Supabase for cloud-based document storage and database management.

**Supabase Storage**
- Bucket: `documind-pdfs`
- Stores uploaded PDF documents.

**Database Tables**

`documents`
- id
- filename
- stored_filename
- extracted_text
- uploaded_at

`chat_history`
- id
- document_id
- question
- answer
- created_at

## 🌍 Deployment

DocuMind AI is deployed using Vercel.

**Live Application:**

https://documind-ai-workspace-26.vercel.app/

**GitHub Repository:**

https://github.com/tanu-2104/DocuMind

## 🔮 Future Enhancements

- Support for additional document formats.
- Improved document search and retrieval.
- Enhanced conversation management.
- More advanced AI-powered document analysis.
- User authentication and personalized workspaces.

## 👩‍💻 Developer

**Tajmin Shikalgar**

B.Tech — Artificial Intelligence & Data Science

GitHub: [@tanu-2104](https://github.com/tanu-2104)

---

<p align="center">
  <strong>DocuMind AI — Understand More. Explore Further.</strong>
</p>
