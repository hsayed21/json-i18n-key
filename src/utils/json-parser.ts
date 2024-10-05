import { loadJsonFileSync, writeJsonFileSync } from './fileUtils';
import * as vscode from 'vscode';
import { JSONPath } from 'jsonpath-plus';
import { checkExistKey, getKeyValue, getParentObject } from './jsonUtils';


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

            if (!checkExistKey(this.jsonFilePath, keyPath)) {
                throw new Error("No match found for the specified key path.");
            }

            const matches = this.getRegexMatches(jsonData, keyPath);
            if (matches) {

                let beforeStart = jsonData.slice(0, matches.startChangeIndex);
                let afterEnd = jsonData.slice(matches.endChangeIndex);
                const trimedBeforeStart = beforeStart.trim();

                const haveComma = matches.hasComma && trimedBeforeStart.charAt(trimedBeforeStart.length - 1) !== '{';
                let comma = haveComma ? ',' : '';
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
                else
                {
                    if (trimedBeforeStart.charAt(trimedBeforeStart.length - 1) === ',') {
                        const lastCommaIndex = beforeStart.lastIndexOf(',');
                        if (lastCommaIndex !== -1) {
                            beforeStart = beforeStart.slice(0, lastCommaIndex);
                        }
                    }
                }

                const updatedContent = beforeStart + comma + afterEnd;
                writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
                vscode.window.showInformationMessage(`Key removed: '${keyPath}' from '${this.jsonFilePath}'.`);
            } else {
                throw new Error("No match found for the specified key path.");
            }
        }
        else {
            const parent = getParentObject(jsonData, keyPath);
            if (parent) {
                const lastKey = keyPath.split('.').pop() as string;
                if ((lastKey in parent) === false) {
                    throw new Error("Key path not found: " + keyPath);
                }
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

            if (!checkExistKey(this.jsonFilePath, keyPath)) {
                throw new Error("No match found for the specified key path.");
            }

            const matches = this.getRegexMatches(jsonData, keyPath);

            if (matches) {
                const value = getKeyValue(this.jsonFilePath, keyPath);
                const lastKey = keyPath.split('.').pop() as string;
                const oldKeyValue = value;
                const objData = `"${[newKey]}": "${oldKeyValue}"${matches.comma}`;
                const updatedContent = jsonData.slice(0, matches.startChangeIndex) + objData + jsonData.slice(matches.endChangeIndex);
                writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
                vscode.window.showInformationMessage(`Key renamed from '${lastKey}' to '${newKey}' in '${this.jsonFilePath}'.`);
            } else {
                throw new Error("No match found for the specified key path.");
            }
        }
        else {
            const parent = getParentObject(jsonData, keyPath);
            if (parent) {
                const lastKey = keyPath.split('.').pop() as string;
                if ((lastKey in parent) === false) {
                    throw new Error("Key path not found: " + keyPath);
                }
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
            if (!checkExistKey(this.jsonFilePath, keyPath)) {
                throw new Error("No match found for the specified key path.");
            }

            const matches = this.getRegexMatches(jsonData, keyPath);
            if (matches) {
                const key = keyPath.split('.').pop();
                const objData = `"${[key]}": "${newValue}"${matches.comma}`;

                const updatedContent = jsonData.slice(0, matches.startChangeIndex) + objData + jsonData.slice(matches.endChangeIndex);
                writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
                vscode.window.showInformationMessage(`Key updated: '${keyPath}' in '${this.jsonFilePath}'.`);
            } else {
                throw new Error("No match found for the specified key path.");
            }
        }
        else {
            const parent = getParentObject(jsonData, keyPath);
            if (parent) {
                const lastKey = keyPath.split('.').pop() as string;
                if ((lastKey in parent) === false) {
                    throw new Error("Key path not found: " + keyPath);
                }
                parent[lastKey] = newValue;
                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
                vscode.window.showInformationMessage(`Key updated: '${keyPath}' in '${this.jsonFilePath}'.`);
            }
            else {
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
            let lastKeyObj = JSONPath({ json: JSON.parse(jsonData), path: parentPath, resultType: "all" }).pop();
            if (lastKeyObj.parentProperty == newKey || (newKey! in lastKeyObj.parent)) {
                this.updateKey(keyPath, value);
                return;
            }
            const lastKeyPath = parentKeys.join('.') + "." + lastKeyObj.parentProperty;

            const matches = this.getRegexMatches(jsonData, lastKeyPath)
            if (matches) {
                const commaIndex = matches.fullMatch.lastIndexOf(",", matches.startChangeIndex);
                const indent = matches.fullMatch.slice(commaIndex + 1, matches.startChangeIndex);
                const objData = `${matches.keyValue}, ${indent}"${newKey}": "${value}"`;
                const updatedContent = jsonData.slice(0, matches.startChangeIndex) + objData + jsonData.slice(matches.endChangeIndex);
                writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
                vscode.window.showInformationMessage('Key added to ' + this.jsonFilePath);
            } else {
                throw new Error("No match found for the specified key path.");
            }
        }
        else {
            const parent = getParentObject(jsonData, keyPath);
            if (parent)
            {
                const lastKey = keyPath.split('.').pop() as string;
                if (lastKey in parent) {
                    this.updateKey(keyPath, value || lastKey);
                    return;
                }
                parent[lastKey] = value || lastKey;
                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
                vscode.window.showInformationMessage('Key added to ' + this.jsonFilePath);
            }
            else
            {
                throw new Error('Cannot find parent object for key path:'+ keyPath);
            }
        }
    }

    private getRegexMatches(jsonData: string, keyPath: string): {
        fullMatch: string;
        keyValue: string;
        comma: string;
        hasComma: boolean;
        startChangeIndex: number;
        endChangeIndex: number;
    } | null {
        const regexPattern = this.createRegexPattern(keyPath);
        const matches = regexPattern.exec(jsonData);

        if (matches) {
            return {
                fullMatch: matches[0],
                keyValue: matches[1],
                comma: matches[2],
                hasComma: matches[2] === ',',
                startChangeIndex: matches[0].lastIndexOf(matches[1]),
                endChangeIndex: matches[0].length,
            };
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
