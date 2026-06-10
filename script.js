// ================================================
// Devansh Mishra — Portfolio JavaScript
// Navigation, Typewriter, GitHub API, Spotify API
// ================================================

// ---- Configuration ----
const CONFIG = {
    github: {
        username: 'PIXELoverHERE',
    },
    spotify: {
        clientId: '',      // Stored securely on Vercel environment variables
        refreshToken: '',  // Stored securely on Vercel environment variables
    },
    social: {
        github: 'https://github.com/PIXELoverHERE',
        linkedin: 'https://www.linkedin.com/in/devansh-mishra231',
        twitter: '#',
        spotify: 'https://open.spotify.com/user/31u7qyhyzpfh5hkepgw6gvfhbqqy?si=1cfefc98a6dc4208',
        email: 'devanshmishra231@outlook.com',
        resume: 'https://drive.google.com/drive/folders/19I5Zx7XLQjTgRl9D6y2Y0i8Hd0Z0hy_2?usp=sharing'
    },
    typewriter: {
        phrases: [
            "Hi! I Am Devansh Mishra.",
            "Hi! I am a Software Engineer.",
            "Hi! I am a Student.",
            "Hi! I am a Perfectionist."
        ],
        typeSpeed: 100,
        deleteSpeed: 50,
        pauseEnd: 2000,
        pauseStart: 500
    }
};

// ---- Page Navigation ----
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTypewriter();
    initMobileMenu();
    fetchGitHubContributions();
    checkSpotifySetup();
    fetchSpotifyNowPlaying();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('[data-nav]');
    const pages = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-nav');
            switchPage(targetPage);
        });
    });

    // Show home page by default
    switchPage('home');
}

function switchPage(pageId) {
    const pages = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('[data-nav]');

    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Reset all nav links
    navLinks.forEach(link => {
        link.classList.remove('text-primary', 'font-bold', 'border-b', 'border-primary');
        link.classList.add('text-on-surface-variant');
    });

    // Show target page with slight delay for animation
    setTimeout(() => {
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Highlight active nav links
        navLinks.forEach(link => {
            if (link.getAttribute('data-nav') === pageId) {
                link.classList.add('text-primary', 'font-bold', 'border-b', 'border-primary');
                link.classList.remove('text-on-surface-variant');
            }
        });
    }, 50);

    // Update brand text based on page
    const brandTexts = document.querySelectorAll('.brand-text');
    brandTexts.forEach(el => {
        el.textContent = pageId === 'home' ? 'Devansh' : 'DM';
    });

    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Mobile Menu ----
function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-menu-close');
    const menu = document.getElementById('mobile-menu');

    if (toggleBtn && menu) {
        toggleBtn.addEventListener('click', () => {
            menu.classList.toggle('open');
        });
    }

    if (closeBtn && menu) {
        closeBtn.addEventListener('click', () => {
            menu.classList.remove('open');
        });
    }
}

// ---- Typewriter Effect ----
function initTypewriter() {
    const element = document.getElementById('typewriter');
    if (!element) return;

    const { phrases, typeSpeed, deleteSpeed, pauseEnd, pauseStart } = CONFIG.typewriter;
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            element.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
        } else {
            element.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
        }

        let speed = isDeleting ? deleteSpeed : typeSpeed;

        if (!isDeleting && charIndex === currentPhrase.length) {
            speed = pauseEnd;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            speed = pauseStart;
        }

        setTimeout(type, speed);
    }

    setTimeout(type, 1000);
}

// ---- GitHub Contributions API ----
async function fetchGitHubContributions() {
    const container = document.getElementById('github-contributions');
    const countEl = document.getElementById('github-count');
    if (!container) return;

    try {
        // Use GitHub's public contribution data via the unofficial API
        const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${CONFIG.github.username}?y=last`);

        if (!response.ok) throw new Error('GitHub API failed');

        const data = await response.json();

        // Get total contributions
        const totalContributions = data.total?.lastYear || data.total?.['lastYear'] || 0;
        if (countEl) {
            countEl.textContent = `${totalContributions} contributions in the last year`;
        }

        // Build contribution grid
        const contributions = data.contributions || [];

        // Get last 52 weeks (364 days) of data
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);

        // Organize into weeks
        const weeks = [];
        let currentWeek = [];

        // Pad the first week to start on Sunday
        const startDay = startDate.getDay();
        for (let i = 0; i < startDay; i++) {
            currentWeek.push(null);
        }

        contributions.forEach(day => {
            const date = new Date(day.date);
            if (date >= startDate && date <= today) {
                currentWeek.push(day);
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }
        });

        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        // Render grid
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'inline-grid grid-flow-col grid-rows-7 gap-[3px]';

        weeks.forEach(week => {
            week.forEach(day => {
                const cell = document.createElement('div');
                cell.className = 'contrib-cell relative';

                if (day === null) {
                    cell.style.backgroundColor = 'transparent';
                } else {
                    const level = day.level || 0;
                    const colors = [
                        'rgba(225, 233, 238, 0.1)',   // 0: empty
                        'rgba(0, 119, 181, 0.2)',      // 1: low
                        'rgba(0, 119, 181, 0.4)',      // 2: medium-low
                        'rgba(0, 119, 181, 0.7)',      // 3: medium-high
                        'rgba(0, 119, 181, 1)'         // 4: high
                    ];
                    cell.style.backgroundColor = colors[level] || colors[0];

                    // Add tooltip
                    const tooltip = document.createElement('div');
                    tooltip.className = 'contrib-tooltip';
                    tooltip.textContent = `${day.count} contribution${day.count !== 1 ? 's' : ''} on ${day.date}`;
                    cell.appendChild(tooltip);
                }

                grid.appendChild(cell);
            });
        });

        container.appendChild(grid);

    } catch (error) {
        console.warn('GitHub contributions fetch failed, using fallback:', error);
        renderFallbackContributions(container, countEl);
    }
}

function renderFallbackContributions(container, countEl) {
    if (countEl) countEl.textContent = 'contributions in the last year';

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'inline-grid grid-flow-col grid-rows-7 gap-[3px]';

    const colors = [
        'rgba(225, 233, 238, 0.1)',
        'rgba(0, 119, 181, 0.2)',
        'rgba(0, 119, 181, 0.4)',
        'rgba(0, 119, 181, 0.7)',
        'rgba(0, 119, 181, 1)'
    ];

    // Generate 52 weeks x 7 days
    for (let week = 0; week < 52; week++) {
        for (let day = 0; day < 7; day++) {
            const cell = document.createElement('div');
            cell.className = 'contrib-cell';
            const level = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 5);
            cell.style.backgroundColor = colors[level];
            grid.appendChild(cell);
        }
    }

    container.appendChild(grid);
}

// ---- Spotify Now Playing ----
let spotifyProgressInterval = null;

// Helper to retrieve access token via refresh token (Unused client-side, handled by serverless function)
async function getSpotifyAccessToken() {
    return null;
}

async function fetchSpotifyNowPlaying() {
    const albumArt = document.getElementById('spotify-album-art');
    const trackName = document.getElementById('spotify-track');
    const artistName = document.getElementById('spotify-artist');
    const progressBar = document.getElementById('spotify-progress');
    const statusIcon = document.getElementById('spotify-status-icon');
    const statusText = document.querySelector('.font-label-caps.text-secondary');

    if (!trackName) return;

    // Clear any existing progress intervals
    if (spotifyProgressInterval) {
        clearInterval(spotifyProgressInterval);
        spotifyProgressInterval = null;
    }

    try {
        const response = await fetch('/api/now-playing');
        if (!response.ok) throw new Error('API failed');

        const data = await response.json();
        if (data && data.track) {
            renderSpotifyTrack(data.track, data.progressMs, data.isPlaying);
            return;
        }
    } catch (error) {
        console.warn('Spotify API fetch failed:', error);
    }

    // Fallback: Display default aesthetic state
    renderFallbackSpotify();

    function renderSpotifyTrack(track, progressMs, isPlaying) {
        // Track & Artist names
        trackName.textContent = track.name;
        artistName.textContent = track.artists.map(a => a.name).join(', ');

        // Album art
        if (albumArt && track.album && track.album.images && track.album.images.length > 0) {
            albumArt.src = track.album.images[0].url;
            albumArt.classList.remove('hidden');
        }

        // Status styling
        if (statusText) {
            statusText.textContent = isPlaying ? 'Now Playing' : 'Recently Played';
        }
        if (statusIcon) {
            if (isPlaying) {
                statusIcon.classList.add('text-green-500');
                statusIcon.classList.remove('text-secondary');
                statusIcon.textContent = 'graphic_eq';
            } else {
                statusIcon.classList.remove('text-green-500');
                statusIcon.classList.add('text-secondary');
                statusIcon.textContent = 'history';
            }
        }

        // Progress bar calculation & live updates
        const durationMs = track.duration_ms;
        if (progressBar) {
            if (isPlaying && durationMs > 0) {
                let currentProgress = progressMs;
                progressBar.classList.remove('spotify-progress-fill');
                progressBar.style.width = `${(currentProgress / durationMs) * 100}%`;

                // Tick the progress bar every second
                spotifyProgressInterval = setInterval(() => {
                    currentProgress += 1000;
                    if (currentProgress >= durationMs) {
                        currentProgress = durationMs;
                        clearInterval(spotifyProgressInterval);
                        fetchSpotifyNowPlaying(); // Refresh track state
                    }
                    progressBar.style.width = `${(currentProgress / durationMs) * 100}%`;
                }, 1000);
            } else {
                progressBar.classList.remove('spotify-progress-fill');
                progressBar.style.width = '100%';
            }
        }
    }

    function renderFallbackSpotify() {
        trackName.textContent = 'Lofi Beats';
        artistName.textContent = 'Chillhop Music';
        if (statusText) statusText.textContent = 'Offline';
        if (statusIcon) {
            statusIcon.classList.remove('text-green-500');
            statusIcon.classList.add('text-secondary');
            statusIcon.textContent = 'graphic_eq';
        }
        if (albumArt) {
            albumArt.src = '';
            albumArt.classList.add('hidden');
        }
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.classList.add('spotify-progress-fill');
        }
    }
}

// ---- Spotify PKCE Auth Helpers ----
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = window.crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// ---- Spotify Setup Flow ----
function checkSpotifySetup() {
    const modal = document.getElementById('spotify-setup-modal');
    const closeBtn = document.getElementById('spotify-setup-close');
    const redirectUriInput = document.getElementById('setup-redirect-uri');
    const clientIdInput = document.getElementById('setup-client-id');
    const connectBtn = document.getElementById('setup-connect-btn');
    const finishBtn = document.getElementById('setup-finish-btn');
    const step1 = document.getElementById('setup-step-1');
    const step2 = document.getElementById('setup-step-2');
    const codeOutput = document.getElementById('setup-code-output');

    if (!modal) return;

    const currentRedirectUri = window.location.origin + window.location.pathname;
    if (redirectUriInput) {
        redirectUriInput.textContent = currentRedirectUri;
    }

    // Show setup helper if query param ?spotify-setup=true is present or if we have a callback code
    const urlParams = new URLSearchParams(window.location.search);
    const setupMode = urlParams.get('spotify-setup') === 'true';
    const code = urlParams.get('code');

    // 1. Initial trigger
    if (setupMode && !code) {
        modal.classList.remove('hidden');
        if (clientIdInput) {
            clientIdInput.value = CONFIG.spotify.clientId || '';
        }
    }

    // 2. Handle redirection callback
    if (code && sessionStorage.getItem('spotify_setup_in_progress')) {
        modal.classList.remove('hidden');
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        codeOutput.textContent = 'Exchanging auth code for refresh token...';

        exchangeSpotifyCode(code, currentRedirectUri);
    }

    // Event listeners
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            // Clean up url params
            window.history.replaceState({}, document.title, window.location.pathname);
            sessionStorage.removeItem('spotify_setup_in_progress');
        });
    }

    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            const clientId = clientIdInput.value.trim();
            if (!clientId) {
                alert('Please enter a Spotify Client ID.');
                return;
            }

            // Generate PKCE values
            const verifier = generateRandomString(64);
            const challenge = await generateCodeChallenge(verifier);

            // Store verifier and client id for the callback exchange step
            sessionStorage.setItem('spotify_code_verifier', verifier);
            sessionStorage.setItem('spotify_setup_client_id', clientId);
            sessionStorage.setItem('spotify_setup_in_progress', 'true');

            // Redirect to Spotify Auth
            const scope = 'user-read-currently-playing user-read-recently-played';
            const authUrl = `https://accounts.spotify.com/authorize?` + new URLSearchParams({
                response_type: 'code',
                client_id: clientId,
                scope: scope,
                redirect_uri: currentRedirectUri,
                code_challenge_method: 'S256',
                code_challenge: challenge
            }).toString();

            window.location.href = authUrl;
        });
    }

    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            window.history.replaceState({}, document.title, window.location.pathname);
            sessionStorage.removeItem('spotify_setup_in_progress');
            location.reload();
        });
    }
}

async function exchangeSpotifyCode(code, redirectUri) {
    const verifier = sessionStorage.getItem('spotify_code_verifier');
    const clientId = sessionStorage.getItem('spotify_setup_client_id');
    const codeOutput = document.getElementById('setup-code-output');

    if (!verifier || !clientId) {
        codeOutput.textContent = 'Error: Missing verifier or client_id in session storage. Please try again.';
        return;
    }

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: clientId,
                code_verifier: verifier
            })
        });

        if (!response.ok) {
            throw new Error(`Spotify token exchange failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.refresh_token) {
            codeOutput.textContent = `spotify: {\n    clientId: '${clientId}',\n    refreshToken: '${data.refresh_token}'\n}`;
            // Clean up PKCE session storage
            sessionStorage.removeItem('spotify_code_verifier');
            sessionStorage.removeItem('spotify_setup_client_id');
        } else {
            codeOutput.textContent = 'Error: Response did not contain a refresh token.';
        }
    } catch (error) {
        console.error(error);
        codeOutput.textContent = `Error: ${error.message}`;
    }
}


// ---- Utility: Add smooth reveal on scroll ----
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('[data-reveal]').forEach(el => {
    revealObserver.observe(el);
});
