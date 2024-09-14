// The module 'vscode' contains the VS Code extensibility API

const { findKeyCommand } = require('./src/commands/findKey');
const { addKeyCommand } = require('./src/commands/addKey');
const { checkExistKeyCommand } = require('./src/commands/checkKey');
const { renameKeyCommand } = require('./src/commands/renameKey');
const { getHoverTranslation } = require('./src/utils/jsonUtils');
const { getKeys } = require('./src/utils/jsonUtils');

// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
let outputChannel;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('json-i18n-key is now active!');
	outputChannel = vscode.window.createOutputChannel("json i18n key");
	printChannelOutput('json-i18n-key is now active!');

	const hoverProvider = vscode.languages.registerHoverProvider(['json', 'ts', 'js', 'html', 'typescript', 'javascript'], {
		 async provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position, /[\'"]([\w\.]+)[\'"]/);
			// const range = document.getWordRangeAtPosition(position, /(?<="|^|\s)(?:[\'"])([\w\.]+)(?:[\'"])(?=\s|$)/);
			// const range = document.getWordRangeAtPosition(position, /['"]?([\w\.]+)['"]?/);
			if (!range) {
				return;
			}

			let fullKeyPath = document.getText(range);
			// Remove surrounding quotes (single or double quotes) if they exist
			fullKeyPath = fullKeyPath.replace(/^['"]|['"]$/g, '');

			const hoverMessage = getHoverTranslation(fullKeyPath);
			// console.log('hoverMessage:', hoverMessage.value);

			return new vscode.Hover(hoverMessage);
		}
	});

	const completionProvider = vscode.languages.registerCompletionItemProvider(['json', 'ts', 'js', 'html', 'typescript', 'javascript'], {
		async provideCompletionItems(document, position, token, context) {
			const range = document.getWordRangeAtPosition(position, /[\'"]([\w\.]+)[\'"]/);
			if (!range) {
				return;
			}

			let fullKeyPath = document.getText(range);
			// Remove surrounding quotes (single or double quotes) if they exist
			fullKeyPath = fullKeyPath.replace(/^['"]|['"]$/g, '');

			const keys = getKeys(fullKeyPath);
			if (keys.length === 0) {
				return;
			}

			return keys.map(key => {
				const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Field);
				completionItem.insertText = key;
				return completionItem;
			});
		}
	});


	context.subscriptions.push(
		vscode.commands.registerCommand('json-i18n-key.findKey', findKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.addKey', addKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.checkExistKey', checkExistKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.renameKey', renameKeyCommand),
		hoverProvider,
		completionProvider
	);
}

/**
 * Prints the given content on the output channel.
 *
 * @param content The content to be printed.
 * @param reveal Whether the output channel should be revealed.
 */
function printChannelOutput(content, reveal = false) {
	if (!outputChannel) {
		console.error("Output channel is not initialized.");
		return;
	}
	const output = typeof content === "string" ? content : JSON.stringify(content, null, 2);
	outputChannel.appendLine(output);
	if (reveal) {
		outputChannel.show(true);
	}
}


// This method is called when your extension is deactivated
function deactivate() {

}

module.exports = {
	activate,
	deactivate,
	printChannelOutput
};
