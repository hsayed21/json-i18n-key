import * as vscode from 'vscode';
import { JsonParser } from '../utils/json-parser';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';

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

	for (const translationFile of settings.translationFiles) {
		if (!translationFile.filePath) {
			vscode.window.showErrorMessage(`Translation file path for ${translationFile.lang} does not exist`);
			continue;
		}

		new JsonParser(translationFile.filePath, settings.preserveFormating).removeKey(keyPath);
	}

	// Update key in editor
	await editor.edit((editBuilder) => {
		const keys = keyPath.split('.');
		const text = editor.document.getText(editor.selection.isEmpty ? editor.document.lineAt(editor.selection.active).range : editor.selection);

		// Detect the start and end quotes and replace them with the new key inside the same quotes
		const regex = new RegExp(`(['"])(${keyPath.replace(/^['"]|['"]$/g, '')})(['"])`, 'g');

		// Preserve the quotes around the key
		const updatedText = text.replace(regex, (match, startQuote, oldKey, endQuote) => {
			if (keys.length === 1) {
				return `${startQuote}${endQuote}`;
			} else {
				const path = keys.slice(0, -1).join('.');
				const newFullKey = `${path}`;
				return `${startQuote}${newFullKey}${endQuote}`;
			}
		});

		if (editor.selection.isEmpty) {
			const lineRange = editor.document.lineAt(editor.selection.active).range;
			editBuilder.replace(lineRange, updatedText);
		} else {
			editBuilder.replace(editor.selection, updatedText);
		}
	});
}

export { removeKeyCommand };
