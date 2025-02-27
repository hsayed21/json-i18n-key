import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { JsonObject } from '../models/jsonObject';
import * as vscode from 'vscode';
import { loadJsonFileSync } from './fileUtils';
import { JSONPath } from 'jsonpath-plus';
import { printChannelOutput } from '../extension';
import * as fs from 'fs';
import * as path from 'path';

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


export function getKeyValuesFromAllFiles(keyPath: string): { filePath: string, lang: string, value: string }[] {
	const results: {filePath: string, lang: string, value: string }[] = [];
	
	JsonI18nKeySettings.instance.translationFiles.forEach(file => {
			const jsonData = loadJsonFileSync(file.filePath);
			if (jsonData !== null) {
					const value = JSONPath({ 
							json: jsonData, 
							path: keyPath 
					});
					
					results.push({
							filePath: file.filePath,
							lang: file.lang,
							value: value.length > 0 ? value[0] : ''
					});
			}
	});

	return results;
}


export function GetAlli18nFilesKeys(key: string | null = null): string[] {
	const uniqueKeys = new Set<string>();
	JsonI18nKeySettings.instance.translationFiles.forEach(file => {
		const jsonData = loadJsonFileSync(file.filePath);
		if (jsonData !== null) {
			const keys = flattenKeys(jsonData);
			keys.forEach(key => uniqueKeys.add(key));
		}
	});

	if (key === null)
		return Array.from(uniqueKeys);
	else
		return Array.from(uniqueKeys).filter(k => k.toLowerCase().endsWith(key.toLowerCase()));
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

export function loadKeys(key: string | null = null) {
	if (JsonI18nKeySettings.instance.enJsonFilePath === '') {
		printChannelOutput('English translation file not found');
		return [];
	}
	
	var keys =  flattenKeys(loadJsonFileSync(JsonI18nKeySettings.instance.enJsonFilePath));
	if (key === null)
		return keys;
	else
		return keys.filter(k => k.toLowerCase().endsWith(key.toLowerCase()));
}

export function flattenKeys(obj: any, prefix = ''): string[] {
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

export function flattenKeysWithValues(obj: any, prefix = ''): { key: string, value: any }[] {
	return Object.keys(obj).reduce((acc, key) => {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			acc.push(...flattenKeysWithValues(obj[key], path));
		} else {
			acc.push({ key: path, value: obj[key] });
		}
		return acc;
	}, [] as { key: string, value: any }[]);
}

export function removeKeyInObject(obj: any, path: string): boolean {
	const parts = path.split('.');
	const last = parts.pop()!;
	let current = obj;

	for (const part of parts) {
			if (!current[part] || typeof current[part] !== 'object') {
					return false;
			}
			current = current[part];
	}

	if (last in current) {
			delete current[last];
			// Check if the parent object has no other children
			if (Object.keys(current).length === 0) {
					return removeKeyInObject(obj, parts.join('.'));
			}
			return true;
	}

	return false;
}

