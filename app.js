(function () {
    const IMAGE_BASE_URL = "https://cdn-eu.majestic-files.net/public/master/static/img/inventory/items";
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

    function buildImageUrl(itemId) {
        return `${IMAGE_BASE_URL}/${itemId}.webp`;
    }

    function createImageCell(item) {
        return `
            <img
                class="item-image"
                src="${buildImageUrl(item.itemId)}"
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

    function parseCompactPayload(compactValue, eventName) {
        const items = [];

        if (!compactValue) {
            return {
                eventName: eventName || "marketplace.client.initResult",
                items
            };
        }

        const rows = compactValue.split(";");

        for (const row of rows) {
            if (!row) {
                continue;
            }

            const parts = row.split(",");
            if (parts.length < 3) {
                continue;
            }

            const itemId = Number(parts[0]);
            if (!itemId) {
                continue;
            }

            items.push({
                itemId,
                totalQuantity: parts[1],
                startingBet: Number(parts[2] ?? 0)
            });
        }

        return {
            eventName: eventName || "marketplace.client.initResult",
            items
        };
    }

    function parsePayloadFromHash() {
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
        const params = new URLSearchParams(hash);
        const version = params.get("v");
        const compactData = params.get("data");
        const eventName = params.get("event");

        if (version === "2" && compactData) {
            const decodedCompact = decodeURIComponent(compactData);
            payloadInput.value = decodedCompact;
            return parseCompactPayload(decodedCompact, eventName);
        }

        return null;
    }

    function applyPayloadFromTextarea() {
        const compact = (payloadInput.value || "").trim();
        const payload = parseCompactPayload(compact, "marketplace.client.initResult");
        const nextHash = `v=2&event=${encodeURIComponent(payload.eventName)}&data=${encodeURIComponent(compact)}`;
        window.location.hash = nextHash;
        setSourceLabel("Источник: compact payload");
        render(payload);
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
        setSourceLabel(payload ? "Источник: compact payload" : "Источник: URL hash");
        render(payload || { items: [] });
    });

    const initialPayload = parsePayloadFromHash();
    setSourceLabel(initialPayload ? "Источник: compact payload" : "Источник: URL hash");
    render(initialPayload || { items: [] });
})();
