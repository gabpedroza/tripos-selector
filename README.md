# Tripos Practice Selector

A simple, bare-bones web application to help you practice for Cambridge Tripos exams. It randomly selects questions from your `IB.json` file, helps you track your progress, and syncs that progress across devices using your own GitHub repository.

This project was created with a "no framework, no build tools" approach, so you can easily understand and modify the code in the `index.html`, `style.css`, and `script.js` files.

## How to Use

### 1. GitHub Setup (One-time only)

To sync your progress, the app needs a place to store it. You'll use a GitHub repository for this.

**a. Create a New Private Repository:**
   - Go to [github.com/new](https://github.com/new).
   - Give it a name, for example, `tripos-data`.
   - Select **Private**. This is important to keep your access token secure.
   - You don't need to add a README, .gitignore, or license.
   - Click "Create repository".
   - Create a file, commit, delete the file, and commit again. This is to prevent an annoying bug.

**b. Create a Personal Access Token (PAT):**
   - This token acts as a password for the app to access your repository.
   - Go to your GitHub **Settings** > **Developer settings** > **Personal access tokens** > **Fine-grained tokens**.
   - Click **Generate new token**.
   - **Name:** Give it a descriptive name, like `tripos-app-token`.
   - **Expiration:** Choose a duration (e.g., 90 days). You'll need to generate a new one after it expires.
   - **Repository access:** Select **Only select repositories** and choose the `tripos-data` repository you just created.
   - **Permissions:**
     - In the list of permissions, find **Contents** and change its access from "No access" to **Read and write**.
   - Click **Generate token**.
   - **IMPORTANT:** Copy the token immediately and save it somewhere safe (like a password manager). You will not be able to see it again.

### 2. Deploying the Application with GitHub Pages

The easiest way to run this is to host the application files themselves on GitHub Pages.

**a. Create a Second Repository:**
   - This repository will hold the application code (`index.html`, `script.js`, etc.).
   - Create another new repository on GitHub, for example `tripos-practice-app`. It can be public or private.
   - **Do not use the same repository where you plan to store your progress.**

**b. Upload the Application Files:**
   - In your new `tripos-practice-app` repository, click **Add file** > **Upload files**.
   - Upload the `index.html`, `style.css`, `script.js`, and `IB.json` files.
   - Commit the files.

**c. Enable GitHub Pages:**
   - In the `tripos-practice-app` repository, go to **Settings** > **Pages**.
   - Under "Branch", select `main` (or `master`) and click **Save**.
   - After a minute or two, your application will be live at a URL like `https://<your-username>.github.io/tripos-practice-app/`.

### 3. Using the App

1.  **Open the App:** Go to the GitHub Pages URL for your `tripos-practice-app`.
2.  **Enter GitHub Details:**
    - **GitHub Repo:** Enter the name of your **private data repository** (e.g., `your-username/tripos-data`).
    - **Personal Access Token:** Paste the token you generated and saved.
3.  **Load Progress:** Click **Load Progress**. The app will connect to your repository and download your list of completed questions. If it's the first time, it will prepare to create a new progress file.
4.  **Generate Questions:**
    - Choose how many questions you want, filter by module/paper, and select a mode (random or homogeneous).
    - Click **Generate**.
5.  **Practice:**
    - The app will display the questions with links to CamCribs.
    - As you complete a question, **check the box** next to it.
6.  **Save Progress:**
    - When you're done with your session, click **Save Selected to GitHub**.
    - The app will save only the questions you checked to a `progress.json` file in your private `tripos-data` repository.

Your progress is now saved and can be loaded from any device where you can open a web browser!

## Local Development

If you want to make changes:
1.  Download the files (`index.html`, `style.css`, `script.js`, `IB.json`) to a folder on your computer.
2.  You may need to run a simple local server to avoid issues with fetching `IB.json`. If you have Python installed, you can run `python -m http.server` in the folder and then open `http://localhost:8000` in your browser.
3.  Edit the files, refresh the browser to see changes, and then upload them back to your `tripos-practice-app` repository to publish them.
