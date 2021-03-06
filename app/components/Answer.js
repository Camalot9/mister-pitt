import React, { Component } from 'react';
import Fetcher from '../data/Fetcher';

var removedIfRemoved = function(removed) {
  return  removed ? " removed" : "";
};

export default class Answer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text : props.text,
      questionId : props.questionId,
      answerId : props.answerId,
      pinned : props.pinned,
      correct : props.correct,
      removed : props.removed,
      correctCallback : props.correctCallback
    }
  }
    
  handleTextChange(event) {
    this.setState({text: event.target.value});
  }

  handleCorrectChange(event) {
    Fetcher.updateAnswerCorrect(this.state.answerId, this.state.questionId, (response) => {
      // TODO check if the response was a success or whatever
      this.state.correctCallback(this.state.answerId);
    });
  }

  handlePinnedChange(event) {
    var pinned = event.target.checked;
    this.setState({pinned: pinned});
    if (pinned) {
      Fetcher.pinAnswer(this.state.answerId, this.state.questionId, function(response) {
        console.log('response from pinning: ' + response);
      });
    } else {
      Fetcher.unpinAnswer(this.state.answerId, this.state.questionId, function(response) {
        console.log('response from unpinning: ' + response);
      }); 
    }
  }

  submitTextChange(event) {
    Fetcher.updateAnswer(this.state.answerId, this.state.questionId, this.state.text, (response)  => {
      console.log('ok looks like the answer got updated but we really need real response handling. ' + response);
    });
  }

  handleDeleteAnswer(event) {
    Fetcher.deleteAnswer(this.state.answerId, this.state.questionId, (response) => {
      console.log('deleted answer');
      console.log(response);
      this.setState({
        removed : true
      });
    });
  }
  
  handleUndeleteAnswer(event) {
    Fetcher.undeleteAnswer(this.state.answerId, this.state.questionId, (response) => {
      console.log('undeleted answer');
      console.log(response);
      this.setState({
        removed : false
      });
    });
  }

  // Correctness is going to be updated by the AnswerList component, so watch for that prop
  componentWillReceiveProps(nextProps) {
    this.setState ({
      correct : nextProps.correct
    });
  }

  render() {
    var removeOrUnremove;
    if (this.state.removed) {
      removeOrUnremove = 
        <div className="removeColumn unremove" onClick={(e) => this.handleUndeleteAnswer(e)}>
          O
        </div>;
    } else {
      removeOrUnremove = 
        <div className="removeColumn remove" onClick={(e) => this.handleDeleteAnswer(e)}>
          X
        </div>;
    }
    return (
      <form className="updateAnswerForm answerForm">
        {removeOrUnremove}
        <div className="form-group"> 
          <input
            type="text"
            className={"form-control answerTextColumn" + removedIfRemoved(this.state.removed)}
            onChange={(e) => this.handleTextChange(e)} 
            onBlur={(e) => this.submitTextChange(e)} 
            value={this.state.text} />
          <input className="correctColumn" type="radio" onChange={(e) => this.handleCorrectChange(e)} checked={this.state.correct} />
          <input className="pinnedColumn" type="checkbox" onChange={(e) => this.handlePinnedChange(e)} checked={this.state.pinned} />
        </div>
      </form>
    );
  }
}