// utils/ngram.js

// Example: build bigram map
export const buildNGramMap = (messages) => {
    const map = {};

    messages.forEach((msg) => {
        const words = msg.content.split(" ");
        for (let i = 0; i < words.length - 1; i++) {
            const key = words[i].toLowerCase();
            const nextWord = words[i + 1].toLowerCase();

            if (!map[key]) map[key] = [];
            map[key].push(nextWord);
        }
    });

    return map;
};

// Example: build trigram map
export const buildTriGramMap = (messages) => {
    const map = {};

    messages.forEach((msg) => {
        const words = msg.content.split(" ");
        for (let i = 0; i < words.length - 2; i++) {
            const key = `${words[i].toLowerCase()} ${words[i + 1].toLowerCase()}`;
            const nextWord = words[i + 2].toLowerCase();

            if (!map[key]) map[key] = [];
            map[key].push(nextWord);
        }
    });

    return map;
};

// Function to get suggestions from n-gram maps
export const getSuggestions = (input, bigramMap, trigramMap, max = 3) => {
    const words = input.trim().toLowerCase().split(" ");
    const lastWord = words[words.length - 1] || "";
    const lastTwoWords = words.slice(-2).join(" ");

    // Try trigram first
    if (trigramMap[lastTwoWords]) {
        return [...new Set(trigramMap[lastTwoWords])].slice(0, max);
    }

    // Then bigram fallback
    if (bigramMap[lastWord]) {
        return [...new Set(bigramMap[lastWord])].slice(0, max);
    }

    return []; // no suggestions
};
