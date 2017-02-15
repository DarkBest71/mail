# mail
Auteur: Avatar Rousseau Dark-Best.

Ce plugin mail fonctionne pour le moment avec Gmail.

# version 3.16
Le plugin mail permettant de lire le ( Titre de vaux mails ) mais pas son contenue.

Mails d’alerte ou de notification des titre de vaux mails via sarah.

Le plugin mail est capable d’interroger votre boite mail (IMAP) afin d’effectuer la lecure. 

# Explication fonctionnement:

Déjà j'ai fait en sorte que le plugin soit déjà réglé , 

vous avec juste a mettre votre adresse mail de Gmail, est le mot de passe de vottre Gmail.

Mail on c'est jamais je vais mettre les réglage ici

# Exemple:

Rendez-vous dans le dossier du plugin mail, puis dans le fichier mail.prop ouvrez le.

Sa donne cela:

{
  "modules" : { 
    "mail"  : {
      "description": "reception des titre de vaux mail",
      "version"    : "3.16",
      "email"      : "votre adresse mail",
      "password"   : "votre mot de passe de votre adresse mail gmail",
      "smtp"       : "smtp.gmail.com",
      "imap"       : "imap.gmail.com",
      "ssl"        : "true",
      "to"         : ""
    }
  },
  
  "cron" : {
    "mail" :   { 
      "name"       : "mail",
      "description": "Interroge périodiquement un compte Mail pour effectuer des actions: lecture audio, tts, actions",
      "time"       : "0 */1 * * * *",
      "inbox"      : "Inbox",
      "speechbox"  : "",
      "recobox"    : ""
    }
  }
}

Alors vous avez juste a metre votre adresse mail gmail ou c'est marquer "email" : "votre adresse mail",

est le mot d passe de votre adresse mail gmail: "password" : "votre mot de passe de votre adresse mail gmail",

Voilà teste le.
