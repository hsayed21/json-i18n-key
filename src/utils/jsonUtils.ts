import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { JsonObject } from '../models/jsonObject';
import * as vscode from 'vscode';
import { loadJsonFileSync } from './fileUtils';
import { JSONPath } from 'jsonpath-plus';
import { printChannelOutput } from '../extension';

export function checkExistKey(jsonFilePath: string, keyPath: string): boolean {
	const jsonData = loadJsonFileSync(jsonFilePath, false);
	return JSONPath({ json: jsonData, path: keyPath }).length > 0;
}

export function getKeyValue(jsonFilePath: string, keyPath: string): string {
	const jsonData = loadJsonFileSync(jsonFilePath, false);
	const values = JSONPath({ json: jsonData, path: keyPath });
	return values.length > 0 ? values[0] : '';
}

export function getKeysValues(keyPath: string): string[] {
	if (JsonI18nKeySettings.instance.enJsonFilePath === '') {
		printChannelOutput('English translation file not found');
		return [];
	}
	const jsonData = loadJsonFileSync(JsonI18nKeySettings.instance.enJsonFilePath);
	// const parentKey = keyPath.split('.').slice(0, -1).join('.');
	const keys = keyPath.split('.');
	const lastKey = keys.pop() as string;
	const result = JSONPath({
		path: `$.${keys.join('.')}[?(@property.match(/^${lastKey}/i))]`,
		json: jsonData,
		resultType: 'all'
	});

	return result;
}

export function getHoverTranslation(keyPath: string): vscode.MarkdownString {
	const hoverMessage = new vscode.MarkdownString();
	hoverMessage.appendMarkdown(`**Key:** \`${keyPath}\`\n\n`);
	for (const translationFile of JsonI18nKeySettings.instance.translationFiles) {
		if (translationFile.filePath) {
			const keyValue = getKeyValue(translationFile.filePath, keyPath);
			hoverMessage.appendMarkdown(`**${translationFile.lang.toUpperCase()}:** ${keyValue || 'N/A'}\n\n`);
		}
	}
	return hoverMessage;
}

export function findKeyPosition(editor: vscode.TextEditor, path: string): vscode.Position | null {
	const document = editor.document;
	const keys = path.split('.');
	const regexPatterns = keys.map((key, index) => {
		let regexString: string;
		if (document.languageId === 'json') {
			regexString = `\\"${key}\\"\\s*:\\s*`;
		} else {
			regexString = index === keys.length - 1 ? `\\b${key}\\b\\s*:\\s*` : `\\b${key}\\b\\s*:`;
		}
		return new RegExp(regexString);
	});

	let currentLevel = 0;
	for (let i = 0; i < document.lineCount; i++) {
		const lineText = document.lineAt(i).text;
		if (currentLevel < keys.length - 1) {
			if (regexPatterns[currentLevel].test(lineText)) {
				currentLevel++;
			}
		} else {
			const finalKeyRegex = regexPatterns[currentLevel];
			const match = finalKeyRegex.exec(lineText);
			if (match) {
				return new vscode.Position(i, match.index);
			}
		}
	}
	return null;
}

export function getOrCreateParentObject(jsonData: JsonObject, keyPath: string): JsonObject {
	const keys = keyPath.split('.');
	keys.pop(); // Remove the last key as it's the key to be added.

	let parent: JsonObject = jsonData;

	for (const key of keys) {
		if (!isJsonObject(parent[key])) {
			parent[key] = {}; // Create an intermediate object if it doesn't exist
		}
		parent = parent[key] as JsonObject;
	}

	return parent;
}

export function isJsonObject(obj: unknown): obj is JsonObject {
	return obj !== null && typeof obj === 'object';
}

export function loadKeys() {
	if (JsonI18nKeySettings.instance.enJsonFilePath === '') {
		printChannelOutput('English translation file not found');
		return [];
	}

	return flattenKeys(loadJsonFileSync(JsonI18nKeySettings.instance.enJsonFilePath));
}

function flattenKeys(obj: any, prefix = ''): string[] {
	return Object.keys(obj).reduce((acc, key) => {
			const path = prefix ? `${prefix}.${key}` : key;
			if (typeof obj[key] === 'object' && obj[key] !== null) {
					acc.push(...flattenKeys(obj[key], path));
			} else {
					acc.push(path);
			}
			return acc;
	}, [] as string[]);
}
