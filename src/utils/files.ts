import fs from 'node:fs/promises';
import path from 'node:path';

export const getAllFilesInDir = async (dirPath: string, extension: string) => {
    let allFiles: string[] = [];
    const files = await fs.readdir(path.resolve(dirPath));
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStat = await fs.stat(filePath);
        if (fileStat.isDirectory()) {
            const dirFiles = await getAllFilesInDir(filePath, extension);
            allFiles = [...allFiles, ...dirFiles];
        } else if (fileStat.isFile() && file.endsWith(extension)) {
            allFiles.push(filePath);
        }
    }
    return allFiles;
};