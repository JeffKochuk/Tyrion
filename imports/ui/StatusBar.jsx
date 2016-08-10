import React, { Component } from 'react';

export default class StatusBar extends Component {

    render () {
        let loading = this.props.loading || this.props.current < this.props.total;
        let percent = `${Math.round(100 * this.props.current / this.props.total)}%`;
        const loadingBar = loading
            ? this.props.loading
                ? (<div className="indeterminate"></div>)
                : (<div className="determinate" style={{ width: percent }}></div>)
            : null ;
        return (
        <div className="row" style={{ margin: '0' }}>
            <div className="progress col s8" style={{ backgroundColor: loading ? '#CAA' : 'transparent' }}>
                {loadingBar}
            </div>
            <div className="white-text col s4 right-align">
                {this.props.current < this.props.total ? `${this.props.current} / ${this.props.total || '0'}` : this.props.current}
            </div>
        </div>
    )}

}