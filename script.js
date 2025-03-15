// Replace with your TMDB API key
// For example, if your API key is "abc123xyz", it should look like this:
// const TMDB_API_KEY = 'abc123xyz';
const TMDB_API_KEY = '759375cc4a2e1dfff8aaacb89779d3e7';
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');

// Add event listener for Enter key
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingDiv;
}

function createMovieRecommendation(movie) {
    const movieDiv = document.createElement('div');
    movieDiv.className = 'movie-recommendation';
    
    const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
        : 'https://via.placeholder.com/200x300?text=No+Image';

    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

    // Determine available platforms based on release year and region
    const platforms = determineAvailablePlatforms(movie);
    const platformsHTML = platforms.length > 0 
        ? `<div class="watch-platforms">
            ${platforms.map(platform => `
                <span class="platform-badge ${platform.id}">
                    ${platform.name}
                </span>
            `).join('')}
           </div>`
        : '<div class="watch-platforms"><span class="platform-badge">Not available on major platforms</span></div>';

    movieDiv.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
        <div class="movie-info">
            <h3>${movie.title} (${releaseYear})</h3>
            <p class="movie-rating">Rating: ${movie.vote_average}/10</p>
            <p>${movie.overview || 'No overview available.'}</p>
            ${platformsHTML}
        </div>
    `;
    return movieDiv;
}

function determineAvailablePlatforms(movie) {
    const platforms = [];
    const currentYear = new Date().getFullYear();
    const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : currentYear;

    // Simple logic to determine platforms based on release year and popularity
    if (movieYear >= 2015) {
        // Newer movies are likely on multiple platforms
        if (movie.vote_average >= 7) {
            platforms.push({ id: 'netflix', name: 'Netflix' });
        }
        if (movie.vote_average >= 6.5) {
            platforms.push({ id: 'prime', name: 'Prime Video' });
        }
        if (movie.original_language === 'hi' || movie.original_language === 'te' || movie.original_language === 'ta') {
            platforms.push({ id: 'hotstar', name: 'Disney+ Hotstar' });
        }
    } else {
        // Older movies are more likely on specific platforms
        if (movie.original_language === 'hi' || movie.original_language === 'te' || movie.original_language === 'ta') {
            platforms.push({ id: 'zee5', name: 'ZEE5' });
            platforms.push({ id: 'hotstar', name: 'Disney+ Hotstar' });
        } else {
            platforms.push({ id: 'prime', name: 'Prime Video' });
        }
    }

    return platforms;
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Clear input
    userInput.value = '';

    // Add user message
    addMessage(message, 'user');

    // Show loading indicator
    const loadingDiv = showLoading();

    try {
        // Extract year from search query if present (e.g., "Movie Name (2014)")
        const yearMatch = message.match(/\((\d{4})\)/);
        const searchYear = yearMatch ? yearMatch[1] : null;
        const searchTitle = message.replace(/\s*\(\d{4}\)\s*/, '').trim();

        // First, search for the specific movie
        const searchResponse = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}&language=en-US&page=1`
        );
        const searchData = await searchResponse.json();

        if (!searchData.results || searchData.results.length === 0) {
            // If no results found, try a fuzzy search with less strict parameters
            const fuzzySearchResponse = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}&language=en-US&page=1&include_adult=false`
            );
            const fuzzySearchData = await fuzzySearchResponse.json();

            loadingDiv.remove();

            if (fuzzySearchData.results && fuzzySearchData.results.length > 0) {
                // Found similar titles
                const suggestions = fuzzySearchData.results
                    .slice(0, 3)
                    .map(m => {
                        const year = m.release_date ? ` (${new Date(m.release_date).getFullYear()})` : '';
                        return `"${m.title}${year}"`;
                    })
                    .join(', ');
                
                addMessage(`I couldn't find "${searchTitle}". Did you mean one of these: ${suggestions}?`, 'bot');
            } else {
                // No similar titles found
                addMessage(`Sorry, I couldn't find any movies matching "${searchTitle}". Please check the spelling or try a different movie name.`, 'bot');
            }
            return;
        }

        let movie;
        
        if (searchYear) {
            // If year was specified, find the movie with matching year
            movie = searchData.results.find(m => {
                const movieYear = m.release_date ? new Date(m.release_date).getFullYear().toString() : null;
                return movieYear === searchYear;
            });
            
            // If no exact year match found, use the first result
            if (!movie) {
                movie = searchData.results[0];
                const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
                addMessage(`Note: Couldn't find "${searchTitle}" from ${searchYear}. Showing results for "${movie.title}" (${movieYear}) instead.`, 'bot');
            }
        } else {
            // If multiple movies found with same title, show a message with years
            if (searchData.results.length > 1) {
                const movieOptions = searchData.results
                    .slice(0, 3) // Show top 3 matches
                    .map(m => {
                        const year = m.release_date ? new Date(m.release_date).getFullYear() : 'N/A';
                        return `"${m.title}" (${year})`;
                    })
                    .join(', ');
                addMessage(`Found multiple movies with similar titles: ${movieOptions}. For a specific movie, include the year like: "${searchTitle} (YEAR)"`, 'bot');
            }
            movie = searchData.results[0];
        }

        // Get recommendations for this specific movie
        const recommendResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        const recommendData = await recommendResponse.json();

        // Get similar movies
        const similarResponse = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        const similarData = await similarResponse.json();

        // Combine and filter recommendations and similar movies
        const allRecommendations = [...(recommendData.results || []), ...(similarData.results || [])]
            .filter((movie, index, self) => 
                index === self.findIndex((m) => m.id === movie.id) && // Remove duplicates
                movie.vote_average >= 6 && 
                movie.vote_count >= 50
            )
            .sort((a, b) => b.vote_average - a.vote_average)
            .slice(0, 10);

        // Remove loading indicator
        loadingDiv.remove();

        // Display the original movie first
        addMessage(`Here's the movie you searched for:`, 'bot');
        chatMessages.appendChild(createMovieRecommendation(movie));

        if (allRecommendations.length > 0) {
            addMessage(`If you liked "${movie.title}", you might also enjoy these similar movies:`, 'bot');
            
            // Create a section for similar movies
            const similarMoviesSection = document.createElement('div');
            similarMoviesSection.className = 'similar-movies-section';
            
            // Add all recommendations to the section
            allRecommendations.forEach(movie => {
                similarMoviesSection.appendChild(createMovieRecommendation(movie));
            });
            
            chatMessages.appendChild(similarMoviesSection);
        } else {
            // If specific movie not found, try the category-based search
            let searchUrl;
            const lowercaseMessage = message.toLowerCase();

            if (lowercaseMessage.includes('cricket')) {
                searchUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}`
                    + '&language=en-US'
                    + '&sort_by=vote_average.desc'
                    + '&vote_count.gte=100'
                    + '&vote_average.gte=6'
                    + '&with_keywords=9833|158091'
                    + '&with_text_query=cricket'
                    + '&page=1';
            } else if (lowercaseMessage.includes('sports')) {
                searchUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}`
                    + '&language=en-US'
                    + '&sort_by=vote_average.desc'
                    + '&vote_count.gte=100'
                    + '&vote_average.gte=6.5'
                    + '&with_genres=18,28'
                    + '&with_keywords=158091'
                    + '&page=1';
            } else {
                // Try to find similar movies based on partial matches
                const fuzzySearchResponse = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}&language=en-US&page=1&include_adult=false`
                );
                const fuzzySearchData = await fuzzySearchResponse.json();

                if (fuzzySearchData.results && fuzzySearchData.results.length > 0) {
                    // Found similar titles
                    const suggestions = fuzzySearchData.results
                        .slice(0, 3)
                        .map(m => {
                            const year = m.release_date ? ` (${new Date(m.release_date).getFullYear()})` : '';
                            return `"${m.title}${year}"`;
                        })
                        .join(', ');
                    
                    loadingDiv.remove();
                    addMessage(`I couldn't find an exact match for "${searchTitle}". Did you mean one of these: ${suggestions}?`, 'bot');
                    return;
                }

                // If no similar movies found, show general recommendations
                searchUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}`
                    + '&language=en-US'
                    + '&sort_by=vote_average.desc'
                    + '&vote_count.gte=100'
                    + '&vote_average.gte=7'
                    + '&page=1';
            }

            const discoverResponse = await fetch(searchUrl);
            const discoverData = await discoverResponse.json();

            // Remove loading indicator
            loadingDiv.remove();

            if (discoverData.results && discoverData.results.length > 0) {
                if (!searchTitle.includes('cricket') && !searchTitle.includes('sports')) {
                    addMessage(`I couldn't find "${searchTitle}". Here are some popular movies you might enjoy instead:`, 'bot');
                } else {
                    addMessage('Here are some highly-rated movies you might enjoy:', 'bot');
                }
                
                // Create a section for discovered movies
                const discoveredMoviesSection = document.createElement('div');
                discoveredMoviesSection.className = 'similar-movies-section';
                
                const recommendations = discoverData.results.slice(0, 10);
                recommendations.forEach(movie => {
                    discoveredMoviesSection.appendChild(createMovieRecommendation(movie));
                });
                
                chatMessages.appendChild(discoveredMoviesSection);
            } else {
                addMessage(`Sorry, I couldn't find any movies matching "${searchTitle}". Please check the spelling or try a different movie name.`, 'bot');
            }
        }
    } catch (error) {
        loadingDiv.remove();
        addMessage("Sorry, I encountered an error. Please try again.", 'bot');
        console.error('Error:', error);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function() {
    const openChatBtn = document.querySelector('.open-chat-btn');
    const closeChatBtn = document.querySelector('.close-chat-btn');
    const overlay = document.querySelector('.overlay');
    const container = document.querySelector('.container');

    // Open chatbot
    openChatBtn.addEventListener('click', function() {
        overlay.style.display = 'block';
        container.style.display = 'block';
        // Add initial welcome message if chat is empty
        if (document.querySelector('.chat-messages').children.length === 0) {
            addMessage("Hi! I'm your movie recommendation assistant. How can I help you today?", 'bot');
        }
    });

    // Close chatbot
    closeChatBtn.addEventListener('click', function() {
        overlay.style.display = 'none';
        container.style.display = 'none';
    });

    // Close chatbot when clicking overlay
    overlay.addEventListener('click', function() {
        overlay.style.display = 'none';
        container.style.display = 'none';
    });
}); 