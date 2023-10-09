import { copyFile } from 'fs';
import { join } from 'path';

function copyPackageFile() {
	const sourceFile = join('src', 'cjs', 'package.json');
	const destinationFile = join('dist', 'cjs', 'package.json');

	copyFile(sourceFile, destinationFile, (error) => {
		if (error) {
			console.error(`Error copying ${sourceFile} to ${destinationFile}:`, error);
			process.exit(1);
		} else {
			console.log(`${sourceFile} copied successfully to ${destinationFile}`);
		}
	});
}

copyPackageFile();
