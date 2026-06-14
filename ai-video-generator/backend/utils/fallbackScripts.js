export function getFallbackScripts(topic) {
  const t = Date.now();
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  const titles = [
    `The Hidden Tale of ${topic}`,
    `${topic}: A Journey Unseen`,
    `Unlocking Secrets of ${topic}`,
    `${topic} Through a New Lens`,
    `Why ${topic} Matters Today`,
    `The Untold Story of ${topic}`,
    `Echoes of ${topic}`,
    `Beyond the Surface: ${topic}`
  ];

  const styles = [
    "Cinematic Drama",
    "Fast-Paced Documentary",
    "First-Person Narrative",
    "Satirical Comedy",
    "Epic Battle",
    "Retrospective Memoir",
    "Futuristic Sci-Fi",
    "Noir Mystery"
  ];

  const openers = [
    `Have you ever wondered about the true nature of ${topic}?`,
    `In a world constantly changing, ${topic} remains a profound mystery.`,
    `They said it was impossible to understand ${topic}, but they were wrong.`,
    `Imagine waking up to find ${topic} right at your doorstep.`,
    `The history of ${topic} is written in the shadows of time.`,
    `Every great story starts with a single spark. For us, that spark is ${topic}.`
  ];

  const middleActions = [
    `Suddenly, the environment shifts, revealing the core of ${topic}.`,
    `We journey deeper, discovering elements of ${topic} no one has seen before.`,
    `The tension builds as ${topic} begins to transform everything around it.`,
    `Against all odds, the truth about ${topic} finally comes to light.`,
    `Watch closely as ${topic} unravels the very fabric of reality.`,
    `A surprising twist shows us that ${topic} is more than just a concept.`
  ];

  const climaxes = [
    `This is the moment of truth for ${topic}. Everything hangs in the balance.`,
    `With breathtaking scale, ${topic} reaches its ultimate peak.`,
    `The clash of forces brings ${topic} into crystal clear focus.`,
    `A sudden realization dawns: ${topic} has changed our perspective forever.`,
    `Explosive energy surrounds ${topic}, leaving a lasting impact.`,
    `In a quiet but powerful shift, ${topic} proves its true worth.`
  ];

  const resolutions = [
    `And so, the legacy of ${topic} continues to echo through time.`,
    `We are left with more questions than answers about ${topic}.`,
    `This is not the end of ${topic}, but merely the beginning.`,
    `Ultimately, ${topic} reminds us of our own journey.`,
    `The future of ${topic} is in our hands. What will you do next?`,
    `Never forget the power and beauty hidden within ${topic}.`
  ];

  const visualSubjects = ["the main subject", "a sweeping landscape", "a dramatic close-up", "a bustling scene", "a quiet, lonely figure", "abstract shapes representing the core idea"];
  const lightings = ["dramatic shadows", "bright, ethereal light", "neon glows", "warm golden hour lighting", "cold, cinematic blue tones", "harsh, gritty lighting"];
  const movements = ["slow pan", "rapid zoom", "smooth tracking shot", "drone flyover", "unsteady handheld camera", "timelapse"];

  const makeScene = (num, narrativeArc) => {
    return {
      sceneNumber: num,
      narration: narrativeArc[num - 1],
      visualPrompt: `Cinematic visual: ${rand(visualSubjects)}, ${rand(lightings)}, ${rand(movements)}. The scene perfectly captures the mood of ${topic}.`
    };
  };

  const createScript = (idx) => {
    // Build a coherent narrative arc for 5 scenes
    const narrativeArc = [
      rand(openers),
      rand(middleActions),
      rand(middleActions), // double the middle action for scene 3
      rand(climaxes),
      rand(resolutions)
    ];

    return {
      id: `script_${idx}_${t}`,
      title: rand(titles),
      style: rand(styles),
      duration: "15 seconds",
      scenes: Array.from({ length: 5 }, (_, i) => makeScene(i + 1, narrativeArc))
    };
  };

  return {
    scripts: [createScript(1), createScript(2), createScript(3)]
  };
}
