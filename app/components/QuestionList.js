import React, { Component } from 'react';
import Fetcher from '../data/Fetcher';
import Question from './Question';

export default class QuestionList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: null
    };
  }

  showQuestionForm(elem) {
    var questionToHide = elem;
    var formToShow = elem.next('.questionUpdateSection');

    questionToHide.hide(300);
    formToShow.show(300);

    if (this.state.expanded) {
      var questionToShow = this.state.expanded;
      var formToHide = this.state.expanded.next('.questionUpdateSection');

      questionToShow.show(300);
      formToHide.hide(300);
    }

    this.setState({
      expanded: elem
    });
  }


  render() {
    var questionList = !this.props.questions ? [] : this.props.questions;
    var questionNodes = questionList.map((question) => {
      return (
        <Question question={question.text} 
                  questionId={question.id}
                  difficulty={question.difficulty}
                  category={question.category}
                  answers={question.answers}
                  key={question.id}
                  removed={question.removed}
                  questionSelectCallback={(e) => this.showQuestionForm(e)}>
        </Question>
      );
    });
    return (
      <div className="questionList">
        {questionNodes}
      </div>
    );
  }
}