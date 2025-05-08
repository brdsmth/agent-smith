import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import './index.css';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve static files from the client build
app.use(express.static(resolve(__dirname, '../dist/client')));

// Handle all routes
app.get('*', (req, res) => {
  const html = ReactDOMServer.renderToString(
    <StaticRouter location={req.url}>
      <App />
    </StaticRouter>
  );

  // Read the template
  const template = fs.readFileSync(
    resolve(__dirname, '../dist/client/index.html'),
    'utf-8'
  );

  // Inject the rendered app into the template
  const finalHtml = template.replace(
    '<div id="root"></div>',
    `<div id="root">${html}</div>`
  );

  res.send(finalHtml);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 