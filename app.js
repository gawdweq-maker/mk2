(function () {
    const MAX_ITEMS = 10;
    const emptyState = document.getElementById("empty-state");
    const tableWrap = document.getElementById("table-wrap");
    const feedBody = document.getElementById("feed-body");
    const entryCount = document.getElementById("entry-count");

    function formatValue(value) {
        return value === undefined || value === null || value === "" ? "-" : String(value);
    }

    function render(payload) {
        const items = Array.isArray(payload?.items) ? payload.items.slice(0, MAX_ITEMS) : [];
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
                <td>${formatValue(item.id)}</td>
                <td>${formatValue(item.accountId)}</td>
                <td>${formatValue(item.itemId)}</td>
                <td>${formatValue(item.amount)}</td>
                <td>${formatValue(item.price)}</td>
                <td><span class="type-badge">${formatValue(item.type)}</span></td>
            `;
            feedBody.appendChild(row);
        }
    }

    window.tradeLotFeedSync = function tradeLotFeedSync(payload) {
        render(payload);
    };

    if ("alt" in window) {
        window.alt.on("tradeLotFeed:update", window.tradeLotFeedSync);
        window.alt.emit("tradeLotFeed:ready");
    }

    render({ items: [] });
})();
