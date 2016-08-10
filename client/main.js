import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import TyrionPage from '../imports/ui/TyrionPage.jsx';

Meteor.startup(() => {
  render(<TyrionPage />, document.getElementById('main'));
});

