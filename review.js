/**
 * Logic for Flashcard Review Mode
 */
/**
 * View Class handling all DOM interactions via State
 */
class ReviewView {
    constructor() {
        this.elements = {
            flashcard: document.getElementById('flashcard'),
            flipBtn: document.getElementById('flip-btn'),
            flipControls: document.querySelector('.flip-controls'),
            ratingControls: document.getElementById('rating-controls'),
            sourceText: document.getElementById('card-source-text'),
            targetText: document.getElementById('card-target-text'),
            details: document.getElementById('card-details'),
            progressCount: document.getElementById('progress-count'),
            progressFill: document.getElementById('progress-fill'),
            reviewArea: document.getElementById('review-area'),
            summaryArea: document.getElementById('summary-area'),
            sessionCount: document.getElementById('session-count'),
            closeBtn: document.getElementById('close-btn'),
            finishBtn: document.getElementById('finish-btn')
        };
        
        this.callbacks = {};
    }

    bindEvents(callbacks) {
        this.callbacks = callbacks;

        // Flip Button
        this.elements.flipBtn.addEventListener('click', () => this.callbacks.onFlip());
        
        // Card Click
        this.elements.flashcard.addEventListener('click', () => {
            this.callbacks.onFlip();
        });

        // Rating Buttons
        document.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const rating = parseInt(btn.dataset.rating);
                this.callbacks.onRate(rating);
            });
        });

        // Close
        this.elements.closeBtn.addEventListener('click', () => this.callbacks.onClose());
        this.elements.finishBtn.addEventListener('click', () => this.callbacks.onClose());

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.callbacks.onFlip(); // Let logic decide if accessible
            } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
                const rating = parseInt(e.key);
                this.callbacks.onRate(rating); // Let logic decide if accessible
            }
        });
    }

    render(state) {
        // 1. Progress
        const total = state.queue.length || 20;
        const current = state.currentIndex;
        const pct = total > 0 ? (current / total) * 100 : 0;
        this.elements.progressCount.textContent = current;
        this.elements.progressFill.style.width = `${pct}%`;

        // 2. Session Finished
        if (state.finished) {
            this.elements.reviewArea.classList.add('hidden');
            this.elements.summaryArea.classList.remove('hidden');
            this.elements.sessionCount.textContent = state.sessionCount;
            return;
        }

        // 3. Card Content
        this.elements.reviewArea.classList.remove('hidden');
        this.elements.summaryArea.classList.add('hidden');

        const card = state.currentCard;
        if (card) {
            this.elements.sourceText.textContent = card.text;
            this.elements.targetText.textContent = card.translation;
            this.elements.details.textContent = card.context || '';
            
            // Rating Previews (computed in Logic/passed in state theoretically, or computed here)
            // For simplicity, we can keep computing here or ask logic to provide derived state.
            // Let's rely on SRS Service helper here if avoiding logic in View, 
            // OR keep it here as "View Logic" (formatter).
            // Better: updateRatingPreviews can be a helper or passed data.
            // We will pass `srsService` to render or `previews` in state.
            // Passing srsService is easier for now to avoid bulky state.
        }

        // 4. Flip State
        if (state.isFlipped) {
            this.elements.flashcard.classList.add('flipped');
            this.elements.flipControls.classList.add('hidden');
            this.elements.ratingControls.classList.remove('hidden');
        } else {
            this.elements.flashcard.classList.remove('flipped');
            this.elements.flipControls.classList.remove('hidden');
            this.elements.ratingControls.classList.add('hidden');
        }
    }

    updateRatingPreviews(card, srsService) {
        [1, 2, 3, 4].forEach(rating => {
            const btn = document.querySelector(`.rate-btn[data-rating="${rating}"]`);
            if (btn) {
                const preview = srsService.calculateNextReview(card, rating);
                const timeLabel = btn.querySelector('.rate-time');
                if (preview.interval < 1) {
                    timeLabel.textContent = '1m';
                } else {
                    timeLabel.textContent = `${Math.round(preview.interval)}d`;
                }
            }
        });
    }
    
    close() {
        window.close();
    }
}

/**
 * Controller Class (State Manager)
 */
class ReviewManager {
    constructor(view) {
        this.view = view || new ReviewView();
        this.storageService = new StorageService();
        this.srsService = new SRSService();
        
        this.state = {
            queue: [],
            currentCard: null,
            currentIndex: 0,
            sessionCount: 0,
            isFlipped: false,
            finished: false
        };

        if (this.view) {
            this.init();
        }
    }

    async init() {
        this.view.bindEvents({
            onFlip: () => this.flipCard(),
            onRate: (rating) => this.handleRating(rating),
            onClose: () => this.view.close()
        });
        
        await this.loadReviewQueue();
    }

    async loadReviewQueue() {
        const allItems = await this.storageService.getTranslations(1000);
        const now = Date.now();

        const dueItems = allItems.filter(item => item.nextReview && item.nextReview <= now);
        const newItems = allItems.filter(item => !item.nextReview);

        const sessionLimit = 20;
        let queue = [...dueItems];
        if (queue.length < sessionLimit) {
            queue = queue.concat(newItems.slice(0, sessionLimit - queue.length));
        }

        this.updateState({
            queue: queue,
            currentIndex: 0,
            currentCard: queue[0],
            isFlipped: false,
            finished: queue.length === 0
        });

        console.log(`Loaded ${this.state.queue.length} cards for review.`);
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.view.render(this.state);
        
        // Post-render updates (like previews which depend on DOM elements existing)
        if (!this.state.finished && this.state.currentCard) {
            this.view.updateRatingPreviews(this.state.currentCard, this.srsService);
        }
    }

    flipCard() {
        if (this.state.finished || this.state.isFlipped) return;
        this.updateState({ isFlipped: true });
    }

    async handleRating(rating) {
        if (!this.state.isFlipped || this.state.finished) return;

        const card = this.state.currentCard;
        const newStats = this.srsService.calculateNextReview(card, rating);
        
        const updates = {
            nextReview: this.srsService.getDueDate(newStats.interval),
            interval: newStats.interval,
            repetitions: newStats.repetitions,
            easeFactor: newStats.easeFactor
        };

        await this.storageService.updateSRSStatus(card.text, card.translation, updates);

        const nextIndex = this.state.currentIndex + 1;
        const finished = nextIndex >= this.state.queue.length;

        this.updateState({
            currentIndex: nextIndex,
            currentCard: this.state.queue[nextIndex] || null,
            sessionCount: this.state.sessionCount + 1,
            isFlipped: false,
            finished: finished
        });
    }
}

// Initialize
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only init if we are in a browser context and not testing
        if (!window.__TESTING__) {
            new ReviewManager();
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewManager;
}
module.exports = { ReviewManager, ReviewView };
