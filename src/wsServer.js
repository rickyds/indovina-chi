const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8082 });
// Elenco utenti connessi al server
let users = [];

// Elenco stanze da gioco
let rooms = [];

// assegna ID univoco agli utenti appena connessi
wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

// Crea una nuova stanza da gioco, assegnandole un ID
function createRoom() {
    const newRoom = {
        roomId: rooms.length > 0 ? rooms.at(-1).roomId + 1 : 1,
        player1: null,
        player2: null
    };
    rooms.push(newRoom);
    return newRoom;
}

// Dato un giocatore, lo assegna alla prima stanza da gioco libera disponibile tra quelle esistenti
// Altrimenti ne crea una nuova
// Viene restitito l'oggetto room della stanza in cui è stato collocato il giocatore
function getAvailableRoom(player) {


    console.log(player);
    
    const addToNewRoom = (newPlayer) => {
        const room = createRoom();
        room.player1 = newPlayer;
        return room;
    };
    
    if (rooms.length > 0 ) {
        for (const room of rooms) {
            if (!room.player1) {
                room.player1 = player;
                return room;
            } else if (!room.player2) {
                room.player2 = player;
                return room;
            }
        }
    }
    
    return addToNewRoom(player);
}

// Metodo per inviare un messaggio websocket ad una lista di destinatari,
// rappresentata dall'array receivers
function sendTo(receivers, content) {
    
    const isReceiver = (id) => {
        for (const recId of receivers) {
            if (recId === id) {
                return true;
            }
        }
        return false;
    };
    
    wss.clients.forEach((client) => {
        if (isReceiver(client.id) && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(content));
        }
    });
    
}

wss.on("connection", ws => {

    ws.id = wss.getUniqueID();
    console.log(`New client connected with id: ${ws.id}`);

    ws.onmessage = ({data}) => {
        
        const jsonData = JSON.parse(data);
        
        if (jsonData.type === "login") {
            
            // creao nuovo giocatore
            const newUser = {
                id: ws.id,
                name: jsonData.playerName
            };

            // inserisco il giocatore in una stanza
            const availableRoom = getAvailableRoom(newUser);
            // salvo l'informazione della stanza in cui si trova
            newUser.roomId = availableRoom.roomId;
            // aggiungo il giocatore all'elenco di quelli connessi
            users.push(newUser);
            console.log("NEW PLAYER : ",newUser);
            console.log("PLAYER ADDED TO ROOM : ", availableRoom);
            // invio avvenuto login
            sendTo([newUser.id],{type: "loggedin", ...newUser});
            
            // controllo che la stanza da gioco sia stata riempita
            if (availableRoom.player1 && availableRoom.player2) {
                // invio info per avviare la partita
                sendTo([availableRoom.player1.id, availableRoom.player2.id],{
                    type: "roomready",
                    ...availableRoom
                });
            }
            
        } else if (
            jsonData.type === "question" ||
            jsonData.type === "answer" ||
            jsonData.type === "endturn" || 
            jsonData.type === "solution"
            ) {

            sendTo([jsonData.receiverId],jsonData);

        } else if (jsonData.type === "solutionresult") {

            sendTo([jsonData.receiverId],jsonData);

            // rimuovo utenti dalle stanze
            for (let room of rooms) {
                if (room.roomId  === jsonData.roomId) {
                    room.player1 = null;
                    room.player2 = null;
                    console.log("Stanza svuotata", room);
                    break;
                } 
            }
            
        } else if (jsonData.type === "newgame") {

            // ottengo utente dall'elenco di quelli già connessi
            const user = users.filter(u => u.id === jsonData.player.id)[0];

            // inserisco il giocatore in una nuova stanza libera
            const availableRoom = getAvailableRoom(user);
            // salvo l'informazione della stanza in cui si trova
            user.roomId = availableRoom.roomId;
            console.log("EXISTING PLAYER ADDED TO ROOM : ", availableRoom);
            // invio avvenuto login
            sendTo([user.id],{type: "loggedin", ...user});
            
            // controllo che la stanza da gioco sia stata riempita
            if (availableRoom.player1 && availableRoom.player2) {
                // invio info per avviare la partita
                sendTo([availableRoom.player1.id, availableRoom.player2.id],{
                    type: "roomready",
                    ...availableRoom
                });
            }

        } else {

            console.log(`Client ${ws.id}: ${data}`);
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(`${data}`);
                }
            });
        }
        
        
    };

    ws.onclose = function() {
        console.log(`Client ${ws.id} has disconnected!`);
        // rimuovo utente dall'elenco
        users = users.filter(user=>user.id!==ws.id);
        console.log("logged users", users);
        // rimuovo utente dalla stanza
        let playerToNotify;
        for (let room of rooms) {
            if (room.player1 && ws.id === room.player1.id) {
                room.player1 = null;
                playerToNotify = room.player2 ? room.player2.id : null;
                break;
            } else if (room.player2 && ws.id === room.player2.id) {
                room.player2 = null;
                playerToNotify = room.player1 ? room.player1.id : null;
                break;
            }
        }
        // avviso l'avversario
        if (playerToNotify) {
            sendTo(
                [playerToNotify],
                {type: "quit", message: "Il tuo avversario ha abbandonato la partita"}
            );
        }
    };
});