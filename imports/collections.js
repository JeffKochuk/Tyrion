/**
 * Created by jkochuk on 6/15/16.
 */

import { Mongo } from 'meteor/mongo';

export const Submissions = new Mongo.Collection('submissions');

export const Logs = new Mongo.Collection('logs');