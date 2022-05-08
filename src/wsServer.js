const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8082 });
let users = [];
let rooms = [];

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

function createRoom() {
    const newRoom = {
        roomId: rooms.length > 0 ? rooms.at(-1).roomId + 1 : 1,
        player1: null,
        player2: null
    };
    rooms.push(newRoom);
    return newRoom;
}

function getAvailableRoom(playerId) {
    
    const addToNewRoom = (playerId) => {
        const room = createRoom();
        room.player1 = playerId;
        console.log(room);
        return room;
    };
    
    if (rooms.length > 0 ) {
        for (const room of rooms) {
            if (!room.player1) {
                room.player1 = playerId;
                console.log(room);
                return room;
            } else if (!room.player2) {
                room.player2 = playerId;
                console.log(room);
                return room;
            }
        }
    }
    
    return addToNewRoom(playerId);
}

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
            
            const availableRoom = getAvailableRoom(ws.id);
            
            const newUser = {
                id: ws.id,
                playerName: jsonData.playerName,
                roomId: availableRoom.roomId
            };
            users.push(newUser);
            //console.log(`Client ${ws.id}: ${JSON.stringify(newUser)}`)
            console.log(newUser);
            sendTo([ws.id],{type: "loggedin", ...newUser});
            
            if (availableRoom.player1 && availableRoom.player2) {
                
                sendTo([availableRoom.player1, availableRoom.player2],{
                    type: "readytoplay",
                    ...availableRoom
                });
            }
            
        } else if (jsonData.type === "question") {
            sendTo([jsonData.receiverId],jsonData);
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
        console.log(users);
        users = users.filter(user=>user.id!==ws.id);
        console.log(users);
        // rimuovo utente dalla stanza
        let playerToNotify;
        for (let room of rooms) {
            console.log(room);
            if (ws.id === room.player1) {
                room.player1 = null;
                playerToNotify = room.player2;
                break;
            } else if (ws.id === room.player2) {
                room.player2 = null;
                playerToNotify = room.player1;
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