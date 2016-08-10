/**
 * Created by jkochuk on 6/17/16.
 */
import React, { Component } from 'react';
import { Bert } from 'meteor/themeteorchef:bert';

export default class TyrionForm extends Component {
  constructor () {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitOnEnter = this.handleSubmitOnEnter.bind(this);
    this.state = { FormID: '', minDate: '', maxDate: '' };
  }


  handleSubmit (event) {
    event.preventDefault();
    const formID = document.getElementById('formID-field').value;
    const minDate = new Date(document.getElementById('minDate-field').value);
    const maxDate = new Date(document.getElementById('maxDate-field').value);
    console.log({ formID, minDate, maxDate});
    if (formID) {
      this.props.handleSubmit({ formID, minDate, maxDate});
    } else {
      Bert.alert('Enter Form Name', 'info', 'growl-top-right');
    }

  }
  
  handleSubmitOnEnter (e) {
    if (e.key == 'Enter') {
      document.getElementById('formID-field').blur();
      this.handleSubmit(e);
    }
  }

  componentDidMount () {
    $('.datepicker').pickadate({
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 15 // Creates a dropdown of 15 years to control year
    });
  }

  render () {
    return (
      <form>
        <div className="input-field col l5">
          <input
            id="formID-field"
            type="text"
            placeholder="Enter a Form Name or ID"
            onChange={this.handleFormChange}
            onKeyPress={this.handleSubmitOnEnter}
          />
        </div>
        <div className="input-field col l2">
          <input
            id="minDate-field"
            type="date"
            className="datepicker"
            placeholder="From Date"
            onBlur={this.handleMinDateChange}/>
        </div>
        <div className="input-field col l2">
          <input
            id="maxDate-field"
            type="date"
            className="datepicker"
            placeholder="To Date"
            onBlur={this.handleMaxDateChange}/>
        </div>
        <div className="col l1">
          <a onClick={this.handleSubmit} className="btn-floating WBRedBackground waves-effect waves-light white-text">
            <i className="material-icons">search</i>
          </a>
        </div>
      </form>
    );
  }
}


