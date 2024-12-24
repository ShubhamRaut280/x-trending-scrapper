const mongoose = require('mongoose')

async function connection(url) {
    try {
        mongoose.connect(url).then(() => { console.log('Connected to database') })
    } catch (err) {
        console.log(`Unable to connect to db: ${err}`)
    }

}

module.exports = {connection}