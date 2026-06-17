document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const studentContainer = document.getElementById('studentContainer');
    const searchInput = document.getElementById('searchInput');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const noResultsMsg = document.getElementById('noResultsMsg');

    let allStudents = [];
    let currentlyExpandedWrapper = null;

    // Fetch student data
    async function fetchStudents() {
        try {
            const response = await fetch('projects.json');
            if (!response.ok) throw new Error('Failed to load student data');
            allStudents = await response.json();
            allStudents = sortByDescriptionQuality(allStudents);
            renderStudents(allStudents);
        } catch (error) {
            console.error('Error fetching data:', error);
            studentContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px;">
                    <i class="ph ph-warning" style="font-size: 3rem; margin-bottom: 16px;"></i>
                    <p>Failed to load student data. Please ensure you are running a local server.</p>
                </div>
            `;
        }
    }

    // Helper to score description quality
    function scoreDescription(desc) {
        if (!desc || desc.trim() === '' || desc.toLowerCase() === 'none') return 0; // empty
        const len = desc.length;
        if (len < 30) return 1;     // too short
        if (len >= 80 && len <= 500) return 4; // perfect length
        if (len <= 800) return 3;   // good but long
        return 2;                   // excessively long
    }

    // Unified scoring system for holistic sorting
    function calculateStudentScore(student) {
        let score = 0;
        
        // 1. Has Blog (Highest Priority)
        if (student.blogLink && student.blogLink !== '#') score += 100;
        
        // 2. Has Working ML Project (Highest Priority)
        if (student.link && student.link !== '#') score += 100;
        
        // 3. Great Description Quality
        score += scoreDescription(student.description) * 10;
        
        // 4. Meaningful Title (Avoid generic placeholders)
        const title = student.title || '';
        const tLower = title.toLowerCase().trim();
        if (tLower && tLower !== 'none' && tLower !== 'ml project' && tLower !== 'not specified' && tLower !== 'machine learning') {
            score += 10;
        }
        
        return score;
    }

    function sortByDescriptionQuality(students) {
        return [...students].sort((a, b) => {
            return calculateStudentScore(b) - calculateStudentScore(a);
        });
    }

    // Get initials for avatar
    function getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    function collapseCurrentCard() {
        if (currentlyExpandedWrapper) {
            const wrapper = currentlyExpandedWrapper;
            wrapper.classList.remove('is-expanded');
            wrapper.classList.add('is-closing');
            setTimeout(() => {
                wrapper.classList.remove('is-closing');
            }, 400); // Wait for CSS transitions to finish
            currentlyExpandedWrapper = null;
        }
    }

    // ===========================
    // Card Creation
    // ===========================

    function createStudentCard(student, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper';
        
        const card = document.createElement('div');
        card.className = 'student-card';
        card.style.opacity = '0';
        card.style.animationDelay = `${index * 0.05}s`;
        card.classList.add('animate-in');

        const initials = getInitials(student.name);
        const hasProjectLink = student.link && student.link !== '' && student.link !== '#';
        const sectionShort = student.section ? student.section.replace(' III Year', '') : '';

        // Truncate description for expanded view
        const descText = student.description || 'No description provided.';

        card.innerHTML = `
            <button class="close-card-btn" aria-label="Close"><i class="ph ph-x"></i></button>

            <div class="card-header">
                <div class="avatar">${initials}</div>
                <div class="basic-info">
                    <h2>${escapeHtml(student.name)}</h2>
                    <span class="section-badge">${escapeHtml(sectionShort)}</span>
                </div>
            </div>

            <div class="card-preview">
                <div class="preview-title">${escapeHtml(student.title)}</div>
            </div>

            <div class="list-quick-info">
                <div class="section-mini"><i class="ph ph-buildings"></i> ${escapeHtml(student.section)}</div>
                <div class="badge-row">
                    ${hasProjectLink ? '<i class="ph ph-rocket-launch" title="Deployed"></i>' : ''}
                </div>
            </div>
            
            <div class="card-details">
                <div class="details-content-wrapper">
                    <div class="details-content">
                        <div class="project-info">
                            <div class="project-label">Project Title</div>
                            <div class="project-title">${escapeHtml(student.title)}</div>
                            <p class="project-description">${escapeHtml(descText)}</p>
                        </div>

                        <div class="action-buttons">
                            <a href="${hasProjectLink ? escapeHtml(student.link) : '#'}" target="_blank" rel="noopener noreferrer" 
                               class="action-btn btn-deploy ${!hasProjectLink ? 'disabled' : ''}" 
                               onclick="event.stopPropagation(); ${!hasProjectLink ? 'event.preventDefault();' : ''}">
                                <i class="ph ph-arrow-square-out"></i> ${hasProjectLink ? 'View Deployed Project' : 'Not Deployed'}
                            </a>
                            <a href="${student.blogLink ? escapeHtml(student.blogLink) : '#'}" target="_blank" rel="noopener noreferrer" 
                               class="action-btn btn-secondary ${!student.blogLink ? 'disabled' : ''}" 
                               onclick="event.stopPropagation(); ${!student.blogLink ? 'event.preventDefault();' : ''}">
                                <i class="ph ph-article"></i> Blog
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        wrapper.appendChild(card);

        // Click on card to expand
        card.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn') || e.target.closest('.project-link')) return;
            if (e.target.closest('.close-card-btn')) {
                e.stopPropagation();
                collapseCurrentCard();
                return;
            }

            if (wrapper.classList.contains('is-expanded')) {
                collapseCurrentCard();
            } else {
                collapseCurrentCard();
                wrapper.classList.add('is-expanded');
                currentlyExpandedWrapper = wrapper;
            }
        });

        return wrapper;
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') collapseCurrentCard();
    });

    // Close when clicking outside of any expanded card
    document.addEventListener('click', (e) => {
        if (currentlyExpandedWrapper && !e.target.closest('.card-wrapper')) {
            collapseCurrentCard();
        }
    });

    // Render students
    function renderStudents(studentsToRender) {
        collapseCurrentCard();
        studentContainer.innerHTML = '';
        
        if (studentsToRender.length === 0) {
            noResultsMsg.classList.remove('hidden');
            return;
        }
        
        noResultsMsg.classList.add('hidden');
        
        studentsToRender.forEach((student, index) => {
            const wrapper = createStudentCard(student, index);
            studentContainer.appendChild(wrapper);
        });
    }

    // Search
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            renderStudents(allStudents);
            return;
        }
        const filtered = allStudents.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.title.toLowerCase().includes(query)
        );
        renderStudents(filtered);
    }

    // View toggling
    function setView(viewType) {
        collapseCurrentCard();
        if (viewType === 'grid') {
            studentContainer.classList.remove('list-view');
            studentContainer.classList.add('grid-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            studentContainer.classList.remove('grid-view');
            studentContainer.classList.add('list-view');
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
        }
    }

    // Event Listeners
    searchInput.addEventListener('input', handleSearch);
    gridViewBtn.addEventListener('click', () => setView('grid'));
    listViewBtn.addEventListener('click', () => setView('list'));

    // Set default view based on screen width
    function setDefaultView() {
        if (window.innerWidth <= 768) {
            setView('list');
        } else {
            setView('grid');
        }
    }

    // Init
    setDefaultView();
    fetchStudents();
});
