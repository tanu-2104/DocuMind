(function () {
    function addExportButton() {
        const toolbar = document.getElementById("documindChatActions");
        if (!toolbar || document.getElementById("documindExportChat")) return;

        const button = document.createElement("button");
        button.id = "documindExportChat";
        button.type = "button";
        button.textContent = "↓ Export Chat";

        button.style.cssText =
            "position:static;flex:0 0 auto;padding:11px 18px;" +
            "border:1px solid rgba(34,211,238,.55);border-radius:10px;" +
            "background:#102536;color:#E0F7FF;font-size:13px;" +
            "font-weight:600;cursor:pointer;white-space:nowrap;";

        button.addEventListener("click", function () {
            const chat = document.getElementById("chatMessages");

            if (!chat || !chat.innerText.trim()) {
                alert("There are no chat messages to export yet.");
                return;
            }

            const content =
                "DOCUMIND - CHAT EXPORT\n" +
                "Exported: " + new Date().toLocaleString() +
                "\n========================================\n\n" +
                chat.innerText.trim();

            const blob = new Blob([content], {
                type: "text/plain;charset=utf-8"
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "DocuMind-Chat-" +
                new Date().toISOString().slice(0, 10) + ".txt";

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });

        toolbar.appendChild(button);
    }

    function start() {
        addExportButton();

        const observer = new MutationObserver(addExportButton);
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

    console.log("[DocuMind] Export Chat enabled.");
})();
