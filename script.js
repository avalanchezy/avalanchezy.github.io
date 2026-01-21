/* ==================================
   Interactive JavaScript
   ================================== */

// Dark Mode Toggle
function toggleTheme() {
    document.body.classList.toggle('dark');
    const btn = document.querySelector('.theme-toggle');
    btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';

    // Save preference
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        document.querySelector('.theme-toggle').textContent = '☀️';
    }

    // Set random adjective and noun
    setRandomText();
    setPublicationAdjective();
});

// Mobile Menu Toggle
function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

// Random Text for Hero
const adjectives = ['a peaceful', 'a happy', 'a sleepy', 'a calm', 'a lazy', 'a hungry'];
const nouns = ['croissant 🥐', 'baguette 🥖', 'cheese 🧀', 'macaron 🍪', 'éclair ⚡', 'crêpe 🥞'];
let currentNoun = 'croissant';

function setRandomText() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    document.getElementById('adjective').textContent = adj;
    document.getElementById('noun').textContent = noun;

    // Extract noun name without emoji for caption
    currentNoun = noun.split(' ')[0];
    currentNoun = currentNoun.charAt(0).toUpperCase() + currentNoun.slice(1);
}

// Publication Random Adjective
const pubAdjectives = ['cool', 'interesting', 'fun', 'awesome', 'brilliant'];

function setPublicationAdjective() {
    const pubAdj = document.getElementById('pub-adjective');
    if (pubAdj) {
        pubAdj.textContent = pubAdjectives[Math.floor(Math.random() * pubAdjectives.length)];
    }
}

// Image Carousel
const images = [
    { src: 'avatar.jpg', caption: 'This is me!' },
    // Add more images here if desired
];
let currentImageIndex = 0;

function changeImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;

    // If only one image, just do a fun animation
    const img = document.getElementById('profile-img');
    img.style.transform = 'scale(1.1) rotate(5deg)';

    setTimeout(() => {
        img.style.transform = '';
    }, 300);

    // Update caption with random fun text
    const captions = ['This is me!', "That's still me!", 'Yes, me again!', 'Hello there!'];
    document.getElementById('img-caption').textContent =
        captions[Math.floor(Math.random() * captions.length)];
}

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            // Close mobile menu if open
            document.querySelector('.nav-links').classList.remove('active');
        }
    });
});

// Add some random rotation to skill tags on load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.skill-tag').forEach(tag => {
        const rotation = (Math.random() - 0.5) * 6; // -3 to 3 degrees
        tag.style.transform = `rotate(${rotation}deg)`;
    });
});
