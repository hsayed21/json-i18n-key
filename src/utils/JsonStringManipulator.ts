export class JsonStringManipulator {
	private jsonString: string;

	constructor(jsonString: string) {
		this.jsonString = jsonString;
	}

	private parseObjectString(objectString: string): string {
		let lastIndex = 0;
		let bracketCount = 0;

		for (let i = 0; i < objectString.length; i++) {
			lastIndex = i;
			if (objectString[i] === "{") {
				bracketCount++;
				if (bracketCount === 0) break;
			}

			if (objectString[i] === "}") {
				bracketCount--;
				if (bracketCount === 0) break;
			}
		}

		return objectString.slice(0, lastIndex + 1);
	}

	private getObjectMatch(key: string | null, currentObject: string): RegExpMatchArray | null {
		let keyRegex = new RegExp( `(\\s*)"${key}"\\s*:\\s*({(\\s*)[\\s\\S]*})`);
		let match = currentObject.match(keyRegex);
		if (key == null) {
			keyRegex = new RegExp(`({(\\s*)[\\s\\S]*})`); // match root level
			return currentObject.match(keyRegex);
		}

		if (match) {
			const _cleanObj = this.parseObjectString(match[0]);
			return _cleanObj.match(keyRegex);
		}

		return match;
	}

	private isValidateKeyPath(keyPath: string) {
		return keyPath.split(".").every((x) => x.trim() !== "");
	}

	private valueToJsonString(value: any): string {
		if (value === null) return "null";
		if (typeof value === "undefined") return "null";
		if (typeof value === "string") return `"${value.replace(/"/g, '\\"')}"`;
		if (typeof value === "number" || typeof value === "boolean") return String(value);
		if (Array.isArray(value))
			return `[${value.map((v) => this.valueToJsonString(v)).join(", ")}]`;
		if (typeof value === "object") {
			const entries = Object.entries(value)
				.map(([k, v]) => `"${k}": ${this.valueToJsonString(v)}`)
				.join(", ");
			return `{${entries}}`;
		}
		return "null";
	}

	private getObject(keyPath: string): {
		fullObject: string;
		objectContent: string;
		objectStartIndex: number;
		objectEndIndex: number;
		objectIndent: string;
		objectInnerIndent: string;
		currentObject: string;

		needsComma: string;
		newKeyValue: string;
		newLines: string;
	} {
		let currentObject = this.jsonString;
		// const keys = keyPath.slice(0, keyPath.lastIndexOf(".")).split(".");
		const keys = keyPath.split(".");

		let match: RegExpMatchArray | null;

		let fullObject = "";
		let objectContent = "";
		let objectStartIndex = 0;
		let objectEndIndex = 0;
		let objectIndent = "";
		let objectInnerIndent = "";

		let needsComma = "";
		let newKeyValue = "";
		let newLines = "";

		if (!this.isValidateKeyPath(keyPath)) throw new Error("Invalid key Path");

		for (let index = 0; index < keys.length; index++) {

			if (index == keys.length - 1 && keys.length > 1)
				continue;

			const key = keys[index];
			match = this.getObjectMatch(key, currentObject);

			// If Not Exist (New Object)
			if (!match && keys.length - 1 > 0) {
				if (index === 0) // root object
				{
					match = this.getObjectMatch(null, currentObject);
					if (match) {
						const _jsonValue = `{${match[2]}}`;
						const s0 =  this.jsonString.lastIndexOf("}");
						const s1 = this.jsonString.substring(0, s0).trimEnd();
						const s2 = this.jsonString.substring(s0);
						const comma = !(s1.endsWith(",")) ? "," : "";
						const indent = match[2].split(' ')[0];
						this.jsonString = s1 + comma + match[2] + `"${key}": ${_jsonValue}${indent}` + s2;
					}
				}
				else
				{
					const _jsonValue = `{${objectInnerIndent}}`;
					const regexEmptyObj = new RegExp(`{\\s*}`);
					if (!regexEmptyObj.test(objectContent.trim())) {
						needsComma = fullObject.trim().endsWith("}") ? "," : "";
						newKeyValue = `${needsComma}${objectInnerIndent}"${key}": ${_jsonValue}${objectIndent}`;
					} else {
						newKeyValue = `${objectInnerIndent}\t"${key}": ${_jsonValue}${objectIndent}`;
					}

					newLines = fullObject.slice(fullObject.lastIndexOf("}") + 1);
					currentObject = fullObject.replace(
						fullObject,
						fullObject.trimEnd().slice(0, -1).trimEnd() +
							newKeyValue +
							"}" +
							newLines
					);

					this.jsonString =
						this.jsonString.slice(0, objectStartIndex) +
						currentObject +
						this.jsonString.slice(objectEndIndex);
				}
			}

			// Rematch new object after updated
			if (index === 0)
				match = this.getObjectMatch(keys.length - 1 > 0 ? key : null, this.jsonString);
			else
				match = this.getObjectMatch(key, currentObject);

			if (match) {
				if (keys.length - 1 > 0) {
					match[3] = match[3] ?? match[2].replace('"{', "").replace('}"', "");
					fullObject = this.parseObjectString(match[0]);
					objectContent = this.parseObjectString(match[2]);
					objectStartIndex = this.jsonString.indexOf(fullObject);
					objectEndIndex = objectStartIndex + fullObject.length;
					objectIndent = match[1] || "";
					objectInnerIndent = match[3] || "";
					currentObject = fullObject;
				}
				else
				{
					fullObject = this.parseObjectString(match[0]);
					objectContent = this.parseObjectString(match[0]);
					objectStartIndex = this.jsonString.indexOf(fullObject);
					objectEndIndex = objectStartIndex + fullObject.length;
					objectIndent = match[2]?.split(" ")[0] || "";
					objectInnerIndent = match[2] || "";
					currentObject = fullObject;
				}
			}

		}

		return {
			fullObject: fullObject,
			objectContent: objectContent,
			objectStartIndex: objectStartIndex,
			objectEndIndex: objectEndIndex,
			objectIndent: objectIndent,
			objectInnerIndent: objectInnerIndent,
			currentObject,
			needsComma,
			newKeyValue,
			newLines,
		};
	}

	checkKeyExists(objectString: string, key: string): boolean {
		const parseObj = JSON.parse(`${objectString}`);
		return Object.prototype.hasOwnProperty.call(parseObj, key);
	}

	checkKeyExistsInObject(objectString: string, key: string): boolean {
		let depth = 0;
		let inString = false;
		let escaped = false;
		let currentKey = "";

		for (let i = 0; i < objectString.length; i++) {
			const char = objectString[i];

			// Handle string parsing
			if (!escaped && char === '"') {
				inString = !inString;

				// Reset current key when entering a string
				if (inString) {
					currentKey = "";
				}
			}

			// Escape character handling
			if (inString && char === "\\") {
				escaped = !escaped;
				continue;
			}

			// Track object/array depth
			if (!inString) {
				if (char === "{" || char === "[") {
					depth++;
				} else if (char === "}" || char === "]") {
					depth--;
				}
			}

			// Build key while in a string
			if (inString) {
				currentKey += char;
			}

			// Check for key match at root level (depth 0)
			if (
				!inString &&
				depth === 0 &&
				currentKey.replace(/"/g, "") === key &&
				objectString[i + 1] === ":"
			) {
				return true;
			}
		}

		return false;
	}

	renameKeyInObject(objectString: string, oldKey: string, newKey: string): string {
		let result = "";
		let depth = 0;
		let inString = false;
		let escaped = false;
		let currentKey = "";
		let keyFound = false;
		const keys = oldKey.split(".");

		for (let i = 0; i < objectString.length; i++) {
			const char = objectString[i];

			// Handle string parsing
			if (!escaped && char === '"') {
				inString = !inString;
				// Reset current key when entering a string
				if (inString) {
					currentKey = "";
				}
			}

			// Escape character handling
			if (inString && char === "\\") {
				if (i === objectString.length - 1 && objectString[i+1] !== '"') {
					escaped = !escaped;
					continue;
				}
			}

			// Track object/array depth
			if (!inString && keys.length > 1) {
				if (char === "{" || char === "[") {
					depth++;
				} else if (char === "}" || char === "]") {
					depth--;
				}
			}

			// Build key while in a string
			if (inString) {
				currentKey += char;
			}

			// Check for key match at root level (depth 0)
			if (
				!inString &&
				depth === 0 &&
				currentKey.replace(/"/g, "") === oldKey &&
				objectString[i + 1] === ":"
			) {
				// Find the current value
				let j = i + 2; // Start after colon
				while (j < objectString.length && /[\s,]/.test(objectString[j])) j++;

				// Find the end of the current value
				let valueEnd = j;
				let valueDepth = 0;
				let valueInString = false;
				let valueEscaped = false;

				while (valueEnd < objectString.length) {
					const valueChar = objectString[valueEnd];

					// String parsing
					if (!valueEscaped && valueChar === '"') {
						valueInString = !valueInString;
					}

					if (valueInString && valueChar === "\\") {
						valueEscaped = !valueEscaped;
					}

					// Track depth for objects and arrays
					if (!valueInString) {
						if (valueChar === "{" || valueChar === "[") {
							valueDepth++;
						} else if (valueChar === "}" || valueChar === "]") {
							valueDepth--;
						}
					}

					// End of value at root level
					if (
						valueDepth === 0 &&
						!valueInString &&
						(valueChar === "," || valueChar === "}")
					) {
						break;
					}
					valueEnd++;
				}

				result = objectString.slice(0, i - oldKey.length - 1); // Remove old key
				result += `"${newKey}"`; // Add new key
				result += objectString.slice(i + 1, valueEnd); // Add original value
				result += objectString.slice(valueEnd);

				keyFound = true;
				break;
			}

			// Append character to result if not replaced
			if (!keyFound) {
				result += char;
			}
		}

		return keyFound ? result : objectString;
	}

	removeKeyFromObject(objectString: string, keyToRemove: string): string {
		let result = "";
		let depth = 0;
		let inString = false;
		let escaped = false;
		let currentKey = "";
		let keyFound = false;
		const keys = keyToRemove.split(".");


		for (let i = 0; i < objectString.length; i++) {
			const char = objectString[i];

			// Handle string parsing
			if (!escaped && char === '"') {
				inString = !inString;
				// Reset current key when entering a string
				if (inString) {
					currentKey = "";
				}
			}

			// Escape character handling
			if (inString && char === "\\") {
				if (i === objectString.length - 1 && objectString[i+1] !== '"') {
					escaped = !escaped;
					continue;
				}
			}

			// Track object/array depth
			if (!inString && keys.length > 1) {
				if (char === "{" || char === "[") {
					depth++;
				} else if (char === "}" || char === "]") {
					depth--;
				}
			}

			// Build key while in a string
			if (inString) {
				currentKey += char;
			}

			// Check for key match at root level (depth 0)
			if (
				!inString &&
				depth === 0 &&
				currentKey.replace(/"/g, "") === keyToRemove &&
				objectString[i + 1] === ":"
			) {
				// Find the start of the key
				let keyStart = i - currentKey.length - 2; // Go back to before the quotes

				// Find the end of the value
				let valueEnd = i + 2; // Start after colon
				let valueDepth = 0;
				let valueInString = false;
				let valueEscaped = false;

				while (valueEnd < objectString.length) {
					const valueChar = objectString[valueEnd];

					// String parsing
					if (!valueEscaped && valueChar === '"') {
						valueInString = !valueInString;
					}

					if (valueInString && valueChar === "\\") {
						valueEscaped = !valueEscaped;
					}

					// Track depth for objects and arrays
					if (!valueInString) {
						if (valueChar === "{" || valueChar === "[") {
							valueDepth++;
						} else if (valueChar === "}" || valueChar === "]") {
							valueDepth--;
						}
					}

					// End of value at root level
					if (valueDepth === 0 && !valueInString) {
						// Check for comma or end of object
						if (valueChar === "," || valueChar === "}") {
							// Remove trailing comma if not the last item
							if (valueChar === ",") {
								valueEnd++;
							}
							break;
						}
					}
					valueEnd++;
				}

				// Construct result without the key-value pair
				result = objectString.slice(0, keyStart + 1);
				let toEnd = objectString.slice(valueEnd);
				if (toEnd.startsWith("}")) {
					toEnd = toEnd.slice(1);
				}
				let keyRegex = new RegExp("\\s*", "g"); // Match leading spaces in each line (multiline mode)
				let match = result.match(keyRegex); // Get all matches
				let lastIndent = "";
				if (match) {
					let nonEmptyMatches = match.filter((m) => m.length > 0);
					lastIndent =
						nonEmptyMatches.length > 0
							? nonEmptyMatches[nonEmptyMatches.length - 1]
							: "";
				}
				// result = result.trimEnd();
				// result = result.endsWith(",") ? lastIndent : "";
				if (result.trimEnd().endsWith(",") && !toEnd.trimStart().startsWith('"')) {
					result = result.trimEnd().slice(0, -1) + lastIndent;
				} else {
					result = result.trimEnd();
				}

				result += toEnd;

				keyFound = true;
				break;
			}

			// Append character to result if not replaced
			if (!keyFound) {
				result += char;
			}
		}

		return keyFound ? result : objectString;
	}

	updateKeyInObject(objectString: string, key: string, newValue: string): string {
		let result = "";
		let depth = 0;
		let inString = false;
		let escaped = false;
		let currentKey = "";
		let keyFound = false;

		for (let i = 0; i < objectString.length; i++) {
			const char = objectString[i];

			// Handle string parsing
			if (!escaped && char === '"') {
				inString = !inString;

				// Reset current key when entering a string
				if (inString) {
					currentKey = "";
				}
			}

			// Escape character handling
			if (inString && char === "\\") {
				escaped = !escaped;
				continue;
			}

			// Track object/array depth
			if (!inString) {
				if (char === "{" || char === "[") {
					depth++;
				} else if (char === "}" || char === "]") {
					depth--;
				}
			}

			// Build key while in a string
			if (inString) {
				currentKey += char;
			}

			// Check for key match at root level (depth 0)
			if (
				!inString &&
				depth === 0 &&
				currentKey.replace(/"/g, "") === key &&
				objectString[i + 1] === ":"
			) {
				// Find the current value
				let j = i + 2; // Start after colon
				while (j < objectString.length && /[\s,]/.test(objectString[j])) j++;

				// Find the end of the current value
				let valueEnd = j;
				let valueDepth = 0;
				let valueInString = false;
				let valueEscaped = false;

				while (valueEnd < objectString.length) {
					const valueChar = objectString[valueEnd];

					// String parsing
					if (!valueEscaped && valueChar === '"') {
						valueInString = !valueInString;
					}

					if (valueInString && valueChar === "\\") {
						valueEscaped = !valueEscaped;
					}

					// Track depth for objects and arrays
					if (!valueInString) {
						if (valueChar === "{" || valueChar === "[") {
							valueDepth++;
						} else if (valueChar === "}" || valueChar === "]") {
							valueDepth--;
						}
					}

					// End of value at root level
					if (
						valueDepth === 0 &&
						!valueInString &&
						(valueChar === "," || valueChar === "}")
					) {
						break;
					}

					valueEnd++;
				}

				// Construct result with updated value
				result = objectString.slice(0, j);
				result += newValue;
				if (newValue.endsWith("}")) result += objectString.slice(valueEnd + 1);
				else result += objectString.slice(valueEnd);
				let keyRegex = new RegExp("\\s*", "g"); // Match leading spaces in each line (multiline mode)
				let match = objectString.match(keyRegex); // Get all matches
				if (match) {
					let nonEmptyMatches = match.filter((m) => m.length > 0);
					let lastIndent =
						nonEmptyMatches.length > 0
							? nonEmptyMatches[nonEmptyMatches.length - 1]
							: "";
					result = result.trimEnd() + lastIndent;
				}

				keyFound = true;
				break;
			}

			// Append character to result if not replaced
			if (!keyFound) {
				result += char;
			}
		}

		return keyFound ? result : objectString;
	}

	renameKey(keyPath: string, newKey: string): string {
		const keys = keyPath.split(".");
		const lastKey = keys.pop() || "";
		const obj = this.getObject(keyPath);

		if (keys.length > 0) {
			if (!obj.fullObject) {
				throw new Error("No parent object found");
			}
		}

		// check if key exists in parent object
		if (this.checkKeyExists(obj.objectContent, lastKey)) {
			const content = obj.objectContent.slice(1, -1);
			const updatedParentContent = this.renameKeyInObject( content, lastKey, newKey);
			const updateParentObj = obj.fullObject.replace( content, updatedParentContent);
			return this.jsonString.replace(obj.fullObject, updateParentObj);
		} else {
			return this.jsonString;
		}
	}

	removeKey(keyPath: string): string {
		const keys = keyPath.split(".");
		const lastKey = keys.pop() || "";
		const obj = this.getObject(keyPath);
		if (keys.length > 0) {
			if (!obj.fullObject) {
				throw new Error("No parent object found");
			}
		}

		// check if key exists in parent object
		if (this.checkKeyExists(obj.objectContent, lastKey)) {
			const objContent = obj.objectContent.slice(1, -1);
			let updatedParentContent = this.removeKeyFromObject(objContent, lastKey);
			if (updatedParentContent.endsWith(",")) {
				updatedParentContent = updatedParentContent.slice(0, -1);
			}
			const updateParentObj = obj.fullObject.replace(objContent, updatedParentContent);
			return this.jsonString.replace(obj.fullObject, updateParentObj);
		} else {
			return this.jsonString;
		}
	}

	addKey(keyPath: string, value: any): string {
		const keys = keyPath.split(".");
		const lastKey = keys.pop() || "";
		const jsonValue = this.valueToJsonString(value || lastKey);

		const obj = this.getObject(keyPath);

		if (!obj.fullObject) {
			throw new Error("No object found");
		}

		// check if key exists in object
		if (this.checkKeyExists(obj.objectContent, lastKey)) {
			const objectContent = obj.objectContent.slice(1, -1);
			const updatedObjectContent = this.updateKeyInObject( objectContent, lastKey, jsonValue);
			const updateObj = obj.fullObject.replace( objectContent, updatedObjectContent);
			return this.jsonString.replace(obj.fullObject, updateObj);
		}

		if (!RegExp(`{\\s*}`).test(obj.objectContent.trim())) {
			obj.needsComma = obj.fullObject.trim().endsWith("}") ? "," : "";
			obj.newKeyValue = `${obj.needsComma}${obj.objectInnerIndent}"${lastKey}": ${jsonValue}${obj.objectIndent}`;
		} else {
			obj.newKeyValue = `${obj.objectInnerIndent}\t"${lastKey}": ${jsonValue}${obj.objectIndent}`;
		}

		obj.newLines = obj.fullObject.slice( obj.fullObject.lastIndexOf("}") + 1);

		return this.jsonString.replace(
			obj.fullObject,
			obj.fullObject.trimEnd().slice(0, -1).trimEnd() +
				obj.newKeyValue +
				"}" +
				obj.newLines
		);
	}
}
