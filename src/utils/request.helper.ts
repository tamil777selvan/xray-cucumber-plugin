import axios from 'axios';
import axiosRetry from 'axios-retry';

import logger from './logger';

axiosRetry(axios, { retries: 2 });

const get = async (url: string, headers = {}) => {
    try {
        const response = await axios.get(url, { headers });
        logger.debug(`XRAY: Request API succeeded with statusCode ${response.status} for GET method`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response ? `statusCode ${error.response.status}` : `errorCode ${error.code}`;
        throw new Error(`XRAY: Request API failed with ${errorMessage} for GET method`);
    }
};

const post = async (url: string, body: any, headers = {}) => {
    try {
        const response = await axios.post(url, body, { headers });
        logger.debug(`XRAY: Request API succeeded with statusCode ${response.status} for POST method`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response ? `statusCode ${error.response.status}` : `errorCode ${error.code}`;
        throw new Error(`XRAY: Request API failed with ${errorMessage} for POST method`);
    }
};

const put = async (url: string, body = {}, headers = {}) => {
    try {
        const response = await axios.put(url, body, { headers });
        logger.debug(`XRAY: Request API succeeded with statusCode ${response.status} for PUT method`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response ? `statusCode ${error.response.status}` : `errorCode ${error.code}`;
        throw new Error(`XRAY: Request API failed with ${errorMessage} for PUT method`);
    }
};

export const requestHelper = { get, post, put };
