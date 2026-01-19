// Global state
let features = [];
let selectedFeature = null;
let activeFilters = new Set();
let selectedRow = null;
let selectedColumn = null;
let selectedElements = new Set(); // Purple selections
let selectedElementsOrange = new Set(); // Orange selections
let selectedElementsRed = new Set(); // Red selections

// Click tracking for single/double/triple clicks
let clickTimers = new Map(); // elementAbbr -> { count: number, lastClick: timestamp, timer: timeout }

// Game mode state
let gameModeActive = false;
let gameQuestions = []; // Array of 5 randomly selected features
let currentQuestionIndex = 0;
let gameSelectedElements = new Set(); // Elements selected for current question
let gameScore = 0;
let gameTimer = null;
let gameTimeRemaining = 240; // 4 minutes in seconds

// Element descriptions
const elementDescriptions = {
    "Pr": {
        title: "Prompts",
        description: "Structured instructions or queries given to AI models to guide their behavior and generate desired outputs. Prompts are the primary interface for communicating intent to language models."
    },
    "Em": {
        title: "Embeddings",
        description: "Vector representations of text, images, or other data that capture semantic meaning. Embeddings enable similarity search and allow AI systems to understand relationships between concepts."
    },
    "Lg": {
        title: "LLM (Large Language Model)",
        description: "Large-scale neural network models trained on vast amounts of text data. LLMs can understand context, generate human-like text, answer questions, and perform various language tasks."
    },
    "Fc": {
        title: "Function Call",
        description: "The ability of AI models to invoke external functions or APIs during conversation. Function calling enables AI assistants to interact with tools, databases, and external systems."
    },
    "Vx": {
        title: "Vector",
        description: "Mathematical representation of data in multi-dimensional space. Vector databases store and retrieve embeddings efficiently, enabling semantic search and similarity matching."
    },
    "Rg": {
        title: "RAG (Retrieval-Augmented Generation)",
        description: "A technique that combines information retrieval with text generation. RAG systems retrieve relevant context from knowledge bases and use it to generate more accurate and contextual responses."
    },
    "Gr": {
        title: "Guardrails",
        description: "Safety mechanisms and content filters that ensure AI outputs meet quality, safety, and compliance standards. Guardrails prevent inappropriate, biased, or harmful content generation."
    },
    "Mm": {
        title: "Multimodal",
        description: "AI systems capable of processing and generating content across multiple modalities including text, images, audio, and video. Multimodal models understand relationships between different data types."
    },
    "Ag": {
        title: "Agent",
        description: "Autonomous AI systems that can perceive their environment, make decisions, and take actions to achieve goals. Agents can use tools, interact with systems, and operate independently."
    },
    "Ft": {
        title: "Finetune",
        description: "The process of further training a pre-trained model on specific data to adapt it for particular tasks or domains. Finetuning improves model performance on specialized use cases."
    },
    "Fw": {
        title: "Framework",
        description: "Structured systems and architectures for building AI applications. Frameworks provide tools, patterns, and infrastructure for developing, deploying, and managing AI solutions."
    },
    "Re": {
        title: "Red-team",
        description: "Security testing methodology where experts attempt to find vulnerabilities and weaknesses in AI systems. Red-teaming helps identify potential failures, biases, and security risks before deployment."
    },
    "Sm": {
        title: "Small",
        description: "Compact, efficient AI models optimized for fast inference and low resource consumption. Small models enable AI capabilities on edge devices and in resource-constrained environments."
    },
    "Ma": {
        title: "Multi-agent",
        description: "Systems where multiple AI agents collaborate, communicate, and coordinate to solve complex problems. Multi-agent systems enable distributed problem-solving and specialized task delegation."
    },
    "Sy": {
        title: "Synthetic",
        description: "AI-generated content including synthetic data, images, audio, and text. Synthetic generation creates new content that can be used for training, testing, or content creation purposes."
    },
    "Mc": {
        title: "MCP (Model Context Protocol)",
        description: "A standardized protocol for connecting AI models to external tools, resources, and services. MCP enables seamless integration and tool orchestration, allowing AI systems to access databases, APIs, file systems, and other external capabilities through a unified interface."
    },
    "In": {
        title: "Interpretation",
        description: "Techniques for understanding and explaining how AI models make decisions. Interpretation methods reveal model reasoning, highlight important features, and provide transparency into AI behavior."
    },
    "Th": {
        title: "Thinking",
        description: "Advanced reasoning capabilities where AI models engage in multi-step problem-solving, chain-of-thought reasoning, and complex logical inference to arrive at solutions."
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadFeatures();
});

// Initialize event listeners
function initializeEventListeners() {
    // Filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    // Expandable sections
    const expandableHeaders = document.querySelectorAll('.expandable-header');
    expandableHeaders.forEach(header => {
        header.addEventListener('click', toggleExpandableSection);
    });

    // Row and column headers
    const rowHeaders = document.querySelectorAll('.row-header.clickable');
    rowHeaders.forEach(header => {
        header.addEventListener('click', handleRowClick);
    });

    const columnHeaders = document.querySelectorAll('.column-header.clickable');
    columnHeaders.forEach(header => {
        header.addEventListener('click', handleColumnClick);
    });

    // Element cells
    const elementCells = document.querySelectorAll('.element-cell:not(.empty)');
    elementCells.forEach(cell => {
        cell.addEventListener('click', handleElementClick);
    });

    // Click outside table to reset
    document.addEventListener('click', handleDocumentClick);

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Resize handle
    const resizeHandle = document.getElementById('resize-handle');
    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', startResize);
    }

    // Feature details close button
    const featureDetailsClose = document.getElementById('feature-details-close');
    if (featureDetailsClose) {
        featureDetailsClose.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelection();
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Game mode toggle
    const gameModeToggle = document.getElementById('game-mode-toggle');
    if (gameModeToggle) {
        gameModeToggle.addEventListener('click', () => {
            if (gameModeActive) {
                endGameMode();
            } else {
                startGameMode();
            }
        });
    }

    // Game mode exit button
    const gameExit = document.getElementById('game-exit');
    if (gameExit) {
        gameExit.addEventListener('click', endGameMode);
    }

    // Game mode submit button
    const gameSubmit = document.getElementById('game-submit');
    if (gameSubmit) {
        gameSubmit.addEventListener('click', submitAnswer);
    }

    // Game mode results buttons
    const gamePlayAgain = document.getElementById('game-play-again');
    if (gamePlayAgain) {
        gamePlayAgain.addEventListener('click', startGameMode);
    }

    const gameExitResults = document.getElementById('game-exit-results');
    if (gameExitResults) {
        gameExitResults.addEventListener('click', endGameMode);
    }

    // Element description close button
    const elementDescriptionClose = document.getElementById('element-description-close');
    if (elementDescriptionClose) {
        elementDescriptionClose.addEventListener('click', (e) => {
            e.stopPropagation();
            const descriptionPanel = document.getElementById('element-description');
            if (descriptionPanel) {
                descriptionPanel.classList.add('hidden');
            }
        });
    }
}

// Theme management
function toggleTheme(event) {
    if (event) {
        event.stopPropagation();
    }
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Load features from manifest
async function loadFeatures() {
    try {
        const response = await fetch('features/features-list.json');
        if (!response.ok) {
            throw new Error('Failed to load features list');
        }
        const manifest = await response.json();
        
        // Load all feature files
        const featurePromises = manifest.features.map(filename => 
            fetch(`features/${filename}`)
                .then(res => res.json())
                .catch(err => {
                    console.error(`Failed to load ${filename}:`, err);
                    return null;
                })
        );

        const loadedFeatures = await Promise.all(featurePromises);
        features = loadedFeatures.filter(f => f !== null);
        
        renderFeatures();
    } catch (error) {
        console.error('Error loading features:', error);
        document.getElementById('features-list').innerHTML = 
            '<p style="color: #999; padding: 1rem;">No features found. Please add feature JSON files to the features/ directory.</p>';
    }
}

// Render features list
function renderFeatures() {
    const featuresList = document.getElementById('features-list');
    
    // Filter features based on active filters
    let filteredFeatures = features;
    if (activeFilters.size > 0) {
        filteredFeatures = features.filter(feature => 
            feature.productAreas.some(area => activeFilters.has(area))
        );
    }

    if (filteredFeatures.length === 0) {
        featuresList.innerHTML = '<p style="color: #999; padding: 1rem;">No features match the selected filters.</p>';
        return;
    }

    featuresList.innerHTML = filteredFeatures.map((feature) => `
        <div class="feature-item" data-feature-id="${feature.title}">
            <div class="feature-item-title">${escapeHtml(feature.title)}</div>
            <div class="feature-item-description">${escapeHtml(feature.description)}</div>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.feature-item').forEach(item => {
        item.addEventListener('click', () => {
            const featureTitle = item.dataset.featureId;
            const feature = features.find(f => f.title === featureTitle);
            if (feature) {
                // Toggle selection - if already selected, deselect
                if (selectedFeature && selectedFeature.title === feature.title) {
                    clearSelection();
                } else {
                    selectFeature(feature);
                }
            }
        });
    });
}

// Select a feature
function selectFeature(feature) {
    selectedFeature = feature;
    selectedRow = null;
    selectedColumn = null;
    // Don't clear element selections - allow them to coexist
    
    // Clear row/column highlights
    clearRowColumnHighlights();
    
    // Update UI
    document.querySelectorAll('.feature-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-feature-id="${feature.title}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }

    // Update all highlights (feature + individual selections)
    updateAllHighlights();
    
    // Hide element description when feature is selected
    updateElementDescription();

    // Show feature details
    showFeatureDetails(feature);
}

// Highlight elements in periodic table
function highlightElements(elementAbbrs) {
    // Remove all highlights
    document.querySelectorAll('.element-cell').forEach(cell => {
        cell.classList.remove('highlighted');
    });

    // Add highlights
    if (Array.isArray(elementAbbrs)) {
        elementAbbrs.forEach(abbr => {
            const cell = document.querySelector(`[data-element="${abbr}"]`);
            if (cell) {
                cell.classList.add('highlighted');
            }
        });
    } else if (elementAbbrs instanceof Set) {
        elementAbbrs.forEach(abbr => {
            const cell = document.querySelector(`[data-element="${abbr}"]`);
            if (cell) {
                cell.classList.add('highlighted');
            }
        });
    }
}

// Update all element highlights (purple, orange, and red selections)
function updateElementHighlights() {
    // Remove all highlight classes
    document.querySelectorAll('.element-cell').forEach(cell => {
        cell.classList.remove('highlighted', 'highlighted-shift', 'highlighted-red');
    });

    // Apply purple highlights
    selectedElements.forEach(abbr => {
        const cell = document.querySelector(`[data-element="${abbr}"]`);
        if (cell) {
            cell.classList.add('highlighted');
        }
    });

    // Apply orange highlights
    selectedElementsOrange.forEach(abbr => {
        const cell = document.querySelector(`[data-element="${abbr}"]`);
        if (cell) {
            cell.classList.add('highlighted-shift');
        }
    });

    // Apply red highlights
    selectedElementsRed.forEach(abbr => {
        const cell = document.querySelector(`[data-element="${abbr}"]`);
        if (cell) {
            cell.classList.add('highlighted-red');
        }
    });
}

// Update all highlights (feature + individual element selections)
function updateAllHighlights() {
    // First, remove all highlight classes including feature highlights
    document.querySelectorAll('.element-cell').forEach(cell => {
        cell.classList.remove('highlighted', 'highlighted-shift', 'highlighted-red', 'feature-highlighted');
    });

    // Apply feature highlights (use same styling as manual selection)
    if (selectedFeature && selectedFeature.elements) {
        selectedFeature.elements.forEach(abbr => {
            const cell = document.querySelector(`[data-element="${abbr}"]`);
            if (cell) {
                // Only add feature highlight if not individually selected
                // Manually selected elements should not get feature highlights
                if (!selectedElements.has(abbr) && 
                    !selectedElementsOrange.has(abbr) && 
                    !selectedElementsRed.has(abbr)) {
                    // Use the same 'highlighted' class as manual selection
                    cell.classList.add('highlighted');
                }
            }
        });
    }

    // Apply individual element highlights (these override feature highlights)
    selectedElements.forEach(abbr => {
        const cell = document.querySelector(`[data-element="${abbr}"]`);
        if (cell) {
            cell.classList.add('highlighted');
        }
    });

    selectedElementsOrange.forEach(abbr => {
        const cell = document.querySelector(`[data-element="${abbr}"]`);
        if (cell) {
            cell.classList.add('highlighted-shift');
        }
    });

    selectedElementsRed.forEach(abbr => {
        const cell = document.querySelector(`[data-element="${abbr}"]`);
        if (cell) {
            cell.classList.add('highlighted-red');
        }
    });
}

// Update element description display
function updateElementDescription() {
    const descriptionPanel = document.getElementById('element-description');
    const titleEl = document.getElementById('element-description-title');
    const textEl = document.getElementById('element-description-text');
    
    if (!descriptionPanel || !titleEl || !textEl) {
        console.error('Element description elements not found');
        return;
    }
    
    // Count total selected elements (across all colors)
    const totalSelected = selectedElements.size + selectedElementsOrange.size + selectedElementsRed.size;
    
    // Only show description if exactly one element is selected (hide if row/column selected)
    if (totalSelected === 1 && selectedRow === null && selectedColumn === null) {
        // Find which element is selected
        let selectedAbbr = null;
        if (selectedElements.size === 1) {
            selectedAbbr = Array.from(selectedElements)[0];
        } else if (selectedElementsOrange.size === 1) {
            selectedAbbr = Array.from(selectedElementsOrange)[0];
        } else if (selectedElementsRed.size === 1) {
            selectedAbbr = Array.from(selectedElementsRed)[0];
        }
        
        if (selectedAbbr) {
            if (elementDescriptions[selectedAbbr]) {
                titleEl.textContent = elementDescriptions[selectedAbbr].title;
                textEl.textContent = elementDescriptions[selectedAbbr].description;
                descriptionPanel.classList.remove('hidden');
                return;
            } else {
                console.warn(`No description found for element: ${selectedAbbr}`);
            }
        }
    }
    
    // Hide description if conditions not met
    descriptionPanel.classList.add('hidden');
}

// Handle row click
function handleRowClick(event) {
    // Don't handle row clicks during game mode
    if (gameModeActive) return;

    event.stopPropagation();
    const rowHeader = event.currentTarget;
    const rowName = rowHeader.dataset.row;
    
    // Clear feature and element selections
    selectedFeature = null;
    selectedColumn = null;
    selectedElements.clear();
    selectedElementsOrange.clear();
    clearSelection();
    
    // Toggle row selection
    if (selectedRow === rowName) {
        selectedRow = null;
        clearRowColumnHighlights();
    } else {
        selectedRow = rowName;
        highlightRow(rowName);
    }
    
    // Update element description
    updateElementDescription();
}

// Handle column click
function handleColumnClick(event) {
    // Don't handle column clicks during game mode
    if (gameModeActive) return;

    event.stopPropagation();
    const columnHeader = event.currentTarget;
    const columnNum = columnHeader.dataset.column;
    
    // Clear feature and element selections
    selectedFeature = null;
    selectedRow = null;
    selectedElements.clear();
    selectedElementsOrange.clear();
    clearSelection();
    
    // Toggle column selection
    if (selectedColumn === columnNum) {
        selectedColumn = null;
        clearRowColumnHighlights();
    } else {
        selectedColumn = columnNum;
        highlightColumn(columnNum);
    }
    
    // Update element description
    updateElementDescription();
}

// Handle element cell click
function handleElementClick(event) {
    // Route to game handler if game mode is active
    if (gameModeActive) {
        handleGameElementClick(event);
        return;
    }

    event.stopPropagation();
    const cell = event.currentTarget;
    const elementAbbr = cell.dataset.element;
    
    if (!elementAbbr) return;
    
    // Don't clear feature selection - allow it to coexist with element selections
    // Only clear row/column selections
    selectedRow = null;
    selectedColumn = null;
    clearRowColumnHighlights();
    
    // Track clicks for single/double/triple detection
    const now = Date.now();
    const clickData = clickTimers.get(elementAbbr);
    
    if (clickData && (now - clickData.lastClick) < 400) {
        // Within double/triple click window
        clickData.count++;
        clickData.lastClick = now;
        
        // Clear existing timer
        if (clickData.timer) {
            clearTimeout(clickData.timer);
        }
        
        // Set new timer to process the click
        clickData.timer = setTimeout(() => {
            processElementClick(elementAbbr, clickData.count);
            clickTimers.delete(elementAbbr);
        }, 400);
    } else {
        // First click or new click after timeout
        const newClickData = {
            count: 1,
            lastClick: now,
            timer: null
        };
        
        newClickData.timer = setTimeout(() => {
            processElementClick(elementAbbr, newClickData.count);
            clickTimers.delete(elementAbbr);
        }, 400);
        
        clickTimers.set(elementAbbr, newClickData);
    }
}

// Process element click based on click count
function processElementClick(elementAbbr, clickCount) {
    // Check current state before removing
    const wasPurple = selectedElements.has(elementAbbr);
    const wasOrange = selectedElementsOrange.has(elementAbbr);
    const wasRed = selectedElementsRed.has(elementAbbr);
    
    // Remove from all sets first
    selectedElements.delete(elementAbbr);
    selectedElementsOrange.delete(elementAbbr);
    selectedElementsRed.delete(elementAbbr);
    
    // Apply based on click count
    if (clickCount === 1) {
        // Single click: toggle purple (select/unselect)
        if (!wasPurple && !wasOrange && !wasRed) {
            // Was unselected, add purple
            selectedElements.add(elementAbbr);
        }
        // If was already purple/orange/red, it's removed above (toggled off)
    } else if (clickCount === 2) {
        // Double click: orange
        selectedElementsOrange.add(elementAbbr);
    } else if (clickCount >= 3) {
        // Triple click (or more): red
        selectedElementsRed.add(elementAbbr);
    }
    
    // Update all highlights (feature + individual selections)
    updateAllHighlights();
    
    // Update element description
    updateElementDescription();
}

// Handle clicks outside the table
function handleDocumentClick(event) {
    // Don't handle clicks during game mode
    if (gameModeActive) return;

    const periodicTableSection = document.querySelector('.periodic-table-section');
    const sidebar = document.querySelector('.sidebar');
    
    // Check if click is outside both the table and sidebar (and toggle buttons)
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const gameModeToggle = document.getElementById('game-mode-toggle');
    const isClickOnSidebarToggle = sidebarToggle && sidebarToggle.contains(event.target);
    const isClickOnThemeToggle = themeToggle && themeToggle.contains(event.target);
    const isClickOnGameModeToggle = gameModeToggle && gameModeToggle.contains(event.target);
    const isSidebarVisible = sidebar && !sidebar.classList.contains('collapsed');
    
    if (!periodicTableSection.contains(event.target) && 
        (!isSidebarVisible || !sidebar.contains(event.target)) &&
        !isClickOnSidebarToggle &&
        !isClickOnThemeToggle &&
        !isClickOnGameModeToggle) {
        // Reset all selections
        selectedFeature = null;
        selectedRow = null;
        selectedColumn = null;
        selectedElements.clear();
        selectedElementsOrange.clear();
        selectedElementsRed.clear();
        clearSelection();
        clearRowColumnHighlights();
    }
}

// Highlight a row
function highlightRow(rowName) {
    clearRowColumnHighlights();
    
    const rowHeader = document.querySelector(`[data-row="${rowName}"]`);
    if (rowHeader) {
        rowHeader.classList.add('highlighted');
        const row = rowHeader.parentElement;
        const cells = row.querySelectorAll('.element-cell');
        cells.forEach(cell => {
            if (!cell.classList.contains('empty')) {
                cell.classList.add('row-highlighted');
            }
        });
    }
}

// Highlight a column
function highlightColumn(columnNum) {
    clearRowColumnHighlights();
    
    const columnHeader = document.querySelector(`[data-column="${columnNum}"]`);
    if (columnHeader) {
        columnHeader.classList.add('highlighted');
        // Column index in thead (0 is empty, 1-5 are G1-G5)
        // In tbody, row header is index 0, then element cells are 1-5
        const columnIndex = parseInt(columnNum); // 1-5
        const rows = document.querySelectorAll('.periodic-table tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td.element-cell');
            // cells array is 0-indexed, column 1 is index 0, column 2 is index 1, etc.
            const cellIndex = columnIndex - 1;
            if (cells[cellIndex] && !cells[cellIndex].classList.contains('empty')) {
                cells[cellIndex].classList.add('column-highlighted');
            }
        });
    }
}

// Clear row and column highlights
function clearRowColumnHighlights() {
    document.querySelectorAll('.row-header').forEach(header => {
        header.classList.remove('highlighted');
    });
    document.querySelectorAll('.column-header').forEach(header => {
        header.classList.remove('highlighted');
    });
    document.querySelectorAll('.element-cell').forEach(cell => {
        cell.classList.remove('row-highlighted', 'column-highlighted');
    });
}

// Show feature details
function showFeatureDetails(feature) {
    const detailsPanel = document.getElementById('feature-details');
    const titleEl = document.getElementById('feature-details-title');
    const descriptionEl = document.getElementById('feature-details-description');
    const areasEl = document.getElementById('feature-details-areas');

    titleEl.textContent = feature.title;
    descriptionEl.textContent = feature.longDescription || feature.description;

    // Show product area details
    if (feature.productAreaDetails && Object.keys(feature.productAreaDetails).length > 0) {
        areasEl.innerHTML = `
            <h4 class="product-areas-heading">Product Areas</h4>
            ${Object.entries(feature.productAreaDetails)
                .map(([area, details]) => `
                    <div class="area-detail-item">
                        <h4>${escapeHtml(area)}</h4>
                        <p>${escapeHtml(details)}</p>
                    </div>
                `).join('')}
        `;
    } else {
        areasEl.innerHTML = '';
    }

    detailsPanel.classList.remove('hidden');
}

// Handle filter changes
function handleFilterChange(event) {
    const value = event.target.value;
    
    if (event.target.checked) {
        activeFilters.add(value);
    } else {
        activeFilters.delete(value);
    }

    renderFeatures();
    
    // Clear selection if current feature doesn't match filters
    if (selectedFeature) {
        const matchesFilter = activeFilters.size === 0 || 
            selectedFeature.productAreas.some(area => activeFilters.has(area));
        if (!matchesFilter) {
            clearSelection();
        }
    }
}

// Clear selection
function clearSelection() {
    selectedFeature = null;
    document.querySelectorAll('.feature-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('.element-cell').forEach(cell => {
        cell.classList.remove('highlighted', 'highlighted-shift', 'highlighted-red', 'feature-highlighted');
    });
    selectedElements.clear();
    selectedElementsOrange.clear();
    selectedElementsRed.clear();
    document.getElementById('feature-details').classList.add('hidden');
    updateElementDescription();
}

// Toggle expandable sections
function toggleExpandableSection(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    const isActive = header.classList.contains('active');

    // Close all other sections
    document.querySelectorAll('.expandable-header').forEach(h => {
        if (h !== header) {
            h.classList.remove('active');
            h.nextElementSibling.classList.remove('expanded');
        }
    });

    // Toggle current section
    if (isActive) {
        header.classList.remove('active');
        content.classList.remove('expanded');
    } else {
        header.classList.add('active');
        content.classList.add('expanded');
    }
}

// Toggle sidebar
function toggleSidebar(event) {
    event.stopPropagation();
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// Resize functionality
let isResizing = false;
let startX = 0;
let startWidth = 0;

function startResize(event) {
    // Only allow resizing on desktop (screen width > 1200px)
    if (window.innerWidth <= 1200) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    
    isResizing = true;
    startX = event.clientX;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        startWidth = sidebar.offsetWidth;
        sidebar.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

function handleResize(event) {
    if (!isResizing) return;
    
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    const diff = event.clientX - startX;
    const newWidth = startWidth + diff;
    const minWidth = 250;
    const maxWidth = 800;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
        sidebar.style.flex = `0 0 ${newWidth}px`;
        sidebar.style.width = `${newWidth}px`;
    }
}

function stopResize() {
    if (!isResizing) return;
    
    isResizing = false;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('resizing');
    }
    
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== GAME MODE FUNCTIONS ====================

// Start game mode
function startGameMode() {
    if (features.length < 5) {
        alert('Not enough features available. Need at least 5 features to start the game.');
        return;
    }

    // Reset game state
    gameModeActive = true;
    gameScore = 0;
    currentQuestionIndex = 0;
    gameTimeRemaining = 240; // 4 minutes
    gameSelectedElements.clear();

    // Randomly select 5 features
    const shuffled = [...features].sort(() => Math.random() - 0.5);
    gameQuestions = shuffled.slice(0, 5);

    // Show game panel
    const gamePanel = document.getElementById('game-mode-panel');
    const results = document.getElementById('game-results');
    if (gamePanel) {
        gamePanel.classList.remove('hidden');
    }
    if (results) {
        results.classList.add('hidden');
    }

    // Add game mode class to body
    document.body.classList.add('game-mode-active');

    // Load first question
    loadNextQuestion();

    // Start timer
    startTimer();
}

// End game mode
function endGameMode() {
    gameModeActive = false;
    
    // Clear timer
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    // Hide game panel
    const gamePanel = document.getElementById('game-mode-panel');
    if (gamePanel) {
        gamePanel.classList.add('hidden');
    }

    // Hide results if visible
    const results = document.getElementById('game-results');
    if (results) {
        results.classList.add('hidden');
    }

    // Remove game mode class from body
    document.body.classList.remove('game-mode-active');

    // Clear all game highlights
    document.querySelectorAll('.element-cell').forEach(cell => {
        cell.classList.remove('game-selected', 'game-correct', 'game-incorrect');
    });

    // Clear normal mode selections
    clearSelection();
    selectedElements.clear();
    selectedElementsOrange.clear();
    selectedElementsRed.clear();
    updateAllHighlights();
}

// Load next question
function loadNextQuestion() {
    if (currentQuestionIndex >= gameQuestions.length) {
        showGameResults();
        return;
    }

    const currentQuestion = gameQuestions[currentQuestionIndex];
    gameSelectedElements.clear();

    // Update UI
    const questionEl = document.getElementById('game-question');
    questionEl.textContent = `What are the Elements that make up ${currentQuestion.title} in Appspace?`;

    const questionCounter = document.getElementById('game-question-counter');
    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of 5`;

    const submitButton = document.getElementById('game-submit');
    submitButton.classList.add('hidden');

    // Clear all game highlights
    document.querySelectorAll('.element-cell').forEach(cell => {
        cell.classList.remove('game-selected', 'game-correct', 'game-incorrect');
    });
}

// Handle game element click
function handleGameElementClick(event) {
    if (!gameModeActive) return;

    event.stopPropagation();
    const cell = event.currentTarget;
    const elementAbbr = cell.dataset.element;

    if (!elementAbbr) return;

    // Toggle selection
    if (gameSelectedElements.has(elementAbbr)) {
        gameSelectedElements.delete(elementAbbr);
        cell.classList.remove('game-selected');
    } else {
        gameSelectedElements.add(elementAbbr);
        cell.classList.add('game-selected');
    }

    // Show/hide submit button
    const submitButton = document.getElementById('game-submit');
    if (gameSelectedElements.size > 0) {
        submitButton.classList.remove('hidden');
    } else {
        submitButton.classList.add('hidden');
    }
}

// Submit answer
function submitAnswer() {
    if (!gameModeActive || currentQuestionIndex >= gameQuestions.length) return;

    const currentQuestion = gameQuestions[currentQuestionIndex];
    const correctElements = new Set(currentQuestion.elements || []);
    const selectedArray = Array.from(gameSelectedElements);

    // Calculate score for this question
    let questionScore = 0;
    selectedArray.forEach(element => {
        if (correctElements.has(element)) {
            questionScore += 1; // Correct element
        } else {
            questionScore -= 1; // Incorrect element
        }
    });

    // Also check for missing correct elements (but don't penalize)
    correctElements.forEach(element => {
        if (!gameSelectedElements.has(element)) {
            // Missing correct element - could add bonus logic here if needed
        }
    });

    // Update total score
    gameScore += questionScore;

    // Show visual feedback
    selectedArray.forEach(element => {
        const cell = document.querySelector(`[data-element="${element}"]`);
        if (cell) {
            cell.classList.remove('game-selected');
            if (correctElements.has(element)) {
                cell.classList.add('game-correct');
            } else {
                cell.classList.add('game-incorrect');
            }
        }
    });

    // Highlight missing correct elements
    correctElements.forEach(element => {
        if (!gameSelectedElements.has(element)) {
            const cell = document.querySelector(`[data-element="${element}"]`);
            if (cell) {
                cell.classList.add('game-correct');
            }
        }
    });

    // Update score display
    updateGameScore();

    // Auto-advance after 2 seconds
    setTimeout(() => {
        currentQuestionIndex++;
        loadNextQuestion();
    }, 2000);
}

// Update game score display
function updateGameScore() {
    const scoreEl = document.getElementById('game-score');
    scoreEl.textContent = `Score: ${gameScore}`;
}

// Start timer
function startTimer() {
    updateTimerDisplay();
    
    gameTimer = setInterval(() => {
        gameTimeRemaining--;
        updateTimerDisplay();

        if (gameTimeRemaining <= 0) {
            clearInterval(gameTimer);
            // Auto-submit current question if timer expires
            if (gameSelectedElements.size > 0) {
                submitAnswer();
            } else {
                // No selections, just move to next question
                currentQuestionIndex++;
                if (currentQuestionIndex >= gameQuestions.length) {
                    showGameResults();
                } else {
                    loadNextQuestion();
                }
            }
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const timerEl = document.getElementById('game-timer');
    const minutes = Math.floor(gameTimeRemaining / 60);
    const seconds = gameTimeRemaining % 60;
    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Add warning class when less than 1 minute
    if (gameTimeRemaining < 60) {
        timerEl.classList.add('warning');
    } else {
        timerEl.classList.remove('warning');
    }
}

// Show game results
function showGameResults() {
    // Clear timer
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    // Hide question panel, show results
    const results = document.getElementById('game-results');
    const finalScore = document.getElementById('final-score');
    finalScore.textContent = `Final Score: ${gameScore}`;
    results.classList.remove('hidden');
}
