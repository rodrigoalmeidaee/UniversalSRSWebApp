import { connect } from 'react-redux';
import React, { Component } from 'react';

import { fetchDeck, submitCardUpdate, submitCard, submitCardRemoval } from '../actions'

import '../../node_modules/flag-icon-css/css/flag-icon.css';
import './CardsList.css';
import CardViewModel from './CardViewModel';


const NO_IMAGE_URI = 'https://blog.stylingandroid.com/wp-content/themes/lontano-pro/images/no-image-slide.png';
var globalIdCounter = 0;

class CardsList extends Component {

  constructor() {
    super();
    this.state = {newCards: []};
  }

  componentWillMount() {
    this.props.fetchDeck(this.deckId());
  }

  deckId() {
    return this.props.match.params.deckId;
  }

  beginCreateCard() {
    var cid = (++globalIdCounter).toFixed(0);
    this.setState({
      newCards: this.state.newCards.concat([{id: cid}])
    });
  }

  abortCreateCard(refid) {
    this.setState({newCards: this.state.newCards.filter(c => c.id !== refid)});
  }

  endCreateCard(refid, card) {
    var deck = this.props.deck;
    this.props.createCard(deck.id, card);
    this.setState({newCards: this.state.newCards.filter(c => c.id !== refid)});
  }

  beginAddMondlyCards() {
    var result = prompt('Please paste JSON here');
    if (result) {
      result = JSON.parse(result);
      result.forEach(c => {c.id = (++globalIdCounter).toFixed(0);});
      this.setState({newCards: this.state.newCards.concat(result)})
    }
  }

  render() {
    if (!this.props.deck || this.props.deck.isFetching) {
      return (
        <div className="Spinner">Loading...</div>
      );
    }

    var deck = this.props.deck;

    return (
      <div className="DeckDetails">
        <h3>
          {deck.title}
          <small>
            Language: <span className={ `flag-icon flag-icon-${deck.language}` } />
          </small>
        </h3>
        <div className="CardsList">
          {deck.cards.map(card => <Card
              card={card}
              key={card.id}
              updateCard={(cardId, updates) => this.props.updateCard(deck.id, cardId, updates)}
              removeCard={(cardId) => this.props.removeCard(deck.id, cardId) } />)}
          <hr />
          {
            this.state.newCards.map(newCard => (
              <NewCard
                  key={newCard.id}
                  template={newCard}
                  onChangesPersisted={this.endCreateCard.bind(this, newCard.id)}
                  onChangesVoided={this.abortCreateCard.bind(this, newCard.id)} />
            ))
          }
          <div>
            <button type="button" onClick={this.beginCreateCard.bind(this)}>
              Add card
            </button>
            <button type="button" onClick={this.beginAddMondlyCards.bind(this)}>
              Add cards from Mondly
            </button>
          </div>
        </div>
      </div>
    );
  }
}


class Card extends Component {

  constructor() {
    super();
    this.state = {editing: false};
  }

  beginEdit() {
    this.setState({editing: true});
  }

  onChangesPersisted(changes) {
    this.props.updateCard(this.props.card.id, changes)
    this.setState({editing: false});
  }

  onChangesVoided() {
    this.setState({editing: false});
  }

  onRemovalRequested() {
    this.setState({editing: false});
    this.props.removeCard(this.props.card.id);
  }

  maybePlayAudio(event) {
    if (this.audioDom) {
      this.audioDom.play();
    }
  }

  render() {
    var card = new CardViewModel(this.props.card);

    if (this.state.editing) {

      return (
        <NewCard template={card}
                 onChangesPersisted={this.onChangesPersisted.bind(this)}
                 onChangesVoided={this.onChangesVoided.bind(this)}
                 onRemovalRequested={this.onRemovalRequested.bind(this)} />
      )
    } else {
      var stylez = {backgroundImage: `url(${card.image_uri || NO_IMAGE_URI})` };
      if (card.sound_uri) {
        stylez['cursor'] = 'pointer';
      }

      return (
        <div className={`Card ${card.isUpdating ? "isUpdating" : ""} ${card.reverse ? "reverse" : ""}`}
             onDoubleClick={this.beginEdit.bind(this)}>
          { card.image_uri ?
            <div className="Card-meta">
              <div className="Card-image-and-sound"
                   style={stylez}>
              </div>
            </div>
            : null }
          <div className="Card-body">
            <div className="Card-front">
              {card.renderFrontText()}
            </div>
            <div className="Card-back">
              {card.renderBackText()}
            </div>
            {
              card.hasNotes()
              ?
                <div className="Card-notes">
                  {card.renderNotes()}
                </div>
              : null
            }
          </div>
        </div>
      )
    }
  }
}


class NewCard extends Component {

  componentWillMount() {
    this.copyStateFromTemplate();
  }

  copyStateFromTemplate() {
    this.setState({
      card: {
        front: this.props.template.front || '',
        back: this.props.template.back || '',
        sound_uri: this.props.template.sound_uri || '',
        image_uri: this.props.template.image_uri || '',
        reverse: !!this.props.template.reverse
      }
    });
  }

  onCardFrontEdited(evt) {
    this.setState({card: Object.assign({}, this.state.card, {front: evt.target.value})});
  }

  onCardBackEdited(evt) {
    this.setState({card: Object.assign({}, this.state.card, {back: evt.target.value})});
  }

  onImageUriEdited(evt) {
    this.setState({card: Object.assign({}, this.state.card, {image_uri: evt.target.value})});
  }

  onSoundUriEdited(evt) {
    this.setState({card: Object.assign({}, this.state.card, {sound_uri: evt.target.value})});
  }

  onReverseEdited(evt) {
    this.setState({card: Object.assign({}, this.state.card, {reverse: evt.target.checked})});
  }

  maybePlayAudio(event) {
    if (this.audioDom) {
      this.audioDom.play();
    }
  }

  voidChanges() {
    if (this.props.onChangesVoided) {
      this.props.onChangesVoided();
    }
    this.copyStateFromTemplate();
  }

  persistChanges() {
    this.props.onChangesPersisted({
      front: this.state.card.front,
      back: this.state.card.back,
      sound_uri: this.state.card.sound_uri || null,
      image_uri: this.state.card.image_uri || null,
      reverse: this.state.card.reverse || false
    });
    this.copyStateFromTemplate();
  }

  removalRequested() {
    if (window.confirm("Are you sure?")) {
      this.props.onRemovalRequested();
    }
  }

  render() {
    var card = this.state.card;
    var void0 = 'javascript';
    void0 += ':void(0)';

    var stylez = {backgroundImage: `url(${card.image_uri || NO_IMAGE_URI})` };
    if (card.sound_uri) {
      stylez['cursor'] = 'pointer';
    }

    var autoGrow = function(event) {
      var element = event.target;
      element.style.height = "5px";
      element.style.height = (element.scrollHeight) + "px";
    }

    return (
      <div className="Card isNew">
        <div className="Card-meta">
          <div className="Card-image-and-sound"
               style={stylez}
               onClick={this.maybePlayAudio.bind(this)}>
            {
              card.sound_uri ?

              <audio ref={(audioDom) => {this.audioDom = audioDom;}}>
                <source src={card.sound_uri} />
              </audio>

              : null
            }
          </div>
        </div>
        <div className="Card-body">
          <div className="Card-front">
            <textarea onChange={this.onCardFrontEdited.bind(this)}
                      value={card.front}
                      onKeyUp={autoGrow}
                      ref={target => target && autoGrow({target: target})} />
          </div>
          <div className="Card-back">
            <textarea onChange={this.onCardBackEdited.bind(this)}
                      value={card.back}
                      onKeyUp={autoGrow}
                      ref={target => target && autoGrow({target: target})} />
          </div>
          <div>
            <label>
              Reverse?
            </label>
            <input onChange={this.onReverseEdited.bind(this)} type="checkbox" checked={card.reverse} />
          </div>
          <div>
            <label>
              Sound URI
            </label>
            <input onChange={this.onSoundUriEdited.bind(this)} value={card.sound_uri} tabIndex="-1" />
          </div>
          <div>
            <label>
              Image URI
            </label>
            <input onChange={this.onImageUriEdited.bind(this)} value={card.image_uri} tabIndex="-1" />
          </div>
          <div className="Card-actions">
            <a href={void0} onClick={() => this.persistChanges()}>
              Save
            </a>
            <a href={void0} onClick={() => this.voidChanges()} tabIndex="-1">
              Cancel
            </a>
            { this.props.onRemovalRequested ?
              <a href={void0} onClick={() => this.removalRequested()} tabIndex="-1">
                Remove
              </a> : null }
          </div>
        </div>
      </div>
    );
  }
}

CardsList = connect(
  function mapStateToProps(state, ownProps) {
    var deckId = ownProps.match.params.deckId;
    return {deck: state.decks[deckId]};
  },
  function mapDispatchToProps(dispatch) {
    return {
      fetchDeck: (deckId) => dispatch(fetchDeck(deckId)),
      updateCard: (deckId, cardId, updates) => dispatch(submitCardUpdate(deckId, cardId, updates)),
      createCard: (deckId, card) => dispatch(submitCard(deckId, card)),
      removeCard: (deckId, cardId) => dispatch(submitCardRemoval(deckId, cardId))
    }
  }
)(CardsList)


export default CardsList;
