import * as vscode from 'vscode';
import { JsonParser } from '../utils/json-parser';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { convertCase } from '../utils/globalUtils';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';
import { updateEditorKey } from '../utils/editorUtils';

async function renameKeyCommand(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}

	await autoDetectI18nFiles()

	let keyPath = undefined;
	let newKey = undefined;
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
		vscode.window.showErrorMessage('Key path is required');
		return;
	}

	newKey = await vscode.window.showInputBox({ prompt: 'Enter new Key:' });

	if (newKey === undefined)
		return;

	if (!newKey) {
		vscode.window.showErrorMessage('New Key is required');
		return;
	}

	newKey = convertCase(newKey);
	const newFullKey = keyPath.split('.').slice(0, -1).concat(newKey).join('.');

	for (const translationFile of settings.translationFiles) {
		if (!translationFile.filePath) {
			vscode.window.showErrorMessage(`Translation file path for ${translationFile.lang} does not exist`);
			continue;
		}

		new JsonParser(translationFile.filePath, settings.preserveFormating).renamekey(keyPath, newKey);
	}

	// Update key in editor
	await updateEditorKey(editor, keyPath, newFullKey);
}

export { renameKeyCommand };
