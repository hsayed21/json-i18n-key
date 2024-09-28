import * as vscode from 'vscode';
import { JsonParser } from '../utils/json-parser';

async function renameKeyCommand(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}

	let keyPath = '';
	let newKey = '';
	const settings = vscode.workspace.getConfiguration('json-i18n-key');
	const translationFiles: { filePath: string, lang: string; }[] = settings.get('translationFiles', []);

	if (settings.typeOfGetKey === 'Manual') {
		keyPath = await vscode.window.showInputBox({ prompt: 'Enter Key Path:' }) || '';
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

	if (!keyPath) {
		vscode.window.showErrorMessage('Key path is required');
		return;
	}

	newKey = await vscode.window.showInputBox({ prompt: 'Enter new Key:' }) || '';
	if (!newKey) {
		vscode.window.showErrorMessage('New Key is required');
		return;
	}

	for (const translationFile of translationFiles) {
		if (!translationFile.filePath) {
			vscode.window.showErrorMessage(`Translation file path for ${translationFile.lang} does not exist`);
			continue;
		}

		new JsonParser(translationFile.filePath).renamekey(keyPath, newKey);
		// renameKey(translationFile.filePath, keyPath, newKey);
	}

	// Update key in editor
	// await editor.edit((editBuilder:any) => {
	// 	const keys = keyPath.split('.');
	// 	const text = editor.document.getText(editor.selection.isEmpty ? editor.document.lineAt(editor.selection.active).range : editor.selection);

	// 	// Detect the start and end quotes and replace them with the new key inside the same quotes
	// 	const regex = new RegExp(`(['"])(${keyPath.replace(/^['"]|['"]$/g, '')})(['"])`, 'g');

	// 	// Preserve the quotes around the key
	// 	const updatedText = text.replace(regex, (match, startQuote, oldKey, endQuote) => {
	// 		if (keys.length === 1) {
	// 			return `${startQuote}${newKey}${endQuote}`;
	// 		} else {
	// 			const path = keys.slice(0, -1).join('.');
	// 			const newFullKey = `${path}.${newKey}`;
	// 			return `${startQuote}${newFullKey}${endQuote}`;
	// 		}
	// 	});

	// 	if (editor.selection.isEmpty) {
	// 		const lineRange = editor.document.lineAt(editor.selection.active).range;
	// 		editBuilder.replace(lineRange, updatedText);
	// 	} else {
	// 		editBuilder.replace(editor.selection, updatedText);
	// 	}
	// });
}

export { renameKeyCommand };
