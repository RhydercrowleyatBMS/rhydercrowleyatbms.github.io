const scenes = {
  start: {
    text: "You wake up in a hallway that looks almost exactly like your school. Same lockers, same ugly paint. No doors. No people. Just a long corridor in both directions.",
    choices: [
      { label: "walk left", next: "left1" },
      { label: "walk right", next: "right1" },
      { label: "stay where you are", next: "stay1" }
    ]
  },
  left1: {
    text: "You walk left. After a minute, you recognize a scratch on the wall that you’ve definitely seen before. Did you just loop?",
    choices: [
      { label: "keep walking", next: "loop1" },
      { label: "turn around", next: "right1" }
    ]
  },
  right1: {
    text: "You walk right. There’s a faint humming, like fluorescent lights, but you can’t find where it’s coming from.",
    choices: [
      { label: "call out 'hello?'", next: "voice1" },
      { label: "ignore it and keep walking", next: "loop2" }
    ]
  },
  stay1: {
    text: "You stay still. The lights buzz. Nothing happens. Which is almost worse than something happening.",
    choices: [
      { label: "sit down", next: "sit1" },
      { label: "pick a direction already", next: "start" }
    ]
  },
  loop1: {
    text: "You’re definitely looping. The same scratch, the same flicker in the light above you. The corridor does not care which direction you choose.",
    choices: [
      { label: "walk faster", next: "run1" },
      { label: "stop and listen", next: "listen1" }
    ]
  },
  loop2: {
    text: "You keep walking. The humming gets a little louder, but the hallway never ends. You’re not tired, which is strange. How long have you been here?",
    choices: [
      { label: "look at your hands", next: "hands1" },
      { label: "turn around", next: "left1" }
    ]
  },
  voice1: {
    text: "You call out. The humming stops. In the silence, you hear your own voice echo back, but a tiny bit delayed. Too delayed.",
    choices: [
      { label: "call again", next: "voice2" },
      { label: "walk away quickly", next: "run1" }
    ]
  },
  sit1: {
    text: "You sit on the cold floor. It feels real. Your phone isn’t in your pocket. You don’t remember if it ever was.",
    choices: [
      { label: "stand up", next: "start" },
      { label: "close your eyes", next: "end_wake" }
    ]
  },
  run1: {
    text: "You start running. The lights blur into one long line. For a second, it looks more like a loading bar than a hallway.",
    choices: [
      { label: "keep running", next: "end_run" },
      { label: "stop abruptly", next: "listen1" }
    ]
  },
  listen1: {
    text: "You stand perfectly still. No humming. No footsteps. But you get the horrible feeling that something else has finally stopped moving too.",
    choices: [
      { label: "whisper 'is someone there?'", next: "voice2" },
      { label: "pretend you didn’t notice", next: "end_ignore" }
    ]
  },
  hands1: {
    text: "You look at your hands. They look normal, but the longer you stare, the less you recognize them. Like you’re just borrowing this body for a bit.",
    choices: [
      { label: "keep walking", next: "loop2" },
      { label: "close your eyes", next: "end_wake" }
    ]
  },
  voice2: {
    text: "This time when you call out, the echo answers a tiny bit too fast. Like it was waiting.",
    choices: [
      { label: "ask 'where are you?'", next: "end_close" },
      { label: "run without looking back", next: "end_run" }
    ]
  },
  end_run: {
    text: "You run until the hallway glitches into a smear of light and shadow. When you blink, you’re back in your room, staring at a screen that says 'connection lost'.",
    choices: [
      { label: "play again", next: "start" }
    ]
  },
  end_wake: {
    text: "You close your eyes and decide this is a dream. When you open them, you’re in class, half the room glowing blue from their phones. The hallway was quieter.",
    choices: [
      { label: "play again", next: "start" }
    ]
  },
  end_ignore: {
    text: "You decide not to acknowledge whatever else stopped moving. That’s fine. If you don’t look at it, it can’t look back. Probably.",
    choices: [
      { label: "play again", next: "start" }
    ]
  },
  end_close: {
    text: "You ask where it is. The answer arrives instantly, in your own voice, spoken directly next to your ear. You wake up with your headphones still on.",
    choices: [
      { label: "play again", next: "start" }
    ]
  }
};

const storyEl = document.getElementById("story");
const choicesEl = document.getElementById("choices");

function renderScene(id) {
  const scene = scenes[id];
  if (!scene) return;
  storyEl.textContent = scene.text;
  choicesEl.innerHTML = "";
  scene.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "btn game-btn";
    btn.textContent = choice.label;
    btn.addEventListener("click", () => renderScene(choice.next));
    choicesEl.appendChild(btn);
  });
}

renderScene("start");
