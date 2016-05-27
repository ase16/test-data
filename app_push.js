'use strict';
const config = require('config');
const log = require('winston');
log.level = config.get('log.level');

const tweetsFile = 'tweets.txt';
const keywordsFile = 'keywords.txt';
const tweetpusher = require('./tweetpusher.js');
const db = require('./datastore.js');

log.info('Tweetpusher initializing...');
db.connect(config.get('gcloud'), function() {
    tweetpusher.init(db, tweetsFile, keywordsFile, function(err, res) {
        log.info('Tweetpusher is ready.');
    });
});