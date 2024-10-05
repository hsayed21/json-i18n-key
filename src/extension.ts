import * as vscode from 'vscode';
import { findKeyCommand } from './commands/findKey';
import { addKeyCommand } from './commands/addKey';
import { checkExistKeyCommand } from './commands/checkKey';
import { renameKeyCommand } from './commands/renameKey';
import { removeKeyCommand } from './commands/removeKey';
import { updateKeyCommand } from './commands/updateKey';
import { getHoverTranslation, getKeysValues } from './utils/jsonUtils';

let outputChannel: vscode.OutputChannel | undefined;

/**
 * This method is called when the extension is activated.
 * @param context The extension context provided by VSCode.
 */
export function activate(context: vscode.ExtensionContext): void {
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

				const results = getKeysValues(fullKeyPath);
				if (results.length === 0) {
					return;
				}

				return results.map((obj:any) => {
					const completionItem = new vscode.CompletionItem(obj.parentProperty, vscode.CompletionItemKind.Field);
					completionItem.documentation = new vscode.MarkdownString(obj.value);
					return completionItem;
				});
			}
		}
	);

	// Register commands and other providers
	context.subscriptions.push(
		vscode.commands.registerCommand('json-i18n-key.findKey', findKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.checkExistKey', checkExistKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.removeKey', removeKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.renameKey', renameKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.updateKey', updateKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.addKey', addKeyCommand),
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
export function printChannelOutput(content: any, reveal: boolean = false): void {
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
export function deactivate(): void {
	// Cleanup any resources if necessary
}
