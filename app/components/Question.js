import React, { Component } from 'react';
import AnswerList from './AnswerList';
import AddAnswerForm from './AddAnswerForm';
import Fetcher from '../data/Fetcher';


var removedIfRemoved = function(removed) {
  return  removed ? " removed" : "";
};

/**

TODO: 
  5. Show indications for success and failure
  */

export default class Question extends Component {
  constructor(props) {
    super(props);
    this.state = {
      answers: props.answers,
      questionId: props.questionId,
      text: props.question,
      difficulty: props.difficulty,
      category: props.category,
      removed: props.removed,
      showQuestionCallback: props.questionSelectCallback
    };
  }

  handleDeleteQuestion(event) {
    Fetcher.deleteQuestion(this.state.questionId, (response) => {
      this.setState({
        removed: true
      });
    });
  }

  handleUndeleteQuestion(event) {
    Fetcher.undeleteQuestion(this.state.questionId, (response) => {
      this.setState({
        removed: false
      });
    });
  }

  submitTextChange(event) {
    Fetcher.updateQuestion(this.state.questionId, this.state.text, this.state.category, this.state.difficulty, (response) => {
      console.log('Question updated');
      console.log(response);
    });
  }

  submitCategoryChange(event) {
    Fetcher.updateQuestion(this.state.questionId, this.state.text, this.state.category, this.state.difficulty, (response) => {
      console.log('category updated');
      console.log(response);
    });
  }

  submitDifficultyChange(event) {
    var newDifficulty = event.target.value;
    Fetcher.updateQuestion(this.state.questionId, this.state.text, this.state.category, newDifficulty, (response) => {
      console.log('difficulty updated');
      console.log(response);
      this.setState({difficulty: newDifficulty});
    });
  }

  handleTextChange(event) {
    this.setState({text: event.target.value});
  }

  handleCategoryChange(event) {
    this.setState({category: event.target.value});
  }

  showQuestion(event) {
    this.state.showQuestionCallback($(event.target));
  }

  addAnswer(answer) {
    if (answer.correct) {
      for (var i=0; i < this.state.answers.length; i++) {
        this.state.answers[i].correct = false;        
      }
    }
    this.setState({answers : this.state.answers.concat([answer])});
  }

  render() {
    var removeOrUnremove;
    if (this.state.removed) {
      removeOrUnremove = 
        <div className="removeQuestion unremove" onClick={(e) => this.handleUndeleteQuestion(e)}>
          O
        </div>;
    } else {
      removeOrUnremove = 
        <div className="removeQuestion remove" onClick={(e) => this.handleDeleteQuestion(e)}>
          X
        </div>;
    }

    return (
      <div className="question">
        <div className={"questionText"  + removedIfRemoved(this.state.removed)} id={"question_" + this.props.questionId} 
            data-question-update={"questionUpdate_" + this.state.questionId} 
            onClick={(e) => this.showQuestion(e)}>
          {this.state.text + ' (' + (this.state.answers && this.state.answers.length ? this.state.answers.length : 0) + ' answers)'}
        </div>

        <div className="questionUpdateSection" id={"questionUpdate_" + this.state.questionId}>
          <div className="questionUpdate">
            <form className="updateQuestionForm">
              {removeOrUnremove}
              <div className="form-group"> 
                <input
                  type="text"
                  className={"form-control updateQuestionText" + removedIfRemoved(this.state.removed)}
                  onChange={(e) => this.handleTextChange(e)} 
                  onBlur={(e) => this.submitTextChange(e)} 
                  value={this.state.text} />
                <div className="form-group"> 
                  <input
                    type="text"
                    className="form-control updateQuestionCategory"
                    placeholder="Category" 
                    value={this.state.category}
                    onChange={(e) => this.handleCategoryChange(e)} 
                    onBlur={(e) => this.submitCategoryChange(e)} 
                    />
                </div>
                <div className="form-group">
                  <select className="form-control updateQuestionDifficulty" 
                    value={this.state.difficulty} onChange={(e) => this.submitDifficultyChange(e)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </select>
                </div>
                <div className="clear" />
              </div>
            </form>
          </div>

          <div className="answerSection" id={"answers_" + this.props.questionId}>
            <div className="AnswerList">
              <AnswerList questionId={this.props.questionId} answers={this.state.answers} />
            </div>
            <div className="addAnswerForm">
              <AddAnswerForm questionId={this.props.questionId} 
                             addAnswerCallback={(q) => this.addAnswer(q)} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}