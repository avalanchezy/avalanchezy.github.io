document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const themeButton = document.querySelector('.theme-toggle');
    const menuButton = document.querySelector('.mobile-menu-btn');
    const menu = document.getElementById('nav-links');
    const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
    const pageNames = new Set(navLinks.map(link => link.hash.slice(1)));
    const pageSections = [...document.querySelectorAll('main > [data-page]')];
    const pageAliases = { life: 'about', visitors: 'home' };
    const languageSelect = document.getElementById('language-select');
    const moodText = document.getElementById('mood-text');
    const portrait = document.getElementById('portrait-button');
    const portraitCaption = document.getElementById('portrait-caption');
    const noteButton = document.getElementById('note-button');
    const noteText = document.getElementById('note-text');
    const photoButtons = [...document.querySelectorAll('.photo-button')];
    const photoDialog = document.getElementById('photo-dialog');
    const photoDialogImage = document.getElementById('photo-dialog-image');
    const photoDialogTitle = document.getElementById('photo-dialog-title');
    const photoDialogCaption = document.getElementById('photo-dialog-caption');
    const filterButtons = [...document.querySelectorAll('.filter-button')];
    const publications = [...document.querySelectorAll('.publication-item')];
    const publicationCount = document.getElementById('publication-count');
    const emailAddress = document.getElementById('contact-email-address');
    const copyEmailButton = document.getElementById('copy-email');
    const emailCopyStatus = document.getElementById('email-copy-status');
    const revealElements = [...document.querySelectorAll('.reveal')];
    const supportedLanguages = ['en', 'zh', 'fr', 'ja', 'ko'];

    let savedTheme;
    let savedLanguage;
    try {
        savedTheme = localStorage.getItem('theme');
        savedLanguage = localStorage.getItem('language');
    } catch (_) {
        // The page still works when browser storage is unavailable.
    }

    const browserLanguage = (navigator.languages || [navigator.language])
        .map(value => value.toLowerCase().split('-')[0])
        .find(value => supportedLanguages.includes(value));
    let language = supportedLanguages.includes(savedLanguage) ? savedLanguage : browserLanguage || 'en';
    let copy = window.siteCopy[language];
    const randomIndex = items => Math.floor(Math.random() * items.length);
    let moodIndex = randomIndex(copy.moods);
    let captionIndex = randomIndex(copy.captions);
    let noteIndex = randomIndex(copy.notes);
    let selectedPhoto;
    let filterYear = 'all';
    let activePage = 'home';
    let revealObserver;
    let emailCopyStatusKey = '';
    const visitorStats = window.createVisitorStats(language);

    function setTheme(dark) {
        document.body.classList.toggle('dark', dark);
        themeButton.querySelector('.theme-icon').textContent = dark ? '☼' : '☾';
        themeButton.setAttribute('aria-label', copy[dark ? 'themeLight' : 'themeDark']);
    }

    themeButton.addEventListener('click', () => {
        const dark = !document.body.classList.contains('dark');
        setTheme(dark);
        try {
            localStorage.setItem('theme', dark ? 'dark' : 'light');
        } catch (_) {
            // Keep the chosen theme for this visit.
        }
    });

    function setMenu(open) {
        menu.classList.toggle('is-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', copy[open ? 'menuClose' : 'menuOpen']);
    }

    menuButton.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    document.addEventListener('click', event => {
        if (!menu.contains(event.target) && !menuButton.contains(event.target) && !event.target.closest('.language-switch')) {
            setMenu(false);
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu.classList.contains('is-open')) {
            setMenu(false);
            menuButton.focus();
        }
    });
    window.matchMedia('(min-width: 1001px)').addEventListener('change', event => {
        if (event.matches) setMenu(false);
    });

    function pageFromLocation() {
        const hash = window.location.hash.slice(1);
        const legacyPage = pageAliases[hash] || hash;
        const requested = pageNames.has(legacyPage)
            ? legacyPage : new URL(window.location.href).searchParams.get('page');
        return pageNames.has(requested) ? requested : 'home';
    }

    function pageAnchorFromLocation() {
        const hash = window.location.hash.slice(1);
        return Object.hasOwn(pageAliases, hash) ? hash : '';
    }

    function pageURL(page, anchor = '') {
        const url = new URL(window.location.href);
        url.hash = anchor;
        if (page === 'home') url.searchParams.delete('page');
        else url.searchParams.set('page', page);
        return `${url.pathname}${url.search}${url.hash}`;
    }

    function updatePageTitle() {
        const link = navLinks.find(link => link.dataset.pageLink === activePage);
        document.title = activePage === 'home' ? copy.pageTitle : `${copy[link.dataset.i18n]} · ${copy.siteName}`;
    }

    function showPage(page, focus = false, anchor = '') {
        activePage = page;
        pageSections.forEach(section => { section.hidden = section.dataset.page !== page; });
        document.body.dataset.page = page;
        navLinks.forEach(link => {
            if (link.dataset.pageLink === page) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
        if (photoDialog.open) photoDialog.close();
        setMenu(false);
        updatePageTitle();
        if (anchor) document.getElementById(anchor).scrollIntoView({ behavior: 'instant', block: 'start' });
        else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (focus) {
            const heading = document.getElementById(anchor || page).querySelector('h1, h2');
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
        }
    }

    // Keep ordinary anchor navigation as a fallback when JavaScript is unavailable.
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const page = pageAliases[link.hash.slice(1)] || link.hash.slice(1);
        if (!pageNames.has(page)) return;
        link.dataset.pageLink = page;
        link.href = pageURL(page);
        link.addEventListener('click', event => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            if (page !== activePage || window.location.hash) window.history.pushState(null, '', pageURL(page));
            showPage(page, true);
        });
    });

    function restorePage() {
        const page = pageFromLocation();
        if (window.location.hash === '#main' && page === activePage) return;
        const anchor = pageAnchorFromLocation();
        window.history.replaceState(window.history.state, '', pageURL(page, anchor));
        showPage(page, true, anchor);
    }
    window.history.scrollRestoration = 'manual';
    window.addEventListener('popstate', restorePage);
    window.addEventListener('hashchange', restorePage);

    moodText.setAttribute('aria-live', 'polite');
    document.getElementById('mood-button').addEventListener('click', () => {
        moodIndex = randomIndex(copy.moods);
        moodText.textContent = copy.moods[moodIndex];
    });

    portraitCaption.setAttribute('aria-live', 'polite');
    portrait.addEventListener('click', () => {
        captionIndex = randomIndex(copy.captions);
        portraitCaption.textContent = copy.captions[captionIndex];
        if (!reducedMotion.matches) portrait.classList.add('is-waving');
    });
    portrait.addEventListener('animationend', () => portrait.classList.remove('is-waving'));

    noteButton.addEventListener('click', () => {
        noteIndex = randomIndex(copy.notes);
        noteText.innerHTML = copy.notes[noteIndex];
    });

    function updateEmailCopyStatus() {
        emailCopyStatus.textContent = emailCopyStatusKey ? copy[emailCopyStatusKey] : '';
    }

    copyEmailButton.addEventListener('click', async () => {
        copyEmailButton.disabled = true;
        emailCopyStatusKey = '';
        updateEmailCopyStatus();
        try {
            await navigator.clipboard.writeText(emailAddress.textContent.trim());
            emailCopyStatusKey = 'emailCopied';
        } catch (_) {
            const range = document.createRange();
            range.selectNodeContents(emailAddress);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            emailCopyStatusKey = 'emailCopyFallback';
        } finally {
            copyEmailButton.disabled = false;
            updateEmailCopyStatus();
        }
    });
    copyEmailButton.hidden = false;

    function showPhoto(button) {
        selectedPhoto = button;
        const id = button.dataset.photo;
        const key = `photo${id[0].toUpperCase()}${id.slice(1)}`;
        const photo = button.querySelector('img');
        photoDialogImage.src = photo.src;
        photoDialogImage.width = Number(photo.getAttribute('width'));
        photoDialogImage.height = Number(photo.getAttribute('height'));
        photoDialogImage.alt = copy[`${key}Alt`];
        photoDialogTitle.textContent = copy[`${key}Title`];
        photoDialogCaption.textContent = copy[`${key}Caption`];
    }

    photoButtons.forEach(button => button.addEventListener('click', () => {
        showPhoto(button);
        photoDialog.showModal();
        document.body.classList.add('photo-open');
    }));
    document.getElementById('photo-close').addEventListener('click', () => photoDialog.close());
    document.getElementById('photo-shuffle').addEventListener('click', () => {
        const pagePhotos = photoButtons.filter(button => button.closest('[data-page]').dataset.page === activePage);
        showPhoto(pagePhotos[randomIndex(pagePhotos)]);
    });
    photoDialog.addEventListener('click', event => {
        if (event.target === photoDialog) photoDialog.close();
    });
    photoDialog.addEventListener('close', () => document.body.classList.remove('photo-open'));

    function filterPublications(year) {
        filterYear = year;
        let count = 0;
        publications.forEach(publication => {
            publication.hidden = year !== 'all' && publication.dataset.year !== year;
            if (!publication.hidden) count++;
        });
        filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.year === year)));
        const countKey = year === 'all'
            ? (count === 1 ? 'countOne' : 'countMany')
            : (count === 1 ? 'countYearOne' : 'countYearMany');
        publicationCount.textContent = copy[countKey].replace('{count}', count).replace('{year}', year);
    }

    filterButtons.forEach(button => button.addEventListener('click', () => filterPublications(button.dataset.year)));

    function applyLanguage(nextLanguage) {
        language = nextLanguage;
        copy = window.siteCopy[language];
        document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
        updatePageTitle();
        document.querySelector('meta[name="description"]').content = copy.pageDescription;
        document.querySelectorAll('[data-i18n]').forEach(element => {
            element.innerHTML = copy[element.dataset.i18n];
        });
        [['aria', 'aria-label'], ['title', 'title'], ['alt', 'alt']].forEach(([key, attribute]) => {
            document.querySelectorAll(`[data-i18n-${key}]`).forEach(element => {
                element.setAttribute(attribute, copy[element.getAttribute(`data-i18n-${key}`)]);
            });
        });
        languageSelect.value = language;
        moodText.textContent = copy.moods[moodIndex];
        portraitCaption.textContent = copy.captions[captionIndex];
        noteText.innerHTML = copy.notes[noteIndex];
        updateEmailCopyStatus();
        photoButtons.forEach(button => {
            const id = button.dataset.photo;
            const key = `photo${id[0].toUpperCase()}${id.slice(1)}Title`;
            button.setAttribute('aria-label', copy.photoOpenLabel.replace('{title}', copy[key]));
        });
        if (photoDialog.open) showPhoto(selectedPhoto);
        visitorStats.setLanguage(language);
        setTheme(document.body.classList.contains('dark'));
        setMenu(menu.classList.contains('is-open'));
        filterPublications(filterYear);
    }

    languageSelect.addEventListener('change', () => {
        applyLanguage(languageSelect.value);
        try {
            localStorage.setItem('language', language);
        } catch (_) {
            // Keep the chosen language for this visit.
        }
    });

    setTheme(savedTheme === 'dark' || (savedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    setMenu(false);
    applyLanguage(language);
    const initialPage = pageFromLocation();
    const initialAnchor = pageAnchorFromLocation();
    window.history.replaceState(window.history.state, '', pageURL(initialPage, initialAnchor));
    showPage(initialPage, false, initialAnchor);

    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });

        revealElements.forEach(element => {
            if (element.getBoundingClientRect().top >= window.innerHeight) {
                element.classList.add('will-reveal');
                revealObserver.observe(element);
            } else {
                element.classList.add('is-visible');
            }
        });
    }
    reducedMotion.addEventListener('change', event => {
        if (event.matches) {
            if (revealObserver) revealObserver.disconnect();
            revealElements.forEach(element => {
                element.classList.remove('will-reveal');
                element.classList.add('is-visible');
            });
            portrait.classList.remove('is-waving');
        }
    });
});
