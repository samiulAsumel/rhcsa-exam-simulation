// RHCSA EX300 Realistic Exam System - JavaScript
let timerInterval = null;
let timeRemaining = 9000; // 150 minutes in seconds
let tasks = [];
let examSubmitted = false;
let examHistory = [];
let currentExamNumber = 1;
let selectedCategory = "all";
let startTime = null;

// Category mapping
const categoryMap = {
    "networking": "Networking",
    "users-groups": "Users & Groups", 
    "permissions": "Permissions & ACL",
    "storage-lvm": "Storage & LVM",
    "selinux": "SELinux",
    "firewall": "FirewallD",
    "services": "Systemd Services",
    "containers": "Podman Containers",
    "scheduling": "Scheduling",
    "troubleshooting": "Troubleshooting",
    "bash-scripts": "Bash Scripts"
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
    const categoryName = cat === "all" ? "All Topics" : categoryMap[cat] || cat;
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
    const categoryName = selectedCategory === "all" ? "All Topics" : categoryMap[selectedCategory] || selectedCategory;
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
                        ${task.category} • ${task.timeSpent || 0}s spent
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
    report += `Category: ${selectedCategory === 'all' ? 'All Topics' : categoryMap[selectedCategory]}\n`;
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

// ===================== QUESTION POOL =====================
// Based on RHCSA EX200 exam format and your PDF content
const questionPool = [
    // ========== NETWORKING ==========
    {
        desc: "Configure static network parameters for your system. IP: 172.25.250.10/24, Gateway: 172.25.250.254, DNS: 172.24.254.254. Set hostname to servera.lab.example.com.",
        points: 20,
        cmds: [
            "nmcli connection show",
            "nmcli connection modify 'Wired connection 1' ipv4.addresses 172.25.250.10/24",
            "nmcli connection modify 'Wired connection 1' ipv4.gateway 172.25.250.254",
            "nmcli connection modify 'Wired connection 1' ipv4.dns 172.24.254.254",
            "nmcli connection modify 'Wired connection 1' ipv4.method manual",
            "nmcli connection up 'Wired connection 1'",
            "hostnamectl set-hostname servera.lab.example.com"
        ],
        verify: [
            "nmcli connection show",
            "hostnamectl",
            "ip addr show",
            "ping -c 3 172.25.250.254"
        ],
        hint: "Use nmcli for network configuration and hostnamectl for hostname",
        category: "networking",
        difficulty: "medium"
    },
    
    // ========== USERS & GROUPS ==========
    {
        desc: "Create a group named 'sharegrp'. Create users: harry and natasha (both in sharegrp as secondary group), and copper (no interactive shell, not in sharegrp). Set passwords to 'redhat' for all users.",
        points: 20,
        cmds: [
            "groupadd sharegrp",
            "useradd -G sharegrp harry",
            "useradd -G sharegrp natasha",
            "useradd -s /sbin/nologin copper",
            "echo 'harry:redhat' | chpasswd",
            "echo 'natasha:redhat' | chpasswd",
            "echo 'copper:redhat' | chpasswd"
        ],
        verify: [
            "getent group sharegrp",
            "id harry",
            "id natasha",
            "id copper",
            "getent passwd copper | cut -d: -f7"
        ],
        hint: "useradd -G for secondary group, -s /sbin/nologin for no shell",
        category: "users-groups",
        difficulty: "easy"
    },
    
    {
        desc: "Create user 'fred' with UID 3945 and set password to 'iamredhatman'.",
        points: 15,
        cmds: [
            "useradd -u 3945 fred",
            "echo 'fred:iamredhatman' | chpasswd"
        ],
        verify: [
            "id fred",
            "getent passwd fred | cut -d: -f3"
        ],
        hint: "useradd -u sets UID, echo with chpasswd sets password",
        category: "users-groups",
        difficulty: "easy"
    },
    
    // ========== PERMISSIONS & ACL ==========
    {
        desc: "Create directory /var/shares with group ownership 'sharegrp'. Set permissions so only sharegrp members can read/write/access. Set SGID bit so new files inherit group ownership.",
        points: 20,
        cmds: [
            "mkdir -p /var/shares",
            "chown :sharegrp /var/shares",
            "chmod 2770 /var/shares"
        ],
        verify: [
            "ls -ld /var/shares",
            "getfacl /var/shares"
        ],
        hint: "chmod 2770 sets SGID (2) + rwx for owner and group (770)",
        category: "permissions",
        difficulty: "medium"
    },
    
    {
        desc: "Set ACL for user 'alice' with read/write/execute on /data/project. Set default ACL so new files inherit these permissions.",
        points: 20,
        cmds: [
            "setfacl -m u:alice:rwx /data/project",
            "setfacl -m d:u:alice:rwx /data/project"
        ],
        verify: [
            "getfacl /data/project",
            "touch /data/project/test && getfacl /data/project/test"
        ],
        hint: "setfacl -m for modifying ACL, d: for default ACL",
        category: "permissions",
        difficulty: "medium"
    },
    
    // ========== STORAGE & LVM ==========
    {
        desc: "Create a new logical volume named 'database' in volume group 'datastore' with 50 extents (extent size 16MiB). Format with vfat and mount at /mnt/database persistently.",
        points: 25,
        cmds: [
            "vgcreate -s 16M datastore /dev/vdb3",
            "lvcreate -l 50 -n database datastore",
            "mkfs.vfat /dev/datastore/database",
            "mkdir -p /mnt/database",
            "echo '/dev/datastore/database /mnt/database vfat defaults 0 0' >> /etc/fstab",
            "mount -a"
        ],
        verify: [
            "vgs datastore",
            "lvs datastore/database",
            "df -h /mnt/database",
            "mount | grep database"
        ],
        hint: "vgcreate -s sets extent size, lvcreate -l uses extents",
        category: "storage-lvm",
        difficulty: "hard"
    },
    
    {
        desc: "Extend logical volume 'database' to 850MB (within 830-865MB range) and ensure filesystem is usable.",
        points: 20,
        cmds: [
            "lvextend -L 850M /dev/datastore/database",
            "resize2fs /dev/datastore/database"
        ],
        verify: [
            "lvs /dev/datastore/database",
            "df -h /mnt/database"
        ],
        hint: "lvextend extends LV, resize2fs resizes ext filesystem",
        category: "storage-lvm",
        difficulty: "medium"
    },
    
    {
        desc: "Add a 512MB swap partition on /dev/vdb2 and configure it to mount at boot automatically.",
        points: 20,
        cmds: [
            "mkswap /dev/vdb2",
            "swapon /dev/vdb2",
            "echo '/dev/vdb2 none swap defaults 0 0' >> /etc/fstab"
        ],
        verify: [
            "swapon --show",
            "free -h",
            "cat /etc/fstab | grep swap"
        ],
        hint: "mkswap creates swap, swapon activates it, fstab makes persistent",
        category: "storage-lvm",
        difficulty: "easy"
    },
    
    // ========== SELINUX ==========
    {
        desc: "Configure SELinux to allow httpd to serve content from port 82. Ensure SELinux is in enforcing mode.",
        points: 25,
        cmds: [
            "setenforce 1",
            "semanage port -a -t http_port_t -p tcp 82",
            "firewall-cmd --permanent --add-port=82/tcp",
            "firewall-cmd --reload"
        ],
        verify: [
            "getenforce",
            "semanage port -l | grep http_port_t",
            "firewall-cmd --list-ports",
            "systemctl restart httpd"
        ],
        hint: "semanage port -a adds port to SELinux, firewall-cmd opens port",
        category: "selinux",
        difficulty: "hard"
    },
    
    {
        desc: "Set SELinux context for /var/www/html to httpd_sys_content_t and ensure it's persistent.",
        points: 20,
        cmds: [
            "semanage fcontext -a -t httpd_sys_content_t '/var/www/html(/.*)?'",
            "restorecon -Rv /var/www/html"
        ],
        verify: [
            "ls -lZ /var/www/html",
            "semanage fcontext -l | grep /var/www/html"
        ],
        hint: "semanage fcontext adds persistent context, restorecon applies it",
        category: "selinux",
        difficulty: "medium"
    },
    
    // ========== FIREWALLD ==========
    {
        desc: "Configure firewall to allow HTTP, HTTPS, and SSH services permanently.",
        points: 15,
        cmds: [
            "firewall-cmd --permanent --add-service=http",
            "firewall-cmd --permanent --add-service=https",
            "firewall-cmd --permanent --add-service=ssh",
            "firewall-cmd --reload"
        ],
        verify: [
            "firewall-cmd --list-services",
            "firewall-cmd --list-all"
        ],
        hint: "Always use --permanent for persistence, --reload to apply",
        category: "firewall",
        difficulty: "easy"
    },
    
    // ========== SYSTEMD SERVICES ==========
    {
        desc: "Install, enable and start httpd service. Configure it to start automatically at boot.",
        points: 15,
        cmds: [
            "dnf install -y httpd",
            "systemctl enable --now httpd",
            "systemctl status httpd"
        ],
        verify: [
            "systemctl is-enabled httpd",
            "systemctl is-active httpd",
            "curl -I localhost"
        ],
        hint: "systemctl enable --now enables and starts service",
        category: "services",
        difficulty: "easy"
    },
    
    // ========== CONTAINERS ==========
    {
        desc: "Pull nginx image from Docker Hub, run container named 'web' on port 8080, mount /web/content to /usr/share/nginx/html. Make it persistent with systemd.",
        points: 30,
        cmds: [
            "podman pull nginx",
            "mkdir -p /web/content",
            "podman run -d --name web -p 8080:80 -v /web/content:/usr/share/nginx/html:Z nginx",
            "podman generate systemd --name web --files --new",
            "mv container-web.service /etc/systemd/system/",
            "systemctl daemon-reload",
            "systemctl enable --now container-web"
        ],
        verify: [
            "podman ps",
            "systemctl status container-web",
            "curl localhost:8080"
        ],
        hint: ":Z for SELinux context, podman generate systemd for persistence",
        category: "containers",
        difficulty: "hard"
    },
    
    // ========== SCHEDULING ==========
    {
        desc: "Configure cron job for user 'natasha' to run /bin/echo hello daily at 14:23 and every 2 minutes.",
        points: 20,
        cmds: [
            "(crontab -l -u natasha 2>/dev/null; echo '23 14 * * * /bin/echo hello') | crontab -u natasha -",
            "(crontab -l -u natasha; echo '*/2 * * * * /bin/echo hello') | crontab -u natasha -"
        ],
        verify: [
            "crontab -l -u natasha",
            "systemctl status crond"
        ],
        hint: "crontab -u for user cron, */2 for every 2 minutes",
        category: "scheduling",
        difficulty: "medium"
    },
    
    // ========== TROUBLESHOOTING ==========
    {
        desc: "Reset root password using rd.break method. Ensure SELinux relabels after reboot.",
        points: 25,
        cmds: [
            "# At GRUB: Edit kernel line, add rd.break, press Ctrl+x",
            "mount -o remount,rw /sysroot",
            "chroot /sysroot",
            "passwd root",
            "touch /.autorelabel",
            "exit",
            "exit"
        ],
        verify: [
            "getenforce",
            "login as root with new password"
        ],
        hint: "rd.break at GRUB, remount /sysroot rw, /.autorelabel for SELinux",
        category: "troubleshooting",
        difficulty: "hard"
    },
    
    // ========== BASH SCRIPTS ==========
    {
        desc: "Create script /root/find.sh that finds files 30K-60K in /etc and copies them to /root/data.",
        points: 20,
        cmds: [
            "cat > /root/find.sh << 'EOF'\n#!/bin/bash\nmkdir -p /root/data\nfind /etc -type f -size +30k -size -60k -exec cp {} /root/data \\;\necho 'Files copied to /root/data'\nEOF",
            "chmod +x /root/find.sh"
        ],
        verify: [
            "ls -l /root/find.sh",
            "/root/find.sh",
            "ls /root/data"
        ],
        hint: "find with -size +30k -size -60k for range, -exec cp for copying",
        category: "bash-scripts",
        difficulty: "medium"
    },
    
    // ========== PACKAGE MANAGEMENT ==========
    {
        desc: "Configure system to use repositories: http://content.example.com/rhel9.0/x86_64/rhcsa-practice/{rht,errata}",
        points: 20,
        cmds: [
            "cat > /etc/yum.repos.d/exam.repo << 'EOF'\n[rhcsa-practice]\nname=RHCSA Practice Repo\nbaseurl=http://content.example.com/rhel9.0/x86_64/rhcsa-practice/rht\nenabled=1\ngpgcheck=0\n\n[errata]\nname=Errata Updates\nbaseurl=http://content.example.com/rhel9.0/x86_64/rhcsa-practice/errata\nenabled=1\ngpgcheck=0\nEOF",
            "dnf repolist"
        ],
        verify: [
            "cat /etc/yum.repos.d/exam.repo",
            "dnf repolist | grep -E 'rhcsa-practice|errata'"
        ],
        hint: "Create .repo file in /etc/yum.repos.d/, dnf repolist to verify",
        category: "services",
        difficulty: "easy"
    },
    
    // ========== NTP/TIME ==========
    {
        desc: "Configure system as NTP client of classroom.example.com using chrony.",
        points: 15,
        cmds: [
            "dnf install -y chrony",
            "sed -i 's/^pool.*/server classroom.example.com iburst/' /etc/chrony.conf",
            "systemctl enable --now chronyd",
            "systemctl restart chronyd"
        ],
        verify: [
            "systemctl status chronyd",
            "chronyc sources",
            "timedatectl"
        ],
        hint: "Replace pool with server in chrony.conf, iburst for quick sync",
        category: "services",
        difficulty: "easy"
    },
    
    // ========== AUTOFS ==========
    {
        desc: "Configure autofs to automount remoteuser15's home directory from utility.lab.example.com:/netdir/remoteuser15 at /netdir/remoteuser15",
        points: 25,
        cmds: [
            "dnf install -y autofs",
            "echo '/netdir /etc/auto.netdir' >> /etc/auto.master",
            "echo 'remoteuser15 -fstype=nfs,rw utility.lab.example.com:/netdir/remoteuser15' > /etc/auto.netdir",
            "systemctl enable --now autofs",
            "systemctl restart autofs"
        ],
        verify: [
            "systemctl status autofs",
            "ls /netdir/remoteuser15",
            "mount | grep netdir"
        ],
        hint: "/etc/auto.master for mount point, /etc/auto.netdir for NFS details",
        category: "services",
        difficulty: "hard"
    },
    
    // ========== PASSWORD POLICY ==========
    {
        desc: "Configure password policy so all new user passwords expire after 30 days.",
        points: 15,
        cmds: [
            "sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS 30/' /etc/login.defs"
        ],
        verify: [
            "grep ^PASS_MAX_DAYS /etc/login.defs",
            "useradd testuser && chage -l testuser"
        ],
        hint: "Edit PASS_MAX_DAYS in /etc/login.defs",
        category: "users-groups",
        difficulty: "easy"
    },
    
    // ========== ARCHIVE ==========
    {
        desc: "Create compressed backup of /usr/local as /root/backup.tar.bz2 with bzip2 compression.",
        points: 15,
        cmds: [
            "tar -cjf /root/backup.tar.bz2 -C /usr/local ."
        ],
        verify: [
            "ls -lh /root/backup.tar.bz2",
            "tar -tjf /root/backup.tar.bz2 | head -5"
        ],
        hint: "tar -cjf creates bzip2 compressed archive",
        category: "bash-scripts",
        difficulty: "easy"
    },
    
    // ========== SEARCH COMMANDS ==========
    {
        desc: "Find all lines containing 'ich' in /usr/share/mime/packages/freedesktop.org.xml and save to /root/lines.",
        points: 15,
        cmds: [
            "grep ich /usr/share/mime/packages/freedesktop.org.xml > /root/lines"
        ],
        verify: [
            "wc -l /root/lines",
            "head -5 /root/lines"
        ],
        hint: "grep with > redirects output to file",
        category: "bash-scripts",
        difficulty: "easy"
    },
    
    {
        desc: "Find files owned by user 'natasha' and save list to /tmp/output.",
        points: 15,
        cmds: [
            "find / -user natasha -type f 2>/dev/null > /tmp/output"
        ],
        verify: [
            "wc -l /tmp/output",
            "head -5 /tmp/output"
        ],
        hint: "find / -user username finds files by owner, 2>/dev/null suppresses errors",
        category: "bash-scripts",
        difficulty: "easy"
    },
    
    // ========== TEXT PROCESSING ==========
    {
        desc: "Search for 'nologin' in /etc/passwd and save output to /root/strings.",
        points: 10,
        cmds: [
            "grep nologin /etc/passwd > /root/strings"
        ],
        verify: [
            "wc -l /root/strings",
            "head -5 /root/strings"
        ],
        hint: "grep searches file, > saves output",
        category: "bash-scripts",
        difficulty: "easy"
    },
    
    // ========== SUDO CONFIGURATION ==========
    {
        desc: "Configure sudo so members of 'admin' group can run all commands without password.",
        points: 20,
        cmds: [
            "echo '%admin ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/admin"
        ],
        verify: [
            "cat /etc/sudoers.d/admin",
            "visudo -c"
        ],
        hint: "Create file in /etc/sudoers.d/, % for group, NOPASSWD for no password",
        category: "users-groups",
        difficulty: "medium"
    },
    
    // ========== UMASK CONFIGURATION ==========
    {
        desc: "Set umask for user 'daffy' so new files get 600 and directories get 700 permissions.",
        points: 15,
        cmds: [
            "echo 'umask 0077' >> /home/daffy/.bashrc"
        ],
        verify: [
            "su - daffy -c 'umask'",
            "su - daffy -c 'touch testfile && mkdir testdir && ls -ld testfile testdir'"
        ],
        hint: "umask 0077 gives 600 for files (666-077), 700 for dirs (777-077)",
        category: "permissions",
        difficulty: "medium"
    },
    
    // ========== TUNED PROFILE ==========
    {
        desc: "Change tuned profile to 'virtual-guest' for optimized VM performance.",
        points: 15,
        cmds: [
            "dnf install -y tuned",
            "systemctl enable --now tuned",
            "tuned-adm profile virtual-guest"
        ],
        verify: [
            "tuned-adm active",
            "systemctl status tuned"
        ],
        hint: "tuned-adm profile sets active profile",
        category: "services",
        difficulty: "easy"
    }
];

// Add more questions to reach 400+
// (In a real implementation, you would add 300+ more questions here following the same format)

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