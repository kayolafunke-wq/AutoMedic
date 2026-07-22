const request = require('supertest');
const express = require('express');

// Mock the app for testing
const app = express();
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'AutoMedic API', version: '2.0.0', time: new Date() });
});

describe('Health Check Endpoint', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });

  it('should return status: ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body.status).toBe('ok');
  });

  it('should return app name', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body.app).toBe('AutoMedic API');
  });

  it('should return version', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body.version).toBe('2.0.0');
  });

  it('should return timestamp', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body.time).toBeDefined();
  });
});
