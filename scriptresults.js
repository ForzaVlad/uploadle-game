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
    });
}

fetch('videos.json')
  .then(res => res.json())
  .then(data => {
    const dayData = data[0];
    if (dayData) {
      fetchAndSetTitle(dayData.video1Id, 'title1', 'icon1', 1);
      fetchAndSetTitle(dayData.video2Id, 'title2', 'icon2', 2);
      fetchAndSetTitle(dayData.video3Id, 'title3', 'icon3', 3);
      fetchAndSetTitle(dayData.video4Id, 'title4', 'icon4', 4);
      fetchAndSetTitle(dayData.video5Id, 'title5', 'icon5', 5);
    } else {
      console.error('videos.json format is incorrect or empty');
    }
  })
  .catch(error => {
    console.error('Error loading videos.json:', error);
  });

// Calculate and display total correct answers
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
