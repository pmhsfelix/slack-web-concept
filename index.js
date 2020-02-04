'use latest'
const request = require('request')
const conceptsUrl = 'http://webconcepts.info/concepts.json'
function useAlias(conceptType){
  const alias = {
    'method': 'http-method',
    'status': 'http-status-code',
    'relation': 'link-relation'
  }
  return alias[conceptType] || conceptType;
}

module.exports = function (ctx, cb) {

  const send = (text, attachments) => {
    cb(null, {
      response_type: "ephemeral",
      text: text,
      attachments: attachments
    });
  }

  const sendUsage = (concepts) => {
    let conceptList = concepts.map(c => c.concept).join(', ')
    return send(`Usage: "{concept-type} {concept-name}", where {concept-type} can be: ${conceptList}`);
  }

  const sendUsageForUnknownType = (type, concepts) => {
    let conceptList = concepts.map(c => c.concept).join(', ')
    return send(`Unknown concept-type "${type}", usage: "{concept-type} {concept-name}", where {concept-type} can be: ${conceptList}`);
  }

  // authorize
  // yes, I know, not a constant time comparison :(
  if(ctx.secrets['slack-token'] != ctx.body.token){
    return cb(null,{})
  }

  request(conceptsUrl, (error, response, body) => {
    if (error || response.statusCode >= 500){
      return send('Unable to access the http://webconcepts.info, sorry');
    }

    const concepts = JSON.parse(body);

    // check for empty ...
    const text = ctx.body.text.trim();
    if(!text){
      return sendUsage(concepts);
    }

    // ... or invalid command
    const parts = text.split(' ');
    if(parts.length != 2){
      return sendUsage(concepts);
    }

    const conceptType = useAlias(parts[0]);
    const conceptName = parts[1];

    const concept = concepts.filter(c => new RegExp('^' + conceptType + '$', 'i').test(c.concept))[0];

    if(!concept) {
      return sendUsageForUnknownType(conceptType, concepts);
    }

    const conceptValue = concept.values.filter(c => new RegExp('^' + conceptName + '$', 'i').test(c.value))[0];

    if(!conceptValue) {
      return send(`Unable to find the "${conceptName}" concept, sorry.`);
    }

    const conceptTypeName = concept['name-singular'];
    const respText = conceptValue.details[0].description;
    const spec = conceptValue.details[0].documentation;
    const site = conceptValue.id;
    send(
        `*${conceptTypeName} ${conceptName}*:\n${respText}`,
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
