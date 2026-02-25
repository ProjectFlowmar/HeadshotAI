const { fal } = require('@fal-ai/client');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

// Configure fal.ai
fal.config({ credentials: config.fal.key });

/**
 * Generate headshots for a given selfie using fal-ai/flux-subject.
 * @param {string} imageUrl - URL or base64 data URI of the user's selfie
 * @param {string[]} styleCategories - Categories to generate (or 'all')
 * @param {number} maxImages - Maximum headshots to generate
 * @returns {Promise<Array<{id, url, category, style}>>}
 */
async function generateHeadshots(imageUrl, styleCategories, maxImages = 20) {
  // Filter styles based on package
  let styles = config.styles;
  if (styleCategories !== 'all' && Array.isArray(styleCategories)) {
    styles = styles.filter(s => styleCategories.includes(s.category));
  }

  // Calculate how many per style to hit maxImages
  const perStyle = Math.max(1, Math.ceil(maxImages / styles.length));
  const totalToGenerate = Math.min(styles.length * perStyle, maxImages);

  // Select styles, repeating if needed
  const selectedStyles = [];
  let count = 0;
  for (const style of styles) {
    for (let i = 0; i < perStyle && count < maxImages; i++) {
      selectedStyles.push(style);
      count++;
    }
  }

  console.log(`[AI] Generating ${selectedStyles.length} headshots across ${styles.length} styles`);

  // Generate in parallel batches of 4
  const results = [];
  const batchSize = 4;

  for (let i = 0; i < selectedStyles.length; i += batchSize) {
    const batch = selectedStyles.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (style) => {
        try {
          const result = await fal.subscribe('fal-ai/flux-subject', {
            input: {
              prompt: style.prompt,
              image_url: imageUrl,
              num_images: 1,
              image_size: 'square_hd', // 1024x1024
              num_inference_steps: 28,
              guidance_scale: 3.5,
            },
            logs: false,
          });

          if (result.data && result.data.images && result.data.images.length > 0) {
            return {
              id: uuid(),
              url: result.data.images[0].url,
              category: style.category,
              styleId: style.id,
            };
          }
          return null;
        } catch (err) {
          console.error(`[AI] Error generating ${style.id}:`, err.message);
          return null;
        }
      })
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) {
        results.push(r.value);
      }
    }

    console.log(`[AI] Batch ${Math.floor(i / batchSize) + 1}: ${results.length}/${selectedStyles.length} completed`);
  }

  return results;
}

/**
 * Download generated images to local results directory.
 */
async function downloadResults(orderId, images) {
  const orderDir = path.join(__dirname, '..', 'results', orderId);
  if (!fs.existsSync(orderDir)) fs.mkdirSync(orderDir, { recursive: true });

  const downloaded = [];
  for (const img of images) {
    try {
      const response = await fetch(img.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = `${img.category.toLowerCase()}-${img.id.slice(0, 8)}.jpg`;
      const filepath = path.join(orderDir, filename);
      fs.writeFileSync(filepath, buffer);
      downloaded.push({ ...img, localPath: filepath, filename });
    } catch (err) {
      console.error(`[AI] Download error for ${img.id}:`, err.message);
    }
  }
  return downloaded;
}

module.exports = { generateHeadshots, downloadResults };
