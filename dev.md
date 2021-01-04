## What are we building?

As a frontend engineer, you probably have come across the site [caniuse.com](https://caniuse.com/) - it tells you what web features are supported by different browsers. It also helps you make guided decisions upfront regarding your site's accessibility using different browsers.

The tool we will be building today is going to assess any given webpage and then give us its verdict whether that page is worth our time to read or not based on the the occurences of some certain keywords. It is very handy for avid article readers.

## Costly assumptions

We are going to make a few assumptions here:
1. If a webpage contains more "positive words" than "negative words", we presume the page to be safe for reading.

2. If a webpage contains more "negative words" than "positive words", then we presume that the page is not worth our time - it may ruin our day :laughing:.

## Keyword files

The "positive" and "negative" keywords list can be obtained on Github by [jeffreybreen](https://github.com/jeffreybreen), that's an incredible compilation, a big shout-out to the author. Links to the two files on Github below:

+ [positive.txt](https://github.com/jeffreybreen/twitter-sentiment-analysis-tutorial-201107/blob/master/data/opinion-lexicon-English/positive-words.txt)

+ [negative.txt](https://github.com/jeffreybreen/twitter-sentiment-analysis-tutorial-201107/blob/master/data/opinion-lexicon-English/negative-words.txt)


>  Citation: Minqing Hu and Bing Liu. "Mining and Summarizing Customer Reviews." 
Proceedings of the ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD-2004), Aug 22-25, 2004, Seattle, Washington, USA, 


## Limitations

The approach we are using for analyzing the page will not always work out 100% correctly because we are not using natural language processing to analyze the whole context in which the keywords are used in the page (as in sentiment analysis systems), we are solely relying on word count frequency. I have plans to add support for NLP in subsequent series of this post, so keep an eye here if that interests you.

## Thought process

As usual, it always pays to highlight our thought process because it will help steer our direction big time in this wild ride.

1. Convert the keywords text files to JSON files. The resulting json files will hold all the keywords in an array.

2. Get the address of the webpage we want to analyze and make a request to it.

3. Extract the text content of that page.

4. Compare each keyword in the JSON files with the extracted text and record each keyword's frequency in that extracted text (for both keyword files).

5. Sum the total number of positive keywords appearances and do same for the negative keywords

6. The category with the higher number determines if the page is worth reading or not. That is, if we end up with more positive keywords in the page, we mark that webpage as safe for reading and the opposite for the negative keywords.


Alright, let's wish ourselves success and hope our terminal don't get mad at us because we are just about to bounce on it. :smile:. 

## Initialize a new project directory

```bash
mkdir can-i-read && cd can-i-read && npm init -y
```

We will download two packages: [puppeteer](https://www.npmjs.com/package/puppeteer) and [keyword-count](https://www.npmjs.com/package/keyword-count)

```bash
npm i --save puppeteer keyword-count
```

> Note: Don't panic if it takes ages to finish the installation. Puppeteer usally takes longer time to install

## Folder structure

For reference and clarity purposes, this is how our project directory will look like at the end. We come to that and explain later. Don't mind the `dev.md` file you are seeing there, it is the file that contains what you are reading now, so technically not part of the project files :laughing:.


![project-directory-img](https://imgur.com/TnU9q5h.png)

## Prepare the keyword files

We want to have both the keywords files stored in the `assets` directory in the root of our project directory. I have cleaned up these two files (positive and negative text files from the Github repo) to contain only the keywords because the original files from that repo contain acknowledgement notes which will require us to take extra step to clean them up.

## Convert the text files to json files

Since we want to count the number of occurences of each keyword in the document body, I found an npm package that does this job extremely well - `keyword-count`. The package demands that we provide paths to three files:

```js
{
    target: "/path/to/the/text/file/we/want/to/analyze", 
    keywordsList: "/path/to/json/file/containing/the/keywords", 
    outputPath: "/path/to/json/file/we/want/to/write/the/result/of/the/analysis"
}
```

That is why in the `assets` directory structure above, you are seeing one million and one files there :smile:. Let me explain what each file in that directory is doing.

1. `input.txt` - This is the file containing the text of the document body we want to analyze. Visit any webpage, pop open devtools and type `document.body.textContent` in the console. The text it returns is what we want to analyze, and that is what goes to this file. We haven't created it yet but we'll come to that.

2. `negative.txt` - This is the same file we got from the keywords text file but we have removed the acknowledgement note for easy parsing. We want to convert this file to a json file so that the `keyword-count` package can be able to use it. This leads us to the third file in that directory.

3. `negative.json` - This is the json file that the `keyword-count` package expects to see the list of keywords to work with.

4. `negativeResult.json` - The `keyword-count` package spits the result of its computation in this json file. That's why you are are seeing it here.

The same explanation goes for the remaining files (`positive.txt`, `positive.json` and `positiveReslt.json`).

Wait, do I have to manually create all these files myself? Nope! We are going to create them programatically from our code. You should only have two files there - positive.txt and negative.txt (I will include them in the project repo).

Now that we have a clear understanding of the `assets` directory, let's remind ourselves of what we want to achieve - Convert the text files to json files ( `positive.txt` ==> `positive.json`, same for `negative` ). 

At the root project directory, open your terminal window again and type the following:

```bash
mkdir utils && cd utils && touch textToJson.js
```

We created the `utils` directory and navigated into it and then created a `textToJson.js` file with that one-liner bash command. Open the `textToJson.js` file in your text editor of choice and paste in this block of code

```js
const fs = require('fs')
const path = require('path')
const readline = require('readline')

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
    try {
        await writeJSON(filename, json)
    } catch(err) {
        console.log(err)
    }
}
```

First we are requiring three modules to work with and then creating the `processLine()` function. This function takes in a filename (think of the `filename` variable as the name of the `.txt` file we want to convert to json - `positive.txt` or `negative.txt`) and creates a readable stream off of that file on our filesystem. We then pass this readable stream to the `readline` to extract every word line by line in the file passed. For every word found in that file, we push the word to the `linesArray` variale. After the `for...of` iteration is done, by this time, we have an array containing all the keywords extracted from the text file. We want to save this keywords as a json file on our disk - in the `assets` directory, we then called the `writeJSON()` function, passing it the `filename` and the `json` data we want to write to the file.


```js
function writeJSON(filename, json){

    // Rename the filename from .txt to .json extension
    filename = filename.split('.')[0] + '.json'
    
    const filePath = path.join(__dirname, `./../assets/${filename}`)
    
    const data = JSON.stringify(json)
    

    fs.writeFile(filePath, data, (err) => {
        if (err) {
            return Promise.reject(`Error generating ${filename}`)
            
            // Exit program at this point, because this file will be used by the scraper API
            process.exit(1)
        }

        console.log(`${filename} generated`)

        return Promise.resolve()
    })
}
```

Remember, the `filename` argument passed to the `writeJSON()` function is just a string that will probably look like this: `positive.txt` or `negative.txt`. We then replaced the `.txt` extension to `.json` and append it to the full filepath. We also turned the `json` data to a string and call the standard `writeFile` method of the `fs` module.

Now whenever the `processLine()` gets called, it is going to generate an equivalent json file containing the keywords that the `keyword-count` package will use. E.g, 

```js
await processLine('positive.txt')
// It will generate a positive.json file in the assets directory

await processLine('negative.txt')
// It will generate a negative.json file in the assets directory
```

> Shameless plug: if you are still here with me then kudos! You may also want to checkout my site [webscrapingzone.com](https://www.webscrapingzone.com/) where I teach web scraping indepth, by building *real-life* projects and potential ways you can monetize it. Get a ***50%*** discount on the course :smile:

At this point, we are done with the functionality of generating the json files for the `keyword-count` package to work with. Also, we are exporting the whole of this module in the `textToJSON` function. Next is to make request to the webpage we want to analyze.


Old-school Linux hackers, (ohh, I forgot to mention the Powershell and Steve's fans too :laugh: too), pop open your terminal and hit this one-liner again, creating the `lib` directory at the project's root, navigating inside and creating the `scraper.js` file.

```bash
mkdir lib && cd lib && touch scraper.js
```

Open the `scraper.js` and paste this huge block of code

```js
'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Browser and page instance
async function instance(){
	const browser = await puppeteer.launch({
		headless: false
	})

	const page = await browser.newPage()
	return {page, browser}
}

// Extract all body text from the page
async function getBodyText(){
	const {page, browser} = await instance()

	// Get the url we want to visit from the user
	let baseURL = process.argv[2] ? process.argv[2] : "https://webscrapingzone.com"

	try {
		await page.goto(baseURL, {waitUntil: 'networkidle0'})
        await page.waitForSelector('body')

		let bodyText = await page.evaluate(() => {
            let scriptTags = document.querySelectorAll('script')
            let styleTags = document.querySelectorAll('style')

            // Remove a tag from the page
            function removeTagsFromPage(tags) {
                tags.forEach((tag) => {
                    tag.innerText = ""
                })
            }
            
            removeTagsFromPage(scriptTags)
            removeTagsFromPage(styleTags)

            // Get the page's text content
            let text = document.body.textContent
            
            // Remove line-break from text
            text = text.replace(/\n/g, "").trim()

            return text
        })

        await browser.close()
        
        return bodyText
        
	} catch (err) {
        
        // ***Handle errors properly in production environment***
		console.log(err)
	}
}
```

Quite a bit happening there, but c'mon, it's not far beyond reach. Sip your drink one time because we still have some journey across. That's our punishment for building the next billion-dollar product :smile:.


Back from the digression, now let's explain what's happening in `scraper.js`. We created a `instance()` function, setup the `browser` and `page` objects from the `puppeteer` package and then returned them. The page object represents a blank browser page that we will use to make web requests.

We also created an async function called `getBodyText()`, as the name implies, we want to get all the text from the `body` tag of the page we want to analyze. Inside this function, we then made a request to the website we want to analyze, in our case here - [webscrapingzone.com](https://www.webscrapingzone.com/) and then wait for the `body` tag to render before traversing the DOM.


The `bodyText` variable will contain all the text in the `body` tag of that page. But wait a second, including all the `script` and `style` tags? Allowing these two tags in our text we want to analyze will drop the accuracy rate of our program because they are `codes` and not actual text written by the author of that page. So we want to get rid of these two tags completely from the page. 

The `removeTagsFromPage()` is a helper function that removes any tag from the page. Actually, we are not removing the tag, but setting the `innerText` property of the tag to an empty string. Example, open your devtools and paste the following block of code into your console and see what happens to the page. You just hacked yourself and saw a bright light staring at you :laughing:. 

```js
let bodyTags = document.querySelectorAll('body')

// Remove all tags from the page
function removeTagsFromPage(tags) {
    bodyTags.forEach((tag) => {
        tag.innerText = ""
    })
}

removeTagsFromPage(scriptTags)
```

That's the kind of behaviour we want, but this time not removing everything on the page, instead just the `script` and `style` tags. We want to remove them so that our algorithm doesn't analyze some random piece of gibberish. We then extracted the text left in the page by running `document.body.textContent`. The text may contain some formatting and so many line breaks, we removed the line-breaks and then trimmed the text. Now this is the text we want to run our analysis on. Remember the `input.txt` file? This text will then go into this file, but not so just yet.

Give me a stretch at this time because we will continue in the next post of this series. In our next post, we will run the actual analysis and determine if a page is worth our time or not. In this section we have achieved two things:

+ Creating functionality for generating keyword files

+ Creating functionality for extracting the text we want to run our analysis

Stay tunned for the next post, you can follow me on Twitter to get updates when it's published [@microworlds](https://twitter.com/microworlds)


## Motivation

If you have found this article helpful in any way and generosity is the state of your mind right now, you can put a smile on my face like this one here:smile: with a cold bottle of anything right here below:

***[cold bottle of anything :laughing:](https://dashboard.flutterwave.com/donate/d4slvylfk4t2)***

Gracias :pray: