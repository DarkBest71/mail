
/**
 * https://github.com/eleith/emailjs
 */
exports.action = function(data, callback, config, SARAH){

  // récupérer config
  config = config.modules.mail;
  if (!config || !config.email){
    callback({'tts' : 'Configuration invalide'});
    return;
  }
  
  // Envoyer un email
  if (data.text && data.subject){
    sendMail(data, config, callback);
    return;
  }
  
  data.inbox  = 'IFTTT/FreeMobile';
  data.since  = moment().subtract('days', 5).valueOf();
  data.speech = true;
  
  // Vérifie le mails
  if (data.inbox && data.since){
    checkMail(data, config, callback, SARAH);
    return;
  }
}

var moment = require('moment');
var sinceInbox  = moment().valueOf();
var sinceSpeech = moment().valueOf();
var sinceReco   = moment().valueOf();

exports.cron = function(callback, task, SARAH){
  
  var config = SARAH.ConfigManager.getConfig().modules.mail;
  var cb = function(){  }
  
  // Vérifie inbox
  if (task.inbox){
    var data = { inbox: task.inbox, since: sinceInbox }
    checkMail(data, config, cb, SARAH);
    sinceInbox  = moment().valueOf();
  }

  // Vérifie speechbox
  if (task.speechbox){
    var data = { inbox: task.speechbox, since: sinceSpeech, speech: true }
    checkMail(data, config, cb, SARAH);
    sinceSpeech = moment().valueOf();
  }
  
  // Vérifie recobox
  if (task.recobox){
    var data = { inbox: task.recobox, since: sinceReco, recognize: true }
    checkMail(data, config, cb, SARAH);
    sinceReco   = moment().valueOf();
  }
  
  callback({});
}


// ------------------------------------------
//  ENVOYER UN MAIL
//  https://github.com/eleith/emailjs
// ------------------------------------------

var sendMail = function(data, config, callback){
  var email  = require("email");
  var server = email.server.connect({
    user:     config.email, 
    password: config.password, 
    host:     config.smtp,
    ssl:      config.ssl == 'true'
  });
  
  server.send({
    text:    data.text, 
    from:    data.from || config.email, 
    to:      data.to   || config.to,
    subject: data.subject
  }, function(err, message) {
   
    callback({'tts': (err ? "Erreur lors de l'envoie du message" : "Message envoyé") });
  
  });
}

// ------------------------------------------
//  VÉRIFIER LE COURRIER
// ------------------------------------------

var checkMail = function(data, config, callback, SARAH){

  var inbox = data.inbox;
  if (!inbox){ return callback('No INBOX config'); }
  
  fetchInbox(inbox, config, function(mails){

    // Dans le cas ou des erreurs
    if (typeof mails === 'string'){
      console.log('[Mail] ',mails);
      return callback({'tts' : 'Une erreur est survenue'});
    }
    
    // Filtrer les messages
    var tts = '';
    var messages = [];
    for (var i = 0 ; i < mails.length ; i++){
      var msg  = mails[i];
      
      // selon to 'since'
      var date = moment(msg.headers.date);
      if (data.since && date.valueOf() < data.since){ continue; }
      messages.push(msg);
      
      // Attachement
      if (msg.attachments){
        msg.attachments.forEach(function(attachement){
            
          // reconnaître l'attachement
          if (data.recognize){
            writeAttachment(attachement, 'audio/');
            
          // Discours attachement
          } else if (data.speech){
            writeAttachment(attachement, 'plugins/mail/speech/');
            var cfg = SARAH.ConfigManager.getConfig();
            var url = 'http://'+cfg.http.ip+':'+cfg.http.port;
            SARAH.play(url+'/assets/mail/speech/'+attachement.fileName);
          }
        });
        continue;
      }
      
      // Run Action
      var rgxp = /^(https*:\/\/\S+)/i;
      var match = msg.text.match(rgxp);
      
      if (match && match.length > 0){
        var url = match[1];
        console.log('[Mail] URL: ', url);
        var request = require('request');
        request({ 'uri' : url }, function (err, response, body){
          if (err || response.statusCode != 200) { console.log('[Mail] CRON:', err); }
          SARAH.speak(body);
		  
        });
      }
      
      // TTS sujet
      else {
      SARAH.speak("Vous avez reçu un nouvel email, voici le titre de votre message, ; " + msg.subject); 
      }
    }
    
    // Retour rappel
    callback({
      'mails' : messages
    });
  })
}

var writeAttachment = function(attachement, folder){

  console.log('[Mail] Write attachement: ' + attachement.fileName);
  var fs = require('fs');
  var buf = attachement.content;
  var fd = fs.openSync(folder+attachement.fileName,'w+');
  fs.writeSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);

}

// ------------------------------------------
//  VÉRIFICATION INBOX
//  https://gist.github.com/romulka/3104968
// ------------------------------------------

var ImapConnection = require('./lib/imap').ImapConnection;
var MailParser = require("./lib/mailparser").MailParser;
var Step = require('./lib/step');

var fetchInbox = function(inbox, config, callback){

  var imap = new ImapConnection({
    username: config.email,
    password: config.password,
    host: config.imap,
    port: 993,
    secure: config.ssl == 'true'
  });
  
  var messages = [];
  
  Step(
  
    // Connecté
    function(){ console.log('[Mail] Connect IMAP'); imap.connect(this); },
    
    // ouvert Inbox
    function(err, data){
      console.log('[Mail] Open Inbox', err || '');
      if(err){ return callback(err); }
      imap.openBox(inbox, true, this);
      setTimeout(fetchEnd, 30000);
    },
    
    // recherche messages
    function(err, boxFolder){
      console.log('[Mail] Search messages', err || '');
      if(err){ return callback(err); }
      moment.lang('en');
      var m = moment().subtract('days', 1).format("MMMM DD, YYYY");
      moment.lang('fr');
      imap.search(['UNSEEN', ['SINCE', m]], this);
    },
    
    // rapporter messages
    function(err, results){
      console.log('[Mail] Fetch messages', err || '');
      if(err){ return callback(err); }
      imap.fetch(results, {
        headers: {parse: false},
        body: true,
        cb: function(fetch){  fetch.on('message', fetchMsg);  }
      }, this);
    },
    
    // Se Déconnecter
    function(err){
      console.log('[Mail] Is END', err || '');
      isEnd = true;
      if(err){
        return fetchEnd(); 
      }
      
    }
  );

  // rapporter message
  // https://github.com/mscdex/node-imap
  // https://github.com/andris9/mailparser
  var fetchMsg = function(msg){
    ++started;
    var parser = new MailParser();
    parser.on('end', function(mail){
      ++finished;
      messages.push(mail);
      fetchEnd();
    });

    msg.on('data', function(chunk){
      parser.write(chunk.toString());
    });
    
    msg.on('end', function(){
      parser.end();
      console.log('[Mail] Finished message no. ', msg.seqno);      
    });
  }
  
  var isEnd    = false;
  var started  = 0;
  var finished = 0;
  var lougout  = false;
  var fetchEnd = function(){
    if (isEnd !== true || started != finished || lougout){ return; }
    imap.logout(); lougout = true;  
    console.log('[Mail] IMAP logout');
    callback(messages);
  }
}

