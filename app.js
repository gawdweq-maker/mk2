(function () {
    const IMAGE_BASE_URL = "https://cdn-eu.majestic-files.net/public/master/static/img/inventory/items";
    const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
    const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
    const TABLE_NAME = "marketplace_feed";
    const FEED_KEY = "marketplace_init_result";
    const POLL_MS = 3000;

    const emptyState = document.getElementById("empty-state");
    const tableWrap = document.getElementById("table-wrap");
    const feedBody = document.getElementById("feed-body");
    const entryCount = document.getElementById("entry-count");
    const syncStatus = document.getElementById("sync-status");
    const lastUpdated = document.getElementById("last-updated");

    function hasSupabaseConfig() {
        return SUPABASE_URL !== "https://YOUR_PROJECT_REF.supabase.co" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";
    }

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
        } else {
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

        lastUpdated.textContent = payload?.updated_at || "-";
    }

    async function fetchFeed() {
        if (!hasSupabaseConfig()) {
            syncStatus.textContent = "Укажи Supabase config";
            return;
        }

        const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=feed_key,event_name,items,item_count,updated_at&feed_key=eq.${encodeURIComponent(FEED_KEY)}&limit=1`;
        const response = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            syncStatus.textContent = `Ошибка загрузки: ${response.status}`;
            console.error("Supabase fetch failed", errorText);
            return;
        }

        const rows = await response.json();
        const payload = rows[0] || { items: [], updated_at: null };
        render(payload);
        syncStatus.textContent = payload.items?.length ? "Данные обновлены" : "Ожидание данных";
    }

    render({ items: [], updated_at: null });
    fetchFeed();
    setInterval(fetchFeed, POLL_MS);
})();
