(function () {
    function setupChatToolbar() {
        const heading = Array.from(document.querySelectorAll("h1,h2,h3"))
            .find(h => h.textContent.trim().toLowerCase() === "ai conversation");

        if (!heading) return;

        const header = heading.parentElement.parentElement;
        if (!header) return;

        let toolbar = document.getElementById("documindChatActions");

        if (!toolbar) {
            toolbar = document.createElement("div");
            toolbar.id = "documindChatActions";
        }

        // Put toolbar on its own row, below the heading and Gemini badge.
        if (toolbar.parentElement !== header.parentElement) {
            header.insertAdjacentElement("afterend", toolbar);
        }

        toolbar.style.cssText =
            "display:flex;flex-direction:row;justify-content:flex-end;" +
            "align-items:center;gap:12px;flex-wrap:wrap;width:100%;" +
            "box-sizing:border-box;margin:12px 0 16px;padding:0;";

        let clearButton = document.getElementById("documindClearChat");

        if (!clearButton) {
            clearButton = document.createElement("button");
            clearButton.id = "documindClearChat";
            clearButton.type = "button";
            clearButton.textContent = "✕ Clear Chat";

            clearButton.addEventListener("click", function () {
                const chat = document.getElementById("chatMessages");
                if (!chat) return;

                if (!confirm("Clear current messages? Your uploaded PDF and saved Chat History will remain safe.")) return;

                chat.innerHTML = "";

                const message = document.createElement("div");
                message.textContent = "Your conversation is clear. Ask a new question!";
                message.style.cssText =
                    "padding:20px;text-align:center;color:#A5B4FC;";
                chat.appendChild(message);

                const retry = document.getElementById("documindRetryButton");
                if (retry && retry.parentElement) retry.parentElement.remove();

                chat.scrollTop = 0;
            });
        }

        clearButton.style.cssText =
            "position:static;flex:0 0 auto;padding:11px 18px;" +
            "border:1px solid rgba(139,92,246,.65);border-radius:10px;" +
            "background:#21183D;color:#F4F5FF;font-size:13px;" +
            "font-weight:600;cursor:pointer;white-space:nowrap;";

        if (clearButton.parentElement !== toolbar) {
            toolbar.appendChild(clearButton);
        }

        const history = Array.from(document.querySelectorAll("button"))
            .find(b => b.textContent.toLowerCase().includes("chat history"));

        if (history) {
            history.style.cssText =
                "position:static;flex:0 0 auto;padding:11px 18px;" +
                "border:1px solid #8B5CF6;border-radius:10px;" +
                "background:#21183D;color:#F4F5FF;font-size:13px;" +
                "font-weight:600;cursor:pointer;white-space:nowrap;";

            if (history.parentElement !== toolbar) {
                toolbar.appendChild(history);
            }
        }
    }

    let scheduled = false;

    function scheduleSetup() {
        if (scheduled) return;
        scheduled = true;

        requestAnimationFrame(function () {
            scheduled = false;
            setupChatToolbar();
        });
    }

    function start() {
        setupChatToolbar();

        const observer = new MutationObserver(scheduleSetup);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

    window.addEventListener("resize", scheduleSetup);
    console.log("[DocuMind] Clean chat toolbar enabled.");
})();
