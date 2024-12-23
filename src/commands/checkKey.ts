import * as vscode from 'vscode';
import { checkExistKey } from '../utils/jsonUtils';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';

async function checkExistKeyCommand(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}

	await autoDetectI18nFiles()

	let keyPath = undefined;
	const settings = JsonI18nKeySettings.instance;
	if (settings.translationFiles.length === 0) {
		vscode.window.showErrorMessage('No translation files found');
		return;
	}

	if (settings.typeOfGetKey === 'Manual') {
		keyPath = await vscode.window.showInputBox({ prompt: 'Enter Key Path:' });
	} else if (settings.typeOfGetKey === 'Clipboard') {
		const clipboard = await vscode.env.clipboard.readText();
		keyPath = clipboard;
	} else {
		const position = editor.selection.active;
		const range = editor.document.getWordRangeAtPosition(position, /['"](.*?)['"]/);
		if (range) {
			keyPath = editor.document.getText(range);
			keyPath = keyPath.replace(/^['"]|['"]$/g, '');
		} else {
			keyPath = editor.document.getText(editor.selection);
		}
	}

	if (keyPath === undefined)
		return;

	if (!keyPath) {
		vscode.window.showErrorMessage('Key Path is required');
		return;
	}

	for (const translationFile of settings.translationFiles) {
		if (!translationFile.filePath) {
			vscode.window.showInformationMessage(`File path is required for ${translationFile.lang}`);
			continue;
		}
		const isExist = checkExistKey(translationFile.filePath, keyPath);
		if (isExist) {
			vscode.window.showInformationMessage(`Key exists in ${translationFile.lang}`);
		} else {
			vscode.window.showInformationMessage(`Key doesn't exist in ${translationFile.lang}`);
		}
	}
}

export { checkExistKeyCommand };
