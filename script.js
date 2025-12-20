// RHCSA EX300 Realistic Exam System - JavaScript
let timerInterval = null;
let timeRemaining = 9000; // 150 minutes in seconds
let tasks = [];
let examSubmitted = false;
let examHistory = [];
let currentExamNumber = 1;
let selectedCategory = "all";
let startTime = null;

// Category mapping based on Red Hat book chapters
const categoryMap = {
    "system-access": "Access the Command Line",
    "files-directories": "Manage Files from Command Line",
    "users-groups": "Manage Local Users & Groups",
    "permissions-acl": "Control Access to Files",
    "processes": "Monitor & Manage Processes",
    "services-daemons": "Control Services & Daemons",
    "ssh": "Configure & Secure SSH",
    "logging": "Analyze & Store Logs",
    "networking": "Manage Networking",
    "archiving": "Archive & Transfer Files",
    "software": "Install & Update Software",
    "file-systems": "Access Linux File Systems",
    "scripting": "Improve Command-line Productivity",
    "scheduling": "Schedule Future Tasks",
    "performance": "Tune System Performance",
    "selinux": "Manage SELinux Security",
    "storage-basic": "Manage Basic Storage",
    "storage-lvm": "Manage Storage Stack",
    "nas": "Access Network-Attached Storage",
    "boot": "Control the Boot Process",
    "firewall": "Manage Network Security",
    "containers": "Run Containers"
};

// Set practice category
function setPracticeCategory(cat, btn) {
    selectedCategory = cat;
    document.querySelectorAll(".category-btn").forEach((b) => {
        b.classList.remove("active");
        b.style.opacity = "1";
    });
    
    if (btn) {
        btn.classList.add("active");
    }
    
    // Highlight selected category
    document.querySelectorAll(".category-btn").forEach((b) => {
        if (b.dataset.cat !== cat && cat !== "all") {
            b.style.opacity = "0.7";
        }
    });
    
    // Update exam category display
    const categoryName = cat === "all" ? "All RHCSA Topics" : categoryMap[cat] || cat;
    document.getElementById("examCategory").textContent = categoryName;
}

// Start exam
function startExam(numTasks = 20) {
    tasks = selectRandomTasks(numTasks);
    examSubmitted = false;
    timeRemaining = 9000;
    startTime = new Date();
    
    // Update UI
    document.getElementById("welcomeScreen").classList.add("hidden");
    document.getElementById("examInterface").classList.remove("hidden");
    document.getElementById("examNumber").textContent = `Exam #${currentExamNumber}`;
    
    // Set category display
    const categoryName = selectedCategory === "all" ? "All RHCSA Topics" : categoryMap[selectedCategory] || selectedCategory;
    document.getElementById("examCategory").textContent = categoryName;
    
    // Render tasks and start timer
    renderTasks();
    startTimer();
    updateTimeCheckpoints();
}

// Quick practice mode
function startQuickPractice() {
    startExam(5);
}

// Select random tasks based on category
function selectRandomTasks(numTasks) {
    let pool = [];
    
    // Filter by category if not "all"
    if (selectedCategory !== "all") {
        pool = questionPool.filter(q => q.category === selectedCategory);
        if (pool.length === 0) {
            pool = questionPool; // Fallback to all if category empty
        }
    } else {
        pool = [...questionPool];
    }
    
    // Shuffle and select
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(numTasks, shuffled.length));
    
    // Add IDs and initial state
    return selected.map((task, index) => ({
        id: index + 1,
        description: task.desc,
        points: task.points || 15,
        expectedCommands: task.cmds || [],
        verifyCommands: task.verify || [],
        hint: task.hint || "",
        category: task.category || "general",
        difficulty: task.difficulty || "medium",
        submitted: false,
        solution: "",
        score: 0,
        status: "",
        statusMessage: "",
        timeSpent: 0
    }));
}

// Render tasks
function renderTasks() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = tasks.map(task => `
        <div class="task-card ${task.submitted ? 'submitted' : ''}" id="task-${task.id}">
            <div class="task-header">
                <div class="task-number">Task ${task.id}</div>
                <div class="task-points">${task.points} points</div>
            </div>
            <div class="task-description">${task.description}</div>
            
            <div class="task-meta">
                <span class="task-category">${categoryMap[task.category] || task.category}</span>
                <span class="task-difficulty ${task.difficulty}">${task.difficulty}</span>
            </div>
            
            <div class="solution-input">
                <textarea 
                    class="solution-textarea" 
                    id="solution-${task.id}" 
                    placeholder="Enter your solution commands here (one per line)...\nExample:\nuseradd john\necho 'john:redhat' | chpasswd\nid john"
                    ${task.submitted ? 'disabled' : ''}
                    oninput="updateTimeSpent(${task.id})"
                >${task.solution || ''}</textarea>
                
                <div class="task-actions">
                    <button class="submit-solution-btn" 
                        onclick="submitSolution(${task.id})"
                        ${task.submitted ? 'disabled' : ''}>
                        ${task.submitted ? '✓ Submitted' : '📤 Submit Solution'}
                    </button>
                    <button class="hint-btn" onclick="toggleHint(${task.id}, this)">
                        ${document.getElementById(`hint-${task.id}`)?.classList.contains('visible') ? 'Hide Hint' : 'Show Hint'}
                    </button>
                    <button class="answer-btn" onclick="toggleAnswer(${task.id}, this)">
                        ${document.getElementById(`answer-${task.id}`)?.classList.contains('visible') ? 'Hide Answer' : 'Show Answer'}
                    </button>
                </div>
                
                <div class="solution-status ${task.status || ''}" id="status-${task.id}">
                    ${task.statusMessage || ''}
                </div>
            </div>
            
            <div class="hint-box" id="hint-${task.id}">
                💡 <strong>Hint:</strong> ${task.hint}
            </div>
            <div class="answer-box" id="answer-${task.id}">
                📝 <strong>Expected Solution:</strong>\n${(task.expectedCommands || []).map(cmd => `• ${cmd}`).join('\n')}
                ${task.verifyCommands && task.verifyCommands.length > 0 ? `\n\n✅ <strong>Verification Commands:</strong>\n${task.verifyCommands.map(cmd => `• ${cmd}`).join('\n')}` : ''}
            </div>
        </div>
    `).join('');
    
    updateProgress();
}

// Update time spent on task
function updateTimeSpent(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.submitted) {
        if (!task.startTime) {
            task.startTime = new Date();
        }
    }
}

// Submit solution for a single task
function submitSolution(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const solutionTextarea = document.getElementById(`solution-${taskId}`);
    const solution = solutionTextarea.value.trim();
    
    if (!solution) {
        alert("Please enter your solution commands!");
        return;
    }
    
    // Calculate time spent
    if (task.startTime) {
        task.timeSpent = Math.floor((new Date() - task.startTime) / 1000);
    }
    
    task.solution = solution;
    task.submitted = true;
    
    // Check solution
    const result = checkSolution(task, solution);
    task.score = result.score;
    task.status = result.status;
    task.statusMessage = result.message;
    
    // Update UI
    renderTasks();
}

// Check solution correctness
function checkSolution(task, solution) {
    const solutionLines = solution.toLowerCase()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    
    const expectedCommands = (task.expectedCommands || []).map(cmd => 
        cmd.toLowerCase().replace(/\s+/g, ' ').trim()
    );
    
    if (expectedCommands.length === 0) {
        return {
            score: task.points,
            status: 'correct',
            message: `✅ CORRECT! Full marks: ${task.points}/${task.points} points`
        };
    }
    
    let matched = 0;
    let total = expectedCommands.length;
    
    // Check each expected command
    expectedCommands.forEach(expected => {
        const essentialParts = expected
            .split(' ')
            .filter(part => part && !part.includes('...') && part.length > 2);
        
        const found = solutionLines.some(line => {
            const lineNormalized = line.replace(/\s+/g, ' ');
            return essentialParts.every(part => lineNormalized.includes(part));
        });
        
        if (found) matched++;
    });
    
    const percentage = matched / total;
    let score, status, message;
    
    if (percentage >= 0.9) {
        score = task.points;
        status = 'correct';
        message = `✅ CORRECT! Full marks: ${task.points}/${task.points} points`;
    } else if (percentage >= 0.5) {
        score = Math.floor(task.points * 0.5);
        status = 'partial';
        message = `⚠️ PARTIAL: ${score}/${task.points} points. Matched ${matched}/${total} commands`;
    } else {
        score = 0;
        status = 'incorrect';
        message = `❌ INCORRECT: 0/${task.points} points. Matched ${matched}/${total} commands`;
    }
    
    return { score, status, message };
}

// Toggle hint visibility
function toggleHint(taskId, button) {
    const hintBox = document.getElementById(`hint-${taskId}`);
    if (hintBox) {
        hintBox.classList.toggle('visible');
        if (button) {
            button.textContent = hintBox.classList.contains('visible') ? 'Hide Hint' : 'Show Hint';
        }
    }
}

// Toggle answer visibility
function toggleAnswer(taskId, button) {
    const answerBox = document.getElementById(`answer-${taskId}`);
    if (answerBox) {
        answerBox.classList.toggle('visible');
        if (button) {
            button.textContent = answerBox.classList.contains('visible') ? 'Hide Answer' : 'Show Answer';
        }
    }
}

// Update progress stats
function updateProgress() {
    const submitted = tasks.filter(t => t.submitted).length;
    const total = tasks.length;
    const currentScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
    const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
    
    // Count statuses
    const correct = tasks.filter(t => t.status === 'correct').length;
    const partial = tasks.filter(t => t.status === 'partial').length;
    const incorrect = tasks.filter(t => t.status === 'incorrect').length;
    const unanswered = tasks.filter(t => !t.submitted).length;
    
    // Update UI
    document.getElementById('submittedCount').textContent = submitted;
    document.getElementById('currentScore').textContent = currentScore;
    document.getElementById('progressPercent').textContent = `${Math.round((submitted / total) * 100)}%`;
    document.getElementById('progressBar').style.width = `${(submitted / total) * 100}%`;
    
    document.getElementById('correctCount').textContent = correct;
    document.getElementById('partialCount').textContent = partial;
    document.getElementById('incorrectCount').textContent = incorrect;
    document.getElementById('unansweredCount').textContent = unanswered;
    
    // Update time per task
    if (submitted > 0) {
        const timeElapsed = 9000 - timeRemaining;
        const avgTime = Math.floor(timeElapsed / submitted / 60);
        const seconds = Math.floor((timeElapsed / submitted) % 60);
        document.getElementById('timePerTask').textContent = `${avgTime}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update time checkpoints
    updateTimeCheckpoints();
}

// Update time checkpoints
function updateTimeCheckpoints() {
    const submitted = tasks.filter(t => t.submitted).length;
    const timeElapsed = 9000 - timeRemaining;
    const minutesElapsed = Math.floor(timeElapsed / 60);
    
    // Update checkpoint statuses
    const checkpoints = [
        { id: 'checkpoint1', target: 6, time: 30 },
        { id: 'checkpoint2', target: 12, time: 60 },
        { id: 'checkpoint3', target: 17, time: 90 },
        { id: 'checkpoint4', target: tasks.length, time: 120 },
        { id: 'checkpoint5', target: tasks.length, time: 135 }
    ];
    
    checkpoints.forEach(checkpoint => {
        const element = document.getElementById(checkpoint.id);
        if (element) {
            if (minutesElapsed >= checkpoint.time) {
                element.textContent = submitted >= checkpoint.target ? '✅' : '❌';
            } else {
                element.textContent = '⏳';
            }
        }
    });
    
    // Update time status
    const timeStatus = document.getElementById('timeStatus');
    const pace = submitted / (minutesElapsed || 1);
    
    if (pace >= 0.2) { // 12+ tasks per hour
        timeStatus.textContent = 'Excellent Pace';
        timeStatus.style.color = '#10b981';
    } else if (pace >= 0.15) { // 9+ tasks per hour
        timeStatus.textContent = 'Good Pace';
        timeStatus.style.color = '#f59e0b';
    } else {
        timeStatus.textContent = 'Need to Speed Up';
        timeStatus.style.color = '#ef4444';
    }
}

// Start timer
function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('⏰ Time is up! Submitting exam automatically.');
            submitExam();
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const timerEl = document.getElementById('timerDisplay');
    timerEl.textContent = display;
    
    // Update timer color based on time remaining
    timerEl.className = 'timer-display';
    if (timeRemaining <= 1800) { // 30 minutes
        timerEl.classList.add('warning');
    }
    if (timeRemaining <= 900) { // 15 minutes
        timerEl.classList.add('critical');
    }
}

// Submit exam
function submitExam() {
    if (examSubmitted) return;
    
    const unanswered = tasks.filter(t => !t.submitted).length;
    const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
    
    if (unanswered > 0) {
        if (!confirm(`⚠️ You have ${unanswered} unanswered task(s).\n\nUnanswered tasks will score 0 points.\n\nSubmit exam anyway?`)) {
            return;
        }
    } else {
        if (!confirm('📤 Ready to submit your exam for grading?\n\nYou cannot change answers after submission.')) {
            return;
        }
    }
    
    examSubmitted = true;
    clearInterval(timerInterval);
    
    // Calculate final score
    const totalScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
    const timeUsed = 9000 - timeRemaining;
    const passed = totalScore >= 210;
    
    // Save to history
    examHistory.push({
        examNumber: currentExamNumber,
        score: totalScore,
        passed: passed,
        date: new Date().toISOString(),
        timeUsed: timeUsed,
        category: selectedCategory,
        tasks: tasks.map(t => ({
            id: t.id,
            description: t.description,
            points: t.points,
            score: t.score || 0,
            status: t.submitted ? t.status : 'unanswered',
            category: t.category,
            timeSpent: t.timeSpent || 0
        }))
    });
    
    // Save to localStorage
    saveHistory();
    currentExamNumber++;
    
    // Show results
    showResults();
}

// Show results modal
function showResults() {
    const totalScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
    const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
    const passed = totalScore >= 210;
    const timeUsed = 9000 - timeRemaining;
    const minutesUsed = Math.floor(timeUsed / 60);
    
    // Update score display
    document.getElementById('finalScore').textContent = `${totalScore}/${totalPoints}`;
    document.getElementById('finalScore').style.color = passed ? '#10b981' : '#ef4444';
    
    // Update pass badge
    const passBadge = document.getElementById('passBadge');
    if (passed) {
        passBadge.className = 'pass-badge passed';
        passBadge.innerHTML = `🎉 PASSED! ${Math.round((totalScore / totalPoints) * 100)}%`;
    } else {
        passBadge.className = 'pass-badge failed';
        passBadge.innerHTML = `❌ FAILED (Need 210+). ${Math.round((totalScore / totalPoints) * 100)}%`;
    }
    
    // Update performance stats
    const submitted = tasks.filter(t => t.submitted).length;
    const accuracy = submitted > 0 ? Math.round((tasks.filter(t => t.status === 'correct').length / submitted) * 100) : 0;
    const avgTimePerTask = submitted > 0 ? (minutesUsed / submitted).toFixed(1) : 0;
    
    document.getElementById('accuracyRate').textContent = `${accuracy}%`;
    document.getElementById('timeUsed').textContent = `${minutesUsed} min`;
    document.getElementById('taskSpeed').textContent = `${avgTimePerTask} min/task`;
    
    // Update task breakdown
    const breakdown = document.getElementById('resultBreakdown');
    breakdown.innerHTML = tasks.map(task => {
        let icon, statusClass, scoreText;
        
        if (!task.submitted) {
            icon = '○';
            statusClass = 'unanswered';
            scoreText = `0/${task.points}`;
        } else if (task.status === 'correct') {
            icon = '✓';
            statusClass = 'correct';
            scoreText = `${task.score}/${task.points}`;
        } else if (task.status === 'partial') {
            icon = '◐';
            statusClass = 'partial';
            scoreText = `${task.score}/${task.points}`;
        } else {
            icon = '✗';
            statusClass = 'incorrect';
            scoreText = `0/${task.points}`;
        }
        
        return `
            <div class="breakdown-item ${statusClass}">
                <div>
                    <strong>${icon} Task ${task.id}:</strong> ${task.description.substring(0, 50)}...
                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                        ${categoryMap[task.category] || task.category} • ${task.timeSpent || 0}s spent
                    </div>
                </div>
                <div style="font-weight: bold; font-size: 18px;">
                    ${scoreText}
                </div>
            </div>
        `;
    }).join('');
    
    // Show weakness analysis
    const weaknessList = document.getElementById('weaknessList');
    const categories = {};
    
    tasks.forEach(task => {
        if (task.status !== 'correct' || !task.submitted) {
            categories[task.category] = (categories[task.category] || 0) + 1;
        }
    });
    
    const weaknesses = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, count]) => `<li>${categoryMap[cat] || cat}: ${count} weak task(s)</li>`)
        .join('');
    
    weaknessList.innerHTML = weaknesses ? `<ul>${weaknesses}</ul>` : '<p>No significant weaknesses found! Great job!</p>';
    
    // Show modal
    document.getElementById('resultsModal').classList.remove('hidden');
}

// Restart exam
function restartExam() {
    document.getElementById('resultsModal').classList.add('hidden');
    document.getElementById('examInterface').classList.add('hidden');
    document.getElementById('welcomeScreen').classList.remove('hidden');
    displayHistory();
}

// Review exam answers
function reviewExam() {
    document.getElementById('resultsModal').classList.add('hidden');
    
    // Highlight tasks based on status
    tasks.forEach(task => {
        const card = document.getElementById(`task-${task.id}`);
        if (card) {
            if (!task.submitted) {
                card.style.border = '3px solid #6b7280';
                card.style.background = '#f9fafb';
            } else if (task.status === 'incorrect') {
                card.style.border = '3px solid #ef4444';
                card.style.background = '#fef2f2';
            } else if (task.status === 'partial') {
                card.style.border = '3px solid #f59e0b';
                card.style.background = '#fffbeb';
            }
        }
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Practice weakness areas
function practiceWeakness() {
    const categories = {};
    
    tasks.forEach(task => {
        if (task.status !== 'correct' || !task.submitted) {
            categories[task.category] = (categories[task.category] || 0) + 1;
        }
    });
    
    if (Object.keys(categories).length === 0) {
        alert('No weaknesses found! You\'re ready for the exam!');
        return;
    }
    
    const weakestCategory = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    setPracticeCategory(weakestCategory);
    document.getElementById('resultsModal').classList.add('hidden');
    document.getElementById('examInterface').classList.add('hidden');
    document.getElementById('welcomeScreen').classList.remove('hidden');
    
    alert(`Practice mode set to: ${categoryMap[weakestCategory] || weakestCategory}\n\nClick "Start New Exam" to practice this area.`);
}

// Download results
function downloadResults() {
    const totalScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
    const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
    const passed = totalScore >= 210;
    const timeUsed = Math.floor((9000 - timeRemaining) / 60);
    
    let report = `RHCSA EX300 Exam Results - Exam #${currentExamNumber - 1}\n`;
    report += '='.repeat(50) + '\n\n';
    report += `Date: ${new Date().toLocaleString()}\n`;
    report += `Category: ${selectedCategory === 'all' ? 'All RHCSA Topics' : categoryMap[selectedCategory]}\n`;
    report += `Final Score: ${totalScore}/${totalPoints} (${Math.round((totalScore / totalPoints) * 100)}%)\n`;
    report += `Result: ${passed ? 'PASSED ✓' : 'FAILED ✗'}\n`;
    report += `Passing Score: 210/300 (70%)\n`;
    report += `Time Used: ${timeUsed} minutes\n\n`;
    report += `Task Breakdown:\n`;
    report += '-'.repeat(50) + '\n\n';
    
    tasks.forEach(task => {
        const status = !task.submitted ? 'UNANSWERED' :
                      task.status === 'correct' ? 'CORRECT' :
                      task.status === 'partial' ? 'PARTIAL' : 'INCORRECT';
        
        report += `Task ${task.id}: ${status} - ${task.score || 0}/${task.points} points\n`;
        report += `Description: ${task.description}\n`;
        if (task.solution) {
            report += `Your Solution:\n${task.solution}\n`;
        }
        report += `Expected Solution:\n${(task.expectedCommands || []).join('\n')}\n`;
        report += `\n`;
    });
    
    const correct = tasks.filter(t => t.status === 'correct').length;
    const partial = tasks.filter(t => t.status === 'partial').length;
    const incorrect = tasks.filter(t => t.status === 'incorrect').length;
    const unanswered = tasks.filter(t => !t.submitted).length;
    
    report += `\nSummary:\n`;
    report += '-'.repeat(50) + '\n';
    report += `Correct: ${correct}\n`;
    report += `Partial: ${partial}\n`;
    report += `Incorrect: ${incorrect}\n`;
    report += `Unanswered: ${unanswered}\n`;
    report += `Accuracy: ${correct + partial}/${tasks.length} (${Math.round(((correct + partial) / tasks.length) * 100)}%)\n`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RHCSA_Exam_${currentExamNumber - 1}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('rhcsaExamHistory', JSON.stringify(examHistory));
}

// Load history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('rhcsaExamHistory');
    if (saved) {
        try {
            examHistory = JSON.parse(saved);
            currentExamNumber = examHistory.length + 1;
            displayHistory();
        } catch (e) {
            console.error('Error loading history:', e);
        }
    }
}

// Display history
function displayHistory() {
    const historyList = document.getElementById('examHistoryList');
    const historySection = document.getElementById('examHistorySection');
    
    if (examHistory.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    
    // Show last 10 exams
    const recentExams = examHistory.slice(-10).reverse();
    
    historyList.innerHTML = recentExams.map(exam => {
        const passClass = exam.score >= 210 ? 'passed' : 'failed';
        const passText = exam.score >= 210 ? 'PASS' : 'FAIL';
        const date = new Date(exam.date).toLocaleDateString();
        const category = exam.category === 'all' ? 'All Topics' : categoryMap[exam.category] || exam.category;
        
        return `
            <div class="history-item">
                <div>
                    <strong>Exam #${exam.examNumber}</strong>
                    <span style="color: #6b7280; font-size: 14px; margin-left: 10px;">
                        ${date} • ${category}
                    </span>
                </div>
                <div class="history-score ${passClass}">
                    ${exam.score}/300 (${passText})
                </div>
            </div>
        `;
    }).join('');
    
    // Update statistics
    const totalAttempts = examHistory.length;
    const highestScore = Math.max(...examHistory.map(e => e.score));
    const avgScore = Math.round(examHistory.reduce((sum, e) => sum + e.score, 0) / totalAttempts);
    const passCount = examHistory.filter(e => e.score >= 210).length;
    const passRate = Math.round((passCount / totalAttempts) * 100);
    
    document.getElementById('totalAttempts').textContent = totalAttempts;
    document.getElementById('highestScore').textContent = `${highestScore}/300`;
    document.getElementById('avgScore').textContent = `${avgScore}/300`;
    document.getElementById('passRate').textContent = `${passRate}%`;
    
    // Draw chart
    drawChart();
}

// Draw score chart
function drawChart() {
    const chart = document.getElementById('scoreChart');
    const lastExams = examHistory.slice(-8);
    
    if (lastExams.length === 0) {
        chart.innerHTML = '<div style="text-align: center; padding: 50px; color: #6b7280;">No exam data yet</div>';
        return;
    }
    
    const maxScore = 300;
    const barWidth = 100 / lastExams.length;
    
    chart.innerHTML = lastExams.map((exam, index) => {
        const height = (exam.score / maxScore) * 150;
        const color = exam.score >= 210 ? '#10b981' : '#ef4444';
        
        return `
            <div class="chart-bar" style="height: ${height}px; background: ${color}; width: ${barWidth}%;">
                <div class="chart-value">${exam.score}</div>
                <div class="chart-label">#${exam.examNumber}</div>
            </div>
        `;
    }).join('');
}

// Reset history
function resetHistory() {
    if (confirm('⚠️ This will delete all your exam history. Are you sure?')) {
        localStorage.removeItem('rhcsaExamHistory');
        examHistory = [];
        currentExamNumber = 1;
        displayHistory();
        alert('✅ History reset successfully!');
    }
}

// ===================== COMPLETE RHCSA QUESTION POOL =====================
// Organized by Red Hat book chapters/syllabus

const questionPool = [
    // ========== 1. SYSTEM ACCESS & COMMAND LINE ==========
    {
        desc: "Access the command line using local console and switch between virtual terminals (tty1 to tty3).",
        points: 10,
        cmds: [
            "Ctrl+Alt+F1 # Switch to tty1",
            "Ctrl+Alt+F2 # Switch to tty2",
            "Ctrl+Alt+F3 # Switch to tty3",
            "who # Check current terminal"
        ],
        verify: ["who", "tty"],
        hint: "Use Ctrl+Alt+F[1-6] for virtual terminals",
        category: "system-access",
        difficulty: "easy"
    },
    {
        desc: "Execute basic commands: check current directory, list files, check system uptime, and view calendar.",
        points: 10,
        cmds: [
            "pwd",
            "ls -la",
            "uptime",
            "cal",
            "date"
        ],
        verify: ["pwd", "ls", "uptime"],
        hint: "pwd = print working directory, ls -la = detailed list",
        category: "system-access",
        difficulty: "easy"
    },
    
    // ========== 2. MANAGE FILES FROM COMMAND LINE ==========
    {
        desc: "Navigate Linux file system: list contents of /etc, /var/log, check /home directory, and verify /tmp permissions.",
        points: 15,
        cmds: [
            "ls -l /etc | head -10",
            "ls -l /var/log | head -10",
            "ls -ld /home",
            "ls -ld /tmp",
            "file /etc/passwd"
        ],
        verify: ["ls -ld /tmp", "file /etc/passwd"],
        hint: "ls -ld shows directory permissions, file shows file type",
        category: "files-directories",
        difficulty: "easy"
    },
    {
        desc: "Create directory structure: /projects/{docs,src,bin} with proper permissions 755.",
        points: 15,
        cmds: [
            "mkdir -p /projects/{docs,src,bin}",
            "chmod 755 /projects",
            "chmod 755 /projects/*",
            "ls -ld /projects",
            "ls -l /projects"
        ],
        verify: ["ls -ld /projects", "ls -l /projects"],
        hint: "mkdir -p creates parent dirs, brace expansion creates multiple",
        category: "files-directories",
        difficulty: "easy"
    },
    {
        desc: "Copy /etc/hosts to /tmp preserving all attributes, then create symbolic link to it.",
        points: 15,
        cmds: [
            "cp -a /etc/hosts /tmp/hosts.backup",
            "ln -s /tmp/hosts.backup /tmp/hosts.link",
            "ls -li /etc/hosts /tmp/hosts.backup /tmp/hosts.link"
        ],
        verify: ["ls -li /etc/hosts /tmp/hosts.backup", "readlink /tmp/hosts.link"],
        hint: "cp -a preserves all, ln -s creates symbolic link",
        category: "files-directories",
        difficulty: "easy"
    },
    {
        desc: "Use shell expansions: list all .conf files in /etc, find files modified in last 24 hours in /var/log.",
        points: 15,
        cmds: [
            "ls /etc/*.conf | head -10",
            "find /var/log -type f -mtime -1 | head -10"
        ],
        verify: ["ls /etc/*.conf 2>/dev/null | wc -l", "find /var/log -type f -mtime -1 2>/dev/null | wc -l"],
        hint: "* wildcard matches any characters, -mtime -1 = modified last 24h",
        category: "files-directories",
        difficulty: "medium"
    },
    
    // ========== 3. GET HELP IN RHEL ==========
    {
        desc: "Use man pages to learn about 'ls' command. Find option to list directory contents with inode numbers.",
        points: 10,
        cmds: [
            "man ls",
            "# Search for inode in man page",
            "ls -i /etc | head -5"
        ],
        verify: ["ls -i /etc/passwd", "whatis ls"],
        hint: "man command opens manual, / searches in man page",
        category: "system-access",
        difficulty: "easy"
    },
    {
        desc: "Use --help option with common commands and check whatis/apropos for command information.",
        points: 10,
        cmds: [
            "ls --help | head -20",
            "whatis ls",
            "apropos directory | head -10"
        ],
        verify: ["whatis ls grep", "apropos search"],
        hint: "--help shows brief help, whatis shows one-line description",
        category: "system-access",
        difficulty: "easy"
    },
    
    // ========== 4. CREATE, VIEW, EDIT TEXT FILES ==========
    {
        desc: "Create shell script /usr/local/bin/backup.sh that backs up /etc to /backup with date stamp.",
        points: 20,
        cmds: [
            "cat > /usr/local/bin/backup.sh << 'EOF'\n#!/bin/bash\nBACKUP_DIR=\"/backup/backup_$(date +%Y%m%d)\"\nmkdir -p \"$BACKUP_DIR\"\ncp -a /etc \"$BACKUP_DIR\"\necho \"Backup completed: $BACKUP_DIR\"\nEOF",
            "chmod +x /usr/local/bin/backup.sh",
            "/usr/local/bin/backup.sh"
        ],
        verify: ["ls -ld /usr/local/bin/backup.sh", "ls -d /backup/*", "/usr/local/bin/backup.sh"],
        hint: "heredoc (<< 'EOF') creates multi-line file, $(date) inserts current date",
        category: "scripting",
        difficulty: "medium"
    },
    {
        desc: "Redirect command output: save process list to /tmp/processes.txt and append current date to /tmp/log.txt.",
        points: 15,
        cmds: [
            "ps aux > /tmp/processes.txt",
            "date >> /tmp/log.txt",
            "wc -l /tmp/processes.txt",
            "tail -1 /tmp/log.txt"
        ],
        verify: ["ls -l /tmp/processes.txt", "tail -1 /tmp/log.txt"],
        hint: "> redirects stdout (overwrites), >> appends",
        category: "scripting",
        difficulty: "easy"
    },
    
    // ========== 5. MANAGE LOCAL USERS AND GROUPS ==========
    {
        desc: "Create user 'alice' with UID 1500, home directory /home/alice, shell /bin/bash, and set password.",
        points: 15,
        cmds: [
            "useradd -u 1500 -m -s /bin/bash alice",
            "echo 'alice:password123' | chpasswd",
            "id alice",
            "ls -ld /home/alice"
        ],
        verify: ["id alice", "getent passwd alice", "ls -ld /home/alice"],
        hint: "useradd -m creates home dir, -s sets shell, -u sets UID",
        category: "users-groups",
        difficulty: "easy"
    },
    {
        desc: "Create group 'developers' with GID 3000, add users 'alice' and 'bob' to this group.",
        points: 15,
        cmds: [
            "groupadd -g 3000 developers",
            "usermod -aG developers alice",
            "usermod -aG developers bob",
            "getent group developers"
        ],
        verify: ["getent group developers", "id alice", "id bob"],
        hint: "usermod -aG adds to supplementary group (preserves existing)",
        category: "users-groups",
        difficulty: "easy"
    },
    {
        desc: "Set password aging for user 'charlie': max 90 days, min 7 days, warn 14 days before expiry.",
        points: 15,
        cmds: [
            "useradd charlie",
            "chage -M 90 -m 7 -W 14 charlie",
            "chage -l charlie"
        ],
        verify: ["chage -l charlie | grep 'Maximum'", "chage -l charlie | grep 'Minimum'"],
        hint: "chage -M sets max days, -m min days, -W warn days",
        category: "users-groups",
        difficulty: "medium"
    },
    {
        desc: "Lock user account 'inactive' and unlock it after verifying.",
        points: 10,
        cmds: [
            "useradd inactive",
            "passwd -l inactive",
            "passwd -S inactive",
            "passwd -u inactive",
            "passwd -S inactive"
        ],
        verify: ["passwd -S inactive"],
        hint: "passwd -l locks, -u unlocks, -S shows status",
        category: "users-groups",
        difficulty: "easy"
    },
    {
        desc: "Gain superuser access using sudo and su commands. Check sudo privileges for current user.",
        points: 10,
        cmds: [
            "sudo whoami",
            "sudo -l",
            "su - -c 'whoami'"
        ],
        verify: ["sudo whoami", "sudo -l"],
        hint: "sudo runs command as root, su - switches to root shell",
        category: "users-groups",
        difficulty: "easy"
    },
    
    // ========== 6. CONTROL ACCESS TO FILES ==========
    {
        desc: "Set permissions on /data/secret.txt: owner rw-, group r--, others --- (chmod 640).",
        points: 10,
        cmds: [
            "mkdir -p /data",
            "echo 'secret data' > /data/secret.txt",
            "chmod 640 /data/secret.txt",
            "ls -l /data/secret.txt"
        ],
        verify: ["ls -l /data/secret.txt", "stat -c '%a' /data/secret.txt"],
        hint: "chmod 640 = rw-r----- (owner: 6, group: 4, others: 0)",
        category: "permissions-acl",
        difficulty: "easy"
    },
    {
        desc: "Set SGID bit on /shared directory so new files inherit group ownership.",
        points: 15,
        cmds: [
            "mkdir -p /shared",
            "chmod 2775 /shared",
            "chown :developers /shared",
            "ls -ld /shared"
        ],
        verify: ["ls -ld /shared | grep '^d...s'", "stat -c '%a' /shared"],
        hint: "chmod 2775 = rwxrwsr-x (2 = SGID, 775 = permissions)",
        category: "permissions-acl",
        difficulty: "medium"
    },
    {
        desc: "Set ACL for user 'david' on /data/file.txt: rwx permissions. Set default ACL for new files.",
        points: 20,
        cmds: [
            "touch /data/file.txt",
            "setfacl -m u:david:rwx /data/file.txt",
            "setfacl -m d:u:david:rwx /data",
            "getfacl /data/file.txt",
            "getfacl /data"
        ],
        verify: ["getfacl /data/file.txt | grep david", "getfacl /data | grep default"],
        hint: "setfacl -m modifies ACL, d: sets default ACL",
        category: "permissions-acl",
        difficulty: "medium"
    },
    {
        desc: "Set umask to 027 for current session and verify by creating test file and directory.",
        points: 10,
        cmds: [
            "umask 027",
            "touch /tmp/testfile",
            "mkdir /tmp/testdir",
            "ls -ld /tmp/testfile /tmp/testdir"
        ],
        verify: ["umask", "ls -l /tmp/testfile", "ls -ld /tmp/testdir"],
        hint: "umask 027 = files: 640 (666-027), dirs: 750 (777-027)",
        category: "permissions-acl",
        difficulty: "medium"
    },
    
    // ========== 7. MONITOR AND MANAGE PROCESSES ==========
    {
        desc: "List all running processes, filter for 'sshd', show process tree, check CPU and memory usage.",
        points: 15,
        cmds: [
            "ps aux | head -20",
            "ps aux | grep sshd",
            "pstree | head -20",
            "top -bn1 | head -20"
        ],
        verify: ["ps aux | grep -c sshd", "pstree -p | head -10"],
        hint: "ps aux shows all processes, pstree shows hierarchy",
        category: "processes",
        difficulty: "easy"
    },
    {
        desc: "Run sleep command in background, bring to foreground, then kill it.",
        points: 15,
        cmds: [
            "sleep 300 &",
            "jobs",
            "fg %1",
            "Ctrl+C # to kill",
            "kill %1 # if still running"
        ],
        verify: ["jobs", "ps aux | grep sleep"],
        hint: "& runs in background, fg brings to foreground, kill terminates",
        category: "processes",
        difficulty: "easy"
    },
    {
        desc: "Change priority of process PID 1234 to nice value 10. Start new process with low priority.",
        points: 20,
        cmds: [
            "renice -n 10 -p 1234",
            "nice -n 19 sleep 100 &",
            "ps -o pid,ni,comm -p 1234 $(pgrep sleep)"
        ],
        verify: ["ps -o pid,ni,comm -p 1234", "ps -o pid,ni,comm $(pgrep sleep)"],
        hint: "renice changes existing process, nice starts new with priority",
        category: "processes",
        difficulty: "medium"
    },
    {
        desc: "Find and kill zombie processes. Force kill unresponsive process with PID 9999.",
        points: 15,
        cmds: [
            "ps aux | grep 'Z'",
            "kill -9 9999",
            "pkill -9 processname"
        ],
        verify: ["ps aux | grep -c 'Z'", "ps -p 9999 || echo 'killed'"],
        hint: "kill -9 sends SIGKILL (cannot be ignored), pkill kills by name",
        category: "processes",
        difficulty: "medium"
    },
    
    // ========== 8. CONTROL SERVICES AND DAEMONS ==========
    {
        desc: "Check status of httpd service, enable it to start at boot, and start it now.",
        points: 15,
        cmds: [
            "systemctl status httpd",
            "systemctl enable httpd",
            "systemctl start httpd",
            "systemctl is-active httpd",
            "systemctl is-enabled httpd"
        ],
        verify: ["systemctl is-active httpd", "systemctl is-enabled httpd"],
        hint: "systemctl enable makes persistent, start runs now",
        category: "services-daemons",
        difficulty: "easy"
    },
    {
        desc: "List all active services, check failed services, view service dependencies.",
        points: 15,
        cmds: [
            "systemctl list-units --type=service --state=running",
            "systemctl --failed",
            "systemctl list-dependencies httpd"
        ],
        verify: ["systemctl --failed", "systemctl list-units --type=service | head -20"],
        hint: "systemctl --failed shows only failed services",
        category: "services-daemons",
        difficulty: "easy"
    },
    {
        desc: "Change default target to multi-user (no GUI) and verify.",
        points: 15,
        cmds: [
            "systemctl get-default",
            "systemctl set-default multi-user.target",
            "systemctl get-default"
        ],
        verify: ["systemctl get-default", "systemctl list-units --type=target"],
        hint: "multi-user.target = text mode, graphical.target = GUI mode",
        category: "services-daemons",
        difficulty: "easy"
    },
    {
        desc: "Mask service to prevent starting, then unmask it.",
        points: 10,
        cmds: [
            "systemctl mask atd",
            "systemctl status atd",
            "systemctl unmask atd"
        ],
        verify: ["systemctl is-enabled atd", "ls -l /etc/systemd/system/atd.service"],
        hint: "mask prevents ALL starting (even manual), disable only prevents auto-start",
        category: "services-daemons",
        difficulty: "medium"
    },
    
    // ========== 9. CONFIGURE AND SECURE SSH ==========
    {
        desc: "Connect to remote server server2.example.com via SSH and run command remotely.",
        points: 10,
        cmds: [
            "ssh server2.example.com 'hostname'",
            "ssh server2.example.com 'uptime'"
        ],
        verify: ["ssh server2.example.com 'whoami'"],
        hint: "ssh user@host command runs command remotely",
        category: "ssh",
        difficulty: "easy"
    },
    {
        desc: "Generate SSH key pair and copy to remote server for passwordless login.",
        points: 20,
        cmds: [
            "ssh-keygen -t rsa -b 2048 -f ~/.ssh/id_rsa -N ''",
            "ssh-copy-id server2.example.com",
            "ssh server2.example.com 'date' # should not ask password"
        ],
        verify: ["ls -l ~/.ssh/id_rsa*", "ssh server2.example.com 'echo test'"],
        hint: "ssh-keygen creates keys, ssh-copy-id copies public key to remote",
        category: "ssh",
        difficulty: "medium"
    },
    {
        desc: "Configure SSH server: disable root login, change port to 2222, allow only specific users.",
        points: 25,
        cmds: [
            "sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config",
            "echo 'Port 2222' >> /etc/ssh/sshd_config",
            "echo 'AllowUsers alice bob' >> /etc/ssh/sshd_config",
            "systemctl restart sshd",
            "sshd -t # test config"
        ],
        verify: ["grep PermitRootLogin /etc/ssh/sshd_config", "grep Port /etc/ssh/sshd_config"],
        hint: "sshd -t tests config before restart, always backup config first",
        category: "ssh",
        difficulty: "hard"
    },
    
    // ========== 10. ANALYZE AND STORE LOGS ==========
    {
        desc: "View system logs from current boot, filter for error messages, and follow logs in real time.",
        points: 15,
        cmds: [
            "journalctl -b",
            "journalctl -p err -b",
            "journalctl --since '1 hour ago'",
            "# journalctl -f # for following (Ctrl+C to stop)"
        ],
        verify: ["journalctl -b | head -20", "journalctl -p err | head -10"],
        hint: "journalctl -b = current boot, -p = priority, -f = follow",
        category: "logging",
        difficulty: "easy"
    },
    {
        desc: "Check rsyslog configuration and view /var/log/messages for recent entries.",
        points: 15,
        cmds: [
            "cat /etc/rsyslog.conf | head -30",
            "tail -f /var/log/messages",
            "grep -i error /var/log/messages | tail -10"
        ],
        verify: ["tail -20 /var/log/messages", "ls -l /var/log/"],
        hint: "/var/log/messages = system messages, tail -f follows file",
        category: "logging",
        difficulty: "easy"
    },
    {
        desc: "Configure persistent journal storage and set max size to 1GB.",
        points: 20,
        cmds: [
            "mkdir -p /var/log/journal",
            "systemctl restart systemd-journald",
            "echo 'SystemMaxUse=1G' >> /etc/systemd/journald.conf",
            "journalctl --disk-usage"
        ],
        verify: ["ls -ld /var/log/journal", "journalctl --disk-usage"],
        hint: "SystemMaxUse controls max disk usage for journal",
        category: "logging",
        difficulty: "medium"
    },
    {
        desc: "Configure system time with chrony, set timezone to America/New_York.",
        points: 20,
        cmds: [
            "timedatectl set-timezone America/New_York",
            "timedatectl set-ntp true",
            "systemctl restart chronyd",
            "chronyc sources",
            "timedatectl"
        ],
        verify: ["timedatectl | grep 'Time zone'", "chronyc tracking"],
        hint: "timedatectl manages time/timezone, chronyc controls NTP",
        category: "logging",
        difficulty: "medium"
    },
    
    // ========== 11. MANAGE NETWORKING ==========
    {
        desc: "Configure static IP: 192.168.1.100/24, gateway 192.168.1.1, DNS 8.8.8.8 on eth0 using nmcli.",
        points: 25,
        cmds: [
            "nmcli connection show",
            "nmcli connection modify eth0 ipv4.addresses 192.168.1.100/24",
            "nmcli connection modify eth0 ipv4.gateway 192.168.1.1",
            "nmcli connection modify eth0 ipv4.dns 8.8.8.8",
            "nmcli connection modify eth0 ipv4.method manual",
            "nmcli connection up eth0"
        ],
        verify: ["ip addr show eth0", "ip route", "cat /etc/resolv.conf"],
        hint: "nmcli connection modify changes config, up activates",
        category: "networking",
        difficulty: "hard"
    },
    {
        desc: "Set hostname to server1.example.com and configure /etc/hosts with localhost entries.",
        points: 15,
        cmds: [
            "hostnamectl set-hostname server1.example.com",
            "echo '127.0.0.1 localhost localhost.localdomain' > /etc/hosts",
            "echo '192.168.1.100 server1.example.com server1' >> /etc/hosts",
            "hostnamectl"
        ],
        verify: ["hostnamectl", "cat /etc/hosts", "hostname"],
        hint: "hostnamectl sets persistent hostname, /etc/hosts for name resolution",
        category: "networking",
        difficulty: "easy"
    },
    {
        desc: "Check network connectivity: ping gateway, trace route to google.com, check listening ports.",
        points: 15,
        cmds: [
            "ping -c 4 192.168.1.1",
            "traceroute -n 8.8.8.8",
            "ss -tuln",
            "netstat -tulpn"
        ],
        verify: ["ping -c 2 8.8.8.8", "ss -tuln | grep :22"],
        hint: "ss shows socket statistics, -t = TCP, -u = UDP, -l = listening",
        category: "networking",
        difficulty: "medium"
    },
    {
        desc: "Add static route to network 10.0.0.0/8 via gateway 192.168.1.254.",
        points: 20,
        cmds: [
            "ip route add 10.0.0.0/8 via 192.168.1.254",
            "ip route show",
            "echo '10.0.0.0/8 via 192.168.1.254 dev eth0' >> /etc/sysconfig/network-scripts/route-eth0"
        ],
        verify: ["ip route | grep 10.0.0.0", "cat /etc/sysconfig/network-scripts/route-eth0"],
        hint: "ip route add adds route, file makes persistent across reboots",
        category: "networking",
        difficulty: "hard"
    },
    
    // ========== 12. ARCHIVE AND TRANSFER FILES ==========
    {
        desc: "Create compressed backup of /etc directory as /backup/etc-backup.tar.gz.",
        points: 15,
        cmds: [
            "tar -czf /backup/etc-backup.tar.gz -C /etc .",
            "ls -lh /backup/etc-backup.tar.gz",
            "tar -tzf /backup/etc-backup.tar.gz | head -10"
        ],
        verify: ["ls -l /backup/etc-backup.tar.gz", "file /backup/etc-backup.tar.gz"],
        hint: "tar -czf = create gzip compressed, -C changes directory before archiving",
        category: "archiving",
        difficulty: "easy"
    },
    {
        desc: "Create bzip2 compressed archive of /var/log as /backup/logs.tar.bz2.",
        points: 15,
        cmds: [
            "tar -cjf /backup/logs.tar.bz2 -C /var/log .",
            "tar -tjf /backup/logs.tar.bz2 | wc -l"
        ],
        verify: ["ls -lh /backup/logs.tar.bz2", "file /backup/logs.tar.bz2"],
        hint: "tar -cjf = bzip2 compression, -tjf = list bzip2 archive",
        category: "archiving",
        difficulty: "easy"
    },
    {
        desc: "Extract archive to /tmp and copy specific files from it.",
        points: 15,
        cmds: [
            "mkdir -p /tmp/extract",
            "tar -xzf /backup/etc-backup.tar.gz -C /tmp/extract",
            "cp /tmp/extract/hosts /tmp/",
            "ls -l /tmp/hosts"
        ],
        verify: ["ls -l /tmp/hosts", "ls /tmp/extract | head -10"],
        hint: "tar -xzf extracts gzip archive, -C extracts to directory",
        category: "archiving",
        difficulty: "easy"
    },
    {
        desc: "Transfer files securely with scp: copy /etc/hosts to remote server.",
        points: 15,
        cmds: [
            "scp /etc/hosts server2.example.com:/tmp/",
            "scp server2.example.com:/etc/passwd /tmp/"
        ],
        verify: ["ssh server2.example.com 'ls -l /tmp/hosts'"],
        hint: "scp copies files between systems over SSH",
        category: "archiving",
        difficulty: "medium"
    },
    {
        desc: "Synchronize directory /data to remote server using rsync with compression.",
        points: 20,
        cmds: [
            "rsync -avz /data/ server2.example.com:/backup/data/",
            "rsync -avz --delete /data/ server2.example.com:/backup/data/"
        ],
        verify: ["ssh server2.example.com 'ls -l /backup/data/'"],
        hint: "rsync -avz = archive, verbose, compress; --delete removes extra files",
        category: "archiving",
        difficulty: "hard"
    },
    
    // ========== 13. INSTALL AND UPDATE SOFTWARE ==========
    {
        desc: "Install httpd and vim packages, then list installed packages containing 'http'.",
        points: 15,
        cmds: [
            "dnf install -y httpd vim",
            "rpm -qa | grep http",
            "dnf list installed httpd"
        ],
        verify: ["rpm -q httpd vim", "which httpd"],
        hint: "dnf install -y installs without confirmation, rpm -q queries packages",
        category: "software",
        difficulty: "easy"
    },
    {
        desc: "Search for package providing 'ifconfig' command and install it.",
        points: 15,
        cmds: [
            "dnf provides */ifconfig",
            "dnf install -y net-tools",
            "ifconfig"
        ],
        verify: ["which ifconfig", "rpm -qf $(which ifconfig)"],
        hint: "dnf provides finds package for file, rpm -qf finds package owning file",
        category: "software",
        difficulty: "easy"
    },
    {
        desc: "Create custom repository file for local repository at /mnt/repo.",
        points: 20,
        cmds: [
            "cat > /etc/yum.repos.d/local.repo << 'EOF'\n[local]\nname=Local Repository\nbaseurl=file:///mnt/repo\nenabled=1\ngpgcheck=0\nEOF",
            "dnf repolist",
            "dnf --enablerepo=local list available"
        ],
        verify: ["cat /etc/yum.repos.d/local.repo", "dnf repolist | grep local"],
        hint: "Repository files go in /etc/yum.repos.d/, baseurl can be file://, http://, or ftp://",
        category: "software",
        difficulty: "medium"
    },
    {
        desc: "Update all packages, check for updates, view transaction history.",
        points: 15,
        cmds: [
            "dnf check-update",
            "dnf update -y",
            "dnf history",
            "dnf history info last"
        ],
        verify: ["dnf check-update | wc -l", "dnf history | head -10"],
        hint: "dnf check-update shows available updates without installing",
        category: "software",
        difficulty: "easy"
    },
    
    // ========== 14. ACCESS LINUX FILE SYSTEMS ==========
    {
        desc: "List block devices, identify filesystem types, and check disk usage.",
        points: 15,
        cmds: [
            "lsblk",
            "blkid",
            "df -h",
            "fdisk -l | head -30"
        ],
        verify: ["lsblk -f", "df -h /"],
        hint: "lsblk lists block devices, blkid shows filesystem UUIDs",
        category: "file-systems",
        difficulty: "easy"
    },
    {
        desc: "Mount USB drive /dev/sdb1 to /mnt/usb and check filesystem type.",
        points: 15,
        cmds: [
            "mkdir -p /mnt/usb",
            "mount /dev/sdb1 /mnt/usb",
            "df -h /mnt/usb",
            "umount /mnt/usb"
        ],
        verify: ["mount | grep /mnt/usb", "blkid /dev/sdb1"],
        hint: "mount attaches filesystem, umount detaches",
        category: "file-systems",
        difficulty: "easy"
    },
    {
        desc: "Configure /etc/fstab to auto-mount /dev/sdb1 at /data with ext4 filesystem.",
        points: 20,
        cmds: [
            "mkfs.ext4 /dev/sdb1",
            "mkdir -p /data",
            "echo '/dev/sdb1 /data ext4 defaults 0 0' >> /etc/fstab",
            "mount -a",
            "df -h /data"
        ],
        verify: ["cat /etc/fstab | grep /data", "df -h /data", "mount | grep /data"],
        hint: "/etc/fstab entries: device mountpoint fstype options dump pass",
        category: "file-systems",
        difficulty: "medium"
    },
    {
        desc: "Find files larger than 100MB in /var directory and list them by size.",
        points: 15,
        cmds: [
            "find /var -type f -size +100M 2>/dev/null",
            "find /var -type f -size +100M -exec ls -lh {} \\; 2>/dev/null | head -10"
        ],
        verify: ["find /var -type f -size +100M 2>/dev/null | wc -l"],
        hint: "find -size +100M finds >100MB files, 2>/dev/null suppresses errors",
        category: "file-systems",
        difficulty: "medium"
    },
    
    // ========== 15. IMPROVE COMMAND-LINE PRODUCTIVITY ==========
    {
        desc: "Create bash script that backs up files modified in last 7 days from /home to /backup.",
        points: 25,
        cmds: [
            "cat > /usr/local/bin/backup-recent.sh << 'EOF'\n#!/bin/bash\nBACKUP_DIR=\"/backup/backup_$(date +%Y%m%d)\"\nmkdir -p \"$BACKUP_DIR\"\nfind /home -type f -mtime -7 -exec cp {} \"$BACKUP_DIR\" \\;\necho \"Backed up $(ls \"$BACKUP_DIR\" | wc -l) files to $BACKUP_DIR\"\nEOF",
            "chmod +x /usr/local/bin/backup-recent.sh",
            "/usr/local/bin/backup-recent.sh"
        ],
        verify: ["ls -l /usr/local/bin/backup-recent.sh", "ls -d /backup/*"],
        hint: "find -mtime -7 = modified in last 7 days, -exec executes command for each",
        category: "scripting",
        difficulty: "medium"
    },
    {
        desc: "Use grep with regular expressions: find IP addresses in log file.",
        points: 20,
        cmds: [
            "grep -E '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}' /var/log/messages | head -10",
            "grep -oE '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}' /var/log/messages | sort -u"
        ],
        verify: ["grep -c -E '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}' /var/log/messages"],
        hint: "grep -E enables extended regex, -o shows only matching part",
        category: "scripting",
        difficulty: "hard"
    },
    
    // ========== 16. SCHEDULE FUTURE TASKS ==========
    {
        desc: "Create cron job for root to run backup script daily at 2 AM.",
        points: 20,
        cmds: [
            "echo '0 2 * * * /usr/local/bin/backup.sh' | crontab -",
            "crontab -l"
        ],
        verify: ["crontab -l", "systemctl status crond"],
        hint: "crontab syntax: minute hour day month day-of-week command",
        category: "scheduling",
        difficulty: "medium"
    },
    {
        desc: "Create cron job for user 'alice' to run script every Monday at 9 AM.",
        points: 20,
        cmds: [
            "echo '0 9 * * 1 /home/alice/script.sh' | crontab -u alice -",
            "crontab -l -u alice"
        ],
        hint: "0=Sunday, 1=Monday, ..., 6=Saturday",
        category: "scheduling",
        difficulty: "medium"
    },
    {
        desc: "Schedule one-time job with 'at' command to run in 5 minutes.",
        points: 15,
        cmds: [
            "echo 'touch /tmp/at-test.txt' | at now + 5 minutes",
            "atq"
        ],
        verify: ["atq", "ls -l /tmp/at-test.txt # after 5 min"],
        hint: "at schedules one-time jobs, atq lists pending jobs",
        category: "scheduling",
        difficulty: "easy"
    },
    
    // ========== 17. TUNE SYSTEM PERFORMANCE ==========
    {
        desc: "Check current tuned profile and change to 'throughput-performance'.",
        points: 15,
        cmds: [
            "tuned-adm active",
            "tuned-adm list",
            "tuned-adm profile throughput-performance",
            "tuned-adm active"
        ],
        verify: ["tuned-adm active", "systemctl status tuned"],
        hint: "throughput-performance = max throughput, virtual-guest = optimized for VMs",
        category: "performance",
        difficulty: "easy"
    },
    {
        desc: "Change process priority (nice value) and verify.",
        points: 15,
        cmds: [
            "nice -n 10 sleep 100 &",
            "ps -o pid,ni,comm $(pgrep sleep)",
            "renice -n 5 -p $(pgrep sleep)"
        ],
        verify: ["ps -o pid,ni,comm $(pgrep sleep)"],
        hint: "nice value range: -20 (highest priority) to 19 (lowest)",
        category: "performance",
        difficulty: "medium"
    },
    
    // ========== 18. MANAGE SELINUX SECURITY ==========
    {
        desc: "Check SELinux status and set to enforcing mode.",
        points: 15,
        cmds: [
            "getenforce",
            "sestatus",
            "setenforce 1",
            "getenforce"
        ],
        verify: ["getenforce", "sestatus | grep mode"],
        hint: "setenforce 1 = enforcing, 0 = permissive",
        category: "selinux",
        difficulty: "easy"
    },
    {
        desc: "Set SELinux context for web directory /srv/www to httpd_sys_content_t.",
        points: 20,
        cmds: [
            "mkdir -p /srv/www",
            "semanage fcontext -a -t httpd_sys_content_t '/srv/www(/.*)?'",
            "restorecon -Rv /srv/www",
            "ls -lZ /srv/www"
        ],
        verify: ["ls -lZ /srv/www", "semanage fcontext -l | grep /srv/www"],
        hint: "semanage fcontext adds persistent context, restorecon applies it",
        category: "selinux",
        difficulty: "hard"
    },
    {
        desc: "Allow httpd to connect to network (set boolean) and verify.",
        points: 15,
        cmds: [
            "getsebool httpd_can_network_connect",
            "setsebool -P httpd_can_network_connect on",
            "getsebool httpd_can_network_connect"
        ],
        verify: ["getsebool httpd_can_network_connect"],
        hint: "setsebool -P makes boolean permanent (survives reboot)",
        category: "selinux",
        difficulty: "medium"
    },
    {
        desc: "Add port 8080 to SELinux for httpd and check denials.",
        points: 20,
        cmds: [
            "semanage port -a -t http_port_t -p tcp 8080",
            "semanage port -l | grep http_port_t",
            "ausearch -m avc -ts recent"
        ],
        verify: ["semanage port -l | grep 8080"],
        hint: "semanage port manages SELinux port mappings, ausearch checks denials",
        category: "selinux",
        difficulty: "hard"
    },
    
    // ========== 19. MANAGE BASIC STORAGE ==========
    {
        desc: "Create partition on /dev/sdb and format as ext4 filesystem.",
        points: 25,
        cmds: [
            "fdisk /dev/sdb",
            "# Interactive: n (new), p (primary), 1 (partition), defaults, w (write)",
            "partprobe /dev/sdb",
            "mkfs.ext4 /dev/sdb1",
            "blkid /dev/sdb1"
        ],
        verify: ["fdisk -l /dev/sdb", "blkid /dev/sdb1"],
        hint: "fdisk interactive tool, partprobe updates kernel partition table",
        category: "storage-basic",
        difficulty: "hard"
    },
    {
        desc: "Create and activate swap partition /dev/sdb2.",
        points: 20,
        cmds: [
            "mkswap /dev/sdb2",
            "swapon /dev/sdb2",
            "swapon --show",
            "echo '/dev/sdb2 none swap defaults 0 0' >> /etc/fstab"
        ],
        verify: ["swapon --show", "free -h", "cat /etc/fstab | grep swap"],
        hint: "mkswap creates swap, swapon activates, fstab makes persistent",
        category: "storage-basic",
        difficulty: "medium"
    },
    
    // ========== 20. MANAGE STORAGE STACK (LVM) ==========
    {
        desc: "Create LVM: physical volume, volume group, and logical volume.",
        points: 30,
        cmds: [
            "pvcreate /dev/sdb1",
            "vgcreate vg_data /dev/sdb1",
            "lvcreate -L 5G -n lv_data vg_data",
            "mkfs.xfs /dev/vg_data/lv_data",
            "mkdir -p /data",
            "mount /dev/vg_data/lv_data /data"
        ],
        verify: ["pvs", "vgs", "lvs", "df -h /data"],
        hint: "pvcreate -> vgcreate -> lvcreate -> mkfs -> mount",
        category: "storage-lvm",
        difficulty: "hard"
    },
    {
        desc: "Extend logical volume by 2GB and resize filesystem.",
        points: 25,
        cmds: [
            "lvextend -L +2G /dev/vg_data/lv_data",
            "xfs_growfs /data # for XFS",
            "# For ext4: resize2fs /dev/vg_data/lv_data",
            "df -h /data"
        ],
        verify: ["lvs /dev/vg_data/lv_data", "df -h /data"],
        hint: "xfs_growfs for XFS, resize2fs for ext4",
        category: "storage-lvm",
        difficulty: "hard"
    },
    
    // ========== 21. ACCESS NETWORK-ATTACHED STORAGE ==========
    {
        desc: "Mount NFS share server.example.com:/export/data to /mnt/nfs.",
        points: 20,
        cmds: [
            "mkdir -p /mnt/nfs",
            "mount -t nfs server.example.com:/export/data /mnt/nfs",
            "df -h /mnt/nfs",
            "echo 'server.example.com:/export/data /mnt/nfs nfs defaults 0 0' >> /etc/fstab"
        ],
        verify: ["mount | grep nfs", "df -h /mnt/nfs"],
        hint: "mount -t nfs specifies NFS filesystem type",
        category: "nas",
        difficulty: "medium"
    },
    {
        desc: "Configure autofs to auto-mount NFS share when accessed.",
        points: 25,
        cmds: [
            "dnf install -y autofs",
            "echo '/nfs /etc/auto.nfs' >> /etc/auto.master",
            "echo 'data -fstype=nfs,rw server.example.com:/export/data' > /etc/auto.nfs",
            "systemctl enable --now autofs",
            "ls /nfs/data # triggers mount"
        ],
        verify: ["systemctl status autofs", "ls /nfs/data", "mount | grep nfs"],
        hint: "autofs mounts on-demand, saves resources",
        category: "nas",
        difficulty: "hard"
    },
    
    // ========== 22. CONTROL THE BOOT PROCESS ==========
    {
        desc: "Reset root password using rd.break at boot.",
        points: 30,
        cmds: [
            "# At GRUB: edit kernel line, add rd.break",
            "mount -o remount,rw /sysroot",
            "chroot /sysroot",
            "passwd root",
            "touch /.autorelabel",
            "exit",
            "exit"
        ],
        verify: ["getenforce", "login as root"],
        hint: "rd.break stops before SELinux relabel, /.autorelabel triggers relabel",
        category: "boot",
        difficulty: "hard"
    },
    {
        desc: "Recover from broken /etc/fstab by booting into emergency mode.",
        points: 25,
        cmds: [
            "# At GRUB: edit kernel line, add systemd.unit=emergency.target",
            "mount -o remount,rw /",
            "vi /etc/fstab # fix broken entry",
            "systemctl daemon-reload",
            "mount -a",
            "reboot"
        ],
        verify: ["mount -a", "systemctl --failed"],
        hint: "emergency mode gives root shell with minimal services",
        category: "boot",
        difficulty: "hard"
    },
    
    // ========== 23. MANAGE NETWORK SECURITY (FIREWALL) ==========
    {
        desc: "Configure firewall to allow HTTP, HTTPS, and SSH services.",
        points: 20,
        cmds: [
            "firewall-cmd --permanent --add-service=http",
            "firewall-cmd --permanent --add-service=https",
            "firewall-cmd --permanent --add-service=ssh",
            "firewall-cmd --reload",
            "firewall-cmd --list-all"
        ],
        verify: ["firewall-cmd --list-services", "systemctl status firewalld"],
        hint: "--permanent makes rules persistent, --reload applies",
        category: "firewall",
        difficulty: "medium"
    },
    {
        desc: "Open custom port 8080/tcp in firewall and add rich rule for specific IP.",
        points: 25,
        cmds: [
            "firewall-cmd --permanent --add-port=8080/tcp",
            "firewall-cmd --permanent --add-rich-rule='rule family=\"ipv4\" source address=\"192.168.1.50\" port port=\"22\" protocol=\"tcp\" accept'",
            "firewall-cmd --reload",
            "firewall-cmd --list-ports",
            "firewall-cmd --list-rich-rules"
        ],
        verify: ["firewall-cmd --list-ports", "firewall-cmd --list-rich-rules"],
        hint: "Rich rules allow complex filtering conditions",
        category: "firewall",
        difficulty: "hard"
    },
    
    // ========== 24. RUN CONTAINERS (PODMAN) ==========
    {
        desc: "Pull nginx image and run container on port 8080.",
        points: 20,
        cmds: [
            "podman pull nginx",
            "podman run -d --name web -p 8080:80 nginx",
            "podman ps",
            "curl localhost:8080"
        ],
        verify: ["podman ps", "curl -I localhost:8080"],
        hint: "podman run -d runs detached, -p maps host:container ports",
        category: "containers",
        difficulty: "medium"
    },
    {
        desc: "Create container with volume mount and make persistent with systemd.",
        points: 30,
        cmds: [
            "mkdir -p /web/content",
            "echo 'Hello RHCSA' > /web/content/index.html",
            "podman run -d --name webapp -p 8081:80 -v /web/content:/usr/share/nginx/html:Z nginx",
            "podman generate systemd --name webapp --files --new",
            "mv container-webapp.service /etc/systemd/system/",
            "systemctl daemon-reload",
            "systemctl enable --now container-webapp"
        ],
        verify: ["systemctl status container-webapp", "curl localhost:8081"],
        hint: ":Z for SELinux context, podman generate systemd creates service",
        category: "containers",
        difficulty: "hard"
    }
];

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    displayHistory();
    
    // Set up verification checkboxes
    document.querySelectorAll('.verification-item input').forEach(cb => {
        cb.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.checked) {
                label.style.textDecoration = 'line-through';
                label.style.opacity = '0.7';
            } else {
                label.style.textDecoration = 'none';
                label.style.opacity = '1';
            }
        });
    });
});

// Warn before leaving exam page
window.addEventListener('beforeunload', (e) => {
    if (timerInterval && !examSubmitted) {
        e.preventDefault();
        e.returnValue = 'You have an exam in progress. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// Export functions for global use
window.startExam = startExam;
window.startQuickPractice = startQuickPractice;
window.submitExam = submitExam;
window.submitSolution = submitSolution;
window.toggleHint = toggleHint;
window.toggleAnswer = toggleAnswer;
window.setPracticeCategory = setPracticeCategory;
window.resetHistory = resetHistory;
window.restartExam = restartExam;
window.reviewExam = reviewExam;
window.practiceWeakness = practiceWeakness;
window.downloadResults = downloadResults;
window.updateTimeSpent = updateTimeSpent;