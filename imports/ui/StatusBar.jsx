import React, { Component } from 'react';

export default class StatusBar extends Component {
    // @TODO change to: Loading... , Viewing page 1 of X (NNNNN total submissions)
    // Loading
    // Page
    // Current
    // Total
    render () {
        const totalPages = Math.ceil(this.props.total / 1000);
        let statusPhrase;
        if (this.props.total ) {
            statusPhrase = `Viewing page ${this.props.page} of ${totalPages} (${this.props.total} total submissions)`;
        } else if (this.props.loading) {
            statusPhrase = 'Loading...';
        } else {
            statusPhrase = 'Waiting for data...';
        }
        const loadingBar = this.props.loading
                ? (<div className="indeterminate"></div>)
                : null ;
        return (
        <div className="row" style={{ margin: '0' }}>
            <div className="progress col s12 l6" style={{ backgroundColor: this.props.loading ? '#CAA' : 'transparent' }}>
                {loadingBar}
            </div>
            <div className="white-text col s12 l6 right-align">
                {statusPhrase}
            </div>
        </div>
    )}

}