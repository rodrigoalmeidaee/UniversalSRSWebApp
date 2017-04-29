import React from 'react';


var rndKeyGen = 1;

function rndKey() {
  return ++rndKeyGen;
}


class CardViewModel {

    constructor(card) {
        Object.assign(this, card);
    }

    renderFrontText() {
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
            return this._renderText(backText + ' [sound:' + this.sound_uri + ']');
        } else {
            return this._renderText(backText);
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
        return [
            this.splitNotes()[0].replace(/\s*\[sound:[^\]]*\]/g, "")
        ];
    }

    hasNotes() {
      return this.splitNotes()[1].length > 0;
    }

    renderNotes() {
        var notes = this.splitNotes()[1];
        return this._renderText(notes);
    }

    _renderText(text) {
        var lines = text.split("\n");
        return (
          <div className="card-text-block">
            {
              lines.map(line => this._renderLine(line))
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

    _renderLine(text) {
      if (text === "Mnemonic:") {
        return <div className="card-notes-header" key={rndKey()}>{text}</div>;
      }
      if (text.indexOf("[sound:") >= 0) {
        var capturedDom;
        var soundUri = text.substring(text.indexOf("[sound:") + 7);
        soundUri = soundUri.substring(0, soundUri.length - 1);

        return (
          <div className='text-line' key={rndKey()}>
            <span className="sounded-text" onClick={() => capturedDom && capturedDom.play()}>
              {this._renderLine(text.replace(/\s*\[sound:[^\]]*\]/, ""))}
              <audio ref={audioDom => {capturedDom = audioDom;}}>
                <source src={soundUri} />
              </audio>
            </span>
          </div>
        );
      } else {
        var tokenizedString = text.split(/(\*.*?\*)/);
        return (
          <div className='text-line' key={rndKey()}>
            {
              tokenizedString.map(token => {
                if (token.substring(0, 1) === '*') {
                  return <em>{token.substring(1, token.length - 1)}</em>;
                }
                return token;
              })
            }
          </div>
        )
      }
    }
}


export default CardViewModel;
