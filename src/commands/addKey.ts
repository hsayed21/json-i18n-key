import * as vscode from 'vscode';
import { printChannelOutput } from './../extension';
import { JsonParser } from '../utils/json-parser';
import { getTranslationFromCopilot } from '../utils/translationUtils';

async function addKeyCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return; // No open text editor
    }

    let keyPath = '';
    const settings = vscode.workspace.getConfiguration('json-i18n-key');
    const translationFiles: { filePath: string, lang: string, isDefault?: boolean; }[] = settings.get('translationFiles', []);
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
        vscode.window.showErrorMessage('Key Path is required');
        return;
    }

    let keyValue = '';
    for (const translationFile of translationFiles) {
        if (!translationFile.filePath) {
            vscode.window.showErrorMessage('Translation file path is required');
            return;
        }

        if (translationFile.isDefault && translationFile.lang === 'en') {
            keyValue = await vscode.window.showInputBox({ prompt: 'Enter Key Value for ' + translationFile.lang + ':' }) || '';
        }

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

        new JsonParser(translationFile.filePath, true).addKey(keyPath, keyPath);
        // addKey(translationFile.filePath, keyPath, keyValue);
    }
}

export { addKeyCommand };
