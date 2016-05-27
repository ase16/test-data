const utils = {
    // @parma callback fn(arr) - get array of keywords
    getTerms: function (fileName, callback) {
        // fetching tweets given keywords in a file
        var fs = require('fs');
        var keywords = [];
        try {
            fs.accessSync(fileName, fs.R_OK);
            keywords = fs.readFileSync(fileName).toString().split('\n');
        } catch (e) {
            console.log("Could not read file: " + fileName);
            return callback([]);
        }

        // some basic cleansing
        keywords = keywords.map(function(k) {
            return k.toLowerCase().trim();
        });
        keywords = keywords.filter(function(k) {
            return k.length > 0;
        });
        keywords.sort();

        callback(keywords);
    }
};

module.exports = utils;