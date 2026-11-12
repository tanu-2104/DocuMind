const pdfInput = document.getElementById("pdfInput");
const uploadArea = document.getElementById("uploadArea");
const uploadStatus = document.getElementById("uploadStatus");
const questionInput = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");

const pdfModeButton = document.getElementById("pdfModeButton");
const generalModeButton = document.getElementById("generalModeButton");
const documentCard = document.getElementById("documentCard");
const chatSubtitle = document.getElementById("chatSubtitle");

let currentDocumentId = null;
let currentMode = "pdf";
let isSending = false;
let isUploading = false;


// Safely render inline Markdown.
function appendInline(parent, text) {
    const pattern = /(\*\*.+?\*\*|__.+?__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`)/g;

    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parent.appendChild(
                document.createTextNode(text.slice(lastIndex, match.index))
            );
        }

        const token = match[0];
        let element;

        if (token.startsWith("**") || token.startsWith("__")) {
            element = document.createElement("strong");
            element.textContent = token.slice(2, -2);
        } else if (token.startsWith("`")) {
            element = document.createElement("code");
            element.textContent = token.slice(1, -1);
        } else {
            element = document.createElement("em");
            element.textContent = token.slice(1, -1);
        }

        parent.appendChild(element);
        lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
        parent.appendChild(
            document.createTextNode(text.slice(lastIndex))
        );
    }
}


// Convert Markdown table row into cells.
function getTableCells(line) {
    return line.trim().replace(/^\||\|$/g, "")
        .split("|")
        .map(cell => cell.trim());
}


// Render Markdown safely.
function renderMarkdown(container, text) {
    container.replaceChildren();

    text = String(text || "")
        .replace(/\\\*/g, "*")
        .replace(/<br\s*\/?>/gi, "\n");

    const lines = text.split(/\r?\n/);
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line) {
            i++;
            continue;
        }

        // Code blocks.
        if (line.startsWith("```")) {
            const code = document.createElement("pre");
            const codeElement = document.createElement("code");

            i++;
            const codeLines = [];

            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }

            codeElement.textContent = codeLines.join("\n");
            code.appendChild(codeElement);
            container.appendChild(code);

            i++;
            continue;
        }

        // Tables.
        if (
            line.includes("|") &&
            i + 1 < lines.length &&
            /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i + 1].trim())
        ) {
            const table = document.createElement("table");
            table.className = "markdown-table";

            const header = document.createElement("thead");
            const headerRow = document.createElement("tr");

            getTableCells(line).forEach(cell => {
                const th = document.createElement("th");
                appendInline(th, cell);
                headerRow.appendChild(th);
            });

            header.appendChild(headerRow);
            table.appendChild(header);

            const tbody = document.createElement("tbody");
            i += 2;

            while (i < lines.length && lines[i].trim().includes("|")) {
                const row = document.createElement("tr");

                getTableCells(lines[i]).forEach(cell => {
                    const td = document.createElement("td");
                    appendInline(td, cell);
                    row.appendChild(td);
                });

                tbody.appendChild(row);
                i++;
            }

            table.appendChild(tbody);
            container.appendChild(table);
            continue;
        }

        // Headings.
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

        if (headingMatch) {
            const heading = document.createElement(
                `h${headingMatch[1].length}`
            );

            appendInline(heading, headingMatch[2]);
            container.appendChild(heading);
            i++;
            continue;
        }

        // Horizontal divider.
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
            container.appendChild(document.createElement("hr"));
            i++;
            continue;
        }

        // Lists.
        const listMatch = line.match(/^([-*+]|\d+[.)])\s+(.+)$/);

        if (listMatch) {
            const isNumbered = /^\d/.test(listMatch[1]);
            const list = document.createElement(isNumbered ? "ol" : "ul");

            while (i < lines.length) {
                const itemMatch = lines[i].trim().match(/^([-*+]|\d+[.)])\s+(.+)$/);

                if (!itemMatch || /^\d/.test(itemMatch[1]) !== isNumbered) {
                    break;
                }

                const li = document.createElement("li");
                appendInline(li, itemMatch[2]);
                list.appendChild(li);
                i++;
            }

            container.appendChild(list);
            continue;
        }

        // Blockquotes.
        if (line.startsWith(">")) {
            const quote = document.createElement("blockquote");
            appendInline(quote, line.replace(/^>\s?/, ""));
            container.appendChild(quote);
            i++;
            continue;
        }

        // Paragraphs.
        const paragraph = document.createElement("p");
        const paragraphLines = [];

        while (i < lines.length) {
            const current = lines[i].trim();

            if (
                !current ||
                current.startsWith("```") ||
                /^#{1,6}\s/.test(current) ||
                /^(-{3,}|\*{3,}|_{3,})$/.test(current) ||
                current.startsWith(">") ||
                /^([-*+]|\d+[.)])\s+/.test(current)
            ) {
                break;
            }

            paragraphLines.push(current);
            i++;
        }

        appendInline(paragraph, paragraphLines.join(" "));
        container.appendChild(paragraph);
    }
}


// Display a message.
function addMessage(sender, text, type) {
    const emptyChat = chatMessages.querySelector(".empty-chat");

    if (emptyChat) {
        emptyChat.remove();
    }

    const message = document.createElement("div");
    message.className = `message ${type}`;

    const label = document.createElement("div");
    label.className = "message-label";
    label.textContent = sender;

    const content = document.createElement("div");
    content.className = "message-content";

    if (type === "assistant") {
        renderMarkdown(content, text);
    } else {
        content.textContent = text;
    }

    message.appendChild(label);
    message.appendChild(content);

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}


// Show the correct empty state.
function showEmptyChat() {
    if (currentMode === "pdf") {
        chatMessages.innerHTML = `
            <div class="empty-chat">
                <div class="empty-icon">✧</div>
                <h3>Your conversation starts here</h3>
                <p>Upload a PDF above, then ask your first question.</p>
            </div>
        `;
    } else {
        chatMessages.innerHTML = `
            <div class="empty-chat">
                <div class="empty-icon">✦</div>
                <h3>Meet your AI assistant</h3>
                <p>Ask questions, learn concepts, write code, or explore new ideas.</p>
            </div>
        `;
    }
}


// Update the interface when switching modes.
function switchMode(mode) {
    if (isSending || isUploading) {
        return;
    }

    currentMode = mode;

    chatMessages.replaceChildren();

    if (mode === "pdf") {
        pdfModeButton.classList.add("active");
        generalModeButton.classList.remove("active");

        documentCard.style.display = "";
        chatSubtitle.textContent = "Ask anything about your uploaded document.";

        if (currentDocumentId) {
            questionInput.disabled = false;
            sendButton.disabled = false;
            questionInput.placeholder = "Ask a question about your PDF...";
        } else {
            questionInput.disabled = true;
            sendButton.disabled = true;
            questionInput.placeholder = "Upload a PDF first...";
        }
    } else {
        generalModeButton.classList.add("active");
        pdfModeButton.classList.remove("active");

        documentCard.style.display = "none";
        chatSubtitle.textContent = "Ask anything. No PDF required.";

        questionInput.disabled = false;
        sendButton.disabled = false;
        questionInput.placeholder = "Ask me anything...";
    }

    showEmptyChat();
    questionInput.focus();
}


// PDF upload.
async function uploadPDF(file) {
    if (!file || currentMode !== "pdf" || isUploading) {
        return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf") ||
        file.type !== "application/pdf") {
        uploadStatus.textContent = "Please select a valid PDF file.";
        uploadStatus.className = "upload-status error";
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        uploadStatus.textContent = "File size must be below 20 MB.";
        uploadStatus.className = "upload-status error";
        return;
    }

    isUploading = true;

    uploadStatus.textContent = "Preparing your PDF upload...";
    uploadStatus.className = "upload-status";

    questionInput.disabled = true;
    sendButton.disabled = true;

    try {
        // Detect local or cloud mode.
        const modeResponse = await fetch("/upload-mode");
        const modeData = await modeResponse.json();

        if (!modeResponse.ok) {
            throw new Error(modeData.error || "Could not detect upload mode.");
        }

        let response;

        if (modeData.mode === "cloud") {
            // Step 1: Request a temporary Supabase upload URL.
            uploadStatus.textContent = "Preparing secure cloud upload...";

            const urlResponse = await fetch("/create-upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filename: file.name
                })
            });

            const uploadData = await urlResponse.json();

            if (!urlResponse.ok) {
                throw new Error(uploadData.error || "Could not prepare cloud upload.");
            }

            // Step 2: Upload PDF directly to Supabase.
            uploadStatus.textContent = "Uploading PDF to secure cloud storage...";

            const storageResponse = await fetch(uploadData.signed_url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/pdf",
                    "x-upsert": "false"
                },
                body: file
            });

            if (!storageResponse.ok) {
                throw new Error(
                    `Cloud storage upload failed (HTTP ${storageResponse.status}).`
                );
            }

            // Step 3: Ask Flask to extract text and save document metadata.
            uploadStatus.textContent = "Processing your PDF...";

            response = await fetch("/complete-upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filename: uploadData.filename,
                    stored_filename: uploadData.stored_filename
                })
            });

        } else {
            // Existing local SQLite upload workflow.
            uploadStatus.textContent = "Uploading and processing your PDF...";

            const formData = new FormData();
            formData.append("file", file);

            response = await fetch("/upload", {
                method: "POST",
                body: formData
            });
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Upload failed.");
        }

        currentDocumentId = data.document_id;

        uploadStatus.textContent = `✓ ${data.filename} uploaded successfully!`;
        uploadStatus.className = "upload-status";

        questionInput.disabled = false;
        sendButton.disabled = false;
        questionInput.placeholder = "Ask a question about your PDF...";

        chatMessages.replaceChildren();

        addMessage(
            "DOCUMIND AI",
            `Your document "${data.filename}" is ready! Ask me anything about it.`,
            "assistant"
        );

    } catch (error) {
        console.error("PDF upload error:", error);

        uploadStatus.textContent = error.message;
        uploadStatus.className = "upload-status error";

        questionInput.disabled = !currentDocumentId;
        sendButton.disabled = !currentDocumentId;

    } finally {
        isUploading = false;
    }
}

// File selection.
pdfInput.addEventListener("change", () => {
    uploadPDF(pdfInput.files[0]);
});


// Drag and drop.
uploadArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadArea.classList.remove("dragover");

    uploadPDF(event.dataTransfer.files[0]);
});


// Send a question to the selected AI mode.
async function sendQuestion() {
    const question = questionInput.value.trim();

    if (!question || isSending) {
        return;
    }

    if (currentMode === "pdf" && !currentDocumentId) {
        return;
    }

    addMessage("YOU", question, "user");

    questionInput.value = "";
    questionInput.disabled = true;
    sendButton.disabled = true;
    isSending = true;

    const loadingMessage = addMessage(
        "DOCUMIND AI",
        "Thinking... Please wait.",
        "assistant"
    );

    try {
        const endpoint = currentMode === "pdf"
            ? "/chat"
            : "/general-chat";

        const requestBody = currentMode === "pdf"
            ? {
                document_id: currentDocumentId,
                question: question
            }
            : {
                question: question
            };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not generate an answer.");
        }

        const content = loadingMessage.querySelector(".message-content");
        renderMarkdown(content, data.answer);

    } catch (error) {
        const content = loadingMessage.querySelector(".message-content");
        content.textContent = `Error: ${error.message}`;

    } finally {
        isSending = false;

        questionInput.disabled =
            currentMode === "pdf" && !currentDocumentId;

        sendButton.disabled =
            currentMode === "pdf" && !currentDocumentId;

        questionInput.focus();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}


// Mode buttons.
pdfModeButton.addEventListener("click", () => {
    switchMode("pdf");
});

generalModeButton.addEventListener("click", () => {
    switchMode("general");
});


// Send button.
sendButton.addEventListener("click", sendQuestion);


// Enter to send, Shift + Enter for a new line.
questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendQuestion();
    }
});


// Initial mode.
switchMode("pdf");


