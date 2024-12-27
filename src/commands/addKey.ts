import * as vscode from 'vscode';
import { printChannelOutput } from './../extension';
import { JsonParser } from '../utils/json-parser';
import { getTranslationFromCopilot } from '../utils/translationUtils';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { convertCase } from '../utils/globalUtils';
import { autoDetectI18nFiles } from '../options/auto-detect-i18n-files';
import { loadKeys } from '../utils/jsonUtils';
import { updateEditorKey } from '../utils/editorUtils';
import { KEY_PATH_REGEX } from '../utils/constants';

async function addKeyCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return; // No open text editor
    }

    await autoDetectI18nFiles()

    let keyPath: string | undefined = undefined;
    let originalKeyPath: string | undefined = undefined;
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
        // Match only keypath without spaces
        const range = editor.document.getWordRangeAtPosition(position, KEY_PATH_REGEX);
        if (range) {
            keyPath = editor.document.getText(range);
            // Clean up quotes
            keyPath = keyPath.replace(/^['"`]|['"`]$/g, '');
            
            if (keyPath.includes(' ')) {
                vscode.window.showErrorMessage('Key path cannot contain spaces');
                return;
            }
        }
        else {
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

    originalKeyPath = keyPath;

    if (JsonI18nKeySettings.instance.suggestExistingKeys) {
        const existingKeys = loadKeys(convertCase(keyPath.split('.').pop() as string));
        keyPath = await new Promise<string>((resolve) => {
            const quickPick = vscode.window.createQuickPick();
            quickPick.items = [
                { label: '$(close) None', description: 'Continue without selecting existing key' },
                ...existingKeys.map(key => ({ label: key }))
            ];
            quickPick.placeholder = 'Select an existing key or none to continue';

            quickPick.onDidAccept(() => {
                const selectedItem = quickPick.selectedItems[0];
                let selectedKey = selectedItem?.label;

                // If "None" is selected, use the original key
                if (selectedKey === '$(close) None') {
                    selectedKey = originalKeyPath;
                } else {
                    selectedKey = selectedKey || quickPick.value;
                }

                quickPick.hide();
                resolve(selectedKey ?? keyPath ?? '');
            });

            quickPick.onDidHide(() => {
                resolve(keyPath ?? '');
                quickPick.dispose();
            });

            quickPick.show();
        });

        if (!keyPath) {
            return;
        }

        // If selected key exists in the list, only update editor
        if (existingKeys.includes(keyPath)) {
            await updateEditorKey(editor, originalKeyPath, keyPath);
            return;
        }
    }

    const keys = keyPath.split('.');
    const key = convertCase(keys.pop() as string);
    keyPath = keys.length === 0 ? key : keys.join('.') + '.' + key;

    let keyValue = undefined;
    for (const translationFile of settings.translationFiles) {
        if (!translationFile.filePath) {
            vscode.window.showErrorMessage('Translation file path is required');
            return;
        }

        if (translationFile.isDefault && translationFile.lang === 'en') {
            keyValue = await vscode.window.showInputBox({ prompt: 'Enter Key Value for ' + translationFile.lang + ':' });
        }

        if (keyValue === undefined)
            return

        try {
            if (settings.enableCopilotTranslation && keyValue && translationFile.lang !== 'en') {
                const translated = await getTranslationFromCopilot(keyValue, translationFile.lang);
                if (translated) {
                    keyValue = translated;
                }
            }
        } catch (err) {
            printChannelOutput(err);
        }

        new JsonParser(translationFile.filePath, settings.preserveFormating).addKey(keyPath, keyValue);
    }

    // Update key in editor
    await updateEditorKey(editor, originalKeyPath ?? keyPath, keyPath);
}

export { addKeyCommand };
