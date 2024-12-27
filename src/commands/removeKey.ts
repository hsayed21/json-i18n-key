import * as vscode from 'vscode';
import { JsonParser } from '../utils/json-parser';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';
import { updateEditorKey } from '../utils/editorUtils';
import { KEY_PATH_REGEX } from '../utils/constants';
import { printChannelOutput } from '../extension';

async function removeKeyCommand(): Promise<void> {
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
		const range = editor.document.getWordRangeAtPosition(position, KEY_PATH_REGEX);
		if (range) {
			keyPath = editor.document.getText(range);
			keyPath = keyPath.replace(/^['"`]|['"`]$/g, '');
		}
		else {
			vscode.window.showErrorMessage("Can't get key path by regex");
			return;
		}
	}

	if (keyPath === undefined)
		return;

	if (!keyPath || keyPath.includes(' ')) {
		vscode.window.showErrorMessage('Key path is required and cannot contain spaces');
		return;
	}

	for (const translationFile of settings.translationFiles) {
		if (!translationFile.filePath) {
			vscode.window.showErrorMessage(`Translation file path for ${translationFile.lang} does not exist`);
			continue;
		}

		new JsonParser(translationFile.filePath, settings.preserveFormating).removeKey(keyPath);
	}

	// Update key in editor
	const keys = keyPath.split('.');
	keys.pop();
	let newKeyPath = keys.length > 1 ? keys.join('.') : keys[0];

	await updateEditorKey(editor, keyPath, newKeyPath);
}

export { removeKeyCommand };
