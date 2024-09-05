# Meaningful Bites Data Explorer

## Overview

The Meaningful Bites Data Explorer is a web-based tool designed to visualize and explore data from the Meaningful Bites project. It provides an interactive interface to view, search, and sort data from multiple tables defined in our data schema.

## Features

- Dynamic loading of table schemas from a SCHEMA.md file
- CSV data loading from specified GitHub repository
- Interactive data table with search and sort functionality
- Responsive design using Tailwind CSS and custom UI components

## How It Works

1. **Schema Loading**: On initial load, the Data Explorer fetches the `SCHEMA.md` file from the [Meaningful-Bites/data](https://github.com/Meaningful-Bites/data) repository. This file defines the structure of our data tables.

2. **Data Fetching**: When a user selects a table, the Explorer fetches the corresponding CSV file from the `public_data/snapshots/latest/` directory in the data repository.

3. **Dynamic Updates**: The Explorer always fetches the latest version of the schema and data files, ensuring that users see the most up-to-date information without requiring updates to the Explorer itself.

## Data Updates

The data displayed in the Explorer is dynamically fetched from our [data repository](https://github.com/Meaningful-Bites/data). 

## Local Development

To run the Data Explorer locally:

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The Data Explorer is currently deployed using GitHub Pages. Any changes pushed to the main branch of this repository will trigger a new deployment.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Licensing

The dataset is licensed under the [Creative Commons Attribution 4.0 International License](LICENSE-DATA).