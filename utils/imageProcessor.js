const sharp = require('sharp');
const path = require('path');

const processImage = async (filePath) => {
  try {
    const optimizedPath = filePath.replace(path.extname(filePath), '-optimized.jpg');

    await sharp(filePath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(optimizedPath);

    // Do NOT delete the original
    return optimizedPath.replace('public/', '');
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

module.exports = { processImage };
