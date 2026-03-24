(function () {
    const IMAGE_BASE_URL = "https://cdn-eu.majestic-files.net/public/master/static/img/inventory/items";
    const UI_EVENT_NAME = "tradeLotFeed:update";
    const UI_READY_EVENT_NAME = "tradeLotFeed:ready";

    const emptyState = document.getElementById("empty-state");
    const tableWrap = document.getElementById("table-wrap");
    const feedBody = document.getElementById("feed-body");
    const entryCount = document.getElementById("entry-count");
    const syncStatus = document.getElementById("sync-status");
    const lastUpdated = document.getElementById("last-updated");
    const feedSource = document.getElementById("feed-source");
    const chunkState = {
        meta: null,
        parts: []
    };

    function formatValue(value) {
        return value === undefined || value === null || value === "" ? "-" : String(value);
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
            syncStatus.textContent = "Ожидание данных";
            lastUpdated.textContent = payload?.updatedAt || "-";
            return;
        }

        emptyState.hidden = true;
        tableWrap.hidden = false;
        entryCount.textContent = `${items.length} записей`;
        syncStatus.textContent = "Данные получены";
        lastUpdated.textContent = payload?.updatedAt || "-";

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

    function parseCompactItems(compactValue) {
        if (!compactValue) {
            return [];
        }

        const rows = compactValue.split(";");
        const items = [];

        for (const row of rows) {
            if (!row) {
                continue;
            }

            const parts = row.split(",");
            if (parts.length < 3) {
                continue;
            }

            items.push({
                itemId: Number(parts[0] ?? 0),
                totalQuantity: String(parts[1] ?? ""),
                startingBet: Number(parts[2] ?? 0)
            });
        }

        return items;
    }

    window.tradeLotFeedSync = function tradeLotFeedSync(payload) {
        render(payload);
    };

    window.tradeLotFeedBegin = function tradeLotFeedBegin(meta) {
        chunkState.meta = meta || {};
        chunkState.parts = [];
    };

    window.tradeLotFeedPushChunk = function tradeLotFeedPushChunk(chunk) {
        chunkState.parts.push(String(chunk || ""));
    };

    window.tradeLotFeedCommit = function tradeLotFeedCommit() {
        const compactItems = chunkState.parts.join("");
        const payload = {
            eventName: chunkState.meta?.eventName || UI_EVENT_NAME,
            updatedAt: chunkState.meta?.updatedAt || null,
            itemCount: Number(chunkState.meta?.itemCount || 0),
            items: parseCompactItems(compactItems)
        };

        render(payload);
    };

    if (window.alt && typeof window.alt.on === "function") {
        feedSource.textContent = "Источник: alt WebView bridge";
        window.alt.on(UI_EVENT_NAME, window.tradeLotFeedSync);

        if (typeof window.alt.emit === "function") {
            window.alt.emit(UI_READY_EVENT_NAME);
        }
    } else {
        feedSource.textContent = "Источник: внешний браузер";
        syncStatus.textContent = "Вне игры данные не придут";
    }

    render({ items: [], updatedAt: null });
})();
