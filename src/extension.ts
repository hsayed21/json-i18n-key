import * as vscode from 'vscode';
import { JsonI18nKeySettings } from './models/JsonI18nKeySettings';
import { GetAlli18nFilesKeys, getHoverTranslation } from './utils/jsonUtils';
import { removeKeyCommand } from './commands/removeKey';
import { renameKeyCommand } from './commands/renameKey';
import { searchKeyCommand } from './commands/searchKey';
import { updateKeyCommand } from './commands/updateKey';
import { findKeyCommand } from './commands/findKey';
import { addKeyCommand } from './commands/addKey';
import { checkExistKeyCommand } from './commands/checkKey';
import { cleanupUnusedKeys } from './commands/cleanupUnusedKeys';
import { KEY_PATH_REGEX, SUPPORTED_LANGUAGES } from './utils/constants';
import { DiagnosticManager } from './utils/diagnosticManager';
import path from 'path';
import { copyKeyCommand } from './commands/copyKey';

let outputChannel: vscode.OutputChannel | undefined;
let keyCache: Set<string> = new Set();
let diagnosticManager: DiagnosticManager;

/**
 * This method is called when the extension is activated.
 * @param context The extension context provided by VSCode.
 */
export function activate(context: vscode.ExtensionContext): void {
	outputChannel = vscode.window.createOutputChannel("json i18n key");
	printChannelOutput('json-i18n-key is now active!');

	// Register hover provider for multiple languages
	const hoverProvider = vscode.languages.registerHoverProvider(
		SUPPORTED_LANGUAGES,
		{
			async provideHover(document, position, token) {
				const range = document.getWordRangeAtPosition(position, KEY_PATH_REGEX);
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
		SUPPORTED_LANGUAGES,
		{
			async provideCompletionItems(document, position, token, context) {
				const range = document.getWordRangeAtPosition(position, KEY_PATH_REGEX);
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
					new Set( Array.from(keyCache)
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

	// Register event listeners for diagnostics
	vscode.workspace.onDidOpenTextDocument(doc => diagnosticManager.updateDiagnostics(doc));
	vscode.workspace.onDidChangeTextDocument(editor => diagnosticManager.updateDiagnostics(editor.document));
	// vscode.workspace.onDidSaveTextDocument(doc => diagnosticManager.updateDiagnostics(doc));
	vscode.window.onDidChangeActiveTextEditor(editor => diagnosticManager.updateDiagnostics(editor!.document));
	vscode.window.onDidChangeVisibleTextEditors(editors =>  editors.forEach(editor => diagnosticManager.updateDiagnostics(editor.document)));
	
	// Set up file watcher
	const watcher = setupFileWatcher();

	keyCache = new Set(GetAlli18nFilesKeys());

	diagnosticManager = new DiagnosticManager(keyCache);
	// Initial diagnostics update
	diagnosticManager.updateAllDiagnostics();

	// Register commands and other providers
	context.subscriptions.push(
		vscode.commands.registerCommand('json-i18n-key.findKey', findKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.checkExistKey', checkExistKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.removeKey', removeKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.renameKey', renameKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.updateKey', updateKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.addKey', addKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.searchKey', searchKeyCommand),
		vscode.commands.registerCommand('json-i18n-key.cleanupUnusedKeys', cleanupUnusedKeys),
		vscode.commands.registerCommand('json-i18n-key.copyKey', copyKeyCommand),
		hoverProvider,
		completionProvider,
		watcher!,
	);
}

/**
 * Sets up the file watcher for the JSON translation file
 * @returns The configured FileSystemWatcher or undefined if setup fails
 */
function setupFileWatcher(): vscode.FileSystemWatcher | undefined {
	try {
			if (!JsonI18nKeySettings.instance.enJsonFilePath) {
					throw new Error('JSON file path is not configured in settings');
			}

			const directory = path.dirname(JsonI18nKeySettings.instance.enJsonFilePath);
			const fileName = path.basename(JsonI18nKeySettings.instance.enJsonFilePath);

			const watcher = vscode.workspace.createFileSystemWatcher(
					new vscode.RelativePattern(vscode.Uri.file(directory), fileName)
			);

			watcher.onDidChange(() => {
					try {
							keyCache = new Set(GetAlli18nFilesKeys());
							diagnosticManager.updateKeys(keyCache);
					} catch (error) {
							printChannelOutput(`Error reloading keys: ${error}`, true);
					}
			});

			watcher.onDidCreate(() => {
					try {
						keyCache = new Set(GetAlli18nFilesKeys());
						diagnosticManager.updateKeys(keyCache);
					} catch (error) {
							printChannelOutput(`Error loading keys: ${error}`, true);
					}
			});

			watcher.onDidDelete(() => {
					keyCache.clear();
					diagnosticManager.updateKeys(keyCache);
					printChannelOutput('Cleared key cache due to file deletion.');
			});

			return watcher;
	} catch (error) {
			printChannelOutput(`Error setting up file watcher: ${error}`, true);
			return undefined;
	}
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
    if (diagnosticManager) {
        diagnosticManager.dispose();
    }
}
