function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function compressText(text) {
    const charMap = {};
    let compressedText = '';
    let nextCharValue = 1;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (!charMap[char]) {
            charMap[char] = nextCharValue.toString();
            nextCharValue++;

            if (nextCharValue > 9) {
                nextCharValue = 1;
            }
        }

        compressedText += charMap[char];
    }

    return compressedText;
}

function decompressText(compressedText, charMap) {
    let decompressedText = '';
    let currentChar = '';

    for (let i = 0; i < compressedText.length; i++) {
        currentChar += compressedText[i];

        for (const char in charMap) {
            if (charMap[char] === currentChar) {
                decompressedText += char;
                currentChar = '';
                break;
            }
        }
    }

    return decompressedText;
}

exports.sleep = sleep;
exports.compressText = compressText;
exports.decompressText = decompressText;
