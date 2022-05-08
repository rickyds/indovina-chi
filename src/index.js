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
              <img className="character-card__img" alt={this.props.name} src={this.props.image}/>
              <p className="character-card__name">{this.props.name}</p>
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
                    <h3>{props.title}</h3>
                    <button className="btn btn-close" onClick={props.handleClose}>X</button>
                </div>
                <div className="modal__body">
                    {props.children}
                </div>
            </div>
        </div>
    );
}

class Game extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            initializing: true,
            showModal: false,
            companyName: "",
            companyLogoUrl: "",
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
        
        this.initialize();
    }
    
    initialize() {
        fetch('data/settings.json').then((res)=>res.json()).then(data => {
            
            const companyName = data.company.name;
            const companyLogoUrl = data.company.logo;
            const charactersData = data.characters.sort();
            const characters = this.getCharactersFromData(charactersData);
            const randomCharacterData = this.getRandomCharacterData(charactersData);
            
            this.setState({
                initializing: false,
                companyName: companyName,
                companyLogoUrl: companyLogoUrl,
                charactersData: charactersData,
                characters: characters,
                randomCharacterData: randomCharacterData
            })
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
      if (this.state.initializing) {
          return(<><h1>Loading...</h1></>);
      } else {
          return (
            <>
            <header className="header">
                <img className="header__logo" alt={this.state.companyName} src={this.state.companyLogoUrl} />
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
            <Modal show={this.state.showModal} handleClose={()=>this.closeModal()} />
            </>
        );
      }
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game />);
