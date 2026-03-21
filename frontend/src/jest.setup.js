// src/jest.setup.js
import '@testing-library/jest-dom';

// Polyfill Node 22+ globals before anything else
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Optional: if react-router-dom needs crypto
import crypto from 'crypto';
global.crypto = crypto.webcrypto;