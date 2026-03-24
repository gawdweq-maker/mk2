(function () {
    const emptyState = document.getElementById("empty-state");
    const tableWrap = document.getElementById("table-wrap");
    const feedBody = document.getElementById("feed-body");
    const entryCount = document.getElementById("entry-count");
    const feedSource = document.getElementById("feed-source");
    const payloadInput = document.getElementById("payload-input");
    const applyButton = document.getElementById("apply-json");
    const clearButton = document.getElementById("clear-json");

    function formatValue(value) {
        return value === undefined || value === null || value === "" ? "-" : String(value);
    }

    function setSourceLabel(text) {
        feedSource.textContent = text;
    }

    function createImageCell(item) {
        if (!item.imageUrl) {
            return '<span class="image-fallback">No image</span>';
        }

        return `
            <img
                class="item-image"
                src="${item.imageUrl}"
                alt="Item ${formatValue(item.itemId)}"
                loading="lazy"
                onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'image-fallback', textContent: 'No image' }))"
            >
        `;
    }

    function render(payload) {
        const items = Array.isArray(payload?.items) ? payload.items : [];
        feedBody.innerHTML = "";

        if (items.length === 0) {
            emptyState.hidden = false;
            tableWrap.hidden = true;
            entryCount.textContent = "0 записей";
            return;
        }

        emptyState.hidden = true;
        tableWrap.hidden = false;
        entryCount.textContent = `${items.length} записей`;

        for (const item of items) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${createImageCell(item)}</td>
                <td>${formatValue(item.itemId)}</td>
                <td>${formatValue(item.totalQuantity)}</td>
                <td>${formatValue(item.startingBet)}</td>
            `;
            feedBody.appendChild(row);
        }
    }

    function parsePayloadFromHash() {
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
        const params = new URLSearchParams(hash);
        const rawData = params.get("data");

        if (!rawData) {
            return null;
        }

        try {
            const payload = JSON.parse(decodeURIComponent(rawData));
            payloadInput.value = JSON.stringify(payload, null, 2);
            return payload;
        } catch (error) {
            console.error("Failed to parse payload from hash", error);
            return null;
        }
    }

    function applyPayloadFromTextarea() {
        try {
            const payload = JSON.parse(payloadInput.value || "{}");
            const nextHash = `data=${encodeURIComponent(JSON.stringify(payload))}`;
            window.location.hash = nextHash;
            setSourceLabel("Источник: ручной JSON");
            render(payload);
        } catch (error) {
            alert("JSON payload содержит ошибку");
        }
    }

    function clearPayload() {
        payloadInput.value = "";
        window.location.hash = "";
        setSourceLabel("Источник: URL hash");
        render({ items: [] });
    }

    applyButton.addEventListener("click", applyPayloadFromTextarea);
    clearButton.addEventListener("click", clearPayload);

    window.addEventListener("hashchange", () => {
        const payload = parsePayloadFromHash();
        setSourceLabel(payload ? "Источник: URL hash" : "Источник: URL hash");
        render(payload || { items: [] });
    });

    const initialPayload = parsePayloadFromHash();
    render(initialPayload || { items: [] });
})();
