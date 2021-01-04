'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const counter = require('./counter');
var emoji = require('node-emoji');


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

async function start(){
    console.log("Loading")
    let text = await getBodyText()

    let inputFilePath = path.join(__dirname, './../assets/input.txt')

    fs.writeFileSync(inputFilePath, text, (err) => { 
        if (err) throw err; 
    });

    console.log("input.txt file created")
    
    let sum = await counter()
    console.log(sum)

    if (sum.positive > sum.negative) {
        console.log(emoji.emojify('You can read :smile:!'))
    } else {
        console.log(emoji.emojify('Do not read :boom:!'))
    }
}

(async function(){
    await start()
})()