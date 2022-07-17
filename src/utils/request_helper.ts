import superagent from 'superagent';

import logger from './logger';

const get = async (url: string, headers: object = {}): Promise<any> => new Promise((resolve, reject) => {
    superagent.get(url)
        .set(headers)
        .retry(2)
        .then((response) => {
            logger.debug(`XRAY: Request API succeeded with statusCode ${response.statusCode} for GET method`);
            try {
                resolve(JSON.parse(response.text));
            } catch {
                resolve(response.text);
            }
        })
        .catch((error) => {
            const errorMessage = (error.statusCode || error.status) ? `statusCode ${error.statusCode || error.status}` : `errorCode ${error.code}`
            reject(`XRAY: Request API failed with ${errorMessage} for GET method`);
        });
});

const post = async (url: string, body: object | string, headers: object = {}): Promise<any> => new Promise((resolve, reject) => {
    superagent.post(url)
        .set(headers)
        .send(body)
        .retry(2)
        .then((response) => {
            logger.debug(`XRAY: Request API succeeded with statusCode ${response.statusCode} for POST method`);
            try {
                resolve(JSON.parse(response.body));
            } catch {
                resolve(response.body);
            }
        })
        .catch((error) => {
            const errorMessage = (error.statusCode || error.status) ? `statusCode ${error.statusCode || error.status}` : `errorCode ${error.code}`
            reject(`XRAY: Request API failed with ${errorMessage} for POST method`);
        });
});

const put = async (url: string, body: object | string = {}, headers: object = {}): Promise<any> => new Promise((resolve, reject) => {
    superagent.put(url)
        .set(headers)
        .send(body)
        .retry(2)
        .then((response) => {
            logger.debug(`XRAY: Request API succeeded with statusCode ${response.statusCode} for PUT method`);
            try {
                resolve(JSON.parse(response.text));
            } catch {
                resolve(response.text);
            }
        })
        .catch((error) => {
            const errorMessage = (error.statusCode || error.status) ? `statusCode ${error.statusCode || error.status}` : `errorCode ${error.code}`
            reject(`XRAY: Request API failed with ${errorMessage} for PUT method`);
        });
});

export const requestHelper = { get, post, put };