import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function GameBoard(props) {
  return (
    <div className="gameboard">
      {props.characters.map((character, index)=>{
        return(
            <div key={index} className="gameboard__item">{character}</div>
        );
      })}
    </div>
  );
}

class CharacterCard extends React.Component {
    
    render() {
        
        const classList = this.props.closed ? "character-card character-card--closed" : "character-card";
        
        return (
            <div className={classList} onClick={this.props.onClick}>
                <div className="character-card__face face--front">
                    <img className="character-card__img" alt={this.props.name} src={this.props.image}/>
                    <p className="character-card__name">{this.props.name}</p>
                </div>
                <div className="character-card__face face--back"></div>
            </div>
        );
    }
}

function Modal(props) {
    
    const classList = props.show ? "modal show" : "modal";
    
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

function PlayerBadge({playerName}) {
    return(
        <div className="player-badge">
            <div className="player-badge__avatar">{playerName.substring(0,1)}</div>
            <p className="player-badge__name">{playerName}</p>
        </div>
    );
}

function LoginModal(props) {
    
    return(
        <Modal show={true} closeable={false} title="Indovina Chi?">
            <>
                <h2>Vuoi iniziare una nuova partita?</h2>
                <p>Inserisci il tuo nickname</p>
                <form className="form-row" onSubmit={props.onSubmit}>
                    <input type="text" name="nickname" value={props.email} onChange={props.onChange} />
                    <button className="btn btn-primary" type="submit">Gioca!</button>
                </form>
            </>
        </Modal>
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
            player: {name: ""},
            opponent : null,
            roomId: 0,
            charactersData: null,
            characters: null,
            randomCharacterData: null
        };
        
        this.handleCharacterClick = this.handleCharacterClick.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.getCharactersFromData = this.getCharactersFromData.bind(this);
        this.getRandomCharacterData = this.getRandomCharacterData.bind(this);
        this.initialize = this.initialize.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.openLoginModal = this.openLoginModal.bind(this);
        this.onLoginSubmit = this.onLoginSubmit.bind(this);
        this.onLoginChange = this.onLoginChange.bind(this);
        this.connectToWebsocket = this.connectToWebsocket.bind(this);
        
        
        this.initialize();
    }
    
    initialize() {
        
        fetch('data/settings.json').then((res)=>res.json()).then(data => {
            
            this.openLoginModal();
            
            const companyName = data.company.name;
            const companyLogoUrl = data.company.logo;
            const charactersData = data.characters.sort();
            const characters = this.getCharactersFromData(charactersData);
            const randomCharacterData = this.getRandomCharacterData(charactersData);
            
            this.setState({
                loadingData: false,
                companyName: companyName,
                companyLogoUrl: companyLogoUrl,
                charactersData: charactersData,
                characters: characters,
                randomCharacterData: randomCharacterData
            });
        });
    }
    
    openLoginModal() {
        
        const loginModal = (<LoginModal closeable={false} nickname={this.state.player.name} onSubmit={this.onLoginSubmit} onChange={this.onLoginChange}/>);
        this.setState({
            currentModal: loginModal
        });
        
    }
                      
    onLoginSubmit(e) {
        console.log("login submit");
        e.preventDefault();
        if (this.state.player.name.length > 1) {
            // loggato
            this.connectToWebsocket();
        }
    }
    
    connectToWebsocket() {
        
        console.log("try to connect");
        
        const ws = new WebSocket("ws://localhost:8082");
        //const playerName = this.state.player.name;
        const that = this;
        
        ws.onopen = function() {
            console.log("Connected to Server");
            ws.send(JSON.stringify({
                type: "login",
                playerName: that.state.player.name
            }));
        };
        
        ws.onmessage = function ({data}) {
                    
            const jsonData = JSON.parse(data);

            if (jsonData.type === "loggedin") {
                console.log(jsonData.type);
                console.log(that.state.player.name);
                that.setState({
                    player: {name: that.state.player.name, id: jsonData.id},
                    roomId: jsonData.roomId
                });
            } else if (jsonData.type === "readytoplay") {
                console.log(jsonData.type);
                const opponentId = jsonData.player1 === that.state.player.id ? jsonData.player2 : jsonData.player1;
                that.setState({
                    opponent: {id: opponentId},
                    initilizing: false,
                    currentModal: null
                });
            }

            //showMessage(`${jsonData.type}: ${data}`);
        };

        ws.onclose = function() { 
            ws = null;
            alert("Connection closed... refresh to try again!"); 
        };
    }
    
    onLoginChange(e) {
        
        this.setState({
            player: {name: e.target.value}
        });
    }

    
    closeModal() {
        this.setState({showModal: false});
    }
          
    handleCharacterClick(characterName) {
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
        
    restartGame() {
        
        this.setState({
            characters: this.getCharactersFromData(this.state.charactersData),
            randomCharacterData: this.getRandomCharacterData(this.state.charactersData)
        });
        
    }
                                                          
  render() {
      if (!this.state.opponent) {
          return(
              <>
                <h1>Loading...</h1>
                {this.state.currentModal ? this.state.currentModal : null}
              </>);
      } else {
          return (
            <>
            <header className="header">
                <img className="header__logo" alt={this.state.companyName} src={this.state.companyLogoUrl} />
                <PlayerBadge playerName={this.state.player.name} />
            </header>
            <main className="main">
                <div className="maincontent">
                    <GameBoard characters={this.state.characters}/>
                </div>
                <div className="sidebar">
                    <CharacterCard name={this.state.randomCharacterData.name} image={this.state.randomCharacterData.image}/>
                    <button className="btn btn-reset" onClick={this.restartGame}>Reset</button>
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
