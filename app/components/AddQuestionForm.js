import React, { Component } from 'react';
import Fetcher from '../data/Fetcher';

export default class AddQuestionForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      questions: props.questions,
      text: '',
      difficulty: '5',
      expanded: null
    };
  }

  handleTextChange(event) {
    this.setState({text: event.target.value});
  }

  handleCategoryChange(event) {
    this.setState({category: event.target.value});
  }

  handleDifficultyChange(event) {
    this.setState({difficulty: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    console.log('Posting question with text ' + this.state.text);

    Fetcher.addQuestion(this.state.text, this.state.difficulty, this.state.category, (q) => this.props.addQuestionCallback(q));
    this.setState({
      text: '',
      category: '',
      difficulty: '5'
    });
  }

  render() {
    return (
      <form className="form-inline addQuestionForm" onSubmit={(e) => this.handleSubmit(e)}>
        <div className="form-group"> 
          <input
            type="text"
            className="form-control questionTextInput"
            placeholder="What's the deal with..." 
            value={this.state.text}
            onChange={(e) => this.handleTextChange(e)} />
        </div>
        <div className="form-group"> 
          <input
            type="text"
            className="form-control categoryTextInput"
            placeholder="Category" 
            value={this.state.category}
            onChange={(e) => this.handleCategoryChange(e)} />
        </div>
        <div className="form-group">
          <select className="form-control difficultyInput" value={this.state.difficulty} onChange={(e) => this.handleDifficultyChange(e)}>
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
        <input className="btn btn-default" type="submit" value="Add" />
      </form>
    );
  }
} 