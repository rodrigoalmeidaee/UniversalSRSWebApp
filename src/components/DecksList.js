import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types'

import { fetchDecks } from '../actions'

import './DecksList.css';
import '../../node_modules/flag-icon-css/css/flag-icon.css';


class DecksList extends Component {

  componentWillMount() {
    this.props.fetchDecks();
  }

  render() {
    if (this.props.isFetching) {
      return (
        <div className="DecksList">
          <div className="spinner">Loading...</div>
        </div>
      );
    }
    else if (this.props.decks) {
      return (
        <div className="DecksList">
          <h3>Available Decks</h3>
          {this.props.decks.map(deck => <Deck deck={deck} key={deck.id} />)}
        </div>
      );
    } else {
      return (
        <div className="DecksList">
          Not available
        </div>
      );
    }
  }
}


class Deck extends Component {

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
      }).isRequired
    }).isRequired
  }

  render() {
    return (
      <div className="Deck">
        <span className="Deck-cardCount">
          <span className="count">
            {this.props.deck.card_count} cards
          </span><span className="due" style={{display: this.props.deck.due_card_count ? '' : 'none'}}>
            {this.props.deck.due_card_count} due
          </span><span className="new" style={{display: this.props.deck.new_card_count ? '' : 'none'}}>
            {this.props.deck.new_card_count} new
          </span>
        </span>
        <span className="Deck-title">
          <span className={ `flag-icon flag-icon-${this.props.deck.language}` } />
          {this.props.deck.title}
        </span>
        <hr />
        <div className="Deck-actions">
          <div className="Deck-action" onClick={() => this.onStudyClicked()}>
            Study
          </div>
          <div className="Deck-action" onClick={() => this.onDeckClicked()}>
            View/Edit
          </div>
        </div>
      </div>
    );
  }

  onStudyClicked() {
    const { history } = this.context.router;
    history.push('/decks/' + this.props.deck.id + '/study');
  }

  onDeckClicked() {
    const { history } = this.context.router;
    history.push('/decks/' + this.props.deck.id);
  }
}


DecksList = connect(
  function mapStateToProps(state) {
    return {
      isFetching: state.deckList.isFetching,
      decks: state.deckList.decks
    };
  },
  function mapDispatchToProps(dispatch) {
    return {
      fetchDecks: () => dispatch(fetchDecks())
    }
  }
)(DecksList)


export default DecksList;
