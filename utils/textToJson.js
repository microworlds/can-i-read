const fs = require('fs');
const path = require('path');
const readline = require('readline');

module.exports =  async function textToJSON(filename){
    await processLine(filename)        
}

// Helper functions

/**
 * processLine(filename)
 * processLine parses the text file line by line to extract all the words
 * in the file
*/
async function processLine(filename) {    
    const fileStream = fs.createReadStream(path.join(__dirname, `./../assets/${filename}`))
    
    // This will contain the list of words in the text file
    let linesArray = []

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    // Iterate over each line and populate the `linesArray`
    for await (const line of rl) {
        linesArray.push(line)
    }

    // Initialize an empty object and populate it with the array of words
    let json = {}
    json["keywords"] = linesArray

    // Write the populated object to a json file on our filesystem
    await writeJSON(filename, json)
}

/**
 * writeJSON(filename, json)
 * writeJSON writes a json file to the filesystem
 * in the file
*/
function writeJSON(filename, json){

    // Rename the filename from .txt to .json extension
    filename = filename.split('.')[0] + '.json'
    
    const data = JSON.stringify(json)
    const filePath = path.join(__dirname, `./../assets/${filename}`)

    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.log(`Error generating ${filename}`)
            console.log(err)
            
            // Exit program at this point, because this file will be used by the scraper API
            process.exit(1)
        }

        console.log(`${filename} generated`)

        return Promise.resolve()
    });
}