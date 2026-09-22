// One counting image request per page load; locale/theme changes never recount.
window.createVisitorStats = function (initialLanguage) {
    const counterId = '1881857609';
    const map = document.getElementById('visitor-map');
    const outline = document.getElementById('visitor-map-outline');
    const views = document.getElementById('visitor-views');
    const countries = document.getElementById('visitor-countries');
    const status = document.getElementById('visitor-status');
    let language = initialLanguage;
    let totals;
    let state = 'loading';

    function render() {
        const copy = window.siteCopy[language];
        const format = new Intl.NumberFormat(language);
        views.textContent = totals ? format.format(totals.views) : '—';
        countries.textContent = totals ? format.format(totals.countries) : '—';
        status.hidden = state === 'ready';
        status.textContent = copy[state === 'error' ? 'visitorUnavailable' : 'visitorLoading'];
    }

    async function readTotals() {
        try {
            const response = await fetch(`https://www.stats4u.net/?action=globedata&s4uid=${counterId}`, {
                credentials: 'omit',
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) throw new Error('Statistics unavailable');
            const data = await response.json();
            if (!Number.isFinite(data.t) || !data.c) throw new Error('Counter not ready');
            totals = { views: data.t, countries: Object.keys(data.c).length };
            state = 'ready';
        } catch (_) {
            state = 'error';
        }
        render();
    }

    map.addEventListener('load', () => {
        outline.hidden = true;
        readTotals();
    }, { once: true });
    map.addEventListener('error', () => {
        map.hidden = true;
        state = 'error';
        render();
    }, { once: true });

    // Local previews show the same map without adding test visits.
    const displayOnly = location.hostname === 'avalanchezy.github.io' ? '' : '&rl=1';
    map.src = `https://www.stats4u.net/c/${counterId}-map_w.png?pal=forest&bg=none&kopf=0&zahlen=0&c1=829b87&c2=bd715a${displayOnly}`;
    render();

    return {
        setLanguage(nextLanguage) {
            language = nextLanguage;
            render();
        }
    };
};
