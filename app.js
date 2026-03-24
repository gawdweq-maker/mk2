(function () {
    const emptyState = document.getElementById("empty-state");
    const tableWrap = document.getElementById("table-wrap");
    const feedBody = document.getElementById("feed-body");
    const entryCount = document.getElementById("entry-count");

    function formatValue(value) {
        return value === undefined || value === null || value === "" ? "-" : String(value);
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

    window.tradeLotFeedSync = function tradeLotFeedSync(payload) {
        render(payload);
    };

    render(window.tradeLotFeedState || { items: [] });
})();
