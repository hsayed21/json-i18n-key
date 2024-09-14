const vscode = require('vscode');
const { findKeyPosition } = require('../utils/jsonUtils');

async function findKeyCommand() {

	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}

	const document = editor.document;


	let keyPath = '';
	const settings = vscode.workspace.getConfiguration('json-i18n-key');
	const translationFiles = settings.get('translationFiles', []);

	if (document.languageId === 'json')
	{
		keyPath = await vscode.window.showInputBox({ prompt: 'Enter Key Path: ' });
	}
	else
	{
		if (settings.typeOfGetKey === 'Manual') {
			keyPath = await vscode.window.showInputBox({ prompt: 'Enter Key Path: ' });
		}
		else if (settings.typeOfGetKey === 'Clipboard') {
			const clipboard = await vscode.env.clipboard.readText();
			keyPath = clipboard;
		}
		else {
			const position = editor.selection.active;
			const range = editor.document.getWordRangeAtPosition(position, /[\'"]([\w\.]+)[\'"]/);
			if (range) {
				keyPath = editor.document.getText(range);
				keyPath = keyPath.replace(/^['"]|['"]$/g, '');
			}
			else {
				keyPath = editor.document.getText(editor.selection);
			}
		}

		if (!keyPath) {
			vscode.window.showErrorMessage('Key path is required');
			return;
		}
	}

	for (const translationFile of translationFiles) {
		// if (!translationFile.isDefault) {
		// 	continue;
		// }

		if (!translationFile.filePath) {
			vscode.window.showErrorMessage('Translation file path for ' + translationFile.lang + ' does not exist');
			continue;
		}

		const document = await vscode.workspace.openTextDocument(translationFile.filePath);
		const openedEditor = await vscode.window.showTextDocument(document, { preview: false });

		// this from 'https://github.com/shanmuganathan-balaraman/jsonyamlkeynavigator'
		const position = findKeyPosition(openedEditor, keyPath);
		if (position) {
			const lineRange = openedEditor.document.lineAt(position.line).range;
			openedEditor.selection = new vscode.Selection(lineRange.start, lineRange.end);
			openedEditor.revealRange(lineRange);
		} else {
			vscode.window.showErrorMessage('Key not found in ' + translationFile.lang);
		}
	}
}

module.exports = {
	findKeyCommand,
};
