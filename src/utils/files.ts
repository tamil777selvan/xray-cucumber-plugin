import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * Recursively retrieves all files with a specific extension from a directory and its subdirectories.
 *
 * @param {string} dirPath - The path to the directory.
 * @param {string} extension - The file extension to filter by (e.g., '.feature').
 * @returns {Promise<string[]>} A promise that resolves to an array of file paths matching the extension.
 */
export const getAllFilesInDir = async (dirPath: string, extension: string): Promise<string[]> => {
    try {
        const files = await readdir(path.resolve(dirPath));
        const filePromises = files.map(async (file: string) => {
            const filePath = path.join(dirPath, file);
            const fileStat = await stat(filePath);
            if (fileStat.isDirectory()) {
                return getAllFilesInDir(filePath, extension);
            } else if (fileStat.isFile() && file.endsWith(extension)) {
                return [filePath];
            }
            return [];
        });

        const allFilesArrays = await Promise.all(filePromises);
        return allFilesArrays.flat();
    } catch (error) {
        throw new Error(`Error while retrieving files in directory: ${error.message}`);
    }
};
