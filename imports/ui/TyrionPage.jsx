import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Bert } from 'meteor/themeteorchef:bert';
import TyrionTable from './TyrionTable.jsx';
import WorkbenchHeader from './WorkbenchHeader.jsx';
import queryString from 'query-string';

export default class TyrionPage extends Component {
  constructor () {
    super();
    // Initial State
    this.formSchema = { name: 'Form Name', id: 'Form ID'} ;
    this.start = { formID: null, schema: this.formSchema, data: [], search: '', loading: false, minDate: null, maxDate: null, current: 0, total: 0, page: 1 };
    this.state = { ...this.start };

    // Bind non-static functions
    this.handleSubmit = this.handleSubmit.bind(this);
    // this.handleSelect = this.handleSelect.bind(this);
    this.pollData = this.pollData.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  handleSubmit (formState) {
    this.setState({ loading: true });
    Meteor.call('handleSubmissionsNoMongo', formState, (err, res) => {
      if (err) {
        this.setState(this.start);
        Bert.alert(err.error, 'danger', 'growl-top-right');
      } else {
        this.setState(Object.assign({}, this.start, res));
      }
    });
  }

  handleClick (formState) {
    this.setState({ loading: true });
    Meteor.call('GetFormDataAndSchema', formState, (err, res) => {
      if (err) {
        this.setState(this.start);
        Bert.alert(err.error, 'danger', 'growl-top-right');
      } else {
        this.setState(Object.assign({}, this.start, res));
      }
    });
  }

  componentDidMount () {
    const formState = queryString.parse(window.location.search);
    if (formState.search) {
      this.handleSubmit(formState);
    }
  }

  pollData () {
    let {formID, minDate, maxDate, total, page} = this.state;
    if (this.state.data.length % 1000 === 0 && (1000 * (this.state.page - 1)) + this.state.data.length  < this.state.total) {
      page = page + 1;
    }
    this.setState({ loading: true });
    Meteor.call('GetFormData', { minDate, maxDate, total, page, search: formID, current: this.state.data.length }, (err, res) => {
      this.setState({ loading: false });
      if (err) {
        Bert.alert(err.error, 'danger', 'growl-top-right');
      } else if (res.data) {
        this.setState(res);
      } else {
        Bert.alert('No New Data', 'info', 'growl-top-right');
      }
    });
  }

  render () {
    return (
        <div>
          <WorkbenchHeader />
          <main>
            <div className="row center-align white-text">
              <h4> Need to Watch Form Submissions?</h4>
              <h3 className="WBRed"> Ask Tyrion </h3>
            </div>

            <TyrionTable
                click={this.handleClick}
                submit={this.handleSubmit}
                pollData={this.pollData}
                { ...this.state }
            />
          </main>
        </div>
    );
  }
}

