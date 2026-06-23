import fs from "fs/promises";
import path from "path";

export const deleteFile = async (filePath) => {
  if (!filePath) return;

  try {
    const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ""));
    await fs.unlink(fullPath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to delete file:", filePath, err.message);
    }
  }
};

export const deleteFiles = async (filePaths = []) => {
  await Promise.all(filePaths.map((filePath) => deleteFile(filePath)));
};

export const buildUploadPath = (folder, filename) => `/uploads/${folder}/${filename}`;
