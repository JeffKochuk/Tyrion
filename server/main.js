import {Meteor} from 'meteor/meteor';
import { Submissions, Logs } from '../imports/collections.js';
import fetch from 'node-fetch';
import { Restivus } from 'meteor/nimble:restivus';
import { Kadira } from 'meteor/meteorhacks:kadira';

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
    console.log( query );
    return Submissions.find(query, {limit: MAX_REQUESTS});
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
const FormSchema = { name: 'Form Name', id: 'Form ID'} ;

const MAX_REQUESTS = 5000;

Meteor.methods({
    logDownload: (stats) => {
        stats.type = 'download';
        stats.date = new Date();
        Logs.insert(stats);
    },

    // Return a form's schema and data if it is a form
    // otherwise return a list of possible forms to click on.
    handleSubmission: (formState) => { // @TODO Limit the number of pages
        console.log("HANDLE IT!");
        let { formID, minDate, maxDate } = formState;
        formState.type = 'formData';
        formState.date = new Date();
        Logs.insert(formState);
        minDate = minDate ? minDate.valueOf() / 1000 : null;
        maxDate = maxDate ? maxDate.valueOf() / 1000 : null;

        //See if the input is a real formID
        const formExists = fetch(`${formSchemaURI}${formID}`, EloquaOptions)
            .then(res => res.json())
            .catch(err => {
                return undefined; //throw new Meteor.Error('Form could not be found in Eloqua');
            });

        // If the input is not a formID, we'll return a list of Forms instead
        const searchForForms = fetch(`${formsURI}?search=*${formID}*`, EloquaOptions)
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
                        for (let i = 1; i < body.total / 1000 && i < (MAX_REQUIESTS / 1000); i++) {
                            pages.push(
                                fetch(`${formsURI}?search=*${name}*&page=${i+1}`, EloquaOptions)
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
                } else return undefined;
            });

        //If the form came back, get the data and return the schema
        const rawSchema = formExists.await();
        if (rawSchema && rawSchema.type === 'Form') { //Return form Schema and start form data
            const { total } = Meteor.call('pollingRefreshData', { formID, maxDate, minDate });
            console.log(total);
            // Build the schema
            const schema = {};
            for (let element of rawSchema.elements) {
                schema[element.id] = element.name;
            }
            return { schema, name: rawSchema.name, formID, maxDate, minDate, total };
        }
        // Otherwise, return the list of forms
        rawFormData = searchForForms.await();
        if (rawFormData) {
            return Object.assign(formState, { schema: FormSchema, formData: rawFormData, total: rawFormData.length });
        } else throw new Meteor.Error('No forms found. Try using an ID.');

    },

    // Return a form's schema and data if it is a form
    // otherwise return a list of possible forms to click on.
    handleSubmissionsNoMongo: (formState) => { // @TODO Limit the number of pages
        // Setup Logging and data
        console.log("handleSubmissionsNoMongo");
        logSubmissionData(formState);
        let { search, minDate, maxDate } = formState;
        minDate = minDate ? minDate.valueOf() / 1000 : null;
        maxDate = maxDate ? maxDate.valueOf() / 1000 : null;

        //See if the input is a real formID and use this for the schema
        const formExists = getRawSchema(search);

        // If the input is not a formID, we'll return a list of Forms instead
        const searchForForms = fetch(`${formsURI}?search=*${search}*`, EloquaOptions)
            .then(res => res.json())
            .catch(() => {
                throw new Meteor.Error('URI Endpoint did not return JSON. Are you authorized? Send a message to Marketing Ops to get this fixed')
            })
            .then(body => {
                if (parseInt(body.total, 10)) {
                    return body.elements.map((element) => ({ id: element.id, name: element.name }));
                } else return undefined;
            });

        // Build form data fetch
        let query = getFormDataQuery(formState);
        const formData = getFormData(query);

        //If the form came back, get the data and return the schema
        const rawSchema = formExists.await();
        if (rawSchema && rawSchema.type === 'Form') { //Return form Schema and start form data
            // Build the schema
            const schema = buildSchema(rawSchema);
            // If returning form data, return:
            // from rawSchema: schema, name
            // from rawData: Form Data, current, total,
            // fro submission: formID, minDate, maxDate,
            return Object.assign({
                schema,
                search,
                maxDate,
                minDate,
                formID: search,
                name: rawSchema.name,
                page: 1 }, formData.await());
        }
        // Otherwise, return the list of forms
        // Return a list of forms:
        // Form Schema
        // data, current, total
        rawFormData = searchForForms.await();
        if (rawFormData) {
            return Object.assign(formState, { schema: FormSchema, data: rawFormData, total: rawFormData.length });
        } else throw new Meteor.Error('No forms found. Try using an ID.');

    },

    /////
    // Call when you are refreshing or when you are clicking on an entry
    // { formID, minDate, maxDate, page }
    GetFormData: (formState) => {
        logSubmissionData(formState);
        // Build form data fetch query
        const returnData = getFormData(getFormDataQuery(formState)).await();
        returnData.page = formState.page;
        // If the total hasn't changed and we're looking at the last page...
        if (returnData.total === formState.total && (1000 * (formState.page - 1)) + formState.current === returnData.total) {
            returnData.data = null;
        }
        return returnData;
    },

    /////
    // Call when you click on a searched form
    // { formID, minDate, maxDate }
    GetFormDataAndSchema: (formState) => {
        logSubmissionData({ ...formState });
        const formData = getFormData(getFormDataQuery(formState));
        const rawSchema = getRawSchema(formState.search).await();
        const schema = buildSchema(rawSchema);
        return Object.assign({ schema, name: rawSchema.name, formID: formState.search }, formData.await(), formState );
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
                    for (let i = 1; i < numPagesToGet && i < MAX_REQUESTS; i++) {
                        pagesArray.push(
                            fetch(`${query}&page=${i + 1}`, EloquaOptions)
                                .then(res => res.json())
                                .then(body => body.elements.forEach(insertDataFunc))
                        );
                        Logs.insert({ query: `${query}&page=${i + 1}`,  date: new Date(), type: 'eloqua' });                    }
                    Promise.all(pagesArray);
                }
                return { total: body.total < MAX_REQUESTS ? body.total : MAX_REQUESTS };
            }).await();
    }
});

const buildSchema = (rawSchema) => {
    const schema = {submittedAt: 'Submitted'};
    for (let element of rawSchema.elements) {
        if (element.name !== 'Submit') {
            schema[element.id] = element.name;
        }
        schema.submittedAt = 'Submit';
    }
    return schema;
};

// const getInsertFormDataFunc = Meteor.bindEnvironment(
//     (formID) => {
//         return Meteor.bindEnvironment((element) => {
//             const obj = { formID, submittedAt: parseInt(element.submittedAt, 10) };
//             for (let valueObj of element.fieldValues) {
//                 obj[valueObj.id] = valueObj.value;
//             }
//             //console.log(`Inserting Object: ${JSON.stringify(obj)}`);
//             Submissions.upsert(obj, obj);
//         });
//     }
// );

const logSubmissionData = Meteor.bindEnvironment((formState) => {
    formState.type = 'formData';
    formState.date = new Date();
    Logs.insert(formState);
});

const getRawSchema = Meteor.bindEnvironment((search) => fetch(`${formSchemaURI}${search}`, EloquaOptions)
    .then(res => res.json())
    .catch(err => {
        return undefined; //throw new Meteor.Error('Form could not be found in Eloqua');
    })
);

const getFormDataQuery = (formState) => {
    let { search, minDate, maxDate, page } = formState;
    minDate = minDate ? minDate.valueOf() / 1000 : null;
    maxDate = maxDate ? maxDate.valueOf() / 1000 : null;
    let query = `${formDataURI}${search}?`;
    if (minDate) {
        query = `${query}&startAt=${minDate}`;
    }
    if (maxDate) {
        query = `${query}&endAt=${maxDate}`;
    }
    if (page > 1) {
        query = `${query}&page=${page}`;
    }
    return query;
};

const getFormData = Meteor.bindEnvironment((query) => {
    return fetch(query, EloquaOptions)
            .then(res => res.json())
            .then(body => {
                Logs.insert({ query, date: new Date(), type: 'eloqua' });
                if (!body.elements) {
                    console.log(JSON.stringify(body));
                    throw new Meteor.Error('Eloqua Communication Failed');
                }
                return {
                    total: body.total,
                    data: body.elements.map(element => {
                        const obj = { id: element.id, submittedAt: new Date(element.submittedAt * 1000).toUTCString() };
                        for (let valueObj of element.fieldValues) {
                            obj[valueObj.id] = valueObj.value;
                        }
                        return obj;
                    })
                }
            })
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

// Kadira
Kadira.connect('vm2jwCPPKvNojNTix', '056bf6d8-1305-4a10-b21d-eb51a5168e8a');



