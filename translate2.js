const fs = require("fs");
const { Transform } = require("stream");
const csv = require("csv-parser");

const findWordsFile = "find_words.txt";
const dictionaryFile = "french_dictionary.csv";
const outputFrequencyFile = "_frequency.csv";
const outputPerformanceFile = "_performance.txt";

function translateWords() {
  const startTime = process.hrtime();
  const startMemory = process.memoryUsage().heapUsed;

  console.log("Reading files...");
  const findWords = fs.readFileSync(findWordsFile, "utf8").split("\n");
  const dictionary = {};
  const frequencyData = {};

  fs.createReadStream(dictionaryFile)
    .pipe(csv())
    .on("data", (data) => {
      const englishWord = data["English word"];
      const frenchWord = data["French word"];
      dictionary[englishWord] = frenchWord;
    });

  const readStream = fs.createReadStream("t8.shakespeare.txt", "utf-8");
  const writeStream = fs.createWriteStream(
    "_t8.shakespeare.translated.txt",
    "utf-8"
  );

  const transformData = new Transform({
    transform(chunk, encoding, callback) {
      const bufferedData = Buffer.from(chunk);
      let translatedText = bufferedData.toString();
      findWords.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "g");
        if (dictionary[word] && translatedText.match(regex)) {
            const frequency = (translatedText.match(regex) || []).length;
            frequencyData[word] = {
                frenchWord: dictionary[word],
                frequency : frequencyData[word] ? frequencyData[word].frequency + frequency : frequency,
            };
            translatedText = translatedText.replace(regex, dictionary[word]);
        }
      });
      callback(null, translatedText);
    },
  });

  console.log("Writing the output file...");
  readStream
    .pipe(transformData)
    .on("end", () => {
      console.log("Generating the output files...");
      generateFrequencyFile(frequencyData);
      generatePerformanceFile(startTime, startMemory);
    })
    .pipe(writeStream);
}

function generateFrequencyFile(frequencyData) {
  const header = "English word,French word,Frequency\n";
  let content = "";

  for (const word in frequencyData) {
    const frenchWord = frequencyData[word].frenchWord;
    const frequency = frequencyData[word].frequency;
    content += `${word},${frenchWord},${frequency}\n`;
  }

  fs.writeFileSync(outputFrequencyFile, header + content);
}

function generatePerformanceFile(startTime, startMemory) {
  const endTime = process.hrtime(startTime);
  const memoryUsed =
    (process.memoryUsage().heapUsed - startMemory) / (1024 * 1024); // Convert to MB
  const seconds = endTime[0];
  const milliseconds = endTime[1] / 1e6;
  const timeTaken = `${seconds} seconds ${milliseconds} ms`;

  const content = `Time to process: ${timeTaken}\nMemory used: ${memoryUsed.toFixed(
    2
  )} MB`;

  fs.writeFileSync(outputPerformanceFile, content);
}

translateWords();