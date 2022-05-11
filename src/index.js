import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Codici di stato del gioco, i negativi non consentono al giocatore di effettuare un'azione
const statusCode = {
    STATUS_INIT: -1,
    WAITING_FOR_ANSWER: -2,
    WAITING_FOR_QUESTION: -3,
    WAITING_FOR_SOLUTION_OR_PASS: -4,
    WAITING_FOR_SOLUTION_RESULT: -5,
    GAME_ENDED: -6,
    QUESTION: 1,
    ANSWER: 2,
    SOLUTION_OR_PASS: 3
}

// Piattaforma da tavolo
function GameBoard({characters, active, selectCharacter}) {

    const disabled = !selectCharacter && !active;
    const classList = selectCharacter ? "gameboard gameboard--selecting" : "gameboard";

    return (
        <div className={classList} disabled={disabled}>
        {characters.map((character, index)=>{
            return(
                <div key={index} className="gameboard__item">{character}</div>
            );
        })}
        </div>
    );
}

// Card di un personaggio
function CharacterCard(props) {
    const classList = props.closed ? "character-card character-card--closed" : "character-card";
    return(
        <div className={classList} onClick={props.onClick} title={props.playerBadge ? "La tua carta" : null}>
            {props.playerBadge ? (<PlayerBadge playerName={props.playerBadge} type="small" />) : null}
            <div className="character-card__face face--front">
                <img className="character-card__img" alt={props.name} src={props.image}/>
                <p className="character-card__name">{props.name}</p>
            </div>
            <div className="character-card__face face--back"></div>
        </div>
    );
}


// Card del personaggio da indovinare
function MysteryCard({opponentName}) {
    return(
        <div className='mystery-card' title={`La carta da indovinare di ${opponentName}`}>
            <PlayerBadge playerName={opponentName} type="small" />
            <span>?</span>
        </div>
    );
}

function Modal(props) {
    
    const classList = props.hide ? "modal hide" : "modal";
    
    return(
        <div className={classList}>
            <div className="modal__container">
                <div className="modal__header">
                    <h3 className="modal__title">{props.title}</h3>
                    {
                        props.closeable ? (<button className="btn btn-close" onClick={props.handleClose}>X</button>) : null
                    }
                </div>
                <div className="modal__body">
                    {props.children}
                </div>
            </div>
        </div>
    );
}

function PlayerBadge({playerName, type}) {

    const classList = type && type === "small" ? "player-badge player-badge--small" : "player-badge";

    return(
        <div className={classList} title={type && type === "small" ? playerName : null}>
            <div className="player-badge__avatar">{playerName.substring(0,1)}</div>
            <p className="player-badge__name">{playerName}</p>
        </div>
    );
}

function LoginModal(props) {
    
    return(
        <Modal closeable={false} title="Indovina Chi?">
            <>
                <h2>Vuoi iniziare una nuova partita?</h2>
                <p>Inserisci il tuo nickname</p>
                <form className="form-row" onSubmit={props.onSubmit}>
                    <input type="text" name="nickname" defaultValue={props.nickname} onChange={props.onChange} />
                    <button className="btn btn-primary" type="submit">Gioca!</button>
                </form>
            </>
        </Modal>
    );
}

function Loader() {
    return(
        <span className="loader"></span>
    );
}

function EndGameModal({winner, opponentName, onNewGame}) {

    return(
        <Modal title="Partita terminata" closeable={false}>
            <>
                 <h2>{winner ? "Complimenti, hai vinto!" : "Hai perso..."}</h2>
                 <p>{winner ? `Hai indovinato la carta di ${opponentName}. Vuoi giocare un'altra partita?`:`${opponentName} ha indovinato la tua carta. Vuoi giocare un'altra partita?`}</p>
                 <button className='btn btn-primary' onClick={onNewGame}>Gioca ancora!</button>
            </>
        </Modal>
    );
}

function GamePanel({gameState, onQuestionInputChange, onQuestionSubmit, onAnswerSubmit, onPass, handleSolution}) {

    let content;
    
    // QUESTION: L'utente deve fare la sua domanda
    if (gameState.playingStatus === statusCode.QUESTION) {

        // funzione per evitare l'a capo della textarea
        const onTextAreaKey = (e) => {
            if(e.which === 13 && !e.shiftKey) {
                onQuestionSubmit(e);
            }
        }

        content = (
        <form className='gamepanel__content content--question' onSubmit={onQuestionSubmit}>
            <p>Fai la tua domanda a <strong className='opponent-color'>{gameState.opponentPlayer.name}</strong></p>
            <textarea value={gameState.currentQuestion} onChange={onQuestionInputChange} onKeyDown={onTextAreaKey} rows={3} />
            <button className="btn btn-primary" type="submit">Invia domanda</button>
        </form>
        );
    }

    // WAITING_FOR_QUESTION: L'utente è in attesa della domanda dell'avversario
    else if (gameState.playingStatus === statusCode.WAITING_FOR_QUESTION) {
        content = (
            <div className='gamepanel__content'>
                {gameState.currentSolution ? (<h4>Soluzione sbagliata! La carta non è {gameState.currentSolution}</h4>) : null}
                <p>Sei in attesa di una domanda da:<br /><strong className='opponent-color'>{gameState.opponentPlayer.name}</strong></p>
                <Loader />
            </div>
        );
    }

    // WAITING_FOR_ANSWER: L'utente è in attesa della risposta dell'avversario (si o no)
    else if (gameState.playingStatus === statusCode.WAITING_FOR_ANSWER) {
        content = (
            <div className='gamepanel__content'>
                <p style={{alignSelf: 'flex-end'}}>Hai chiesto a <strong className='opponent-color'>{gameState.opponentPlayer.name}:</strong></p>
                <p className='balloon'>{gameState.currentQuestion}</p>
                <Loader />
            </div>
        );
    }

    // ANSWER: L'utente deve rispondere (si o no) alla domanda dell'avversario
    else if (gameState.playingStatus === statusCode.ANSWER) {
        content = (
        <div className='gamepanel__content content--answer'>
            <p><strong className='opponent-color'>{gameState.opponentPlayer.name}</strong> ti chiede:</p>
            <p className='balloon balloon--opponent'>{gameState.currentQuestion}</p>
            <div className='form-row'>
                <button className="btn btn-success" onClick={onAnswerSubmit} value="si">Si</button>
                <button className="btn btn-danger" onClick={onAnswerSubmit} value="no">No</button>
            </div>
        </div>
        );
    }

    // SOLUTION_OR_PASS: L'utente può dichiarare la carta dell'avversario o passare il turno
    else if (gameState.playingStatus === statusCode.SOLUTION_OR_PASS || gameState.playingStatus === statusCode.WAITING_FOR_SOLUTION_RESULT) {
        
        const isWaitingForResult = gameState.playingStatus === statusCode.WAITING_FOR_SOLUTION_RESULT;
        
        content = (
        <div className='gamepanel__content content--solution'>
            <p style={{alignSelf: 'flex-end'}}>La tua domanda:</p>
            <p className='balloon'>{gameState.currentQuestion}</p>
            <p><strong className='opponent-color'>{gameState.opponentPlayer.name}</strong> ha risposto:</p>
            <p className='balloon balloon--opponent'><strong>{gameState.currentAnswer}</strong></p>
            <div className='form-row'>
                <button className="btn btn-primary" onClick={handleSolution} disabled={isWaitingForResult || gameState
                .isChosingSolution}>Ho la soluzione!</button>
                <button className="btn" onClick={onPass} disabled={isWaitingForResult || gameState.isChosingSolution}>Passo</button>
            </div>
            {gameState.isChosingSolution ? (<p>Seleziona il personaggio vincente!</p>) : null}
            {isWaitingForResult ? (<Loader />) : null}
        </div>
        );
    }

    // WAITING_FOR_SOLUTION_OR_PASS: L'utente è in attesa della soluzione dell'avversario o del passaggio al proprio turno
    else if (gameState.playingStatus === statusCode.WAITING_FOR_SOLUTION_OR_PASS) {
        content = (
        <div className='gamepanel__content'>
            <p><strong className='opponent-color'>{gameState.opponentPlayer.name}</strong> ti ha chiesto:</p>
            <p className='balloon balloon--opponent'>{gameState.currentQuestion}</p>
            <p style={{alignSelf: 'flex-end'}}>Tu hai risposto:</p>
            <p className='balloon'>{gameState.currentAnswer}</p>
            <Loader />
        </div>
        );
    }
    // WAITING_FOR_SOLUTION_OR_PASS: L'utente è in attesa della soluzione dell'avversario o del passaggio al proprio turno
    else if (gameState.playingStatus === statusCode.GAME_ENDED) {
        content = (
        <div className='gamepanel__content'>
            <p>La partita è terminata.</p>
        </div>
        );
    }
    else {
        content = (<p>Caso non ancora gestito</p>)
    }

    return(
        <div className='gamepanel'>
               {content} 
        </div>
    );
}

// Pannellino che compare al rollover del badge utente, con i dati statistici sulle partite
function SessionInfo({gamesCompleted, gamesWon}) {

    const perc = (completed, won) => {
        if (Number.isInteger(completed) && Number.isInteger(won)) {
            return won > 0 ? Math.floor((won / completed * 100)) + "%" : "0%";
        } else {
            return "nd";
        }
    }
    
    return(
        <div className='session-info'>
            <ul>
                <li>Partite completate:<span>{gamesCompleted ? gamesCompleted : 0}</span></li>
                <li>Partite vinte:<span>{gamesWon? gamesWon : 0}</span></li>
                <li>Percentuale di vittorie:<span>{perc(gamesCompleted, gamesWon)}</span></li>
            </ul>
        </div>
    );
}

class Game extends React.Component {
    
    constructor(props) {
        super(props);
        
        this.state = {
            initializing: true,
            loadingData: true,
            currentModal: null,
            companyName: "",
            companyLogoUrl: "",
            myPlayer: {name: "", gamesCompleted: 0, gamesWon: 0},
            opponentPlayer : null,
            roomId: 0,
            charactersData: null,
            characters: null,
            randomCharacterData: null,
            playingStatus: statusCode.STATUS_INIT,
            ws: null,
            currentQuestion: '',
            currentAnswer: '',
            currentSolution: '',
            isChosingSolution: false
        };
        
        this.handleCharacterClick = this.handleCharacterClick.bind(this);
        this.getCharactersFromData = this.getCharactersFromData.bind(this);
        this.getRandomCharacterData = this.getRandomCharacterData.bind(this);
        this.openLoginModal = this.openLoginModal.bind(this);
        this.onLoginSubmit = this.onLoginSubmit.bind(this);
        this.onLoginChange = this.onLoginChange.bind(this);
        this.connectToWebsocket = this.connectToWebsocket.bind(this);
        this.sendWsMessage = this.sendWsMessage.bind(this);
        this.onWsError = this.onWsError.bind(this);
        this.onQuestionInputChange = this.onQuestionInputChange.bind(this);
        this.onQuestionSubmit = this.onQuestionSubmit.bind(this);
        this.onAnswerSubmit = this.onAnswerSubmit.bind(this);
        this.onPass = this.onPass.bind(this);
        this.handleSolution = this.handleSolution.bind(this);
        this.closeCard = this.closeCard.bind(this);
        this.updatePlayerSessionStorage = this.updatePlayerSessionStorage.bind(this);
        this.onNewGame = this.onNewGame.bind(this);
    }

    updatePlayerSessionStorage() {
        sessionStorage.setItem("myPlayer", JSON.stringify({
            name: this.state.myPlayer.name,
            gamesCompleted: this.state.myPlayer.gamesCompleted,
            gamesWon: this.state.myPlayer.gamesWon
        }));
    }
    
    componentDidMount() {

        const sessionStorageData = sessionStorage.getItem("myPlayer") ? JSON.parse(sessionStorage.getItem("myPlayer")) : null;

        if (sessionStorageData) {
            this.setState({
                myPlayer: {
                    ...this.state.myPlayer,
                    name: sessionStorageData.name,
                    gamesCompleted: sessionStorageData.gamesCompleted,
                    gamesWon: sessionStorageData.gamesWon
                }
            }, this.openLoginModal);
        } else {
            this.openLoginModal();
        }

        // Leggo il json di configurazione
        fetch('data/settings.json').then((res)=>res.json()).then(data => {
            
            const companyName = data.company.name;
            const companyLogoUrl = data.company.logo;
            const charactersData = data.characters.sort();
            
            this.setState({
                loadingData: false,
                companyName: companyName,
                companyLogoUrl: companyLogoUrl,
                charactersData: charactersData,
                websocketUrl: data.websocketUrl
            });
        });
    }

    sendWsMessage(obj) {
        if (this.state.ws) {
            const messageObj = {
                ...obj,
                senderId: this.state.myPlayer.id,
                receiverId: this.state.opponentPlayer.id,
                roomId: this.state.roomId
            };
            
            const newPlayingStatus = (type) => {
                if (type === "question") {
                    return statusCode.WAITING_FOR_ANSWER;
                }
                if (type === "answer") {
                    return statusCode.WAITING_FOR_SOLUTION_OR_PASS;
                }
                if (type === "endturn") {
                    return statusCode.WAITING_FOR_QUESTION;
                }
                if (type === "solution") {
                    return statusCode.WAITING_FOR_SOLUTION_RESULT;
                }
                return -100;
            }

            this.setState({
                playingStatus: newPlayingStatus(messageObj.type)
            });

            this.state.ws.send(JSON.stringify(messageObj));
        } else {
            this.onWsError();
        }
    }

    onWsError() {
        // mostro avviso partita interrotta
        this.setState({
            currentModal: (
            <Modal title="Impossibile connettersi a websocket">
                <h2>Ops...</h2>
                <p>Ci sono problemi di connessione con il server Websocket. Prova a ricaricare la pagina per iniziare una nuova partita. Se il problema persiste, verifica che il server sia attivo.</p>
                <button className='btn btn-primary' onClick={()=>window.location.reload()}>Ricarica</button>
            </Modal>),
            ws: null,
            initializing: true
        });
        //alert("Connection closed... refresh to try again!"); 
    }

    handleSolution() {
        this.setState({isChosingSolution: true});
    }
    
    openLoginModal() {
        const loginModal = (<LoginModal closeable={false} nickname={this.state.myPlayer.name} onSubmit={this.onLoginSubmit} onChange={this.onLoginChange} />);
        this.setState({
            currentModal: loginModal
        });
    }

    onLoginChange(e) {
        this.setState({
            myPlayer: {...this.state.myPlayer, name: e.target.value}
        });
    }
                      
    onLoginSubmit(e) {
        e.preventDefault();
        if (this.state.myPlayer.name.length > 1) {
            // loggato
            const waitingModal = (
                <Modal title="Ancora qualche istante">
                    <h2>Un attimo {this.state.myPlayer.name}</h2>
                    <p>Sei in attesa del tuo avversario...</p>
                    <Loader />
                </Modal>
            );
            this.setState({
                currentModal: waitingModal
            });
            this.connectToWebsocket();
        }
    }

    onQuestionInputChange(e) {
        this.setState({
            currentQuestion: e.target.value
        });
    }

    onQuestionSubmit(e) {
        e.preventDefault();
        const myQuestion = this.state.currentQuestion;
        if (myQuestion.length > 2) {
            this.sendWsMessage({type: "question", message: myQuestion});
        }
    }

    onAnswerSubmit(e) {
        this.setState({currentAnswer: e.target.value});
        this.sendWsMessage({type: "answer", message: e.target.value});
    }

    onPass() {
        this.sendWsMessage({type: "endturn"});
    }

    onNewGame() {
        this.state.ws.send(JSON.stringify({
            type: "newgame",
            player: this.state.myPlayer
        }));
    }
    
    connectToWebsocket() {
        
        console.log("try to connect");
        
        const ws = new WebSocket(this.state.websocketUrl);

        this.setState({
            ws: ws
        });

        const that = this;
        
        // Stabilita connessione con Websocket
        ws.onopen = function() {
            that.setState({playingStatus: statusCode.STATUS_INIT});
            console.log("Connected to Server");
            ws.send(JSON.stringify({
                type: "login",
                playerName: that.state.myPlayer.name
            }));
        };
        
        ws.onmessage = function ({data}) {
            
            const jsonData = JSON.parse(data);

            switch(jsonData.type) {

                case "loggedin":
                    // utente connesso, ha ottenuto un id univoco
                    const waitingModal = (
                        <Modal title="Ancora qualche istante">
                            <h2>Un attimo {that.state.myPlayer.name}</h2>
                            <p>Sei in attesa del tuo avversario...</p>
                            <Loader />
                        </Modal>
                    );
                    that.setState({
                        myPlayer: {...that.state.myPlayer, name: that.state.myPlayer.name, id: jsonData.id},
                        roomId: jsonData.roomId,
                        currentModal: waitingModal
                    });
                    break;

                case "roomready":
                    // la stanza con entrambi i giocatori è pronta, avvio la partita
                    
                    // player1 rosso e primo a giocare, player2 blue
                    const myRole = jsonData.player1.id === that.state.myPlayer.id ? "player1" : "player2";
                    that.setState({
                        myPlayer: {...that.state.myPlayer, role: myRole},
                        opponentPlayer: myRole === "player1" ? jsonData.player2 : jsonData.player1,
                        playingStatus: myRole === "player1" ? statusCode.QUESTION : statusCode.WAITING_FOR_QUESTION,
                        characters: that.getCharactersFromData(that.state.charactersData),
                        randomCharacterData: that.getRandomCharacterData(that.state.charactersData),
                        initializing: false,
                        currentModal: null,
                        currentQuestion: '',
                        currentAnswer: '',
                        currentSolution: '',
                        isChosingSolution: false
                    });
                    break;

                case "question":
                    that.setState({
                        playingStatus: statusCode.ANSWER,
                        currentQuestion: jsonData.message,
                        currentSolution: ''
                    });
                    break;

                case "answer":
                    that.setState({
                        playingStatus: statusCode.SOLUTION_OR_PASS,
                        currentAnswer: jsonData.message
                    });
                break;

                case "endturn":
                    that.setState({
                        playingStatus: statusCode.QUESTION,
                        currentQuestion: '',
                        currentAnswer: ''
                    });
                break;

                case "solution":
                    // analizzo soluzione avversario
                    let isSolutionCorrect = jsonData.characterId === that.state.randomCharacterData.name;
                    // invio l'esito che conosco all'avversario
                    that.sendWsMessage({
                        type: "solutionresult",
                        result: isSolutionCorrect
                    });
                    // mostro l'esito a me (in caso di errore proseguo il gioco con la mia domanda)
                    if (isSolutionCorrect) {
                        // hai perso!
                        that.setState({
                            currentModal: (<EndGameModal winner={false} opponentName={that.state.opponentPlayer.name} onNewGame={that.onNewGame}/>),
                            playingStatus: statusCode.GAME_ENDED,
                            myPlayer: {...that.state.myPlayer, gamesCompleted: that.state.myPlayer.gamesCompleted + 1}
                        },that.updatePlayerSessionStorage);
                    } else {
                        that.setState({
                            playingStatus: statusCode.QUESTION,
                            currentQuestion: ''
                        });
                    }
                break;

                case "solutionresult":
                    const isSolutionResultTrue = jsonData.result === true;
                    if (isSolutionResultTrue) {
                        // hai vinto!
                        that.setState({
                            currentModal: (<EndGameModal winner={true} opponentName={that.state.opponentPlayer.name} onNewGame={that.onNewGame}/>),
                            playingStatus: statusCode.GAME_ENDED,
                            myPlayer: {...that.state.myPlayer, gamesCompleted: that.state.myPlayer.gamesCompleted + 1, gamesWon: that.state.myPlayer.gamesWon + 1}
                        }, that.updatePlayerSessionStorage);
                    } else {
                        that.closeCard(that.state.currentSolution);
                        that.setState({
                            playingStatus: statusCode.WAITING_FOR_QUESTION,
                        });
                    }
                break;

                case "quit":
                    if (that.state.playingStatus !== statusCode.GAME_ENDED) {
                        const quitModal = (
                            <Modal title="Partita abbandonata">
                                <h2>Ci dispiace {that.state.myPlayer.name}</h2>
                                <p>{that.state.opponentPlayer.name} ha abbandonato la partita.<br />Sei in attesa di un nuovo avversario...</p>
                                <Loader />
                            </Modal>
                        );
                        that.setState({
                            currentModal: quitModal,
                            playingStatus: statusCode.STATUS_INIT,
                            initializing: true,
                            opponentPlayer: null,
                            currentQuestion: '',
                            currentAnswer: '',
                            currentSolution: '',
                            isChosingSolution: false,
                        });
                    } else {
                        that.setState({
                            currentQuestion: '',
                            currentAnswer: '',
                            currentSolution: '',
                            isChosingSolution: false
                        });
                    }
                    
                    break;

                default:
                    console.log(data);
                    break;

            }

        };

        ws.onclose = that.onWsError;
    }
          
    handleCharacterClick(characterName) {

        if (this.state.isChosingSolution) {
            this.setState({
                isChosingSolution: false,
                currentSolution: characterName
            });
            // cliccata la card come SOLUZIONE del gioco
            this.sendWsMessage({
                type: "solution",
                characterId: characterName
            });
        } else {
            // cliccata la card per CHIUDERLA
            this.closeCard(characterName);
        }
        
    }

    closeCard(characterName) {
        this.setState({characters: this.state.characters.map(character => {
            if (character.props.name === characterName && character.props.closed === false) {
                return (
                    <CharacterCard name={characterName} closed={true} image={character.props.image} onClick={()=>this.handleCharacterClick(characterName)}/>
                );
            }
            return character;
        })});
    }
    
    getRandomCharacterData(charactersData) {
        const randomIndex = Math.floor(Math.random()*charactersData.length); 
        return charactersData[randomIndex];
    }
        
    getCharactersFromData(data) {
        
        const isUnique = (arr) => {
            const tmpArr = [];
            for(var obj in arr) {
                if(tmpArr.indexOf(arr[obj].name) < 0){ 
                    tmpArr.push(arr[obj].name);
                } else {
                    return false; // Duplicate value for property1 found
                }
            }
            return true;
        };
        
        const isValidCharactersNumber = (number) => number % 4 === 0;
        
        if (isValidCharactersNumber(data.length) && isUnique(data)) {
            return data.map((character, index) => {
                return(
                    <CharacterCard name={character.name} image={character.image} closed={false} onClick={()=>this.handleCharacterClick(character.name)}/>
                );
            });
        } else {
            throw new Error("Errore nel file di configurazione");
        }
    }
                                                          
    render() {
      if (this.state.initializing) {
            return(
              <>
                {this.state.currentModal ? this.state.currentModal : null}
              </>
            );
      } else {
          return (
            <>
            <header className={`header ${this.state.myPlayer.role}`}>
                <img className="header__logo" alt={this.state.companyName} src={this.state.companyLogoUrl} />
                <PlayerBadge playerName={this.state.myPlayer.name} />
                <SessionInfo gamesCompleted={this.state.myPlayer.gamesCompleted} gamesWon={this.state.myPlayer.gamesWon}></SessionInfo>
            </header>
            <main className={`main ${this.state.myPlayer.role}`}>
                <div className="maincontent">
                    <GameBoard characters={this.state.characters} active={this.state.playingStatus === statusCode
                    .SOLUTION_OR_PASS} selectCharacter={this.state.isChosingSolution} />
                </div>
                <div className="sidebar">
                    <p style={{textAlign: 'center'}}>Sei in sfida con <strong className='opponent-color'>{this.state.opponentPlayer.name}!</strong></p>
                    <div className="opponents-row">
                        <CharacterCard name={this.state.randomCharacterData.name} image={this.state.randomCharacterData.image} playerBadge={this.state.myPlayer.name}/>
                        <MysteryCard opponentName={this.state.opponentPlayer.name}/>
                    </div>
                    <hr />
                    <GamePanel 
                        gameState={this.state}
                        onQuestionInputChange={this.onQuestionInputChange}
                        onQuestionSubmit={this.onQuestionSubmit}
                        onAnswerSubmit={this.onAnswerSubmit}
                        onPass={this.onPass}
                        handleSolution={this.handleSolution}
                    />
                </div>
            </main>
              {this.state.currentModal ? this.state.currentModal : null}
            </>
        );
      }
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game />);
