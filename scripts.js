document.addEventListener('DOMContentLoaded', function() {

    // --- CATEGORY DATA ---
const categories = [

    { name: 'All', href: '/all-categories' },
    { name: 'Anime', href: '/category/anime-live-wallpapers' },
    { name: '4K', href: '/search/4k' },
    { name: '🔥Remastered 4K', href: '/category/remastered-4k-wallpapers' },
    { name: '💎 Ultra HDR', href: '/category/ultra-hdr' },
    { name: 'Demon Slayer', href: '/search/demon-slayer' },
    { name: 'Goku', href: '/search/goku' },
    { name: 'Naruto', href: '/search/naruto' },
    { name: 'BMW', href: '/search/bmw' },
    { name: 'One Piece', href: '/search/one piece' },
    { name: 'Pokemon', href: '/search/pokemon' },
    { name: 'Minecraft', href: '/search/minecraft' },
    { name: 'Samurai', href: '/search/samurai' },
    { name: 'Rain', href: '/search/rain' },
    { name: 'Spiderman', href: '/search/spiderman' },
    { name: 'White', href: '/search/white' },
    { name: 'Batman', href: '/search/batman' },
    { name: 'Space', href: '/search/space' },
    { name: 'Red', href: '/search/red' },
    { name: 'Dark', href: '/search/dark' },
    { name: 'Bleach', href: '/search/bleach' },
    { name: 'Cyberpunk', href: '/search/cyberpunk' },
    { name: 'Valorant', href: '/search/valorant' },
    { name: 'Cat', href: '/search/cat' },
    { name: 'Blue', href: '/search/blue' },
    { name: 'Purple', href: '/search/purple' }
];

    // --- ELEMENT SELECTORS ---
    const container = document.querySelector('.category-tags-container');
    const slideLeftButton = document.getElementById('slideLeft');
    const slideRightButton = document.getElementById('slideRight');

    // --- SAFETY CHECK ---
    if (!container || !slideLeftButton || !slideRightButton) {
        console.error("Slider elements not found. Make sure the HTML is correct.");
        return;
    }

    // --- POPULATE TAGS ---
    container.innerHTML = ''; 
    categories.forEach(category => {
        const button = document.createElement('a');
        button.href = category.href;
        button.textContent = category.name;
        button.classList.add('category-button'); // Use the class you already styled
        container.appendChild(button);
    });

    // --- ARROW LOGIC ---
    function checkArrows() {
        // scrollLeft is how far we've scrolled from the left
        const currentScroll = container.scrollLeft;
        // scrollWidth is the total width of all content, clientWidth is the visible width
        const maxScroll = container.scrollWidth - container.clientWidth;

        // Disable left arrow if we are at the beginning
        slideLeftButton.disabled = currentScroll < 1;
        
        // Disable right arrow if we are at the end
        slideRightButton.disabled = currentScroll >= maxScroll - 1;
    }

    // --- EVENT LISTENERS ---
    slideLeftButton.addEventListener('click', () => {
        container.scrollLeft -= 300; // Scroll left by 300 pixels
    });

    slideRightButton.addEventListener('click', () => {
        container.scrollLeft += 300; // Scroll right by 300 pixels
    });

    // Check arrow visibility whenever the user scrolls the container
    container.addEventListener('scroll', checkArrows);
    
    // Also check when the window is resized, as this can change the max scroll width
    window.addEventListener('resize', checkArrows);

    // Initial check when the page loads
    checkArrows();

});

document.addEventListener('DOMContentLoaded', () => {

    // --- CHROME BUTTON LOGIC ---
    const chromeButton = document.querySelector('.dh-button-chrome');
    if (chromeButton) {
        const EXTENSION_ID = "ogibgalpdcjnpagpbbodfpegjiffmhnb";
        const CHROME_WEB_STORE_URL = `https://chromewebstore.google.com/detail/desktophut-live-wallpaper/${EXTENSION_ID}`;

        const isExtensionInstalled = (callback) => {
            if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage(EXTENSION_ID, { type: "ping" }, response => {
                    callback(!chrome.runtime.lastError);
                });
            } else {
                callback(false);
            }
        };

        const updateButtonState = (installed) => {
            if (installed) {
                chromeButton.textContent = 'Extension Installed';
                chromeButton.classList.add('installed');
                chromeButton.disabled = true;
            } else {
                chromeButton.textContent = 'Add to Chrome';
                chromeButton.classList.remove('installed');
                chromeButton.disabled = false;
            }
        };

        isExtensionInstalled(updateButtonState);

        chromeButton.addEventListener('click', () => {
            if (!chromeButton.classList.contains('installed')) {
                window.open(CHROME_WEB_STORE_URL, '_blank');
            }
        });
    }
});
// scripts.js

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenuButton = document.getElementById('close-menu-button');

    if (mobileMenuButton && mobileMenu && closeMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        closeMenuButton.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchIcon = document.getElementById('searchIcon');

    if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/search/${encodeURIComponent(query)}`;
            }
        });

        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `/search/${encodeURIComponent(query)}`;
                }
            }
        });
    }
     if (searchInput && searchIcon) {
        searchIcon.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/search/${encodeURIComponent(query)}`;
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput2');
    const searchButton = document.getElementById('searchButton2');
    const searchIcon = document.getElementById('searchIcon2');

    if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/search/${encodeURIComponent(query)}`;
            }
        });

        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `/search/${encodeURIComponent(query)}`;
                }
            }
        });
    }
     if (searchInput && searchIcon) {
        searchIcon.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/search/${encodeURIComponent(query)}`;
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.getElementById('backToTop');

    if (backToTopButton) {
        // Show or hide the button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) { // Show button after scrolling 300px
                backToTopButton.classList.remove('hidden');
            } else {
                backToTopButton.classList.add('hidden');
            }
        });

        // Scroll to top when the button is clicked
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
document.addEventListener('DOMContentLoaded', function () {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const downloadButton = document.getElementById('downloadButton');
    const countdownElement = document.getElementById('countdown');
    const downloadLink = document.getElementById('downloadLink');

    if (downloadButton && countdownElement && downloadLink) {
        downloadButton.addEventListener('click', function() {
            // Hide the button and show the countdown
            downloadButton.classList.add('hidden');
            countdownElement.classList.remove('hidden');

            let countdown = 5;
            countdownElement.textContent = `Your download will start in ${countdown}...`;

            const interval = setInterval(function() {
                countdown--;
                countdownElement.textContent = `Your download will start in ${countdown}...`;
                if (countdown <= 0) {
                    clearInterval(interval);
                    countdownElement.classList.add('hidden');
                    downloadLink.classList.remove('hidden');
                    // Optional: Automatically click the link to start the download
                    // downloadLink.click();
                }
            }, 1000);
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('background-video');
    const volumeControl = document.getElementById('volume-control');

    if (video && volumeControl) {
        // Set initial volume
        video.volume = volumeControl.value;

        // Update volume when slider changes
        volumeControl.addEventListener('input', function() {
            video.volume = this.value;
        });
    }
});
