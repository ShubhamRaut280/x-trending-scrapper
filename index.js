require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const { Trend } = require('./models/trendSchema');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const { connection } = require('./connection.js');
// const http = require('http').createServer(app);
const io = require('socket.io')(app.listen(process.env.PORT, () => {
    console.log(`Application started on port ${process.env.PORT}`);
    emitLog(`Application started on port ${process.env.PORT}`);
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.set('views', path.join(__dirname, '/public/views'));

let currentIP = null;
axios.get('http://api.ipify.org?format=json').then((res) => {
    currentIP = res.data.ip;
}).catch((err) => {
    console.error('Error fetching current IP:', err);
});

connection(process.env.DATABASE_URL);

const {
    INFO_BANNER_BTN,
    LOGIN_BTN,
    USERNAME_INPUT,
    USERNAME_NEXT_BTN,
    PASS_INPUT,
    PASS_NEXT_BTN,
    SHOW_MORE_TRENDS_BTN,
    REFRESH_BTN,
    VERIFY_EMAIL_INPUT,
    VERIFY_EMAIL_NEXT_BTN,
    TRY_AGAIN_BTN,
    DIFF_VERIFY_EMAIL_INPUT,
    DIFF_VERIFY_EMAIL_NEXT_BTN
} = require('./paths');

function emitLog(message) {
    io.emit('log', message);
}

async function init() {
    emitLog('Initializing the driver');

    const proxy_username = process.env.PROXY_USERNAME;
    const proxy_password = process.env.PROXY_PASSWORD;
    const proxy_host = process.env.PROXY_HOST;
    const proxy_port = process.env.PROXY_PORT;

    let options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('start-maximized');
    options.addArguments('--headless');
    options.addArguments('disable-gpu');
    options.addArguments('no-sandbox');
    options.addArguments('disable-dev-shm-usage');

    // const proxyAuthPluginPath = path.resolve(__dirname, 'proxy_auth_plugin');
    // options.addArguments(`--load-extension=${proxyAuthPluginPath}`);

    emitLog('Proxy settings applied with extension');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // emitLog(`Current IP without proxy: ${currentIP}`);

        await driver.get('http://api.ipify.org?format=json');
        const ipElement = await driver.findElement(By.tagName('body'));
        const ipText = await ipElement.getText();
        const ipData = JSON.parse(ipText);
        currentIP = ipData.ip;
        // emitLog(`Current IP with proxy: ${ipData.ip}`);
    } catch (err) {
        // emitLog('Error fetching current IP:', err);
    }

    await driver.get("https://x.com/login");


    emitLog('Driver initialized');
    return driver;
}

async function Login(driver) {
    emitLog('Logging in');

    try {
        const infoBannerBtn = await driver.findElement(By.xpath(INFO_BANNER_BTN));
        await infoBannerBtn.click();
    } catch (err) { }

    try {
        try {
            const tryagainbtn = await driver.findElement(By.xpath(TRY_AGAIN_BTN));
            await tryagainbtn.click();
        } catch (err) { }

        const refresh = await driver.findElement(By.xpath(REFRESH_BTN));
        await refresh.click();
    } catch (err) {
    }

    // const loginbtn = await driver.wait(until.elementLocated(By.xpath(LOGIN_BTN), 10000));
    // await loginbtn.click();

    const usernameInput = await driver.wait(until.elementLocated(By.xpath(USERNAME_INPUT), 10000));
    await usernameInput.sendKeys(process.env.X_USERNAME);

    // await sleep(Math.random() * 1000);

    const usernameNextBtn = await driver.wait(until.elementLocated(By.xpath(USERNAME_NEXT_BTN), 10000));
    await usernameNextBtn.click();

    // await sleep(Math.random() * 2000 + 2000);

    try {
        const verifyEmailInput = await driver.findElement(By.xpath(VERIFY_EMAIL_INPUT));
        if (verifyEmailInput) {
            await verifyEmailInput.sendKeys(process.env.X_EMAIL);
            await sleep(Math.random() * 2000 + 1000);
        }
        const verifyEmailNextBtn = await driver.findElement(By.xpath(VERIFY_EMAIL_NEXT_BTN));
        if (verifyEmailNextBtn) await verifyEmailNextBtn.click();
    } catch (err) {
        emitLog('No email verification needed');
    }

    await sleep(Math.random() * 1000 + 1000);

    
    try{
        const diffVerifyEmailInput = await driver.findElement(By.xpath(DIFF_VERIFY_EMAIL_INPUT));
        if (diffVerifyEmailInput) {
            await diffVerifyEmailInput.sendKeys(process.env.X_EMAIL);
            await sleep(Math.random() * 1000 + 1000);
        }
        const diffVerifyEmailNextBtn = await driver.findElement(By.xpath(DIFF_VERIFY_EMAIL_NEXT_BTN));
        if (diffVerifyEmailNextBtn) await diffVerifyEmailNextBtn.click();
    }catch(err){}



    const passInput = await driver.wait(until.elementLocated(By.xpath(PASS_INPUT), 10000));
    await passInput.sendKeys(process.env.X_PASSWORD);

    const passNextBtn = await driver.wait(until.elementLocated(By.xpath(PASS_NEXT_BTN), 10000));
    await passNextBtn.click();

    emitLog('Logged in successfully');

    await driver.wait(until.urlContains("home"), 10000);
    await driver.get("https://x.com/explore/tabs/trending");
}

async function scrapTrends(driver) {
    emitLog('Scraping trends');


    try {
        window.scrollBy(0, 50);
        const infoBannerBtn = await driver.findElement(By.xpath(INFO_BANNER_BTN));
        await infoBannerBtn.click();
    } catch (err) { }

    // const showmoreTrendsBtn = await driver.wait(until.elementLocated(By.xpath(SHOW_MORE_TRENDS_BTN), 10000));
    // await showmoreTrendsBtn.click();

    emitLog('Scraping started')

    const trends = [];
    let count = 0;
    for (let i = 1; i <= 20; i++) {
        if (count >= 5) break;
        try {
            const trendcard = `/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[${i}]/div/div/div/div/div[2]/span`;
            const trend = await driver.wait(until.elementLocated(By.xpath(trendcard), 2000));
            const t = await trend.getText();
            trends.push(t);
            count++;
            emitLog(`Trend ${i} is ${t}`);
        } catch (err) {
            emitLog('Error while scrapping trends');
        }
    }

    return trends;
}

async function startScraping() {
    emitLog('Starting the scraping process');
    const driver = await init().catch(err => emitLog('Error initializing driver:', err));
    await Login(driver);
    const trends = await scrapTrends(driver);
    await driver.quit();

    emitLog('Saving the trends in db');
    const obtainedTrends = new Trend({
        trend1: trends[0],
        trend2: trends[1],
        trend3: trends[2],
        trend4: trends[3],
        trend5: trends[4],
        endTime: new Date(),
        ipAddress: currentIP
    });

    const saveddoc = await obtainedTrends.save();

    emitLog(`Trends saved successfully ${saveddoc._id}`);
    emitLog(`Saved doc : ${JSON.stringify(saveddoc)}`);

    return saveddoc;
}

app.get('/', (req, res) => {
    res.render('home')
});

app.get('/scrap', async (req, res) => {
    try {
        const doc = await startScraping();
        res.send({ success: true, data: doc });
    } catch (err) {
        res.send({ success: false, data: err });
    }
});

// http.listen(process.env.PORT, () => {
//     console.log(`Application started on port ${process.env.PORT}`);
//     emitLog(`Application started on port ${process.env.PORT}`);
// });


module.exports = app;