import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Bert } from 'meteor/themeteorchef:bert';
import { createContainer } from 'meteor/react-meteor-data';
// import { Submissions } from '../collections.js';
import TyrionForm from'./TyrionForm.jsx';
import QuickTable from './QuickTable.jsx';
import Papa from 'papaparse';
import StatusBar from './StatusBar.jsx';

export default class TyrionTable extends Component {
  constructor () {
    super();
    this.state = { };
    this.onClick = this.onClick.bind(this);
    this.exportCSV = this.exportCSV.bind(this);
  }


  /////
  //Set the form to display the formID
  onClick (formID) {
    document.getElementById('formID-field').value = formID;
    let formState = { search: formID };
    if (document.getElementById('minDate-field').value) {
      formState.minDate = new Date(document.getElementById('minDate-field').value);
    }
    if (document.getElementById('maxDate-field').value) {
      formState.maxDate = new Date(document.getElementById('maxDate-field').value);
    }
    this.props.click(formState);
  }


  // Use papa.unParse to turn our array of records into a string
  exportCSV () {
    Meteor.call('logDownload', {
      email: document.getElementById('email-field').value,
      formID: document.getElementById('formID-field').value,
      minDate: document.getElementById('minDate-field').value,
      maxDate: document.getElementById('maxDate-field').value });
    const submissions = this.props.data.map((submission) => {
      const record = {id: submission.id};
      for (let x in this.props.schema) {
        record[this.props.schema[x]] = submission[x];
      }
      return record;
    });
    const blob = new Blob([Papa.unparse(submissions)], { type: "text/plain" });
    const a = window.document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = `${this.props.name}.csv`;
    $(a).attr("target", "_blank");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    $('#exportModal').closeModal();
  }

  componentDidMount () {
    $('.modal-trigger').leanModal();
  }

  openModal () {
    $('#exportModal').openModal();
  }

  render () {
    const getRefreshOrNextPageButton = () => {
      if (this.props.formID) {
        // If there is another page of data
        if (this.props.data.length === 1000 && (1000 * this.props.page) < this.props.total) {
          return (<button title="Next Page" className="btn-floating WBRedBackground waves-effect waves-light white-text" onClick={this.props.pollData}><i className="material-icons">skip_next</i></button>);
        } else {
          return (<button title="Refresh" className="btn-floating WBRedBackground waves-effect waves-light white-text" onClick={this.props.pollData}><i className="material-icons">autorenew</i></button>);
        }
      }
    }
    return (
      <div >
        <div className="row white-text">
          <TyrionForm handleSubmit={this.props.submit}/>
          <div className="col l1">
            {getRefreshOrNextPageButton()}
          </div>
          <div className="col l1">
            {this.props.data.length
              ? <button title="Download"className="btn-floating WBRedBackground waves-effect waves-light white-text modal-trigger" onClick={this.openModal}><i className="material-icons">file_download</i></button>
              : null}
          </div>
        </div>
        <StatusBar current={this.props.data.length} page={this.props.page} total={this.props.total} loading={this.props.loading} />
        <QuickTable schema={this.props.schema} data={this.props.data} clickFunc={this.props.data.length && !this.props.formID ? this.onClick : null} />
        <div id="exportModal" className="modal">
          <div className="modal-content">
            <h4>Export Form Data</h4>
            <p>But first give us your email...</p>
            <input
                id="email-field"
                type="text"
                placeholder="Enter Email..."/>
            <button className="btn WBRedBackground waves-effect waves-light white-text" onClick={this.exportCSV}>Export</button>
          </div>
        </div>
      </div>
    );
  }
}


// // Subscribe to the submissions of the formID passed to us.
// export default createContainer((props) => {
//   const { formID, minDate, maxDate } = props;
//   if(formID){
//     Meteor.subscribe('submissions', { formID, minDate, maxDate });
//   }
//   return {
//     submissions: props.formData || props.submissions || [],
//   };
//
// }, TyrionTable);


