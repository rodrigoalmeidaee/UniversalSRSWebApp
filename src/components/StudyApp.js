import { connect } from 'react-redux';
import React, { Component } from 'react';
import {BarChart} from 'react-easy-chart';

import { fetchStudySession, submitAnswers, fetchDeck } from '../actions'

import CardViewModel from './CardViewModel';
import './StudyApp.css';


const COLORS = {
  'new': 'rgb(127, 127, 127)',
  'now': 'rgb(214, 39, 40)',
  'today': 'rgb(31, 119, 180)',
  'tomorrow': 'rgb(174, 199, 232)',
  '2d-3d': 'rgb(148, 103, 189)',
  '4d-1w': 'rgb(197, 176, 213)',
  '1w-2w': 'rgb(227, 119, 194)',
  '2w-1m': 'rgb(247, 182, 210)',
  '1m+': 'rgb(188, 189, 34)'
};
const NEW_CARDS_BLOCK_SIZE = 10;
const OLD_CARDS_BLOCK_SIZE = 20;


class StudyApp extends Component {
  constructor() {
    super();
    this.state = {
      state: 'home'
    };
  }

  deckId() {
    return this.props.match.params.deckId;
  }

  componentWillMount() {
    if (!this.props.deck) {
      this.props.fetchDeck(this.deckId());
    }
    this.props.fetchStudySession(this.deckId());
  }

  beginStudies() {
    var cardStack = this.props.studySession.due_cards.concat(
      this.props.studySession.new_cards
    );

    this.setState({
      state: 'studying',
      cardStack: cardStack,
    });
    this.moveIndex([], -1, cardStack);
  }

  handleInput(e) {
    var submitting = this.state.flashAnswer && this.state.flashAnswer !== "maybeWrong";
    var canAcceptText = !this.state.cardFlipped && !submitting;
    var canAcceptArrows = !submitting && (this.state.cardFlipped || e.target.value === "");

    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      if (canAcceptText) {
        this.setState({cardFlipped: true});
        var card = new CardViewModel(
          this.state.cardStack[this.state.studyOrder[this.state.studyIndex]]
        );
        if (card.acceptableAnswers().find(a => a.toLowerCase() === e.target.value.toLowerCase())) {
          this.handleScenario('right');
        } else {
          this.setState({'flashAnswer': 'maybeWrong'});
        }
      }
    } else if (e.keyCode === 39 /* rightarrow */) {
      if (canAcceptArrows) {
        this.handleScenario('right');
        e.preventDefault();
      }
    } else if (e.keyCode === 38 /* uparrow */) {
      if (canAcceptArrows) {
        this.handleScenario('easy');
        e.preventDefault();
      }
    } else if (e.keyCode === 40 /* downarrow */) {
      if (canAcceptArrows) {
        this.handleScenario('wrong');
        e.preventDefault();
      }
    } else {
      if (!canAcceptText) {
        e.preventDefault();
      }
    }
  }

  handleScenario(scenario) {
    this.setState({'flashAnswer': scenario, 'cardFlipped': true});
    setTimeout(this._endHandleScenario.bind(this, scenario), 1000);
  }

  _endHandleScenario(scenario) {
    this.setState({'flashAnswer': null});
    var cards = this.state.cardStack;
    var card = cards[this.state.studyOrder[this.state.studyIndex]];

    if (card.is_new) {
      if (scenario === 'wrong') {
        // nothing to do here
      } else {
        card['_bounces'] = card['_bounces'] || 0;
        card['_bounces'] += (scenario === 'easy') ? 3 : 1;
        if (card['_bounces'] >= 3) {
          card['_finished'] = true;
        }
      }
    } else {
      card['_wrong'] = card['_wrong'] || scenario === 'wrong';
      if (scenario !== 'wrong') {
        card['_finished'] = true;
      }
    }

    if (card['_finished']) {
      this.pushAnswer({
        card_id: card['id'],
        scenario: card['_wrong'] ? 'wrong' : scenario,
        timestamp: (new Date().getTime() / 1000)
      });
    }
    this.moveIndex(this.state.studyOrder, this.state.studyIndex, this.state.cardStack)
  }

  pushAnswer(answer) {
    this.props.submitAnswers(this.props.studySession.sessionId, [answer]);
  }

  moveIndex(studyOrder, studyIndex, cardStack) {
    if (studyIndex === studyOrder.length - 1) {
      var newStudyOrder = studyOrder;
      var cardsAdded = 0;

      for (var i = 0; i < cardStack.length && cardsAdded < OLD_CARDS_BLOCK_SIZE; ++i) {
        if (!cardStack[i].is_new && !cardStack[i]._finished) {
          newStudyOrder = newStudyOrder.concat([i]);
          ++cardsAdded;
        }
      }

      if (!cardsAdded) {
        for (i = 0; i < cardStack.length && cardsAdded < NEW_CARDS_BLOCK_SIZE; ++i) {
          if (cardStack[i].is_new && !cardStack[i]._finished) {
            newStudyOrder = newStudyOrder.concat([i]);
            ++cardsAdded;
          }
        }
      }

      if (!cardsAdded) {
        this.setState({
          state: 'studyFinished'
        });
      } else {
        this.setState({
          studyOrder: newStudyOrder,
          studyIndex: studyIndex + 1
        });
      }
    } else {
      this.setState({
        studyIndex: studyIndex + 1
      });
    }
    this.setState({cardFlipped: false, userEnteredText: ''});
  }

  render() {

    if (!this.props.deck || !this.props.studySession) {
      return (
        <div className="Spinner">Loading...</div>
      );
    }

    var deck = this.props.deck;

    if (this.state.state === 'home') {
      var studySession = this.props.studySession;

      return (
        <div className="StudyApp">
          <h3>
            {deck.title}
          </h3>
          <div className="StudyDueDistribution">
            <BarChart
              axes
              data={
                studySession['due_distribution'].map(function(bucket) {
                  return {
                    x: bucket.bucket,
                    y: bucket.count,
                    color: COLORS[bucket.bucket]
                  };
                })
              }
            />
          </div>
          <div className="StudyActions">
            {
              (studySession.due_cards.length > 0 || studySession.new_cards.length > 0)
              ? <button type="button" onClick={this.beginStudies.bind(this)}>Begin studies</button>
              : null
            }
          </div>
        </div>
      )
    } else if (this.state.state === 'studying') {
      var card = new CardViewModel(
        this.state.cardStack[this.state.studyOrder[this.state.studyIndex]]
      );
      var cards = this.state.cardStack;
      var cardFlipped = this.state.cardFlipped;
      var disableButtons = this.state.flashAnswer && this.state.flashAnswer !== 'maybeWrong';
      var autoGrow = function(event) {
        var element = event.target;
        element.style.height = "5px";
        element.style.height = (element.scrollHeight) + "px";
      }

      return (
        <div className="StudyApp">
          <h3>
            {deck.title} • card {this.state.studyOrder[this.state.studyIndex] + 1} / {cards.length}
          </h3>
          <div className="StudyCard">
            <div className={`Card-front ${this.state.flashAnswer || ''}`}>
              {card.renderFrontText()}
            </div>
            <div className="Card-answer">
              <textarea
                     onKeyDown={this.handleInput.bind(this)}
                     onChange={e => {
                       this.setState({userEnteredText: e.target.value});
                       autoGrow(e);
                     }}
                     style={{height: '5px'}}
                     ref={me => {
                       if (me) {
                         me.focus();
                         autoGrow({target: me});
                       }
                     }}
                     value={this.state.userEnteredText} />
            </div>
            <div className="Card-back" style={{display: cardFlipped ? "block" : "none"}}>
              {card.renderBackText()}
            </div>
            <div className="Card-notes" style={{display: cardFlipped && card.hasNotes() ? "block" : "none"}}>
              {card.renderNotes()}
            </div>
            <div className="Card-actions">
              <button type="button" data-scenario="right" onClick={this.handleScenario.bind(this, 'right')} disabled={disableButtons}>
                ✓
                <span className="timing">{card.getTimingInfo('right')}</span>
              </button>
              <button type="button" data-scenario="easy" onClick={this.handleScenario.bind(this, 'easy')} disabled={disableButtons}>
               ✓✓
               <span className="timing">{card.getTimingInfo('easy')}</span>
              </button>
              <button type="button" data-scenario="wrong" onClick={this.handleScenario.bind(this, 'wrong')} disabled={disableButtons}>
               ✗
               <span className="timing">{card.getTimingInfo('wrong')}</span>
              </button>
            </div>
          </div>
        </div>
      );
    } else if (this.state.state === 'studyFinished') {
      let newCardCount = this.state.cardStack.filter(c => c._bounces >= 3).length;
      let reviewedCardCount = this.state.cardStack.filter(c => c._bounces === undefined && !c.is_new).length;
      let rememberedCardCount = this.state.cardStack.filter(c => c._bounces === undefined && !c.is_new && !c._wrong).length;
      let recallRate = rememberedCardCount / reviewedCardCount;

      return (
        <div className="StudyApp">
          <h3>{deck.title}</h3>
          <div className="StudySessionResult">
            <span className="number">{newCardCount}</span>
            <span className="term">new cards</span>
            <span className="number">{reviewedCardCount}</span>
            <span className="term">old cards</span>
            <span className="number">{(recallRate * 100).toFixed(0)}%</span>
            <span className="term">recall rate</span>
          </div>
          <div className="StudyActions">
            <button type="button" onClick={() => window.location.reload()}>Finish</button>
          </div>
        </div>
      );
    }
  }
}


StudyApp = connect(
  function mapStateToProps(state, ownProps) {
    var deckId = ownProps.match.params.deckId;

    return {
      deck: state.decks[deckId],
      studySession: state.studySession
    }
  },
  function mapDispatchToProps(dispatch) {
    return {
      fetchStudySession: (deckId) => dispatch(fetchStudySession(deckId)),
      submitAnswers: (sessionId, answers) => dispatch(submitAnswers(sessionId, answers)),
      fetchDeck: (deckId) => dispatch(fetchDeck(deckId))
    }
  }
)(StudyApp)


export default StudyApp;
