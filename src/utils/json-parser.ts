import { loadJsonFileSync, writeJsonFileSync } from './fileUtils';
import * as vscode from 'vscode';
import { checkExistKey, getOrCreateParentObject } from './jsonUtils';
import { JsonStringManipulator } from './JsonStringManipulator';
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import path from 'path';


export class JsonParser {
    private jsonFilePath: string;
    private preserveFormatting: boolean;
    private fileName: string;
    constructor(jsonFilePath: string, preserveFormatting: boolean = false) {
        this.jsonFilePath = jsonFilePath;
        this.fileName = path.basename(jsonFilePath);
        this.preserveFormatting = preserveFormatting;
    }

    removeKey(keyPath: string) {
        const jsonData = loadJsonFileSync(this.jsonFilePath, this.preserveFormatting);
        const key = keyPath.split('.').pop() as string;

        if (this.preserveFormatting) {
            if (!checkExistKey(this.jsonFilePath, keyPath)) {
                throw new Error("No match found for the specified key path.");
            }

            const updatedContent = new JsonStringManipulator(jsonData).removeKey(keyPath);
            writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
        }
        else {
            const parent = getOrCreateParentObject(jsonData, keyPath);
            if (parent) {
                if ((key in parent) === false) {
                    throw new Error(`Key path not found in ${this.fileName}`);
                }
                delete parent[key];
                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
            } else {
                throw new Error(`Key path not found in ${this.fileName}`);
            }
        }

        vscode.window.showInformationMessage(`${key}: Key removed from ${this.fileName}`);
    }

    renamekey(keyPath: string, newKey: string) {
        const jsonData = loadJsonFileSync(this.jsonFilePath, this.preserveFormatting);
        const key = keyPath.split('.').pop() as string;

        if (this.preserveFormatting) {
            if (!checkExistKey(this.jsonFilePath, keyPath)) {
                throw new Error("No match found for the specified key path.");
            }

            const updatedContent = new JsonStringManipulator(jsonData).renameKey(keyPath, newKey);
            writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
        }
        else {
            const parent = getOrCreateParentObject(jsonData, keyPath);
            if (parent) {
                if ((key in parent) === false) {
                    throw new Error(`Key path not found in ${this.fileName}`);
                }
                parent[newKey] = parent[key];
                delete parent[key];
                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
            } else {
                throw new Error(`Key path not found in ${this.fileName}`);
            }
        }

        vscode.window.showInformationMessage(`Key renamed from '${key}' to '${newKey}' in '${this.fileName}'`);
    }

    updateKey(keyPath: string, newValue: string) {
        const jsonData = loadJsonFileSync(this.jsonFilePath, this.preserveFormatting);
        const key = keyPath.split('.').pop() as string;

        if (!JsonI18nKeySettings.instance.overrideKeyIfExistsWhenUpdating && checkExistKey(this.jsonFilePath, keyPath)) {
            vscode.window.showErrorMessage(key + ': Key already exists in ' + this.fileName);
            return;
        }

        if (this.preserveFormatting) {
            if (!checkExistKey(this.jsonFilePath, keyPath)) {
                throw new Error("No match found for the specified key path.");
            }

            const updatedContent = new JsonStringManipulator(jsonData).addKey(keyPath, newValue);
            writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
        }
        else {
            const parent = getOrCreateParentObject(jsonData, keyPath);
            if (parent) {
                if ((key in parent) === false) {
                    throw new Error(`Key path not found in ${this.fileName}`);
                }
                parent[key] = newValue;
                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
            }
            else {
                throw new Error(`Key path not found in ${this.fileName}`);
            }
        }

        vscode.window.showInformationMessage(`${key}: Key updated in '${this.fileName}'`);
    }

    addKey(keyPath: string, value: string, overrideForCopy: boolean = false) {
        const jsonData = loadJsonFileSync(this.jsonFilePath, this.preserveFormatting);
        const key = keyPath.split('.').pop() as string;

        if (!JsonI18nKeySettings.instance.overrideKeyIfExistsWhenAdding && checkExistKey(this.jsonFilePath, keyPath) && !overrideForCopy) {
            vscode.window.showErrorMessage(`${key}: Key already exists in ${this.fileName}`);
            return;
        }

        if (this.preserveFormatting) {
            const updatedContent = new JsonStringManipulator(jsonData).addKey(keyPath, value);
            writeJsonFileSync(this.jsonFilePath, updatedContent, this.preserveFormatting);
        }
        else {
            const parent = getOrCreateParentObject(jsonData, keyPath);
            if (key in parent) {
                this.updateKey(keyPath, value || key);
                return;
            }
            else {
                parent[key] = value || key;
                writeJsonFileSync(this.jsonFilePath, jsonData, this.preserveFormatting);
            }
        }

        vscode.window.showInformationMessage(`${key}: Key added to ${this.fileName}`);
    }
}
