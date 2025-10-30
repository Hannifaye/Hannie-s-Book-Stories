// Storage Keys
const STORAGE_KEYS = {
    STORIES: 'hannie_stories',
    USERS: 'hannie_users',
    CURRENT_USER: 'hannie_current_user',
    BOOKMARKS: 'hannie_bookmarks',
    SUBSCRIBERS: 'hannie_subscribers',
    READER_SETTINGS: 'hannie_reader_settings',
    COMMENTS: 'hannie_comments',
    STORY_PROGRESS: 'hannie_story_progress'
};

// Load data from localStorage
function loadFromStorage(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return defaultValue;
    }
}

// Save data to localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to storage:', error);
        showNotification('Storage error. Data may not be saved.', 'error');
    }
}

// Initialize default story if none exists
const defaultStory = {
    id: 1,
    title: "The Things I Never Said",
    genre: "Romance",
    description: "The compilations of words i never said.",
    coverImage: null,
    status: "completed",
    bestseller: false,
    mature: false,
    scheduledDate: null,
    views: 0,
    chapters: [
        {
            title: "Unfinished Introductions",
            content: " Unfinished Introductions ",
            triggerWarnings: "",
            authorNoteTop: "Welcome to my new story! ❤️",
            authorNoteBottom: "Thank you for reading! What do you think of Sarah and the mysterious reader? Let me know in the comments! 💭"
        },
        
    ],

    id: 2,
    title: "Keeping Aurelia",
    genre: "Romance",
    description: "I will keep you forever.",
    coverImage: null,
    status: "on-going",
    bestseller: false,
    mature: false,
    scheduledDate: null,
    views: 0,
    chapters: [
        {
            title: "Chapter 1 ",
            content: "Aurelia smirked. Refurbished ",
            triggerWarnings: "",
            authorNoteTop: "Welcome to my new story! ❤️",
            authorNoteBottom: "Thank you for reading! 💭"
        },
        
    ]
};

























// Data storage - Load from localStorage or use defaults
let stories = loadFromStorage(STORAGE_KEYS.STORIES, [defaultStory]);
let currentUser = loadFromStorage(STORAGE_KEYS.CURRENT_USER, null);
let bookmarkedStories = loadFromStorage(STORAGE_KEYS.BOOKMARKS, []);
let users = loadFromStorage(STORAGE_KEYS.USERS, []);
let subscribers = loadFromStorage(STORAGE_KEYS.SUBSCRIBERS, []);
let readerSettings = loadFromStorage(STORAGE_KEYS.READER_SETTINGS, { 
    fontFamily: 'Poppins', 
    fontSize: 18, 
    lineHeight: 1.8, 
    theme: 'default' 
});
let comments = loadFromStorage(STORAGE_KEYS.COMMENTS, {});
let storyProgress = loadFromStorage(STORAGE_KEYS.STORY_PROGRESS, {});

let selectedRating = 0;
let currentStory = null;
let currentChapter = 0;
let currentEditingStory = null;
let currentEditingChapter = null;

// Save all data to localStorage
function saveAllData() {
    saveToStorage(STORAGE_KEYS.STORIES, stories);
    saveToStorage(STORAGE_KEYS.USERS, users);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, currentUser);
    saveToStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedStories);
    saveToStorage(STORAGE_KEYS.SUBSCRIBERS, subscribers);
    saveToStorage(STORAGE_KEYS.READER_SETTINGS, readerSettings);
    saveToStorage(STORAGE_KEYS.COMMENTS, comments);
    saveToStorage(STORAGE_KEYS.STORY_PROGRESS, storyProgress);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderStories('all');
    setupEventListeners();
    checkDarkMode();
    updateUserDropdown();
    updateStats();
    
    if (currentUser && currentUser.photo) {
        document.getElementById('userAvatar').innerHTML = `<img src="${currentUser.photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else if (currentUser) {
        document.getElementById('userAvatar').textContent = currentUser.name[0].toUpperCase();
    }
});

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
        });
    });

    // User dropdown
    document.getElementById('userAvatar').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleUserDropdown();
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-avatar') && !e.target.closest('.user-dropdown')) {
            closeUserDropdown();
        }
    });

    // User actions
    document.getElementById('loginMenuBtn').addEventListener('click', () => {
        closeUserDropdown();
        openModal('loginModal');
    });
    
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('profileBtn').addEventListener('click', () => {
        closeUserDropdown();
        openModal('profileModal');
    });
    
    document.getElementById('myStoriesBtn').addEventListener('click', () => {
        closeUserDropdown();
        showBookmarks();
    });
    
    const dashboardMenuBtn = document.getElementById('dashboardMenuBtn');
    if (dashboardMenuBtn) {
        dashboardMenuBtn.addEventListener('click', () => {
            closeUserDropdown();
            navigateTo('dashboard');
        });
    }

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('editProfileForm')?.addEventListener('submit', handleProfileUpdate);
    document.getElementById('profilePhotoUpload').addEventListener('change', uploadProfilePhoto);

    // Buttons
    document.getElementById('startReadingBtn').addEventListener('click', handleStartReading);
    document.getElementById('browseStoriesBtn').addEventListener('click', () => navigateTo('library'));
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('newsletterForm').addEventListener('submit', handleNewsletter);
    document.getElementById('bookmarkBtn').addEventListener('click', showBookmarks);

    // Dashboard
    const addStoryBtn = document.getElementById('addStoryBtn');
    if (addStoryBtn) {
        addStoryBtn.addEventListener('click', createNewStory);
    }

    // Editor
    document.getElementById('backToDashboard')?.addEventListener('click', () => navigateTo('dashboard'));
    document.getElementById('saveStory')?.addEventListener('click', saveCurrentStory);
    document.getElementById('publishStory')?.addEventListener('click', publishCurrentStory);
    document.getElementById('addNewChapter')?.addEventListener('click', () => openChapterEditor());
    document.getElementById('saveChapterEdit')?.addEventListener('click', saveChapterFromEditor);
    document.getElementById('chapterContentEdit')?.addEventListener('input', updateWordCount);
    document.getElementById('coverUpload')?.addEventListener('change', handleCoverUpload);

    // Editor sections
    document.querySelectorAll('.sidebar-option').forEach(option => {
        option.addEventListener('click', function() {
            switchEditorSection(this.dataset.section);
        });
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderStories(this.dataset.filter);
        });
    });

    // Password validation
    const signupPassword = document.getElementById('signupPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    if (signupPassword) signupPassword.addEventListener('input', checkPasswordStrength);
    if (confirmPassword) confirmPassword.addEventListener('input', checkPasswordMatch);

    // Reader navigation
    document.getElementById('prevChapter')?.addEventListener('click', goToPrevChapter);
    document.getElementById('nextChapter')?.addEventListener('click', goToNextChapter);
    document.getElementById('tocBtn')?.addEventListener('click', openTOC);
    document.getElementById('tocCloseBtn')?.addEventListener('click', closeTOC);
    document.getElementById('feedbackWidget')?.addEventListener('click', scrollToComments);
    document.getElementById('shareWidget')?.addEventListener('click', shareStory);
    document.getElementById('scrollTopBtn')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Reader settings
    document.getElementById('readerSettingsBtn')?.addEventListener('click', toggleReaderSettings);
    document.getElementById('fontSizeSlider')?.addEventListener('input', updateFontSize);
    document.getElementById('lineHeightSlider')?.addEventListener('input', updateLineHeight);
    
    document.querySelectorAll('.font-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.font-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            updateFontFamily(this.dataset.font);
        });
    });

    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            updateReaderTheme(this.dataset.theme);
        });
    });

    // Comments
    document.getElementById('submitComment')?.addEventListener('click', submitComment);
    document.querySelectorAll('.rating-stars .star').forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarRating();
        });
    });

    // Search
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // Scroll progress
    window.addEventListener('scroll', updateScrollProgress);
    
    // Text selection for quote sharing
    document.addEventListener('mouseup', handleTextSelection);
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const pageMap = {
        'home': 'homePage',
        'library': 'libraryPage',
        'about': 'aboutPage',
        'reader': 'readerPage',
        'dashboard': 'dashboardPage',
        'editor': 'editorPage'
    };
    const pageId = pageMap[page];
    if (pageId) document.getElementById(pageId).classList.remove('hidden');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) link.classList.add('active');
    });
    
    window.scrollTo(0, 0);
    
    if (page === 'library') renderStories('all');
    if (page === 'dashboard') renderDashboard();
    if (page === 'home') updateStats();
}

// Render Stories
function renderStories(filter) {
    const container = document.getElementById('libraryStories') || document.getElementById('popularStories');
    if (!container) return;
    
    let filteredStories = stories;
    if (filter === 'bestseller') filteredStories = stories.filter(s => s.bestseller);
    else if (['completed', 'ongoing'].includes(filter)) filteredStories = stories.filter(s => s.status === filter);
    
    if (container.id === 'popularStories') {
        filteredStories = stories.filter(s => s.bestseller).slice(0, 4);
    }
    
    container.innerHTML = filteredStories.map(story => {
        const progress = getStoryProgress(story.id);
        const coverContent = story.coverImage 
            ? `<img src="${story.coverImage}" alt="${story.title}">`
            : '📖';
        
        return `
            <div class="story-card" onclick="attemptReadStory(${story.id}, 0)">
                <div class="story-cover">
                    ${story.mature ? '<span class="mature-badge">🔞 18+</span>' : ''}
                    ${story.bestseller ? '<span class="story-badge">⭐ Bestseller</span>' : ''}
                    ${coverContent}
                </div>
                <div class="story-info">
                    <span class="story-genre">${story.genre}</span>
                    <h3 class="story-title">${story.title}</h3>
                    <p class="story-desc">${story.description}</p>
                    ${currentUser && progress > 0 ? `
                        <div class="reading-progress-tracker">
                            <small style="color: var(--text-light);">Progress: ${progress}%</small>
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="story-meta">
                        <span>${story.chapters.length} chapters • ${story.views || 0} views</span>
                        <span class="bookmark-icon ${bookmarkedStories.includes(story.id) ? 'saved' : ''}" onclick="event.stopPropagation(); toggleBookmark(${story.id})">
                            ${bookmarkedStories.includes(story.id) ? '❤️' : '🤍'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Story Progress Tracking
function getStoryProgress(storyId) {
    if (!currentUser) return 0;
    const storyKey = `${currentUser.username}-${storyId}`;
    const progress = storyProgress[storyKey];
    if (!progress) return 0;
    
    const story = stories.find(s => s.id === storyId);
    if (!story) return 0;
    
    const completedChapters = Object.keys(progress.chapters).filter(ch => progress.chapters[ch] >= 90).length;
    return Math.floor((completedChapters / story.chapters.length) * 100);
}

function updateScrollProgress() {
    const readerContent = document.getElementById('readerContent');
    if (!readerContent || !currentStory || !currentUser) return;
    
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    document.getElementById('readerProgressBar').style.width = scrollPercentage + '%';
    
    const storyKey = `${currentUser.username}-${currentStory.id}`;
    if (!storyProgress[storyKey]) {
        storyProgress[storyKey] = { chapters: {} };
    }
    storyProgress[storyKey].chapters[currentChapter] = Math.max(
        storyProgress[storyKey].chapters[currentChapter] || 0,
        scrollPercentage
    );
    saveToStorage(STORAGE_KEYS.STORY_PROGRESS, storyProgress);
}

// Update Stats
function updateStats() {
    const totalChapters = stories.reduce((sum, story) => sum + story.chapters.length, 0);
    document.getElementById('totalStoriesCount').textContent = stories.length;
    document.getElementById('totalChaptersCount').textContent = totalChapters;
    
    const realReaders = users.filter(u => !u.isWriter).length;
    document.getElementById('totalReadersCount').textContent = realReaders;
    document.getElementById('totalSubscribersCount').textContent = subscribers.length;

    if (currentUser && currentUser.isWriter) {
        document.getElementById('myStoriesCount').textContent = stories.length;
        document.getElementById('myChaptersCount').textContent = totalChapters;
        
        const totalWords = stories.reduce((sum, story) => {
            return sum + story.chapters.reduce((chapterSum, ch) => {
                return chapterSum + ch.content.split(/\s+/).filter(w => w.length > 0).length;
            }, 0);
        }, 0);
        document.getElementById('myWordsCount').textContent = totalWords.toLocaleString();
        document.getElementById('totalViewsCount').textContent = '-';
        
        document.getElementById('demographicsReaders').textContent = realReaders;
        document.getElementById('demographicsSubscribers').textContent = subscribers.length;
        document.getElementById('demographicsActive').textContent = realReaders;
        
        let totalRatings = 0;
        let ratingCount = 0;
        Object.values(comments).forEach(chapterComments => {
            chapterComments.forEach(comment => {
                totalRatings += comment.rating;
                ratingCount++;
            });
        });
        const avgRating = ratingCount > 0 ? (totalRatings / ratingCount).toFixed(1) : 'N/A';
        document.getElementById('demographicsRating').textContent = ratingCount > 0 ? `⭐ ${avgRating}` : '⭐ N/A';
    }
}

// Read Story Functions
function attemptReadStory(storyId, chapterIndex) {
    if (!currentUser) {
        showNotification('Please sign up or login to read stories! 📚', 'error');
        openModal('signupModal');
        return;
    }
    readStory(storyId, chapterIndex);
}

function handleStartReading() {
    if (!currentUser) {
        showNotification('Please login or sign up to start reading! 📚', 'error');
        openModal('loginModal');
        return;
    }
    if (stories.length > 0) {
        readStory(stories[0].id, 0);
    } else {
        showNotification('No stories available yet!', 'error');
    }
}

function readStory(storyId, chapterIndex) {
    const story = stories.find(s => s.id === storyId);
    if (!story || !story.chapters[chapterIndex]) return;
    
    if (!story.views) story.views = 0;
    story.views++;
    saveAllData();
    
    currentStory = story;
    currentChapter = chapterIndex;
    const chapter = story.chapters[chapterIndex];
    
    document.getElementById('readerTitle').textContent = story.title;
    document.getElementById('readerChapter').textContent = `${chapter.title} (${chapterIndex + 1}/${story.chapters.length})`;
    
    const triggerSection = document.getElementById('triggerWarningSection');
    if (chapter.triggerWarnings && chapter.triggerWarnings.trim()) {
        triggerSection.innerHTML = `
            <div class="trigger-warning">
                <div class="trigger-warning-title">⚠️ Content Warning</div>
                <p>${chapter.triggerWarnings}</p>
            </div>
        `;
    } else {
        triggerSection.innerHTML = '';
    }
    
    const noteTop = document.getElementById('authorNoteTop');
    if (chapter.authorNoteTop && chapter.authorNoteTop.trim()) {
        noteTop.innerHTML = `
            <div class="author-note">
                <div class="author-note-title">✍️ Author's Note</div>
                <p>${chapter.authorNoteTop}</p>
            </div>
        `;
    } else {
        noteTop.innerHTML = '';
    }
    
    const noteBottom = document.getElementById('authorNoteBottom');
    if (chapter.authorNoteBottom && chapter.authorNoteBottom.trim()) {
        noteBottom.innerHTML = `
            <div class="author-note">
                <div class="author-note-title">✍️ Author's Note</div>
                <p>${chapter.authorNoteBottom}</p>
            </div>
        `;
    } else {
        noteBottom.innerHTML = '';
    }
    
    const paragraphs = chapter.content.split('\n\n').map(p => `<p>${p}</p>`).join('');
    document.getElementById('readerContent').innerHTML = paragraphs;
    applyReaderSettings();
    
    document.getElementById('prevChapter').disabled = chapterIndex === 0;
    document.getElementById('nextChapter').disabled = chapterIndex === story.chapters.length - 1;
    
    loadComments(storyId, chapterIndex);
    navigateTo('reader');
    document.getElementById('readerProgressBar').style.width = '0%';
}

function goToPrevChapter() {
    if (currentStory && currentChapter > 0) readStory(currentStory.id, currentChapter - 1);
}

function goToNextChapter() {
    if (currentStory && currentChapter < currentStory.chapters.length - 1) {
        readStory(currentStory.id, currentChapter + 1);
    }
}

// Bookmarks
function toggleBookmark(storyId) {
    if (!currentUser) {
        showNotification('Please login to bookmark stories! 📚', 'error');
        openModal('loginModal');
        return;
    }
    const index = bookmarkedStories.indexOf(storyId);
    if (index > -1) {
        bookmarkedStories.splice(index, 1);
        showNotification('Removed from bookmarks');
    } else {
        bookmarkedStories.push(storyId);
        showNotification('Added to bookmarks! ❤️');
    }
    saveAllData();
    renderStories(document.querySelector('.filter-tab.active')?.dataset.filter || 'all');
}

function showBookmarks() {
    if (!currentUser) {
        showNotification('Please login to view bookmarks! 📚', 'error');
        openModal('loginModal');
        return;
    }
    if (bookmarkedStories.length === 0) {
        showNotification('You haven\'t bookmarked any stories yet! 🤍', 'error');
        return;
    }
    navigateTo('library');
    const bookmarkedFilter = stories.filter(s => bookmarkedStories.includes(s.id));
    const container = document.getElementById('libraryStories');
    container.innerHTML = bookmarkedFilter.map(story => {
        const coverContent = story.coverImage 
            ? `<img src="${story.coverImage}" alt="${story.title}">`
            : '📖';
        
        return `
        <div class="story-card" onclick="attemptReadStory(${story.id}, 0)">
            <div class="story-cover">
                ${story.bestseller ? '<span class="story-badge">⭐ Bestseller</span>' : ''}
                ${coverContent}
            </div>
            <div class="story-info">
                <span class="story-genre">${story.genre}</span>
                <h3 class="story-title">${story.title}</h3>
                <p class="story-desc">${story.description}</p>
                <div class="story-meta">
                    <span>${story.chapters.length} chapters</span>
                    <span class="bookmark-icon saved" onclick="event.stopPropagation(); toggleBookmark(${story.id})">❤️</span>
                </div>
            </div>
        </div>
    `}).join('');
}

// Search
function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!query) {
        showNotification('Please enter a search term', 'error');
        return;
    }

    const results = stories.filter(story => 
        story.title.toLowerCase().includes(query) ||
        story.genre.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query)
    );

    navigateTo('library');
    const container = document.getElementById('libraryStories');
    
    if (results.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: var(--text-light);"><p style="font-size: 48px; margin-bottom: 20px;">🔍</p><h3>No results found</h3><p>Try searching with different keywords</p></div>';
        return;
    }

    container.innerHTML = results.map(story => {
        const progress = getStoryProgress(story.id);
        const coverContent = story.coverImage 
            ? `<img src="${story.coverImage}" alt="${story.title}">`
            : '📖';
        
        return `
            <div class="story-card" onclick="attemptReadStory(${story.id}, 0)">
                <div class="story-cover">
                    ${story.mature ? '<span class="mature-badge">🔞 18+</span>' : ''}
                    ${story.bestseller ? '<span class="story-badge">⭐ Bestseller</span>' : ''}
                    ${coverContent}
                </div>
                <div class="story-info">
                    <span class="story-genre">${story.genre}</span>
                    <h3 class="story-title">${story.title}</h3>
                    <p class="story-desc">${story.description}</p>
                    ${currentUser && progress > 0 ? `<div class="reading-progress-tracker">
                        <small style="color: var(--text-light);">Progress: ${progress}%</small>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>` : ''}
                    <div class="story-meta">
                        <span>${story.chapters.length} chapters • ${story.views || 0} views</span>
                        <span class="bookmark-icon ${bookmarkedStories.includes(story.id) ? 'saved' : ''}" onclick="event.stopPropagation(); toggleBookmark(${story.id})">
                            ${bookmarkedStories.includes(story.id) ? '❤️' : '🤍'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    showNotification(`Found ${results.length} result${results.length !== 1 ? 's' : ''}!`);
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const username = e.target.querySelector('input[name="username"]').value;
    const password = e.target.querySelector('input[name="password"]').value;
    
    if (username === 'hannie' && password === 'hannie123') {
        currentUser = {
            name: 'Hannie',
            username: username,
            isWriter: true,
            photo: null,
            bio: 'Author and storyteller',
            favoriteGenre: 'Romance',
            email: 'hannie@bookstories.com'
        };
        document.getElementById('userAvatar').textContent = 'H';
        closeModal('loginModal');
        updateUserDropdown();
        saveAllData();
        showNotification('Welcome back, Hannie! ✍️');
        return;
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = {
            name: user.fullname,
            username: user.username,
            email: user.email,
            isWriter: false,
            photo: user.photo || null,
            bio: user.bio || '',
            favoriteGenre: user.favoriteGenre || ''
        };
        if (user.photo) {
            document.getElementById('userAvatar').innerHTML = `<img src="${user.photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            document.getElementById('userAvatar').textContent = user.fullname[0].toUpperCase();
        }
        closeModal('loginModal');
        updateUserDropdown();
        saveAllData();
        showNotification('Welcome back! 📚');
    } else {
        showNotification('Invalid credentials', 'error');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const fullname = e.target.querySelector('input[name="fullname"]').value;
    const username = e.target.querySelector('input[name="username"]').value;
    const email = e.target.querySelector('input[name="email"]').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password.length < 6) {
        showNotification('Password too short!', 'error');
        return;
    }
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    if (users.find(u => u.username === username)) {
        showNotification('Username exists', 'error');
        return;
    }
    
    const newUser = {
        fullname,
        username,
        email,
        password,
        photo: null,
        bio: '',
        favoriteGenre: '',
        isWriter: false
    };
    users.push(newUser);
    
    currentUser = {
        name: fullname,
        username: username,
        email: email,
        isWriter: false,
        photo: null,
        bio: '',
        favoriteGenre: ''
    };
    document.getElementById('userAvatar').textContent = fullname[0].toUpperCase();
    closeModal('signupModal');
    updateUserDropdown();
    updateStats();
    saveAllData();
    showNotification('Welcome! 🎉');
    e.target.reset();
}

function handleLogout() {
    if (confirm('Logout?')) {
        currentUser = null;
        document.getElementById('userAvatar').textContent = '?';
        closeUserDropdown();
        updateUserDropdown();
        navigateTo('home');
        saveAllData();
        showNotification('Logged out successfully');
    }
}

// Password Validation
function checkPasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthDiv = document.getElementById('passwordStrength');
    
    if (password.length === 0) {
        strengthDiv.textContent = '';
        return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#27ae60'];
    
    strengthDiv.textContent = `Password Strength: ${levels[strength - 1] || 'Too Short'}`;
    strengthDiv.style.color = colors[strength - 1] || '#e74c3c';
}

function checkPasswordMatch() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchDiv = document.getElementById('passwordMatch');
    
    if (confirmPassword.length === 0) {
        matchDiv.textContent = '';
        return;
    }
    
    if (password === confirmPassword) {
        matchDiv.textContent = '✓ Passwords match';
        matchDiv.style.color = '#27ae60';
    } else {
        matchDiv.textContent = '✗ Passwords do not match';
        matchDiv.style.color = '#e74c3c';
    }
}

// User Dropdown
function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('active');
}

function closeUserDropdown() {
    document.getElementById('userDropdown').classList.remove('active');
}

function updateUserDropdown() {
    if (currentUser) {
        document.getElementById('dropdownUserName').textContent = currentUser.name;
        document.getElementById('dropdownUserEmail').textContent = currentUser.email || currentUser.username;
        document.getElementById('profileBtn').style.display = 'flex';
        document.getElementById('myStoriesBtn').style.display = 'flex';
        document.getElementById('menuDivider').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'flex';
        document.getElementById('loginMenuBtn').style.display = 'none';
        
        const dashboardBtn = document.getElementById('dashboardMenuBtn');
        if (currentUser.isWriter && dashboardBtn) {
            dashboardBtn.style.display = 'flex';
        } else if (dashboardBtn) {
            dashboardBtn.style.display = 'none';
        }
        
        updateProfileModal();
    } else {
        document.getElementById('dropdownUserName').textContent = 'Guest';
        document.getElementById('dropdownUserEmail').textContent = 'Not logged in';
        document.getElementById('profileBtn').style.display = 'none';
        document.getElementById('myStoriesBtn').style.display = 'none';
        
        const dashboardBtn = document.getElementById('dashboardMenuBtn');
        if (dashboardBtn) dashboardBtn.style.display = 'none';
        
        document.getElementById('menuDivider').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('loginMenuBtn').style.display = 'flex';
    }
}

// Profile Modal
function updateProfileModal() {
    if (currentUser) {
        const avatarImg = document.getElementById('profileAvatarImg');
        if (currentUser.photo) {
            avatarImg.innerHTML = `<img src="${currentUser.photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            avatarImg.textContent = currentUser.name[0].toUpperCase();
        }
        document.getElementById('profileNameView').textContent = currentUser.name;
        document.getElementById('profileUsernameView').textContent = '@' + currentUser.username;
        document.getElementById('profileEmailView').textContent = currentUser.email || 'No email';
        document.getElementById('profileBioView').textContent = currentUser.bio || 'No bio';
        document.getElementById('profileGenreView').textContent = currentUser.favoriteGenre || 'Not set';
    }
}

function toggleEditProfile() {
    const viewMode = document.getElementById('profileViewMode');
    const editMode = document.getElementById('profileEditMode');
    const editBtn = document.getElementById('editProfileBtn');
    
    if (editMode.style.display === 'none') {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.textContent = '👁️ View';
        document.getElementById('editFullName').value = currentUser.name;
        document.getElementById('editEmail').value = currentUser.email || '';
        document.getElementById('editBio').value = currentUser.bio || '';
        document.getElementById('editFavoriteGenre').value = currentUser.favoriteGenre || '';
    } else {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        editBtn.textContent = '✏️ Edit Profile';
    }
}

function handleProfileUpdate(e) {
    e.preventDefault();
    currentUser.name = document.getElementById('editFullName').value;
    currentUser.email = document.getElementById('editEmail').value;
    currentUser.bio = document.getElementById('editBio').value;
    currentUser.favoriteGenre = document.getElementById('editFavoriteGenre').value;
    
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex].fullname = currentUser.name;
        users[userIndex].email = currentUser.email;
        users[userIndex].bio = currentUser.bio;
        users[userIndex].favoriteGenre = currentUser.favoriteGenre;
    }
    
    updateProfileModal();
    updateUserDropdown();
    toggleEditProfile();
    saveAllData();
    showNotification('Profile updated! ✅');
}

function uploadProfilePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showNotification('File too large!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = e.target.result;
        currentUser.photo = photoData;
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) users[userIndex].photo = photoData;
        
        document.getElementById('profileAvatarImg').innerHTML = `<img src="${photoData}" style="width: 100%; height: 100%; object-fit: cover;">`;
        document.getElementById('userAvatar').innerHTML = `<img src="${photoData}" style="width: 100%; height: 100%; object-fit: cover;">`;
        saveAllData();
        showNotification('Photo updated! 📸');
    };
    reader.readAsDataURL(file);
}

// Dashboard
function renderDashboard() {
    const container = document.getElementById('storyList');
    if (!container) return;
    
    if (stories.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-light);">
                <p style="font-size: 48px; margin-bottom: 20px;">📝</p>
                <h3 style="margin-bottom: 10px;">No stories yet</h3>
                <p>Start writing your first story!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = stories.map(story => `
        <div class="story-list-item">
            <div>
                <h3>${story.coverImage ? '📷' : '📖'} ${story.title} ${story.mature ? '🔞' : ''}</h3>
                <p style="color: var(--text-light); font-size: 14px;">
                    ${story.chapters.length} chapters • ${story.status} • ${story.views || 0} views
                    ${story.scheduledDate ? `<br>📅 Scheduled: ${new Date(story.scheduledDate).toLocaleString()}` : ''}
                </p>
            </div>
            <div class="story-actions">
                <button class="btn btn-primary btn-small" onclick="editStoryInEditor(${story.id})">✏️ Edit</button>
                <button class="btn btn-secondary btn-small" onclick="deleteStory(${story.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
    updateStats();
}

function createNewStory() {
    currentEditingStory = {
        id: Date.now(),
        title: 'Untitled Story',
        genre: 'Romance',
        description: '',
        coverImage: null,
        status: 'upcoming',
        bestseller: false,
        mature: false,
        scheduledDate: null,
        views: 0,
        chapters: []
    };
    stories.push(currentEditingStory);
    saveAllData();
    editStoryInEditor(currentEditingStory.id);
}

function editStoryInEditor(storyId) {
    const story = stories.find(s => s.id === storyId);
    if (!story) return;
    
    currentEditingStory = story;
    document.getElementById('editorStoryTitle').value = story.title;
    document.getElementById('storyGenre').value = story.genre;
    document.getElementById('storyStatus').value = story.status;
    document.getElementById('storyDescription').value = story.description || '';
    document.getElementById('markBestseller').checked = story.bestseller || false;
    document.getElementById('markMature').checked = story.mature || false;
    document.getElementById('scheduleDate').value = story.scheduledDate || '';
    
    const coverPreview = document.getElementById('coverPreview');
    if (story.coverImage) {
        coverPreview.innerHTML = `<img src="${story.coverImage}" alt="Cover" style="max-width: 100%; max-height: 250px; object-fit: contain; border-radius: 10px;">`;
    } else {
        coverPreview.innerHTML = '<p style="color: var(--text-light); font-size: 48px;">📷</p><p style="color: var(--text-light); font-size: 14px;">Click to upload cover image</p>';
    }
    
    updateEditorStats();
    renderEditorChapters();
    navigateTo('editor');
}

function deleteStory(storyId) {
    if (confirm('Are you sure you want to delete this story? This action cannot be undone!')) {
        const index = stories.findIndex(s => s.id === storyId);
        if (index > -1) {
            stories.splice(index, 1);
            saveAllData();
            showNotification('Story deleted successfully!');
            renderDashboard();
        }
    }
}

// Editor Functions
function switchEditorSection(section) {
    document.querySelectorAll('.sidebar-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.section === section) opt.classList.add('active');
    });
    document.querySelectorAll('.editor-section').forEach(sec => sec.classList.remove('active'));
    const sectionMap = {
        'details': 'detailsSection',
        'chapters': 'chaptersSection',
        'settings': 'settingsSection'
    };
    document.getElementById(sectionMap[section])?.classList.add('active');
}

function updateEditorStats() {
    if (!currentEditingStory) return;
    document.getElementById('totalChapters').textContent = currentEditingStory.chapters.length;
    let totalWords = 0;
    currentEditingStory.chapters.forEach(ch => {
        totalWords += ch.content.split(/\s+/).filter(w => w.length > 0).length;
    });
    document.getElementById('totalWords').textContent = totalWords;
}

function renderEditorChapters() {
    const container = document.getElementById('editorChaptersList');
    if (!container || !currentEditingStory) return;
    
    if (currentEditingStory.chapters.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-light);"><p>No chapters yet. Click "Add New Chapter"!</p></div>';
        return;
    }
    
    container.innerHTML = currentEditingStory.chapters.map((chapter, index) => `
        <div class="chapter-item">
            <div class="chapter-item-info">
                <div class="chapter-item-title">${chapter.title}</div>
                <div class="chapter-item-meta">${chapter.content.split(/\s+/).filter(w => w.length > 0).length} words</div>
            </div>
            <div class="chapter-item-actions">
                <button class="icon-btn-small" onclick="editChapter(${index})">✏️</button>
                <button class="icon-btn-small" onclick="deleteChapter(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function openChapterEditor(chapterIndex = null) {
    currentEditingChapter = chapterIndex;
    if (chapterIndex !== null && currentEditingStory.chapters[chapterIndex]) {
        const chapter = currentEditingStory.chapters[chapterIndex];
        document.getElementById('chapterTitleEdit').value = chapter.title;
        document.getElementById('chapterContentEdit').value = chapter.content;
        document.getElementById('chapterTriggerWarnings').value = chapter.triggerWarnings || '';
        document.getElementById('chapterAuthorNoteTop').value = chapter.authorNoteTop || '';
        document.getElementById('chapterAuthorNoteBottom').value = chapter.authorNoteBottom || '';
    } else {
        document.getElementById('chapterTitleEdit').value = `Chapter ${currentEditingStory.chapters.length + 1}`;
        document.getElementById('chapterContentEdit').value = '';
        document.getElementById('chapterTriggerWarnings').value = '';
        document.getElementById('chapterAuthorNoteTop').value = '';
        document.getElementById('chapterAuthorNoteBottom').value = '';
    }
    updateWordCount();
    openModal('chapterEditorModal');
}

function editChapter(index) {
    openChapterEditor(index);
}

function deleteChapter(index) {
    if (confirm('Delete this chapter?')) {
        currentEditingStory.chapters.splice(index, 1);
        saveAllData();
        renderEditorChapters();
        updateEditorStats();
        showNotification('Chapter deleted! 🗑️');
    }
}

function saveChapterFromEditor() {
    const title = document.getElementById('chapterTitleEdit').value.trim();
    const content = document.getElementById('chapterContentEdit').value.trim();
    const triggerWarnings = document.getElementById('chapterTriggerWarnings').value.trim();
    const authorNoteTop = document.getElementById('chapterAuthorNoteTop').value.trim();
    const authorNoteBottom = document.getElementById('chapterAuthorNoteBottom').value.trim();
    
    if (!title) {
        showNotification('Enter chapter title!', 'error');
        return;
    }
    if (!content) {
        showNotification('Write some content!', 'error');
        return;
    }
    
    const chapterData = {
        title,
        content,
        triggerWarnings,
        authorNoteTop,
        authorNoteBottom
    };
    
    if (currentEditingChapter !== null) {
        currentEditingStory.chapters[currentEditingChapter] = chapterData;
    } else {
        currentEditingStory.chapters.push(chapterData);
    }
    
    saveAllData();
    closeModal('chapterEditorModal');
    renderEditorChapters();
    updateEditorStats();
    showNotification('Chapter saved! ✅');
}

function updateWordCount() {
    const content = document.getElementById('chapterContentEdit')?.value || '';
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    const wordCountEl = document.getElementById('wordCount');
    if (wordCountEl) wordCountEl.textContent = `${words} words`;
}

function saveCurrentStory() {
    if (!currentEditingStory) return;
    currentEditingStory.title = document.getElementById('editorStoryTitle').value || 'Untitled Story';
    currentEditingStory.genre = document.getElementById('storyGenre').value;
    currentEditingStory.status = document.getElementById('storyStatus').value;
    currentEditingStory.description = document.getElementById('storyDescription').value;
    currentEditingStory.bestseller = document.getElementById('markBestseller').checked;
    currentEditingStory.mature = document.getElementById('markMature').checked;
    currentEditingStory.scheduledDate = document.getElementById('scheduleDate').value || null;
    saveAllData();
    showNotification('Story saved! 💾');
}

function publishCurrentStory() {
    if (!currentEditingStory) return;
    if (currentEditingStory.chapters.length === 0) {
        showNotification('Add at least one chapter before publishing!', 'error');
        return;
    }
    if (!currentEditingStory.title || currentEditingStory.title === 'Untitled Story') {
        showNotification('Give your story a title!', 'error');
        return;
    }
    saveCurrentStory();
    currentEditingStory.status = 'ongoing';
    document.getElementById('storyStatus').value = 'ongoing';
    saveAllData();
    showNotification('Story published! 🚀');
}

function formatText(command) {
    const textarea = document.getElementById('chapterContentEdit');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    if (!selectedText) {
        showNotification('Select text to format!', 'error');
        return;
    }
    let formattedText = selectedText;
    switch(command) {
        case 'bold': formattedText = `**${selectedText}**`; break;
        case 'italic': formattedText = `*${selectedText}*`; break;
        case 'underline': formattedText = `__${selectedText}__`; break;
    }
    textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.focus();
    updateWordCount();
}

function insertQuote() {
    const textarea = document.getElementById('chapterContentEdit');
    const start = textarea.selectionStart;
    const quote = '\n\n"Your quote here..."\n\n';
    textarea.value = textarea.value.substring(0, start) + quote + textarea.value.substring(start);
    textarea.focus();
    updateWordCount();
}

function insertDivider() {
    const textarea = document.getElementById('chapterContentEdit');
    const start = textarea.selectionStart;
    const divider = '\n\n* * *\n\n';
    textarea.value = textarea.value.substring(0, start) + divider + textarea.value.substring(start);
    textarea.focus();
    updateWordCount();
}

function handleCoverUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showNotification('Image too large (max 2MB)!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        currentEditingStory.coverImage = imageData;
        document.getElementById('coverPreview').innerHTML = `<img src="${imageData}" alt="Cover" style="max-width: 100%; max-height: 250px; object-fit: contain; border-radius: 10px;">`;
        saveAllData();
        showNotification('Cover uploaded! 📸');
    };
    reader.readAsDataURL(file);
}

// Reader Settings
function toggleReaderSettings() {
    document.getElementById('readerSettingsPanel').classList.toggle('active');
}

function updateFontFamily(font) {
    readerSettings.fontFamily = font;
    applyReaderSettings();
    saveAllData();
}

function updateFontSize(e) {
    const size = e.target.value;
    readerSettings.fontSize = parseInt(size);
    document.getElementById('fontSizeValue').textContent = size + 'px';
    applyReaderSettings();
    saveAllData();
}

function updateLineHeight(e) {
    const height = e.target.value;
    readerSettings.lineHeight = parseFloat(height);
    document.getElementById('lineHeightValue').textContent = height;
    applyReaderSettings();
    saveAllData();
}

function updateReaderTheme(theme) {
    readerSettings.theme = theme;
    const readerContainer = document.querySelector('.reader-container');
    if (!readerContainer) return;
    
    readerContainer.classList.remove('theme-default', 'theme-sepia', 'theme-dark', 'theme-night');
    
    switch(theme) {
        case 'sepia':
            readerContainer.style.background = '#f4ecd8';
            readerContainer.style.color = '#5c4a3a';
            break;
        case 'dark':
            readerContainer.style.background = '#2d2d2d';
            readerContainer.style.color = '#e0e0e0';
            break;
        case 'night':
            readerContainer.style.background = '#1a1a2e';
            readerContainer.style.color = '#eaeaea';
            break;
        default:
            readerContainer.style.background = 'var(--bg-white)';
            readerContainer.style.color = 'var(--text-dark)';
    }
    saveAllData();
}

function applyReaderSettings() {
    const content = document.getElementById('readerContent');
    if (content) {
        content.style.fontFamily = `'${readerSettings.fontFamily}', sans-serif`;
        content.style.fontSize = readerSettings.fontSize + 'px';
        content.style.lineHeight = readerSettings.lineHeight;
    }
    updateReaderTheme(readerSettings.theme);
}

// Comments
function getCommentKey(storyId, chapterIndex) {
    return `${storyId}-${chapterIndex}`;
}

function loadComments(storyId, chapterIndex) {
    const key = getCommentKey(storyId, chapterIndex);
    const chapterComments = comments[key] || [];
    document.getElementById('commentsCount').textContent = `${chapterComments.length} Comment${chapterComments.length !== 1 ? 's' : ''}`;
    
    if (chapterComments.length === 0) {
        document.getElementById('commentsList').innerHTML = '<div class="no-comments"><p>No comments yet. Be the first! 💭</p></div>';
        return;
    }
    
    document.getElementById('commentsList').innerHTML = chapterComments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <div class="comment-user">
                    <div class="comment-avatar">${comment.userName[0].toUpperCase()}</div>
                    <div class="comment-user-info">
                        <h5>${comment.userName}</h5>
                        <p>${comment.timestamp}</p>
                    </div>
                </div>
                <div style="color: #FFD700;">${'⭐'.repeat(comment.rating)}</div>
            </div>
            <div class="comment-text">${comment.text}</div>
        </div>
    `).join('');
    
    document.getElementById('commentInput').value = '';
    selectedRating = 0;
    updateStarRating();
}

function submitComment() {
    if (!currentUser) {
        showNotification('Please login to comment! 📚', 'error');
        openModal('loginModal');
        return;
    }
    const commentText = document.getElementById('commentInput').value.trim();
    if (!commentText) {
        showNotification('Write a comment! ✍️', 'error');
        return;
    }
    if (selectedRating === 0) {
        showNotification('Select a rating! ⭐', 'error');
        return;
    }
    
    const key = getCommentKey(currentStory.id, currentChapter);
    if (!comments[key]) comments[key] = [];
    
    const newComment = {
        userName: currentUser.name,
        text: commentText,
        rating: selectedRating,
        timestamp: new Date().toLocaleString()
    };
    comments[key].push(newComment);
    saveAllData();
    loadComments(currentStory.id, currentChapter);
    showNotification('Thank you! 💖');
}

function updateStarRating() {
    document.querySelectorAll('.rating-stars .star').forEach((star, index) => {
        if (index < selectedRating) star.classList.add('active');
        else star.classList.remove('active');
    });
}

function scrollToComments() {
    const commentsSection = document.querySelector('.comments-section');
    if (commentsSection) commentsSection.scrollIntoView({ behavior: 'smooth' });
}

// Table of Contents
function openTOC() {
    if (!currentStory) return;
    document.getElementById('tocStoryTitle').textContent = currentStory.title;
    document.getElementById('tocStoryMeta').textContent = `${currentStory.chapters.length} Chapters • ${currentStory.genre}`;
    
    const chapterList = document.getElementById('tocChapterList');
    chapterList.innerHTML = currentStory.chapters.map((chapter, index) => `
        <div class="toc-chapter-item ${index === currentChapter ? 'current' : ''}" onclick="jumpToChapter(${index})">
            <div class="toc-chapter-number">Chapter ${index + 1}</div>
            <div class="toc-chapter-title">${chapter.title}</div>
        </div>
    `).join('');
    
    document.getElementById('tocOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTOC() {
    document.getElementById('tocOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function jumpToChapter(chapterIndex) {
    if (currentStory) {
        closeTOC();
        readStory(currentStory.id, chapterIndex);
    }
}

// Sharing Functions
function shareStory() {
    if (!currentStory) return;
    const shareText = `Check out "${currentStory.title}" by Hannie! 📚\n\nA ${currentStory.genre} story with ${currentStory.chapters.length} chapters.`;
    
    if (navigator.share) {
        navigator.share({
            title: currentStory.title,
            text: shareText,
            url: window.location.href
        }).then(() => {
            showNotification('Story shared successfully! 🎉');
        }).catch(() => {
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

function handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    document.querySelectorAll('.share-quote-btn').forEach(btn => btn.remove());
    
    if (selectedText.length > 10 && selectedText.length < 280 && !document.getElementById('readerPage').classList.contains('hidden')) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const button = document.createElement('button');
        button.className = 'share-quote-btn';
        button.textContent = '📝 Share Quote';
        button.style.position = 'fixed';
        button.style.top = (rect.top - 40) + 'px';
        button.style.left = (rect.left + rect.width / 2) + 'px';
        button.onclick = () => shareQuote(selectedText);
        
        document.body.appendChild(button);
        
        setTimeout(() => {
            if (document.querySelector('.share-quote-btn')) {
                button.remove();
            }
        }, 3000);
    }
}

function shareQuote(quote) {
    if (!currentStory) return;
    const shareText = `"${quote}"\n\n— From "${currentStory.title}" by Hannie 📚`;
    copyToClipboard(shareText);
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard! 📋');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showNotification('Copied to clipboard! 📋');
    } catch (err) {
        showNotification('Could not copy text', 'error');
    }
    document.body.removeChild(textarea);
}

// Newsletter
function handleNewsletter(e) {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value.trim();
    
    if (!email) {
        showNotification('Please enter your email!', 'error');
        return;
    }
    
    if (subscribers.includes(email)) {
        showNotification('You are already subscribed! 💌', 'error');
        return;
    }
    
    subscribers.push(email);
    saveAllData();
    updateStats();
    document.getElementById('newsletterEmail').value = '';
    showNotification('Thank you for subscribing! 💌');
}

// Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
}

function checkDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function switchModal(currentModalId, newModalId) {
    closeModal(currentModalId);
    setTimeout(() => openModal(newModalId), 300);
}

// Terms Modal Functions
function openTermsFromSignup() {
    openModal('termsModal');
}

function closeTermsModal() {
    closeModal('termsModal');
}

// Password Visibility Toggle
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} active`;
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize reader settings on page load
if (readerSettings) {
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    
    if (fontSizeSlider) {
        fontSizeSlider.value = readerSettings.fontSize;
        document.getElementById('fontSizeValue').textContent = readerSettings.fontSize + 'px';
    }
    
    if (lineHeightSlider) {
        lineHeightSlider.value = readerSettings.lineHeight;
        document.getElementById('lineHeightValue').textContent = readerSettings.lineHeight;
    }
    
    document.querySelectorAll('.font-option').forEach(option => {
        if (option.dataset.font === readerSettings.fontFamily) {
            option.classList.add('active');
        }
    });
    
    document.querySelectorAll('.theme-option').forEach(option => {
        if (option.dataset.theme === readerSettings.theme) {
            option.classList.add('active');
        }
    });
}

// Prevent data loss on page unload if user is editing
window.addEventListener('beforeunload', function(e) {
    if (currentEditingStory && document.getElementById('editorPage') && !document.getElementById('editorPage').classList.contains('hidden')) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// Auto-save feature for editor (every 30 seconds)
let autoSaveInterval;
function startAutoSave() {
    clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
        if (currentEditingStory && document.getElementById('editorPage') && !document.getElementById('editorPage').classList.contains('hidden')) {
            saveCurrentStory();
            console.log('Auto-saved at', new Date().toLocaleTimeString());
        }
    }, 30000);
}

// Start auto-save when editor is opened
document.addEventListener('DOMContentLoaded', function() {
    startAutoSave();
});

// Handle image loading errors
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Handle responsive menu for mobile (if needed in future)
let mobileMenuOpen = false;
function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    const nav = document.querySelector('nav');
    if (nav) {
        nav.style.display = mobileMenuOpen ? 'flex' : '';
    }
}

// Keyboard shortcuts for reader
document.addEventListener('keydown', function(e) {
    if (!document.getElementById('readerPage').classList.contains('hidden')) {
        if (e.key === 'ArrowLeft' && currentChapter > 0) {
            goToPrevChapter();
        } else if (e.key === 'ArrowRight' && currentStory && currentChapter < currentStory.chapters.length - 1) {
            goToNextChapter();
        } else if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
            const activeElement = document.activeElement;
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                openTOC();
            }
        }
    }
});

// Close modals on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        if (document.getElementById('tocOverlay').classList.contains('active')) {
            closeTOC();
        }
        if (document.getElementById('readerSettingsPanel').classList.contains('active')) {
            toggleReaderSettings();
        }
        document.body.style.overflow = '';
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.reader-settings-btn') && !e.target.closest('.reader-settings-panel')) {
        const panel = document.getElementById('readerSettingsPanel');
        if (panel && panel.classList.contains('active')) {
            panel.classList.remove('active');
        }
    }
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // Adjust layout if needed
        if (window.innerWidth > 768) {
            const nav = document.querySelector('nav');
            if (nav) nav.style.display = '';
        }
    }, 250);
});

// Performance: Lazy load images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Call lazy load on page load
document.addEventListener('DOMContentLoaded', lazyLoadImages);

// Reading time estimator
function estimateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}

// Add reading time to chapters if needed
function updateChapterReadingTime() {
    if (currentStory && currentStory.chapters[currentChapter]) {
        const chapter = currentStory.chapters[currentChapter];
        const readingTime = estimateReadingTime(chapter.content);
        const readerChapter = document.getElementById('readerChapter');
        if (readerChapter && !readerChapter.textContent.includes('min read')) {
            readerChapter.textContent += ` • ${readingTime} min read`;
        }
    }
}

// Export/Import data functions (for backup)
function exportData() {
    const data = {
        stories,
        users,
        bookmarks: bookmarkedStories,
        subscribers,
        comments,
        storyProgress
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hannie-stories-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully! 💾');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('This will replace all current data. Continue?')) {
                stories = data.stories || stories;
                users = data.users || users;
                bookmarkedStories = data.bookmarks || bookmarkedStories;
                subscribers = data.subscribers || subscribers;
                comments = data.comments || comments;
                storyProgress = data.storyProgress || storyProgress;
                saveAllData();
                location.reload();
            }
        } catch (error) {
            showNotification('Invalid backup file!', 'error');
        }
    };
    reader.readAsText(file);
}

// Debug mode (for development)
let debugMode = false;
function toggleDebugMode() {
    debugMode = !debugMode;
    if (debugMode) {
        console.log('Debug Mode Enabled');
        console.log('Stories:', stories);
        console.log('Users:', users);
        console.log('Current User:', currentUser);
        console.log('Comments:', comments);
    }
}

// Console easter egg
console.log('%c📚 Hannie\'s Book Stories', 'color: #6B5B95; font-size: 24px; font-weight: bold;');
console.log('%cWelcome to the console! 👋', 'color: #6B5B95; font-size: 14px;');
console.log('%cType toggleDebugMode() to see debug info', 'color: #999; font-size: 12px;');

// Initialize everything
console.log('✅ All systems initialized successfully!');