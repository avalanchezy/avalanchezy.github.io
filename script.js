document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const themeButton = document.querySelector('.theme-toggle');
    const menuButton = document.querySelector('.mobile-menu-btn');
    const menu = document.getElementById('nav-links');
    const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
    const sections = navLinks.map(link => document.getElementById(link.hash.slice(1)));
    const languageSelect = document.getElementById('language-select');
    const moodText = document.getElementById('mood-text');
    const portrait = document.getElementById('portrait-button');
    const portraitCaption = document.getElementById('portrait-caption');
    const filterButtons = [...document.querySelectorAll('.filter-button')];
    const publications = [...document.querySelectorAll('.publication-item')];
    const publicationCount = document.getElementById('publication-count');
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
    let moodIndex = 0;
    let captionIndex = 0;
    let filterYear = 'all';
    let activeSection;
    let scrollFrame = false;
    let revealObserver;

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
    navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
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

    function updateActiveSection() {
        scrollFrame = false;
        let current = sections[0];
        const readingLine = window.innerHeight * 0.3;
        sections.forEach(section => {
            if (section.getBoundingClientRect().top <= readingLine) current = section;
        });
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
            current = sections[sections.length - 1];
        }
        if (current === activeSection) return;
        activeSection = current;
        navLinks.forEach(link => {
            if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }

    function queueActiveSectionUpdate() {
        if (!scrollFrame) {
            scrollFrame = true;
            requestAnimationFrame(updateActiveSection);
        }
    }

    window.addEventListener('scroll', queueActiveSectionUpdate, { passive: true });
    window.addEventListener('resize', queueActiveSectionUpdate);

    moodText.setAttribute('aria-live', 'polite');
    document.getElementById('mood-button').addEventListener('click', () => {
        moodIndex = (moodIndex + 1) % copy.moods.length;
        moodText.textContent = copy.moods[moodIndex];
    });

    portraitCaption.setAttribute('aria-live', 'polite');
    portrait.addEventListener('click', () => {
        captionIndex = (captionIndex + 1) % copy.captions.length;
        portraitCaption.textContent = copy.captions[captionIndex];
        if (!reducedMotion.matches) portrait.classList.add('is-waving');
    });
    portrait.addEventListener('animationend', () => portrait.classList.remove('is-waving'));

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
        queueActiveSectionUpdate();
    }

    filterButtons.forEach(button => button.addEventListener('click', () => filterPublications(button.dataset.year)));

    function applyLanguage(nextLanguage) {
        language = nextLanguage;
        copy = window.siteCopy[language];
        document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
        document.title = copy.pageTitle;
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
