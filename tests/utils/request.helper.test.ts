import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';

import { requestHelper } from '../../src/utils/request.helper.js';

vi.mock('axios');

describe('requestHelper', () => {
	beforeEach(() => {
		vi.mocked(axios).mockClear();
	});

	describe('get', () => {
		it('should send an HTTP GET request with provided URL and headers', async () => {
			const url = 'https://example.com/api';
			const headers = { Authorization: 'Bearer token' };

			vi.mocked(axios).mockResolvedValue({ data: 'Response data' });

			const response = await requestHelper.get(url, headers);

			expect(axios).toHaveBeenCalledWith({
				method: 'GET',
				url,
				data: null,
				headers
			});

			expect(response).toEqual('Response data');
		});

		it('should throw an error if the GET request fails', async () => {
			const url = 'https://example.com/api';
			const headers = { Authorization: 'Bearer token' };

			vi.mocked(axios).mockRejectedValue({ response: { status: 404 } });

			await expect(requestHelper.get(url, headers)).rejects.toThrowError(new Error('XRAY: Request API failed with statusCode 404 for GET method'));
		});
	});

	describe('post', () => {
		it('should send an HTTP POST request with provided URL, body, and headers', async () => {
			const url = 'https://example.com/api';
			const body = { key: 'value' };
			const headers = { Authorization: 'Bearer token' };

			vi.mocked(axios).mockResolvedValue({ data: 'Response data' });

			const response = await requestHelper.post(url, body, headers);

			expect(axios).toHaveBeenCalledWith({
				method: 'POST',
				url,
				data: body,
				headers
			});

			expect(response).toEqual('Response data');
		});

		it('should throw an error if the POST request fails', async () => {
			const url = 'https://example.com/api';
			const body = { key: 'value' };
			const headers = { Authorization: 'Bearer token' };

			vi.mocked(axios).mockRejectedValue({ response: { status: 500 } });

			await expect(requestHelper.post(url, body, headers)).rejects.toThrowError(
				new Error('XRAY: Request API failed with statusCode 500 for POST method')
			);
		});
	});

	describe('put', () => {
		it('should send an HTTP PUT request with provided URL, body, and headers', async () => {
			const url = 'https://example.com/api';
			const body = { key: 'value' };
			const headers = { Authorization: 'Bearer token' };

			vi.mocked(axios).mockResolvedValue({ data: 'Response data' });

			const response = await requestHelper.put(url, body, headers);

			expect(axios).toHaveBeenCalledWith({
				method: 'PUT',
				url,
				data: body,
				headers
			});

			expect(response).toEqual('Response data');
		});

		it('should throw an error if the PUT request fails', async () => {
			const url = 'https://example.com/api';
			const body = { key: 'value' };
			const headers = { Authorization: 'Bearer token' };

			vi.mocked(axios).mockRejectedValue({ code: 403 });

			await expect(requestHelper.put(url, body, headers)).rejects.toThrowError(new Error('XRAY: Request API failed with errorCode 403 for PUT method'));
		});
	});
});
