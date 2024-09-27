import * as fs from 'fs';

export async function loadJsonFile(filePath: string) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return {};
	}
	const content = fs.readFile(filePath, "utf8", (err, data) => {
		if (err) {
      console.error(err);
      return {};
    }
    return JSON.parse(data);
  });
}

export function loadJsonFileSync(filePath: string) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return {};
	}
	const content = fs.readFileSync(filePath, 'utf8');
	return JSON.parse(content);
}

export async function writeJsonFile(filePath: string, jsonData: object) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return;
	}
	const jsonString = JSON.stringify(jsonData, null, 2);
	// await fs.writeFile(filePath, jsonString, 'utf-8')
	fs.writeFile(filePath, jsonString, 'utf-8', (err) => {
		if (err) {
			console.error(err);
		}
	});
}

export function writeJsonFileSync(filePath: string, jsonData: object) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return;
	}
	const jsonString = JSON.stringify(jsonData, null, 2);
	fs.writeFileSync(filePath, jsonString, 'utf-8')
}

