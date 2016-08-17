import {Meteor} from 'meteor/meteor';
import { Submissions, Logs } from '../imports/collections.js';
import fetch from 'node-fetch';
import { Restivus } from 'meteor/nimble:restivus';

Meteor.startup(() => {
    Submissions._ensureIndex({ formID: 1, submittedAt: 1 });
});

// Publish feedback from the last month
Meteor.publish('submissions', (formStatus) => {
    let { formID, minDate, maxDate } = formStatus;
    let query = { formID };
    let time = {};
    if (minDate) {
        time['$gte'] = minDate;
    }
    if (maxDate) {
        time['$lte'] = maxDate;
    }
    if (minDate || maxDate) {
        query = Object.assign(query, { submittedAt: time });
    }
    return Submissions.find(query);
});

// Use this to get a formID from a form name
const formsURI = 'https://secure.p01.eloqua.com/api/rest/2.0/assets/forms';

// Use this to get form data from a form ID
const formDataURI = 'https://secure.p01.eloqua.com/api/rest/2.0/data/form/';

// Use this to get form schema froma  form ID
const formSchemaURI = 'https://secure.p01.eloqua.com/api/rest/2.0/assets/form/';

// Pass these options to get data from Eloqua
const EloquaOptions = {
    headers: {
        authorization: process.env.AUTHORIZATION,
    },
};

Meteor.methods({
    
    logDownload: (stats) => {
        stats.type = 'download';
        stats.date = new Date();
        Logs.insert(stats);
    },
    /////////
    // Search Eloqua For Forms
    // Return a list of found forms with ids and names
    searchFormsByName: (name) => {
        Logs.insert({ name, type: 'searchForForms', date: new Date() });
        console.log(`searchFormsByName: ${name}`);
        return fetch(`${formsURI}?search=*${name}*`, EloquaOptions)
            .then(res => res.json())
            .catch(() => {
                throw new Meteor.Error('URI Endpoint did not return JSON. Are you authorized?')
            })
            .then(body => {
                if (parseInt(body.total, 10)) {
                    const toReturn = body.elements.map((element) => ({ id: element.id, name: element.name }));
                    // If we need more pages, concat those pages into our return array
                    if (parseInt(body.total) > 1000) {
                        const pages = [];
                        for (let i = 2; i < body.total / 1000; i++) {
                            pages.push(
                                fetch(`${formsURI}?search=*${name}*&page=${i}`, EloquaOptions)
                                    .then(res => res.json())
                                    .then(body => body.elements.map((element) => ({
                                        id: element.id,
                                        name: element.name
                                    })))
                            );
                        }
                        const results = Promise.all(pages).await();
                        for (let i of results) {
                            toReturn.concat(i);
                        }
                    }

                    return toReturn
                } else throw new Meteor.Error('No forms found. Try using an ID.');
            }).await();
    },

    ///////////
    // Given an ID, Search Eloqua for:
    //     1) The form Schema (and return it as an object)
    //     2) Insert the initial data into the collection
    //
    getSchemaAndFirstData: (input) => {
        console.log(input);
        // First, confirm that the form exists
        // formDataURI:
        //     elements: [
        //         id: 'NNNN'
        //         htmlName: 'SSSS'
        //         name: 'SSSS'
        let { formID, minDate, maxDate } = input;
        input.type = 'formData';
        input.date = new Date();
        Logs.insert(input);
        minDate = minDate ? minDate.valueOf() / 1000 : undefined;
        maxDate = maxDate ? maxDate.valueOf() / 1000 : undefined;

        const rawSchema = fetch(`${formSchemaURI}${formID}`, EloquaOptions)
            .then(res => res.json())
            .catch(err => {
                throw new Meteor.Error('Form could not be found in Eloqua');
            })
            .await();
        // Make sure Eloqua gave us a proper form schema
        if (rawSchema.type !== 'Form') {
            console.log(JSON.stringify(rawSchema));
            throw new Meteor.Error('Form could not be processed');
        }



        // Start the form data
        // elements: [
        //     type: FormData
        //     id: 'NNNNNNN'
        //     fieldValues: [
        //         { type: FieldValue
        //           id: 'NNNNNNN'}
        const { total } = Meteor.call('pollingRefreshData', { formID, maxDate, minDate });
        console.log(total);
        // Build the schema
        const schema = {};
        for (let element of rawSchema.elements) {
            schema[element.id] = element.name;
        }
        return { schema, name: rawSchema.name, formID, maxDate, minDate, total };
    },

    ////////
    // Get the newest data for formID.
    // ASSUMPTION: data is inserted at the end
    // returns the total field from eloqua
    pollingRefreshData: (input) => {
        console.log('PollingRefreshData');
        console.log(input);
        let { formID, minDate, maxDate } = input;
        let query = `${formDataURI}${formID}?`;
        if (minDate) {
            console.log('got minDate ' + minDate);
            query = `${query}&startAt=${minDate}`;
        }
        if (maxDate) {
            console.log('got maxDate ' + maxDate);
            query = `${query}&endAt=${maxDate}`;
        }
        const insertDataFunc = getInsertFormDataFunc(formID);
        return fetch(query, EloquaOptions)
            .then(res => res.json())
            .then(body => {
                Logs.insert({ query, date: new Date(), type: 'eloqua' });
                if (!body.elements) {
                    console.log(JSON.stringify(body));
                    throw new Meteor.Error('Eloqua Communication Failed');
                }
                setTimeout(() => body.elements.forEach(insertDataFunc), 0);
                const numPagesToGet = parseInt(body.total, 10) / parseInt(body.pageSize, 10);
                if (numPagesToGet > 1) {
                    const pagesArray = [];
                    for (let i = 1; i < numPagesToGet; i++) {
                        pagesArray.push(
                            fetch(`${query}&page=${i + 1}`, EloquaOptions)
                                .then(res => res.json())
                                .then(body => body.elements.forEach(insertDataFunc))
                        );
                        Logs.insert({ query: `${query}&page=${i + 1}`,  date: new Date(), type: 'eloqua' });                    }
                    Promise.all(pagesArray);
                }
                return { total: body.total };
            }).await();
    }
});

const getInsertFormDataFunc = Meteor.bindEnvironment(
    (formID) => {
        return Meteor.bindEnvironment((element) => {
            const obj = { formID, submittedAt: parseInt(element.submittedAt, 10) };
            for (let valueObj of element.fieldValues) {
                obj[valueObj.id] = valueObj.value;
            }
            //console.log(`Inserting Object: ${JSON.stringify(obj)}`);
            Submissions.upsert(obj, obj);
        });
    }
);


/////////////
//
// Rest API starts here
//
/////////////
const RESTAPI = new Restivus({
    apiPath: 'ws',
    defaultHeaders: {
        'Content-Type': 'application/json'
    },
    prettyJson: true,
});
//http:/...com/ws/eloquaCallsInLastNDays/:days
RESTAPI.addRoute('eloquaCallsInLastNDays/:days',{
    get: function () {
        let startDate = new Date();// Current Date
        const days = this.urlParams.days;
        startDate.setDate(startDate.getDate() - days); // Subtract N Days
        startDate.setHours(0);  // Set the hour, minute and second components to 0
        startDate.setMinutes(0);
        startDate.setSeconds(0);
        const count = Logs.find({type: 'eloqua', date: {$gte: startDate } }).map((doc) => Math.ceil(doc.numPagesToGet)).reduce((a, b) => a + b, 0);
        return { days, count };
    }
});

// Get a report of contacts looked up
RESTAPI.addRoute('usageReport', {
    get: function () {
        const oneDay = new Date();// Current Date
        oneDay.setDate(oneDay.getDate() - 1); // Subtract N Days
        const sevenDays = new Date();// Current Date
        sevenDays.setDate(sevenDays.getDate() - 7); // Subtract N Days
        const fourteenDays = new Date();// Current Date
        fourteenDays.setDate(fourteenDays.getDate() - 14); // Subtract N Days
        const thirtyDays = new Date();// Current Date
        thirtyDays.setDate(thirtyDays.getDate() - 30); // Subtract N Days
        const threeSixtyFiveDays = new Date();// Current Date
        threeSixtyFiveDays.setDate(thirtyDays.getDate() - 365); // Subtract N Days

        return {
            formLookups: {
                lastDay: Logs.find({ type: 'searchForForms', date: {$gte: oneDay } }).count(),
                lastWeek: Logs.find({ type: 'searchForForms', date: {$gte: sevenDays } }).count(),
                lastTwoWeeks: Logs.find({ type: 'searchForForms', date: {$gte: fourteenDays } }).count(),
                lastMonth: Logs.find({ type: 'searchForForms', date: {$gte: thirtyDays } }).count(),
                lastYear: Logs.find({ type: 'searchForForms', date: {$gte: threeSixtyFiveDays } }).count()
            },
            formDataLookups: {
                lastDay: Logs.find({ type: 'formData', date: {$gte: oneDay } }).count(),
                lastWeek: Logs.find({ type: 'formData', date: {$gte: sevenDays } }).count(),
                lastTwoWeeks: Logs.find({ type: 'formData', date: {$gte: fourteenDays } }).count(),
                lastMonth: Logs.find({ type: 'formData', date: {$gte: thirtyDays } }).count(),
                lastYear: Logs.find({ type: 'formData', date: {$gte: threeSixtyFiveDays } }).count()
            },
            downloads: {
                lastDay: Logs.find({ type: 'download', date: {$gte: oneDay } }).count(),
                lastWeek: Logs.find({ type: 'download', date: {$gte: sevenDays } }).count(),
                lastTwoWeeks: Logs.find({ type: 'download', date: {$gte: fourteenDays } }).count(),
                lastMonth: Logs.find({ type: 'download', date: {$gte: thirtyDays } }).count(),
                lastYear: Logs.find({ type: 'download', date: {$gte: threeSixtyFiveDays } }).count()
            }
        }
    }
});





