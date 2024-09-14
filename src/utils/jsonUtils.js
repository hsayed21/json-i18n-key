const vscode = require('vscode');
const { loadJsonFile, writeJsonFile, loadJsonFileSync, writeJsonFileSync } = require('./fileUtils');

function findKeyPosition(editor, path) {
    const document = editor.document;
    const keys = path.split('.');
    let regexPatterns = keys.map((key, index) => {
        let regexString;
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

function addKey(filePath, keyFullPath, value) {
    const contentJson = loadJsonFileSync(filePath);
    let keys = keyFullPath.split('.');
    let lastKey = keys.pop();
    let parentKey = contentJson;
    for (let key of keys) {
        if (!parentKey[key]) {
            parentKey[key] = {}; // Create intermediate objects if they don't exist
        }
        parentKey = parentKey[key];
    }
    parentKey[lastKey] = !value ? lastKey : value;
    writeJsonFileSync(filePath, contentJson);
    // show success message
    vscode.window.showInformationMessage('Key added to ' + filePath);
}

function checkExistKey(filePath, keyFullPath) {
    const contentJson = loadJsonFileSync(filePath);
    let keys = keyFullPath.split('.');
    let lastKey = keys.pop();
    let parentKey = contentJson;
    for (let key of keys) {
        if (!parentKey[key]) {
            return false;
        }
        parentKey = parentKey[key];
    }
    return parentKey[lastKey] !== undefined;
}

function renameKey(filePath, keyFullPath, newKey) {
    const contentJson = loadJsonFileSync(filePath);
    const keys = keyFullPath.split('.');
    const lastKey = keys.pop();

    // Use reduce to efficiently traverse the object
    const result = keys.reduce((acc, key, index, array) => {
        if (acc && typeof acc === 'object' && key in acc) {
            return acc[key];
        }
        vscode.window.showErrorMessage(`Key not found: ${array.slice(0, index + 1).join('.')}`);
    }, contentJson);

    if (typeof result !== 'object' || !(lastKey in result)) {
        vscode.window.showErrorMessage(`Key not found: ${keyFullPath}`);
        return false;
    }

    // Inside the renameKey function, replace the renaming logic with:
    const newResult = {};
    for (const [key, value] of Object.entries(result)) {
        if (key === lastKey) {
            newResult[newKey] = value;
        } else {
            newResult[key] = value;
        }
    }
    // Replace the original object with the new one
    keys.reduce((obj, key, index, array) => {
        if (index === array.length - 1) {
            obj[key] = newResult;
        }
        return obj[key];
    }, contentJson);

    writeJsonFileSync(filePath, contentJson);
    // show success message
    vscode.window.showInformationMessage('Key renamed from ' + lastKey + ' to ' + newKey + ' in ' + filePath);
}

function getKeyValue(filePath, keyFullPath) {
    const contentJson = loadJsonFileSync(filePath);
    let keys = keyFullPath.split('.');
    let lastKey = keys.pop();
    let parentKey = contentJson;
    for (let key of keys) {
        if (!parentKey[key]) {
            return false;
        }
        parentKey = parentKey[key];
    }

    return parentKey[lastKey];
}

function getHoverTranslation(keyFullPath) {
    const settings = vscode.workspace.getConfiguration('json-i18n-key');
    const translationFiles = settings.get('translationFiles', []);
    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.appendMarkdown(`**Key:** \`${keyFullPath}\`\n\n`);
    for (const translationFile of translationFiles) {
        if (translationFile.filePath) {
            const keyValue = getKeyValue(translationFile.filePath, keyFullPath);
            hoverMessage.appendMarkdown(`**${translationFile.lang.toUpperCase()}:** ${keyValue || 'N/A'}\n\n`);
        }
    }

    return hoverMessage;
}

function getKeys(keyFullPath) {
    const settings = vscode.workspace.getConfiguration('json-i18n-key');
    const translationFiles = settings.get('translationFiles', []);
    const enFile = translationFiles.find(file => file.lang === 'en');
    if (!enFile || enFile.filePath === '') {
        console.error('English translation file not found');
        return [];
    }
    const contentJson = loadJsonFileSync(enFile.filePath);
    let keys = keyFullPath.split('.');
    let lastKey = keys.pop();
    let parentKey = contentJson;
    let keyList = [];

    for (let key of keys) {
        if (!parentKey[key]) {
            return false;
        }
        parentKey = parentKey[key];
    }

    for (let key in parentKey) {
        if (key.toLowerCase().startsWith(lastKey.toLowerCase())) {
            keyList.push(key);
        }
    }

    return keyList;
}

module.exports = {
    findKeyPosition,
    addKey,
    checkExistKey,
    renameKey,
    getKeyValue,
    getHoverTranslation,
    getKeys
};