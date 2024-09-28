import { loadJsonFileSync, writeJsonFileSync } from './fileUtils';
import { TranslationFile } from '../models/translationFile';
import { printChannelOutput } from '../extension';
// import * as jp from 'jsonpath';
import * as vscode from 'vscode';
import {JSONPath} from 'jsonpath-plus';

export class JsonParser {
    private jsonFilePath: string;
    private preserveFormatting: boolean;
    constructor(jsonFilePath: string, preserveFormatting: boolean = false) {
        this.jsonFilePath = jsonFilePath;
        this.preserveFormatting = preserveFormatting;
    }

    removeKey(keyPath: string) {
        const jsonData = loadJsonFileSync(this.jsonFilePath, this.preserveFormatting);
        if (this.preserveFormatting) {
            const regexPattern = this.createRegexPattern(keyPath);
            const matches = regexPattern.exec(jsonData);

            if (matches) {
                const fullMatch = matches[0];
                const keyValue = matches[1];
                const isComma = matches[2] === ',';
                const startChangeIndex = fullMatch.lastIndexOf(keyValue);
                const endChangeIndex = fullMatch.length;

                let beforeStart = jsonData.slice(0, startChangeIndex);
                let afterEnd = jsonData.slice(endChangeIndex);
                const trimedBeforeStart = beforeStart.trim();

                const haveComma = isComma && trimedBeforeStart.charAt(trimedBeforeStart.length - 1) !== '{';
                const comma = haveComma ? ',' : '';
                if (!haveComma) {
                    if (trimedBeforeStart.charAt(trimedBeforeStart.length - 1) === '{') {
                        afterEnd = afterEnd.trimStart();
                    }
                    else {
                        const lastCommaIndex = beforeStart.lastIndexOf(',');
                        if (lastCommaIndex !== -1) {
                            beforeStart = beforeStart.slice(0, lastCommaIndex);
                        }
                        else {
                            afterEnd = afterEnd.trimStart();
                        }
                    }
                }

                const updatedContent = beforeStart + comma + afterEnd;
                writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
            } else {
                throw new Error("No match found for the specified key path.");
            }
        }
        else {

            const keys = keyPath.split('.');
            const lastKey = keys.pop() as string;

            if (!lastKey) {
                throw new Error("Invalid key path: " + keyPath);
            }

            // Navigate to the parent object
            let parent = jsonData;
            for (const key of keys) {
                if (parent && typeof parent === 'object' && key in parent) {
                    parent = parent[key];
                } else {
                    throw new Error("Key path not found: " + keyPath);
                }
            }

            // Remove the key
            if (parent && typeof parent === 'object' && lastKey in parent) {
                delete parent[lastKey];

                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
                vscode.window.showInformationMessage(`Key removed: '${keyPath}' from '${this.jsonFilePath}'.`);
            } else {
                throw new Error("Key path not found: " + keyPath);
            }

        }
    }

    renamekey(keyPath: string, newKey: string) {
        const jsonData = loadJsonFileSync(this.jsonFilePath, this.preserveFormatting);
        if (this.preserveFormatting) {
            const regexPattern = this.createRegexPattern(keyPath);
            const matches = regexPattern.exec(jsonData);

            if (matches) {
                const fullMatch = matches[0];
                const keyValue = matches[1];
                const comma = matches[2] === ',';
                const startChangeIndex = fullMatch.lastIndexOf(keyValue);
                const endChangeIndex = fullMatch.length;

                // const oldKeyValue = jp.value(jsonData, keyPath);
                // const objData = `"${[newKey]}": "${oldKeyValue}"${comma}`;
                // const updatedContent = jsonData.slice(0, startChangeIndex) + objData + jsonData.slice(endChangeIndex);
                // writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
            } else {
                throw new Error("No match found for the specified key path.");
            }
        }
        else {
            const keys = keyPath.split('.');
            const lastKey = keys.pop() as string;

            if (!lastKey) {
                throw new Error("Invalid key path: " + keyPath);
            }

            // Navigate to the parent object
            let parent = jsonData;
            for (const key of keys) {
                if (parent && typeof parent === 'object' && key in parent) {
                    parent = parent[key];
                } else {
                    throw new Error("Key path not found: " + keyPath);
                }
            }

            // Rename the key
            if (parent && typeof parent === 'object' && lastKey in parent) {
                parent[newKey] = parent[lastKey];
                delete parent[lastKey];

                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
                vscode.window.showInformationMessage(`Key renamed from '${lastKey}' to '${newKey}' in '${this.jsonFilePath}'.`);
            } else {
                throw new Error("Key path not found: " + keyPath);
            }
        }
    }


    updateKey(keyPath: string, newValue: string) {
        const jsonData = loadJsonFileSync(this.jsonFilePath, this.preserveFormatting);
        if (this.preserveFormatting) {
            const regexPattern = this.createRegexPattern(keyPath);
            const matches = regexPattern.exec(jsonData);

            if (matches) {
                const fullMatch = matches[0];
                const keyValue = matches[1];
                const comma = matches[2] === ',';
                const startChangeIndex = fullMatch.lastIndexOf(keyValue);
                const endChangeIndex = fullMatch.length;

                const key = keyPath.split('.').pop();
                const objData = `"${[key]}": "${newValue}"${comma}`;

                const updatedContent = jsonData.slice(0, startChangeIndex) + objData + jsonData.slice(endChangeIndex);
                writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
            } else {
                throw new Error("No match found for the specified key path.");
            }
        }
        else {
            const keys = keyPath.split('.');
            const lastKey = keys.pop() as string;

            if (!lastKey) {
                throw new Error("Invalid key path: " + keyPath);
            }

            // Navigate to the parent object
            let parent = jsonData;
            for (const key of keys) {
                if (parent && typeof parent === 'object' && key in parent) {
                    parent = parent[key];
                } else {
                    throw new Error("Key path not found: " + keyPath);
                }
            }

            // Update the key
            if (parent && typeof parent === 'object' && lastKey in parent) {
                parent[lastKey] = newValue;

                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
                vscode.window.showInformationMessage(`Key updated: '${keyPath}' in '${this.jsonFilePath}'.`);
            } else {
                throw new Error("Key path not found: " + keyPath);
            }
        }
    }

    addKey(keyPath: string, value: string) {
        const jsonData = loadJsonFileSync(this.jsonFilePath, this.preserveFormatting);

        if (this.preserveFormatting) {
            const parentKeys = keyPath.split('.');
            const newKey = parentKeys.pop();
            const parentPath = "$." + parentKeys.join('.') + ".*";
            // let lastKey = jp.paths(jsonData, parentPath).pop();
            // const lastKeyName = lastKey ? [lastKey.length - 1] : "";
            // if (lastKeyName == newKey) {
            //     this.updateKey(keyPath, value);
            //     return;
            // }
            // lastKey = jp.stringify(lastKey).replace("$.", "");

            // const regexPattern = this.createRegexPattern(lastKey);
            // const matches = regexPattern.exec(jsonData);
            // if (matches) {
            //     const fullMatch = matches[0];
            //     const keyValue = matches[1];
            //     const comma = matches[2] === ',';
            //     const startChangeIndex = fullMatch.lastIndexOf(keyValue);
            //     const endChangeIndex = fullMatch.length;
            //     const commaIndex = fullMatch.lastIndexOf(",", startChangeIndex);
            //     const indent = fullMatch.slice(commaIndex + 1, startChangeIndex);
            //     const objData = `${keyValue}, ${indent}"${newKey}": "${value}"`;
            //     const updatedContent = jsonData.slice(0, startChangeIndex) + objData + jsonData.slice(endChangeIndex);
            //     writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
            // } else {
            //     throw new Error("No match found for the specified key path.");
            // }
        }
        else {
            const keys = keyPath.split('.');
            const lastKey = keys.pop() as string;
            let parentKey = jsonData;
            for (const key of keys) {
                if (!parentKey[key]) {
                    parentKey[key] = {}; // Create intermediate objects if they don't exist
                }
                parentKey = parentKey[key];
            }
            parentKey[lastKey] = value || lastKey;
            writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
            vscode.window.showInformationMessage('Key added to ' + this.jsonFilePath);
        }
    }


    checkExistKey(keyPath: string): boolean {
        const jsonData = loadJsonFileSync(this.jsonFilePath, false);
        return JSONPath({json: jsonData, path: keyPath}).length > 0;
    }

    getKeyValue(keyPath: string, filePath?: string): string {
        let jsonData;
        if (filePath) {
            jsonData = loadJsonFileSync(filePath, false);
        } else {
            jsonData = loadJsonFileSync(this.jsonFilePath, false);
        }
        // return jp.value(jsonData, keyPath);
        return '';
    }

    getKeys(keyPath: string): string[] {
        const settings = vscode.workspace.getConfiguration('json-i18n-key');
        const translationFiles: TranslationFile[] = settings.get('translationFiles', []);
        const enFile = translationFiles.find(file => file.lang === 'en');
        if (!enFile || enFile.filePath === '') {
            printChannelOutput('English translation file not found', true);
            return [];
        }
        const jsonData = loadJsonFileSync(enFile.filePath, false);
        // const parentKey = keyPath.split('.').slice(0, -1).join('.');
        const keys = keyPath.split('.');
        const lastKey = keys.pop() as string;

        // const keysResult = jp.query(jsonData, `$.${keys.join('.')}.${lastKey}*`);
        // return Object.keys(parentKey).filter(key => key.toLowerCase().startsWith(lastKey.toLowerCase()));

        // const keysResult = jp.query(jsonData, `$.${keys.join('.')}.*`);
        // return keysResult.filter(key => key.toLowerCase().startsWith(lastKey.toLowerCase()));
        return [];

    }

    getHoverTranslation(keyPath: string): vscode.MarkdownString {
        const settings = vscode.workspace.getConfiguration('json-i18n-key');
        const translationFiles: TranslationFile[] = settings.get('translationFiles', []);
        const hoverMessage = new vscode.MarkdownString();
        hoverMessage.appendMarkdown(`**Key:** \`${keyPath}\`\n\n`);
        for (const translationFile of translationFiles) {
            if (translationFile.filePath) {
                const keyValue = this.getKeyValue(keyPath, translationFile.filePath);
                hoverMessage.appendMarkdown(`**${translationFile.lang.toUpperCase()}:** ${keyValue || 'N/A'}\n\n`);
            }
        }
        return hoverMessage;
    }

    findKeyPosition(editor: vscode.TextEditor, path: string): vscode.Position | null {
        const document = editor.document;
        const keys = path.split('.');
        const regexPatterns = keys.map((key, index) => {
            let regexString: string;
            if (document.languageId === 'json') {
                regexString = `\\"${key}\\"\\s*:\\s*`;
            } else {
                regexString = index === keys.length - 1 ? `\\b${key}\\b\\s*:\\s*` : `\\b${key}\\b\\s*:`;
            }
            return new RegExp(regexString);
        });

        let currentLevel = 0;
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            if (currentLevel < keys.length - 1) {
                if (regexPatterns[currentLevel].test(lineText)) {
                    currentLevel++;
                }
            } else {
                const finalKeyRegex = regexPatterns[currentLevel];
                const match = finalKeyRegex.exec(lineText);
                if (match) {
                    return new vscode.Position(i, match.index);
                }
            }
        }
        return null;
    }

    private createRegexPattern(keyPath: string) {
        const keys = keyPath.split('.');
        let pattern = '';

        keys.forEach((key, index) => {
            if (index === 0) {
                pattern += `{[\\s\\S]*?"${key}"\\s*:`;
            } else if (index === keys.length - 1) {
                pattern += `[\\s\\S]*?("${key}"\\s*:[\\s\\S]*?".*")(,?)`;
            } else {
                pattern += `[\\s\\S]*?{[\\s\\S]*?"${key}"\\s*:`;
            }
        });

        return new RegExp(pattern, 'g');
    }
}
