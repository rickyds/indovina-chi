import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function GameBoard(props) {
  return (
    <div className="gameboard">
      {props.characters}
    </div>
  );
}

class CharacterCard extends React.Component {
    
    render() {
        
        const classList = this.props.closed ? "character-card character-card--closed" : "character-card";
        
        return (
            <div className={classList} onClick={this.props.onClick}>
              <img className="character-card__img" alt={this.props.name} />
              <p className="character-card__name">{this.props.name}</p>
            </div>
        );
    }
}

class Game extends React.Component {
    
    
    constructor(props) {
        super(props);
        this.state = {
            characters: this.getDefaultCharacters(24),
            yourCharacter: this.getRandomCharacterKey(24)
        };
        this.handleCharacterClick = this.handleCharacterClick.bind(this);
        this.restartGame = this.restartGame.bind(this);
        this.getDefaultCharacters = this.getDefaultCharacters.bind(this);
        this.getRandomCharacterKey = this.getRandomCharacterKey.bind(this);
    }                                             
          
    handleCharacterClick(characterKey) {
        this.setState({characters: this.state.characters.map(character => {
            if (character.props.name == characterKey && character.props.closed === false) {
                return (
                    <CharacterCard name={characterKey} key={characterKey} closed={true} onClick={()=>this.handleCharacterClick(characterKey)}/>
                );
            }
            
            return character;
        })});
    }
    
    getRandomCharacterKey(num) {
        return Math.floor(Math.random()*num);
    }
        
    getDefaultCharacters(num) {
        return(
            [...Array(num).keys()].map(key => (
                <CharacterCard name={key} key={key} closed={false} onClick={()=>this.handleCharacterClick(key)}/>
            ))
        );
    }
        
    restartGame() {
        this.setState({
            characters: this.getDefaultCharacters(24),
            yourCharacter: this.getRandomCharacterKey(24)
        });
    }
                                                          
  render() {
    return (
        <>
        <header className="header">
            <img className="header__logo" alt="" src="logo.svg" />
        </header>
        <main className="main">
            <div className="maincontent">
                <GameBoard characters={this.state.characters}/>
            </div>
            <div className="sidebar">
                <CharacterCard name={this.state.yourCharacter}/>
                <button className="btn btn-reset" onClick={this.restartGame}>Reset</button>
            </div>
        </main>
        </>
    );
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game />);
