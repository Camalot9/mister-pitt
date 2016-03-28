import React, { Component } from 'react';
import QuestionList from './QuestionList';
import AddQuestionForm from './AddQuestionForm';
import Fetcher from '../data/Fetcher';

var questionContains = function(searchString, question) {
  var str = searchString.toLowerCase();
  return question &&
          ((question.text &&
            question.text.toLowerCase().indexOf(str) > 0) ||
          (question.category &&
            question.category.toLowerCase().indexOf(str) > 0));
}

var shouldSearch = function(searchString) {
  return searchString && searchString.trim().length > 2;
}

var findVisible = function(questions, searchString, showDeleted) {
  var visible = [];
  if (questions) {
    questions.forEach(function(question) {
          if ((!question.removed || showDeleted) && 
              (!shouldSearch(searchString) || questionContains(searchString, question))) {
            visible.push(question);
          }
        });
  }
  return visible;
};

export default class QuestionEntryPage extends Component {
  constructor() {
    super();

    this.state = { 
      questions : [],
      visible: [],
      searchString: null,
      showDeleted: false
    };
  }

  componentDidMount () {
    Fetcher.getQuestions(10, (questionsList) => {
      this.setState({
        questions: questionsList,
        visible: findVisible(questionsList, this.state.searchString, this.state.showDeleted)
      });
    });
  }

  addQuestion(question) {

    var newQuestionsList;
    var newVisible;
    if (question && question.success !== false) {
      newQuestionsList = this.state.questions.concat([question]);
      newVisible = this.state.visible;
      if (!shouldSearch(this.state.searchString) || questionContains(this.state.searchString, question)) {
        newVisible = this.state.visible.concat([question]);
      } 
    } else {
      newQuestionsList = this.state.questions;
      newVisible = this.state.visible;
      console.log('Looks like question add failed...TODO show some fail icon here!');
    }

    this.setState({
      questions : newQuestionsList,
      visible: newVisible 
    });
  }

  handleShowDeletedToggle(event) {
    var show = event.target.checked;
    var visible = findVisible(this.state.questions, this.state.searchString, show);

    this.setState({
      showDeleted: show,
      visible: visible
    });
  }

  handleSearch(event) {
    var searchString = event.target.value;
    var visible = findVisible(this.state.questions, searchString, this.state.showDeleted);

    this.setState({
      searchString: searchString,
      visible: visible
    });
  }

  render() {
    return (
      <div className="container">
        <div className="header">
          <h1>
            Mister Pitt
          </h1>
          <div className="rightHeader">
            <input
                type="text"
                className="form-control searchBar"
                onChange={(e) => this.handleSearch(e)} 
                value={this.state.searchString} 
                placeholder="Search" />
          </div>
          <div className="rightLowerHeader">
            <input
                type="checkbox"
                id="showDeleted"
                onChange={(e) => this.handleShowDeletedToggle(e)}
                checked={this.state.showDeleted} />
            <span className="showDeleteLabel">Show deleted</span>
            <div className="clear" />
          </div>
          <div className="clear" />
        </div>
        <QuestionList questions={this.state.visible} />
        <h2>Add a Question</h2>
        <AddQuestionForm questions={this.state.questions} addQuestionCallback={(q) => this.addQuestion(q)} />
      </div>
    );
  }
}