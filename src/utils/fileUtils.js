const fs = require('fs');

async function loadJsonFile(filePath) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return {};
	}
	const content = await fs.readFile(filePath, 'utf8');
	return JSON.parse(content);
}

function loadJsonFileSync(filePath) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return {};
	}
	const content = fs.readFileSync(filePath, 'utf8');
	return JSON.parse(content);
}

async function writeJsonFile(filePath, jsonData) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return;
	}
	const jsonString = JSON.stringify(jsonData, null, 2);
	await fs.writeFile(filePath, jsonString, 'utf-8')
}

function writeJsonFileSync(filePath , jsonData) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return;
	}
	const jsonString = JSON.stringify(jsonData, null, 2);
	fs.writeFileSync (filePath, jsonString, 'utf-8')
}
module.exports = {
	loadJsonFile,
	loadJsonFileSync,
	writeJsonFile,
	writeJsonFileSync
};

