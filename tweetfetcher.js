'use strict';

const config = require('config');
const twit = require('twit');			// Twitter API module --> https://github.com/ttezel/twit
const utils = require('./utils.js');
const log = require('winston');
log.level = config.get('log.level');

let tweetsFilename;
let tweetsFileStream;
let keywordsFilename;
let currentStreamTerms = [];


// Processes incoming tweet.
function onNewTweet(tweet) {
    log.debug('New Tweet:\t[id: %s, text: %s]', tweet['id_str'], tweet['text']);

    if (!tweetsFileStream) {
        var fs = require('fs');
        tweetsFileStream = fs.createWriteStream(tweetsFilename);
    }

    tweetsFileStream.write(JSON.stringify({
            id_str: tweet['id_str'],
            created_at: tweet['created_at'],
            text: tweet['text']
        }) + '\n');
}

// set up twitter stream and subscribe to keywords
// @param terms array of keywords
// @param callback fn(stream)
function subscribeToTweets(terms, callback) {
    var stream = twitter.stream('statuses/filter', {
        track: terms,
        language: 'en'
    });
    stream.on('tweet', onNewTweet);

    // set up some logging
    // the messages are described here:
    // https://dev.twitter.com/streaming/overview/messages-types
    stream.on('connect', function (request) {
        log.info('Twitter - Connect');
    });
    stream.on('connected', function (response) {
        log.info('Twitter - Connected');
    });
    stream.on('disconnect', function (disconnectMessage) {
        log.warn('Twitter - Disconnect');
    });
    stream.on('reconnect', function (request, response, connectInterval) {
        log.info('Twitter - Reconnect in %s ms', connectInterval);
    });
    stream.on('limit', function (limitMessage) {
        log.warn('Twitter - Limit: ', limitMessage);
    });
    stream.on('warning', function (warning) {
        log.warn('Twitter - Warning: ', warning);
    });
    stream.on('error', function (error) {
        log.warn('Twitter - Error: ', error)
    });

    log.info('Set up connection to twitter stream API.');
    log.info('Stream - terms (%s): %s', terms.length, terms);

    callback(stream);
}

var twitterCredentials = config.get('twitter');
var twitter = new twit(twitterCredentials);
var twitterStream;

const tweetfetcher = {

    init: function(fileTweets, fileKeywords, callback) {

        tweetsFilename = fileTweets;
        keywordsFilename = fileKeywords;

        // connect to twitter with given terms
        utils.getTerms(keywordsFilename, function(terms) {
            subscribeToTweets(terms, function(stream) {
                twitterStream = stream;
                currentStreamTerms = terms;
                log.info("Tweetfetcher: stream started.");
                if (callback) callback();
            });
        });
    }
};

module.exports = tweetfetcher;