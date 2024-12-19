import * as vscode from "vscode";
import * as fs from "fs";
import { JsonI18nKeySettings } from '../models/JsonI18nKeySettings';
import path from "path";

export async function autoDetectI18nFiles() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	const autoDetect = JsonI18nKeySettings.instance.autoDetectTranslations;
	const thereAnyEmptyFiles = JsonI18nKeySettings.instance.translationFiles.some((file) => !file.filePath);
	if (!workspaceFolders || !autoDetect || (JsonI18nKeySettings.instance.translationFiles.length > 0 && !thereAnyEmptyFiles)) {
		return;
	}

	const translationFiles = await findTranslationFiles(workspaceFolders[0].uri.fsPath);
	// Group by language and count
	const langCount: { [key: string]: { count: number; paths: string[] } } = {};
	translationFiles.forEach((file) => {
		const lang = path.basename(file).split(".")[0];
		if (!langCount[lang]) {
			langCount[lang] = { count: 0, paths: [] };
		}
		langCount[lang].count += 1;
		langCount[lang].paths.push(file);
	});

	const result = Object.entries(langCount).map(([lang, data]) => ({
		lang,
		count: data.count,
		paths: data.paths, // Include all paths for the language
	}));

	if (result.length > 0) {
		const updatedFiles = [...JsonI18nKeySettings.instance.translationFiles];

		let flag: boolean = false;

		for (const element of result) {
			const { lang, count, paths } = element;

			// Check if the language already exists in the config
			const existingFile = updatedFiles.find((file) => file.lang === lang);
			if (existingFile && existingFile.filePath)
        continue;

			if (count === 1) {
				if (existingFile === undefined){
					updatedFiles.push({
						lang,
						filePath: paths[0],
						isDefault: lang === "en",
					});
				}
				else
				{
					existingFile.filePath = paths[0];
				}
				vscode.window.showInformationMessage(`Detected language: ${lang}`);
				flag = true;
			} else if (count > 1) {
				const selectedFile = await vscode.window.showQuickPick(paths, {
					placeHolder: `Multiple files detected for language: ${lang}. Select one:`,
				});

				if (selectedFile) {
					if (existingFile === undefined) {
						updatedFiles.push({
							lang,
							filePath: selectedFile,
							isDefault: lang === "en",
						});
					} else {
						existingFile.filePath = selectedFile;
					}

					vscode.window.showInformationMessage( `Language ${lang} set to ${selectedFile}`);
					flag = true;
				}
			}
		}

		if (flag)
		{
			// Update the configuration
			await JsonI18nKeySettings.instance.updateConfig("translationFiles", updatedFiles.sort((a, b) => a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
			vscode.window.showInformationMessage("Translation files configuration updated successfully!");
		}
	}
}

async function findTranslationFiles(folderPath: string): Promise<string[]> {
	const translationFiles = [];
	const files = fs.readdirSync(folderPath);
	let definedLangs = JsonI18nKeySettings.instance.translationFiles.map((file) => file.lang);
	if (definedLangs.length === 0) {
		definedLangs.push("en", "ar");
  }
	const match = new RegExp(`^(${definedLangs.join("|")})\\.json$`, "i"); // Case-insensitive match

	for (const file of files) {
		// Skip dot files
		if (file.startsWith(".")) {
			continue;
		}

		const filePath = path.join(folderPath, file);
		if (fs.statSync(filePath).isDirectory()) {
			translationFiles.push(...(await findTranslationFiles(filePath)));
		} else if (match.test(file)) {
			translationFiles.push(filePath);
		}
	}

	return translationFiles;
}
