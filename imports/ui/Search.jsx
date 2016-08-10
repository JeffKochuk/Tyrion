import React from 'react';

export default class Search extends React.Component {
  constructor(){
    super();
    if (new RegExp('(dev)|(localhost)').test(window.location.href)) {
      this.searchElements = [
        { text: 'Sherlock - Lead Investigation by Shared List', link: 'https://sherlockdev-marketingdev.itos.redhat.com/sharedlist'},
        { text: 'Sherlock - Lead Investigation by Email', link: 'https://sherlockdev-marketingdev.itos.redhat.com/email'},
        { text: 'Sherlock - Lead Investigation by PathCodes', link: 'https://sherlockdev-marketingdev.itos.redhat.com/codes'},
        { text: 'Columbo - Eloqua Contact Email Validation', link: 'https://columbodev-marketingdev.itos.redhat.com'},
        { text: 'Workflows - Marketing Service Portal', link: 'https://workflows-marketing.itos.redhat.com'},
        { text: 'Workbench - Self-Service Marketing Tools', link: 'https://workbenchlandingdev-marketingdev.itos.redhat.com'},
        { text: 'Leia - Find Contacts in Shared List', link: 'https://leiadev-marketingdev.itos.redhat.com'},
        { text: 'Tyrion - Poll Eloqua Form Data', link: 'https://tyriondev-marketingdev.itos.redhat.com'}
      ];
    } else {
      this.searchElements = [
        {text: 'Sherlock - Lead Investigation by Shared List', link: 'https://sherlock-marketing.itos.redhat.com/sharedlist'},
        {text: 'Sherlock - Lead Investigation by Email', link: 'https://sherlock-marketing.itos.redhat.com/email'},
        {text: 'Sherlock - Lead Investigation by PathCodes', link: 'https://sherlock-marketing.itos.redhat.com/codes'},
        {text: 'Columbo - Eloqua Contact Email Validation', link: 'https://columbo-marketing.itos.redhat.com'},
        {text: 'Workflows - Marketing Service Portal', link: 'https://workflows-marketing.itos.redhat.com'},
        {text: 'Workbench - Self-Service Marketing Tools', link: 'https://workbench-marketing.itos.redhat.com'},
        {text: 'Leia - Find Contacts in Shared List', link: 'https://leia-marketing.itos.redhat.com'},
        {text: 'Tyrion - Poll Eloqua Form Data', link: 'https://tyrion-marketing.itos.redhat.com'}
      ];
    }
    this.state = { results: [] };
    this.handleChange = this.handleChange.bind(this);
    this.returnResults = this.returnResults.bind(this);
  }

  componentDidMount(){
    $("#searchDropdown").dropdown({
      inDuration: 30,
      outDuration: 20,
      hover: true, // Activate on hover
      belowOrigin: true, // Displays dropdown below the button
      alignment: 'left', // Displays dropdown with edge aligned to the left of button
      gutter: 100
    });
  }

  handleChange(){
    let searchVal = $('#headerSearch')[0].value;
    console.log(searchVal);
    if(searchVal){
      let regex = new RegExp(searchVal, 'i');
      results = this.searchElements.filter((element) => regex.test(element.text));
      this.setState({ results });
    } else {
      this.setState({ results: [] });
    }
    //jquery dropdown initialization
    this.forceUpdate();
  }

  mapResults(element, index){
    return(
        <li key={index}><a href={element.link} className="collection-item">{element.text}</a></li>
    )
  }

  //onBlur deactivate. Emit event 'close'
  closeDropdown(){

    $('#searchDropdownButton').trigger('close');
  }

  //onFocus activate. Emit event 'open'
  openDropdown(){
    $('#searchDropdownButton').trigger('open');
  }

  returnResults(){
    return (
        <ul id='searchDropdown' className='dropdown-content'>
          { this.state.results.map(this.mapResults)}
        </ul>
    );
  }

  render(){
    return(
        <div className="input-field makeHeaderSearchWider">

          <i className="material-icons prefix white-text" >search</i>
          <input id="headerSearch"
                 className="headerSearch"
                 placeholder="Search Workbench..."
                 type="search"
                 onChange={this.handleChange}
                 onFocus={this.openDropdown}
                 onBlur={this.closeDropdown}
          />
          <a id="searchDropdownButton"
             className="dropdown-button"
             href='#'
             data-activates='searchDropdown'
             data-constrainwidth="false"
             data-alignment="left"
             data-belowOrigin="false"
             data-gutter="45"
          > </a>
          {this.state.results ? this.returnResults() : null}
        </div>
    );
  }
}