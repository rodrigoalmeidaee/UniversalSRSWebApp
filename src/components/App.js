import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom'

import logo from '../logo.svg';
import './App.css';
import CardsList from './CardsList';
import DecksList from './DecksList';
import StudyApp from './StudyApp';


class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Universal SRS</h2>
        </div>
        <Router>
          <div>
            <Route exact path="/" component={DecksList} />
            <Route exact path="/decks/:deckId/study" component={StudyApp} />
            <Route exact path="/decks/:deckId" component={CardsList} />
          </div>
        </Router>
      </div>
    );
  }
}

export default App;
