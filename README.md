# slack-web-concept
Slack "slash command" to search Web Concepts

## usage

* Install the webtask CLI tool

```
npm install wt-cli -g
```

* Login into your account (a code will be sent to the provided email)

```
wt init your-email@example.com
```

*

* Run the webtask and copy the URL where it is deployed

```
wt create --name slack-web-concept --watch index.js
```

* Go to your slack and create a [slash command](https://{teamname}.slack.com/apps/search?q=slash)
  * Give it a name (e.g. `/web-concept`)
  * Fill the URL with the webtask URL
  * Copy the token

* Stop the CLI tool and run it again with the token defined as a secret

```
wt create --name slack-web-concept --watch index.js --secret token=the-token-copied-from-slack
```
