// Fixed development credentials for the dedicated admin login only.
// Keep this file on the server; never send these values to the frontend.


import "dotenv/config";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const ADMIN_NAME = process.env.ADMIN_NAME;