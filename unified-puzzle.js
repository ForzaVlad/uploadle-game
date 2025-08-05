const API_KEY = "AIzaSyBTf23EVJhaTd83Yj4AEpLMskmmf5AFuug";

// Configuration object to handle different puzzle numbers and navigation
const PUZZLE_CONFIG = {
  1: { nextPage: "puzzle2.html", nextText: "Next Puzzle →" },
  2: { nextPage: "puzzle3.html", nextText: "Next Puzzle →" },
  3: { nextPage: "puzzle4.html", nextText: "Next Puzzle →" },
  4: { nextPage: "puzzle5.html", nextText: "Next Puzzle →" },
  5: { nextPage: "results.html", nextText: "See Results! →" }
};

// Get puzzle number from current page URL
function getCurrentPuzzleNumber() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  
  console.log('Current filename:', filename); // Debug log
  
  if (filename === 'puzzle.html') return 1;
  if (filename === 'results.html') return 0; // Special case for results
  if (filename === 'index.html' || filename === '') return -1; // Special case for index
  
  const match = filename.match(/puzzle(\d+)\.html/);
  const puzzleNum = match ? parseInt(match[1]) : 1;
  
  console.log('Detected puzzle number:', puzzleNum); // Debug log
  return puzzleNum;
}

// Progress tracking functions
function getCurrentDateKey() {
  // This will be set when we load the puzzle data
  return localStorage.getItem('current_puzzle_date') || 'unknown';
}

function getProgressKey() {
  return `progress_${getCurrentDateKey()}`;
}

function saveProgress(puzzleNumber) {
  const dateKey = getCurrentDateKey();
  localStorage.setItem(getProgressKey(), puzzleNumber.toString());
  console.log(`Progress saved: puzzle ${puzzleNumber} for date ${dateKey}`);
}

function getProgress() {
  const progress = localStorage.getItem(getProgressKey());
  return progress ? parseInt(progress) : 0;
}

function clearOldProgress(currentDate) {
  const storedDate = localStorage.getItem('current_puzzle_date');
  if (storedDate && storedDate !== currentDate) {
    // Date changed, clear old progress
    const oldProgressKey = `progress_${storedDate}`;
    localStorage.removeItem(oldProgressKey);
    console.log(`Cleared old progress for date: ${storedDate}`);
  }
  localStorage.setItem('current_puzzle_date', currentDate);
}

let guessCount = 0;
const maxGuesses = 10;
const currentPuzzle = getCurrentPuzzleNumber();

// Check if user should be redirected on page load
document.addEventListener("DOMContentLoaded", () => {
  checkAndRedirectIfNeeded();
});

async function checkAndRedirectIfNeeded() {
  // First, get the current date to set up progress tracking
  try {
    const today = await getTodayInCentralTime();
    clearOldProgress(today);
    
    const currentProgress = getProgress();
    const currentPage = getCurrentPuzzleNumber();
    
    console.log(`Current page: ${currentPage}, Progress: ${currentProgress}`);
    
    // If user is on index page, don't redirect
    if (currentPage === -1) {
      return; // Stay on index page
    }
    
    // If user is on results page
    if (currentPage === 0) {
      // Only allow if they've completed all puzzles
      if (currentProgress < 6) {
        console.log('User tried to access results without completing puzzles');
        window.location.href = 'index.html';
        return;
      }
      // User completed all puzzles, allow results page
      return;
    }
    
    // If progress exists and user is on wrong page, redirect
    if (currentProgress > 0) {
      const expectedPage = currentProgress;
      if (currentPage !== expectedPage) {
        console.log(`Redirecting from puzzle ${currentPage} to puzzle ${expectedPage}`);
        if (expectedPage <= 5) {
          const redirectUrl = expectedPage === 1 ? 'puzzle.html' : `puzzle${expectedPage}.html`;
          window.location.href = redirectUrl;
          return;
        } else {
          // User completed all puzzles, go to results
          window.location.href = 'results.html';
          return;
        }
      }
    }
    
    // If no progress and user is on a puzzle page, redirect to index
    if (currentProgress === 0 && currentPage > 0) {
      console.log('No progress found, redirecting to index');
      window.location.href = 'index.html';
      return;
    }
    
    // User is on correct page, load puzzle data
    loadPuzzleData();
    
  } catch (error) {
    console.error('Error in redirect check:', error);
    loadPuzzleData(); // Fallback to normal loading
  }
}

// Get current date in Central Time from a reliable external source
async function getTodayInCentralTime() {
  try {
    // Using WorldTimeAPI to get accurate Central Time
    const response = await fetch('https://worldtimeapi.org/api/timezone/America/Chicago');
    const timeData = await response.json();
    
    // Extract just the date part (YYYY-MM-DD)
    const centralDate = timeData.datetime.slice(0, 10);
    
    console.log('Current Central Time from API:', centralDate);
    return centralDate;
    
  } catch (error) {
    console.error('Error fetching world time, falling back to local time:', error);
    
    // Fallback to local time if API fails
    const now = new Date();
    const centralTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    
    const fallbackDate = centralTime.getFullYear() + '-' +
      String(centralTime.getMonth() + 1).padStart(2, '0') + '-' +
      String(centralTime.getDate()).padStart(2, '0');
      
    console.log('Fallback to local Central Time:', fallbackDate);
    return fallbackDate;
  }
}

async function loadPuzzleData() {
  try {
    console.log('Loading puzzle data...'); // Debug log
    
    const response = await fetch("videos.json");
    const data = await response.json();
    
    console.log('Videos data loaded:', data); // Debug log
    
    const today = await getTodayInCentralTime(); // Now async
    console.log('Today\'s date (Central Time):', today); // Debug log
    
    const puzzle = data.find(entry => entry.date === today);
    
    if (!puzzle) {
      console.error('No puzzle found for today:', today);
      console.log('Available dates:', data.map(entry => entry.date));
      
      // Fallback: use the most recent available date
      const sortedDates = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      const fallbackPuzzle = sortedDates[0];
      
      if (fallbackPuzzle) {
        console.log('Using fallback puzzle for date:', fallbackPuzzle.date);
        alert(`No puzzle for today (${today}). Using puzzle from ${fallbackPuzzle.date}.`);
        await loadVideoFromPuzzle(fallbackPuzzle);
      } else {
        alert("No daily puzzles available.");
      }
      return;
    }
    
    console.log('Found puzzle:', puzzle); // Debug log
    await loadVideoFromPuzzle(puzzle);
    
  } catch (error) {
    console.error("Error loading video data:", error);
    alert("Error loading puzzle data. Please check the console for details.");
  }
}

async function loadVideoFromPuzzle(puzzle) {
  const videoIdKey = `video${currentPuzzle}Id`;
  const videoId = puzzle[videoIdKey];
  
  console.log('Video ID key:', videoIdKey, 'Video ID:', videoId); // Debug log
  
  if (!videoId) {
    console.error(`No video ID found for ${videoIdKey}`);
    alert(`There is no puzzle video ${currentPuzzle} for this date.`);
    return;
  }
  
  await loadVideoInfo(videoId);
}

async function loadVideoInfo(videoId) {
  console.log('Loading video info for:', videoId); // Debug log
  
  const cacheKey = `video${currentPuzzle}_${videoId}`;
  let cached = localStorage.getItem(cacheKey);
  let videoInfo;
  
  if (cached) {
    videoInfo = JSON.parse(cached);
    console.log(`Loaded video ${currentPuzzle} from cache:`, videoInfo);
  } else {
    console.log('Fetching from YouTube API...'); // Debug log
    
    const apiURL = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
    const response = await fetch(apiURL);
    const videoData = await response.json();
    
    console.log('YouTube API response:', videoData); // Debug log
    
    const item = videoData.items[0];
    
    if (!item) {
      console.error(`Video ${currentPuzzle} not found in API response`);
      alert(`Video ${currentPuzzle} not found.`);
      return;
    }
    
    videoInfo = {
      title: item.snippet.title,
      views: item.statistics.viewCount,
      uploadDate: item.snippet.publishedAt.slice(0, 10),
      channelId: item.snippet.channelId
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(videoInfo));
    console.log(`Fetched and cached video ${currentPuzzle}:`, videoInfo);
  }
  
  // Display video info
  console.log('Setting video info in DOM...'); // Debug log
  
  const titleEl = document.getElementById("video-title");
  const viewsEl = document.getElementById("view-count");
  const thumbnailEl = document.getElementById("thumbnail");
  const actualDateEl = document.getElementById("actual-date");
  
  if (titleEl) titleEl.textContent = videoInfo.title;
  if (viewsEl) viewsEl.textContent = `${Number(videoInfo.views).toLocaleString()} views`;
  if (thumbnailEl) thumbnailEl.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  if (actualDateEl) actualDateEl.value = videoInfo.uploadDate;
  
  console.log('Video info set in DOM'); // Debug log
  
  // Load channel info
  await loadChannelInfo(videoId);
}

async function loadChannelInfo(videoId) {
  try {
    const noembedURL = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const noembedRes = await fetch(noembedURL);
    const noembedData = await noembedRes.json();
    
    const channelTitle = noembedData.author_name || "Channel name unavailable";
    const channelURL = noembedData.author_url || "#";
    
    document.getElementById("channel-name").textContent = channelTitle;
    if (document.getElementById("channel-name").tagName === 'A') {
      document.getElementById("channel-name").href = channelURL;
    }
    
    const fallbackIcon = `https://www.google.com/s2/favicons?sz=64&domain_url=${channelURL}`;
    document.getElementById("channel-icon").src = fallbackIcon;
    
  } catch (error) {
    console.error("Error loading channel info:", error);
    document.getElementById("channel-name").textContent = "Channel name unavailable";
    document.getElementById("channel-icon").src = "https://www.google.com/s2/favicons?sz=64&domain_url=";
  }
}

function showNextPuzzleButton() {
  if (document.getElementById("next-puzzle-button")) return;
  
  const config = PUZZLE_CONFIG[currentPuzzle];
  const nextButton = document.createElement("button");
  nextButton.id = "next-puzzle-button";
  nextButton.textContent = config.nextText;
  nextButton.style.display = "block";
  nextButton.style.margin = "20px auto 0";
  nextButton.style.padding = "10px 18px";
  nextButton.style.fontSize = "1em";
  nextButton.style.cursor = "pointer";
  
  nextButton.onclick = () => {
    // Save progress before moving to next page
    const nextPuzzle = currentPuzzle + 1;
    if (nextPuzzle <= 5) {
      saveProgress(nextPuzzle);
    } else {
      // Completed all puzzles
      saveProgress(6); // 6 indicates completed
    }
    
    // Prevent going back
    window.location.replace(config.nextPage);
  };
  
  document.getElementById("submit-button").insertAdjacentElement("afterend", nextButton);
}

function getBackgroundColor(guessVal, actualVal) {
  guessVal = Number(guessVal);
  actualVal = Number(actualVal);
  if (guessVal === actualVal) {
    return "#6aaa64"; // green
  } else if (Math.abs(guessVal - actualVal) <= 2) {
    return "#D7B300"; // yellow
  }
  return null;
}

function createGuessHistoryEntry(guess, actual) {
  const [year, month, day] = guess.split("-");
  const [actualYear, actualMonth, actualDay] = actual.split("-");
  
  const listItem = document.createElement("li");
  listItem.classList.add("guess-entry");
  
  // Month
  const monthDiv = document.createElement("div");
  monthDiv.textContent = Number(month);
  monthDiv.classList.add("guess-part");
  const monthColor = getBackgroundColor(month, actualMonth);
  if (monthColor) {
    monthDiv.style.backgroundColor = monthColor;
    monthDiv.style.color = "white";
    monthDiv.style.borderRadius = "4px";
  }
  
  // Day
  const dayDiv = document.createElement("div");
  dayDiv.textContent = Number(day);
  dayDiv.classList.add("guess-part");
  const dayColor = getBackgroundColor(day, actualDay);
  if (dayColor) {
    dayDiv.style.backgroundColor = dayColor;
    dayDiv.style.color = "white";
    dayDiv.style.borderRadius = "4px";
  }
  
  // Year
  const yearDiv = document.createElement("div");
  yearDiv.textContent = year;
  yearDiv.classList.add("guess-part");
  const yearColor = getBackgroundColor(year, actualYear);
  if (yearColor) {
    yearDiv.style.backgroundColor = yearColor;
    yearDiv.style.color = "white";
    yearDiv.style.borderRadius = "4px";
  }
  
  listItem.appendChild(monthDiv);
  listItem.appendChild(dayDiv);
  listItem.appendChild(yearDiv);
  
  return listItem;
}

function checkGuess() {
  const guess = document.getElementById("guess").value;
  const actual = document.getElementById("actual-date").value;
  const feedback = document.getElementById("feedback");
  const historyList = document.getElementById("guess-history");
  const submitBtn = document.getElementById("submit-button");
  const guessInput = document.getElementById("guess");
  
  if (!guess) {
    feedback.textContent = "Please enter a date.";
    feedback.style.color = "red";
    return;
  }
  
  if (guessCount >= maxGuesses) {
    const [year, month, day] = actual.split("-");
    const formattedDate = `${Number(month)}/${Number(day)}/${year}`;
    feedback.textContent = `No more guesses allowed. The correct date was ${formattedDate}.`;
    feedback.style.color = "red";
    submitBtn.style.display = "none";
    guessInput.disabled = true;
    showNextPuzzleButton();
    return;
  }
  
  guessCount++;
  
  // Add guess to history
  const listItem = createGuessHistoryEntry(guess, actual);
  historyList.prepend(listItem);
  
  const [actualYear, actualMonth, actualDay] = actual.split("-");
  const formattedDate = `${Number(actualMonth)}/${Number(actualDay)}/${actualYear}`;
  
  if (guess === actual) {
    localStorage.setItem(`puzzle${currentPuzzle}_correct`, "true");
    feedback.textContent = "Correct! 🎉";
    feedback.style.color = "green";
    submitBtn.style.display = "none";
    guessInput.disabled = true;
    showNextPuzzleButton();
  } else if (guessCount === maxGuesses) {
    localStorage.setItem(`puzzle${currentPuzzle}_correct`, "false");
    feedback.textContent = `Incorrect. You've used all your guesses. The correct date was ${formattedDate}.`;
    feedback.style.color = "red";
    submitBtn.style.display = "none";
    guessInput.disabled = true;
    showNextPuzzleButton();
  } else {
    feedback.textContent = `${maxGuesses - guessCount} guesses remaining.`;
    feedback.style.color = "red";
  }
}
