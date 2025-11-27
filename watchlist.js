// API Configuration
const CONFIG = {
    TMDB_API_KEY: "744a59dd207c2c61a4e50d8408cb0ca8" /* window.ENV?.TMDB_API_KEY */
};

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

// Get watchlist ID from URL
const urlParams = new URLSearchParams(window.location.search);
const watchlistId = urlParams.get("id") || "2025-fangtober";
const watchlistConfig =
    WATCHLIST[watchlistId] || WATCHLIST["2025-fangtober"];

let movies = [];
let currentMovieIndex = 0;
let watchedMovies =
    JSON.parse(localStorage.getItem(`watchlist_${watchlistId}_watched`)) ||
    [];
let touchStartX = 0;
let touchEndX = 0;

// Update page title
document.getElementById("watchlistTitle").innerHTML =
    watchlistConfig.title;
document.getElementById("totalCount").textContent =
    watchlistConfig.targetCount;

async function fetchMovieData() {
    const promises = watchlistConfig.movies.map(async (movie) => {
        try {
            const searchUrl = `${BASE_URL}/search/movie?api_key=${CONFIG.TMDB_API_KEY
                }&query=${encodeURIComponent(movie.title)}&year=${movie.year}`;
            const response = await fetch(searchUrl);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const result = data.results[0];

                const detailUrl = `${BASE_URL}/movie/${result.id}?api_key=${CONFIG.TMDB_API_KEY}&append_to_response=credits,watch/providers`;
                const detailResponse = await fetch(detailUrl);
                const details = await detailResponse.json();

                const director = details.credits.crew.find(
                    (person) => person.job === "Director"
                );

                // Get US streaming providers
                const providers = details["watch/providers"]?.results?.US;

                return {
                    id: result.id,
                    title: result.title,
                    year: result.release_date?.substring(0, 4) || movie.year,
                    poster: result.poster_path
                        ? IMG_BASE + result.poster_path
                        : "https://via.placeholder.com/500x750?text=No+Poster",
                    summary: result.overview || "No summary available.",
                    genres: details.genres.map((g) => g.name),
                    director: director ? director.name : "Unknown",
                    runtime: details.runtime || null,
                    streaming: providers,
                };
            }

            return {
                id: Date.now() + Math.random(),
                title: movie.title,
                year: movie.year,
                poster: "https://via.placeholder.com/500x750?text=No+Poster",
                summary: "Information not available.",
                genres: ["Horror"],
                director: "Unknown",
                runtime: null,
                streaming: null,
            };
        } catch (error) {
            console.error(`Error fetching ${movie.title}:`, error);
            return null;
        }
    });

    const results = await Promise.all(promises);
    movies = results.filter((m) => m !== null);

    populateFilters();
    renderMovies();
    updateCounter();
}

function populateFilters() {
    const years = [...new Set(movies.map((m) => m.year))].sort();
    const genres = [...new Set(movies.flatMap((m) => m.genres))].sort();

    const yearFilter = document.getElementById("yearFilter");
    years.forEach((year) => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    const genreFilter = document.getElementById("genreFilter");
    genres.forEach((genre) => {
        const option = document.createElement("option");
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
    });
}

function filterAndSortMovies() {
    const yearFilter = document.getElementById("yearFilter").value;
    const genreFilter = document.getElementById("genreFilter").value;
    const sortBy = document.getElementById("sortBy").value;

    let filtered = movies.filter((movie) => {
        const yearMatch = !yearFilter || movie.year == yearFilter;
        const genreMatch = !genreFilter || movie.genres.includes(genreFilter);
        return yearMatch && genreMatch;
    });

    filtered.sort((a, b) => {
        switch (sortBy) {
            case "alpha":
                return a.title.localeCompare(b.title);
            case "alpha-reverse":
                return b.title.localeCompare(a.title);
            case "year-old":
                return a.year - b.year;
            case "year-new":
                return b.year - a.year;
            case "runtime-short":
                if (!a.runtime) return 1;
                if (!b.runtime) return -1;
                return a.runtime - b.runtime;
            case "runtime-long":
                if (!a.runtime) return 1;
                if (!b.runtime) return -1;
                return b.runtime - a.runtime;
            default:
                return 0;
        }
    });

    return filtered;
}

function renderMovies() {
    const grid = document.getElementById("movieGrid");
    const filtered = filterAndSortMovies();

    grid.innerHTML = filtered
        .map(
            (movie, index) => `
                <div class="movie-card" data-index="${movies.indexOf(movie)}">
                    ${watchedMovies.includes(movie.id)
                    ? '<div class="watched-badge">✓</div>'
                    : ""
                }
                    <img class="movie-poster" src="${movie.poster}" alt="${movie.title
                }">
                    <div class="movie-info">
                        <div class="movie-title">${movie.title}</div>
                        <div class="movie-year">${movie.year}</div>
                    </div>
                </div>
            `
        )
        .join("");

    document.querySelectorAll(".movie-card").forEach((card) => {
        card.addEventListener("click", () => {
            openOverlay(parseInt(card.dataset.index));
        });
    });
}

function displayStreamingInfo(streaming) {
    const streamingInfo = document.getElementById("streamingInfo");
    const streamingServices = document.getElementById("streamingServices");

    if (!streaming) {
        /* streamingInfo.style.display = 'none'; Blank if there are no resources */
        streamingServices.innerHTML =
            '<div class="streaming-badge">Check the Internet Archive or Ask Me</div>';
        streamingInfo.style.display = "block";
        return;
    }

    const services = [];

    if (streaming.free) {
        services.push(
            ...streaming.free.map((s) => ({
                name: s.provider_name,
                type: "Free",
            }))
        );
    }
    if (streaming.ads) {
        services.push(
            ...streaming.ads.map((s) => ({
                name: s.provider_name,
                type: "Ads",
            }))
        );
    }

    if (streaming.flatrate) {
        services.push(
            ...streaming.flatrate.map((s) => ({
                name: s.provider_name,
                type: "Streaming",
            }))
        );
    }

    if (streaming.rent) {
        services.push(
            ...streaming.rent.map((s) => ({
                name: s.provider_name,
                type: "Rent",
            }))
        );
    }

    if (streaming.buy) {
        services.push(
            ...streaming.buy.map((s) => ({
                name: s.provider_name,
                type: "Buy",
            }))
        );
    }

    if (services.length === 0) {
        /* streamingInfo.style.display = 'none'; Blank if the list is empty */
        streamingServices.innerHTML =
            '<div class="streaming-badge">Check the Internet Archive or Ask Me</div>';
        streamingInfo.style.display = "block";
        return;
    }

    // Remove duplicates
    const uniqueServices = [
        ...new Map(services.map((s) => [s.name, s])).values(),
    ];

    streamingServices.innerHTML = uniqueServices
        .map((s) => `<div class="streaming-badge">${s.name}</div>`)
        .join("");

    streamingInfo.style.display = "block";
}

function openOverlay(index) {
    currentMovieIndex = index;
    const movie = movies[index];

    document.getElementById("overlayPoster").src = movie.poster;
    document.getElementById("overlayTitle").textContent = movie.title;
    document.getElementById(
        "overlayYear"
    ).innerHTML = `<b>Release:</b> ${movie.year}`;
    document.getElementById(
        "overlayDirector"
    ).innerHTML = `<b>Director:</b> ${movie.director}`;

    // Add runtime if available
    const runtimeText = movie.runtime
        ? `<b>Runtime:</b> ${movie.runtime} min`  //if...else
        : "";
    document.getElementById("overlayRuntime").innerHTML = runtimeText;
    document.getElementById("overlayRuntime").style.display = movie.runtime
        ? "inline"
        : "none";

    document.getElementById(
        "overlayGenres"
    ).innerHTML = `<b>Genre:</b> ${movie.genres.join(", ")}`;
    document.getElementById("overlaySummary").textContent = movie.summary;

    displayStreamingInfo(movie.streaming);

    const watchBtn = document.getElementById("watchToggle");
    const isWatched = watchedMovies.includes(movie.id);
    watchBtn.textContent = isWatched ? "✓ Watched" : "Mark as Watched";
    watchBtn.classList.toggle("watched", isWatched);

    document.getElementById("overlay").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeOverlay() {
    document.getElementById("overlay").classList.remove("active");
    document.body.style.overflow = "auto";
}

function navigateMovie(direction) {
    currentMovieIndex += direction;
    if (currentMovieIndex < 0) currentMovieIndex = movies.length - 1;
    if (currentMovieIndex >= movies.length) currentMovieIndex = 0;
    openOverlay(currentMovieIndex);
}

function toggleWatched() {
    const movie = movies[currentMovieIndex];
    const index = watchedMovies.indexOf(movie.id);

    if (index > -1) {
        watchedMovies.splice(index, 1);
    } else {
        watchedMovies.push(movie.id);
    }

    localStorage.setItem(
        `watchlist_${watchlistId}_watched`,
        JSON.stringify(watchedMovies)
    );
    updateCounter();
    renderMovies();

    const watchBtn = document.getElementById("watchToggle");
    const isWatched = watchedMovies.includes(movie.id);
    watchBtn.textContent = isWatched ? "✓ Watched" : "Mark as Watched";
    watchBtn.classList.toggle("watched", isWatched);

    if (
        watchedMovies.length === watchlistConfig.targetCount &&
        index === -1
    ) {
        setTimeout(() => {
            document.getElementById("congratsMessage").textContent =
                watchlistConfig.congratsMessage;
            document.getElementById("congratsModal").classList.add("active");
        }, 500);
    }
}

function updateCounter() {
    document.getElementById("watchedCount").textContent =
        watchedMovies.length;
}

function randomMovie() {
    const unwatched = movies.filter((m) => !watchedMovies.includes(m.id));
    if (unwatched.length === 0) {
        alert("You've watched all the movies! 🦇");
        return;
    }
    const random = unwatched[Math.floor(Math.random() * unwatched.length)];
    const index = movies.indexOf(random);
    openOverlay(index);
}

// Touch events for swipe
const overlayContent = document.querySelector(".overlay-content");
overlayContent.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

overlayContent.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        navigateMovie(1);
    }
    if (touchEndX > touchStartX + 50) {
        navigateMovie(-1);
    }
}

// Event listeners
document
    .getElementById("closeBtn")
    .addEventListener("click", closeOverlay);
document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target.id === "overlay") closeOverlay();
});
document
    .getElementById("prevBtn")
    .addEventListener("click", () => navigateMovie(-1));
document
    .getElementById("nextBtn")
    .addEventListener("click", () => navigateMovie(1));
document
    .getElementById("watchToggle")
    .addEventListener("click", toggleWatched);
document
    .getElementById("randomBtn")
    .addEventListener("click", randomMovie);
document
    .getElementById("yearFilter")
    .addEventListener("change", renderMovies);
document
    .getElementById("genreFilter")
    .addEventListener("change", renderMovies);
document
    .getElementById("sortBy")
    .addEventListener("change", renderMovies);

document.addEventListener("keydown", (e) => {
    if (document.getElementById("overlay").classList.contains("active")) {
        if (e.key === "Escape") closeOverlay();
        if (e.key === "ArrowLeft") navigateMovie(-1);
        if (e.key === "ArrowRight") navigateMovie(1);
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all progress for this watchlist? This cannot be undone.')) {
        watchedMovies = [];
        localStorage.setItem(`watchlist_${watchlistId}_watched`, JSON.stringify(watchedMovies));
        updateCounter();
        renderMovies();
    }
});


/* Color configuration  */
if (watchlistConfig.style) {
    const style = watchlistConfig.style;

    // Apply custom colors
    if (style.primaryColor) {
        // Overlay content styling
        document.querySelectorAll('.overlay-content').forEach(el => {
            el.style.background = `linear-gradient(135deg, #1a1a1a 0%, ${style.backgroundColor || '#2a1010'} 100%)`;
            el.style.boxShadow = `0 20px 60px ${style.primaryColor}66`; // 66 = 40% opacity
        });

        // Text colors
        document
            .querySelectorAll("h1, .counter, .nav-logo, .overlay-title")
            .forEach((el) => {
                el.style.color = style.primaryColor;
            });

        // Border colors
        document
            .querySelectorAll(
                "select, button, nav, .movie-card, .overlay-content"
            )
            .forEach((el) => {
                el.style.borderColor = style.primaryColor;
            });

        // Nav bar background
        document.querySelector(
            "nav"
        ).style.background = `${style.primaryColor}1A`; // 10% opacity

        // Nav links hover
        document.querySelectorAll(".nav-links a").forEach((el) => {
            el.addEventListener("mouseenter", function () {
                this.style.background = `${style.primaryColor}CC`; // 80% opacity
                this.style.color = "#fff";
            });
            el.addEventListener("mouseleave", function () {
                this.style.background = "";
                this.style.color = "#e0e0e0";
            });
        });

        // "film loading" text
        document.querySelectorAll(".loading")
            .forEach((el) => {
                el.style.color = `${style.primaryColor}80`; // ff = 100% opacity
            });

        // Movie card hover - appling inline style with !important via CSS worked
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
        .movie-card:hover {
            box - shadow: 0 10px 40px ${style.primaryColor}99 !important;
            }
        `;
        document.head.appendChild(styleSheet);

        // Random button and selector backgrounds
        document.querySelectorAll(".random-btn").forEach((el) => {
            el.style.background = style.primaryColor;
        });

        document.querySelectorAll("select, button:not(.random-btn)")
            .forEach((el) => {
                el.style.background = `${style.primaryColor}80`; // 80 = 50% opacity
            });

        // Hover effects for buttons and selects
        document.querySelectorAll("select, button").forEach((el) => {
            el.addEventListener("mouseenter", function () {
                if (this.classList.contains("random-btn")) {
                    this.style.background = style.primaryColor;
                    this.style.filter = "brightness(1.2)";
                } else {
                    this.style.background = `${style.primaryColor}CC`; // CC = 80% opacity
                }
                this.style.boxShadow = `0 0 15px ${style.primaryColor}80`; // 80 = 50% opacity
            });
            el.addEventListener("mouseleave", function () {
                if (this.classList.contains("random-btn")) {
                    this.style.background = style.primaryColor;
                    this.style.filter = "brightness(1)";
                } else {
                    this.style.background = `${style.primaryColor}80`; // 80 = 50% opacity
                }
                this.style.boxShadow = "";
            });
        });

        // Congrats modal 
        document.querySelectorAll('.congrats-content').forEach(el => {
        el.style.background = `linear-gradient(135deg, ${style.primaryColor} 0%, ${style.backgroundColor || '#8b0000'} 100%)`;
        el.style.boxShadow = `0 20px 60px ${style.backgroundColor}CC`; // CC = 80% opacity
        });

        // Title text shadow
        document.querySelector(
            "h1"
        ).style.textShadow = `0 0 20px ${style.primaryColor}80`;  // 80 = 50% opacity
    }

    if (style.backgroundColor) {
        document.body.style.background = `linear-gradient(135deg, ${style.backgroundColor} 0%, #0a0a0a 100%)`;
    }

    if (style.font) {
        document.querySelector("h1").style.fontFamily = style.font;
    }
}


// Hex Opacity Reference
/* 10 % = 1A
20 % = 33
30 % = 4D
40 % = 66
50 % = 80
60 % = 99
70 % = B3
80 % = CC
90 % = E6
100 % = FF */

// Initialize
fetchMovieData();
