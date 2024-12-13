import * as vscode from 'vscode';
import { JsonParser } from '../utils/json-parser';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';

async function updateKeyCommand(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}

	let keyPath = undefined;
	let newValue = undefined;
	const settings = JsonI18nKeySettings.instance;


	if (settings.typeOfGetKey === 'Manual') {
		keyPath = await vscode.window.showInputBox({ prompt: 'Enter Key Path:' });
	} else if (settings.typeOfGetKey === 'Clipboard') {
		const clipboard = await vscode.env.clipboard.readText();
		keyPath = clipboard;
	} else {
		const position = editor.selection.active;
		const range = editor.document.getWordRangeAtPosition(position, /['"]([\w\.]+)['"]/);
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

	newValue = await vscode.window.showInputBox({ prompt: 'Enter new value:' });

	if (newValue === undefined)
		return;
	
	if (!newValue) {
		vscode.window.showErrorMessage('New value is required');
		return;
	}

	for (const translationFile of settings.translationFiles) {
		if (!translationFile.filePath) {
			vscode.window.showErrorMessage(`Translation file path for ${translationFile.lang} does not exist`);
			continue;
		}

		new JsonParser(translationFile.filePath, settings.preserveFormating).updateKey(keyPath, newValue);
	}
}

export { updateKeyCommand };
