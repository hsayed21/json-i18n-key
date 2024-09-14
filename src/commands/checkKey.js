const vscode = require('vscode');
const { checkExistKey } = require('../utils/jsonUtils');


async function checkExistKeyCommand() {

	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}

	let keyPath = '';
	const settings = vscode.workspace.getConfiguration('json-i18n-key');
	const translationFiles = settings.get('translationFiles', []);

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
		vscode.window.showErrorMessage('Key Path is required');
		return;
	}

	for (const translationFile of translationFiles) {
		if (!translationFile.filePath) {
			vscode.window.showInformationMessage("File path is required for " + translationFile.lang);
			continue;
		}
		const isExist = checkExistKey(translationFile.filePath, keyPath);
		if (isExist) {
			vscode.window.showInformationMessage("Key exists in " + translationFile.lang);
		}
		else {
			vscode.window.showInformationMessage("Key doesn't exist in " + translationFile.lang);
		}
	}
}

module.exports = {
	checkExistKeyCommand
}


