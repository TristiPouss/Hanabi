// Chargement des modules
const express = require('express');
const game = require('./public/js/card.js');
const app = express();
const port = 8080;
const server = app.listen(port, function() {
    console.log("C'est parti ! En attente de connexion sur le port "+port+"...");
});

// Ecoute sur les websockets
const { Server } = require("socket.io");
const e = require('express');
const io = new Server(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/hanabi.html');
});

/*** Gestion des lobbys ***/

let lobbyArray = [];

function seekLobby(name){
    let res = null;
    lobbyArray.forEach(lobby => {
        if(lobby.name == name){
            res = lobby;
        }
    });
    return res;
}

class Lobby {
    name;
    owner;
    littlePlayers;
    currGame;
    constructor(n, id){
        this.name = n;
        this.owner = id;
        this.littlePlayers = [id];
        this.currGame = null;
        lobbyArray.push(this);
    }

    addPlayer(n){
        return this.littlePlayers.push(n);
    }

    launchGame(){
        this.currGame = new game.Game(this.littlePlayers);
    }

    getClients(){
        let res = [];
        this.littlePlayers.forEach(player => {
            Object.keys(clients).forEach(client => {
                if(player == client){
                    res.push(client);
                }
            })
        });
        return res;
    }

    rmPlayer(n){
        if(n == this.owner && this.littlePlayers.length > 1){
            this.electNewOwner();
        }
        const index = this.littlePlayers.indexOf(n);
        if (index > -1) {
            this.littlePlayers.splice(index, 1);
            return true;
        }
        return false;
    }

    electNewOwner(){
        let i = 0;
        while(i < this.littlePlayers.length){
            let curr = this.littlePlayers[i];
            if(curr != this.owner){
                this.owner = curr;
                return;
            }
            ++i;
        }
    }
}

class GameData {
    constructor(Lobby,Player){
        this.playersCards = {};
        this.nb_card = Lobby.currGame.hands[Player].length;
        this.nb_hints = Lobby.currGame.hints;
        this.nb_fails = Lobby.currGame.fails
        this.stacks = Lobby.currGame.stacks;
        Object.keys(Lobby.currGame.hands).forEach(clientName => {
            if (clientName != Player){
                this.playersCards[clientName] = Lobby.currGame.hands[clientName];
            }
        });
    }
}

/*** Log msg ***/

class Log{
    isLobby;
    text;
    date;
    constructor(isLobby, text, date){
        this.isLobby = isLobby;
        this.text = text;
        this.date = date;
    }
}

/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    socket.emit("reset");

    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;
    var currentLobby = null;

    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        while (clients[id]) {
            id = id + "(1)";
        }
        currentID = id;
        clients[currentID] = socket;
        console.log("Nouvel utilisateur : " + currentID);
        // envoi de la nouvelle liste à tous les clients connectés
        io.sockets.emit("listClient", Object.keys(clients));
        // envoi de la liste de lobby à ce client
        socket.emit("listLobby", JSON.stringify(lobbyArray));
    });

    /**
     * Creation de lobby
     */
    socket.on("createLobby", function(name){
        while(seekLobby(name) != null){
            name = name + "(1)";
        }
        let l = new Lobby(name, currentID);
        currentLobby = l;
        console.log("Nouveau lobby : " + name);
        currentLobby.getClients().forEach(client => {
            clients[client].emit("playerList", JSON.stringify(currentLobby.littlePlayers));
        });
        socket.emit("lobbyConnection", JSON.stringify({lobby: currentLobby.name, isOwner: true}));
        sendLogToLobby(true, "Le lobby a bien été créé.");
        // envoi de la nouvelle liste de lobby à tous les clients connectés
        io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
    });

    socket.on("connectLobby", function(name){
        let lobby = seekLobby(name);
        if(lobby != null){
            lobby.addPlayer(currentID);
            currentLobby = lobby;
            currentLobby.getClients().forEach(client => {
                clients[client].emit("playerList", JSON.stringify(currentLobby.littlePlayers));
            });
            socket.emit("lobbyConnection", JSON.stringify({lobby: name, isOwner: false}));
            sendLogToLobby(true, currentID + " a rejoint le lobby.");
            // envoi de la nouvelle liste de lobby à tous les clients connectés
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
        }else console.log("Le client n'est pas dans un lobby");
    });

    /**
     *  Gestion des déconnexions
     */

    // Déconnexion du lobby
    socket.on("disconnectLobby", function(){
        if(currentLobby != null){
            disconnectFromLobby();
            currentLobby.getClients().forEach(client => {
                clients[client].emit("playerList", JSON.stringify(currentLobby.littlePlayers));
            });
            checkLobby(); // supprime le lobby si il est vide
            // envoi de la nouvelle liste de lobby à tous les clients connectés
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
        }else console.log("Le client n'est pas dans un lobby");
    });


    function logout_disconnect (){
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // si client était dans un lobby
            if(currentLobby){
                // déconnexion du lobby
                disconnectFromLobby();
                currentLobby.getClients().forEach(client => {
                    clients[client].emit("playerList", JSON.stringify(currentLobby.littlePlayers));
                });
                checkLobby();
                io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
            }
            // suppression de l'entrée
            delete clients[currentID];
            currentID = null;
            currentLobby = null;
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
    }
    // fermeture
    socket.on("logout", logout_disconnect);
    // déconnexion de la socket
    socket.on("disconnect", logout_disconnect);

    /*** Misc ***/

    /** le parametre isLobby est : - vrai si le log doit venir du lobby
     *                             - faux s'il vient du jeu
     */
    function sendLogToLobby(isLobby, txt){
        currentLobby.getClients().forEach(client => {
            clients[client].emit("log", JSON.stringify(new Log(isLobby, txt, Date.now())));
            //console.log("Envoi d'un message au lobby " + currentLobby.name);
        });
    }

    function disconnectFromLobby(){
        // double vérification du currentLobby
        if(currentLobby != null && currentLobby.rmPlayer(currentID)){
            sendLogToLobby(true, currentID + " a quitté le lobby.");
            let reset = false;
            if(currentLobby.currGame != null){
                reset = true;
                currentLobby.currGame = null;
                sendLogToLobby(false, "Partie interrompue");
            }
            currentLobby.getClients().forEach(client => {
                if(client == currentLobby.owner){
                    clients[client].emit('newOwner');
                }
                if(reset){
                    clients[client].emit("resetGame");
                }
            });
        };
    }

    function checkLobby(){
        // double vérification du currentLobby
        if(currentLobby != null && currentLobby.littlePlayers.length == 0){
            console.log("Suppression du lobby : " + currentLobby.name);
            sendLogToLobby(true, "Suppression du lobby");
            const index = lobbyArray.indexOf(currentLobby);
            if (index > -1) lobbyArray.splice(index, 1);
        }
    }

    function traductionColor(color){
        switch(color){
            case "red":
                return "rouge";
            case "blue":
                return "bleue";
            case "green":
                return "verte";
            case "white":
                return "blanche";
            case "yellow":
                return "jaune";
            default:
                return color;
        }
    }
    /***************************** */
    /*         GAME PART           */
    /***************************** */

    socket.on("launchGame", function(){
        if(currentLobby != null
        && currentLobby.owner == currentID
        && currentLobby.currGame == null
        && currentLobby.littlePlayers.length > 1){
            currentLobby.launchGame();
            sendLogToLobby(false, "Lancement de la partie");
            currentLobby.getClients().forEach(client => {
                let data = new GameData(currentLobby,client);
                clients[client].emit("launchGame", JSON.stringify(data));
            });
        }else {
            console.log("La partie ne peut pas être lancée");
            sendLogToLobby(false, "Les conditions pour lancer la partie ne sont pas remplies");
        }
    });

    socket.on("hint", function(res){
        if(currentLobby != null){
            res = JSON.parse(res);
            let resp = currentLobby.currGame.give_information(res.idPlayer, res.value);
            if(resp){
                sendLogToLobby(false, currentID + " a donné une information à " + res.idPlayer);
                if (res.value == "color") res.value = traductionColor(res.value);
                sendLogToLobby(false, "Les cartes " + resp + " sont " + res.value);
                let respHint = {nb_hints : currentLobby.currGame.hints}
                respHint = JSON.stringify(respHint);
                currentLobby.getClients().forEach(client => {
                    clients[client].emit("updateHints", respHint);
                });
            } else clients[currentID].emit("wrongAction", "Impossible de donner une information");

        }else console.log("Le client n'est pas dans un lobby");
    });

    socket.on("discard", function(res){
        if(currentLobby != null){
            if (currentLobby.currGame.discard_card(currentID, res.indexCard)){;
                currentLobby.getClients().forEach(client => {
                    let data = new GameData(currentLobby,client);
                    clients[client].emit("updateGame", JSON.stringify(data))
                });
            } else clients[currentID].emit("wrongAction", "Impossible de defausser la carte");
        }else{console.log("Le client n'est pas dans un lobby");}
    });

    socket.on("play", function(res){
        if(currentLobby != null){
            currentLobby.currGame.play_card(currentID, res.indexCard, res.indexStack)
        }else console.log("Le client n'est pas dans un lobby");
    });
});