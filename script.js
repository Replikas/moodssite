// Game data - now loaded from API
let games = {};
let currentGameIndex = 0;
let gameIds = [];
let modalSlideTimer = null;

// API base URL
const API_BASE = '/api';

// Anti-sleep ping to keep server awake on free hosting
function keepServerAwake() {
    fetch(`${API_BASE}/health`)
        .then(response => response.json())
        .then(data => console.log('Keep-alive ping:', data.timestamp))
        .catch(error => console.log('Keep-alive ping failed:', error));
}

// Ping server every 10 minutes (600,000 ms) to prevent sleep
setInterval(keepServerAwake, 10 * 60 * 1000);

// Initial ping when page loads
keepServerAwake();

// Screenshot slider functionality
function changeSlide(button, direction) {
    const slider = button.closest('.screenshot-slider');
    const screenshots = slider.querySelectorAll('.screenshot');
    const dots = slider.querySelectorAll('.dot');
    let currentIndex = Array.from(screenshots).findIndex(s => s.classList.contains('active'));
    
    screenshots[currentIndex].classList.remove('active');
    dots[currentIndex].classList.remove('active');
    
    currentIndex += direction;
    if (currentIndex >= screenshots.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = screenshots.length - 1;
    
    screenshots[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');
}

function currentSlide(dot, slideIndex) {
    const slider = dot.closest('.screenshot-slider');
    const screenshots = slider.querySelectorAll('.screenshot');
    const dots = slider.querySelectorAll('.dot');
    
    screenshots.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    
    screenshots[slideIndex - 1].classList.add('active');
    dots[slideIndex - 1].classList.add('active');
}

// Game carousel navigation functions
function changeGameSlide(direction) {
    if (gameIds.length === 0) return;
    
    currentGameIndex += direction;
    
    if (currentGameIndex >= gameIds.length) {
        currentGameIndex = 0;
    } else if (currentGameIndex < 0) {
        currentGameIndex = gameIds.length - 1;
    }
    
    showGameSlide(currentGameIndex);
}

function currentGameSlide(index) {
    currentGameIndex = index;
    showGameSlide(currentGameIndex);
}

function showGameSlide(index) {
    const gameCards = document.querySelectorAll('.game-card:not(.coming-soon)');
    const indicators = document.querySelectorAll('.game-indicator');
    
    // Hide all game cards
    gameCards.forEach(card => card.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Show current game card
    if (gameCards[index]) {
        gameCards[index].classList.add('active');
    }
    if (indicators[index]) {
        indicators[index].classList.add('active');
    }
}

// Modal slider functionality
function changeModalSlide(direction) {
    const screenshots = document.querySelectorAll('.modal-screenshot');
    const dots = document.querySelectorAll('.modal-dot');
    let currentIndex = Array.from(screenshots).findIndex(s => s.classList.contains('active'));
    
    screenshots[currentIndex].classList.remove('active');
    dots[currentIndex].classList.remove('active');
    
    currentIndex += direction;
    if (currentIndex >= screenshots.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = screenshots.length - 1;
    
    screenshots[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');
    
    // Restart auto-slide after manual interaction
    if (screenshots.length > 1) {
        startModalAutoSlide();
    }
}

function currentModalSlide(slideIndex) {
    const screenshots = document.querySelectorAll('.modal-screenshot');
    const dots = document.querySelectorAll('.modal-dot');
    
    screenshots.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    
    screenshots[slideIndex - 1].classList.add('active');
    dots[slideIndex - 1].classList.add('active');
    
    // Restart auto-slide after manual interaction
    if (screenshots.length > 1) {
        startModalAutoSlide();
    }
}

// Load games from API
async function loadGames() {
    try {
        const response = await fetch(`${API_BASE}/games`);
        const gamesArray = await response.json();
        
        // Convert array to object for compatibility
        games = {};
        gamesArray.forEach(game => {
            games[game.id] = {
                title: game.title,
                description: game.description,
                icon: game.icon,
                likes: game.total_likes,
                downloads: game.downloads,
                has_pc_version: game.has_pc_version,
                has_android_version: game.has_android_version
            };
        });
        
        await renderGameCards();
        updateGameCards();
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

// Update game cards with current data
async function renderGameCards() {
    const gamesGrid = document.querySelector('.games-grid');
    const comingSoonCard = gamesGrid.querySelector('.coming-soon');
    const gameIndicators = document.getElementById('gameIndicators');
    
    if (!gamesGrid) {
        return;
    }
    
    if (!gameIndicators) {
        return;
    }
    
    // Clear existing game cards but keep coming soon card
    const existingCards = gamesGrid.querySelectorAll('.game-card:not(.coming-soon)');
    existingCards.forEach(card => card.remove());
    
    // Clear existing indicators
    gameIndicators.innerHTML = '';
    
    // Update gameIds array
    gameIds = Object.keys(games);
    
    // Render each game
    for (let i = 0; i < gameIds.length; i++) {
        const gameId = gameIds[i];
        const game = games[gameId];
        
        // Fetch screenshots for this game
        try {
            const screenshotsResponse = await fetch(`${API_BASE}/games/${gameId}/screenshots`);
            const screenshots = await screenshotsResponse.json();
            
            // Generate screenshot slides for the card
            let screenshotSlides = '';
            let screenshotDots = '';
            
            if (screenshots && screenshots.length > 0) {
                screenshots.slice(0, 3).forEach((screenshot, index) => {
                    const isActive = index === 0 ? 'active' : '';
                    screenshotSlides += `
                        <div class="screenshot ${isActive}">
                            <img src="images/${screenshot.filename}" alt="${screenshot.alt_text}">
                        </div>`;
                    screenshotDots += `
                        <span class="dot ${isActive}" onclick="event.stopPropagation(); currentSlide(this, ${index + 1})"></span>`;
                });
            } else {
                // Fallback if no screenshots
                screenshotSlides = `
                    <div class="screenshot active">
                        <div class="no-screenshots">No image available</div>
                    </div>`;
                screenshotDots = '<span class="dot active"></span>';
            }
            
            // Create game card HTML
            const gameCard = document.createElement('div');
            gameCard.className = i === 0 ? 'game-card active' : 'game-card';
            gameCard.setAttribute('data-game', gameId);
            gameCard.setAttribute('onclick', `openGamePage('${gameId}')`);
            
            gameCard.innerHTML = `
                <div class="game-image">
                    <div class="screenshot-slider">
                        ${screenshotSlides}
                        <div class="slider-nav">
                            <button class="slider-btn prev" onclick="event.stopPropagation(); changeSlide(this, -1)">‹</button>
                            <button class="slider-btn next" onclick="event.stopPropagation(); changeSlide(this, 1)">›</button>
                        </div>
                        <div class="slider-dots">
                            ${screenshotDots}
                        </div>
                    </div>
                    <div class="game-overlay">
                        <button class="play-button" onclick="event.stopPropagation(); openGamePage('${gameId}')">View Details</button>
                    </div>
                </div>
                <div class="game-info">
                    <h3 class="game-title">${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-stats">
                        <span class="likes"><i class="fas fa-heart"></i> ${game.likes}</span>
                        <span class="downloads"><i class="fas fa-download"></i> ${game.downloads}</span>
                    </div>
                </div>
            `;
            
            // Insert before coming soon card
            gamesGrid.insertBefore(gameCard, comingSoonCard);
            
            // Create indicator
            const indicator = document.createElement('div');
            indicator.className = i === 0 ? 'game-indicator active' : 'game-indicator';
            indicator.setAttribute('onclick', `currentGameSlide(${i})`);
            gameIndicators.appendChild(indicator);
            
        } catch (error) {
            console.error(`Error loading screenshots for game ${gameId}:`, error);
        }
    }
    
    // Reset to first game
    currentGameIndex = 0;
    
    // Add has-games class if there are games
    if (gameIds.length > 0) {
        gamesGrid.classList.add('has-games');
    } else {
        gamesGrid.classList.remove('has-games');
    }
}

function updateGameCards() {
    Object.keys(games).forEach(gameId => {
        const game = games[gameId];
        const gameCard = document.querySelector(`[data-game="${gameId}"]`);
        if (gameCard) {
            const likesElement = gameCard.querySelector('.likes');
            const downloadsElement = gameCard.querySelector('.downloads');
            
            if (likesElement) {
                likesElement.innerHTML = `<i class="fas fa-heart"></i> ${game.likes}`;
            }
            if (downloadsElement) {
                downloadsElement.innerHTML = `<i class="fas fa-download"></i> ${game.downloads}`;
            }
        }
    });
}

// Smooth scrolling
function scrollToGames() {
    document.getElementById('games').scrollIntoView({
        behavior: 'smooth'
    });
}

// Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Load games on page load
    loadGames();
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', function() {
        const sections = ['home', 'games', 'about'];
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                const offsetTop = element.offsetTop;
                const height = element.offsetHeight;
                
                if (scrollPos >= offsetTop && scrollPos < offsetTop + height) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${section}`) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    });
});

// Game modal functions
async function openGamePage(gameId) {
    try {
        const [gameResponse, screenshotsResponse] = await Promise.all([
            fetch(`${API_BASE}/games/${gameId}`),
            fetch(`${API_BASE}/games/${gameId}/screenshots`)
        ]);
        
        const game = await gameResponse.json();
        const screenshots = await screenshotsResponse.json();
        
        if (!game) return;
        
        const modal = document.getElementById('gameModal');
        const gameDetails = document.getElementById('gameDetails');
        
        // Generate screenshot slides
        let screenshotSlides = '';
        let screenshotDots = '';
        
        if (screenshots && screenshots.length > 0) {
            screenshots.forEach((screenshot, index) => {
                const isActive = index === 0 ? 'active' : '';
                screenshotSlides += `
                    <div class="modal-screenshot ${isActive}">
                        <img src="images/${screenshot.filename}" alt="${screenshot.alt_text}" onclick="openImageOverlay('images/${screenshot.filename}', '${screenshot.alt_text}')">
                    </div>`;
                screenshotDots += `
                    <span class="modal-dot ${isActive}" onclick="currentModalSlide(${index + 1})"></span>`;
            });
        } else {
            // Fallback if no screenshots
            screenshotSlides = `
                <div class="modal-screenshot active">
                    <div class="no-screenshots">No screenshots available</div>
                </div>`;
            screenshotDots = '<span class="modal-dot active"></span>';
        }
        
        gameDetails.innerHTML = `
            <div class="game-detail">
                <div class="game-detail-image">
                    <div class="modal-screenshot-slider">
                        ${screenshotSlides}
                        <div class="modal-slider-nav">
                            <button class="modal-slider-btn prev" onclick="changeModalSlide(-1)">‹</button>
                            <button class="modal-slider-btn next" onclick="changeModalSlide(1)">›</button>
                        </div>
                        <div class="modal-slider-dots">
                            ${screenshotDots}
                        </div>
                    </div>
                    
                    <div class="game-video-section">
                        <h3>Game Guides</h3>
                        <div class="video-wrapper">
                            <iframe src="https://www.youtube.com/embed/6fLOIskT93E" title="Find them all, Rick! | Game guides 1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>
                <div class="game-detail-info">
                    <h2>${game.title}</h2>
                    <p class="game-detail-description">${game.description}</p>
                    <p><strong>Genre:</strong> ${game.genre || 'Adventure, Role Playing'}</p>
                    <p><strong>Tags:</strong> ${game.tags || '2D, Adult, Exploration, Fangame, Multiple Endings, Pixel Art, RPG Maker, Short, Singleplayer'}</p>
                    <p><strong>Platforms:</strong> ${game.platforms || 'Windows, Android'}</p>
                    <p><strong>Status:</strong> ${game.status}</p>
                    <div class="game-actions">
                        <div class="download-buttons">
                            ${game.has_pc_version ? `
                                <button class="download-btn pc-download" onclick="downloadGame('${gameId}', 'pc')">
                                    <i class="fab fa-windows"></i>
                                    Download for PC
                                </button>
                            ` : ''}
                            ${game.has_android_version ? `
                                <button class="download-btn android-download" onclick="downloadGame('${gameId}', 'android')">
                                    <i class="fab fa-android"></i>
                                    Download for Android
                                </button>
                            ` : ''}
                        </div>
                        <button class="like-btn ${game.user_liked ? 'liked' : ''}" onclick="toggleLike('${gameId}')">
                            <i class="fas fa-heart"></i>
                            <span id="like-count-${gameId}">${game.total_likes}</span>
                        </button>
                    </div>
                    <div class="game-stats">
                        <span class="downloads"><i class="fas fa-download"></i> ${game.downloads} downloads</span>
                    </div>
                </div>
                <div class="comments-section">
                    <h3>Comments</h3>
                    <div class="comment-form">
                        <input type="text" id="comment-author-${gameId}" placeholder="Your name" maxlength="50" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(0,255,136,0.3); border-radius: 4px; color: #fff;">
                        <textarea id="comment-text-${gameId}" placeholder="Share your thoughts about this game..."></textarea>
                        <button onclick="addComment('${gameId}')">Post Comment</button>
                    </div>
                    <div id="comments-${gameId}" class="comments-list">
                        ${renderComments(game.comments)}
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Start auto-slide for screenshots if there are multiple
        if (screenshots && screenshots.length > 1) {
            startModalAutoSlide();
        }
    } catch (error) {
        console.error('Error loading game details:', error);
        alert('Failed to load game details. Please try again.');
    }
}

function closeGameModal() {
    const modal = document.getElementById('gameModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Stop auto-slide timer
    stopModalAutoSlide();
}

// Auto-slide functions for modal screenshots
function startModalAutoSlide() {
    stopModalAutoSlide(); // Clear any existing timer
    modalSlideTimer = setInterval(() => {
        changeModalSlide(1);
    }, 4000); // Change slide every 4 seconds
}

function stopModalAutoSlide() {
    if (modalSlideTimer) {
        clearInterval(modalSlideTimer);
        modalSlideTimer = null;
    }
}

function openImageOverlay(imageSrc, imageAlt) {
    const overlay = document.getElementById('imageOverlay');
    const overlayImage = document.getElementById('overlayImage');
    
    overlayImage.src = imageSrc;
    overlayImage.alt = imageAlt;
    overlay.classList.add('active');
    
    // Prevent body scrolling when overlay is open
    document.body.style.overflow = 'hidden';
}

function closeImageOverlay() {
    const overlay = document.getElementById('imageOverlay');
    overlay.classList.remove('active');
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
}

// Close overlay when clicking outside the image
document.addEventListener('click', function(event) {
    const overlay = document.getElementById('imageOverlay');
    const overlayImage = document.getElementById('overlayImage');
    
    if (event.target === overlay) {
        closeImageOverlay();
    }
});

// Close overlay with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeImageOverlay();
    }
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('gameModal');
    if (event.target === modal) {
        closeGameModal();
    }
});

// Like functionality
async function toggleLike(gameId) {
    try {
        const response = await fetch(`${API_BASE}/games/${gameId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        const likeBtn = document.querySelector('.like-btn');
        const likeCount = document.getElementById(`like-count-${gameId}`);
        
        if (result.liked) {
            likeBtn.classList.add('liked');
        } else {
            likeBtn.classList.remove('liked');
        }
        
        likeCount.textContent = result.totalLikes;
        
        // Update the main page like count
        const mainGameCard = document.querySelector(`[data-game="${gameId}"] .likes`);
        if (mainGameCard) {
            mainGameCard.innerHTML = `<i class="fas fa-heart"></i> ${result.totalLikes}`;
        }
        
        // Update local games object
        if (games[gameId]) {
            games[gameId].likes = result.totalLikes;
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        alert('Failed to update like. Please try again.');
    }
}

// Download functionality
async function downloadGame(gameId, platform) {
    try {
        const downloadBtn = document.querySelector(`.${platform}-download`);
        const originalText = downloadBtn.innerHTML;
        
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Download...';
        downloadBtn.disabled = true;
        
        // Create a temporary link to trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = `${API_BASE}/games/${gameId}/download/${platform}`;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        
        // Trigger the download
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Show success message
        setTimeout(() => {
            downloadBtn.innerHTML = '<i class="fas fa-check"></i> Download Started!';
            
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            }, 2000);
        }, 500);
        
    } catch (error) {
        console.error('Error downloading game:', error);
        const downloadBtn = document.querySelector(`.${platform}-download`);
        if (downloadBtn) {
            downloadBtn.innerHTML = platform === 'pc' ? '<i class="fab fa-windows"></i> Download for PC' : '<i class="fab fa-android"></i> Download for Android';
            downloadBtn.disabled = false;
        }
        alert('Failed to start download. Please try again.');
    }
}

// Comment functionality
async function addComment(gameId) {
    const commentText = document.getElementById(`comment-text-${gameId}`).value.trim();
    const commentAuthor = document.getElementById(`comment-author-${gameId}`).value.trim();
    
    if (!commentText) {
        alert('Please enter a comment before posting.');
        return;
    }
    
    if (!commentAuthor) {
        alert('Please enter your name before posting.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/games/${gameId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                author: commentAuthor,
                text: commentText
            })
        });
        
        const result = await response.json();
        
        // Clear the form
        document.getElementById(`comment-text-${gameId}`).value = '';
        document.getElementById(`comment-author-${gameId}`).value = '';
        
        // Re-render comments with updated data
        const commentsContainer = document.getElementById(`comments-${gameId}`);
        commentsContainer.innerHTML = renderComments(result.comments);
        
        // Update local games object
        if (games[gameId]) {
            games[gameId].comments = result.comments;
        }
        
        // Show success message
        const commentForm = document.querySelector('.comment-form button');
        const originalText = commentForm.textContent;
        commentForm.textContent = 'Comment Posted!';
        commentForm.style.background = '#00d4ff';
        
        setTimeout(() => {
            commentForm.textContent = originalText;
            commentForm.style.background = '#00ff88';
        }, 2000);
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
    }
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<div class="no-comments"><i class="fas fa-comments"></i><br>No comments yet. Be the first to share your thoughts!</div>';
    }
    
    return comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</div>
            </div>
            <div class="comment-text">${comment.text}</div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Initialize like counts on page load
document.addEventListener('DOMContentLoaded', function() {
    Object.keys(games).forEach(gameId => {
        const game = games[gameId];
        const gameCard = document.querySelector(`[data-game="${gameId}"] .likes`);
        if (gameCard) {
            const currentLikes = likedGames.includes(gameId) ? game.likes + 1 : game.likes;
            gameCard.innerHTML = `<i class="fas fa-heart"></i> ${currentLikes}`;
        }
    });
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effect to game cards
    const gameCards = document.querySelectorAll('.game-card:not(.coming-soon)');
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click effect to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Close modal with Escape key
    if (event.key === 'Escape') {
        closeGameModal();
    }
    
    // Navigate with arrow keys when modal is open
    if (document.getElementById('gameModal').style.display === 'block') {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            // Could implement navigation between games here
        }
    }
});