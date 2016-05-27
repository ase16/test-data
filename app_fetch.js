'use strict';
const config = require('config');
const log = require('winston');
log.level = config.get('log.level');

const tweetsFile = 'tweets.txt';
const keywordsFile = 'keywords.txt';
const tweetfetcher = require('./tweetfetcher.js');

log.info('Tweetfetcher initializing...');
tweetfetcher.init(tweetsFile, keywordsFile, function(err, res) {
    log.info('Tweetfetcher is ready.');
});