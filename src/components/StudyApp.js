import { connect } from 'react-redux';
import React, { Component } from 'react';
import {BarChart, LineChart, Legend} from 'react-easy-chart';

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


const shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


const normalizeGraphs0 = function(graphs, ...seriesNames) {
  var series = seriesNames.map(name => {
    var graph = graphs.find(g => g.name === name);
    if (!graph) {
      graph = {data: []};
    }
    return graph.data.slice();
  });

  var keys = [];
  series.forEach(s => {
    s.forEach(xy => {
      if (keys.indexOf(xy.x) == -1) {
        keys.push(xy.x);
      }
    });
  });

  series.forEach(s => {
    keys.forEach(key => {
      if (s.findIndex(xy => xy.x === key) == -1) {
        s.push({x: key, y: 0});
      }
    });
  });

  series.forEach(s => {
    s.sort((a, b) => {
      if (a.x > b.x) {
        return 1;
      } else if (a.x < b.x) {
        return -1;
      }
      return 0;
    });
  });

  return series;
};



const normalizeGraphsSplit = function(graphs, ...seriesNames) {
  var series = seriesNames.map(name => {
    var graph = graphs.find(g => g.name === name);
    if (!graph) {
      graph = {data: []};
    }
    return graph.data.slice();
  });

  var keys = [];
  series.forEach(s => {
    s.forEach(xy => {
      if (keys.indexOf(xy.x) == -1) {
        keys.push(xy.x);
      }
    });
  });

  series.forEach(s => {
    keys.forEach(key => {
      if (s.findIndex(xy => xy.x === key) == -1) {
        s.push({x: key, y: null});
      }
    });
  });

  series.forEach(s => {
    s.sort((a, b) => {
      if (a.x > b.x) {
        return 1;
      } else if (a.x < b.x) {
        return -1;
      }
      return 0;
    });
  });

  return series.map(s => {
    var collectedSeries = [];
    while (s.findIndex(xy => xy.y === null) >= 0) {
      var index = s.findIndex(xy => xy.y === null);
      if (index > 0) {
        collectedSeries.push(s.splice(0, index));
      }
      while (s.length && s[0].y === null) {
        s.splice(0, 1);
      }
    }
    if (s.length) {
      collectedSeries.push(s);
    }
    return collectedSeries;
  });
};


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

  onFlipRequested(e) {
    e = e || {target: this._cardAnswerDom};
    var submitting = this.state.flashAnswer && this.state.flashAnswer.indexOf("maybe") != 0;
    var canAcceptText = !this.state.cardFlipped && !submitting;
    var canAcceptArrows = !submitting && (this.state.cardFlipped || e.target.value === "");

    if (canAcceptText) {
      this.setState({cardFlipped: true});
      var card = new CardViewModel(
        this.state.cardStack[this.state.studyOrder[this.state.studyIndex]]
      );
      if (card.acceptableAnswers().find(a => a.toLowerCase() === e.target.value.toLowerCase())) {
        if (card.is_new) {
          this.setState({'flashAnswer': 'maybeRight'});
        } else {
          this.handleScenario('right');
        }
      } else {
        this.setState({'flashAnswer': 'maybeWrong'});
      }
    }
  }

  handleInput(e) {
    var submitting = this.state.flashAnswer && this.state.flashAnswer.indexOf("maybe") != 0;
    var canAcceptText = !this.state.cardFlipped && !submitting;
    var canAcceptArrows = !submitting && (this.state.cardFlipped || e.target.value === "");
    var isMobile = window.innerHeight <= 768;

    if (e.keyCode === 13 && !e.shiftKey && !isMobile) {
      e.preventDefault();
      this.onFlipRequested(e);
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
    var timeoutId = setTimeout(this._endHandleScenario.bind(this, scenario), 1000);

    this.setState({
      'flashAnswer': scenario,
      'cardFlipped': true,
      'cancelAutomaticMoveToNextCard': function() {
        clearTimeout(timeoutId)
      },
      'moveToNextCard': this._endHandleScenario.bind(this, scenario)
    });
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
      var cardsAdded = [];

      for (var i = 0; i < cardStack.length && cardsAdded.length < OLD_CARDS_BLOCK_SIZE; ++i) {
        if (!cardStack[i].is_new && !cardStack[i]._finished) {
          cardsAdded.push(i);
        }
      }

      if (!cardsAdded.length) {
        for (i = 0; i < cardStack.length && cardsAdded.length < NEW_CARDS_BLOCK_SIZE; ++i) {
          if (cardStack[i].is_new && !cardStack[i]._finished) {
            cardsAdded.push(i);
          }
        }
      }

      if (!cardsAdded.length) {
        this.setState({
          state: 'studyFinished'
        });
      } else {
        this.setState({
          studyOrder: studyOrder.concat(shuffle(cardsAdded)),
          studyIndex: studyIndex + 1
        });
      }
    } else {
      this.setState({
        studyIndex: studyIndex + 1
      });
    }
    this.setState({
      cardFlipped: false,
      userEnteredText: '',
      cancelAutomaticMoveToNextCard: null,
      moveToNextCard: null
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.studyIndex !== this.state.studyIndex) {
      var card = new CardViewModel(
        this.state.cardStack[this.state.studyOrder[this.state.studyIndex]]
      );
      if (!card.reverse && document.querySelectorAll('audio').length === 1) {
        document.querySelector('audio').play();
      }
    }
    else if (this.state.cardFlipped && !prevState.cardFlipped) {
      var card = new CardViewModel(
        this.state.cardStack[this.state.studyOrder[this.state.studyIndex]]
      );
      if (card.reverse && document.querySelectorAll('audio').length === 1) {
        var audioDom = document.querySelector('audio');
        if (this.state.moveToNextCard) {
          var throttle = function(callable, delayMs) {
            return function() {
              console.log('eventListenerCallback');
              setTimeout(callable, delayMs);
            };
          };

          audioDom.addEventListener("ended", throttle(this.state.moveToNextCard, 500), {once: true});
          this.state.cancelAutomaticMoveToNextCard();
          audioDom.play();
        } else {
          audioDom.play();
        }
      }
    }
  }

  getStudySessionProgress() {
    let expectedNumberOfAnswers = 0;
    let answersGiven = 0;
    let newCardCount = 0;
    let newCardFinishedCount = 0;
    let reviewedCardCount = 0;
    let reviewedCardFinishedCount = 0;
    let recalledCorrectlyCardCount = 0;

    this.state.cardStack.forEach(card => {
      if (card.is_new) {
        expectedNumberOfAnswers += 3;
        newCardCount += 1;
        if (card._finished) {
          answersGiven += 3;
          newCardFinishedCount += 1;
        } else {
          answersGiven += (card._bounces || 0);
        }
      }
      else {
        expectedNumberOfAnswers += 1;
        reviewedCardCount += 1;
        if (card._finished) {
          answersGiven += 1;
          reviewedCardFinishedCount += 1;
          if (!card._wrong) {
            recalledCorrectlyCardCount += 1;
          }
        }
      }
    });

    return {
      progress: {
        toDo: expectedNumberOfAnswers,
        done: answersGiven,
        percent: 100 * (answersGiven / expectedNumberOfAnswers)
      },
      newCards: {
        toDo: newCardCount,
        done: newCardFinishedCount
      },
      oldCards: {
        toDo: reviewedCardCount,
        done: reviewedCardFinishedCount,
        recallRate: recalledCorrectlyCardCount / reviewedCardFinishedCount
      }
    };
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
          {this.reviewsChart()}
          {this.recallRateChart()}
        </div>
      )
    } else if (this.state.state === 'studying') {
      var card = new CardViewModel(
        this.state.cardStack[this.state.studyOrder[this.state.studyIndex]]
      );
      var cards = this.state.cardStack;
      var cardFlipped = this.state.cardFlipped;
      var disableButtons = this.state.flashAnswer && this.state.flashAnswer.indexOf('maybe') != 0;
      var autoGrow = function(event) {
        var element = event.target;
        element.style.height = "5px";
        element.style.height = (element.scrollHeight) + "px";
      }
      var progress = this.getStudySessionProgress();
      var frontLanguage = card.reverse ? 'us' : deck.language;
      var backLanguage = !card.reverse ? 'us' : deck.language;

      return (
        <div className="StudyApp">
          <h3 className="StudyHeader">
            {deck.title}
            <small>
              new: {progress.newCards.done} / {progress.newCards.toDo},
              reviews: {progress.oldCards.done} / {progress.oldCards.toDo}
              ({(100 * progress.oldCards.recallRate).toFixed(0).replace(/NaN/, '-')}% correct),
              session: {progress.progress.percent.toFixed(0)}% complete
            </small>
          </h3>
          <div className="StudyCard">
            <div className={`Card-front ${this.state.flashAnswer || ''}`}>
              {card.renderFrontText()}
            </div>
            <div className="Card-answer">
              <div className="Card-answer-overlay">
                <span className={ `flag-icon flag-icon-${frontLanguage}` } />
                &nbsp;→&nbsp;
                <span className={ `flag-icon flag-icon-${backLanguage}` } />
              </div>
              <textarea
                     onKeyDown={this.handleInput.bind(this)}
                     onDoubleClick={this.onFlipRequested.bind(this)}
                     onChange={e => {
                       this.setState({userEnteredText: e.target.value});
                       autoGrow(e);
                     }}
                     style={{height: '5px'}}
                     ref={me => {
                       if (me) {
                         me.focus();
                         autoGrow({target: me});
                         this._cardAnswerDom = me;
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
      let progress = this.getStudySessionProgress();

      return (
        <div className="StudyApp">
          <h3>{deck.title}</h3>
          <div className="StudySessionResult">
            <span className="number">{progress.newCards.done}</span>
            <span className="term">new cards</span>
            <span className="number">{progress.oldCards.done}</span>
            <span className="term">old cards</span>
            <span className="number">{(progress.oldCards.recallRate * 100).toFixed(0)}%</span>
            <span className="term">recall rate</span>
          </div>
          <div className="StudyActions">
            <button type="button" onClick={() => window.location.reload()}>Finish</button>
          </div>
        </div>
      );
    }
  }

  reviewsChart() {
    if (this.props.studySession.graphs.filter(g => (
      (g.name === 'New Cards' || g.name === 'Reviewed Cards')
      && g.data.length >= 2
    )).length == 2) {
      var [newCardsData, reviewedCardsData] = normalizeGraphs0(
        this.props.studySession.graphs,
        'New Cards',
        'Reviewed Cards'
      );

      var legend = [
        {key: 'New Cards', color: COLORS['new']},
        {key: 'Reviews', color: COLORS['today']},
      ];

      return (
        <div>
          <h4>Cards studied per day</h4>
          <Legend
            data={legend}
            horizontal
            dataId={'key'}
            config={legend} />
          <LineChart
            xType={'text'}
            width={500}
            height={200}
            axes
            grid
            data={[newCardsData, reviewedCardsData]}
            lineColors={[COLORS['new'], COLORS['today']]}
            yDomainRange={[0, Math.max(...(
              newCardsData.map(dp => dp.y).concat(reviewedCardsData.map(dp => dp.y))
            ))]}
          />
        </div>
      );
    }

    return null;
  }

  recallRateChart() {
    if (this.props.studySession.graphs.filter(g => (
      (g.name.indexOf('Recall Rate') >= 0)
      && g.data.length >= 2
    )).length >= 1) {
      var [all, baby, young, adult, old] = normalizeGraphsSplit(
        this.props.studySession.graphs,
        'Recall Rate/All Cards',
        'Recall Rate/Very Imature Cards (SRS Level 0-2)',
        'Recall Rate/Imature Cards (SRS Level 3-4)',
        'Recall Rate/Almost Mature Cards (SRS Level 5-7)',
        'Recall Rate/Mature Cards (SRS Level 8+)'
      );
      var lineColors = (
        all.map(_ => '#000000')
        .concat(baby.map(_ => COLORS['now']))
        .concat(young.map(_ => COLORS['tomorrow']))
        .concat(adult.map(_ => COLORS['4d-1w']))
        .concat(old.map(_ => COLORS['1m+']))
      )

      var legend = [
        {key: 'All', color: '#000000'},
        {key: 'Very Imature (SRS 0-2)', color: COLORS['now']},
        {key: 'Imature (SRS 3-4)', color: COLORS['tomorrow']},
        {key: 'Almost Mature (SRS 5-7)', color: COLORS['4d-1w']},
        {key: 'Mature (SRS 8+)', color: COLORS['1m+']},
      ];

      return (
        <div>
          <h4>Recall rate</h4>
          <Legend
            data={legend}
            horizontal
            dataId={'key'}
            config={legend} />
          <LineChart
            xType={'text'}
            width={500}
            height={200}
            axes
            grid
            data={all.concat(baby).concat(young).concat(adult).concat(old).map(s => {
              return s.map(xy => ({x: xy.x, y: xy.y * 100}));
            })}
            lineColors={lineColors}
          />
        </div>
      );
    }

    return null;
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
