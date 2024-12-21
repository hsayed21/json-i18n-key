import * as vscode from "vscode";
import * as fs from "fs";
import { glob } from "glob";
import { JsonI18nKeySettings } from "../models/JsonI18nKeySettings";
import { loadJsonFileSync, writeJsonFileSync } from "../utils/fileUtils";
import { GetAlli18nFilesKeys, removeKeyInObject } from "../utils/jsonUtils";

export async function cleanupUnusedKeys() {
	try {
		const scanPatterns = JsonI18nKeySettings.instance.scanFilePatterns;
		const excludePatterns = JsonI18nKeySettings.instance.excludePatterns;

		if (!vscode.workspace.workspaceFolders) {
			throw new Error("No workspace folder open");
		}

		const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

		const allKeys = GetAlli18nFilesKeys();

		const usedKeys = new Set<string>();
		const files = await glob(scanPatterns, {
			cwd: workspaceRoot,
			ignore: excludePatterns,
		});

		for (const file of files) {
			const fileContent = fs.readFileSync(`${workspaceRoot}/${file}`, "utf8");
			allKeys.forEach((key) => {
				const regex = new RegExp(`['"]${key}['"]`);
				if (regex.test(fileContent)) {
					usedKeys.add(key);
				}
			});
		}

		const unusedKeys = Array.from(allKeys).filter((key) => !usedKeys.has(key));

		if (unusedKeys.length === 0) {
			vscode.window.showInformationMessage("No unused translation keys found!");
			return;
		}

		const proceed = await vscode.window.showWarningMessage(
			`Found ${unusedKeys.length} unused translation keys. Remove them?`,
			"Yes",
			"No"
		);

		if (proceed !== "Yes") return;

		// Remove unused keys from all translation files
		for (const file of JsonI18nKeySettings.instance.translationFiles) {
			if (!fs.existsSync(file.filePath)) continue;

			const content = loadJsonFileSync(file.filePath);
			if (content === null) continue;

			let modified = false;

			for (const key of unusedKeys) {
				if (removeKeyInObject(content, key)) {
					modified = true;
				}
			}

			if (modified) {
				writeJsonFileSync(file.filePath, content);
			}
		}

		vscode.window.showInformationMessage(
			`Successfully removed ${unusedKeys.length} unused translation keys!`
		);
	} catch (error) {
		vscode.window.showErrorMessage(`Error cleaning up unused keys: ${error}`);
	}
}
