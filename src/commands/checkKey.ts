import * as vscode from 'vscode';
import { checkExistKey } from '../utils/jsonUtils';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';
import { KEY_PATH_REGEX } from '../utils/constants';

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
		const range = editor.document.getWordRangeAtPosition(position, KEY_PATH_REGEX);
		if (range) {
			keyPath = editor.document.getText(range);
			keyPath = keyPath.replace(/^['"`]|['"`]$/g, '');
			if (keyPath.includes(' ')) {
        vscode.window.showErrorMessage('Key path cannot contain spaces');
        return;
			}
		} else {
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
