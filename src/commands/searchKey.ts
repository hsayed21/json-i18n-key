import * as vscode from 'vscode';
import { loadJsonFileSync } from '../utils/fileUtils';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import { flattenKeysWithValues } from '../utils/jsonUtils';

export async function searchKeyCommand() {
    const jsonData = flattenKeysWithValues(loadJsonFileSync(JsonI18nKeySettings.instance.enJsonFilePath));
    const quickPick = vscode.window.createQuickPick();
    quickPick.matchOnDescription = true;
    
    quickPick.placeholder = 'Type key or value to filter...';
    
    const allItems = jsonData.map(({ key, value }) => ({
        label: key,
        description: String(value),
    }));
    
    quickPick.items = allItems;

    quickPick.onDidAccept(() => {
        if (quickPick.selectedItems.length > 0) {
            const selected = quickPick.selectedItems[0];
            vscode.env.clipboard.writeText(selected.label);
            vscode.window.showInformationMessage(`Copied "${selected.label}" to clipboard`);
        }
        quickPick.hide();
    });

    quickPick.show();
}