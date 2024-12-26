require('dotenv').config();

var config = {
    mode: "fixed_servers",
    rules: {
      singleProxy: {
        scheme: "http",
        host: process.env.PROXY_HOST,
        port: parseInt(process.env.PROXY_PORT)
      },
      bypassList: ["localhost"]
    }
};

chrome.proxy.settings.set({value: config, scope: "regular"}, function() {});

function callbackFn(details) {
    return {
        authCredentials: {
            username: process.env.PROXY_HOST,
            password: process.env.PROXY_PASSWORD
        }
    };
}

chrome.webRequest.onAuthRequired.addListener(
    callbackFn,
    {urls: ["<all_urls>"]},
    ['blocking']
);