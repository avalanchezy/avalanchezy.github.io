document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const themeButton = document.querySelector('.theme-toggle');
    let savedTheme;
    try {
        savedTheme = localStorage.getItem('theme');
    } catch (_) {
        // The page still works when browser storage is unavailable.
    }

    function setTheme(dark) {
        document.body.classList.toggle('dark', dark);
        themeButton.querySelector('.theme-icon').textContent = dark ? '☼' : '☾';
        themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    }

    setTheme(savedTheme === 'dark' || (savedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches));
    themeButton.addEventListener('click', () => {
        const dark = !document.body.classList.contains('dark');
        setTheme(dark);
        try {
            localStorage.setItem('theme', dark ? 'dark' : 'light');
        } catch (_) {
            // Keep the chosen theme for this visit.
        }
    });

    const menuButton = document.querySelector('.mobile-menu-btn');
    const menu = document.getElementById('nav-links');
    const navLinks = [...menu.querySelectorAll('a[href^="#"]')];

    function setMenu(open) {
        menu.classList.toggle('is-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    menuButton.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', event => {
        if (!menu.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu.classList.contains('is-open')) {
            setMenu(false);
            menuButton.focus();
        }
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
        if (event.matches) setMenu(false);
    });

    const sections = navLinks.map(link => document.getElementById(link.hash.slice(1)));
    let activeSection;
    let scrollFrame = false;

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
    updateActiveSection();

    const moods = [
        'a peaceful croissant 🥐',
        'a curious baguette 🥖',
        'a slightly caffeinated cookie 🍪',
        'a daydreaming dumpling 🥟',
        'a deadline-powered pretzel 🥨',
        'a very optimistic pancake 🥞'
    ];
    const moodText = document.getElementById('mood-text');
    let moodIndex = 0;
    moodText.setAttribute('aria-live', 'polite');
    document.getElementById('mood-button').addEventListener('click', () => {
        moodIndex = (moodIndex + 1) % moods.length;
        moodText.textContent = moods[moodIndex];
    });

    const portrait = document.getElementById('portrait-button');
    const portraitCaption = document.getElementById('portrait-caption');
    const captions = [
        "yes, that's me.",
        'hello from Lyon!',
        'still curious, still me.',
        'probably a croissant.'
    ];
    let captionIndex = 0;
    portraitCaption.setAttribute('aria-live', 'polite');
    portrait.addEventListener('click', () => {
        captionIndex = (captionIndex + 1) % captions.length;
        portraitCaption.textContent = captions[captionIndex];
        if (!reducedMotion.matches) portrait.classList.add('is-waving');
    });
    portrait.addEventListener('animationend', () => portrait.classList.remove('is-waving'));

    const filterButtons = [...document.querySelectorAll('.filter-button')];
    const publications = [...document.querySelectorAll('.publication-item')];
    const publicationCount = document.getElementById('publication-count');

    function filterPublications(year) {
        let count = 0;
        publications.forEach(publication => {
            publication.hidden = year !== 'all' && publication.dataset.year !== year;
            if (!publication.hidden) count++;
        });
        filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.year === year)));
        publicationCount.textContent = `${count} ${count === 1 ? 'paper' : 'papers'}${year === 'all' ? '' : ` from ${year}`}`;
        queueActiveSectionUpdate();
    }

    filterButtons.forEach(button => button.addEventListener('click', () => filterPublications(button.dataset.year)));
    filterPublications('all');

    const revealElements = [...document.querySelectorAll('.reveal')];
    let revealObserver;
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
