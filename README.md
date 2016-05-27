# test-data
## app_fetch.js
Fetches tweets relevant to the given keywords in the file `keywords.txt`. The tweets are stored in the file `tweets.txt`. Each tweet is serialized as a JSON string - one tweet on each line (not in a JSON array due to the stream that appends tweets).

## app_push.js
Pushes tweets in the file `tweets.txt` to the datastore (similar to `jazz`).
