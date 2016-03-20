import React, { Component } from 'react';
import Fetcher from '../data/Fetcher';

export default class AddAnswerForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      questionId : props.questionId,
    }
  }

  handleTextChange(event) {
    this.setState({text: event.target.value});
  }

  handleCorrectChange(event) {
    this.setState({correct: event.target.checked});
  }

  handlePinnedChange(event) {
    this.setState({pinned: event.target.checked});
  }

  handleSubmit(event) {
    event.preventDefault();

    Fetcher.addAnswer(this.state.text, this.state.correct, this.state.pinned, this.state.questionId, (q) => this.props.addAnswerCallback(q));
    this.setState({
      text : '',
      correct : false
    });
  }

  render() {
    return (
      <form className="answerForm" onSubmit={(e) => this.handleSubmit(e)}>
        <div className="addAnswerInputs">
          <div className="form-group"> 
            <input
              type="text"
              className="form-control answerTextColumn"
              placeholder="Add an answer..." 
              onChange={(e) => this.handleTextChange(e)} 
              value={this.state.text} />
          </div>
          <input className="correctColumn" type="checkbox" onChange={(e) => this.handleCorrectChange(e)} checked={this.state.correct} />
          <input className="pinnedColumn" type="checkbox" onChange={(e) => this.handlePinnedChange(e)} checked={this.state.pinned} />
        </div>
        <input className="btn btn-default submitColumn" type="submit" value="Add" />

      </form>
    );
  }
} 