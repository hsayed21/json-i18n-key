import { loadJsonFileSync, writeJsonFileSync } from './fileUtils';
import * as vscode from 'vscode';
import { checkExistKey, getOrCreateParentObject } from './jsonUtils';
import { JsonStringManipulator } from './JsonStringManipulator';


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

            const updatedContent = new JsonStringManipulator(jsonData).removeKey(keyPath);
            writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
            vscode.window.showInformationMessage(`Key removed: '${keyPath}' from '${this.jsonFilePath}'.`);
        }
        else {
            const parent = getOrCreateParentObject(jsonData, keyPath);
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

            const lastKey = keyPath.split('.').pop() || "";
            const updatedContent = new JsonStringManipulator(jsonData).renameKey(keyPath, newKey);
            writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
            vscode.window.showInformationMessage(`Key renamed from '${lastKey}' to '${newKey}' in '${this.jsonFilePath}'.`);
        }
        else {
            const parent = getOrCreateParentObject(jsonData, keyPath);
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
            const updatedContent = new JsonStringManipulator(jsonData).addKey(keyPath, newValue);
            writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
            vscode.window.showInformationMessage(`Key updated: '${keyPath}' in '${this.jsonFilePath}'.`);
        }
        else {
            const parent = getOrCreateParentObject(jsonData, keyPath);
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
            const updatedContent = new JsonStringManipulator(jsonData).addKey(keyPath, value);
            writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
            vscode.window.showInformationMessage('Key added to ' + this.jsonFilePath);
        }
        else {
            const parent = getOrCreateParentObject(jsonData, keyPath);
            const lastKey = keyPath.split('.').pop() as string;
            if (lastKey in parent) {
                this.updateKey(keyPath, value || lastKey);
            }
            else {
                parent[lastKey] = value || lastKey;
                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
                vscode.window.showInformationMessage('Key added to ' + this.jsonFilePath);
            }
        }
    }
}
