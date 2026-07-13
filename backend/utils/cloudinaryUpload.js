const cloudinary = require('../config/cloudinary');

/**
 * Uploads a single in-memory file buffer (from multer.memoryStorage())
 * to Cloudinary via a stream, avoiding a temp file on disk entirely.
 */
const uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const uploadMany = (files, folder) => Promise.all(files.map((f) => uploadBuffer(f.buffer, folder)));

const deleteByPublicId = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`Cloudinary delete failed for ${publicId}: ${err.message}`);
  }
};

module.exports = { uploadBuffer, uploadMany, deleteByPublicId };
