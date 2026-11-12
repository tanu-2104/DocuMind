(function () {
    const previousFetch = window.fetch.bind(window);

    window.fetch = async function (input, init) {
        const url = typeof input === "string" ? input : input.url || "";
        const isAIRequest =
            url.includes("/chat") || url.includes("/general-chat");

        const response = await previousFetch(input, init);

        if (!isAIRequest || response.status !== 503) {
            return response;
        }

        const requestBody = init && init.body ? init.body : null;
        const chatMessages = document.getElementById("chatMessages");

        if (!chatMessages || !requestBody) return response;

        let oldButton = document.getElementById("documindRetryButton");
        if (oldButton) oldButton.remove();

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "margin:12px 0;";

        const button = document.createElement("button");
        button.id = "documindRetryButton";
        button.type = "button";
        button.textContent = "↻ Try Again";
        button.style.cssText =
            "padding:11px 20px;border:1px solid #8B5CF6;" +
            "border-radius:10px;background:#17132F;color:white;" +
            "font-weight:600;cursor:pointer;";

        button.addEventListener("click", async function () {
            button.disabled = true;
            button.textContent = "Trying again...";

            try {
                const retryResponse = await window.fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: requestBody
                });

                const result = await retryResponse.json();

                if (!retryResponse.ok) {
                    button.disabled = false;
                    button.textContent = "↻ Try Again";
                    return;
                }

                wrapper.remove();

                const answer = document.createElement("div");
                answer.style.cssText =
                    "margin:12px 0;padding:15px;border-radius:14px;" +
                    "background:#11162B;border:1px solid rgba(139,92,246,.2);" +
                    "color:#F4F5FF;white-space:pre-wrap;line-height:1.7;";

                const heading = document.createElement("strong");
                heading.textContent = "DOCUMIND AI";
                heading.style.cssText =
                    "display:block;color:#22D3EE;margin-bottom:8px;";

                const content = document.createElement("div");
                content.textContent = result.answer;

                answer.append(heading, content);
                chatMessages.appendChild(answer);
                chatMessages.scrollTop = chatMessages.scrollHeight;

            } catch (error) {
                button.disabled = false;
                button.textContent = "↻ Try Again";
                console.error("[DocuMind] Retry failed:", error);
            }
        });

        wrapper.appendChild(button);

        // Allow the existing chat script to display its error first.
        setTimeout(function () {
            chatMessages.appendChild(wrapper);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 300);

        return response;
    };

    console.log("[DocuMind] Retry button enabled.");
})();
