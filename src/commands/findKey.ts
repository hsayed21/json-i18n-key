import * as vscode from 'vscode';
import { findKeyPosition } from '../utils/jsonUtils';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';
import { KEY_PATH_REGEX } from '../utils/constants';
import { printChannelOutput } from '../extension';

async function findKeyCommand(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}

	await autoDetectI18nFiles()

	const document = editor.document;
	let keyPath = undefined;
	const settings = JsonI18nKeySettings.instance;
	if (settings.translationFiles.length === 0) {
		vscode.window.showErrorMessage('No translation files found');
		return;
	}

	if (document.languageId === 'json') {
		keyPath = await vscode.window.showInputBox({ prompt: 'Enter Key Path:' });
	} else {
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

		try {
			const document = await vscode.workspace.openTextDocument(translationFile.filePath);
			const openedEditor = await vscode.window.showTextDocument(document, { preview: false });

			// This logic is from 'https://github.com/shanmuganathan-balaraman/jsonyamlkeynavigator'
			// const position = findKeyPosition(openedEditor, keyPath);
			const position = findKeyPosition(openedEditor, keyPath);
			if (position) {
				const lineRange = openedEditor.document.lineAt(position.line).range;
				openedEditor.selection = new vscode.Selection(lineRange.start, lineRange.end);
				openedEditor.revealRange(lineRange);
			} else {
				vscode.window.showErrorMessage(`Key not found in ${translationFile.lang}`);
			}
		} catch (err) {
			vscode.window.showErrorMessage(`Error opening file: ${err}`);
		}
	}
}

export { findKeyCommand };
