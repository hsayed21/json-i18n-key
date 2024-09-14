const vscode = require("vscode");

async function getTranslationFromCopilot(text, lang) {

	// Retrieving all models
	// const models = await vscode.lm.selectChatModels();
	// console.log(models);

	// Retrieving a specific model
	const [model] = await vscode.lm.selectChatModels({
		vendor: "copilot",
		family: "gpt-3.5-turbo"
	});

	//Creating a prompt
	if (!text || !lang) {
		return false;
	}

	const messages = [
		vscode.LanguageModelChatMessage.User(`Translate "${text}" to ${lang}. Return only the translated text.`),
	];

	// Sending the prompt
	let chatResponse = undefined;
	try {
		chatResponse = await model.sendRequest( messages, {}, new vscode.CancellationTokenSource().token);
	} catch (err) {
		if (err instanceof vscode.LanguageModelError) {
			console.log(err.message, err.code, err.cause);
		} else {
			// throw err;
		}
		return false;
	}

	let allFragments = [];
	for await (const fragment of chatResponse.text) {
		allFragments.push(fragment);
	}

	const translatedText = allFragments.join("");
	if (translatedText.includes("can't assist")) {
		return false;
	}
	return translatedText;
}

module.exports = {
	getTranslationFromCopilot
};