import axios from 'axios';
import axiosRetry from 'axios-retry';
import logger from 'src/utils/logger.js';

// Configure Axios to retry failed requests up to 2 times
axiosRetry(axios, { retries: 2 });

/**
 * Sends an HTTP request using Axios.
 *
 * @param {string} method - The HTTP request method (e.g., 'GET', 'POST', 'PUT').
 * @param {string} url - The URL to send the request to.
 * @param {any} data - The request body data (null for GET requests).
 * @param {object} headers - The headers to include in the request.
 * @returns {Promise<any>} A Promise that resolves with the response data.
 * @throws {Error} If the request fails, an error is thrown.
 */
const sendRequest = async (method: string, url: string, data: any, headers: object = {}): Promise<any> => {
    try {
        const response = await axios({
            method,
            url,
            data,
            headers
        });

        logger.debug(`XRAY: Request API succeeded with statusCode ${response.status} for ${method} method`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response ? `statusCode ${error.response.status}` : `errorCode ${error.code}`;
        throw new Error(`XRAY: Request API failed with ${errorMessage} for ${method} method`);
    }
};

/**
 * Helper object for making HTTP requests using Axios.
 */
export const requestHelper = {
    /**
	 * Sends an HTTP GET request.
	 *
	 * @param {string} url - The URL to send the GET request to.
	 * @param {object} headers - The headers to include in the request.
	 * @returns {Promise<any>} A Promise that resolves with the response data.
	 * @throws {Error} If the request fails, an error is thrown.
	 */
    get: async (url: string, headers: object): Promise<any> => sendRequest('GET', url, null, headers),

    /**
	 * Sends an HTTP POST request.
	 *
	 * @param {string} url - The URL to send the POST request to.
	 * @param {any} body - The request body data.
	 * @param {object} headers - The headers to include in the request.
	 * @returns {Promise<any>} A Promise that resolves with the response data.
	 * @throws {Error} If the request fails, an error is thrown.
	 */
    post: async (url: string, body: any, headers: object): Promise<any> => sendRequest('POST', url, body, headers),

    /**
	 * Sends an HTTP PUT request.
	 *
	 * @param {string} url - The URL to send the PUT request to.
	 * @param {any} body - The request body data.
	 * @param {object} headers - The headers to include in the request.
	 * @returns {Promise<any>} A Promise that resolves with the response data.
	 * @throws {Error} If the request fails, an error is thrown.
	 */
    put: async (url: string, body: any, headers: object): Promise<any> => sendRequest('PUT', url, body, headers)
};
