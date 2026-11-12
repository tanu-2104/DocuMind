(function () {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (input, init) {
        const url = typeof input === "string" ? input : input.url || "";
        const isAIRequest =
            url.includes("/chat") || url.includes("/general-chat");

        if (!isAIRequest) {
            return originalFetch(input, init);
        }

        const chatMessages = document.getElementById("chatMessages");
        let indicator = null;

        if (chatMessages) {
            indicator = document.createElement("div");
            indicator.className = "documind-loading";

            const dots = document.createElement("div");
            dots.className = "loading-dots";

            for (let i = 0; i < 3; i++) {
                const dot = document.createElement("span");
                dots.appendChild(dot);
            }

            const message = document.createElement("span");
            message.textContent = "DocuMind is thinking...";

            indicator.appendChild(dots);
            indicator.appendChild(message);
            chatMessages.appendChild(indicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        try {
            return await originalFetch(input, init);
        } finally {
            if (indicator) {
                indicator.remove();
            }
        }
    };

    console.log("[DocuMind] Animated loading indicator enabled.");
})();
