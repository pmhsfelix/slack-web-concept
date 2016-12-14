'use latest'
const request = require('request')
const conceptsUrl = 'http://webconcepts.info/concepts.json'

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

  request(conceptsUrl, (error, response, body) => {
    if (error || response.statusCode >= 500){
      return send('Unable to access the http://webconcepts.info, sorry');
    }

    var concepts = JSON.parse(body);
    var concept = concepts.filter(c => new RegExp('^' + conceptType + '$', 'i').test(c.concept))[0];

    if(!concept) {
      var conceptList = concepts.reduce((list, c) => {
        list += ', ' + c.concept;
        return list;
      }, '');
      return send(`Unknown concept-type "${parts[0]}", usage: "{concept-type} {concept-name}", where {concept-type} can be: ${conceptList}`);
    }

    var conceptValue = concept.values.filter(c => new RegExp('^' + conceptName + '$', 'i').test(c.value))[0];

    if(!conceptValue) {
      return send(`Unable to find the "${conceptName}" concept, sorry.`);
    }

    var respText = conceptValue.details[0].description;
    var spec = conceptValue.details[0].documentation;
    var site = conceptValue.id;
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
