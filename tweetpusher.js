'use strict';

const config = require('config');
const log = require('winston');
log.level = config.get('log.level');
const utils = require('./utils.js');

let db;
let tweetsFilename;
let keywordsFilename;
let currentStreamTerms = [];
let vms = [];
let roundRobinIndex = 0;

let cgeConfig = config.get("gcloud");
let will = config.get("will");
let loadBalancer = config.get("loadBalancer");
const LIST_OF_VMS_UPDATE_INTERVAL = loadBalancer.listOfVmsUpdateInterval;


// Selects the next VM in a round robin fashion
// returns 'default' if no VM running.
function selectNextVM() {
    var currentRoundRobinIndex = roundRobinIndex;
    roundRobinIndex = ((roundRobinIndex + 1) % vms.length == 0 ? 0 : roundRobinIndex + 1);
    var selectedVM = vms.length > 0 ? vms[currentRoundRobinIndex] : 'default';
    return selectedVM;
}

// Processes incoming tweet. We "distribute" the tweets in a round-robin manner to the currently running VMs of the will-nodes instance group.
function onNewTweet(tweet) {
    log.debug('New Tweet:\t[id: %s, text: %s]', tweet['id_str'], tweet['text']);

    var selectedVM = selectNextVM();
    db.insertTweet(tweet, selectedVM, function(err, result){
        if (err) {
            log.error('Could not insert tweet:', err);
        } else {
            log.debug('Inserted tweet into the database.');
        }
    });
}

function start() {
    log.info("Tweetpusher: started.");
    utils.getTerms(keywordsFilename, function(terms) {
        currentStreamTerms = terms;

        var fs = require('fs');
        var readline = require('readline');
        var lineReader = readline.createInterface({
            input: fs.createReadStream(tweetsFilename, {encoding: 'utf8'})
        });
        var numTweets = 0;
        lineReader.on('line', function(line) {
            var tweet = JSON.parse(line);
            onNewTweet(tweet);
            numTweets += 1;
        });
        lineReader.on('close', function() {
            log.info("Processed " + numTweets + " tweets");
        });
    });
}

function updateAvailableVMs() {
    var cloud = require('./cloud.js')(cgeConfig, function (err) {
        if (!err) {
            cloud.listVMsOfInstanceGroup(will.instanceGroupZone, will.instanceGroupName, function (err, res) {
                if (!err) {
                    if (res.hasOwnProperty('managedInstances')) {
                        vms = res.managedInstances.filter(function (vm) {
                            return ((vm.hasOwnProperty('instanceStatus') && vm.instanceStatus === 'RUNNING')
                                 || (vm.hasOwnProperty('currentAction')  && vm.currentAction  === 'CREATING'));
                        }).map(function (vm) {
                            return vm.name;
                        });
                    }
                    else {
                        vms = [];
                    }
                    log.info("Available will-nodes = ", vms);
                }
                else {
                    console.log(err);
                }
            });
        }
        else {
            console.log(err);
        }
    });
}

const tweetpusher = {

    init: function(dbModule, fileTweets, fileKeywords, callback) {
        db = dbModule;
        tweetsFilename = fileTweets;
        keywordsFilename = fileKeywords;

        // Periodically update list of available nodes of the will-nodes instance group
        updateAvailableVMs();
        setInterval(updateAvailableVMs, LIST_OF_VMS_UPDATE_INTERVAL * 1000);

        callback();

        setTimeout(start, 1000);
    }
};

module.exports = tweetpusher;