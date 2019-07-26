require("@babel/register");
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const report = require('./report')
var db
const fs = require('fs');
const utils = require('./utils')
const collectionName = 'resultcollation'
const resultCollection = process.env.RESULT_NAME || 'run';
console.log(`resultCollection ${resultCollection}`)
// Remember to change YOUR_USERNAME and YOUR_PASSWORD to your username and password!
let url = 'mongodb://localhost:27017/resultcollation';
MongoClient.connect(url, (err, database) => {
    if (err) return console.log(err)
    db = database.db(collectionName)
    app.listen(process.env.PORT || 3000, () => {
        console.log('listening on 3000')
    })
})

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
    db.collection('quotes').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('index.ejs', {quotes: result})
    })
})

app.post('/quotes', (req, res) => {
    db.collection('quotes').save(req.body, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/')
    })
})

app.put('/quotes', (req, res) => {
    db.collection('quotes')
        .findOneAndUpdate({name: 'Yoda'}, {
            $set: {
                name: req.body.name,
                quote: req.body.quote
            }
        }, {
            sort: {_id: -1},
            upsert: true
        }, (err, result) => {
            if (err) return res.send(err)
            res.send(result)
        })
})

app.delete('/quotes', (req, res) => {
    db.collection('quotes').findOneAndDelete({name: req.body.name}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('A darth vadar quote got deleted')
    })
})

const flatten = (arrayOfArrays) => arrayOfArrays.reduce((acc, next) => {
    return acc.concat(next);
}, [])

scenarioExistsInfeature = async (feature, scenario) => {
    let data = await db.collection(resultCollection).findOne({
        elements: {$elemMatch: {name: scenario.name}},
        name: feature.name
        // uri: feature.uri
    })
    return data
}

pushScenario = async (feature, scenario) => {
    let data = await db.collection(resultCollection).update(
        {
            elements: {$elemMatch: {name: scenario.name}},
            name: feature.name
            // uri: feature.uri
        },
        {$push: {elements: scenario}}
    )
    return data
}

updateScenario = async (feature, scenario) => {
    let data = await db.collection(resultCollection).findOneAndUpdate(
        {
            name: feature.name
            // , uri: feature.uri
        },
        {
            $set: {"elements.$[elem]": scenario},
        },
        {
            upsert: true,
            arrayFilters: [{"elem.name": scenario.name}]
        })
    return data
}

app.put('/run', async (req, res) => {

    const features = req.body; // [{},{}]
    let results = []
    let promises = features.map(async feature => {
        if (!await featureExists(feature)) {
            await insertFeature(feature)
            // results.push({InsertedFeature: feature.name})
            return {InsertedFeature: feature.name}
        }
        return {featureExists: feature.name}
    })

    const featureInsertions = await Promise.all(promises)
    let scenarioInserts = features.map(feature => {
        return feature.elements.map(async scenario => {
            if (!await scenarioExistsInfeature(feature, scenario)) {
                await pushScenario(feature, scenario)
                // results.push({InsertedScenario: scenario.name})
                return {InsertedScenario: scenario.name}
            } else {
                await updateScenario(feature, scenario)
                results.push({UpdatedScenario: scenario.name})
                return {UpdatedScenario: scenario.name}
            }
            return {scenarioExists:scenario.name}
        })
    })
    const promisesForScenarios = flatten(scenarioInserts)
    const scenarioInsertionUpdation = await Promise.all(promisesForScenarios);
    return res.json(featureInsertions.concat(scenarioInsertionUpdation))

})

insertFeature = async (feature) => {

    let data = await db.collection(resultCollection).insert(feature)
    return data
}

featureExists = async (feature) => {
    let data = await db.collection(resultCollection).find({name: feature.name}).toArray()
    return (data.length > 0)
}

async function generateReport() {
    let results = await db.collection(resultCollection).find({}).toArray()
    console.log(results)
    fs.writeFileSync('./json-files/cucumber.json', JSON.stringify(results));
    report.generate()
    return results

}

app.post('/generate-report-json', async (req, res) => {
    let results = await generateReport(res);
    res.json(results.length)
})
