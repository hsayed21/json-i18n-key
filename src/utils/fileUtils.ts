import * as fs from 'fs';
import * as vscode from 'vscode';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';

export function loadJsonFileSync(filePath: string, preserveFormatting: boolean = false) {
	if (filePath === undefined || filePath === null || filePath === '') {
		return preserveFormatting ? '' : {};
	}

	if (!fs.existsSync(filePath)) {
		vscode.window.showErrorMessage(`File does not exist: ${filePath}`);
		return null;
	}

	const content = fs.readFileSync(filePath, 'utf8');
	return preserveFormatting ? content : JSON.parse(content);
}

export function writeJsonFileSync(filePath: string, jsonData: string, preserveFormatting: boolean = false): void {
	if (filePath === undefined || filePath === null || filePath === '') {
		return;
	}

	if (!fs.existsSync(filePath)) {
		vscode.window.showErrorMessage(`File does not exist: ${filePath}`);
		return;
	}

	const jsonString = preserveFormatting ? jsonData : JSON.stringify(jsonData, null, 2);
	fs.writeFileSync(filePath, jsonString, 'utf-8')
}

export async function findAndReplaceInFiles(oldKey: string, newKey: string): Promise<number> {
    const workspaceEdit = new vscode.WorkspaceEdit();
    let replaceCount = 0;
    const settings = JsonI18nKeySettings.instance;

    const scanPatterns = settings.scanFilePatterns.length > 0 
        ? settings.scanFilePatterns.map(pattern => pattern.startsWith('**/') ? pattern : `**/${pattern}`)
        : ['**/*.{ts,js,tsx,jsx,vue,html}'];
        
    const excludePatterns = settings.excludePatterns.length > 0
        ? settings.excludePatterns
        : ['**/node_modules/**', '**/dist/**', '**/build/**'];

    // Find all files matching the patterns
    const files = await vscode.workspace.findFiles(
        `${scanPatterns.join(',')}`,
        `${excludePatterns.join(',')}`
    );

    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const content = document.getText();

        const regex = new RegExp(`(['"])(${oldKey})\\1`, 'g');
        let match;

        while ((match = regex.exec(content)) !== null) {
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);
            
            // Preserve the original quote style
            const quote = match[1];
            workspaceEdit.replace(document.uri, range, `${quote}${newKey}${quote}`);
            replaceCount++;
        }
    }

    if (replaceCount > 0) {
        await vscode.workspace.applyEdit(workspaceEdit);
    }

    return replaceCount;
}

