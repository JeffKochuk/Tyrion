import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Bert } from 'meteor/themeteorchef:bert';
import TyrionTable from './TyrionTable.jsx';
import WorkbenchHeader from './WorkbenchHeader.jsx';

export default class TyrionPage extends Component {
  constructor () {
    super();

    // Initial State
    this.formSchema = { name: 'Form Name', id: 'Form ID'} ;
    this.initialState = { formID: '', schema: this.formSchema, formData: null, name: '', loading: false, minDate: null, maxDate: null};
    this.state = this.initialState;

    // Bind non-static functions
    this.handleSubmit = this.handleSubmit.bind(this);
    this.pollData = this.pollData.bind(this);
  }
  
  handleSubmit (formState) {
    console.log('looking up ' + formState.formID);
    console.log(formState);
    this.setState({ loading: true});
    
    if (parseInt(formState.formID)) { // If a number was passed, treat it as a Form ID
      Meteor.call('getSchemaAndFirstData', formState, (err, res) => {
        if (err) {
          Bert.alert(err.error, 'danger', 'growl-top-right');
          this.setState(this.initialState);
        } else {
          // Res contains formID, Name, and Schema
          this.setState(Object.assign(this.initialState, res));
        }
      });
      
    } else { // If a number wasn't passed, treat it is a name searching for forms
      Meteor.call('searchFormsByName', formState.formID, (err, res) => {
        if (err) {
          this.setState(this.initialState);
          Bert.alert(err.error, 'danger', 'growl-top-right');
        } else {
          this.setState({ formData: res, formID: '', schema: this.formSchema, loading: false, total: res.length });
        }
      });
    }
  }
  
  pollData () {
    if(this.state.formID){
      console.log('Polling data');
      this.setState({ loading: true });
      Meteor.call('pollingRefreshData', this.state.formID, (err, res) => {
        if (err) {
          Bert.alert(err.error, 'danger', 'growl-top-right');
          this.setState({ loading: false });
        } else {
          this.setState({ total: res.total, loading: false });
        }
      });
    }
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
            loading={this.state.loading}
            name={this.state.name}
            formID={this.state.formID}
            schema={this.state.schema}
            formData={this.state.formData}
            clickFunc={this.handleSubmit}
            pollData={this.pollData}
            minDate={this.state.minDate}
            maxDate={this.state.maxDate}
            total={this.state.total}
          />
        </main>
      </div>
    );
  }
}

