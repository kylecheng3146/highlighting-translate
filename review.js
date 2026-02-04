/**
 * review.js
 * Logic for the Vocabulary Review Quiz
 */

const storageService = new StorageService();

// Game State
const state = {
    questions: [],
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    isAnswering: false, // Prevent double clicks
    startTime: Date.now()
};

// DOM Elements
const elements = {
    loading: document.getElementById('loading-state'),
    quizContainer: document.getElementById('quiz-container'),
    resultsContainer: document.getElementById('results-container'),
    questionText: document.getElementById('question-text'),
    optionsGrid: document.getElementById('options-grid'),
    progressText: document.getElementById('progress-text'),
    progressBar: document.getElementById('progress-bar'),
    feedbackMsg: document.getElementById('feedback-msg'),
    exitBtn: document.getElementById('exit-btn'),
    replayBtn: document.getElementById('replay-btn'),
    backBtn: document.getElementById('back-btn'),
    resultCorrect: document.getElementById('result-correct'),
    resultWrong: document.getElementById('result-wrong'),
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    await startQuiz();
});

function initEventListeners() {
    elements.exitBtn.addEventListener('click', () => window.close());
    elements.replayBtn.addEventListener('click', () => {
        elements.resultsContainer.classList.add('hidden');
        startQuiz();
    });
    elements.backBtn.addEventListener('click', () => window.close());
}

async function startQuiz() {
    // efficient reset
    state.currentIndex = 0;
    state.score = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.isAnswering = false;

    // UI Reset
    elements.loading.classList.remove('hidden');
    elements.quizContainer.classList.add('hidden');
    updateProgress();

    try {
        // 1. Fetch Vocabulary
        const allVocab = await storageService.getTranslations(1000); // Get ample amount
        const fallbackWords = await fetchFallbackWords();
        
        // 2. Filter Review Candidates (Not Archived)
        // Check property compatibility (some old items might not have isArchived)
        let candidates = allVocab.filter(item => !item.isArchived);

        // 3. Generate Questions
        state.questions = generateQuestions(candidates, fallbackWords, 10);

        if (state.questions.length === 0) {
            alert("No words to review! Try adding some words first.");
            window.close();
            return;
        }

        // 4. Start Game
        elements.loading.classList.add('hidden');
        elements.quizContainer.classList.remove('hidden');
        renderQuestion();

    } catch (error) {
        console.error("Failed to start quiz:", error);
        alert("Error starting quiz. Please try again.");
    }
}

async function fetchFallbackWords() {
    try {
        const response = await fetch(chrome.runtime.getURL('assets/fallback_words.json'));
        return await response.json();
    } catch (e) {
        console.error("Error loading fallback words:", e);
        return [];
    }
}

/**
 * Generates N questions with distractors
 */
function generateQuestions(candidates, fallback, count) {
    const questions = [];
    // If we have enough real candidates, prioritize them
    // Strategy: Shuffle candidates
    // If candidates < count, fill rest with random from fallback (or repeat?)
    // Actually, mixing fallback into the pool is safer for distractors.

    // 1. Create a pool of ALL potential words (user words + fallback) for distractors
    const pool = [...candidates, ...fallback];
    
    // 2. Determine Question Targets
    // We want to quiz 'candidates' first. 
    // If candidates < count, we can pad with fallback words as "New Learning"
    let targets = [...candidates];
    
    // Shuffle targets
    shuffleArray(targets);

    // Limit to count
    if (targets.length > count) {
        targets = targets.slice(0, count);
    } else if (targets.length < count) {
        // Fill needed
        const needed = count - targets.length;
        const filler = [...fallback];
        shuffleArray(filler);
        
        // Avoid duplicates if fallback overlaps with candidates (unlikely by design but possible)
        // Simple distinct check by text
        const targetTexts = new Set(targets.map(t => t.text.toLowerCase()));
        let added = 0;
        for (const w of filler) {
            if (added >= needed) break;
            if (!targetTexts.has(w.text.toLowerCase())) {
                targets.push(w);
                added++;
            }
        }
    }

    // 3. Build Question Objects
    targets.forEach(target => {
        // Select 3 distractors distinct from target
        const distractors = [];
        const usedIndices = new Set();
        
        while (distractors.length < 3) {
            const randIndex = Math.floor(Math.random() * pool.length);
            const w = pool[randIndex];
            
            if (w.text.toLowerCase() !== target.text.toLowerCase() && !usedIndices.has(randIndex)) {
                distractors.push(w);
                usedIndices.add(randIndex);
            }
            // Safety break loop if pool is too small (shouldn't happen with 100 fallback words)
            if (usedIndices.size >= pool.length - 1) break; 
        }

        const options = [target, ...distractors];
        shuffleArray(options);

        questions.push({
            target: target,
            options: options
        });
    });

    return questions;
}

function renderQuestion() {
    const q = state.questions[state.currentIndex];
    elements.questionText.textContent = q.target.translation || q.target.meaning; // Compatible with both structures?
    // Note: User spec says "Question: Chinese", "Options: English"
    
    // Clear options
    elements.optionsGrid.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = `option-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md text-xl font-bold text-slate-700 flex items-center justify-center min-h-[100px] transition-all`;
        btn.textContent = opt.text;
        
        btn.onclick = () => handleAnswer(opt, btn);
        elements.optionsGrid.appendChild(btn);
    });

    state.isAnswering = false;
    updateProgress();
}

async function handleAnswer(selectedOption, btnElement) {
    if (state.isAnswering) return;
    state.isAnswering = true;

    const currentQ = state.questions[state.currentIndex];
    const isCorrect = selectedOption.text === currentQ.target.text;

    // UI Feedback
    if (isCorrect) {
        btnElement.classList.add('option-correct', 'animate-pop');
        showFeedback(true);
        state.correctCount++;
        
        // Helper: Play simple sound? (Maybe later)
    } else {
        btnElement.classList.add('option-wrong', 'animate-shake');
        showFeedback(false);
        state.wrongCount++;
        
        // Highlight correct answer
        const correctBtn = Array.from(elements.optionsGrid.children).find(
            b => b.textContent === currentQ.target.text
        );
        if (correctBtn) correctBtn.classList.add('option-correct');
    }

    // Dim other options focus
    Array.from(elements.optionsGrid.children).forEach(b => {
        if (b !== btnElement && b.textContent !== currentQ.target.text) {
            b.classList.add('option-dimmed');
        }
    });

    // Update Storage (Learning Progress)
    // Only update if it's a real user word (has 'learningRate' or is compatible)
    // We check if it exists in DB implicitly by trying to update.
    await updateWordProgress(currentQ.target, isCorrect);

    // Delay next
    const delay = isCorrect ? 1000 : 2000; // 1s for correct, 2s for wrong
    setTimeout(() => {
        state.currentIndex++;
        if (state.currentIndex >= state.questions.length) {
            endQuiz();
        } else {
            renderQuestion();
        }
    }, delay);
}

async function updateWordProgress(wordObj, isCorrect) {
    // Needs raw word from storage to update stats
    // Logic: 
    // Correct: +20%
    // Wrong: -10%
    // Range: 0 - 100
    
    let currentRate = wordObj.learningRate || 0;
    if (isCorrect) currentRate += 20;
    else currentRate -= 10;
    
    // Clamp
    if (currentRate > 100) currentRate = 100;
    if (currentRate < 0) currentRate = 0;

    const updates = {
        learningRate: currentRate,
        lastReviewedAt: Date.now()
    };

    // Use storage service to persist
    // Need to handle if wordObj is from fallback (won't be in DB)
    // We can try to update, if it returns false (not found), we might want to ADD it to history?
    // User Decision: If I review a fallback word, does it become my history?
    // Let's assume NO for now to keep it simple, OR check if it was truly from history.
    
    const exists = await storageService.updateSRSStatus(wordObj.text, wordObj.translation, updates);
    if (!exists && isCorrect) {
        // Optional: If answering a fallback correctly, maybe add to history?
        // Leaving out for now as per spec "Fallback is just filler".
    }
}

function showFeedback(isCorrect) {
    elements.feedbackMsg.textContent = isCorrect ? "Correct!" : "Oops!";
    elements.feedbackMsg.classList.remove('text-green-600', 'text-red-500', 'opacity-0');
    elements.feedbackMsg.classList.add(isCorrect ? 'text-green-600' : 'text-red-500');
}

function updateProgress() {
    const rawIndex = state.currentIndex + 1;
    const total = state.questions.length || 10;
    elements.progressText.textContent = `${Math.min(rawIndex, total)} / ${total}`;
    elements.progressBar.style.width = `${(rawIndex / total) * 100}%`;
}

function endQuiz() {
    elements.quizContainer.classList.add('hidden');
    elements.resultsContainer.classList.remove('hidden');
    
    elements.resultCorrect.textContent = state.correctCount;
    elements.resultWrong.textContent = state.wrongCount;
}

// Utility
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
