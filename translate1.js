const fs = require('fs');
const csv = require('csv-parser');

const inputTextFile = 't8.shakespeare.txt';
const findWordsFile = 'find_words.txt';
const dictionaryFile = 'french_dictionary.csv';
const outputTextFile = 't8.shakespeare.translated.txt';
const outputFrequencyFile = 'frequency.csv';
const outputPerformanceFile = 'performance.txt';

function translateWords() {
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage().heapUsed;

    console.log('Reading files...');
    const text = fs.readFileSync(inputTextFile, 'utf8');
    const findWords = fs.readFileSync(findWordsFile, 'utf8').split('\n');
    const dictionary = {};

    fs.createReadStream(dictionaryFile)
        .pipe(csv())
        .on('data', (data) => {
            const englishWord = data['English word'];
            const frenchWord = data['French word'];
            dictionary[englishWord] = frenchWord;
        })
        .on('end', () => {
            const translations = {};
            let translatedText = text;

            console.log('Translating words');
            findWords.forEach((word) => {
                const regex = new RegExp(`\\b${word}\\b`, 'g');
                if (dictionary[word] && translatedText.match(regex)) {
                    const frequency = translatedText.match(regex).length;
                    translations[word] = {
                        frenchWord: dictionary[word],
                        frequency,
                    };
                    translatedText = translatedText.replace(regex, dictionary[word]);
                }
        });

        console.log('Writing the output file...');
        fs.writeFileSync(outputTextFile, translatedText);

        console.log('Generating the output files...');
        generateFrequencyFile(translations);
        generatePerformanceFile(startTime, startMemory);
    });
}

function generateFrequencyFile(translations) {
    const header = 'English word,French word,Frequency\n';
    let content = '';

    for (const word in translations) {
        const frenchWord = translations[word].frenchWord;
        const frequency = translations[word].frequency;
        content += `${word},${frenchWord},${frequency}\n`;
    }

    fs.writeFileSync(outputFrequencyFile, header + content);
}

function generatePerformanceFile(startTime, startMemory) {
    const endTime = process.hrtime(startTime);
    const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / (1024 * 1024); // Convert to MB
    const seconds = endTime[0];
    const milliseconds = endTime[1] / 1e6;
    const timeTaken = `${seconds} seconds ${milliseconds} ms`;

    const content = `Time to process: ${timeTaken}\nMemory used: ${memoryUsed.toFixed(2)} MB`;

    fs.writeFileSync(outputPerformanceFile, content);
}

translateWords();