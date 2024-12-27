import * as vscode from 'vscode';
import { JsonParser } from '../utils/json-parser';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { convertCase } from '../utils/globalUtils';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';
import { updateEditorKey } from '../utils/editorUtils';
import { KEY_PATH_REGEX } from '../utils/constants';
import { findAndReplaceInFiles } from '../utils/fileUtils';

export async function renameKeyCommand(): Promise<void> {
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

	if (settings.updateReferencesOnRename) {
		try {
			const replacedCount = await findAndReplaceInFiles(keyPath, newFullKey);

			if (replacedCount > 0) {
				vscode.window.showInformationMessage(`Updated ${replacedCount} references from "${keyPath}" to "${newFullKey}"`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to update references: ${error}`);
		}
	}
}
