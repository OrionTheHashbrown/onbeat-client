/**
 * TEST SETUP – tests/register.mjs
 *
 * REFERENCE FROM
 * https://nodejs.org/api/module.html#moduleregisterhooksoptions
 */

import { registerHooks } from 'node:module';
import { resolve } from './ts-resolve.mjs';

registerHooks({ resolve });