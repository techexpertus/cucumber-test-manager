var reporter = require('cucumber-html-reporter');

var options = {
    theme: 'bootstrap',
    jsonFile: 'json-files/cucumber.json',
    output: 'views/cucumber_report.html',
    reportSuiteAsScenarios: true,
    launchReport: true,
    metadata: {
        "App Version":"0.3.2",
        "Test Environment": "STAGING",
        "Browser": "Chrome  54.0.2840.98",
        "Platform": "Windows 10",
        "Parallel": "Scenarios",
        "Executed": "Remote"
    }
};


 function generate(){
    reporter.generate(options);
}

module.exports ={
    generate
}
