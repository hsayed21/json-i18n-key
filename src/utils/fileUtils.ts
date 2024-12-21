import * as fs from 'fs';
import * as vscode from 'vscode';

export function loadJsonFileSync(filePath: string, preserveFormatting: boolean = false) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return preserveFormatting ? '' : {};
	}

	if (!fs.existsSync(filePath)) {
		vscode.window.showErrorMessage(`File does not exist: ${filePath}`);
		return null;
	}

	const content = fs.readFileSync(filePath, 'utf8');
	return preserveFormatting ? content : JSON.parse(content);
}

export function writeJsonFileSync(filePath: string, jsonData: string, preserveFormatting: boolean = false): void {
	if (filePath === undefined || filePath === null || filePath === '') {
		return;
	}

	if (!fs.existsSync(filePath)) {
		vscode.window.showErrorMessage(`File does not exist: ${filePath}`);
		return;
	}

	const jsonString = preserveFormatting ? jsonData : JSON.stringify(jsonData, null, 2);
	fs.writeFileSync(filePath, jsonString, 'utf-8')
}

