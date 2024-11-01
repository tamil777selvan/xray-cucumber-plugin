import { vi, describe, it, expect } from 'vitest';

import { readdir, stat } from 'node:fs/promises';

import { getAllFilesInDir } from '../../src/utils/files.js';

vi.mock('fs/promises', () => ({
    readdir: vi.fn().mockResolvedValue(['file1.txt', 'file2.txt', 'file1.js', 'file1.json']),
    stat: vi.fn().mockResolvedValue({ isDirectory: () => false, isFile: () => true })
}));

describe('getAllFilesInDir', () => {
    it('should list all files with the specified extension in the directory', async () => {
        const dirPath = '/path/to/directory';
        const extension = '.txt';

        const files = await getAllFilesInDir(dirPath, extension);

        expect(readdir).toHaveBeenCalledWith(dirPath);

        expect(stat).toHaveBeenCalledWith('/path/to/directory/file1.txt');
        expect(stat).toHaveBeenCalledWith('/path/to/directory/file2.txt');

        expect(files).toEqual(['/path/to/directory/file1.txt', '/path/to/directory/file2.txt']);
    });

    it('should handle different file extensions', async () => {
        const dirPath = '/path/to/directory';
        const extension1 = '.js';
        const extension2 = '.json';

        const files1 = await getAllFilesInDir(dirPath, extension1);
        const files2 = await getAllFilesInDir(dirPath, extension2);

        expect(files1).toEqual(['/path/to/directory/file1.js']);
        expect(files2).toEqual(['/path/to/directory/file1.json']);
    });

    it('should return an empty array if specified extension file is not present in the directory', async () => {
        const dirPath = '/empty-directory';
        const extension = '.log';
        vi.importActual('fs/promises');
        const files = await getAllFilesInDir(dirPath, extension);
        expect(files).toEqual([]);
    });
});
