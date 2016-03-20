import React, { Component } from 'react';
import QuestionList from './QuestionList';
import AddQuestionForm from './AddQuestionForm';
import Fetcher from '../data/Fetcher';

var questionContains = function(searchString, question) {
  var str = searchString.toLowerCase();
  return question &&
          ((question.question &&
            question.question.toLowerCase().indexOf(str) > 0) ||
          (question.category &&
            question.category.toLowerCase().indexOf(str) > 0));
}

var shouldSearch = function(searchString) {
  return searchString && searchString.trim().length > 2;
};

export default class QuestionEntryPage extends Component {
  constructor() {
    super();

    // Can't call setState on a component until its mounted
    this.state = { 
      questions : [],
      visible: [],
      searchString: null
    };
  }

  componentDidMount () {
    Fetcher.getQuestions(10, (questionsList) => {
      this.setState({
        questions: questionsList,
        visible: questionsList
      });
    });
  }

  addQuestion(question) {
    var newQuestionsList = this.state.questions.concat([question]);
    var newVisible = this.state.visible;
    if (!shouldSearch(this.state.searchString) || questionContains(this.state.searchString, question)) {
      console.log('adding to visible');
      newVisible = this.state.visible.concat([question]);
    } else {
      console.log('not adding to visible');
    }

    this.setState({
      questions : newQuestionsList,
      visible: newVisible 
    });
  }

  handleSearch(event) {
    var searchString = event.target.value;

    var visible;
    if (shouldSearch(searchString)) {
      visible = [];
      if (this.state.questions) {
        this.state.questions.forEach(function(question) {
          if (questionContains(searchString, question)) {
            visible.push(question);
          }
        });
      }
    }
    else {
      visible = this.state.questions;
    }

    this.setState({
      visible: visible,
      searchString: searchString
    });
  }

  render() {
    return (
      <div className="container">
        <div className="header">
          <h1>
            Mister Pitt
            <input
                type="text"
                className="form-control searchBar"
                onChange={(e) => this.handleSearch(e)} 
                value={this.state.searchString} 
                placeholder="Search" />
            <div className="clear" />
          </h1>
        </div>
        <QuestionList questions={this.state.visible} />
        <h2>Add a Question</h2>
        <AddQuestionForm questions={this.state.questions} addQuestionCallback={(q) => this.addQuestion(q)} />
      </div>
    );
  }
}