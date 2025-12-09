const clickBtn = document.getElementById("click-btn");
const countEl = document.getElementById("click-count");
const statusEl = document.getElementById("click-status");
const fillEl = document.getElementById("click-fill");

let count = 0;
let meter = 70; // 0–100

function updateUI() {
  countEl.textContent = count.toString();
  fillEl.style.width = meter + "%";

  if (meter >= 80) {
    statusEl.textContent = "you’re weirdly calm for someone playing a panic game.";
  } else if (meter >= 50) {
    statusEl.textContent = "you’re fine. probably.";
  } else if (meter >= 25) {
    statusEl.textContent = "heart rate increasing. that’s normal. right?";
  } else if (meter > 0) {
    statusEl.textContent = "you should click. like, now.";
  } else {
    statusEl.textContent = "the thoughts won this round. keep clicking next time.";
  }
}

clickBtn.addEventListener("click", () => {
  count++;
  meter = Math.min(100, meter + 8);
  updateUI();
});

setInterval(() => {
  meter = Math.max(0, meter - 2);
  updateUI();
}, 700);

updateUI();
