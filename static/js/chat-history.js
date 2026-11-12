(function () {
    const STORAGE_KEY = "documind_chat_history_v1";
    const originalFetch = window.fetch.bind(window);

    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    }

    function saveHistory(item) {
        try {
            const history = getHistory();
            history.unshift(item);
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(history.slice(0, 50))
            );
            renderHistory();
        } catch (error) {
            console.warn("[DocuMind] Could not save chat history:", error);
        }
    }

    function addBubble(container, label, content, isUser) {
        const wrapper = document.createElement("div");
        wrapper.style.cssText =
            "display:flex;justify-content:" +
            (isUser ? "flex-end" : "flex-start") +
            ";margin:14px 0;";

        const bubble = document.createElement("div");
        bubble.style.cssText =
            "max-width:90%;padding:14px 17px;border-radius:14px;" +
            "background:" + (isUser ? "rgba(139,92,246,.18)" : "#11162B") +
            ";border:1px solid rgba(139,92,246,.2);" +
            "color:#F4F5FF;white-space:pre-wrap;overflow-wrap:anywhere;" +
            "font-size:13px;line-height:1.7;";

        const heading = document.createElement("strong");
        heading.textContent = label;
        heading.style.cssText =
            "display:block;color:#22D3EE;margin-bottom:7px;font-size:11px;";

        const text = document.createElement("div");
        text.textContent = content;

        bubble.append(heading, text);
        wrapper.appendChild(bubble);
        container.appendChild(wrapper);
    }

    function restoreConversation(item) {
        const messages = document.getElementById("chatMessages");
        if (!messages) return;

        messages.replaceChildren();

        addBubble(messages, "YOU", item.question, true);
        addBubble(messages, "DOCUMIND AI", item.answer, false);

        messages.scrollTop = messages.scrollHeight;
        closeHistory();
    }

    let overlay;
    let panel;

    function closeHistory() {
        if (overlay) overlay.style.display = "none";
    }

    function renderHistory() {
        if (!panel) return;

        const list = panel.querySelector("#documindHistoryList");
        list.replaceChildren();

        const history = getHistory();

        if (history.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "Your conversations will appear here.";
            empty.style.cssText = "color:#9299B5;font-size:13px;padding:15px;";
            list.appendChild(empty);
            return;
        }

        history.forEach((item, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.style.cssText =
                "display:block;width:100%;text-align:left;padding:14px;" +
                "margin-bottom:10px;border:1px solid rgba(139,92,246,.2);" +
                "border-radius:12px;background:#11162B;color:#F4F5FF;" +
                "cursor:pointer;";

            const title = document.createElement("strong");
            title.textContent = item.question.length > 65
                ? item.question.slice(0, 65) + "..."
                : item.question;
            title.style.cssText = "display:block;font-size:13px;margin-bottom:8px;";

            const details = document.createElement("small");
            details.textContent =
                (item.mode === "pdf" ? "PDF Mode" : "General AI") +
                " • " + new Date(item.date).toLocaleString();
            details.style.cssText = "color:#9299B5;font-size:10px;";

            button.append(title, details);
            button.addEventListener("click", () => restoreConversation(item));
            list.appendChild(button);
        });
    }

    function createHistoryUI() {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.textContent = "◷  Chat History";
        toggle.style.cssText =
            "position:fixed;right:24px;bottom:24px;z-index:9998;" +
            "padding:13px 19px;border:1px solid #8B5CF6;border-radius:12px;" +
            "background:#17132F;color:white;font-weight:600;cursor:pointer;" +
            "box-shadow:0 5px 25px rgba(139,92,246,.2);";

        overlay = document.createElement("div");
        overlay.style.cssText =
            "display:none;position:fixed;inset:0;z-index:9999;" +
            "background:rgba(0,0,0,.65);";

        panel = document.createElement("div");
        panel.style.cssText =
            "position:absolute;right:0;top:0;height:100%;width:min(390px,92vw);" +
            "box-sizing:border-box;padding:24px;background:#090B18;" +
            "border-left:1px solid rgba(139,92,246,.3);" +
            "display:flex;flex-direction:column;";

        const header = document.createElement("div");
        header.style.cssText =
            "display:flex;justify-content:space-between;align-items:center;" +
            "margin-bottom:20px;";

        const heading = document.createElement("h2");
        heading.textContent = "Chat History";
        heading.style.cssText = "color:#F4F5FF;font-size:20px;margin:0;";

        const close = document.createElement("button");
        close.type = "button";
        close.textContent = "✕";
        close.style.cssText =
            "background:none;border:0;color:white;font-size:20px;cursor:pointer;";
        close.addEventListener("click", closeHistory);

        header.append(heading, close);

        const info = document.createElement("p");
        info.textContent = "Your recent conversations";
        info.style.cssText = "color:#9299B5;font-size:12px;margin:0 0 15px;";

        const list = document.createElement("div");
        list.id = "documindHistoryList";
        list.style.cssText = "overflow-y:auto;flex:1;";

        const footer = document.createElement("p");
        footer.textContent = "Saved in this browser • Last 50 conversations";
        footer.style.cssText = "color:#777F9C;font-size:10px;margin-top:15px;";

        panel.append(header, info, list, footer);
        overlay.appendChild(panel);
        document.body.append(toggle, overlay);

        toggle.addEventListener("click", () => {
            overlay.style.display = "block";
            renderHistory();
        });

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closeHistory();
        });

        renderHistory();
    }

    // Capture successful AI conversations.
    window.fetch = async function (input, init) {
        const url = typeof input === "string" ? input : input.url || "";
        const isPdf = url.includes("/chat") && !url.includes("/general-chat");
        const isGeneral = url.includes("/general-chat");

        const response = await originalFetch(input, init);

        if ((isPdf || isGeneral) && response.ok) {
            try {
                const body = JSON.parse(init?.body || "{}");
                const result = await response.clone().json();

                if (body.question && result.answer) {
                    saveHistory({
                        mode: isPdf ? "pdf" : "general",
                        documentId: body.document_id || null,
                        question: body.question,
                        answer: result.answer,
                        date: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.warn("[DocuMind] History capture failed:", error);
            }
        }

        return response;
    };

    function initialize() {
        createHistoryUI();
        console.log("[DocuMind] Chat History enabled.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
