const fs = require("fs");
const path = require('path');
const keywordCount = require('keyword-count');
const textToJSON = require('../utils/textToJson');

module.exports = async function conter(){
    
    // Check if both keywords files exist (`positive.json` and `negative.json`)
    await checkFiles()
    
    let pos = await wordFrequency('positive.json')
    let neg = await wordFrequency('negative.json')

    let [posWords, negWords] = await Promise.all([pos, neg])

    let p = totalWords(posWords)
    let n = totalWords(negWords) / 2.4

    // Divide total number of negative words by 2.4 and round it down
    n = Math.floor(n)
    
    return {
        positive : p,
        negative: n
    }
}

async function checkFiles(){
    let positive = path.join(__dirname, './../assets/positive.json')
    let negative = path.join(__dirname, './../assets/negative.json')

    // Generate positive keywords json file
    if (!fs.existsSync(positive)) {
        await textToJSON(`positive.txt`)
    }

    // Generate negative keywords json file
    if (!fs.existsSync(negative)) {
        await textToJSON(`negative.txt`)
    }

    return
}

async function wordFrequency(filename){

    let targetFile = path.join(__dirname, './../assets/input.txt')
    let keywordsList = path.join(__dirname, './../assets/' + filename)
    //let outputPath = path.join(__dirname, './../assets/' + 'results.json')

    // Change the 
    filename = filename.split(".")[0]
    let outputPath = path.join(__dirname, './../assets/' + `${filename}Result.json`)
    
    var options = {
        target: targetFile,
        keywordsList: keywordsList,
        outputPath: outputPath,
        ignoreCase: true
    }

    try {
        let result = await keywordCount(options)
        return Promise.resolve(result)
    } catch (err) {
        console.log(err)
    }
}

// Get the total number of positive words in the page
function totalWords(json){
    let wordCorpus = json.input

    let sum = 0

    for (i in wordCorpus) {
        
        if ( typeof wordCorpus[i] !== "number" ) {
            wordCorpus[i] = 0
        }

        sum += wordCorpus[i]
    }

    return sum
}