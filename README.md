
# EZ Dashboard - Full Stack Application

This project contains both a frontend application and a backend server. The backend serves the frontend files, so you only need to run one command.

## Running the Application

**Requirements:**
- [Node.js](https://nodejs.org/) (which includes npm) installed on your system.

**Instructions:**

1.  **Install Dependencies:**
    If you haven't already, open your terminal in the project's root directory and run the following command to install the necessary packages (`express` and `cors`):
    ```bash
    npm install
    ```

2.  **Start the Server:**
    After the installation is complete, start the server with this command:
    ```bash
    npm start
    ```
    You should see a message in your terminal: `Backend server is running on http://localhost:3001`.

3.  **Access the Application:**
    Open your web browser and navigate to the following URL:
    ```
    http://localhost:3001
    ```

The application will load, and all data communication will happen with the integrated backend server. Data is stored in the `db.json` file.
