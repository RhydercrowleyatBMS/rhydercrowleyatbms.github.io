const questions = [
  {
    text: "First things first: are you actually alone right now?",
    options: ["yes", "no"]
  },
  {
    text: "Is the room you’re in completely dark?",
    options: ["mostly", "no", "kind of"]
  },
  {
    text: "How many doors are in the room with you?",
    options: ["0–1", "2–3", "4 or more"]
  },
  {
    text: "Are all of those doors fully closed?",
    options: ["yes", "no", "i'm not sure"]
  },
  {
    text: "If someone quietly opened one of those doors, would you hear it?",
    options: ["definitely", "probably", "honestly… maybe not"]
  },
  {
    text: "Have you felt like you were being watched at any point today?",
    options: ["yes", "no", "not until right now"]
  },
  {
    text: "Is there a mirror, window, or dark screen behind you?",
    options: ["yes", "no", "i don't want to check"]
  },
  {
    text: "When was the last time you checked behind you?",
    options: ["a few seconds ago", "a few minutes ago", "i can't remember"]
  },
  {
    text: "If your device suddenly went black, what’s the first thing you’d do?",
    options: ["look around the room", "grab my phone", "freeze"]
  },
  {
    text: "Do you know for sure that every sound in your house has a normal explanation?",
    options: ["yes", "i think so", "no"]
  },
  {
    text: "If someone else was quietly in the room with you right now… would you want to know?",
    options: ["yes", "no", "i'm not sure"]
  }
];

let currentIndex = 0;

const questionText = document.getElementById("question-text");
const answerButtons = document.getElementById("answer-buttons");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const restartBtn = document.getElementById("restart-btn");

function renderQuestion() {
  const q = questions[currentIndex];
  questionText.textContent = q.text;
  answerButtons.innerHTML = "";

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "btn game-btn";
    btn.addEventListener("click", () => nextQuestion());
    answerButtons.appendChild(btn);
  });

  const pct = (currentIndex / questions.length) * 100;
  progressFill.style.width = `${pct}%`;
  progressLabel.textContent = `${currentIndex}/${questions.length}`;
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) {
    finishGame();
  } else {
    renderQuestion();
  }
}

function finishGame() {
  answerButtons.innerHTML = "";
  questionText.textContent =
    "thanks for playing. if you suddenly feel like checking behind you, that’s normal. probably.";

  progressFill.style.width = "100%";
  progressLabel.textContent = `${questions.length}/${questions.length}`;
  restartBtn.style.display = "inline-flex";
}

restartBtn.addEventListener("click", () => {
  currentIndex = 0;
  restartBtn.style.display = "none";
  renderQuestion();
});

// start
renderQuestion();
