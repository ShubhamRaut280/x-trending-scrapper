require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path')
const mongoose = require('mongoose');
const { trendSchema } = require('./models/trendSchema');

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const { connection } = require('./connection.js');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.set('views', path.join(__dirname, '/public/views'));

connection(process.env.DATABASE_URL);


const {
    INFO_BANNER_BTN,
    LOGIN_BTN,
    USERNAME_INPUT,
    USERNAME_NEXT_BTN,
    PASS_INPUT,
    PASS_NEXT_BTN,
    SHOW_MORE_TRENDS_BTN
} = require('./paths');

async function init() {
    console.log('Initializing the drivers');
    var options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('start-maximized'); 
    // options.addArguments('headless')
    options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'); 

    var driver = new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    await driver.get("https://x.com/home");
    console.log('Driver initialized');
    return driver;
}

async function Login(driver) {
    console.log('Logging in');
    await sleep(Math.random() * 3000 + 2000); 

    const loginbtn = await driver.wait(until.elementLocated(By.xpath(LOGIN_BTN), 10000));
    await loginbtn.click();

    await sleep(Math.random() * 3000 + 2000); 

    const usernameInput = await driver.wait(until.elementLocated(By.xpath(USERNAME_INPUT), 10000));
    await usernameInput.sendKeys(process.env.X_USERNAME);

    await sleep(Math.random() * 3000 + 2000); 

    const usernameNextBtn = await driver.wait(until.elementLocated(By.xpath(USERNAME_NEXT_BTN), 10000));
    await usernameNextBtn.click();

    await sleep(Math.random() * 3000 + 2000); 

    const passInput = await driver.wait(until.elementLocated(By.xpath(PASS_INPUT), 10000));
    await passInput.sendKeys(process.env.X_PASSWORD);

    await sleep(Math.random() * 3000 + 2000); 

    const passNextBtn = await driver.wait(until.elementLocated(By.xpath(PASS_NEXT_BTN), 10000));
    await passNextBtn.click();

    console.log('Logged in successfully');

    await sleep(Math.random() * 3000 + 2000); 
}

async function scrapTrends(driver){
    console.log('Scraping trends');

    const showmoreTrendsBtn = await driver.wait(until.elementLocated(By.xpath(SHOW_MORE_TRENDS_BTN), 10000));
    await showmoreTrendsBtn.click();

    await sleep(Math.random() * 3000 + 2000); 

    const trends = [];
    for (let i = 1; i <= 5; i++) {
        const trendcard = `/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[${i}]/div/div/div/div/div[2]/span/span`;
        const trend = await driver.wait(until.elementLocated(By.xpath(trendcard), 10000));
        trends.push(await trend.getText());
        await sleep(Math.random() * 3000 + 2000);
    }

    return trends;

}

async function startScraping(){
    console.log('Starting the scraping process');
    const driver = await init();
    await Login(driver);
    const trends = await scrapTrends(driver);
    await driver.quit();

    console.log('Saving the trends in db');
    const obtainedTrends = new trendSchema({
        uniqueId: Date.now().toString(),
        trend1: trends[0],
        trend2: trends[1],
        trend3: trends[2],
        trend4: trends[3],
        trend5: trends[4],
        endTime: new Date(),
        ipAddress: process.env.IP_ADDRESS
    })

    await obtainedTrends.save();

    console.log('Trends saved successfully');

}


app.get('/', (req, res) => {
    startScraping();
    res.render('home');

})

app.listen(process.env.PORT, () => {
    console.log(`Application started on port ${process.env.PORT}`);
});
