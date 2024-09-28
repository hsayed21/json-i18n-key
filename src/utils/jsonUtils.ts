// import * as vscode from 'vscode';
// import { loadJsonFileSync, writeJsonFileSync } from './fileUtils';


// function findKeyPosition(editor: vscode.TextEditor, path: string): vscode.Position | null {
//     const document = editor.document;
//     const keys = path.split('.');
//     const regexPatterns = keys.map((key, index) => {
//         let regexString: string;
//         if (document.languageId === 'json') {
//             regexString = `\\"${key}\\"\\s*:\\s*`;
//         } else {
//             regexString = index === keys.length - 1 ? `\\b${key}\\b\\s*:\\s*` : `\\b${key}\\b\\s*:`;
//         }
//         return new RegExp(regexString);
//     });

//     let currentLevel = 0;
//     for (let i = 0; i < document.lineCount; i++) {
//         const lineText = document.lineAt(i).text;
//         if (currentLevel < keys.length - 1) {
//             if (regexPatterns[currentLevel].test(lineText)) {
//                 currentLevel++;
//             }
//         } else {
//             const finalKeyRegex = regexPatterns[currentLevel];
//             const match = finalKeyRegex.exec(lineText);
//             if (match) {
//                 return new vscode.Position(i, match.index);
//             }
//         }
//     }
//     return null;
// }

// function addKey(filePath: string, keyFullPath: string, value: string): void {
//     const contentJson = loadJsonFileSync(filePath);
//     const keys = keyFullPath.split('.');
//     const lastKey = keys.pop() as string;
//     let parentKey = contentJson;
//     for (const key of keys) {
//         if (!parentKey[key]) {
//             parentKey[key] = {}; // Create intermediate objects if they don't exist
//         }
//         parentKey = parentKey[key];
//     }
//     parentKey[lastKey] = value || lastKey;
//     writeJsonFileSync(filePath, contentJson);
//     vscode.window.showInformationMessage('Key added to ' + filePath);
// }

// function checkExistKey(filePath: string, keyFullPath: string): boolean {
//     const contentJson = loadJsonFileSync(filePath);
//     const keys = keyFullPath.split('.');
//     const lastKey = keys.pop() as string;
//     let parentKey = contentJson;
//     for (const key of keys) {
//         if (!parentKey[key]) {
//             return false;
//         }
//         parentKey = parentKey[key];
//     }
//     return parentKey[lastKey] !== undefined;
// }

// function renameKey(filePath: string, keyFullPath: string, newKey: string): void {
//     const contentJson = loadJsonFileSync(filePath);
//     const keys = keyFullPath.split('.');
//     const lastKey = keys.pop() as string;
//     const result = keys.reduce<any>((acc, key, index, array) => {
//         if (acc && typeof acc === 'object' && key in acc) {
//             return acc[key];
//         }
//         vscode.window.showErrorMessage(`Key not found: ${array.slice(0, index + 1).join('.')}`);
//         return undefined;
//     }, contentJson);
//     if (typeof result !== 'object' || !(lastKey in result)) {
//         vscode.window.showErrorMessage(`Key not found: ${keyFullPath}`);
//         return;
//     }
//     const newResult: { [key: string]: any; } = {};
//     for (const [key, value] of Object.entries(result)) {
//         if (key === lastKey) {
//             newResult[newKey] = value;
//         } else {
//             newResult[key] = value;
//         }
//     }
//     keys.reduce<any>((obj, key, index, array) => {
//         if (index === array.length - 1) {
//             obj[key] = newResult;
//         }
//         return obj[key];
//     }, contentJson);
//     writeJsonFileSync(filePath, contentJson);
//     vscode.window.showInformationMessage('Key renamed from ' + lastKey + ' to ' + newKey + ' in ' + filePath);
// }

// function getKeyValue(filePath: string, keyFullPath: string): string | false {
//     const contentJson = loadJsonFileSync(filePath);
//     const keys = keyFullPath.split('.');
//     const lastKey = keys.pop() as string;
//     let parentKey = contentJson;
//     for (const key of keys) {
//         if (!parentKey[key]) {
//             return false;
//         }
//         parentKey = parentKey[key];
//     }
//     return parentKey[lastKey] ?? false;
// }

// function getHoverTranslation(keyFullPath: string): vscode.MarkdownString {
//     const settings = vscode.workspace.getConfiguration('json-i18n-key');
//     const translationFiles: TranslationFile[] = settings.get('translationFiles', []);
//     const hoverMessage = new vscode.MarkdownString();
//     hoverMessage.appendMarkdown(`**Key:** \`${keyFullPath}\`\n\n`);
//     for (const translationFile of translationFiles) {
//         if (translationFile.filePath) {
//             const keyValue = getKeyValue(translationFile.filePath, keyFullPath);
//             hoverMessage.appendMarkdown(`**${translationFile.lang.toUpperCase()}:** ${keyValue || 'N/A'}\n\n`);
//         }
//     }
//     return hoverMessage;
// }

// function getKeys(keyFullPath: string): string[] {
//     const settings = vscode.workspace.getConfiguration('json-i18n-key');
//     const translationFiles: TranslationFile[] = settings.get('translationFiles', []);
//     const enFile = translationFiles.find(file => file.lang === 'en');
//     if (!enFile || enFile.filePath === '') {
//         console.error('English translation file not found');
//         return [];
//     }
//     const contentJson = loadJsonFileSync(enFile.filePath);
//     const keys = keyFullPath.split('.');
//     const lastKey = keys.pop() as string;
//     let parentKey = contentJson;

//     for (const key of keys) {
//         if (!parentKey[key]) {
//             return [];
//         }
//         parentKey = parentKey[key];
//     }

//     return Object.keys(parentKey).filter(key => key.toLowerCase().startsWith(lastKey.toLowerCase()));
// }

// export {
//     findKeyPosition,
//     addKey,
//     checkExistKey,
//     renameKey,
//     getKeyValue,
//     getHoverTranslation,
//     getKeys
// };
