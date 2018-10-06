import React from 'react';

import WanikaniFonts from './WanikaniFonts';


class CardViewModel {

    constructor(card) {
        Object.assign(this, card);
    }

    renderFrontText() {
        if (this.type === 'wanikani-radical' && this.front.indexOf('http') === 0) {
          return (
            <div className="card-text-block wanikani-font">
              <div className='text-line'>
                <span className="level-indicator">{this.level}</span>
                <img className='wanikani-character' src={this.front} />
              </div>
            </div>
          );
        }
        else if (this.type.indexOf('wanikani') === 0) {
          const wanikaniStyle = {};
          if (!this.is_new) {
            wanikaniStyle = { fontFamily: WanikaniFonts.getRandomFont(this.front) };
          }

          return (
            <div className="card-text-block wanikani-font" style={wanikaniStyle}>
              <div className='text-line'>
                <span className="level-indicator">{this.level}</span>
                {
                  this.sound_uri
                    ? this._renderAudio(this.sound_uri, this.front)
                    : this.front
                }
              </div>
            </div>
          );
        }
        if (this.sound_uri && !this.reverse) {
            return this._renderText(
                this.front + ' [sound:' + this.sound_uri + ']'
            )
        } else {
            return this._renderText(this.front)
        }
    }

    renderBackText() {
        var backText;

        backText = this.splitNotes()[0];

        if (this.sound_uri && this.reverse) {
            return this._renderText(backText + ' [sound:' + this.sound_uri + ']', true);
        } else {
            return this._renderText(backText, true);
        }
    }

    splitNotes() {
        if (this.back.indexOf("Mnemonic:") >= 0) {
            return [
                this.back.substring(0, this.back.indexOf("Mnemonic:")).trim(),
                this.back.substring(this.back.indexOf("Mnemonic:"))
            ];
        }

        return [this.back, ""];
    }

    acceptableAnswers() {
        if (this.type === 'wanikani-kanji' || this.type === 'wanikani-vocabulary') {
          return [
            this.back.replace("\n\n", "\n").replace("Readings: ", "").replace(" (onyomi)", "").replace(" (kunyomi)", "")
          ];
        }
        return [
            this.splitNotes()[0].replace(/\s*\[sound:[^\]]*\]/g, "")
        ];
    }

    hasNotes() {
      if (this.type.indexOf('wanikani') === 0) {
        return true;
      }
      return this.splitNotes()[1].length > 0;
    }

    renderNotes() {
        if (this.type.indexOf('wanikani') === 0) {
          const output = [];
          const names = {
            'name_mnemonic': 'Mnemonic',
            'reading_mnemonic': 'Reading Mnemonic',
            'meaning_mnemonic': 'Meaning Mnemonic',
          };

          ['name_mnemonic', 'meaning_mnemonic', 'reading_mnemonic'].forEach(key => {
            if (this[key]) {
              output.push(
                <div className='wanikani-section' key={key}>
                  <div className='header'>{names[key]}</div>
                  <div className='contents' dangerouslySetInnerHTML={{__html: this[key]}} />
                </div>
              );
            }
          });

          if (this.context_sentences && this.context_sentences.length) {
            output.push(
              <div className='wanikani-section' key='context_sentences'>
                <div className='header'>Context Sentences</div>
                <div className='contents'>
                  {
                    this.context_sentences.map((sentence, index) => {
                      const wanikaniStyle = { fontFamily: WanikaniFonts.getRandomFont(sentence.japanese) };

                      return (
                        <div className='context-sentence reveal-on-hover-container' key={index}>
                          <div className='wanikani-font' style={wanikaniStyle}>{sentence.japanese}</div>
                          <div className='reveal-on-hover'>{sentence.english}</div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            );
          }

          return <div>{output}</div>;
        }

        var notes = this.splitNotes()[1];
        return this._renderText(notes);
    }

    _renderText(text, backText) {
        var lines = text.split("\n");
        return (
          <div className="card-text-block">
            {
              lines.map((line, idx) => this._renderLine(line, idx, backText))
            }
          </div>
        );
    }

    getTimingInfo(scenario) {
      var timingKey = 'interval_if_' + scenario;
      var timing = this[timingKey];

      if (!timing) {
        return '-';
      }

      if (timing < 3600) {
        return (timing / 60).toFixed(0) + "m";
      } else if (timing < 24 * 3600) {
        return (timing / 3600).toFixed(0) + "h";
      } else {
        return (timing / 24 / 3600).toFixed(0) + "d";
      }
    }

    _renderAudio(soundUri, text) {
      var capturedDom;

      return (
        <span className="sounded-text" onClick={() => capturedDom && capturedDom.play()}>
          {text}
          <audio ref={audioDom => {capturedDom = audioDom;}} preload="none" key={soundUri}>
            <source src={soundUri} />
          </audio>
        </span>
      );
    }

    _renderLine(text, lidx, backText) {
      if (text === "") {
        return <div className='text-line' key={lidx}>&nbsp;</div>;
      }
      if (text === "Mnemonic:") {
        return <div className="card-notes-header" key={lidx + '.' + text}>{text}</div>;
      }
      if (text.indexOf("[sound:") >= 0) {
        var capturedDom;
        var soundUri = text.substring(text.indexOf("[sound:") + 7);
        soundUri = soundUri.substring(0, soundUri.length - 1);

        return (
          <div className='text-line' key={lidx + '.' + text}>
            {this._renderAudio(
              soundUri,
              this._renderLine(text.replace(/\s*\[sound:[^\]]*\]/, ""), lidx, backText))
            }
          </div>
        );
      } else {
        var tokenizedString = text.split(/(\*.*?\*)/);
        return (
          <div className='text-line' key={lidx + '.' + text}>
            {
              tokenizedString.map((token, idx) => {
                if (token.substring(0, 1) === '*') {
                  return <em key={idx + token}>{token.substring(1, token.length - 1)}</em>;
                }
                return <span key={idx + token}>{token}</span>;
              })
            }
          </div>
        )
      }
    }
}


export default CardViewModel;
