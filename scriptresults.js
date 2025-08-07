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

function fetchAndSetTitle(videoId, titleId, iconId, puzzleNum) {
  const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
  fetch(noembedUrl)
    .then(res => res.json())
    .then(data => {
      const el = document.getElementById(titleId);
      if (el && data.title) {
        el.textContent = data.title;
      } else {
        el.textContent = "(Title not found)";
      }

      const icon = document.getElementById(iconId);
      const result = localStorage.getItem(`puzzle${puzzleNum}_correct`);
      if (icon) {
        if (result === "true") {
          icon.textContent = "✅";
        } else if (result === "false") {
          icon.textContent = "❌";
        } else {
          icon.textContent = "";
        }
      }
    })
    .catch(error => {
      console.error(`Error fetching title for ${titleId}:`, error);
      const el = document.getElementById(titleId);
      if (el) {
        el.textContent = "(Title not found)";
      }
    });
}

// Main function to load today's puzzle data and display results
async function loadTodaysResults() {
  try {
    const response = await fetch('videos.json');
    const data = await response.json();
    
    const today = await getTodayInCentralTime();
    console.log('Today\'s date (Central Time):', today);
    
    const todaysPuzzle = data.find(entry => entry.date === today);
    
    if (!todaysPuzzle) {
      console.error('No puzzle found for today:', today);
      console.log('Available dates:', data.map(entry => entry.date));
      
      // Fallback: use the most recent available date
      const sortedDates = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      const fallbackPuzzle = sortedDates[0];
      
      if (fallbackPuzzle) {
        console.log('Using fallback puzzle for date:', fallbackPuzzle.date);
        displayPuzzleResults(fallbackPuzzle);
      } else {
        console.error('No puzzle data available');
      }
      return;
    }
    
    console.log('Found today\'s puzzle:', todaysPuzzle);
    displayPuzzleResults(todaysPuzzle);
    
  } catch (error) {
    console.error('Error loading videos.json:', error);
  }
}

function displayPuzzleResults(puzzleData) {
  if (puzzleData) {
    fetchAndSetTitle(puzzleData.video1Id, 'title1', 'icon1', 1);
    fetchAndSetTitle(puzzleData.video2Id, 'title2', 'icon2', 2);
    fetchAndSetTitle(puzzleData.video3Id, 'title3', 'icon3', 3);
    fetchAndSetTitle(puzzleData.video4Id, 'title4', 'icon4', 4);
    fetchAndSetTitle(puzzleData.video5Id, 'title5', 'icon5', 5);
  } else {
    console.error('No puzzle data provided to displayPuzzleResults');
  }
}

// Calculate and display total correct answers
function updateScoreSummary() {
  let score = 0;
  for (let i = 1; i <= 5; i++) {
    if (localStorage.getItem(`puzzle${i}_correct`) === 'true') {
      score++;
    }
  }

  const scoreSummary = document.getElementById('score-summary');
  if (scoreSummary) {
    scoreSummary.textContent = `You scored ${score}/5!`;
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadTodaysResults();
  updateScoreSummary();
});