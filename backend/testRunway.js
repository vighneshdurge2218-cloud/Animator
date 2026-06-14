import RunwayML from '@runwayml/sdk';

const client = new RunwayML({
  apiKey: "key_7196bd95a14586e2669fd4fa502f1a7c67c10c7778d1fe632fc075ac32c9cf2ad4acf1e3ed7c3fa4cf272c67491f04462ca66c9aa51948499f36fe3205458d51"
});

async function main() {
  try {
    console.log("Submitting image-to-video request to Runway...");
    // A sample image URL
    const image = await client.imageToVideo.create({
      model: 'gen3a_turbo',
      promptImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1024',
      promptText: 'A beautiful sunny day, clouds moving slightly'
    });
    console.log("Success! Task created:");
    console.log(image);
  } catch (err) {
    console.error("Runway API Error:", err.message);
  }
}
main();
