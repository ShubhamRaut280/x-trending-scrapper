require('dotenv').config();
const webdriver = require('selenium-webdriver'),
    By = webdriver.By;

const { configDotenv } = require('dotenv');
const {
    INFO_BANNER_BTN,
    LOGIN_BTN,
    USERNAME_INPUT,
    USERNAME_NEXT_BTN,
    PASS_INPUT,
    PASS_NEXT_BTN,
    WHATS_HAPPENING
} = require('./paths');


var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

driver.manage().window().maximize();    



async function init() {
    await driver.get("https://x.com/home");
}

async function Login() {

    const loginbtn = await driver.wait(webdriver.until.elementLocated(By.xpath(LOGIN_BTN), 5000));
    loginbtn.click();

    const usernameInput = await driver.wait(webdriver.until.elementLocated(By.xpath(USERNAME_INPUT), 5000));
    usernameInput.sendKeys(process.env.X_USERNAME);

    const usernameNextBtn = await driver.wait(webdriver.until.elementLocated(By.xpath(USERNAME_NEXT_BTN), 5000));
    usernameNextBtn.click();

    const passInput = await driver.wait(webdriver.until.elementLocated(By.xpath(PASS_INPUT), 5000));
    passInput.sendKeys(process.env.X_PASSWORD);

    const passNextBtn = await driver.wait(webdriver.until.elementLocated(By.xpath(PASS_NEXT_BTN), 5000));
    passNextBtn.click();

    const whatsHappening = await driver.wait(webdriver.until.elementLocated(By.xpath(WHATS_HAPPENING), 5000));
    whatsHappening.getText().then((text) => {
        console.log(text);
    });


}
(async () => {
    // await init();
    // await Login();
})();


