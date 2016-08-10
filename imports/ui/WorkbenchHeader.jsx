import React from 'react';
import Search from './Search.jsx';

export default function WorkbenchHeader() {
    return (
        <header>
            <div className="row">
                <div className="col s3">
                    <a href={new RegExp('(dev)|(localhost)').test(window.location.href)
          ? "http://workbenchlandingdev-marketingdev.itos.redhat.com"
          : "https://workbench-marketing.itos.redhat.com"}><img src="/images/updated_ rh-logo.png"/></a>
                    <img src="/images/beta.png" className="beta"/>
                </div>
                <div className="col s3 offset-s5">
                    <Search />
                </div>
                <div className="col s1 right-align">
                    <a className="dropdown-button" href='#' data-activates='headerMenuDropdown'
                       data-constrainwidth="false" data-alignment="right" data-belowOrigin="true"><img
                        className="sandwich" src="images/updated_menu-sandwich.png"/> </a>
                    {new RegExp('(dev)|(localhost)').test(window.location.href) ? (
                        <ul id='headerMenuDropdown' className='dropdown-content'>
                            <li><a href="http://sherlockdev-marketingdev.itos.redhat.com">Sherlock</a></li>
                            <li><a href="http://columbodev-marketingdev.itos.redhat.com">Columbo</a></li>
                            <li><a href="http://leiadev-marketingdev.itos.redhat.com">Leia</a></li>
                            <li><a href="http://tyriondev-marketingdev.itos.redhat.com">Tyrion</a></li>
                            <li className="divider"></li>
                            <li><a href="http://workbenchlandingdev-marketingdev.itos.redhat.com/feedback">Feedback</a></li>
                            <li><a href="http://workbenchlandingdev-marketingdev.itos.redhat.com/changelog">Changelog</a></li>
                            <li><a href="http://workbenchlandingdev-marketingdev.itos.redhat.com/reports">Reports</a></li>
                            <li className="divider"></li>
                            <li><a href="http://workflows-marketing.itos.redhat.com">Workflows</a></li>
                        </ul>
                    ) : (
                        <ul id='headerMenuDropdown' className='dropdown-content'>
                            <li><a href="http://sherlock-marketing.itos.redhat.com">Sherlock</a></li>
                            <li><a href="http://columbo-marketing.itos.redhat.com">Columbo</a></li>
                            <li><a href="http://leia-marketing.itos.redhat.com">Leia</a></li>
                            <li><a href="http://tyrion-marketing.itos.redhat.com">Tyrion</a></li>
                            <li className="divider"></li>
                            <li><a href="http://workbench-marketing.itos.redhat.com/feedback">Feedback</a></li>
                            <li><a href="http://workbench-marketing.itos.redhat.com/changelog">Change Log</a></li>
                            <li><a href="http://workbench-marketing.itos.redhat.com/reports">Reports</a></li>
                            <li className="divider"></li>
                            <li><a href="http://workflows-marketing.itos.redhat.com">Workflows</a></li>
                        </ul>
                    )}
                </div>
            </div>
        </header>
    );
}