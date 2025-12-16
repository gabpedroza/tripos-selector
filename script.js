// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const githubRepoInput = document.getElementById('github-repo');
    const githubPatInput = document.getElementById('github-pat');
    const loadProgressBtn = document.getElementById('load-progress-btn');
    const saveProgressBtn = document.getElementById('save-progress-btn');
    const syncStatus = document.getElementById('sync-status');

    const numQuestionsInput = document.getElementById('num-questions');
    const moduleFilter = document.getElementById('module-filter');
    const paperFilter = document.getElementById('paper-filter');
    const modeRandom = document.getElementById('mode-random');
    const generateBtn = document.getElementById('generate-btn');

    const resultsList = document.getElementById('results-list');
    const resultsPlaceholder = document.getElementById('results-placeholder');

    // --- State ---
    let allQuestionsData = null;
    let masterDoneList = new Set();
    let sessionDoneList = new Set();
    let githubFileSha = null;
    const progressFilePath = 'progress.json';

    // --- Initialization ---
    loadLocalConfig();
    fetchQuestionData();

    // --- Event Listeners ---
    loadProgressBtn.addEventListener('click', loadProgressFromGithub);
    saveProgressBtn.addEventListener('click', saveProgressToGithub);
    generateBtn.addEventListener('click', generateQuestions);
    moduleFilter.addEventListener('change', populatePaperFilter);
    resultsList.addEventListener('change', handleResultCheckboxChange);


    // --- Functions ---

    /**
     * Loads GitHub config from localStorage.
     */
    function loadLocalConfig() {
        const repo = localStorage.getItem('githubRepo');
        const pat = localStorage.getItem('githubPat');
        if (repo) githubRepoInput.value = repo;
        if (pat) githubPatInput.value = pat;
    }

    /**
     * Fetches the main IB.json data file and populates filters.
     */
    async function fetchQuestionData() {
        try {
            const response = await fetch('IB.json');
            if (!response.ok) throw new Error('IB.json not found.');
            allQuestionsData = await response.json();
            populateModuleFilter();
        } catch (error) {
            updateSyncStatus(`Error: ${error.message}. Make sure IB.json is in the same directory.`, true);
        }
    }

    /**
     * Populates the module filter dropdown from the fetched data.
     */
    function populateModuleFilter() {
        if (!allQuestionsData) return;
        const modules = Object.keys(allQuestionsData.michaelmas);
        modules.forEach(module => {
            const option = document.createElement('option');
            option.value = module;
            option.textContent = module;
            moduleFilter.appendChild(option);
        });
        populatePaperFilter();
    }

    /**
     * Populates the paper filter based on the selected module.
     */
    function populatePaperFilter() {
        paperFilter.innerHTML = '<option value="all">All Papers</option>';
        const selectedModule = moduleFilter.value;
        if (selectedModule === 'all' || !allQuestionsData) return;

        const papers = Object.keys(allQuestionsData.michaelmas[selectedModule]);
        papers.forEach(paper => {
            const option = document.createElement('option');
            option.value = paper;
            option.textContent = paper;
            paperFilter.appendChild(option);
        });
    }

    /**
     * Handles checkbox changes for generated questions.
     */
    function handleResultCheckboxChange(event) {
        if (event.target.type === 'checkbox') {
            const questionId = event.target.dataset.id;
            if (event.target.checked) {
                sessionDoneList.add(questionId);
            } else {
                sessionDoneList.delete(questionId);
            }
        }
    }

    /**
     * Displays status messages to the user.
     */
    function updateSyncStatus(message, isError = false) {
        syncStatus.textContent = message;
        syncStatus.style.color = isError ? 'var(--error-color)' : 'var(--success-color)';
    }

    /**
     * Generic fetch wrapper for GitHub API.
     */
    async function githubApiFetch(url, options = {}) {
        const repo = githubRepoInput.value;
        const pat = githubPatInput.value;

        if (!repo || !pat) {
            throw new Error('GitHub Repo and Personal Access Token must be provided.');
        }
        
        localStorage.setItem('githubRepo', repo);
        localStorage.setItem('githubPat', pat);

        const headers = {
            'Authorization': `Bearer ${pat}`,
            'Accept': 'application/vnd.github.v3+json',
            ...options.headers,
        };

        const response = await fetch(`https://api.github.com/repos/${repo}${url}`, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API Error: ${errorData.message || response.statusText}`);
        }
        return response.json();
    }

    /**
     * Loads the progress.json file from GitHub.
     */
    async function loadProgressFromGithub() {
        updateSyncStatus('Loading progress from GitHub...');
        try {
            const data = await githubApiFetch(`/contents/${progressFilePath}`);
            githubFileSha = data.sha;
            const content = atob(data.content);
            const doneItems = JSON.parse(content);
            masterDoneList = new Set(doneItems);
            updateSyncStatus(`Successfully loaded ${masterDoneList.size} completed questions.`, false);
        } catch (error) {
            if (error.message.includes("Not Found")) {
                updateSyncStatus(`'${progressFilePath}' not found in repo. A new one will be created on save.`, false);
                masterDoneList = new Set();
            } else {
                updateSyncStatus(`Error loading progress: ${error.message}`, true);
            }
        }
    }

    /**
     * Saves the selected "done" questions to progress.json on GitHub.
     */
    async function saveProgressToGithub() {
        if (sessionDoneList.size === 0) {
            updateSyncStatus('No new questions selected to save.', true);
            return;
        }

        updateSyncStatus('Saving progress to GitHub...');
        
        // Add session items to master list
        sessionDoneList.forEach(item => masterDoneList.add(item));

        const contentToSave = JSON.stringify(Array.from(masterDoneList));
        const encodedContent = btoa(contentToSave);

        try {
            // We must fetch the latest SHA right before saving to avoid conflicts
            try {
                const fileData = await githubApiFetch(`/contents/${progressFilePath}`);
                githubFileSha = fileData.sha;
            } catch (error) {
                // If file doesn't exist, SHA is null and it will be created
                if (!error.message.includes("Not Found")) throw error;
                githubFileSha = null; 
            }

            const body = {
                message: `Update progress: ${new Date().toISOString()}`,
                content: encodedContent,
                sha: githubFileSha, // Include SHA if updating an existing file
            };

            const data = await githubApiFetch(`/contents/${progressFilePath}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            githubFileSha = data.content.sha;
            updateSyncStatus(`Successfully saved ${sessionDoneList.size} new question(s). Total done: ${masterDoneList.size}.`, false);
            
            // Clear session and update UI
            sessionDoneList.clear();
            const displayedQuestionIds = Array.from(resultsList.querySelectorAll('li')).map(li => li.dataset.id);
            const allQuestions = getFlattenedQuestions();
            const questionsToRender = allQuestions.filter(q => displayedQuestionIds.includes(q.id));
            renderResults(questionsToRender);

        } catch (error) {
            updateSyncStatus(`Error saving progress: ${error.message}`, true);
            // Revert master list if save failed
            sessionDoneList.forEach(item => masterDoneList.delete(item));
        }
    }

    /**
     * Flattens the question data into a single array of objects.
     */
    function getFlattenedQuestions() {
        const flat = [];
        const modules = allQuestionsData.michaelmas;
        for (const moduleName in modules) {
            const papers = modules[moduleName];
            for (const paperName in papers) {
                const triposes = papers[paperName];
                triposes.forEach(year => {
                    const id = `${moduleName}_${paperName}_${year}`;
                    flat.push({ id, module: moduleName, paper: paperName, year });
                });
            }
        }
        return flat;
    }

    /**
     * Main logic to generate a list of questions based on user criteria.
     */
    function generateQuestions() {
        if (!allQuestionsData) {
            updateSyncStatus('Question data not loaded yet.', true);
            return;
        }

        const num = parseInt(numQuestionsInput.value, 10);
        const module = moduleFilter.value;
        const paper = paperFilter.value;
        const mode = modeRandom.checked ? 'random' : 'homogeneous';

        let allAvailable = getFlattenedQuestions();

        // Filter out already completed questions
        let available = allAvailable.filter(q => !masterDoneList.has(q.id));

        // Apply filters
        if (module !== 'all') {
            available = available.filter(q => q.module === module);
        }
        if (paper !== 'all') {
            available = available.filter(q => q.paper === paper);
        }

        let selected = [];
        if (available.length === 0) {
            // No questions left, do nothing
        } else if (mode === 'homogeneous' && module === 'all') {
            // Homogeneous selection across all modules
            const questionsByModule = available.reduce((acc, q) => {
                if (!acc[q.module]) acc[q.module] = [];
                acc[q.module].push(q);
                return acc;
            }, {});
            const moduleKeys = Object.keys(questionsByModule);
            let count = 0;
            while (count < num && available.length > 0) {
                for (const mod of moduleKeys) {
                    if (count >= num) break;
                    const q_idx = Math.floor(Math.random() * questionsByModule[mod].length);
                    const question = questionsByModule[mod].splice(q_idx, 1)[0];
                    if (question) {
                        selected.push(question);
                        count++;
                    }
                    if (questionsByModule[mod].length === 0) {
                        moduleKeys.splice(moduleKeys.indexOf(mod), 1);
                    }
                }
            }

        } else {
            // Fully random selection
            while (selected.length < num && available.length > 0) {
                const randomIndex = Math.floor(Math.random() * available.length);
                selected.push(available.splice(randomIndex, 1)[0]);
            }
        }
        
        renderResults(selected);
    }

    /**
     * Renders the list of generated questions in the UI.
     */
    function renderResults(questions) {
        resultsList.innerHTML = '';
        if (questions.length === 0) {
            resultsPlaceholder.textContent = 'No questions match your criteria, or you have completed them all!';
            resultsPlaceholder.style.display = 'block';
            return;
        }
        
        resultsPlaceholder.style.display = 'none';

        questions.forEach(q => {
            const isCompleted = masterDoneList.has(q.id);
            const li = document.createElement('li');
            li.className = 'result-item';
            li.dataset.id = q.id;
            if (isCompleted) {
                li.classList.add('completed');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.id = q.id;
            checkbox.disabled = isCompleted;
            checkbox.checked = sessionDoneList.has(q.id);

            const link = document.createElement('a');
            const moduleClean = q.module;
            const yearMatch = q.year.match(/\b((19|20)\d{2})\b/);
            const yearClean = yearMatch ? yearMatch[0] : null;

            if (yearClean) {
                link.href = `https://camcribs.com/viewer?year=IB&type=tripos&module=${moduleClean}&id=QP_${yearClean}`;
                link.target = '_blank';
            } else {
                link.href = '#';
                link.title = 'Could not extract year for link';
            }
            link.textContent = `${q.module} - ${q.paper} - ${q.year}`;

            li.appendChild(checkbox);
            li.appendChild(link);
            resultsList.appendChild(li);
        });
    }
});
