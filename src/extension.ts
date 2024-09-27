import * as vscode from 'vscode';
import { findKeyCommand } from './commands/findKey';
import { addKeyCommand } from './commands/addKey';
import { checkExistKeyCommand } from './commands/checkKey';
import { renameKeyCommand } from './commands/renameKey';
import { getHoverTranslation, getKeys } from './utils/jsonUtils';

let outputChannel: vscode.OutputChannel | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * This method is called when the extension is activated.
 * @param context The extension context provided by VSCode.
 */
function activate(context: vscode.ExtensionContext): void {
	console.log('json-i18n-key is now active!');
	outputChannel = vscode.window.createOutputChannel("json i18n key");
	printChannelOutput('json-i18n-key is now active!');

	// Register hover provider for multiple languages
	const hoverProvider = vscode.languages.registerHoverProvider(
		['json', 'ts', 'js', 'html', 'typescript', 'javascript'],
		{
			async provideHover(document, position, token) {
				const range = document.getWordRangeAtPosition(position, /['"]([\w\.]+)['"]/);
				if (!range) {
					return;
				}

				let fullKeyPath = document.getText(range);
				// Remove surrounding quotes (single or double quotes) if they exist
				fullKeyPath = fullKeyPath.replace(/^['"]|['"]$/g, '');

				const hoverMessage = getHoverTranslation(fullKeyPath);

				return new vscode.Hover(hoverMessage);
			}
		}
	);

	// Register completion provider for multiple languages
	const completionProvider = vscode.languages.registerCompletionItemProvider(
		['json', 'ts', 'js', 'html', 'typescript', 'javascript'],
		{
			async provideCompletionItems(document, position, token, context) {
				const range = document.getWordRangeAtPosition(position, /['"]([\w\.]+)['"]/);
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

				return keys.map((key:any) => {
					const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Field);
					completionItem.insertText = key;
					return completionItem;
				});
			}
		}
	);

	// Register commands and other providers
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
function printChannelOutput(content: any, reveal: boolean = false): void {
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
function deactivate(): void {
	// Cleanup any resources if necessary
}

export {
	activate,
	deactivate,
	printChannelOutput
};
