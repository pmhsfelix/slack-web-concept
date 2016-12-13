'use latest'
const request = require('request')
const uri = (type) =>  (concept) => `http://webconcepts.info/concepts/${type}/${concept}.json`

var concepts = {
  'status': uri('http-status-code'),
  'method': uri('http-method'),
  'relation': uri('link-relation')
}

var conceptList = Object.keys(concepts).join(', ')

module.exports = function (ctx, cb) {

  const send = (text, attachments) => {
    cb(null, {
      response_type: "ephemeral",
      text: text,
      attachments: attachments
    });
  }

  const sendUsage = () => {
    return send(
      `Usage: "{concept-type} {concept-name}", where {concept-type} can be: ${conceptList}`);
  }

  // authorize
  // yes, I know, not a constant time comparison :(
  if(ctx.secrets['slack-token'] != ctx.data.token){
    return cb(null,{})
  }

  // check for empty ...
  var text = ctx.data.text.trim();
  if(!text){
    return sendUsage()
  }

  // ... or invalid command
  var parts = ctx.data.text.trim().split(' ');
  if(parts.length != 2){
    return sendUsage();
  }

  var conceptType = parts[0];
  var conceptName = parts[1];
  var f = concepts[conceptType];
  if(!f){
    return send(`Unknown concept-type "${parts[0]}", usage: "{concept-type} {concept-name}", where {concept-type} can be: ${conceptList}`);
  }

  var reqUri = f(conceptName);

  request(reqUri, (error, response, body) => {
    if (error || response.statusCode >= 500){
      return send('Unable to access the http://webconcepts.info, sorry');
    }
    if (response.statusCode > 200){
      return send(`Unable to find the "${conceptName}" concept, sorry.`)
    }
    var json = JSON.parse(body)
    var respText = json.details[0].description;
    var spec = json.details[0].documentation;
    var site = json.id
    send(
        `*${conceptName}*:\n${respText}`,
        [
          {
            title: "See the detailed specification",
            title_link: spec
          },
          {
            title: "See the http://webconcepts.info page",
            title_link: site
          }
        ]
      );
  });
};
