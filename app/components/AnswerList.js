import React, { Component } from 'react';
import Answer from './Answer';

export default class AnswerList extends Component {
	constructor(props) {
	    super(props);
	    console.log('question id ' + props.answers);
		this.state = {
			questionId : props.questionId,
			answers : props.answers
		}
	}

	markOthersIncorrect(correctAnswerId) {
		var answers = [];
		if (this.state.answers) {
			for (var i=0; i < this.state.answers.length; i++) {
				var answer = this.state.answers[i];
				if (answer.id !== correctAnswerId) {
					answer.correct = false;
				} else {
					answer.correct = true;
				}				
				answers.push(answer);
			}
			this.setState({ answers : answers });
		}
	}

  componentWillReceiveProps(nextProps) {
    this.setState ({
      answers : nextProps.answers
    });
  }

	render() {
		var answerNodes = [];
		var answerListThis = this;
		if (this.state.answers && this.state.answers.length > 0) {
			var questionId = this.state.questionId;
		    answerNodes = this.state.answers.map(function(answer) {
		      return (
		        <Answer text={answer.text}
		                answerId={answer.id}
		                correct={answer.correct}
		                pinned={answer.pinned}
		                removed={answer.removed}
		                questionId={questionId}
		                key={answer.id}
		                correctCallback={(e) => answerListThis.markOthersIncorrect(e)}>
		        </Answer>
		      );
	    	});
		}
		return (
			<div className="answerList">
			  	<div className="answerHeading">
			  		<div className="answerTextColumn">Answer</div>
			  		<div className="correctColumn">Correct</div>
			  		<div className="pinnedColumn">Pinned</div>
				  	<div className="clear" />
			  	</div>
			  	<div className="answers">
			    	{answerNodes}
			    </div>
			  	<div className="clear" />
			 </div>
		);
	}
}