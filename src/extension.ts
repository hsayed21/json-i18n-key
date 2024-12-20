import * as vscode from 'vscode';
import { JsonI18nKeySettings } from './models/JsonI18nKeySettings';
import { getHoverTranslation, loadKeys } from './utils/jsonUtils';
import { removeKeyCommand } from './commands/removeKey';
import { renameKeyCommand } from './commands/renameKey';
import { searchKeyCommand } from './commands/searchKey';
import { updateKeyCommand } from './commands/updateKey';
import { findKeyCommand } from './commands/findKey';
import { addKeyCommand } from './commands/addKey';
import { checkExistKeyCommand } from './commands/checkKey';

let outputChannel: vscode.OutputChannel | undefined;
let keyCache: string[] = [];

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
				const range = document.getWordRangeAtPosition(position, /['"](.*?)['"]/);
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
				const range = document.getWordRangeAtPosition(position, /['"](.*?)['"]/);
				if (!range) {
					return;
				}

				let fullKeyPath = document.getText(range);
				// if (context.triggerKind !== vscode.CompletionTriggerKind.TriggerCharacter) {
					const textBeforeCursor = document.getText(new vscode.Range(range.start, position));
					fullKeyPath = textBeforeCursor;
				// }
				// Remove surrounding quotes (single or double quotes) if they exist
				fullKeyPath = fullKeyPath.replace(/^['"]|['"]$/g, '');

				const uniqueKeys = Array.from(
					new Set( keyCache
									.filter(key => key.startsWith(fullKeyPath))
									.map((key: string) => {
											const str = key.slice(fullKeyPath.lastIndexOf('.') + 1, key.length);
											if (str.indexOf('.') === -1) {
												return str;
                      }
											const nextKey = str.slice(0, str.indexOf('.'));
											return nextKey;
									})
					)
				);
				return uniqueKeys.map((key: string) => {
					const completionItem = new vscode.CompletionItem(key, vscode.CompletionItemKind.Field);
					completionItem.documentation = new vscode.MarkdownString(key);
					completionItem.detail = "i18n key";
					return completionItem;
				});
			},
		},
		'.' // Trigger on `.`
	);


	// Set up file watcher for en.json
	const watcher = vscode.workspace.createFileSystemWatcher(JsonI18nKeySettings.instance.enJsonFilePath);
	watcher.onDidChange(() => {
			console.log('en.json changed, reloading keys...');
			keyCache = loadKeys();
	});
	watcher.onDidCreate(() => {
			console.log('en.json created, loading keys...');
			keyCache = loadKeys();
	});
	watcher.onDidDelete(() => {
			console.log('en.json deleted, clearing cache...');
			keyCache = [];
	});

	// Load keys initially
	keyCache = loadKeys();

	// Register commands and other providers
	context.subscriptions.push(
		vscode.commands.registerCommand('json-i18n-key.findKey', findKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.checkExistKey', checkExistKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.removeKey', removeKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.renameKey', renameKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.updateKey', updateKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.addKey', addKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.searchKey', searchKeyCommand),
		hoverProvider,
		completionProvider,
		watcher,
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
