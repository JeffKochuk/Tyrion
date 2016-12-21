/**
 * Created by jkochuk on 6/17/16.
 */
import React, { Component } from 'react';
import { Bert } from 'meteor/themeteorchef:bert';

// @TODO refactor as stateless function
export default class TyrionForm extends Component {
  constructor () {
    super();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitOnEnter = this.handleSubmitOnEnter.bind(this);
    this.state = {  };
  }


  handleSubmit (event) {
    event.preventDefault();
    const search = document.getElementById('formID-field').value;
    const minDate = new Date(document.getElementById('minDate-field').value);
    const maxDate = new Date(document.getElementById('maxDate-field').value);
    if (search) {
      this.props.handleSubmit({ search, minDate, maxDate});
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
    //@TODO use the following options:
    // min: new Date(2015,10,10),
    // max: new Date(2016,10,10),
    // Setup on-change handlers and use the #mindate.stop() and redo #minDate.pickadate()
    // http://amsul.ca/pickadate.js/date/#limits
    //new Date(e.target.value)
    $('.datepicker').pickadate({
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 10, // Creates a dropdown of 5 years to control year
      min: [2007,10,10],
      max: true
    });
    $('#minDate-field').change((e) => {
      $('#maxDate-field').pickadate('picker').set('min', new Date(e.target.value));
    });
    $('#maxDate-field').change((e) => {
      $('#minDate-field').pickadate('picker').set('max', new Date(e.target.value));
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


