import * as vscode from "vscode";
import { JsonI18nKeySettings } from "../models/JsonI18nKeySettings";
import { flattenKeysWithValues, getKeyValuesFromAllFiles, loadKeys } from "../utils/jsonUtils";
import { convertCase } from "../utils/globalUtils";
import { autoDetectI18nFiles } from "../options/auto-detect-i18n-files";
import { KEY_PATH_REGEX } from "../utils/constants";
import { JsonParser } from "../utils/json-parser";
import { loadJsonFileSync } from "../utils/fileUtils";

export async function copyKeyCommand() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}

	await autoDetectI18nFiles();

	let keyPath: string | undefined = undefined;
	let originalKeyPath: string | undefined = undefined;
	const settings = JsonI18nKeySettings.instance;
	if (settings.translationFiles.length === 0) {
		vscode.window.showErrorMessage("No translation files found");
		return;
	}

	if (settings.typeOfGetKey === "Manual") {
		keyPath = await vscode.window.showInputBox({ prompt: "Enter Key Path:" });
	} else if (settings.typeOfGetKey === "Clipboard") {
		const clipboard = await vscode.env.clipboard.readText();
		keyPath = clipboard;
	} else {
		const position = editor.selection.active;
		// Match only keypath without spaces
		const range = editor.document.getWordRangeAtPosition(position, KEY_PATH_REGEX);
		if (range) {
			keyPath = editor.document.getText(range);
			// Clean up quotes
			keyPath = keyPath.replace(/^['"`]|['"`]$/g, "");

			if (keyPath.includes(" ")) {
				vscode.window.showErrorMessage("Key path cannot contain spaces");
				return;
			}
		} else {
			vscode.window.showErrorMessage("Can't get key path by regex");
			return;
		}
	}

	if (keyPath === undefined) return;

	if (!keyPath || keyPath.includes(" ")) {
		vscode.window.showErrorMessage("Key path is required and cannot contain spaces");
		return;
	}

	originalKeyPath = keyPath;

	const jsonData = flattenKeysWithValues(
		loadJsonFileSync(JsonI18nKeySettings.instance.enJsonFilePath)
	);

	keyPath = await new Promise<string>((resolve) => {
		const quickPick = vscode.window.createQuickPick();
		quickPick.matchOnDescription = true;
		quickPick.placeholder = "Select an existing key to copy values or none to continue";

		const allItems = jsonData.map(({ key, value }) => ({
			label: key,
			description: String(value),
		}));

		quickPick.items = [
			{ label: "$(close) None", description: "Continue without selecting existing key" },
			...allItems,
		];

		quickPick.onDidAccept(() => {
			let selectedKey = "";
			if (quickPick.selectedItems.length > 0) {
				const selected = quickPick.selectedItems[0];
				selectedKey = selected.label;
			}
			if (selectedKey === "$(close) None") {
				selectedKey = "";
			} else {
				selectedKey = selectedKey || quickPick.value;
			}

			quickPick.hide();
			resolve(selectedKey ?? "");
		});

		quickPick.onDidHide(() => {
			quickPick.dispose();
		});

		quickPick.show();
	});

	if (!keyPath) {
		return;
	}

	const keyValues = getKeyValuesFromAllFiles(keyPath);
	for (const value of keyValues) {
		new JsonParser(value.filePath, settings.preserveFormating).addKey(
			originalKeyPath,
			value.value,
			true
		);
	}
}
