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
  processes: "Monitor & Manage Processes",
  "services-daemons": "Control Services & Daemons",
  ssh: "Configure & Secure SSH",
  logging: "Analyze & Store Logs",
  networking: "Manage Networking",
  archiving: "Archive & Transfer Files",
  software: "Install & Update Software",
  "file-systems": "Access Linux File Systems",
  scripting: "Improve Command-line Productivity",
  scheduling: "Schedule Future Tasks",
  performance: "Tune System Performance",
  selinux: "Manage SELinux Security",
  "storage-basic": "Manage Basic Storage",
  "storage-lvm": "Manage Storage Stack",
  nas: "Access Network-Attached Storage",
  boot: "Control the Boot Process",
  firewall: "Manage Network Security",
  containers: "Run Containers",
};

// Cheat Sheet Data - Comprehensive Command Summary
const cheatSheetData = {
  easy: [
    { command: "pwd", description: "Print working directory" },
    { command: "ls -la", description: "List files with details" },
    { command: "cd /path", description: "Change directory" },
    { command: "mkdir dirname", description: "Create directory" },
    { command: "rmdir dirname", description: "Remove empty directory" },
    { command: "touch filename", description: "Create empty file" },
    { command: "cat filename", description: "Display file content" },
    { command: "cp file1 file2", description: "Copy file" },
    { command: "mv file1 file2", description: "Move/rename file" },
    { command: "rm filename", description: "Remove file" },
    { command: "who", description: "Show logged in users" },
    { command: "whoami", description: "Show current user" },
    { command: "date", description: "Show date and time" },
    { command: "cal", description: "Show calendar" },
    { command: "uptime", description: "Show system uptime" },
    { command: "uname -a", description: "Show system info" },
    { command: "history", description: "Show command history" },
    { command: "man command", description: "Show manual page" },
    { command: "command --help", description: "Show command help" },
    { command: "whatis command", description: "Brief command description" },
  ],
  medium: [
    {
      command: "find /path -name 'pattern'",
      description: "Find files by name",
    },
    { command: "grep 'pattern' file", description: "Search text in file" },
    {
      command: "tar -czf archive.tar.gz dir",
      description: "Create tar.gz archive",
    },
    { command: "tar -xzf archive.tar.gz", description: "Extract tar.gz" },
    { command: "gzip file", description: "Compress file" },
    { command: "gunzip file.gz", description: "Decompress file" },
    { command: "useradd username", description: "Add user" },
    { command: "usermod -aG group user", description: "Add user to group" },
    { command: "groupadd groupname", description: "Add group" },
    { command: "passwd username", description: "Change password" },
    { command: "chmod 755 file", description: "Change file permissions" },
    { command: "chown user:group file", description: "Change file owner" },
    { command: "ps aux", description: "Show all processes" },
    { command: "top", description: "Interactive process viewer" },
    { command: "kill PID", description: "Terminate process" },
    { command: "systemctl start service", description: "Start service" },
    { command: "systemctl stop service", description: "Stop service" },
    {
      command: "systemctl status service",
      description: "Check service status",
    },
    { command: "ssh user@host", description: "SSH remote login" },
    { command: "scp file user@host:path", description: "Secure copy" },
    { command: "ping host", description: "Test network connectivity" },
    { command: "ip addr show", description: "Show IP addresses" },
    { command: "df -h", description: "Show disk usage" },
    { command: "du -sh dir", description: "Show directory size" },
    { command: "mount /dev/sdX /mnt", description: "Mount filesystem" },
    { command: "umount /mnt", description: "Unmount filesystem" },
    { command: "crontab -e", description: "Edit cron jobs" },
    { command: "at now + 5 minutes", description: "Schedule one-time job" },
    { command: "nice -n 10 command", description: "Run with low priority" },
    {
      command: "renice 5 PID",
      description: "Change priority of running process",
    },
  ],
  hard: [
    { command: "setenforce 1", description: "Set SELinux to enforcing" },
    { command: "getenforce", description: "Check SELinux status" },
    {
      command: "semanage fcontext -a -t type '/path(/.*)?'",
      description: "Add SELinux context",
    },
    { command: "restorecon -Rv /path", description: "Apply SELinux contexts" },
    { command: "setsebool -P boolean on", description: "Set SELinux boolean" },
    {
      command: "semanage port -a -t port_t -p tcp PORT",
      description: "Add SELinux port",
    },
    { command: "pvcreate /dev/sdX", description: "Create physical volume" },
    { command: "vgcreate vgname /dev/sdX", description: "Create volume group" },
    {
      command: "lvcreate -L size -n lvname vgname",
      description: "Create logical volume",
    },
    {
      command: "lvextend -L +size /dev/vg/lv",
      description: "Extend logical volume",
    },
    { command: "xfs_growfs /mountpoint", description: "Grow XFS filesystem" },
    { command: "resize2fs /dev/vg/lv", description: "Resize ext filesystem" },
    {
      command: "mount -t nfs server:/share /mnt",
      description: "Mount NFS share",
    },
    {
      command: "firewall-cmd --permanent --add-service=service",
      description: "Add firewall service",
    },
    {
      command: "firewall-cmd --permanent --add-port=port/tcp",
      description: "Add firewall port",
    },
    { command: "firewall-cmd --reload", description: "Reload firewall" },
    { command: "firewall-cmd --list-all", description: "List firewall rules" },
    { command: "podman pull image", description: "Pull container image" },
    {
      command: "podman run -d --name container image",
      description: "Run container",
    },
    { command: "podman ps", description: "List running containers" },
    {
      command: "podman exec container command",
      description: "Execute in container",
    },
    {
      command: "nmcli connection modify eth0 ipv4.method manual",
      description: "Set static IP",
    },
    { command: "nmcli connection up eth0", description: "Activate connection" },
    { command: "hostnamectl set-hostname name", description: "Set hostname" },
    { command: "timedatectl set-timezone Zone", description: "Set timezone" },
    { command: "journalctl -b", description: "Show current boot logs" },
    { command: "journalctl -f", description: "Follow logs" },
    {
      command: "rsync -avz source/ dest/",
      description: "Sync with compression",
    },
    {
      command: "rsync -avz --delete source/ dest/",
      description: "Sync with deletion",
    },
    { command: "dnf install package", description: "Install package" },
    { command: "dnf remove package", description: "Remove package" },
    {
      command: "rpm -qa | grep pattern",
      description: "Find installed package",
    },
    { command: "rpm -ql package", description: "List package files" },
    {
      command: "dnf provides */file",
      description: "Find package providing file",
    },
    { command: "fdisk /dev/sdX", description: "Partition disk" },
    { command: "mkfs.ext4 /dev/sdX1", description: "Format as ext4" },
    { command: "mkfs.xfs /dev/sdX1", description: "Format as XFS" },
    { command: "mkswap /dev/sdX2", description: "Create swap" },
    { command: "swapon /dev/sdX2", description: "Activate swap" },
    { command: "tuned-adm profile profile", description: "Set tuned profile" },
    { command: "at now + 5 minutes", description: "Schedule one-time job" },
    {
      command: "systemctl set-default target",
      description: "Set default boot target",
    },
    {
      command: "grub2-mkconfig -o /boot/grub2/grub.cfg",
      description: "Regenerate GRUB config",
    },
  ],
};

// Show cheat sheet
function showCheatSheet() {
  const cheatSheetModal = document.getElementById("cheatSheetModal");
  const cheatSheetContent = document.getElementById("cheatSheetContent");

  if (!cheatSheetModal || !cheatSheetContent) {
    console.error("Cheat sheet elements not found");
    return;
  }

  // Build cheat sheet content
  let content = '<div class="cheat-sheet-container">';

  // Add each difficulty section
  for (const difficulty in cheatSheetData) {
    content += `
            <div class="cheat-sheet-section">
                <h3 class="cheat-sheet-difficulty ${difficulty}">${difficulty.toUpperCase()} COMMANDS</h3>
                <div class="cheat-sheet-grid">
        `;

    cheatSheetData[difficulty].forEach((item) => {
      content += `
                <div class="cheat-sheet-item">
                    <div class="cheat-sheet-command">${item.command}</div>
                    <div class="cheat-sheet-description">${item.description}</div>
                </div>
            `;
    });

    content += `
                </div>
            </div>
        `;
  }

  content += `
        <div class="cheat-sheet-tips">
            <h4>📚 Quick Tips:</h4>
            <ul>
                <li><strong>Tab Completion:</strong> Press Tab to auto-complete commands and file paths</li>
                <li><strong>Command History:</strong> Use ↑/↓ arrows to navigate command history</li>
                <li><strong>Cancel Command:</strong> Ctrl+C to stop current command</li>
                <li><strong>Clear Screen:</strong> Ctrl+L or type 'clear'</li>
                <li><strong>Search History:</strong> Ctrl+R to search command history</li>
                <li><strong>Sudo Tip:</strong> Use 'sudo !!' to run previous command with sudo</li>
            </ul>
        </div>
    </div>`;

  cheatSheetContent.innerHTML = content;
  cheatSheetModal.classList.remove("hidden");
}

// Hide cheat sheet
function hideCheatSheet() {
  const cheatSheetModal = document.getElementById("cheatSheetModal");
  if (cheatSheetModal) {
    cheatSheetModal.classList.add("hidden");
  }
}

// Show tips modal
function showTips() {
  const tipsModal = document.getElementById("tipsModal");
  if (tipsModal) {
    tipsModal.classList.remove("hidden");
  }
}

// Close tips modal
function closeTips() {
  const tipsModal = document.getElementById("tipsModal");
  if (tipsModal) {
    tipsModal.classList.add("hidden");
  }
}

// Return to home screen
function returnToHome() {
  if (timerInterval && !examSubmitted) {
    if (
      !confirm(
        "⚠️ You have an exam in progress. Return to home will discard current exam. Continue?"
      )
    ) {
      return;
    }
    clearInterval(timerInterval);
  }

  document.getElementById("examInterface").classList.add("hidden");
  document.getElementById("resultsModal").classList.add("hidden");
  document.getElementById("welcomeScreen").classList.remove("hidden");
  displayHistory();
}

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
  const categoryName =
    cat === "all" ? "All RHCSA Topics" : categoryMap[cat] || cat;
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
  document.getElementById(
    "examNumber"
  ).textContent = `Exam #${currentExamNumber}`;

  // Set category display
  const categoryName =
    selectedCategory === "all"
      ? "All RHCSA Topics"
      : categoryMap[selectedCategory] || selectedCategory;
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
    pool = questionPool.filter((q) => q.category === selectedCategory);
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
    timeSpent: 0,
  }));
}

// Render tasks
function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = tasks
    .map(
      (task) => `
        <div class="task-card ${task.submitted ? "submitted" : ""}" id="task-${
        task.id
      }">
            <div class="task-header">
                <div class="task-number">Task ${task.id}</div>
                <div class="task-points">${task.points} points</div>
            </div>
            <div class="task-description">${task.description}</div>
            
            <div class="task-meta">
                <span class="task-category">${
                  categoryMap[task.category] || task.category
                }</span>
                <span class="task-difficulty ${task.difficulty}">${
        task.difficulty
      }</span>
            </div>
            
            <div class="solution-input">
                <textarea 
                    class="solution-textarea" 
                    id="solution-${task.id}" 
                    placeholder="Enter your solution commands here (one per line)...\nExample:\nuseradd john\necho 'john:redhat' | chpasswd\nid john"
                    ${task.submitted ? "disabled" : ""}
                    oninput="updateTimeSpent(${task.id})"
                >${task.solution || ""}</textarea>
                
                <div class="task-actions">
                    <button class="submit-solution-btn" 
                        onclick="submitSolution(${task.id})"
                        ${task.submitted ? "disabled" : ""}>
                        ${task.submitted ? "✓ Submitted" : "📤 Submit Solution"}
                    </button>
                    <button class="hint-btn" onclick="toggleHint(${
                      task.id
                    }, this)">
                        ${
                          document
                            .getElementById(`hint-${task.id}`)
                            ?.classList.contains("visible")
                            ? "Hide Hint"
                            : "Show Hint"
                        }
                    </button>
                    <button class="answer-btn" onclick="toggleAnswer(${
                      task.id
                    }, this)">
                        ${
                          document
                            .getElementById(`answer-${task.id}`)
                            ?.classList.contains("visible")
                            ? "Hide Answer"
                            : "Show Answer"
                        }
                    </button>
                </div>
                
                <div class="solution-status ${task.status || ""}" id="status-${
        task.id
      }">
                    ${task.statusMessage || ""}
                </div>
            </div>
            
            <div class="hint-box" id="hint-${task.id}">
                <div class="hint-content">
                    <div class="hint-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="hint-text">
                        <strong>Hint:</strong> ${task.hint}
                    </div>
                </div>
            </div>
            
            <div class="answer-box" id="answer-${task.id}">
                <div class="terminal-header">
                    <div class="terminal-title">
                        <i class="fas fa-terminal"></i> Expected Solution
                    </div>
                    <div class="terminal-controls">
                        <button class="terminal-btn close"></button>
                        <button class="terminal-btn minimize"></button>
                        <button class="terminal-btn maximize"></button>
                    </div>
                </div>
                <div class="answer-content">
                    <div class="answer-section">
                        <div class="answer-section-header">
                            <i class="fas fa-code"></i>
                            <h4>Solution Commands</h4>
                        </div>
                        <div class="solution-steps">
                            ${(task.expectedCommands || [])
                              .map((cmd, index) => {
                                // Check if it's a comment (starts with #)
                                const isComment = cmd.trim().startsWith("#");
                                const cmdText = isComment
                                  ? cmd.trim().substring(1).trim()
                                  : cmd.trim();
                                const promptChar = isComment ? "#" : "$";

                                return `
                                <div class="solution-step">
                                    <span class="step-prompt">${promptChar}</span>
                                    <span class="step-command">${cmdText}</span>
                                    ${
                                      isComment
                                        ? `<div class="command-output">${cmdText}</div>`
                                        : ""
                                    }
                                </div>
                                `;
                              })
                              .join("")}
                        </div>
                    </div>
                    
                    ${
                      task.verifyCommands && task.verifyCommands.length > 0
                        ? `
                    <div class="answer-section verification-section">
                        <div class="answer-section-header">
                            <i class="fas fa-check-circle"></i>
                            <h4>Verification Commands</h4>
                        </div>
                        <div class="verification-steps">
                            ${task.verifyCommands
                              .map((cmd) => {
                                // Check if it's a comment
                                const isComment = cmd.trim().startsWith("#");
                                const cmdText = isComment
                                  ? cmd.trim().substring(1).trim()
                                  : cmd.trim();
                                const promptChar = isComment ? "#" : "$";

                                return `
                                <div class="verification-step">
                                    <span class="verification-prompt">${promptChar}</span>
                                    <span class="verification-command">${cmdText}</span>
                                </div>
                                `;
                              })
                              .join("")}
                        </div>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `
    )
    .join("");

  updateProgress();
}
// Update time spent on task
function updateTimeSpent(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (task && !task.submitted) {
    if (!task.startTime) {
      task.startTime = new Date();
    }
  }
}

// Submit solution for a single task
function submitSolution(taskId) {
  const task = tasks.find((t) => t.id === taskId);
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
  const solutionLines = solution
    .toLowerCase()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const expectedCommands = (task.expectedCommands || []).map((cmd) =>
    cmd.toLowerCase().replace(/\s+/g, " ").trim()
  );

  if (expectedCommands.length === 0) {
    return {
      score: task.points,
      status: "correct",
      message: `✅ CORRECT! Full marks: ${task.points}/${task.points} points`,
    };
  }

  let matched = 0;
  let total = expectedCommands.length;

  // Check each expected command
  expectedCommands.forEach((expected) => {
    const essentialParts = expected
      .split(" ")
      .filter((part) => part && !part.includes("...") && part.length > 2);

    const found = solutionLines.some((line) => {
      const lineNormalized = line.replace(/\s+/g, " ");
      return essentialParts.every((part) => lineNormalized.includes(part));
    });

    if (found) matched++;
  });

  const percentage = matched / total;
  let score, status, message;

  if (percentage >= 0.9) {
    score = task.points;
    status = "correct";
    message = `✅ CORRECT! Full marks: ${task.points}/${task.points} points`;
  } else if (percentage >= 0.5) {
    score = Math.floor(task.points * 0.5);
    status = "partial";
    message = `⚠️ PARTIAL: ${score}/${task.points} points. Matched ${matched}/${total} commands`;
  } else {
    score = 0;
    status = "incorrect";
    message = `❌ INCORRECT: 0/${task.points} points. Matched ${matched}/${total} commands`;
  }

  return { score, status, message };
}

// Toggle hint visibility
function toggleHint(taskId, button) {
  const hintBox = document.getElementById(`hint-${taskId}`);
  if (hintBox) {
    hintBox.classList.toggle("visible");
    if (button) {
      button.textContent = hintBox.classList.contains("visible")
        ? "Hide Hint"
        : "Show Hint";
    }
  }
}

// Toggle answer visibility
function toggleAnswer(taskId, button) {
  const answerBox = document.getElementById(`answer-${taskId}`);
  if (answerBox) {
    answerBox.classList.toggle("visible");
    if (button) {
      button.textContent = answerBox.classList.contains("visible")
        ? "Hide Answer"
        : "Show Answer";
    }
  }
}

// Update progress stats
function updateProgress() {
  const submitted = tasks.filter((t) => t.submitted).length;
  const total = tasks.length;
  const currentScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);

  // Count statuses
  const correct = tasks.filter((t) => t.status === "correct").length;
  const partial = tasks.filter((t) => t.status === "partial").length;
  const incorrect = tasks.filter((t) => t.status === "incorrect").length;
  const unanswered = tasks.filter((t) => !t.submitted).length;

  // Update UI
  document.getElementById("submittedCount").textContent = submitted;
  document.getElementById("currentScore").textContent = currentScore;
  document.getElementById("progressPercent").textContent = `${Math.round(
    (submitted / total) * 100
  )}%`;
  document.getElementById("progressBar").style.width = `${
    (submitted / total) * 100
  }%`;

  document.getElementById("correctCount").textContent = correct;
  document.getElementById("partialCount").textContent = partial;
  document.getElementById("incorrectCount").textContent = incorrect;
  document.getElementById("unansweredCount").textContent = unanswered;

  // Update time per task
  if (submitted > 0) {
    const timeElapsed = 9000 - timeRemaining;
    const avgTime = Math.floor(timeElapsed / submitted / 60);
    const seconds = Math.floor((timeElapsed / submitted) % 60);
    document.getElementById("timePerTask").textContent = `${avgTime}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  // Update time checkpoints
  updateTimeCheckpoints();
}

// Update time checkpoints
function updateTimeCheckpoints() {
  const submitted = tasks.filter((t) => t.submitted).length;
  const timeElapsed = 9000 - timeRemaining;
  const minutesElapsed = Math.floor(timeElapsed / 60);

  // Update checkpoint statuses
  const checkpoints = [
    { id: "checkpoint1", target: 6, time: 30 },
    { id: "checkpoint2", target: 12, time: 60 },
    { id: "checkpoint3", target: 17, time: 90 },
    { id: "checkpoint4", target: tasks.length, time: 120 },
    { id: "checkpoint5", target: tasks.length, time: 135 },
  ];

  checkpoints.forEach((checkpoint) => {
    const element = document.getElementById(checkpoint.id);
    if (element) {
      if (minutesElapsed >= checkpoint.time) {
        element.textContent = submitted >= checkpoint.target ? "✅" : "❌";
      } else {
        element.textContent = "⏳";
      }
    }
  });

  // Update time status
  const timeStatus = document.getElementById("timeStatus");
  const pace = submitted / (minutesElapsed || 1);

  if (pace >= 0.2) {
    // 12+ tasks per hour
    timeStatus.textContent = "Excellent Pace";
    timeStatus.style.color = "#10b981";
  } else if (pace >= 0.15) {
    // 9+ tasks per hour
    timeStatus.textContent = "Good Pace";
    timeStatus.style.color = "#f59e0b";
  } else {
    timeStatus.textContent = "Need to Speed Up";
    timeStatus.style.color = "#ef4444";
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
      alert("⏰ Time is up! Submitting exam automatically.");
      submitExam();
    }
  }, 1000);
}

// Update timer display
function updateTimerDisplay() {
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const display = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const timerEl = document.getElementById("timerDisplay");
  timerEl.textContent = display;

  // Update timer color based on time remaining
  timerEl.className = "timer-display";
  if (timeRemaining <= 1800) {
    // 30 minutes
    timerEl.classList.add("warning");
  }
  if (timeRemaining <= 900) {
    // 15 minutes
    timerEl.classList.add("critical");
  }
}

// Submit exam
function submitExam() {
  if (examSubmitted) return;

  const unanswered = tasks.filter((t) => !t.submitted).length;
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);

  if (unanswered > 0) {
    if (
      !confirm(
        `⚠️ You have ${unanswered} unanswered task(s).\n\nUnanswered tasks will score 0 points.\n\nSubmit exam anyway?`
      )
    ) {
      return;
    }
  } else {
    if (
      !confirm(
        "📤 Ready to submit your exam for grading?\n\nYou cannot change answers after submission."
      )
    ) {
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
    tasks: tasks.map((t) => ({
      id: t.id,
      description: t.description,
      points: t.points,
      score: t.score || 0,
      status: t.submitted ? t.status : "unanswered",
      category: t.category,
      timeSpent: t.timeSpent || 0,
    })),
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
  document.getElementById(
    "finalScore"
  ).textContent = `${totalScore}/${totalPoints}`;
  document.getElementById("finalScore").style.color = passed
    ? "#10b981"
    : "#ef4444";

  // Update pass badge
  const passBadge = document.getElementById("passBadge");
  if (passed) {
    passBadge.className = "pass-badge passed";
    passBadge.innerHTML = `🎉 PASSED! ${Math.round(
      (totalScore / totalPoints) * 100
    )}%`;
  } else {
    passBadge.className = "pass-badge failed";
    passBadge.innerHTML = `❌ FAILED (Need 210+). ${Math.round(
      (totalScore / totalPoints) * 100
    )}%`;
  }

  // Update performance stats
  const submitted = tasks.filter((t) => t.submitted).length;
  const accuracy =
    submitted > 0
      ? Math.round(
          (tasks.filter((t) => t.status === "correct").length / submitted) * 100
        )
      : 0;
  const avgTimePerTask =
    submitted > 0 ? (minutesUsed / submitted).toFixed(1) : 0;

  document.getElementById("accuracyRate").textContent = `${accuracy}%`;
  document.getElementById("timeUsed").textContent = `${minutesUsed} min`;
  document.getElementById(
    "taskSpeed"
  ).textContent = `${avgTimePerTask} min/task`;

  // Update task breakdown
  const breakdown = document.getElementById("resultBreakdown");
  breakdown.innerHTML = tasks
    .map((task) => {
      let icon, statusClass, scoreText;

      if (!task.submitted) {
        icon = "○";
        statusClass = "unanswered";
        scoreText = `0/${task.points}`;
      } else if (task.status === "correct") {
        icon = "✓";
        statusClass = "correct";
        scoreText = `${task.score}/${task.points}`;
      } else if (task.status === "partial") {
        icon = "◐";
        statusClass = "partial";
        scoreText = `${task.score}/${task.points}`;
      } else {
        icon = "✗";
        statusClass = "incorrect";
        scoreText = `0/${task.points}`;
      }

      return `
            <div class="breakdown-item ${statusClass}">
                <div>
                    <strong>${icon} Task ${
        task.id
      }:</strong> ${task.description.substring(0, 50)}...
                    <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                        ${categoryMap[task.category] || task.category} • ${
        task.timeSpent || 0
      }s spent
                    </div>
                </div>
                <div style="font-weight: bold; font-size: 18px;">
                    ${scoreText}
                </div>
            </div>
        `;
    })
    .join("");

  // Show weakness analysis
  const weaknessList = document.getElementById("weaknessList");
  const categories = {};

  tasks.forEach((task) => {
    if (task.status !== "correct" || !task.submitted) {
      categories[task.category] = (categories[task.category] || 0) + 1;
    }
  });

  const weaknesses = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(
      ([cat, count]) =>
        `<li>${categoryMap[cat] || cat}: ${count} weak task(s)</li>`
    )
    .join("");

  weaknessList.innerHTML = weaknesses
    ? `<ul>${weaknesses}</ul>`
    : "<p>No significant weaknesses found! Great job!</p>";

  // Show modal
  document.getElementById("resultsModal").classList.remove("hidden");
}

// Restart exam
function restartExam() {
  document.getElementById("resultsModal").classList.add("hidden");
  document.getElementById("examInterface").classList.add("hidden");
  document.getElementById("welcomeScreen").classList.remove("hidden");
  displayHistory();
}

// Review exam answers
function reviewExam() {
  document.getElementById("resultsModal").classList.add("hidden");

  // Highlight tasks based on status
  tasks.forEach((task) => {
    const card = document.getElementById(`task-${task.id}`);
    if (card) {
      if (!task.submitted) {
        card.style.border = "3px solid #6b7280";
        card.style.background = "#f9fafb";
      } else if (task.status === "incorrect") {
        card.style.border = "3px solid #ef4444";
        card.style.background = "#fef2f2";
      } else if (task.status === "partial") {
        card.style.border = "3px solid #f59e0b";
        card.style.background = "#fffbeb";
      }
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Practice weakness areas
function practiceWeakness() {
  const categories = {};

  tasks.forEach((task) => {
    if (task.status !== "correct" || !task.submitted) {
      categories[task.category] = (categories[task.category] || 0) + 1;
    }
  });

  if (Object.keys(categories).length === 0) {
    alert("No weaknesses found! You're ready for the exam!");
    return;
  }

  const weakestCategory = Object.entries(categories).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  setPracticeCategory(weakestCategory);
  document.getElementById("resultsModal").classList.add("hidden");
  document.getElementById("examInterface").classList.add("hidden");
  document.getElementById("welcomeScreen").classList.remove("hidden");

  alert(
    `Practice mode set to: ${
      categoryMap[weakestCategory] || weakestCategory
    }\n\nClick "Start New Exam" to practice this area.`
  );
}

// Download results
function downloadResults() {
  const totalScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
  const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
  const passed = totalScore >= 210;
  const timeUsed = Math.floor((9000 - timeRemaining) / 60);

  let report = `RHCSA EX300 Exam Results - Exam #${currentExamNumber - 1}\n`;
  report += "=".repeat(50) + "\n\n";
  report += `Date: ${new Date().toLocaleString()}\n`;
  report += `Category: ${
    selectedCategory === "all"
      ? "All RHCSA Topics"
      : categoryMap[selectedCategory]
  }\n`;
  report += `Final Score: ${totalScore}/${totalPoints} (${Math.round(
    (totalScore / totalPoints) * 100
  )}%)\n`;
  report += `Result: ${passed ? "PASSED ✓" : "FAILED ✗"}\n`;
  report += `Passing Score: 210/300 (70%)\n`;
  report += `Time Used: ${timeUsed} minutes\n\n`;
  report += `Task Breakdown:\n`;
  report += "-".repeat(50) + "\n\n";

  tasks.forEach((task) => {
    const status = !task.submitted
      ? "UNANSWERED"
      : task.status === "correct"
      ? "CORRECT"
      : task.status === "partial"
      ? "PARTIAL"
      : "INCORRECT";

    report += `Task ${task.id}: ${status} - ${task.score || 0}/${
      task.points
    } points\n`;
    report += `Description: ${task.description}\n`;
    if (task.solution) {
      report += `Your Solution:\n${task.solution}\n`;
    }
    report += `Expected Solution:\n${(task.expectedCommands || []).join(
      "\n"
    )}\n`;
    report += `\n`;
  });

  const correct = tasks.filter((t) => t.status === "correct").length;
  const partial = tasks.filter((t) => t.status === "partial").length;
  const incorrect = tasks.filter((t) => t.status === "incorrect").length;
  const unanswered = tasks.filter((t) => !t.submitted).length;

  report += `\nSummary:\n`;
  report += "-".repeat(50) + "\n";
  report += `Correct: ${correct}\n`;
  report += `Partial: ${partial}\n`;
  report += `Incorrect: ${incorrect}\n`;
  report += `Unanswered: ${unanswered}\n`;
  report += `Accuracy: ${correct + partial}/${tasks.length} (${Math.round(
    ((correct + partial) / tasks.length) * 100
  )}%)\n`;

  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `RHCSA_Exam_${currentExamNumber - 1}_${
    new Date().toISOString().split("T")[0]
  }.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Save history to localStorage
function saveHistory() {
  localStorage.setItem("rhcsaExamHistory", JSON.stringify(examHistory));
}

// Load history from localStorage
function loadHistory() {
  const saved = localStorage.getItem("rhcsaExamHistory");
  if (saved) {
    try {
      examHistory = JSON.parse(saved);
      currentExamNumber = examHistory.length + 1;
      displayHistory();
    } catch (e) {
      console.error("Error loading history:", e);
    }
  }
}

// Display history
function displayHistory() {
  const historyList = document.getElementById("examHistoryList");
  const historySection = document.getElementById("examHistorySection");

  if (examHistory.length === 0) {
    historySection.style.display = "none";
    return;
  }

  historySection.style.display = "block";

  // Show last 10 exams
  const recentExams = examHistory.slice(-10).reverse();

  historyList.innerHTML = recentExams
    .map((exam) => {
      const passClass = exam.score >= 210 ? "passed" : "failed";
      const passText = exam.score >= 210 ? "PASS" : "FAIL";
      const date = new Date(exam.date).toLocaleDateString();
      const category =
        exam.category === "all"
          ? "All Topics"
          : categoryMap[exam.category] || exam.category;

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
    })
    .join("");

  // Update statistics
  const totalAttempts = examHistory.length;
  const highestScore = Math.max(...examHistory.map((e) => e.score));
  const avgScore = Math.round(
    examHistory.reduce((sum, e) => sum + e.score, 0) / totalAttempts
  );
  const passCount = examHistory.filter((e) => e.score >= 210).length;
  const passRate = Math.round((passCount / totalAttempts) * 100);

  document.getElementById("totalAttempts").textContent = totalAttempts;
  document.getElementById("highestScore").textContent = `${highestScore}/300`;
  document.getElementById("avgScore").textContent = `${avgScore}/300`;
  document.getElementById("passRate").textContent = `${passRate}%`;

  // Draw chart
  drawChart();
}

// Draw score chart
function drawChart() {
  const chart = document.getElementById("scoreChart");
  const lastExams = examHistory.slice(-8);

  if (lastExams.length === 0) {
    chart.innerHTML =
      '<div style="text-align: center; padding: 50px; color: #6b7280;">No exam data yet</div>';
    return;
  }

  const maxScore = 300;
  const barWidth = 100 / lastExams.length;

  chart.innerHTML = lastExams
    .map((exam, index) => {
      const height = (exam.score / maxScore) * 150;
      const color = exam.score >= 210 ? "#10b981" : "#ef4444";

      return `
            <div class="chart-bar" style="height: ${height}px; background: ${color}; width: ${barWidth}%;">
                <div class="chart-value">${exam.score}</div>
                <div class="chart-label">#${exam.examNumber}</div>
            </div>
        `;
    })
    .join("");
}

// Reset history
function resetHistory() {
  if (confirm("⚠️ This will delete all your exam history. Are you sure?")) {
    localStorage.removeItem("rhcsaExamHistory");
    examHistory = [];
    currentExamNumber = 1;
    displayHistory();
    alert("✅ History reset successfully!");
  }
}

// ===================== COMPLETE RHCSA QUESTION POOL =====================
// 400+ Questions - 20+ per topic

const questionPool = [
  // ========== 1. SYSTEM ACCESS & COMMAND LINE (25 questions) ==========
  {
    desc: "Access the command line using local console and switch between virtual terminals (tty1 to tty3).",
    points: 10,
    cmds: [
      "Ctrl+Alt+F1 # Switch to tty1",
      "Ctrl+Alt+F2 # Switch to tty2",
      "Ctrl+Alt+F3 # Switch to tty3",
      "who # Check current terminal",
    ],
    verify: ["who", "tty"],
    hint: "Use Ctrl+Alt+F[1-6] for virtual terminals",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Execute basic commands: check current directory, list files, check system uptime, and view calendar.",
    points: 10,
    cmds: ["pwd", "ls -la", "uptime", "cal", "date"],
    verify: ["pwd", "ls", "uptime"],
    hint: "pwd = print working directory, ls -la = detailed list",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Use shell expansions: list all .conf files in /etc, find files modified in last 24 hours in /var/log.",
    points: 15,
    cmds: [
      "ls /etc/*.conf | head -10",
      "find /var/log -type f -mtime -1 | head -10",
    ],
    verify: [
      "ls /etc/*.conf 2>/dev/null | wc -l",
      "find /var/log -type f -mtime -1 2>/dev/null | wc -l",
    ],
    hint: "* wildcard matches any characters, -mtime -1 = modified last 24h",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Use man pages to learn about 'ls' command. Find option to list directory contents with inode numbers.",
    points: 10,
    cmds: ["man ls", "# Search for inode in man page", "ls -i /etc | head -5"],
    verify: ["ls -i /etc/passwd", "whatis ls"],
    hint: "man command opens manual, / searches in man page",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Use --help option with common commands and check whatis/apropos for command information.",
    points: 10,
    cmds: ["ls --help | head -20", "whatis ls", "apropos directory | head -10"],
    verify: ["whatis ls grep", "apropos search"],
    hint: "--help shows brief help, whatis shows one-line description",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Redirect command output: save process list to /tmp/processes.txt and append current date to /tmp/log.txt.",
    points: 15,
    cmds: [
      "ps aux > /tmp/processes.txt",
      "date >> /tmp/log.txt",
      "wc -l /tmp/processes.txt",
      "tail -1 /tmp/log.txt",
    ],
    verify: ["ls -l /tmp/processes.txt", "tail -1 /tmp/log.txt"],
    hint: "> redirects stdout (overwrites), >> appends",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Pipe commands: count number of users logged in, find specific user processes.",
    points: 10,
    cmds: [
      "who | wc -l",
      "ps aux | grep root | head -5",
      "ls -la /etc | grep conf | wc -l",
    ],
    verify: ["who | wc -l", "ps aux | grep -c root"],
    hint: "| pipes output of one command as input to another",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Use tab completion and command history to execute previous commands.",
    points: 10,
    cmds: [
      "history | tail -20",
      "!5 # execute command number 5 from history",
      "!! # repeat last command",
    ],
    verify: ["history | wc -l"],
    hint: "Tab completes commands/filenames, !number executes from history",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Create simple alias for frequently used commands.",
    points: 10,
    cmds: ["alias ll='ls -la'", "alias rm='rm -i'", "alias # list all aliases"],
    verify: ["alias ll", "alias rm"],
    hint: "alias creates shortcut, add to ~/.bashrc for permanent",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Set environment variables and check current shell variables.",
    points: 15,
    cmds: ["export MYVAR='test'", "echo $MYVAR", "env | head -20", "printenv"],
    verify: ["echo $MYVAR", "env | grep MYVAR"],
    hint: "export sets environment variable, env shows all",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Edit shell configuration file (.bashrc) to customize prompt.",
    points: 15,
    cmds: [
      "echo 'export PS1=\"[\\u@\\h \\W]\\$ \"' >> ~/.bashrc",
      "source ~/.bashrc",
    ],
    verify: ["echo $PS1"],
    hint: "PS1 controls prompt format, source reloads config",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Use screen or tmux to manage multiple terminal sessions.",
    points: 20,
    cmds: [
      "screen -S session1",
      "Ctrl+a c # create new window in screen",
      "Ctrl+a n # next window",
      "screen -ls # list sessions",
    ],
    verify: ["screen -ls", "tmux ls"],
    hint: "screen/tmux allows session persistence",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Execute commands with sudo and understand sudoers configuration.",
    points: 15,
    cmds: ["sudo whoami", "sudo -l", "visudo # edit sudoers file"],
    verify: ["sudo whoami", "sudo -l"],
    hint: "sudo runs as root, visudo edits sudoers safely",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Use find command with multiple criteria: find files by name, size, and permissions.",
    points: 20,
    cmds: [
      "find /var -name '*.log' -size +1M -mtime -7",
      "find /home -type f -perm 0777",
      "find /etc -type f -executable",
    ],
    verify: ["find /var -name '*.log' 2>/dev/null | wc -l"],
    hint: "find -name matches name, -size matches size, -mtime matches modification time",
    category: "system-access",
    difficulty: "hard",
  },
  {
    desc: "Use grep with regex patterns to search in files.",
    points: 20,
    cmds: [
      "grep -r 'error' /var/log/",
      "grep -E '^[A-Z]' /etc/passwd",
      "grep -v '^#' /etc/ssh/sshd_config",
    ],
    verify: ["grep -c error /var/log/messages"],
    hint: "grep -r recursive, -E extended regex, -v invert match",
    category: "system-access",
    difficulty: "hard",
  },
  {
    desc: "Use awk to process text files: print specific columns.",
    points: 20,
    cmds: [
      "awk -F: '{print $1}' /etc/passwd",
      "df -h | awk '{print $1, $5}'",
      "ps aux | awk '{print $2, $11}' | head -10",
    ],
    verify: ["awk -F: '{print $1}' /etc/passwd | head -5"],
    hint: "awk processes text, -F sets field separator",
    category: "system-access",
    difficulty: "hard",
  },
  {
    desc: "Use sed to edit files: replace text, delete lines.",
    points: 20,
    cmds: [
      "sed 's/old/new/g' file.txt",
      "sed '/pattern/d' file.txt",
      "sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config",
    ],
    verify: ["sed -n '/Port/p' /etc/ssh/sshd_config"],
    hint: "sed stream editor, -i in-place edit",
    category: "system-access",
    difficulty: "hard",
  },
  {
    desc: "Create and use functions in bash shell.",
    points: 20,
    cmds: [
      'function myfunc() { echo "Hello $1"; }',
      "myfunc world",
      "declare -f # list functions",
    ],
    verify: ["declare -f myfunc"],
    hint: "function keyword creates reusable code block",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Use cut command to extract specific columns from text.",
    points: 15,
    cmds: [
      "cut -d: -f1 /etc/passwd",
      "cut -c1-10 /etc/passwd",
      "echo 'one,two,three' | cut -d, -f2",
    ],
    verify: ["cut -d: -f1 /etc/passwd | head -5"],
    hint: "cut extracts columns, -d sets delimiter, -f field number",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Sort and filter command output with sort, uniq, and wc.",
    points: 15,
    cmds: [
      "sort /etc/passwd",
      "cut -d: -f7 /etc/passwd | sort | uniq -c",
      "wc -l /etc/passwd",
    ],
    verify: ["wc -l /etc/passwd", "sort /etc/passwd | head -5"],
    hint: "sort orders lines, uniq removes duplicates, -c counts",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Use xargs to execute commands on multiple arguments.",
    points: 20,
    cmds: [
      "find /tmp -name '*.tmp' -print0 | xargs -0 rm",
      "echo 'file1 file2 file3' | xargs touch",
      "ls *.txt | xargs wc -l",
    ],
    verify: ["find /tmp -name '*.tmp' 2>/dev/null | wc -l"],
    hint: "xargs builds and executes commands from stdin",
    category: "system-access",
    difficulty: "hard",
  },
  {
    desc: "Monitor system with watch command.",
    points: 10,
    cmds: ["watch -n 1 'date'", "watch -n 2 'free -h'", "watch -d 'ls -la'"],
    verify: ["ps aux | grep watch"],
    hint: "watch runs command repeatedly, -n sets interval",
    category: "system-access",
    difficulty: "easy",
  },
  {
    desc: "Use tee to split output: display and save to file.",
    points: 15,
    cmds: [
      "ls -la | tee filelist.txt",
      "dmesg | tee -a log.txt",
      "echo 'test' | tee file1 file2",
    ],
    verify: ["ls filelist.txt", "cat filelist.txt | head -5"],
    hint: "tee duplicates output, -a appends",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Create command substitution with $(...) syntax.",
    points: 15,
    cmds: [
      'echo "Today is $(date)"',
      'echo "Files: $(ls | wc -l)"',
      "cd $(mktemp -d)",
    ],
    verify: ["echo $(date)"],
    hint: "$(...) executes command and uses its output",
    category: "system-access",
    difficulty: "medium",
  },
  {
    desc: "Process substitution with <() syntax.",
    points: 20,
    cmds: [
      "diff <(ls dir1) <(ls dir2)",
      "cat <(echo hello) <(echo world)",
      "paste <(seq 1 5) <(seq 6 10)",
    ],
    verify: ["echo <(echo test)"],
    hint: "<() treats command output as file",
    category: "system-access",
    difficulty: "hard",
  },

  // ========== 2. FILES & DIRECTORIES (25 questions) ==========
  {
    desc: "Navigate Linux file system: list contents of /etc, /var/log, check /home directory, and verify /tmp permissions.",
    points: 15,
    cmds: [
      "ls -l /etc | head -10",
      "ls -l /var/log | head -10",
      "ls -ld /home",
      "ls -ld /tmp",
      "file /etc/passwd",
    ],
    verify: ["ls -ld /tmp", "file /etc/passwd"],
    hint: "ls -ld shows directory permissions, file shows file type",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "Create directory structure: /projects/{docs,src,bin} with proper permissions 755.",
    points: 15,
    cmds: [
      "mkdir -p /projects/{docs,src,bin}",
      "chmod 755 /projects",
      "chmod 755 /projects/*",
      "ls -ld /projects",
      "ls -l /projects",
    ],
    verify: ["ls -ld /projects", "ls -l /projects"],
    hint: "mkdir -p creates parent dirs, brace expansion creates multiple",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "Copy /etc/hosts to /tmp preserving all attributes, then create symbolic link to it.",
    points: 15,
    cmds: [
      "cp -a /etc/hosts /tmp/hosts.backup",
      "ln -s /tmp/hosts.backup /tmp/hosts.link",
      "ls -li /etc/hosts /tmp/hosts.backup /tmp/hosts.link",
    ],
    verify: ["ls -li /etc/hosts /tmp/hosts.backup", "readlink /tmp/hosts.link"],
    hint: "cp -a preserves all, ln -s creates symbolic link",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "Move and rename files in /tmp directory.",
    points: 10,
    cmds: [
      "touch /tmp/file1 /tmp/file2",
      "mv /tmp/file1 /tmp/file1.renamed",
      "mv /tmp/file2 /tmp/backup/",
      "ls -l /tmp/",
    ],
    verify: ["ls /tmp/file1.renamed", "ls /tmp/backup/file2"],
    hint: "mv moves/renames files",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "Remove files and directories with confirmation.",
    points: 10,
    cmds: [
      "mkdir -p /tmp/testdir",
      "touch /tmp/testdir/{file1,file2,file3}",
      "rm -i /tmp/testdir/file1",
      "rm -rf /tmp/testdir",
    ],
    verify: ["ls /tmp/testdir 2>/dev/null || echo 'removed'"],
    hint: "rm -i interactive, -r recursive, -f force",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "Create hard links and compare with symbolic links.",
    points: 15,
    cmds: [
      "echo 'test' > /tmp/original.txt",
      "ln /tmp/original.txt /tmp/hardlink.txt",
      "ln -s /tmp/original.txt /tmp/softlink.txt",
      "ls -li /tmp/*.txt",
    ],
    verify: ["ls -li /tmp/original.txt /tmp/hardlink.txt"],
    hint: "Hard links share inode, symlinks are separate files",
    category: "files-directories",
    difficulty: "medium",
  },
  {
    desc: "Find files by type and execute commands on them.",
    points: 20,
    cmds: [
      "find /var/log -type f -name '*.log' -exec ls -lh {} \\;",
      "find /home -type d -empty",
      "find /etc -type f -executable -ls",
    ],
    verify: ["find /var/log -type f -name '*.log' 2>/dev/null | wc -l"],
    hint: "find -exec executes command on found files",
    category: "files-directories",
    difficulty: "hard",
  },
  {
    desc: "Search for files containing specific text pattern.",
    points: 15,
    cmds: [
      "grep -r 'root' /etc/ 2>/dev/null | head -10",
      "grep -l 'bash' /etc/passwd /etc/shadow",
      "find /usr/share/doc -type f -exec grep -l 'license' {} \\;",
    ],
    verify: ["grep -c root /etc/passwd"],
    hint: "grep -r recursive search, -l list files only",
    category: "files-directories",
    difficulty: "medium",
  },
  {
    desc: "Compare two files and show differences.",
    points: 15,
    cmds: [
      "echo 'file1' > /tmp/f1 && echo 'file2' > /tmp/f2",
      "diff /tmp/f1 /tmp/f2",
      "cmp /tmp/f1 /tmp/f2",
    ],
    verify: ["diff /tmp/f1 /tmp/f2"],
    hint: "diff shows differences, cmp compares binary",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "View file contents with head, tail, less, and more.",
    points: 10,
    cmds: [
      "head -20 /etc/passwd",
      "tail -10 /var/log/messages",
      "less /etc/services",
    ],
    verify: ["head -5 /etc/passwd", "tail -5 /var/log/messages"],
    hint: "head shows beginning, tail shows end",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "Count lines, words, and characters in files.",
    points: 10,
    cmds: ["wc -l /etc/passwd", "wc -w /etc/passwd", "wc -c /etc/passwd"],
    verify: ["wc -l /etc/passwd"],
    hint: "wc counts lines, words, characters",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "Split large files into smaller parts.",
    points: 20,
    cmds: [
      "split -l 100 /etc/services /tmp/services.part",
      "split -b 1M largefile.txt smallfile.part",
      "cat /tmp/services.part* > /tmp/services.combined",
    ],
    verify: [
      "ls /tmp/services.part*",
      "wc -l /etc/services /tmp/services.combined",
    ],
    hint: "split divides files, -l by lines, -b by bytes",
    category: "files-directories",
    difficulty: "hard",
  },
  {
    desc: "Join multiple files based on common field.",
    points: 20,
    cmds: [
      "echo '1 apple' > /tmp/f1 && echo '1 fruit' > /tmp/f2",
      "join -j 1 /tmp/f1 /tmp/f2",
      "paste /tmp/f1 /tmp/f2",
    ],
    verify: ["join /tmp/f1 /tmp/f2"],
    hint: "join merges files by common field, paste merges lines",
    category: "files-directories",
    difficulty: "hard",
  },
  {
    desc: "Change file timestamps with touch command.",
    points: 15,
    cmds: [
      "touch -t 202301011200 /tmp/newfile",
      "touch -a /tmp/newfile",
      "touch -m /tmp/newfile",
      "stat /tmp/newfile",
    ],
    verify: ["stat /tmp/newfile | grep Modify"],
    hint: "touch -t sets specific time, -a access time, -m modification",
    category: "files-directories",
    difficulty: "medium",
  },
  {
    desc: "Create sparse files to save disk space.",
    points: 20,
    cmds: [
      "dd if=/dev/zero of=/tmp/sparsefile bs=1 count=0 seek=1G",
      "ls -lh /tmp/sparsefile",
      "du -h /tmp/sparsefile",
    ],
    verify: ["ls -lh /tmp/sparsefile", "du -h /tmp/sparsefile"],
    hint: "dd with seek creates sparse file, allocates only when written",
    category: "files-directories",
    difficulty: "hard",
  },
  {
    desc: "Monitor file changes with inotify tools.",
    points: 20,
    cmds: [
      "inotifywait -m /tmp",
      "# In another terminal: touch /tmp/testfile",
      "ls -l /tmp/testfile",
    ],
    verify: ["which inotifywait"],
    hint: "inotifywait monitors file system events",
    category: "files-directories",
    difficulty: "hard",
  },
  {
    desc: "Check disk usage by directory with du command.",
    points: 15,
    cmds: ["du -sh /var/log", "du -h --max-depth=1 /home", "du -ch *.log"],
    verify: ["du -sh /var/log"],
    hint: "du disk usage, -s summary, -h human readable",
    category: "files-directories",
    difficulty: "medium",
  },
  {
    desc: "Find and delete duplicate files.",
    points: 25,
    cmds: [
      "fdupes -r /home/user",
      "find . -type f -exec md5sum {} \\; | sort | uniq -w32 -d",
    ],
    verify: ["which fdupes", "fdupes --help"],
    hint: "fdupes finds duplicates, md5sum generates checksums",
    category: "files-directories",
    difficulty: "hard",
  },
  {
    desc: "Create and use named pipes (FIFOs).",
    points: 25,
    cmds: [
      "mkfifo /tmp/myfifo",
      "echo 'test' > /tmp/myfifo &",
      "cat /tmp/myfifo",
      "ls -l /tmp/myfifo",
    ],
    verify: ["ls -l /tmp/myfifo | grep ^p"],
    hint: "mkfifo creates named pipe, used for inter-process communication",
    category: "files-directories",
    difficulty: "hard",
  },
  {
    desc: "Use mktemp to create secure temporary files.",
    points: 15,
    cmds: [
      "TEMP=$(mktemp)",
      "echo 'data' > $TEMP",
      "mktemp -d /tmp/mydir.XXXXXX",
      "ls -l $TEMP",
    ],
    verify: ["ls -l $TEMP"],
    hint: "mktemp creates unique temporary files",
    category: "files-directories",
    difficulty: "medium",
  },
  {
    desc: "Change file ownership with chown command.",
    points: 15,
    cmds: [
      "touch /tmp/ownedfile",
      "chown root:root /tmp/ownedfile",
      "chown user1 /tmp/ownedfile",
      "chown :group1 /tmp/ownedfile",
    ],
    verify: ["ls -l /tmp/ownedfile"],
    hint: "chown user:group file, :group changes group only",
    category: "files-directories",
    difficulty: "medium",
  },
  {
    desc: "Change file group with chgrp command.",
    points: 10,
    cmds: [
      "touch /tmp/groupfile",
      "chgrp wheel /tmp/groupfile",
      "ls -l /tmp/groupfile",
    ],
    verify: ["ls -l /tmp/groupfile | cut -d' ' -f4"],
    hint: "chgrp changes group ownership",
    category: "files-directories",
    difficulty: "easy",
  },
  {
    desc: "Use locate and updatedb to find files.",
    points: 15,
    cmds: [
      "updatedb",
      "locate passwd",
      "locate -c *.conf",
      "locate -i 'readme'",
    ],
    verify: ["locate passwd | head -5"],
    hint: "locate uses database, updatedb refreshes it",
    category: "files-directories",
    difficulty: "medium",
  },
  {
    desc: "Create file with specific size using dd.",
    points: 20,
    cmds: [
      "dd if=/dev/zero of=/tmp/100mb bs=1M count=100",
      "dd if=/dev/urandom of=/tmp/random.bin bs=1M count=10",
      "ls -lh /tmp/100mb",
    ],
    verify: ["ls -lh /tmp/100mb", "file /tmp/random.bin"],
    hint: "dd copies data, if input file, of output file, bs block size",
    category: "files-directories",
    difficulty: "hard",
  },
  {
    desc: "Verify file integrity with checksums.",
    points: 15,
    cmds: ["md5sum /etc/passwd", "sha256sum /etc/passwd", "cksum /etc/passwd"],
    verify: ["md5sum /etc/passwd"],
    hint: "md5sum, sha256sum generate checksums",
    category: "files-directories",
    difficulty: "medium",
  },

  // ========== 3. USERS & GROUPS (25 questions) ==========
  {
    desc: "Create user 'alice' with UID 1500, home directory /home/alice, shell /bin/bash, and set password.",
    points: 15,
    cmds: [
      "useradd -u 1500 -m -s /bin/bash alice",
      "echo 'alice:password123' | chpasswd",
      "id alice",
      "ls -ld /home/alice",
    ],
    verify: ["id alice", "getent passwd alice", "ls -ld /home/alice"],
    hint: "useradd -m creates home dir, -s sets shell, -u sets UID",
    category: "users-groups",
    difficulty: "easy",
  },
  {
    desc: "Create group 'developers' with GID 3000, add users 'alice' and 'bob' to this group.",
    points: 15,
    cmds: [
      "groupadd -g 3000 developers",
      "usermod -aG developers alice",
      "usermod -aG developers bob",
      "getent group developers",
    ],
    verify: ["getent group developers", "id alice", "id bob"],
    hint: "usermod -aG adds to supplementary group (preserves existing)",
    category: "users-groups",
    difficulty: "easy",
  },
  {
    desc: "Set password aging for user 'charlie': max 90 days, min 7 days, warn 14 days before expiry.",
    points: 15,
    cmds: [
      "useradd charlie",
      "chage -M 90 -m 7 -W 14 charlie",
      "chage -l charlie",
    ],
    verify: [
      "chage -l charlie | grep 'Maximum'",
      "chage -l charlie | grep 'Minimum'",
    ],
    hint: "chage -M sets max days, -m min days, -W warn days",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Lock user account 'inactive' and unlock it after verifying.",
    points: 10,
    cmds: [
      "useradd inactive",
      "passwd -l inactive",
      "passwd -S inactive",
      "passwd -u inactive",
      "passwd -S inactive",
    ],
    verify: ["passwd -S inactive"],
    hint: "passwd -l locks, -u unlocks, -S shows status",
    category: "users-groups",
    difficulty: "easy",
  },
  {
    desc: "Gain superuser access using sudo and su commands. Check sudo privileges for current user.",
    points: 10,
    cmds: ["sudo whoami", "sudo -l", "su - -c 'whoami'"],
    verify: ["sudo whoami", "sudo -l"],
    hint: "sudo runs command as root, su - switches to root shell",
    category: "users-groups",
    difficulty: "easy",
  },
  {
    desc: "Modify user properties: change shell, home directory, and comment.",
    points: 15,
    cmds: [
      "usermod -s /bin/sh alice",
      "usermod -d /home/newalice -m alice",
      "usermod -c 'Alice Developer' alice",
      "getent passwd alice",
    ],
    verify: ["getent passwd alice", "ls -ld /home/newalice"],
    hint: "usermod modifies existing user, -m moves home directory",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Delete user and remove home directory.",
    points: 10,
    cmds: [
      "userdel -r testuser",
      "ls -ld /home/testuser 2>/dev/null || echo 'removed'",
    ],
    verify: ["getent passwd testuser 2>/dev/null || echo 'deleted'"],
    hint: "userdel -r removes user and home directory",
    category: "users-groups",
    difficulty: "easy",
  },
  {
    desc: "Create system user without home directory.",
    points: 10,
    cmds: [
      "useradd -r -s /sbin/nologin systemuser",
      "getent passwd systemuser",
      "id systemuser",
    ],
    verify: ["getent passwd systemuser", "ls -ld /home/systemuser 2>/dev/null"],
    hint: "useradd -r creates system user, -s /sbin/nologin prevents login",
    category: "users-groups",
    difficulty: "easy",
  },
  {
    desc: "Set user password expiry and force change on next login.",
    points: 15,
    cmds: ["passwd -e alice", "chage -d 0 alice", "passwd -S alice"],
    verify: ["passwd -S alice", "chage -l alice"],
    hint: "passwd -e expires password, chage -d 0 forces change",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Check logged in users and their activities.",
    points: 10,
    cmds: ["who", "w", "last", "lastlog"],
    verify: ["who", "w | head -5"],
    hint: "who shows logged in users, w shows what they're doing",
    category: "users-groups",
    difficulty: "easy",
  },
  {
    desc: "Configure sudoers file to allow specific commands.",
    points: 25,
    cmds: [
      "visudo",
      "# Add: alice ALL=(ALL) /usr/bin/systemctl, /usr/bin/journalctl",
      "sudo -l -U alice",
    ],
    verify: ["sudo -l -U alice"],
    hint: "visudo edits sudoers safely, always test with sudo -l",
    category: "users-groups",
    difficulty: "hard",
  },
  {
    desc: "Create user with specific primary group.",
    points: 15,
    cmds: [
      "groupadd -g 4001 webadmin",
      "useradd -g webadmin -m webuser",
      "id webuser",
      "groups webuser",
    ],
    verify: ["id webuser", "groups webuser"],
    hint: "useradd -g sets primary group",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Set login.defs configuration for default user values.",
    points: 20,
    cmds: [
      "grep -E '^PASS_MAX_DAYS|^PASS_MIN_DAYS|^PASS_WARN_AGE' /etc/login.defs",
      "sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS 90/' /etc/login.defs",
    ],
    verify: ["grep PASS_MAX_DAYS /etc/login.defs"],
    hint: "/etc/login.defs sets default user creation parameters",
    category: "users-groups",
    difficulty: "hard",
  },
  {
    desc: "Manage user sessions and kill user processes.",
    points: 20,
    cmds: ["pkill -u alice", "killall -u alice", "skill -KILL -u alice"],
    verify: ["ps aux | grep alice"],
    hint: "pkill kills by username, killall kills all processes",
    category: "users-groups",
    difficulty: "hard",
  },
  {
    desc: "Check user resource limits with ulimit.",
    points: 15,
    cmds: ["ulimit -a", "ulimit -n 1024", "ulimit -u 1000"],
    verify: ["ulimit -n", "ulimit -u"],
    hint: "ulimit controls user resource limits",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Configure PAM for authentication policies.",
    points: 30,
    cmds: [
      "grep -r 'pam_unix' /etc/pam.d/",
      "cat /etc/pam.d/system-auth",
      "pam_tally2 --user=alice",
    ],
    verify: ["ls /etc/pam.d/"],
    hint: "PAM modules in /etc/pam.d/, system-auth is main config",
    category: "users-groups",
    difficulty: "hard",
  },
  {
    desc: "Set up user quotas for disk usage.",
    points: 30,
    cmds: [
      "quotacheck -cug /home",
      "quotaon /home",
      "edquota -u alice",
      "repquota /home",
    ],
    verify: ["quota -u alice", "repquota /home"],
    hint: "quotacheck creates quota files, edquota edits quotas",
    category: "users-groups",
    difficulty: "hard",
  },
  {
    desc: "Configure automatic home directory creation.",
    points: 25,
    cmds: [
      "grep CREATE_HOME /etc/login.defs",
      "sed -i 's/^CREATE_HOME.*/CREATE_HOME yes/' /etc/login.defs",
      "systemctl restart systemd-logind",
    ],
    verify: ["grep CREATE_HOME /etc/login.defs"],
    hint: "CREATE_HOME in /etc/login.defs controls home dir creation",
    category: "users-groups",
    difficulty: "hard",
  },
  {
    desc: "Check user login history and failed attempts.",
    points: 15,
    cmds: [
      "lastb",
      "faillock --user alice",
      "grep 'Failed password' /var/log/secure",
    ],
    verify: ["lastb | head -5", "faillock --user alice"],
    hint: "lastb shows failed logins, faillock manages lockouts",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Set up password complexity requirements.",
    points: 25,
    cmds: [
      "grep -r 'pam_pwquality' /etc/pam.d/",
      "vim /etc/security/pwquality.conf",
      "# Set: minlen = 8, minclass = 3",
    ],
    verify: ["grep minlen /etc/security/pwquality.conf"],
    hint: "pwquality.conf controls password complexity",
    category: "users-groups",
    difficulty: "hard",
  },
  {
    desc: "Configure automatic account locking after failed attempts.",
    points: 25,
    cmds: [
      "vim /etc/pam.d/system-auth",
      "# Add: auth required pam_faillock.so preauth",
      "faillock --user alice --reset",
    ],
    verify: ["grep pam_faillock /etc/pam.d/system-auth"],
    hint: "pam_faillock locks accounts after failed attempts",
    category: "users-groups",
    difficulty: "hard",
  },
  {
    desc: "Set up SSH key authentication for user.",
    points: 20,
    cmds: [
      "su - alice -c 'ssh-keygen -t rsa'",
      "cat ~alice/.ssh/id_rsa.pub >> ~alice/.ssh/authorized_keys",
      "chmod 600 ~alice/.ssh/authorized_keys",
      "chown alice:alice ~alice/.ssh/authorized_keys",
    ],
    verify: ["ls -l ~alice/.ssh/", "cat ~alice/.ssh/id_rsa.pub"],
    hint: "SSH keys go in ~/.ssh/authorized_keys with 600 permissions",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Configure user environment variables.",
    points: 15,
    cmds: [
      "echo 'export PATH=$PATH:/usr/local/bin' >> ~alice/.bashrc",
      "echo 'alias ll=\"ls -la\"' >> ~alice/.bash_profile",
      "su - alice -c 'env | grep PATH'",
    ],
    verify: ["cat ~alice/.bashrc | grep PATH"],
    hint: ".bashrc runs for interactive shells, .bash_profile for login",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Set default umask for users.",
    points: 15,
    cmds: [
      "grep -r 'umask' /etc/profile /etc/bashrc",
      "echo 'umask 022' >> /etc/profile",
      "source /etc/profile",
    ],
    verify: ["umask"],
    hint: "umask in /etc/profile sets default for all users",
    category: "users-groups",
    difficulty: "medium",
  },
  {
    desc: "Configure sudo password timeout.",
    points: 20,
    cmds: [
      "grep timestamp_timeout /etc/sudoers",
      "echo 'Defaults timestamp_timeout=30' >> /etc/sudoers",
      "visudo -c",
    ],
    verify: ["sudo grep timestamp_timeout /etc/sudoers"],
    hint: "timestamp_timeout controls sudo password cache duration",
    category: "users-groups",
    difficulty: "hard",
  },

  // ========== 4. PERMISSIONS & ACL (25 questions) ==========
  {
    desc: "Set permissions on /data/secret.txt: owner rw-, group r--, others --- (chmod 640).",
    points: 10,
    cmds: [
      "mkdir -p /data",
      "echo 'secret data' > /data/secret.txt",
      "chmod 640 /data/secret.txt",
      "ls -l /data/secret.txt",
    ],
    verify: ["ls -l /data/secret.txt", "stat -c '%a' /data/secret.txt"],
    hint: "chmod 640 = rw-r----- (owner: 6, group: 4, others: 0)",
    category: "permissions-acl",
    difficulty: "easy",
  },
  {
    desc: "Set SGID bit on /shared directory so new files inherit group ownership.",
    points: 15,
    cmds: [
      "mkdir -p /shared",
      "chmod 2775 /shared",
      "chown :developers /shared",
      "ls -ld /shared",
    ],
    verify: ["ls -ld /shared | grep '^d...s'", "stat -c '%a' /shared"],
    hint: "chmod 2775 = rwxrwsr-x (2 = SGID, 775 = permissions)",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Set ACL for user 'david' on /data/file.txt: rwx permissions. Set default ACL for new files.",
    points: 20,
    cmds: [
      "touch /data/file.txt",
      "setfacl -m u:david:rwx /data/file.txt",
      "setfacl -m d:u:david:rwx /data",
      "getfacl /data/file.txt",
      "getfacl /data",
    ],
    verify: [
      "getfacl /data/file.txt | grep david",
      "getfacl /data | grep default",
    ],
    hint: "setfacl -m modifies ACL, d: sets default ACL",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Set umask to 027 for current session and verify by creating test file and directory.",
    points: 10,
    cmds: [
      "umask 027",
      "touch /tmp/testfile",
      "mkdir /tmp/testdir",
      "ls -ld /tmp/testfile /tmp/testdir",
    ],
    verify: ["umask", "ls -l /tmp/testfile", "ls -ld /tmp/testdir"],
    hint: "umask 027 = files: 640 (666-027), dirs: 750 (777-027)",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Set sticky bit on /tmp directory to prevent users from deleting others' files.",
    points: 15,
    cmds: ["chmod +t /tmp", "ls -ld /tmp", "stat /tmp | grep Access"],
    verify: ["ls -ld /tmp | grep '^d...*t'", "stat -c '%a' /tmp"],
    hint: "chmod +t sets sticky bit (1 in octal), shows as 't' in permissions",
    category: "permissions-acl",
    difficulty: "easy",
  },
  {
    desc: "Set SUID bit on executable to run with owner's privileges.",
    points: 20,
    cmds: ["cp /bin/ls /tmp/myls", "chmod u+s /tmp/myls", "ls -l /tmp/myls"],
    verify: ["ls -l /tmp/myls | grep '^-..s'"],
    hint: "chmod u+s sets SUID (4 in octal), file runs as owner",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Remove all ACL entries from a file.",
    points: 15,
    cmds: ["setfacl -b /data/file.txt", "getfacl /data/file.txt"],
    verify: ["getfacl /data/file.txt | grep '^#' | wc -l"],
    hint: "setfacl -b removes all ACL entries",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Set ACL mask to limit maximum permissions.",
    points: 20,
    cmds: ["setfacl -m m::r /data/file.txt", "getfacl /data/file.txt"],
    verify: ["getfacl /data/file.txt | grep '^mask::'"],
    hint: "ACL mask limits maximum effective permissions",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Copy ACL from one file to another.",
    points: 15,
    cmds: [
      "getfacl /data/source.txt > /tmp/acl.txt",
      "setfacl --set-file=/tmp/acl.txt /data/dest.txt",
      "getfacl /data/dest.txt",
    ],
    verify: ["getfacl /data/source.txt /data/dest.txt | uniq | wc -l"],
    hint: "getfacl saves ACL, setfacl --set-file applies saved ACL",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Set default ACL on directory for new files.",
    points: 20,
    cmds: [
      "setfacl -m d:u:webuser:rwx /web",
      "touch /web/test.txt",
      "getfacl /web/test.txt",
    ],
    verify: [
      "getfacl /web | grep default",
      "getfacl /web/test.txt | grep webuser",
    ],
    hint: "Default ACL applies to newly created files in directory",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Check file attributes with lsattr.",
    points: 15,
    cmds: ["lsattr /etc/passwd", "chattr +i /etc/passwd", "lsattr /etc/passwd"],
    verify: ["lsattr /etc/passwd | grep i"],
    hint: "chattr +i makes file immutable (cannot be modified)",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Set file immutable attribute to prevent changes.",
    points: 20,
    cmds: [
      "chattr +i /etc/resolv.conf",
      "lsattr /etc/resolv.conf",
      "chattr -i /etc/resolv.conf",
    ],
    verify: ["lsattr /etc/resolv.conf"],
    hint: "chattr +i sets immutable attribute, -i removes it",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Configure sudo to preserve environment variables.",
    points: 25,
    cmds: ["echo 'Defaults env_keep += \"PATH\"' >> /etc/sudoers", "visudo -c"],
    verify: ["sudo grep env_keep /etc/sudoers"],
    hint: "env_keep in sudoers preserves environment when using sudo",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Set up facl for group access.",
    points: 20,
    cmds: [
      "setfacl -m g:developers:rw /project/file.txt",
      "getfacl /project/file.txt",
    ],
    verify: ["getfacl /project/file.txt | grep developers"],
    hint: "setfacl -m g:group:perms sets group ACL",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Configure PAM for password history.",
    points: 30,
    cmds: [
      "grep 'remember' /etc/pam.d/system-auth",
      "sed -i '/pam_unix.so/s/$/ remember=5/' /etc/pam.d/system-auth",
    ],
    verify: ["grep remember /etc/pam.d/system-auth"],
    hint: "PAM remember option stores password history",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Set up shared directory with proper permissions.",
    points: 25,
    cmds: [
      "mkdir -p /shared/project",
      "chown :team /shared/project",
      "chmod 2770 /shared/project",
      "setfacl -m d:g:team:rwx /shared/project",
    ],
    verify: ["ls -ld /shared/project", "getfacl /shared/project"],
    hint: "SGID + ACL for shared directory with group collaboration",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Configure password complexity with cracklib.",
    points: 25,
    cmds: [
      "grep 'pam_cracklib' /etc/pam.d/system-auth",
      "sed -i 's/pam_cracklib.so.*/pam_cracklib.so try_first_pass retry=3 minlen=8/' /etc/pam.d/system-auth",
    ],
    verify: ["grep pam_cracklib /etc/pam.d/system-auth"],
    hint: "pam_cracklib enforces password complexity",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Set up ACL for Apache web directory.",
    points: 30,
    cmds: [
      "setfacl -R -m u:apache:rx /var/www/html",
      "setfacl -R -d -m u:apache:rx /var/www/html",
      "getfacl /var/www/html",
    ],
    verify: ["getfacl /var/www/html | grep apache"],
    hint: "-R recursive, -d default ACL for new files",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Configure sudo without password for specific commands.",
    points: 25,
    cmds: [
      "echo 'alice ALL=(ALL) NOPASSWD: /usr/bin/systemctl' >> /etc/sudoers",
      "visudo -c",
    ],
    verify: ["sudo -l -U alice"],
    hint: "NOPASSWD allows sudo without password for specific commands",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Set up user private groups.",
    points: 20,
    cmds: [
      "grep USERGROUPS_ENAB /etc/login.defs",
      "sed -i 's/USERGROUPS_ENAB.*/USERGROUPS_ENAB yes/' /etc/login.defs",
    ],
    verify: ["grep USERGROUPS_ENAB /etc/login.defs"],
    hint: "USERGROUPS_ENAB creates private group for each user",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Configure ACL backup and restore.",
    points: 25,
    cmds: [
      "getfacl -R /data > /backup/data.acl",
      "setfacl --restore=/backup/data.acl",
      "getfacl /data/file.txt",
    ],
    verify: ["ls -l /backup/data.acl"],
    hint: "getfacl -R saves recursive ACL, setfacl --restore applies",
    category: "permissions-acl",
    difficulty: "hard",
  },
  {
    desc: "Set up special permissions with octal notation.",
    points: 20,
    cmds: [
      "chmod 4755 /usr/bin/program",
      "chmod 2755 /shared/dir",
      "chmod 1755 /tmp/shared",
    ],
    verify: ["stat -c '%a' /usr/bin/program /shared/dir /tmp/shared"],
    hint: "4xxx = SUID, 2xxx = SGID, 1xxx = sticky bit",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Configure password expiry notification.",
    points: 20,
    cmds: [
      "chage -W 7 alice",
      "echo 'echo \"Your password will expire in 7 days\"' >> /etc/profile",
    ],
    verify: ["chage -l alice | grep warning"],
    hint: "chage -W sets warning days, /etc/profile runs for all users",
    category: "permissions-acl",
    difficulty: "medium",
  },
  {
    desc: "Set up ACL for samba shared directory.",
    points: 30,
    cmds: [
      "setfacl -m u:nobody:rwx /samba/share",
      "setfacl -m g:users:rwx /samba/share",
      "setfacl -d -m u:nobody:rwx /samba/share",
    ],
    verify: ["getfacl /samba/share | grep -E 'nobody|users'"],
    hint: "Samba uses nobody user for network access",
    category: "permissions-acl",
    difficulty: "hard",
  },

  // ========== 5. PROCESSES (25 questions) ==========
  {
    desc: "List all running processes, filter for 'sshd', show process tree, check CPU and memory usage.",
    points: 15,
    cmds: [
      "ps aux | head -20",
      "ps aux | grep sshd",
      "pstree | head -20",
      "top -bn1 | head -20",
    ],
    verify: ["ps aux | grep -c sshd", "pstree -p | head -10"],
    hint: "ps aux shows all processes, pstree shows hierarchy",
    category: "processes",
    difficulty: "easy",
  },
  {
    desc: "Run sleep command in background, bring to foreground, then kill it.",
    points: 15,
    cmds: [
      "sleep 300 &",
      "jobs",
      "fg %1",
      "Ctrl+C # to kill",
      "kill %1 # if still running",
    ],
    verify: ["jobs", "ps aux | grep sleep"],
    hint: "& runs in background, fg brings to foreground, kill terminates",
    category: "processes",
    difficulty: "easy",
  },
  {
    desc: "Change priority of process PID 1234 to nice value 10. Start new process with low priority.",
    points: 20,
    cmds: [
      "renice -n 10 -p 1234",
      "nice -n 19 sleep 100 &",
      "ps -o pid,ni,comm -p 1234 $(pgrep sleep)",
    ],
    verify: ["ps -o pid,ni,comm -p 1234", "ps -o pid,ni,comm $(pgrep sleep)"],
    hint: "renice changes existing process, nice starts new with priority",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Find and kill zombie processes. Force kill unresponsive process with PID 9999.",
    points: 15,
    cmds: ["ps aux | grep 'Z'", "kill -9 9999", "pkill -9 processname"],
    verify: ["ps aux | grep -c 'Z'", "ps -p 9999 || echo 'killed'"],
    hint: "kill -9 sends SIGKILL (cannot be ignored), pkill kills by name",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Monitor processes in real-time with top and htop.",
    points: 15,
    cmds: ["top", "# Press 'M' to sort by memory, 'P' to sort by CPU", "htop"],
    verify: ["which htop", "top -bn1 | head -5"],
    hint: "top interactive, htop more features with colors",
    category: "processes",
    difficulty: "easy",
  },
  {
    desc: "Check process limits and increase file descriptor limit.",
    points: 20,
    cmds: ["ulimit -a", "ulimit -n 65536", "cat /proc/$(pgrep sshd)/limits"],
    verify: ["ulimit -n", "grep 'open files' /proc/$(pgrep sshd)/limits"],
    hint: "ulimit controls per-process limits, /proc/PID/limits shows current",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Trace system calls of a process with strace.",
    points: 25,
    cmds: [
      "strace -p $(pgrep sshd)",
      "strace ls /tmp",
      "strace -c ls /tmp # summary",
    ],
    verify: ["which strace", "strace -c ls /tmp 2>&1 | head -10"],
    hint: "strace traces system calls and signals",
    category: "processes",
    difficulty: "hard",
  },
  {
    desc: "Monitor network connections of processes.",
    points: 20,
    cmds: [
      "ss -tulnp",
      "netstat -tulpn",
      "lsof -i :22",
      "lsof -p $(pgrep sshd)",
    ],
    verify: ["ss -tuln | grep :22", "lsof -i :22"],
    hint: "ss shows sockets, lsof lists open files including network",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Check process memory usage with pmap.",
    points: 20,
    cmds: [
      "pmap $(pgrep sshd)",
      "pmap -x $(pgrep sshd)",
      "ps aux --sort=-%mem | head -10",
    ],
    verify: ["pmap $(pgrep sshd) 2>/dev/null | head -5"],
    hint: "pmap shows memory map of process",
    category: "processes",
    difficulty: "hard",
  },
  {
    desc: "Set process CPU affinity with taskset.",
    points: 25,
    cmds: [
      "taskset -p $(pgrep sshd)",
      "taskset -c 0,1 sleep 100 &",
      "taskset -p 0x3 $(pgrep sleep)",
    ],
    verify: ["taskset -p $(pgrep sleep)"],
    hint: "taskset binds process to specific CPU cores",
    category: "processes",
    difficulty: "hard",
  },
  {
    desc: "Monitor I/O usage of processes with iotop.",
    points: 20,
    cmds: ["iotop", "iotop -o", "pidstat -d 1 5"],
    verify: ["which iotop", "pidstat -d 1 1"],
    hint: "iotop shows I/O usage, pidstat shows per-process stats",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Check process open files.",
    points: 15,
    cmds: [
      "lsof -p $(pgrep sshd)",
      "ls -l /proc/$(pgrep sshd)/fd",
      "fuser /etc/passwd",
    ],
    verify: ["lsof -p $(pgrep sshd) 2>/dev/null | wc -l"],
    hint: "lsof lists open files, /proc/PID/fd has file descriptors",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Send signals to processes.",
    points: 20,
    cmds: [
      "kill -HUP $(pgrep sshd)",
      "kill -TERM $(pgrep sleep)",
      "kill -USR1 $(pgrep nginx)",
    ],
    verify: ["ps aux | grep sleep"],
    hint: "kill sends signals: HUP=reload, TERM=terminate, KILL=force",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Monitor process with watch.",
    points: 15,
    cmds: [
      "watch -n 1 'ps aux | grep sshd'",
      "watch -n 2 'free -m'",
      "watch -d 'netstat -an | grep ESTAB'",
    ],
    verify: ["ps aux | grep watch"],
    hint: "watch runs command repeatedly at intervals",
    category: "processes",
    difficulty: "easy",
  },
  {
    desc: "Check process environment variables.",
    points: 20,
    cmds: [
      "cat /proc/$(pgrep sshd)/environ | tr '\\0' '\\n'",
      "ps eww -p $(pgrep sshd)",
      "env",
    ],
    verify: ["cat /proc/$(pgrep sshd)/environ | tr '\\0' '\\n' | head -5"],
    hint: "/proc/PID/environ contains process environment",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Find processes using most CPU.",
    points: 15,
    cmds: [
      "ps aux --sort=-%cpu | head -10",
      "top -b -n 1 | head -20",
      "mpstat 1 5",
    ],
    verify: ["ps aux --sort=-%cpu | head -5"],
    hint: "ps --sort sorts output, top shows real-time",
    category: "processes",
    difficulty: "easy",
  },
  {
    desc: "Find processes using most memory.",
    points: 15,
    cmds: ["ps aux --sort=-%mem | head -10", "free -m", "vmstat 1 5"],
    verify: ["ps aux --sort=-%mem | head -5", "free -m"],
    hint: "%mem shows memory percentage, free shows system memory",
    category: "processes",
    difficulty: "easy",
  },
  {
    desc: "Check process state and statistics.",
    points: 20,
    cmds: [
      "cat /proc/$(pgrep sshd)/stat",
      "cat /proc/$(pgrep sshd)/status",
      "ps -o pid,state,cmd -p $(pgrep sshd)",
    ],
    verify: ["cat /proc/$(pgrep sshd)/status | head -10"],
    hint: "/proc/PID/stat and /status contain process info",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Monitor process with pidstat.",
    points: 20,
    cmds: [
      "pidstat 1 5",
      "pidstat -u -p ALL 1 3",
      "pidstat -d -p $(pgrep sshd) 1 3",
    ],
    verify: ["which pidstat", "pidstat 1 1"],
    hint: "pidstat reports statistics for Linux tasks",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Check process thread count.",
    points: 20,
    cmds: [
      "ps -o pid,nlwp,cmd -p $(pgrep sshd)",
      "cat /proc/$(pgrep sshd)/status | grep Threads",
      "top -H -p $(pgrep sshd)",
    ],
    verify: ["ps -o nlwp -p $(pgrep sshd)"],
    hint: "nlwp = number of light-weight processes (threads)",
    category: "processes",
    difficulty: "medium",
  },
  {
    desc: "Set process OOM score.",
    points: 25,
    cmds: [
      "echo 1000 > /proc/$(pgrep sshd)/oom_score_adj",
      "cat /proc/$(pgrep sshd)/oom_score",
      "echo -17 > /proc/$(pgrep sshd)/oom_adj",
    ],
    verify: ["cat /proc/$(pgrep sshd)/oom_score_adj"],
    hint: "OOM score determines which process gets killed when out of memory",
    category: "processes",
    difficulty: "hard",
  },
  {
    desc: "Monitor process with /proc filesystem.",
    points: 25,
    cmds: [
      "ls -l /proc/$(pgrep sshd)/",
      "cat /proc/$(pgrep sshd)/cmdline",
      "cat /proc/$(pgrep sshd)/io",
    ],
    verify: ["ls /proc/$(pgrep sshd)/"],
    hint: "/proc contains runtime system information",
    category: "processes",
    difficulty: "hard",
  },
  {
    desc: "Check process scheduling policy.",
    points: 25,
    cmds: [
      "chrt -p $(pgrep sshd)",
      "chrt -f 10 sleep 100 &",
      "chrt -r 50 sleep 100 &",
    ],
    verify: ["chrt -p $(pgrep sleep)"],
    hint: "chrt manipulates real-time attributes",
    category: "processes",
    difficulty: "hard",
  },
  {
    desc: "Monitor process system resource usage.",
    points: 30,
    cmds: [
      "/usr/bin/time -v ls /",
      "ps -o pid,pmem,pcpu,cmd -p $(pgrep sshd)",
      "sar -u 1 5",
    ],
    verify: ["/usr/bin/time -v ls / 2>&1 | head -10"],
    hint: "time -v shows detailed resource usage",
    category: "processes",
    difficulty: "hard",
  },
  {
    desc: "Check process capabilities.",
    points: 30,
    cmds: ["getpcaps $(pgrep sshd)", "capsh --print", "pscap"],
    verify: ["getpcaps $(pgrep sshd)"],
    hint: "getpcaps shows process capabilities",
    category: "processes",
    difficulty: "hard",
  },

  // ========== 6. SERVICES & DAEMONS (25 questions) ==========
  {
    desc: "Check status of httpd service, enable it to start at boot, and start it now.",
    points: 15,
    cmds: [
      "systemctl status httpd",
      "systemctl enable httpd",
      "systemctl start httpd",
      "systemctl is-active httpd",
      "systemctl is-enabled httpd",
    ],
    verify: ["systemctl is-active httpd", "systemctl is-enabled httpd"],
    hint: "systemctl enable makes persistent, start runs now",
    category: "services-daemons",
    difficulty: "easy",
  },
  {
    desc: "List all active services, check failed services, view service dependencies.",
    points: 15,
    cmds: [
      "systemctl list-units --type=service --state=running",
      "systemctl --failed",
      "systemctl list-dependencies httpd",
    ],
    verify: [
      "systemctl --failed",
      "systemctl list-units --type=service | head -20",
    ],
    hint: "systemctl --failed shows only failed services",
    category: "services-daemons",
    difficulty: "easy",
  },
  {
    desc: "Change default target to multi-user (no GUI) and verify.",
    points: 15,
    cmds: [
      "systemctl get-default",
      "systemctl set-default multi-user.target",
      "systemctl get-default",
    ],
    verify: ["systemctl get-default", "systemctl list-units --type=target"],
    hint: "multi-user.target = text mode, graphical.target = GUI mode",
    category: "services-daemons",
    difficulty: "easy",
  },
  {
    desc: "Mask service to prevent starting, then unmask it.",
    points: 10,
    cmds: [
      "systemctl mask atd",
      "systemctl status atd",
      "systemctl unmask atd",
    ],
    verify: [
      "systemctl is-enabled atd",
      "ls -l /etc/systemd/system/atd.service",
    ],
    hint: "mask prevents ALL starting (even manual), disable only prevents auto-start",
    category: "services-daemons",
    difficulty: "medium",
  },
  {
    desc: "Create custom systemd service for a script.",
    points: 30,
    cmds: [
      "cat > /etc/systemd/system/myservice.service << EOF\n[Service]\nType=simple\nExecStart=/usr/local/bin/myscript.sh\n[Install]\nWantedBy=multi-user.target\nEOF",
      "systemctl daemon-reload",
      "systemctl enable myservice",
      "systemctl start myservice",
    ],
    verify: [
      "systemctl status myservice",
      "ls -l /etc/systemd/system/myservice.service",
    ],
    hint: "Service files in /etc/systemd/system/, daemon-reload after changes",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service logs with journalctl.",
    points: 15,
    cmds: [
      "journalctl -u httpd",
      "journalctl -u httpd --since '1 hour ago'",
      "journalctl -u httpd -f",
    ],
    verify: ["journalctl -u httpd | head -10"],
    hint: "journalctl -u shows logs for specific unit",
    category: "services-daemons",
    difficulty: "easy",
  },
  {
    desc: "Set service to restart on failure.",
    points: 25,
    cmds: [
      "systemctl edit httpd",
      "# Add:\n[Service]\nRestart=on-failure\nRestartSec=5",
      "systemctl daemon-reload",
    ],
    verify: ["systemctl cat httpd | grep Restart"],
    hint: "systemctl edit creates override file, Restart=on-failure auto-restarts",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service dependencies and conflicts.",
    points: 20,
    cmds: [
      "systemctl list-dependencies httpd",
      "systemctl list-dependencies --reverse httpd",
      "cat /usr/lib/systemd/system/httpd.service",
    ],
    verify: ["systemctl list-dependencies httpd | head -10"],
    hint: "list-dependencies shows what a service depends on",
    category: "services-daemons",
    difficulty: "medium",
  },
  {
    desc: "Create timer unit for periodic service execution.",
    points: 30,
    cmds: [
      "cat > /etc/systemd/system/mytimer.timer << EOF\n[Timer]\nOnCalendar=daily\nPersistent=true\n[Install]\nWantedBy=timers.target\nEOF",
      "cat > /etc/systemd/system/mytimer.service << EOF\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/backup.sh\nEOF",
      "systemctl enable --now mytimer.timer",
    ],
    verify: ["systemctl list-timers", "systemctl status mytimer.timer"],
    hint: "Timer units schedule service execution",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service resource usage.",
    points: 20,
    cmds: [
      "systemd-cgtop",
      "systemctl show httpd | grep -E '(Memory|CPU)'",
      "cat /sys/fs/cgroup/system.slice/httpd.service/memory.current",
    ],
    verify: ["systemd-cgtop | head -10"],
    hint: "systemd-cgtop shows resource usage by control group",
    category: "services-daemons",
    difficulty: "medium",
  },
  {
    desc: "Set service resource limits.",
    points: 30,
    cmds: [
      "systemctl edit httpd",
      "# Add:\n[Service]\nMemoryMax=500M\nCPUQuota=50%",
      "systemctl daemon-reload",
      "systemctl restart httpd",
    ],
    verify: ["systemctl show httpd | grep -E '(MemoryMax|CPUQuota)'"],
    hint: "MemoryMax limits memory, CPUQuota limits CPU percentage",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service security context.",
    points: 25,
    cmds: [
      "systemctl show httpd | grep -E '(User|Group)'",
      "ps aux | grep httpd",
      "cat /usr/lib/systemd/system/httpd.service | grep -E '(User|Group)'",
    ],
    verify: ["systemctl show httpd | grep User"],
    hint: "Services run as specific user/group for security",
    category: "services-daemons",
    difficulty: "medium",
  },
  {
    desc: "Create socket-activated service.",
    points: 35,
    cmds: [
      "cat > /etc/systemd/system/mysocket.socket << EOF\n[Socket]\nListenStream=8080\n[Install]\nWantedBy=sockets.target\nEOF",
      "cat > /etc/systemd/system/mysocket@.service << EOF\n[Service]\nExecStart=/usr/local/bin/handler.sh %i\nEOF",
      "systemctl enable --now mysocket.socket",
    ],
    verify: ["systemctl status mysocket.socket", "ss -tuln | grep :8080"],
    hint: "Socket activation starts service only when connection arrives",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service environment variables.",
    points: 20,
    cmds: [
      "systemctl show httpd | grep Environment",
      "cat /usr/lib/systemd/system/httpd.service | grep Environment",
      "systemctl edit httpd",
    ],
    verify: ["systemctl show httpd | grep Environment"],
    hint: "Environment variables in service files control behavior",
    category: "services-daemons",
    difficulty: "medium",
  },
  {
    desc: "Set service timeout values.",
    points: 25,
    cmds: [
      "systemctl edit httpd",
      "# Add:\n[Service]\nTimeoutStartSec=30s\nTimeoutStopSec=10s",
      "systemctl daemon-reload",
    ],
    verify: ["systemctl show httpd | grep Timeout"],
    hint: "TimeoutStartSec/TimeoutStopSec control service start/stop timeout",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service journal rate limiting.",
    points: 20,
    cmds: [
      "journalctl -u httpd --since '1 hour ago' | grep 'Suppressed'",
      "cat /etc/systemd/journald.conf | grep -E '(RateLimit|SystemMaxUse)'",
    ],
    verify: ["cat /etc/systemd/journald.conf | grep RateLimit"],
    hint: "RateLimit controls how many messages are logged",
    category: "services-daemons",
    difficulty: "medium",
  },
  {
    desc: "Create temporary service override.",
    points: 30,
    cmds: [
      "systemctl set-property httpd MemoryMax=1G",
      "systemctl show httpd | grep MemoryMax",
      "systemctl daemon-reload",
    ],
    verify: ["systemctl show httpd | grep MemoryMax"],
    hint: "set-property changes runtime properties without editing files",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service capability bounding set.",
    points: 30,
    cmds: [
      "systemctl show httpd | grep CapabilityBoundingSet",
      "cat /usr/lib/systemd/system/httpd.service | grep Capability",
      "pscap | grep httpd",
    ],
    verify: ["systemctl show httpd | grep Capability"],
    hint: "CapabilityBoundingSet limits kernel capabilities for service",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Set service working directory.",
    points: 20,
    cmds: [
      "systemctl edit httpd",
      "# Add:\n[Service]\nWorkingDirectory=/var/www/html",
      "systemctl daemon-reload",
    ],
    verify: ["systemctl show httpd | grep WorkingDirectory"],
    hint: "WorkingDirectory sets where service runs from",
    category: "services-daemons",
    difficulty: "medium",
  },
  {
    desc: "Check service standard output/error.",
    points: 20,
    cmds: [
      "systemctl show httpd | grep -E '(StandardOutput|StandardError)'",
      "cat /usr/lib/systemd/system/httpd.service | grep Standard",
    ],
    verify: ["systemctl show httpd | grep Standard"],
    hint: "StandardOutput/StandardError control where service output goes",
    category: "services-daemons",
    difficulty: "medium",
  },
  {
    desc: "Create service with multiple instances.",
    points: 35,
    cmds: [
      "cat > /etc/systemd/system/worker@.service << EOF\n[Service]\nExecStart=/usr/local/bin/worker.sh %i\n[Install]\nWantedBy=multi-user.target\nEOF",
      "systemctl enable --now worker@{1..3}.service",
    ],
    verify: ["systemctl status worker@1", "systemctl status worker@2"],
    hint: "@ in service name allows multiple instances with different parameters",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service kill mode.",
    points: 25,
    cmds: [
      "systemctl show httpd | grep KillMode",
      "cat /usr/lib/systemd/system/httpd.service | grep KillMode",
    ],
    verify: ["systemctl show httpd | grep KillMode"],
    hint: "KillMode controls how processes are killed when stopping service",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Set service nice level.",
    points: 25,
    cmds: [
      "systemctl edit httpd",
      "# Add:\n[Service]\nNice=10",
      "systemctl daemon-reload",
    ],
    verify: ["systemctl show httpd | grep Nice"],
    hint: "Nice controls process priority (lower number = higher priority)",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Check service control group.",
    points: 30,
    cmds: [
      "systemctl show httpd | grep ControlGroup",
      "cat /sys/fs/cgroup/system.slice/httpd.service/cgroup.procs",
    ],
    verify: ["systemctl show httpd | grep ControlGroup"],
    hint: "ControlGroup shows cgroup path for service",
    category: "services-daemons",
    difficulty: "hard",
  },
  {
    desc: "Create service with private /tmp.",
    points: 30,
    cmds: [
      "systemctl edit httpd",
      "# Add:\n[Service]\nPrivateTmp=true",
      "systemctl daemon-reload",
    ],
    verify: ["systemctl show httpd | grep PrivateTmp"],
    hint: "PrivateTmp gives service its own /tmp directory",
    category: "services-daemons",
    difficulty: "hard",
  },

  // ========== 7. SSH (25 questions) ==========
  {
    desc: "Connect to remote server server2.example.com via SSH and run command remotely.",
    points: 10,
    cmds: [
      "ssh server2.example.com 'hostname'",
      "ssh server2.example.com 'uptime'",
    ],
    verify: ["ssh server2.example.com 'whoami'"],
    hint: "ssh user@host command runs command remotely",
    category: "ssh",
    difficulty: "easy",
  },
  {
    desc: "Generate SSH key pair and copy to remote server for passwordless login.",
    points: 20,
    cmds: [
      "ssh-keygen -t rsa -b 2048 -f ~/.ssh/id_rsa -N ''",
      "ssh-copy-id server2.example.com",
      "ssh server2.example.com 'date' # should not ask password",
    ],
    verify: ["ls -l ~/.ssh/id_rsa*", "ssh server2.example.com 'echo test'"],
    hint: "ssh-keygen creates keys, ssh-copy-id copies public key to remote",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Configure SSH server: disable root login, change port to 2222, allow only specific users.",
    points: 25,
    cmds: [
      "sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config",
      "echo 'Port 2222' >> /etc/ssh/sshd_config",
      "echo 'AllowUsers alice bob' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
      "sshd -t # test config",
    ],
    verify: [
      "grep PermitRootLogin /etc/ssh/sshd_config",
      "grep Port /etc/ssh/sshd_config",
    ],
    hint: "sshd -t tests config before restart, always backup config first",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Configure SSH client: create config file for different hosts.",
    points: 20,
    cmds: [
      "cat > ~/.ssh/config << EOF\nHost server1\n    HostName server1.example.com\n    User alice\n    Port 22\nHost server2\n    HostName server2.example.com\n    User bob\n    Port 2222\nEOF",
      "ssh server1",
    ],
    verify: ["cat ~/.ssh/config", "ssh -G server1"],
    hint: "~/.ssh/config stores SSH client configurations",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Use SSH agent for key management.",
    points: 20,
    cmds: ["eval $(ssh-agent)", "ssh-add ~/.ssh/id_rsa", "ssh-add -l"],
    verify: ["ssh-add -l", "ps aux | grep ssh-agent"],
    hint: "ssh-agent manages keys in memory, ssh-add adds keys",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Configure SSH jump host (bastion).",
    points: 30,
    cmds: [
      "cat > ~/.ssh/config << EOF\nHost internal\n    HostName internal.server\n    User admin\n    ProxyJump bastion.example.com\nEOF",
      "ssh internal",
    ],
    verify: ["cat ~/.ssh/config | grep ProxyJump"],
    hint: "ProxyJump or ProxyCommand enables jump host configuration",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Set up SSH tunneling (port forwarding).",
    points: 25,
    cmds: [
      "ssh -L 8080:localhost:80 server.example.com",
      "ssh -R 2222:localhost:22 server.example.com",
      "ssh -D 1080 server.example.com",
    ],
    verify: ["ss -tuln | grep :8080"],
    hint: "-L local forwarding, -R remote forwarding, -D dynamic SOCKS",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Configure SSH to use different key for different hosts.",
    points: 20,
    cmds: [
      "cat > ~/.ssh/config << EOF\nHost github.com\n    IdentityFile ~/.ssh/github_key\nHost *.example.com\n    IdentityFile ~/.ssh/work_key\nEOF",
    ],
    verify: ["cat ~/.ssh/config | grep IdentityFile"],
    hint: "IdentityFile in SSH config specifies which key to use",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Set up SSH forced commands in authorized_keys.",
    points: 30,
    cmds: [
      "echo 'command=\"/usr/local/bin/backup.sh\" ssh-rsa AAA...' >> ~/.ssh/authorized_keys",
    ],
    verify: ["tail -1 ~/.ssh/authorized_keys"],
    hint: "command= in authorized_keys restricts key to specific command",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Configure SSH to use certificate authentication.",
    points: 35,
    cmds: [
      "ssh-keygen -s ca_key -I user_id -n user1 user1_key.pub",
      "echo 'TrustedUserCAKeys /etc/ssh/ca.pub' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep TrustedUserCAKeys /etc/ssh/sshd_config"],
    hint: "SSH certificates provide time-limited authentication",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Set SSH connection timeout and keepalive.",
    points: 20,
    cmds: [
      "echo 'ClientAliveInterval 60' >> /etc/ssh/sshd_config",
      "echo 'ClientAliveCountMax 3' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep ClientAlive /etc/ssh/sshd_config"],
    hint: "ClientAliveInterval sends keepalive packets",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Configure SSH to use specific ciphers and MACs.",
    points: 30,
    cmds: [
      "echo 'Ciphers aes256-ctr,aes192-ctr,aes128-ctr' >> /etc/ssh/sshd_config",
      "echo 'MACs hmac-sha2-256,hmac-sha2-512' >> /etc/ssh/sshd_config",
      "sshd -t",
    ],
    verify: ["grep -E 'Ciphers|MACs' /etc/ssh/sshd_config"],
    hint: "Restrict to secure ciphers and message authentication codes",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Set up SSH key rotation.",
    points: 25,
    cmds: [
      "ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_new",
      "ssh-copy-id -i ~/.ssh/id_rsa_new.pub server.example.com",
      "mv ~/.ssh/id_rsa ~/.ssh/id_rsa.old && mv ~/.ssh/id_rsa_new ~/.ssh/id_rsa",
    ],
    verify: ["ssh -o BatchMode=yes server.example.com 'echo test'"],
    hint: "Regular key rotation improves security",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Configure SSH to log to specific file.",
    points: 20,
    cmds: [
      "echo 'SyslogFacility LOCAL1' >> /etc/ssh/sshd_config",
      "echo 'LogLevel VERBOSE' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep -E 'SyslogFacility|LogLevel' /etc/ssh/sshd_config"],
    hint: "SyslogFacility controls where SSH logs go",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Set up SSH host-based authentication.",
    points: 35,
    cmds: [
      "echo 'HostbasedAuthentication yes' >> /etc/ssh/sshd_config",
      "echo 'IgnoreRhosts no' >> /etc/ssh/sshd_config",
      "ssh-keyscan host2 >> ~/.ssh/known_hosts",
    ],
    verify: ["grep HostbasedAuthentication /etc/ssh/sshd_config"],
    hint: "Host-based authentication trusts hosts rather than users",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Configure SSH to use PAM.",
    points: 25,
    cmds: [
      "echo 'UsePAM yes' >> /etc/ssh/sshd_config",
      "echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep UsePAM /etc/ssh/sshd_config"],
    hint: "PAM enables additional authentication methods",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Set up SSH multiplexing for faster connections.",
    points: 25,
    cmds: [
      "cat > ~/.ssh/config << EOF\nHost *\n    ControlMaster auto\n    ControlPath ~/.ssh/control:%h:%p:%r\n    ControlPersist 10m\nEOF",
    ],
    verify: ["cat ~/.ssh/config | grep Control"],
    hint: "Multiplexing reuses connections for faster subsequent logins",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Configure SSH to use specific authentication methods.",
    points: 30,
    cmds: [
      "echo 'AuthenticationMethods publickey,password' >> /etc/ssh/sshd_config",
      "echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep AuthenticationMethods /etc/ssh/sshd_config"],
    hint: "AuthenticationMethods specifies required auth methods",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Set up SSH to restrict commands per user.",
    points: 30,
    cmds: [
      "echo 'Match User backup' >> /etc/ssh/sshd_config",
      "echo '    ForceCommand /usr/local/bin/backup.sh' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep 'Match User' /etc/ssh/sshd_config"],
    hint: "Match blocks apply configuration to specific users/hosts",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Configure SSH to use specific KEX algorithms.",
    points: 30,
    cmds: [
      "echo 'KexAlgorithms curve25519-sha256@libssh.org' >> /etc/ssh/sshd_config",
      "sshd -t",
    ],
    verify: ["grep KexAlgorithms /etc/ssh/sshd_config"],
    hint: "KEX = Key Exchange algorithms",
    category: "ssh",
    difficulty: "hard",
  },
  {
    desc: "Set up SSH to restrict port forwarding.",
    points: 25,
    cmds: [
      "echo 'AllowTcpForwarding no' >> /etc/ssh/sshd_config",
      "echo 'PermitTunnel no' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep -E 'AllowTcpForwarding|PermitTunnel' /etc/ssh/sshd_config"],
    hint: "Restrict port forwarding for security",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Configure SSH to use specific host keys.",
    points: 25,
    cmds: [
      "echo 'HostKey /etc/ssh/ssh_host_ed25519_key' >> /etc/ssh/sshd_config",
      "ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key",
      "systemctl restart sshd",
    ],
    verify: ["grep HostKey /etc/ssh/sshd_config"],
    hint: "ed25519 keys are more secure than RSA",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Set up SSH to use specific login grace time.",
    points: 20,
    cmds: [
      "echo 'LoginGraceTime 30s' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep LoginGraceTime /etc/ssh/sshd_config"],
    hint: "LoginGraceTime limits authentication time",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Configure SSH to limit concurrent connections.",
    points: 25,
    cmds: [
      "echo 'MaxSessions 10' >> /etc/ssh/sshd_config",
      "echo 'MaxStartups 10:30:100' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep -E 'MaxSessions|MaxStartups' /etc/ssh/sshd_config"],
    hint: "MaxSessions per connection, MaxStartups total connections",
    category: "ssh",
    difficulty: "medium",
  },
  {
    desc: "Set up SSH to use specific subsystem.",
    points: 30,
    cmds: [
      "echo 'Subsystem sftp internal-sftp' >> /etc/ssh/sshd_config",
      "echo 'Match Group sftpusers' >> /etc/ssh/sshd_config",
      "echo '    ChrootDirectory /sftp' >> /etc/ssh/sshd_config",
      "systemctl restart sshd",
    ],
    verify: ["grep Subsystem /etc/ssh/sshd_config"],
    hint: "SFTP subsystem for secure file transfer",
    category: "ssh",
    difficulty: "hard",
  },

  // ========== 8. LOGGING (25 questions) ==========
  {
    desc: "View system logs from current boot, filter for error messages, and follow logs in real time.",
    points: 15,
    cmds: [
      "journalctl -b",
      "journalctl -p err -b",
      "journalctl --since '1 hour ago'",
      "# journalctl -f # for following (Ctrl+C to stop)",
    ],
    verify: ["journalctl -b | head -20", "journalctl -p err | head -10"],
    hint: "journalctl -b = current boot, -p = priority, -f = follow",
    category: "logging",
    difficulty: "easy",
  },
  {
    desc: "Check rsyslog configuration and view /var/log/messages for recent entries.",
    points: 15,
    cmds: [
      "cat /etc/rsyslog.conf | head -30",
      "tail -f /var/log/messages",
      "grep -i error /var/log/messages | tail -10",
    ],
    verify: ["tail -20 /var/log/messages", "ls -l /var/log/"],
    hint: "/var/log/messages = system messages, tail -f follows file",
    category: "logging",
    difficulty: "easy",
  },
  {
    desc: "Configure persistent journal storage and set max size to 1GB.",
    points: 20,
    cmds: [
      "mkdir -p /var/log/journal",
      "systemctl restart systemd-journald",
      "echo 'SystemMaxUse=1G' >> /etc/systemd/journald.conf",
      "journalctl --disk-usage",
    ],
    verify: ["ls -ld /var/log/journal", "journalctl --disk-usage"],
    hint: "SystemMaxUse controls max disk usage for journal",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Configure system time with chrony, set timezone to America/New_York.",
    points: 20,
    cmds: [
      "timedatectl set-timezone America/New_York",
      "timedatectl set-ntp true",
      "systemctl restart chronyd",
      "chronyc sources",
      "timedatectl",
    ],
    verify: ["timedatectl | grep 'Time zone'", "chronyc tracking"],
    hint: "timedatectl manages time/timezone, chronyc controls NTP",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Configure logrotate for custom application logs.",
    points: 25,
    cmds: [
      "cat > /etc/logrotate.d/myapp << EOF\n/var/log/myapp/*.log {\n    daily\n    rotate 30\n    compress\n    missingok\n    notifempty\n    create 0640 appuser appgroup\n}\nEOF",
      "logrotate -f /etc/logrotate.d/myapp",
    ],
    verify: ["cat /etc/logrotate.d/myapp", "ls /var/log/myapp/"],
    hint: "logrotate manages log file rotation",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Send logs to remote syslog server.",
    points: 25,
    cmds: [
      "echo '*.* @192.168.1.100:514' >> /etc/rsyslog.conf",
      "systemctl restart rsyslog",
      "logger -p local0.info 'Test message to remote server'",
    ],
    verify: ["grep '@' /etc/rsyslog.conf", "systemctl status rsyslog"],
    hint: "@ forwards logs to remote server, @@ uses TCP",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Configure journald to forward to syslog.",
    points: 20,
    cmds: [
      "echo 'ForwardToSyslog=yes' >> /etc/systemd/journald.conf",
      "systemctl restart systemd-journald",
    ],
    verify: ["grep ForwardToSyslog /etc/systemd/journald.conf"],
    hint: "ForwardToSyslog sends journal logs to traditional syslog",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Set up audit logging with auditd.",
    points: 30,
    cmds: [
      "auditctl -a always,exit -S open -F path=/etc/passwd",
      "ausearch -f /etc/passwd",
      "aureport --summary",
    ],
    verify: ["systemctl status auditd", "auditctl -l"],
    hint: "auditd logs security-relevant events",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Configure log file permissions.",
    points: 20,
    cmds: [
      "chmod 640 /var/log/messages",
      "chown root:adm /var/log/syslog",
      "ls -l /var/log/*.log",
    ],
    verify: ["ls -l /var/log/messages"],
    hint: "Log files should be readable only by authorized users",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Search logs by time range.",
    points: 15,
    cmds: [
      "journalctl --since '2023-01-01' --until '2023-01-02'",
      "journalctl --since '2 hours ago'",
      "journalctl -S '09:00' -U '17:00'",
    ],
    verify: ["journalctl --since '1 hour ago' | head -5"],
    hint: "--since and --until filter logs by time",
    category: "logging",
    difficulty: "easy",
  },
  {
    desc: "Configure log file compression.",
    points: 20,
    cmds: [
      "gzip /var/log/oldlog",
      "zcat /var/log/oldlog.gz | head -20",
      "zgrep error /var/log/oldlog.gz",
    ],
    verify: ["ls -l /var/log/*.gz"],
    hint: "gzip compresses, zcat/zgrep work on compressed files",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Set up log file monitoring with fail2ban.",
    points: 30,
    cmds: [
      "dnf install -y fail2ban",
      "cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local",
      "systemctl enable --now fail2ban",
      "fail2ban-client status",
    ],
    verify: ["systemctl status fail2ban", "fail2ban-client status sshd"],
    hint: "fail2ban monitors logs and bans malicious IPs",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Configure NTP server with chrony.",
    points: 25,
    cmds: [
      "echo 'server time.google.com iburst' >> /etc/chrony.conf",
      "echo 'allow 192.168.1.0/24' >> /etc/chrony.conf",
      "systemctl restart chronyd",
      "chronyc sources -v",
    ],
    verify: ["grep 'server' /etc/chrony.conf", "chronyc tracking"],
    hint: "chrony.conf configures NTP time synchronization",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Set up log file archiving.",
    points: 25,
    cmds: [
      "tar -czf /backup/logs-$(date +%Y%m%d).tar.gz /var/log/",
      "find /var/log -name '*.log' -mtime +30 -exec rm {} \\;",
    ],
    verify: ["ls -l /backup/*.tar.gz"],
    hint: "Archive old logs before deletion",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Configure log file size limits.",
    points: 20,
    cmds: [
      "echo '$MaxMessageSize 1k' >> /etc/rsyslog.conf",
      "echo 'SystemMaxFileSize=100M' >> /etc/systemd/journald.conf",
      "systemctl restart rsyslog systemd-journald",
    ],
    verify: ["grep MaxMessageSize /etc/rsyslog.conf"],
    hint: "Limit log size to prevent disk filling",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Set up custom log facility.",
    points: 30,
    cmds: [
      "echo 'local0.* /var/log/myapp.log' >> /etc/rsyslog.conf",
      "logger -p local0.info 'Test message'",
      "tail -f /var/log/myapp.log",
    ],
    verify: ["cat /var/log/myapp.log"],
    hint: "local0 through local7 are custom facilities",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Configure log file permissions with ACL.",
    points: 25,
    cmds: [
      "setfacl -m u:appuser:r /var/log/myapp.log",
      "setfacl -m g:developers:r /var/log/myapp.log",
      "getfacl /var/log/myapp.log",
    ],
    verify: ["getfacl /var/log/myapp.log"],
    hint: "ACL allows fine-grained log file access",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Set up log file integrity monitoring.",
    points: 30,
    cmds: [
      "md5sum /var/log/messages > /etc/loghash",
      "md5sum -c /etc/loghash",
      "echo '55 * * * * root md5sum /var/log/messages | diff - /etc/loghash' >> /etc/crontab",
    ],
    verify: ["md5sum /var/log/messages"],
    hint: "Monitor log file changes for security",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Configure log file encryption.",
    points: 35,
    cmds: [
      "gpg --encrypt --recipient admin@example.com /var/log/secure",
      "gpg --decrypt /var/log/secure.gpg",
    ],
    verify: ["ls -l /var/log/*.gpg"],
    hint: "Encrypt sensitive logs with GPG",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Set up log file replication.",
    points: 35,
    cmds: [
      "rsync -avz /var/log/ remote-server:/backup/logs/",
      "echo '*/5 * * * * root rsync -avz /var/log/ remote-server:/backup/logs/' >> /etc/crontab",
    ],
    verify: ["crontab -l | grep rsync"],
    hint: "Replicate logs for backup and analysis",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Configure log file parsing with awk.",
    points: 25,
    cmds: [
      "awk '/error/{print $0}' /var/log/messages",
      "awk '{print $1, $5}' /var/log/access.log | sort | uniq -c",
    ],
    verify: ["awk '/error/' /var/log/messages | head -5"],
    hint: "awk is powerful for log file analysis",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Set up log file monitoring with logwatch.",
    points: 25,
    cmds: [
      "dnf install -y logwatch",
      "logwatch --range Today --detail High",
      "echo '0 4 * * * root /usr/sbin/logwatch --output mail' >> /etc/crontab",
    ],
    verify: ["which logwatch", "logwatch --help"],
    hint: "logwatch analyzes and reports on logs",
    category: "logging",
    difficulty: "medium",
  },
  {
    desc: "Configure log file indexing with Elasticsearch.",
    points: 40,
    cmds: [
      "dnf install -y elasticsearch logstash kibana",
      "systemctl enable --now elasticsearch",
      "curl -X GET 'localhost:9200'",
    ],
    verify: ["systemctl status elasticsearch"],
    hint: "ELK stack for log aggregation and analysis",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Set up log file correlation.",
    points: 35,
    cmds: [
      "grep -r 'Failed password' /var/log/secure | awk '{print $11}' | sort | uniq -c | sort -nr",
    ],
    verify: ["grep 'Failed password' /var/log/secure | wc -l"],
    hint: "Correlate logs to find patterns",
    category: "logging",
    difficulty: "hard",
  },
  {
    desc: "Configure log file retention policy.",
    points: 25,
    cmds: [
      "echo '30' > /etc/logrotate.d/retention",
      "find /var/log -name '*.log' -mtime +30 -delete",
    ],
    verify: ["cat /etc/logrotate.d/retention"],
    hint: "Define and enforce log retention policies",
    category: "logging",
    difficulty: "medium",
  },

  // ========== 9. NETWORKING (25 questions) ==========
  {
    desc: "Configure static IP: 192.168.1.100/24, gateway 192.168.1.1, DNS 8.8.8.8 on eth0 using nmcli.",
    points: 25,
    cmds: [
      "nmcli connection show",
      "nmcli connection modify eth0 ipv4.addresses 192.168.1.100/24",
      "nmcli connection modify eth0 ipv4.gateway 192.168.1.1",
      "nmcli connection modify eth0 ipv4.dns 8.8.8.8",
      "nmcli connection modify eth0 ipv4.method manual",
      "nmcli connection up eth0",
    ],
    verify: ["ip addr show eth0", "ip route", "cat /etc/resolv.conf"],
    hint: "nmcli connection modify changes config, up activates",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Set hostname to server1.example.com and configure /etc/hosts with localhost entries.",
    points: 15,
    cmds: [
      "hostnamectl set-hostname server1.example.com",
      "echo '127.0.0.1 localhost localhost.localdomain' > /etc/hosts",
      "echo '192.168.1.100 server1.example.com server1' >> /etc/hosts",
      "hostnamectl",
    ],
    verify: ["hostnamectl", "cat /etc/hosts", "hostname"],
    hint: "hostnamectl sets persistent hostname, /etc/hosts for name resolution",
    category: "networking",
    difficulty: "easy",
  },
  {
    desc: "Check network connectivity: ping gateway, trace route to google.com, check listening ports.",
    points: 15,
    cmds: [
      "ping -c 4 192.168.1.1",
      "traceroute -n 8.8.8.8",
      "ss -tuln",
      "netstat -tulpn",
    ],
    verify: ["ping -c 2 8.8.8.8", "ss -tuln | grep :22"],
    hint: "ss shows socket statistics, -t = TCP, -u = UDP, -l = listening",
    category: "networking",
    difficulty: "medium",
  },
  {
    desc: "Add static route to network 10.0.0.0/8 via gateway 192.168.1.254.",
    points: 20,
    cmds: [
      "ip route add 10.0.0.0/8 via 192.168.1.254",
      "ip route show",
      "echo '10.0.0.0/8 via 192.168.1.254 dev eth0' >> /etc/sysconfig/network-scripts/route-eth0",
    ],
    verify: [
      "ip route | grep 10.0.0.0",
      "cat /etc/sysconfig/network-scripts/route-eth0",
    ],
    hint: "ip route add adds route, file makes persistent across reboots",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network bonding with two interfaces.",
    points: 35,
    cmds: [
      "nmcli connection add type bond con-name bond0 ifname bond0 mode active-backup",
      "nmcli connection add type bond-slave ifname eth1 master bond0",
      "nmcli connection add type bond-slave ifname eth2 master bond0",
      "nmcli connection up bond0",
    ],
    verify: ["cat /proc/net/bonding/bond0", "ip link show bond0"],
    hint: "Bonding combines multiple network interfaces",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Set up network bridge for virtualization.",
    points: 30,
    cmds: [
      "nmcli connection add type bridge con-name br0 ifname br0",
      "nmcli connection modify br0 ipv4.addresses 192.168.1.100/24",
      "nmcli connection modify br0 ipv4.gateway 192.168.1.1",
      "nmcli connection add type bridge-slave ifname eth0 master br0",
      "nmcli connection up br0",
    ],
    verify: ["brctl show", "ip addr show br0"],
    hint: "Bridge connects virtual machines to physical network",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure VLAN tagging.",
    points: 25,
    cmds: [
      "nmcli connection add type vlan con-name eth0.100 ifname eth0.100 dev eth0 id 100",
      "nmcli connection modify eth0.100 ipv4.addresses 192.168.100.1/24",
      "nmcli connection up eth0.100",
    ],
    verify: ["ip -d link show eth0.100", "cat /proc/net/vlan/eth0.100"],
    hint: "VLAN tags separate traffic on same physical interface",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Set up network teaming.",
    points: 35,
    cmds: [
      'nmcli connection add type team con-name team0 ifname team0 config \'{"runner": {"name": "activebackup"}}\'',
      "nmcli connection modify team0 ipv4.addresses 192.168.1.100/24",
      "nmcli connection add type team-slave ifname eth1 master team0",
      "nmcli connection add type team-slave ifname eth2 master team0",
      "teamdctl team0 state",
    ],
    verify: ["teamdctl team0 state", "ip link show team0"],
    hint: "Teaming is newer alternative to bonding",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network interface with IPv6.",
    points: 25,
    cmds: [
      "nmcli connection modify eth0 ipv6.addresses 2001:db8::1/64",
      "nmcli connection modify eth0 ipv6.gateway 2001:db8::fe",
      "nmcli connection modify eth0 ipv6.method manual",
      "nmcli connection up eth0",
    ],
    verify: ["ip -6 addr show eth0", "ip -6 route"],
    hint: "IPv6 configuration similar to IPv4",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Set up network namespaces.",
    points: 35,
    cmds: [
      "ip netns add ns1",
      "ip link add veth0 type veth peer name veth1",
      "ip link set veth1 netns ns1",
      "ip netns exec ns1 ip addr add 10.0.0.1/24 dev veth1",
      "ip netns exec ns1 ip link set veth1 up",
    ],
    verify: ["ip netns list", "ip netns exec ns1 ip addr"],
    hint: "Network namespaces isolate network stack",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network interface with DHCP.",
    points: 15,
    cmds: [
      "nmcli connection modify eth0 ipv4.method auto",
      "nmcli connection up eth0",
      "dhclient -v eth0",
    ],
    verify: ["ip addr show eth0", "cat /etc/resolv.conf"],
    hint: "DHCP automatically configures network",
    category: "networking",
    difficulty: "easy",
  },
  {
    desc: "Set up network interface with multiple IP addresses.",
    points: 20,
    cmds: [
      "ip addr add 192.168.1.101/24 dev eth0",
      "ip addr add 192.168.1.102/24 dev eth0",
      "ip addr show eth0",
    ],
    verify: ["ip addr show eth0 | grep inet"],
    hint: "Multiple IPs on same interface with ip addr add",
    category: "networking",
    difficulty: "medium",
  },
  {
    desc: "Configure network interface MTU.",
    points: 20,
    cmds: [
      "ip link set eth0 mtu 9000",
      "ip link show eth0",
      "nmcli connection modify eth0 802-3-ethernet.mtu 9000",
    ],
    verify: ["ip link show eth0 | grep mtu"],
    hint: "MTU = Maximum Transmission Unit",
    category: "networking",
    difficulty: "medium",
  },
  {
    desc: "Set up network interface promiscuous mode.",
    points: 25,
    cmds: [
      "ip link set eth0 promisc on",
      "ip link show eth0",
      "tcpdump -i eth0 -c 5",
    ],
    verify: ["ip link show eth0 | grep PROMISC"],
    hint: "Promiscuous mode captures all traffic",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network interface speed and duplex.",
    points: 25,
    cmds: [
      "ethtool -s eth0 speed 1000 duplex full autoneg off",
      "ethtool eth0",
      "nmcli connection modify eth0 802-3-ethernet.speed 1000",
    ],
    verify: ["ethtool eth0 | grep -E 'Speed|Duplex'"],
    hint: "ethtool configures NIC parameters",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Set up network interface with Wake-on-LAN.",
    points: 25,
    cmds: [
      "ethtool -s eth0 wol g",
      "ethtool eth0",
      'echo \'ACTION=="add", SUBSYSTEM=="net", KERNEL=="eth*", RUN+="/usr/sbin/ethtool -s %k wol g"\' > /etc/udev/rules.d/70-persistent-net.rules',
    ],
    verify: ["ethtool eth0 | grep Wake-on"],
    hint: "WoL allows waking system over network",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network interface with QoS.",
    points: 35,
    cmds: [
      "tc qdisc add dev eth0 root handle 1: htb default 30",
      "tc class add dev eth0 parent 1: classid 1:1 htb rate 100mbit",
      "tc class add dev eth0 parent 1:1 classid 1:10 htb rate 50mbit",
      "tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 match ip dport 80 0xffff flowid 1:10",
    ],
    verify: ["tc qdisc show dev eth0", "tc class show dev eth0"],
    hint: "tc = traffic control for QoS",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Set up network interface with bonding load balancing.",
    points: 35,
    cmds: [
      "nmcli connection add type bond con-name bond0 ifname bond0 mode balance-alb",
      "nmcli connection modify bond0 ipv4.addresses 192.168.1.100/24",
      "nmcli connection add type bond-slave ifname eth1 master bond0",
      "nmcli connection add type bond-slave ifname eth2 master bond0",
      "cat /proc/net/bonding/bond0",
    ],
    verify: ["cat /proc/net/bonding/bond0", "ip link show bond0"],
    hint: "balance-alb mode provides load balancing",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network interface with MAC address spoofing.",
    points: 30,
    cmds: [
      "ip link set eth0 address 00:11:22:33:44:55",
      "ip link show eth0",
      "nmcli connection modify eth0 cloned-mac-address 00:11:22:33:44:55",
    ],
    verify: ["ip link show eth0 | grep link/ether"],
    hint: "MAC address can be changed for privacy",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Set up network interface with PPPoE.",
    points: 35,
    cmds: [
      "nmcli connection add type pppoe con-name pppoe0 ifname eth0 service isp username user password pass",
      "nmcli connection up pppoe0",
      "ip addr show ppp0",
    ],
    verify: ["ip addr show ppp0", "ping -c 2 8.8.8.8"],
    hint: "PPPoE for DSL connections",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network interface with wireless.",
    points: 30,
    cmds: [
      "nmcli device wifi list",
      "nmcli device wifi connect 'SSID' password 'password'",
      "iwconfig wlan0",
    ],
    verify: ["nmcli connection show", "iwconfig wlan0"],
    hint: "nmcli manages wireless connections",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Set up network interface with 802.1x authentication.",
    points: 40,
    cmds: [
      "nmcli connection add type ethernet con-name eth0 ifname eth0 802-1x.eap peap 802-1x.identity user 802-1x.password pass 802-1x.ca-cert /etc/pki/tls/certs/ca.crt",
      "nmcli connection up eth0",
    ],
    verify: ["nmcli connection show eth0"],
    hint: "802.1x for enterprise network authentication",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network interface with static MAC address.",
    points: 25,
    cmds: [
      "nmcli connection modify eth0 802-3-ethernet.mac-address 00:11:22:33:44:55",
      "nmcli connection down eth0 && nmcli connection up eth0",
      "ip link show eth0",
    ],
    verify: ["ip link show eth0 | grep link/ether"],
    hint: "Static MAC prevents address changes",
    category: "networking",
    difficulty: "medium",
  },
  {
    desc: "Set up network interface with link aggregation control protocol.",
    points: 35,
    cmds: [
      "nmcli connection add type bond con-name bond0 ifname bond0 mode 802.3ad",
      "nmcli connection modify bond0 ipv4.addresses 192.168.1.100/24",
      "nmcli connection add type bond-slave ifname eth1 master bond0",
      "nmcli connection add type bond-slave ifname eth2 master bond0",
      "cat /proc/net/bonding/bond0",
    ],
    verify: ["cat /proc/net/bonding/bond0", "ip link show bond0"],
    hint: "802.3ad = LACP for dynamic bonding",
    category: "networking",
    difficulty: "hard",
  },
  {
    desc: "Configure network interface with network manager dispatcher.",
    points: 30,
    cmds: [
      'cat > /etc/NetworkManager/dispatcher.d/99-myhook << \'EOF\'\n#!/bin/bash\nif [ "$1" = "eth0" ] && [ "$2" = "up" ]; then\n    echo "Interface eth0 is up" > /tmp/nm.log\nfi\nEOF',
      "chmod +x /etc/NetworkManager/dispatcher.d/99-myhook",
    ],
    verify: ["ls -l /etc/NetworkManager/dispatcher.d/"],
    hint: "Dispatcher scripts run on network events",
    category: "networking",
    difficulty: "hard",
  },

  // ========== 10. ARCHIVING & TRANSFER (25 questions) ==========
  {
    desc: "Create compressed backup of /etc directory as /backup/etc-backup.tar.gz.",
    points: 15,
    cmds: [
      "tar -czf /backup/etc-backup.tar.gz -C /etc .",
      "ls -lh /backup/etc-backup.tar.gz",
      "tar -tzf /backup/etc-backup.tar.gz | head -10",
    ],
    verify: [
      "ls -l /backup/etc-backup.tar.gz",
      "file /backup/etc-backup.tar.gz",
    ],
    hint: "tar -czf = create gzip compressed, -C changes directory before archiving",
    category: "archiving",
    difficulty: "easy",
  },
  {
    desc: "Create bzip2 compressed archive of /var/log as /backup/logs.tar.bz2.",
    points: 15,
    cmds: [
      "tar -cjf /backup/logs.tar.bz2 -C /var/log .",
      "tar -tjf /backup/logs.tar.bz2 | wc -l",
    ],
    verify: ["ls -lh /backup/logs.tar.bz2", "file /backup/logs.tar.bz2"],
    hint: "tar -cjf = bzip2 compression, -tjf = list bzip2 archive",
    category: "archiving",
    difficulty: "easy",
  },
  {
    desc: "Extract archive to /tmp and copy specific files from it.",
    points: 15,
    cmds: [
      "mkdir -p /tmp/extract",
      "tar -xzf /backup/etc-backup.tar.gz -C /tmp/extract",
      "cp /tmp/extract/hosts /tmp/",
      "ls -l /tmp/hosts",
    ],
    verify: ["ls -l /tmp/hosts", "ls /tmp/extract | head -10"],
    hint: "tar -xzf extracts gzip archive, -C extracts to directory",
    category: "archiving",
    difficulty: "easy",
  },
  {
    desc: "Transfer files securely with scp: copy /etc/hosts to remote server.",
    points: 15,
    cmds: [
      "scp /etc/hosts server2.example.com:/tmp/",
      "scp server2.example.com:/etc/passwd /tmp/",
    ],
    verify: ["ssh server2.example.com 'ls -l /tmp/hosts'"],
    hint: "scp copies files between systems over SSH",
    category: "archiving",
    difficulty: "medium",
  },
  {
    desc: "Synchronize directory /data to remote server using rsync with compression.",
    points: 20,
    cmds: [
      "rsync -avz /data/ server2.example.com:/backup/data/",
      "rsync -avz --delete /data/ server2.example.com:/backup/data/",
    ],
    verify: ["ssh server2.example.com 'ls -l /backup/data/'"],
    hint: "rsync -avz = archive, verbose, compress; --delete removes extra files",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Create zip archive of directory.",
    points: 15,
    cmds: [
      "zip -r /backup/myfolder.zip /path/to/folder",
      "unzip -l /backup/myfolder.zip",
      "unzip /backup/myfolder.zip -d /tmp/",
    ],
    verify: ["ls -l /backup/myfolder.zip", "unzip -t /backup/myfolder.zip"],
    hint: "zip creates .zip archives, common on Windows",
    category: "archiving",
    difficulty: "easy",
  },
  {
    desc: "Create split archive for large files.",
    points: 20,
    cmds: [
      "tar -czf - /large/directory | split -b 1G - /backup/archive.tar.gz.",
      "cat /backup/archive.tar.gz.* | tar -xzf - -C /tmp/",
    ],
    verify: ["ls -lh /backup/archive.tar.gz.*"],
    hint: "split divides output, cat recombines",
    category: "archiving",
    difficulty: "medium",
  },
  {
    desc: "Create archive with specific files only.",
    points: 20,
    cmds: [
      "tar -czf /backup/selective.tar.gz -C /etc passwd group hosts",
      "tar -tzf /backup/selective.tar.gz",
    ],
    verify: ["tar -tzf /backup/selective.tar.gz | wc -l"],
    hint: "List files after -C directory",
    category: "archiving",
    difficulty: "medium",
  },
  {
    desc: "Create archive with exclusion patterns.",
    points: 20,
    cmds: [
      "tar -czf /backup/exclude.tar.gz --exclude='*.tmp' --exclude='*.log' /var",
      "tar -tzf /backup/exclude.tar.gz | grep -E '(.tmp|.log)' || echo 'excluded'",
    ],
    verify: ["tar -tzf /backup/exclude.tar.gz | wc -l"],
    hint: "--exclude omits files matching pattern",
    category: "archiving",
    difficulty: "medium",
  },
  {
    desc: "Create archive with owner/group preservation.",
    points: 25,
    cmds: [
      "tar -czpf /backup/full.tar.gz /etc",
      "tar -tzpf /backup/full.tar.gz | head -5",
    ],
    verify: ["tar -tzpf /backup/full.tar.gz | head -1"],
    hint: "-p preserves permissions",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Transfer files with sftp interactive mode.",
    points: 20,
    cmds: [
      "sftp user@server.example.com",
      "# In sftp: put localfile remotefile",
      "# In sftp: get remotefile localfile",
      "# In sftp: ls, cd, mkdir",
    ],
    verify: ["sftp -b batchfile user@server"],
    hint: "sftp = SSH file transfer protocol",
    category: "archiving",
    difficulty: "medium",
  },
  {
    desc: "Use rsync with bandwidth limiting.",
    points: 25,
    cmds: [
      "rsync -avz --bwlimit=1000 /data/ server:/backup/",
      "rsync -avz --progress /largefile server:/backup/",
    ],
    verify: ["rsync --version"],
    hint: "--bwlimit controls transfer speed in KB/s",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Create incremental backup with rsync.",
    points: 30,
    cmds: [
      "rsync -av --link-dest=/backup/previous /source/ /backup/current/",
      "cp -al /backup/current /backup/$(date +%Y%m%d)",
    ],
    verify: ["ls -l /backup/"],
    hint: "--link-dest uses hard links for unchanged files",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Transfer files with nc (netcat).",
    points: 30,
    cmds: [
      "# Receiver: nc -l 1234 > file.received",
      "# Sender: nc receiver 1234 < file.sent",
    ],
    verify: ["which nc", "nc -h"],
    hint: "nc = netcat for raw network transfers",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Create archive with specific compression level.",
    points: 20,
    cmds: [
      "tar -czf -9 /backup/highcompression.tar.gz /large/dir",
      "gzip -9 largefile",
    ],
    verify: ["ls -lh /backup/highcompression.tar.gz"],
    hint: "-1 fast compression, -9 best compression",
    category: "archiving",
    difficulty: "medium",
  },
  {
    desc: "Use dd for disk cloning.",
    points: 35,
    cmds: [
      "dd if=/dev/sda of=/dev/sdb bs=4M",
      "dd if=/dev/sda of=/backup/sda.img",
      "dd if=/backup/sda.img of=/dev/sda",
    ],
    verify: ["ls -lh /backup/sda.img"],
    hint: "dd copies at block level, careful with device names",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Create ISO image from CD/DVD.",
    points: 25,
    cmds: [
      "dd if=/dev/cdrom of=/backup/cd.iso",
      "mkisofs -o /backup/custom.iso /source/dir",
      "mount -o loop /backup/cd.iso /mnt",
    ],
    verify: ["file /backup/cd.iso", "mount | grep loop"],
    hint: "ISO images are CD/DVD file system images",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Transfer files with lftp.",
    points: 25,
    cmds: [
      "lftp ftp://user:pass@server",
      "# In lftp: mirror -R localdir remotedir",
      "# In lftp: mirror remotedir localdir",
    ],
    verify: ["which lftp", "lftp --version"],
    hint: "lftp advanced FTP client",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Create archive with xz compression.",
    points: 20,
    cmds: [
      "tar -cJf /backup/archive.tar.xz /data",
      "xz -9 largefile",
      "unxz archive.xz",
    ],
    verify: ["file /backup/archive.tar.xz"],
    hint: "xz provides high compression ratio",
    category: "archiving",
    difficulty: "medium",
  },
  {
    desc: "Use pv to monitor transfer progress.",
    points: 20,
    cmds: [
      "pv largefile | gzip > largefile.gz",
      "tar -czf - /dir | pv | dd of=/backup/archive.tar.gz",
      "pv /dev/sda > /backup/sda.img",
    ],
    verify: ["which pv", "pv --version"],
    hint: "pv = pipe viewer shows progress",
    category: "archiving",
    difficulty: "medium",
  },
  {
    desc: "Create encrypted archive with gpg.",
    points: 30,
    cmds: [
      "tar -czf - /data | gpg -c > /backup/archive.tar.gz.gpg",
      "gpg -d /backup/archive.tar.gz.gpg | tar -xzf -",
    ],
    verify: ["file /backup/archive.tar.gz.gpg"],
    hint: "gpg -c encrypts with passphrase",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Transfer files with wget.",
    points: 15,
    cmds: [
      "wget http://example.com/file.zip",
      "wget -O customname.zip http://example.com/file.zip",
      "wget -r -l1 http://example.com/dir/",
    ],
    verify: ["ls file.zip", "which wget"],
    hint: "wget downloads from web",
    category: "archiving",
    difficulty: "easy",
  },
  {
    desc: "Transfer files with curl.",
    points: 15,
    cmds: [
      "curl -O http://example.com/file.zip",
      "curl -o customname.zip http://example.com/file.zip",
      "curl -u user:pass -O ftp://server/file.zip",
    ],
    verify: ["ls file.zip", "which curl"],
    hint: "curl supports many protocols",
    category: "archiving",
    difficulty: "easy",
  },
  {
    desc: "Create archive with 7z compression.",
    points: 25,
    cmds: [
      "7z a /backup/archive.7z /data",
      "7z l /backup/archive.7z",
      "7z x /backup/archive.7z -o/tmp/",
    ],
    verify: ["which 7z", "7z --help"],
    hint: "7z provides very high compression",
    category: "archiving",
    difficulty: "hard",
  },
  {
    desc: "Use tar with pigz for parallel compression.",
    points: 25,
    cmds: [
      "tar -cf - /data | pigz > /backup/archive.tar.gz",
      "unpigz < /backup/archive.tar.gz | tar -xf -",
    ],
    verify: ["which pigz", "pigz --version"],
    hint: "pigz = parallel gzip for faster compression",
    category: "archiving",
    difficulty: "hard",
  },

  // ========== 11. SOFTWARE MANAGEMENT (25 questions) ==========
  {
    desc: "Install httpd and vim packages, then list installed packages containing 'http'.",
    points: 15,
    cmds: [
      "dnf install -y httpd vim",
      "rpm -qa | grep http",
      "dnf list installed httpd",
    ],
    verify: ["rpm -q httpd vim", "which httpd"],
    hint: "dnf install -y installs without confirmation, rpm -q queries packages",
    category: "software",
    difficulty: "easy",
  },
  {
    desc: "Search for package providing 'ifconfig' command and install it.",
    points: 15,
    cmds: ["dnf provides */ifconfig", "dnf install -y net-tools", "ifconfig"],
    verify: ["which ifconfig", "rpm -qf $(which ifconfig)"],
    hint: "dnf provides finds package for file, rpm -qf finds package owning file",
    category: "software",
    difficulty: "easy",
  },
  {
    desc: "Create custom repository file for local repository at /mnt/repo.",
    points: 20,
    cmds: [
      "cat > /etc/yum.repos.d/local.repo << 'EOF'\n[local]\nname=Local Repository\nbaseurl=file:///mnt/repo\nenabled=1\ngpgcheck=0\nEOF",
      "dnf repolist",
      "dnf --enablerepo=local list available",
    ],
    verify: ["cat /etc/yum.repos.d/local.repo", "dnf repolist | grep local"],
    hint: "Repository files go in /etc/yum.repos.d/, baseurl can be file://, http://, or ftp://",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Update all packages, check for updates, view transaction history.",
    points: 15,
    cmds: [
      "dnf check-update",
      "dnf update -y",
      "dnf history",
      "dnf history info last",
    ],
    verify: ["dnf check-update | wc -l", "dnf history | head -10"],
    hint: "dnf check-update shows available updates without installing",
    category: "software",
    difficulty: "easy",
  },
  {
    desc: "Remove package and clean up dependencies.",
    points: 15,
    cmds: ["dnf remove httpd", "dnf autoremove", "dnf clean all"],
    verify: ["rpm -q httpd || echo 'removed'", "dnf repolist"],
    hint: "dnf remove removes package, autoremove removes unused dependencies",
    category: "software",
    difficulty: "easy",
  },
  {
    desc: "Install specific version of package.",
    points: 20,
    cmds: [
      "dnf list --available httpd",
      "dnf install httpd-2.4.6-90.el8",
      "rpm -q httpd",
    ],
    verify: ["rpm -q httpd", "dnf info httpd"],
    hint: "dnf list shows available versions",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Install package group.",
    points: 20,
    cmds: [
      "dnf grouplist",
      "dnf groupinstall 'Development Tools'",
      "dnf groupinfo 'Development Tools'",
    ],
    verify: ["dnf grouplist installed", "which gcc"],
    hint: "Group installs related packages together",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Downgrade package to older version.",
    points: 25,
    cmds: [
      "dnf downgrade httpd",
      "dnf history undo last",
      "dnf install httpd-<older-version>",
    ],
    verify: ["rpm -q httpd", "dnf history"],
    hint: "downgrade reverts to older version",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Exclude specific package from updates.",
    points: 20,
    cmds: [
      "echo 'exclude=kernel*' >> /etc/dnf/dnf.conf",
      "dnf update",
      "grep exclude /etc/dnf/dnf.conf",
    ],
    verify: ["grep exclude /etc/dnf/dnf.conf"],
    hint: "exclude in dnf.conf prevents updates",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Install from RPM file directly.",
    points: 20,
    cmds: ["rpm -ivh package.rpm", "rpm -Uvh package.rpm", "rpm -e package"],
    verify: ["rpm -q package", "rpm -qi package"],
    hint: "rpm -i install, -U upgrade, -e erase",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Check package dependencies.",
    points: 20,
    cmds: ["rpm -qR httpd", "dnf deplist httpd", "rpm -qpR package.rpm"],
    verify: ["rpm -qR httpd | head -10"],
    hint: "rpm -qR shows requirements, deplist shows dependency list",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Verify package integrity.",
    points: 25,
    cmds: ["rpm -V httpd", "rpm -Va", "rpm --checksig package.rpm"],
    verify: ["rpm -V httpd"],
    hint: "rpm -V verifies package files against RPM database",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Rebuild RPM database.",
    points: 30,
    cmds: ["rpm --rebuilddb", "rpm -qa", "dnf makecache"],
    verify: ["rpm -qa | wc -l"],
    hint: "rebuilddb fixes corrupted RPM database",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Set up DNF automatic updates.",
    points: 25,
    cmds: [
      "dnf install -y dnf-automatic",
      "systemctl enable --now dnf-automatic.timer",
      "systemctl status dnf-automatic.timer",
    ],
    verify: ["systemctl status dnf-automatic.timer"],
    hint: "dnf-automatic automatically installs updates",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Configure DNF to keep cache.",
    points: 20,
    cmds: [
      "echo 'keepcache=1' >> /etc/dnf/dnf.conf",
      "ls /var/cache/dnf/",
      "du -sh /var/cache/dnf/",
    ],
    verify: ["grep keepcache /etc/dnf/dnf.conf"],
    hint: "keepcache preserves downloaded packages",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Install security updates only.",
    points: 25,
    cmds: [
      "dnf updateinfo list sec",
      "dnf update --security",
      "dnf updateinfo summary",
    ],
    verify: ["dnf updateinfo list sec | head -5"],
    hint: "--security updates only security fixes",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Check what package provides a file.",
    points: 15,
    cmds: ["rpm -qf /etc/passwd", "dnf provides /etc/passwd", "rpm -ql passwd"],
    verify: ["rpm -qf /etc/passwd"],
    hint: "rpm -qf queries file ownership",
    category: "software",
    difficulty: "easy",
  },
  {
    desc: "List files in a package.",
    points: 15,
    cmds: ["rpm -ql httpd", "dnf repoquery -l httpd", "rpm -qpl package.rpm"],
    verify: ["rpm -ql httpd | head -10"],
    hint: "rpm -ql lists package contents",
    category: "software",
    difficulty: "easy",
  },
  {
    desc: "Install debuginfo packages.",
    points: 25,
    cmds: [
      "dnf debuginfo-install httpd",
      "dnf config-manager --set-enabled debuginfo",
      "rpm -q httpd-debuginfo",
    ],
    verify: ["rpm -q httpd-debuginfo"],
    hint: "debuginfo packages contain debugging symbols",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Set up local DNF mirror.",
    points: 35,
    cmds: [
      "dnf install -y createrepo",
      "createrepo /mnt/repo",
      "dnf config-manager --add-repo file:///mnt/repo",
    ],
    verify: ["ls /mnt/repo/repodata/", "dnf repolist"],
    hint: "createrepo creates repository metadata",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Check package changelog.",
    points: 20,
    cmds: ["rpm -q --changelog httpd | head -20", "dnf changelog httpd"],
    verify: ["rpm -q --changelog httpd | head -5"],
    hint: "changelog shows package change history",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Install from COPR repository.",
    points: 30,
    cmds: ["dnf copr enable user/repo", "dnf install package", "dnf copr list"],
    verify: ["dnf repolist | grep copr"],
    hint: "COPR = Copr Build System for community packages",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Check package build information.",
    points: 25,
    cmds: [
      "rpm -qi httpd",
      "dnf info httpd",
      "rpm -q --queryformat='%{BUILDTIME}' httpd",
    ],
    verify: ["rpm -qi httpd | head -10"],
    hint: "rpm -qi shows package information",
    category: "software",
    difficulty: "medium",
  },
  {
    desc: "Import GPG key for repository.",
    points: 25,
    cmds: [
      "rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-redhat-release",
      "dnf config-manager --save --setopt=gpgcheck=1",
      "rpm -q gpg-pubkey",
    ],
    verify: ["rpm -q gpg-pubkey", "gpg --list-keys"],
    hint: "GPG keys verify package authenticity",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Check package conflicts.",
    points: 30,
    cmds: [
      "rpm -q --conflicts httpd",
      "dnf check",
      "rpm --test -Uvh package.rpm",
    ],
    verify: ["rpm -q --conflicts httpd"],
    hint: "check for package conflicts before installation",
    category: "software",
    difficulty: "hard",
  },
  {
    desc: "Set up modular streams.",
    points: 35,
    cmds: [
      "dnf module list",
      "dnf module enable nodejs:14",
      "dnf module install nodejs:14/common",
    ],
    verify: ["dnf module list nodejs", "which node"],
    hint: "Modules provide alternative package versions",
    category: "software",
    difficulty: "hard",
  },

  // ========== 12. FILE SYSTEMS (25 questions) ==========
  {
    desc: "List block devices, identify filesystem types, and check disk usage.",
    points: 15,
    cmds: ["lsblk", "blkid", "df -h", "fdisk -l | head -30"],
    verify: ["lsblk -f", "df -h /"],
    hint: "lsblk lists block devices, blkid shows filesystem UUIDs",
    category: "file-systems",
    difficulty: "easy",
  },
  {
    desc: "Mount USB drive /dev/sdb1 to /mnt/usb and check filesystem type.",
    points: 15,
    cmds: [
      "mkdir -p /mnt/usb",
      "mount /dev/sdb1 /mnt/usb",
      "df -h /mnt/usb",
      "umount /mnt/usb",
    ],
    verify: ["mount | grep /mnt/usb", "blkid /dev/sdb1"],
    hint: "mount attaches filesystem, umount detaches",
    category: "file-systems",
    difficulty: "easy",
  },
  {
    desc: "Configure /etc/fstab to auto-mount /dev/sdb1 at /data with ext4 filesystem.",
    points: 20,
    cmds: [
      "mkfs.ext4 /dev/sdb1",
      "mkdir -p /data",
      "echo '/dev/sdb1 /data ext4 defaults 0 0' >> /etc/fstab",
      "mount -a",
      "df -h /data",
    ],
    verify: [
      "cat /etc/fstab | grep /data",
      "df -h /data",
      "mount | grep /data",
    ],
    hint: "/etc/fstab entries: device mountpoint fstype options dump pass",
    category: "file-systems",
    difficulty: "medium",
  },
  {
    desc: "Find files larger than 100MB in /var directory and list them by size.",
    points: 15,
    cmds: [
      "find /var -type f -size +100M 2>/dev/null",
      "find /var -type f -size +100M -exec ls -lh {} \\; 2>/dev/null | head -10",
    ],
    verify: ["find /var -type f -size +100M 2>/dev/null | wc -l"],
    hint: "find -size +100M finds >100MB files, 2>/dev/null suppresses errors",
    category: "file-systems",
    difficulty: "medium",
  },
  {
    desc: "Check filesystem for errors with fsck.",
    points: 20,
    cmds: ["umount /dev/sdb1", "fsck /dev/sdb1", "fsck -y /dev/sdb1"],
    verify: ["fsck -N /dev/sdb1"],
    hint: "fsck checks filesystem, must be unmounted",
    category: "file-systems",
    difficulty: "medium",
  },
  {
    desc: "Resize ext4 filesystem.",
    points: 30,
    cmds: [
      "umount /data",
      "resize2fs /dev/sdb1 10G",
      "mount /data",
      "df -h /data",
    ],
    verify: ["df -h /data", "dumpe2fs /dev/sdb1 | grep 'Block count'"],
    hint: "resize2fs resizes ext filesystems",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Create XFS filesystem.",
    points: 20,
    cmds: [
      "mkfs.xfs /dev/sdb1",
      "xfs_info /dev/sdb1",
      "xfs_admin -l /dev/sdb1",
    ],
    verify: ["blkid /dev/sdb1 | grep xfs"],
    hint: "XFS is default on RHEL 8+",
    category: "file-systems",
    difficulty: "medium",
  },
  {
    desc: "Resize XFS filesystem.",
    points: 35,
    cmds: ["xfs_growfs /data", "xfs_growfs -D 10G /data", "xfs_info /data"],
    verify: ["df -h /data", "xfs_info /data"],
    hint: "XFS can only grow, not shrink",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Create Btrfs filesystem.",
    points: 25,
    cmds: [
      "mkfs.btrfs /dev/sdb1",
      "btrfs filesystem show",
      "btrfs filesystem df /data",
    ],
    verify: ["blkid /dev/sdb1 | grep btrfs"],
    hint: "Btrfs supports snapshots and compression",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Create Btrfs snapshot.",
    points: 30,
    cmds: [
      "btrfs subvolume snapshot /data /data/snapshot",
      "btrfs subvolume list /data",
      "btrfs subvolume delete /data/snapshot",
    ],
    verify: ["btrfs subvolume list /data"],
    hint: "Btrfs snapshots are space-efficient copies",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Enable Btrfs compression.",
    points: 30,
    cmds: [
      "mount -o compress=zstd /dev/sdb1 /data",
      "btrfs property set /data compression zstd",
      "btrfs filesystem defragment -czstd /data",
    ],
    verify: ["mount | grep compress", "btrfs property get /data compression"],
    hint: "zstd compression saves space",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Create ext4 with specific features.",
    points: 25,
    cmds: [
      "mkfs.ext4 -O extent,dir_index /dev/sdb1",
      "tune2fs -l /dev/sdb1",
      "dumpe2fs /dev/sdb1",
    ],
    verify: ["tune2fs -l /dev/sdb1 | grep features"],
    hint: "extent improves large file performance",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Set filesystem label.",
    points: 20,
    cmds: [
      "e2label /dev/sdb1 mydata",
      "xfs_admin -L mydata /dev/sdb1",
      "findfs LABEL=mydata",
    ],
    verify: ["blkid /dev/sdb1", "findfs LABEL=mydata"],
    hint: "Labels make devices easier to identify",
    category: "file-systems",
    difficulty: "medium",
  },
  {
    desc: "Set filesystem UUID.",
    points: 25,
    cmds: [
      "uuidgen",
      "tune2fs -U $(uuidgen) /dev/sdb1",
      "xfs_admin -U generate /dev/sdb1",
    ],
    verify: ["blkid /dev/sdb1"],
    hint: "UUID uniquely identifies filesystem",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Mount filesystem with specific options.",
    points: 20,
    cmds: [
      "mount -o noatime,nodiratime /dev/sdb1 /data",
      "mount | grep /data",
      "mount -o remount,ro /data",
    ],
    verify: ["mount | grep noatime", "mount | grep /data"],
    hint: "noatime improves performance by not updating access times",
    category: "file-systems",
    difficulty: "medium",
  },
  {
    desc: "Create bind mount.",
    points: 25,
    cmds: [
      "mount --bind /olddir /newdir",
      "mount --make-private /newdir",
      "mount --make-rshared /newdir",
    ],
    verify: ["mount | grep bind"],
    hint: "bind mount makes directory available elsewhere",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Create overlay filesystem.",
    points: 35,
    cmds: [
      "mount -t overlay overlay -o lowerdir=/lower,upperdir=/upper,workdir=/work /merged",
    ],
    verify: ["mount | grep overlay"],
    hint: "overlay combines multiple directories",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Set up automount with autofs.",
    points: 30,
    cmds: [
      "dnf install -y autofs",
      "echo '/misc /etc/auto.misc' >> /etc/auto.master",
      "echo 'cd -fstype=iso9660,ro,nosuid,nodev :/dev/cdrom' > /etc/auto.misc",
      "systemctl enable --now autofs",
    ],
    verify: ["ls /misc/cd", "systemctl status autofs"],
    hint: "autofs mounts filesystems on demand",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Check inode usage.",
    points: 20,
    cmds: [
      "df -i",
      "tune2fs -l /dev/sdb1 | grep -i inode",
      "find /data -type f | wc -l",
    ],
    verify: ["df -i /data"],
    hint: "inodes track files, can run out before space",
    category: "file-systems",
    difficulty: "medium",
  },
  {
    desc: "Increase inode count.",
    points: 35,
    cmds: [
      "mkfs.ext4 -N 1000000 /dev/sdb1",
      "tune2fs -l /dev/sdb1 | grep Inode",
    ],
    verify: ["tune2fs -l /dev/sdb1 | grep 'Inode count'"],
    hint: "-N sets inode count at filesystem creation",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Create encrypted filesystem with LUKS.",
    points: 40,
    cmds: [
      "cryptsetup luksFormat /dev/sdb1",
      "cryptsetup open /dev/sdb1 encrypted_vol",
      "mkfs.ext4 /dev/mapper/encrypted_vol",
      "mount /dev/mapper/encrypted_vol /secure",
    ],
    verify: ["cryptsetup status encrypted_vol", "df -h /secure"],
    hint: "LUKS provides disk encryption",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Check filesystem journal.",
    points: 25,
    cmds: [
      "dumpe2fs /dev/sdb1 | grep -i journal",
      "tune2fs -O ^has_journal /dev/sdb1",
      "tune2fs -O has_journal /dev/sdb1",
    ],
    verify: ["dumpe2fs /dev/sdb1 | grep 'Filesystem features'"],
    hint: "Journal improves filesystem recovery",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Set filesystem reserved blocks.",
    points: 25,
    cmds: [
      "tune2fs -m 5 /dev/sdb1",
      "tune2fs -l /dev/sdb1 | grep 'Reserved block'",
    ],
    verify: ["tune2fs -l /dev/sdb1 | grep 'Reserved blocks'"],
    hint: "Reserved blocks prevent root from filling filesystem",
    category: "file-systems",
    difficulty: "hard",
  },
  {
    desc: "Check filesystem mount count.",
    points: 20,
    cmds: [
      "tune2fs -l /dev/sdb1 | grep -i 'mount count'",
      "tune2fs -c 100 /dev/sdb1",
      "tune2fs -C 50 /dev/sdb1",
    ],
    verify: ["tune2fs -l /dev/sdb1 | grep 'Mount count'"],
    hint: "Filesystem checks after certain mount count",
    category: "file-systems",
    difficulty: "medium",
  },
  {
    desc: "Create filesystem with specific block size.",
    points: 25,
    cmds: [
      "mkfs.ext4 -b 4096 /dev/sdb1",
      "xfs_info /dev/sdb1",
      "tune2fs -l /dev/sdb1 | grep 'Block size'",
    ],
    verify: ["tune2fs -l /dev/sdb1 | grep 'Block size'"],
    hint: "Block size affects performance",
    category: "file-systems",
    difficulty: "hard",
  },

  // ========== 13. SCRIPTING (25 questions) ==========
  {
    desc: "Create shell script /usr/local/bin/backup.sh that backs up /etc to /backup with date stamp.",
    points: 20,
    cmds: [
      'cat > /usr/local/bin/backup.sh << \'EOF\'\n#!/bin/bash\nBACKUP_DIR="/backup/backup_$(date +%Y%m%d)"\nmkdir -p "$BACKUP_DIR"\ncp -a /etc "$BACKUP_DIR"\necho "Backup completed: $BACKUP_DIR"\nEOF',
      "chmod +x /usr/local/bin/backup.sh",
      "/usr/local/bin/backup.sh",
    ],
    verify: [
      "ls -ld /usr/local/bin/backup.sh",
      "ls -d /backup/*",
      "/usr/local/bin/backup.sh",
    ],
    hint: "heredoc (<< 'EOF') creates multi-line file, $(date) inserts current date",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create bash script that backs up files modified in last 7 days from /home to /backup.",
    points: 25,
    cmds: [
      'cat > /usr/local/bin/backup-recent.sh << \'EOF\'\n#!/bin/bash\nBACKUP_DIR="/backup/backup_$(date +%Y%m%d)"\nmkdir -p "$BACKUP_DIR"\nfind /home -type f -mtime -7 -exec cp {} "$BACKUP_DIR" \\;\necho "Backed up $(ls "$BACKUP_DIR" | wc -l) files to $BACKUP_DIR"\nEOF',
      "chmod +x /usr/local/bin/backup-recent.sh",
      "/usr/local/bin/backup-recent.sh",
    ],
    verify: ["ls -l /usr/local/bin/backup-recent.sh", "ls -d /backup/*"],
    hint: "find -mtime -7 = modified in last 7 days, -exec executes command for each",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Use grep with regular expressions: find IP addresses in log file.",
    points: 20,
    cmds: [
      "grep -E '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}' /var/log/messages | head -10",
      "grep -oE '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}' /var/log/messages | sort -u",
    ],
    verify: [
      "grep -c -E '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}' /var/log/messages",
    ],
    hint: "grep -E enables extended regex, -o shows only matching part",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with command line arguments.",
    points: 25,
    cmds: [
      'cat > /usr/local/bin/greet.sh << \'EOF\'\n#!/bin/bash\necho "Hello $1"\necho "You passed $# arguments"\necho "All arguments: $@"\nEOF',
      "chmod +x /usr/local/bin/greet.sh",
      "/usr/local/bin/greet.sh World",
    ],
    verify: ["/usr/local/bin/greet.sh test", "echo $?"],
    hint: "$1 first argument, $# argument count, $@ all arguments",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with options parsing.",
    points: 30,
    cmds: [
      'cat > /usr/local/bin/myscript.sh << \'EOF\'\n#!/bin/bash\nwhile getopts "a:b:h" opt; do\n  case $opt in\n    a) ARG_A="$OPTARG" ;;\n    b) ARG_B="$OPTARG" ;;\n    h) echo "Usage: $0 [-a value] [-b value]" ; exit 0 ;;\n    *) echo "Invalid option" ; exit 1 ;;\n  esac\ndone\necho "A: $ARG_A, B: $ARG_B"\nEOF',
      "chmod +x /usr/local/bin/myscript.sh",
      "/usr/local/bin/myscript.sh -a hello -b world",
    ],
    verify: [
      "/usr/local/bin/myscript.sh -h",
      "/usr/local/bin/myscript.sh -a test",
    ],
    hint: "getopts parses command line options",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with error handling.",
    points: 30,
    cmds: [
      'cat > /usr/local/bin/safe.sh << \'EOF\'\n#!/bin/bash\nset -euo pipefail\ntrap \'echo "Error at line $LINENO"\' ERR\necho "Starting..."\n# Command that might fail\nls /nonexistent || echo "File not found"\necho "Continuing..."\nEOF',
      "chmod +x /usr/local/bin/safe.sh",
      "/usr/local/bin/safe.sh",
    ],
    verify: ["/usr/local/bin/safe.sh 2>&1"],
    hint: "set -e exits on error, trap catches errors",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with logging.",
    points: 25,
    cmds: [
      'cat > /usr/local/bin/logging.sh << \'EOF\'\n#!/bin/bash\nLOG_FILE="/var/log/myscript.log"\nexec > >(tee -a "$LOG_FILE") 2>&1\necho "Script started at $(date)"\n# Main script here\necho "Script completed at $(date)"\nEOF',
      "chmod +x /usr/local/bin/logging.sh",
      "/usr/local/bin/logging.sh",
    ],
    verify: ["tail /var/log/myscript.log"],
    hint: "exec redirects all output to log file",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with configuration file.",
    points: 30,
    cmds: [
      "cat > /etc/myscript.conf << 'EOF'\nUSER=alice\nBACKUP_DIR=/backup\nRETENTION_DAYS=30\nEOF",
      'cat > /usr/local/bin/config.sh << \'EOF\'\n#!/bin/bash\nsource /etc/myscript.conf\necho "User: $USER"\necho "Backup dir: $BACKUP_DIR"\necho "Retention: $RETENTION_DAYS days"\nEOF',
      "chmod +x /usr/local/bin/config.sh",
      "/usr/local/bin/config.sh",
    ],
    verify: ["cat /etc/myscript.conf", "/usr/local/bin/config.sh"],
    hint: "source loads configuration file",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with functions.",
    points: 25,
    cmds: [
      'cat > /usr/local/bin/func.sh << \'EOF\'\n#!/bin/bash\nhello() {\n  echo "Hello $1"\n}\nadd() {\n  echo $(($1 + $2))\n}\nhello "World"\nadd 5 3\nEOF',
      "chmod +x /usr/local/bin/func.sh",
      "/usr/local/bin/func.sh",
    ],
    verify: ["/usr/local/bin/func.sh"],
    hint: "Functions organize reusable code",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with arrays.",
    points: 30,
    cmds: [
      'cat > /usr/local/bin/array.sh << \'EOF\'\n#!/bin/bash\nfruits=("apple" "banana" "cherry")\necho "First fruit: ${fruits[0]}"\necho "All fruits: ${fruits[@]}"\necho "Number of fruits: ${#fruits[@]}"\nfor fruit in "${fruits[@]}"; do\n  echo "Fruit: $fruit"\ndone\nEOF',
      "chmod +x /usr/local/bin/array.sh",
      "/usr/local/bin/array.sh",
    ],
    verify: ["/usr/local/bin/array.sh"],
    hint: "Arrays store multiple values",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with associative arrays.",
    points: 35,
    cmds: [
      'cat > /usr/local/bin/assoc.sh << \'EOF\'\n#!/bin/bash\ndeclare -A colors\ncolors["red"]="#ff0000"\ncolors["green"]="#00ff00"\ncolors["blue"]="#0000ff"\necho "Red: ${colors[red]}"\nfor key in "${!colors[@]}"; do\n  echo "$key: ${colors[$key]}"\ndone\nEOF',
      "chmod +x /usr/local/bin/assoc.sh",
      "/usr/local/bin/assoc.sh",
    ],
    verify: ["/usr/local/bin/assoc.sh"],
    hint: "Associative arrays are key-value pairs",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with file operations.",
    points: 25,
    cmds: [
      'cat > /usr/local/bin/fileops.sh << \'EOF\'\n#!/bin/bash\nFILE="/tmp/test.txt"\nif [[ -f "$FILE" ]]; then\n  echo "File exists"\nelse\n  echo "File does not exist"\nfi\nif [[ -r "$FILE" ]]; then\n  echo "File is readable"\nfi\nif [[ -w "$FILE" ]]; then\n  echo "File is writable"\nfi\nEOF',
      "chmod +x /usr/local/bin/fileops.sh",
      "/usr/local/bin/fileops.sh",
    ],
    verify: ["touch /tmp/test.txt", "/usr/local/bin/fileops.sh"],
    hint: "[[ condition ]] tests file properties",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with string operations.",
    points: 30,
    cmds: [
      'cat > /usr/local/bin/string.sh << \'EOF\'\n#!/bin/bash\nstr="Hello World"\necho "Length: ${#str}"\necho "Uppercase: ${str^^}"\necho "Lowercase: ${str,,}"\necho "Replace: ${str/World/Everyone}"\necho "Substring: ${str:6:5}"\nEOF',
      "chmod +x /usr/local/bin/string.sh",
      "/usr/local/bin/string.sh",
    ],
    verify: ["/usr/local/bin/string.sh"],
    hint: "Bash has built-in string manipulation",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with arithmetic operations.",
    points: 25,
    cmds: [
      'cat > /usr/local/bin/math.sh << \'EOF\'\n#!/bin/bash\na=10\nb=3\necho "Addition: $((a + b))"\necho "Subtraction: $((a - b))"\necho "Multiplication: $((a * b))"\necho "Division: $((a / b))"\necho "Modulus: $((a % b))"\necho "Increment: $((a++))"\necho "Decrement: $((b--))"\nEOF',
      "chmod +x /usr/local/bin/math.sh",
      "/usr/local/bin/math.sh",
    ],
    verify: ["/usr/local/bin/math.sh"],
    hint: "$(( )) performs arithmetic",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with case statement.",
    points: 25,
    cmds: [
      'cat > /usr/local/bin/case.sh << \'EOF\'\n#!/bin/bash\ncase "$1" in\n  start)\n    echo "Starting..."\n    ;;\n  stop)\n    echo "Stopping..."\n    ;;\n  restart)\n    echo "Restarting..."\n    ;;\n  *)\n    echo "Usage: $0 {start|stop|restart}"\n    ;;\nesac\nEOF',
      "chmod +x /usr/local/bin/case.sh",
      "/usr/local/bin/case.sh start",
    ],
    verify: ["/usr/local/bin/case.sh start", "/usr/local/bin/case.sh help"],
    hint: "case is alternative to multiple if statements",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with while loop.",
    points: 25,
    cmds: [
      "cat > /usr/local/bin/while.sh << 'EOF'\n#!/bin/bash\ncount=1\nwhile [[ $count -le 5 ]]; do\n  echo \"Count: $count\"\n  ((count++))\ndone\nEOF",
      "chmod +x /usr/local/bin/while.sh",
      "/usr/local/bin/while.sh",
    ],
    verify: ["/usr/local/bin/while.sh"],
    hint: "while loops while condition is true",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with until loop.",
    points: 25,
    cmds: [
      "cat > /usr/local/bin/until.sh << 'EOF'\n#!/bin/bash\ncount=1\nuntil [[ $count -gt 5 ]]; do\n  echo \"Count: $count\"\n  ((count++))\ndone\nEOF",
      "chmod +x /usr/local/bin/until.sh",
      "/usr/local/bin/until.sh",
    ],
    verify: ["/usr/local/bin/until.sh"],
    hint: "until loops until condition becomes true",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with select menu.",
    points: 30,
    cmds: [
      'cat > /usr/local/bin/select.sh << \'EOF\'\n#!/bin/bash\nPS3=\'Please choose an option: \'\noptions=("Option 1" "Option 2" "Option 3" "Quit")\nselect opt in "${options[@]}"\ndo\n  case $opt in\n    "Option 1")\n      echo "You chose Option 1"\n      ;;\n    "Option 2")\n      echo "You chose Option 2"\n      ;;\n    "Option 3")\n      echo "You chose Option 3"\n      ;;\n    "Quit")\n      break\n      ;;\n    *) echo "Invalid option";;\n  esac\ndone\nEOF',
      "chmod +x /usr/local/bin/select.sh",
      "/usr/local/bin/select.sh",
    ],
    verify: ["/usr/local/bin/select.sh"],
    hint: "select creates interactive menus",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with process substitution.",
    points: 35,
    cmds: [
      "cat > /usr/local/bin/procsub.sh << 'EOF'\n#!/bin/bash\ndiff <(ls /etc) <(ls /var)\necho \"Process substitution complete\"\nEOF",
      "chmod +x /usr/local/bin/procsub.sh",
      "/usr/local/bin/procsub.sh",
    ],
    verify: ["/usr/local/bin/procsub.sh 2>&1"],
    hint: "<() treats command output as file",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with here documents.",
    points: 25,
    cmds: [
      "cat > /usr/local/bin/heredoc.sh << 'EOF'\n#!/bin/bash\ncat << END\nThis is a multi-line\nhere document\nIt preserves formatting\nEND\ncat <<- INDENTED\n    This has indentation\n    that will be removed\n    by the dash -\nINDENTED\nEOF",
      "chmod +x /usr/local/bin/heredoc.sh",
      "/usr/local/bin/heredoc.sh",
    ],
    verify: ["/usr/local/bin/heredoc.sh"],
    hint: "<< creates here documents, <<- removes tabs",
    category: "scripting",
    difficulty: "medium",
  },
  {
    desc: "Create script with trap signals.",
    points: 35,
    cmds: [
      'cat > /usr/local/bin/trap.sh << \'EOF\'\n#!/bin/bash\ntrap \'echo "Caught SIGINT"; exit 1\' SIGINT\ntrap \'echo "Caught SIGTERM"; exit 1\' SIGTERM\necho "Running... Press Ctrl+C to test"\nsleep 30\necho "Finished normally"\nEOF',
      "chmod +x /usr/local/bin/trap.sh",
      "/usr/local/bin/trap.sh",
    ],
    verify: ["/usr/local/bin/trap.sh & sleep 1; kill -INT $!"],
    hint: "trap catches and handles signals",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with subshell.",
    points: 30,
    cmds: [
      'cat > /usr/local/bin/subshell.sh << \'EOF\'\n#!/bin/bash\n(cd /tmp && pwd)\necho "Back in: $(pwd)"\nvar=$(echo "Subshell output")\necho "Variable: $var"\nEOF',
      "chmod +x /usr/local/bin/subshell.sh",
      "/usr/local/bin/subshell.sh",
    ],
    verify: ["/usr/local/bin/subshell.sh"],
    hint: "( ) creates subshell with isolated environment",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with debugging.",
    points: 30,
    cmds: [
      'cat > /usr/local/bin/debug.sh << \'EOF\'\n#!/bin/bash\nset -x\necho "Debug mode enabled"\nvar="test"\necho "Variable: $var"\nset +x\necho "Debug mode disabled"\nEOF',
      "chmod +x /usr/local/bin/debug.sh",
      "/usr/local/bin/debug.sh",
    ],
    verify: ["/usr/local/bin/debug.sh 2>&1 | grep -E '\\+\\+|Variable'"],
    hint: "set -x enables debug output, set +x disables",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with input validation.",
    points: 30,
    cmds: [
      'cat > /usr/local/bin/validate.sh << \'EOF\'\n#!/bin/bash\nread -p "Enter a number: " num\nif [[ ! $num =~ ^[0-9]+$ ]]; then\n  echo "Error: Not a number" >&2\n  exit 1\nfi\nif [[ $num -lt 1 || $num -gt 100 ]]; then\n  echo "Error: Number must be 1-100" >&2\n  exit 1\nfi\necho "Valid number: $num"\nEOF',
      "chmod +x /usr/local/bin/validate.sh",
      "/usr/local/bin/validate.sh",
    ],
    verify: [
      "echo '50' | /usr/local/bin/validate.sh",
      "echo 'abc' | /usr/local/bin/validate.sh",
    ],
    hint: "=~ matches regex, >&2 writes to stderr",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with color output.",
    points: 30,
    cmds: [
      "cat > /usr/local/bin/color.sh << 'EOF'\n#!/bin/bash\nRED='\\033[0;31m'\nGREEN='\\033[0;32m'\nNC='\\033[0m' # No Color\necho -e \"${RED}Red text${NC}\"\necho -e \"${GREEN}Green text${NC}\"\necho \"Normal text\"\nEOF",
      "chmod +x /usr/local/bin/color.sh",
      "/usr/local/bin/color.sh",
    ],
    verify: ["/usr/local/bin/color.sh"],
    hint: "\\033[ escape sequences control colors",
    category: "scripting",
    difficulty: "hard",
  },
  {
    desc: "Create script with progress bar.",
    points: 35,
    cmds: [
      'cat > /usr/local/bin/progress.sh << \'EOF\'\n#!/bin/bash\nfor i in {1..10}; do\n  echo -ne "Progress: [$i/10]\\r"\n  sleep 0.5\ndone\necho -e "\\nDone!"\nEOF',
      "chmod +x /usr/local/bin/progress.sh",
      "/usr/local/bin/progress.sh",
    ],
    verify: ["/usr/local/bin/progress.sh"],
    hint: "\\r returns to line start for progress display",
    category: "scripting",
    difficulty: "hard",
  },

  // ========== 14. SCHEDULING (25 questions) ==========
  {
    desc: "Schedule cron job to run /usr/local/bin/backup.sh daily at 2 AM.",
    points: 20,
    cmds: [
      "crontab -l",
      "echo '0 2 * * * /usr/local/bin/backup.sh' >> /tmp/mycron",
      "crontab /tmp/mycron",
      "crontab -l",
    ],
    verify: ["crontab -l | grep backup.sh"],
    hint: "cron format: minute hour day month weekday command",
    category: "scheduling",
    difficulty: "medium",
  },
  {
    desc: "Schedule at job to run command in 5 minutes.",
    points: 15,
    cmds: [
      "echo 'tar -czf /backup/$(date +%Y%m%d).tar.gz /etc' | at now + 5 minutes",
      "atq",
      "atrm <jobid>",
    ],
    verify: ["atq", "at -l"],
    hint: "at schedules one-time jobs, atq lists jobs",
    category: "scheduling",
    difficulty: "easy",
  },
  {
    desc: "Create system cron job in /etc/cron.d/ for hourly log cleanup.",
    points: 20,
    cmds: [
      "echo '0 * * * * root find /var/log -name \"*.log\" -mtime +7 -delete' > /etc/cron.d/logcleanup",
      "ls -l /etc/cron.d/",
      "systemctl restart crond",
    ],
    verify: ["cat /etc/cron.d/logcleanup", "systemctl status crond"],
    hint: "/etc/cron.d/ files are system-wide cron jobs",
    category: "scheduling",
    difficulty: "medium",
  },
  {
    desc: "Configure anacron for jobs that need to run when system is off.",
    points: 25,
    cmds: [
      "echo '1 5 cron.daily nice run-parts /etc/cron.daily' >> /etc/anacrontab",
      "echo '7 10 cron.weekly nice run-parts /etc/cron.weekly' >> /etc/anacrontab",
      "cat /etc/anacrontab",
    ],
    verify: ["cat /etc/anacrontab", "ls /etc/cron.daily/"],
    hint: "anacron runs jobs that missed schedule due to downtime",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job with specific user.",
    points: 20,
    cmds: [
      "echo '0 3 * * * alice /home/alice/backup.sh' | crontab -u alice -",
      "crontab -u alice -l",
    ],
    verify: ["crontab -u alice -l"],
    hint: "crontab -u manages other users' cron jobs",
    category: "scheduling",
    difficulty: "medium",
  },
  {
    desc: "Schedule job with environment variables.",
    points: 25,
    cmds: [
      "echo 'PATH=/usr/local/bin:/usr/bin:/bin' > /tmp/mycron",
      "echo 'MAILTO=admin@example.com' >> /tmp/mycron",
      "echo '0 2 * * * backup.sh' >> /tmp/mycron",
      "crontab /tmp/mycron",
    ],
    verify: ["crontab -l | head -5"],
    hint: "Environment variables in crontab affect all jobs",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job that runs every 15 minutes.",
    points: 20,
    cmds: [
      "echo '*/15 * * * * /usr/local/bin/check.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '\\*/15'"],
    hint: "*/15 = every 15 minutes",
    category: "scheduling",
    difficulty: "medium",
  },
  {
    desc: "Schedule job that runs on weekdays only.",
    points: 20,
    cmds: [
      "echo '0 9 * * 1-5 /usr/local/bin/daily.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '1-5'"],
    hint: "1-5 = Monday to Friday (0 or 7 = Sunday)",
    category: "scheduling",
    difficulty: "medium",
  },
  {
    desc: "Schedule job that runs on specific day of month.",
    points: 20,
    cmds: [
      "echo '0 0 1 * * /usr/local/bin/monthly.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '0 0 1'"],
    hint: "0 0 1 * * = midnight on 1st day of month",
    category: "scheduling",
    difficulty: "medium",
  },
  {
    desc: "Create cron job with output redirection.",
    points: 25,
    cmds: [
      "echo '0 * * * * /usr/local/bin/script.sh > /var/log/script.log 2>&1' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '2>&1'"],
    hint: "2>&1 redirects stderr to stdout",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job that depends on another job.",
    points: 30,
    cmds: [
      "echo '0 2 * * * /usr/local/bin/backup.sh && /usr/local/bin/cleanup.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '&&'"],
    hint: "&& runs second command only if first succeeds",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Create cron job that runs at random minute.",
    points: 30,
    cmds: [
      "echo '$((RANDOM % 60)) * * * * /usr/local/bin/random.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep -E '[0-9]+ \\*'"],
    hint: "RANDOM % 60 gives random number 0-59",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Configure cron to send mail for job output.",
    points: 25,
    cmds: ["echo 'MAILTO=\"admin@example.com\"' | crontab -", "crontab -l"],
    verify: ["crontab -l | grep MAILTO"],
    hint: "MAILTO sends cron output via email",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job that runs every 2 hours.",
    points: 20,
    cmds: [
      "echo '0 */2 * * * /usr/local/bin/hourly.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '\\*/2'"],
    hint: "*/2 = every 2 hours",
    category: "scheduling",
    difficulty: "medium",
  },
  {
    desc: "Create cron job that runs on reboot.",
    points: 25,
    cmds: [
      "echo '@reboot /usr/local/bin/startup.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '@reboot'"],
    hint: "@reboot runs once at system startup",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job with nice priority.",
    points: 25,
    cmds: [
      "echo '0 2 * * * nice -n 10 /usr/local/bin/backup.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep 'nice'"],
    hint: "nice lowers process priority",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Create cron job that runs only when network is up.",
    points: 35,
    cmds: [
      "echo '*/5 * * * * ping -c1 8.8.8.8 && /usr/local/bin/network.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep 'ping'"],
    hint: "ping tests network before running job",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job with timeout.",
    points: 30,
    cmds: [
      "echo '0 * * * * timeout 300 /usr/local/bin/longjob.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep 'timeout'"],
    hint: "timeout kills job after specified seconds",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Create cron job that logs to syslog.",
    points: 30,
    cmds: [
      "echo '0 * * * * /usr/local/bin/job.sh 2>&1 | logger -t mycron' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep 'logger'"],
    hint: "logger sends output to syslog",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job that runs on multiple time patterns.",
    points: 35,
    cmds: [
      "echo '0 9,12,18 * * * /usr/local/bin/check.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '9,12,18'"],
    hint: "9,12,18 = at 9AM, 12PM, and 6PM",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Create cron job that skips on weekends.",
    points: 30,
    cmds: [
      "echo '0 9 * * 1-5 /usr/local/bin/daily.sh'",
      "echo '0 9 * * 6,0 echo \"Skipping on weekend\"' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep -E '1-5|6,0'"],
    hint: "6,0 = Saturday and Sunday",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job that runs every 10 minutes during business hours.",
    points: 35,
    cmds: [
      "echo '*/10 9-17 * * 1-5 /usr/local/bin/monitor.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '9-17'"],
    hint: "9-17 = 9AM to 5PM",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Create cron job with flock to prevent overlapping.",
    points: 40,
    cmds: [
      "echo '*/5 * * * * /usr/bin/flock -n /tmp/myjob.lock /usr/local/bin/job.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep 'flock'"],
    hint: "flock ensures only one instance runs",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Schedule job that runs on last day of month.",
    points: 35,
    cmds: [
      "echo '0 0 28-31 * * [ $(date +%d -d tomorrow) = 01 ] && /usr/local/bin/endofmonth.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '28-31'"],
    hint: "Checks if tomorrow is 1st day of month",
    category: "scheduling",
    difficulty: "hard",
  },
  {
    desc: "Create cron job that depends on file existence.",
    points: 30,
    cmds: [
      "echo '0 * * * * [ -f /tmp/trigger ] && /usr/local/bin/triggered.sh' | crontab -",
      "crontab -l",
    ],
    verify: ["crontab -l | grep '\\[ -f'"],
    hint: "[ -f file ] tests if file exists",
    category: "scheduling",
    difficulty: "hard",
  },

  // ========== 15. PERFORMANCE (25 questions) ==========
  {
    desc: "Monitor system performance with top, check memory usage, CPU load, and I/O statistics.",
    points: 15,
    cmds: ["top -bn1 | head -20", "free -m", "vmstat 1 5", "iostat -x 1 3"],
    verify: ["top -bn1 | head -5", "free -m | grep Mem"],
    hint: "top shows process info, free shows memory, vmstat shows virtual memory stats",
    category: "performance",
    difficulty: "easy",
  },
  {
    desc: "Use vmstat to monitor virtual memory statistics every 2 seconds for 10 iterations.",
    points: 20,
    cmds: ["vmstat 2 10", "vmstat -s", "vmstat -d"],
    verify: ["vmstat 1 1"],
    hint: "vmstat interval count = run every interval for count times",
    category: "performance",
    difficulty: "medium",
  },
  {
    desc: "Monitor disk I/O with iostat and identify disk bottlenecks.",
    points: 20,
    cmds: ["iostat -x 1 5", "iostat -d -k 1 3", "iostat -c 1 3"],
    verify: ["iostat -x 1 1", "lsblk"],
    hint: "iostat -x shows extended stats including %util (busy percentage)",
    category: "performance",
    difficulty: "medium",
  },
  {
    desc: "Use sar to collect system activity data and generate reports.",
    points: 25,
    cmds: ["sar -u 1 5", "sar -r 1 5", "sar -b 1 5", "sar -q 1 5"],
    verify: ["sar -u 1 1", "sar --version"],
    hint: "sar = System Activity Reporter, -u CPU, -r memory, -b I/O, -q load",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Identify processes using most CPU with ps and top.",
    points: 15,
    cmds: [
      "ps aux --sort=-%cpu | head -10",
      "top -b -n 1 | head -20",
      "pidstat 1 5",
    ],
    verify: ["ps aux --sort=-%cpu | head -5"],
    hint: "ps --sort=-%cpu sorts by CPU descending",
    category: "performance",
    difficulty: "easy",
  },
  {
    desc: "Identify processes using most memory.",
    points: 15,
    cmds: [
      "ps aux --sort=-%mem | head -10",
      "top -b -n 1 -o %MEM | head -20",
      "pmap $(pgrep java) | tail -1",
    ],
    verify: ["ps aux --sort=-%mem | head -5", "free -m"],
    hint: "pmap shows memory map of process",
    category: "performance",
    difficulty: "easy",
  },
  {
    desc: "Monitor network performance with netstat and ss.",
    points: 20,
    cmds: ["netstat -s", "ss -s", "netstat -i", "ip -s link"],
    verify: ["netstat -s | head -20", "ss -s"],
    hint: "netstat -s shows protocol statistics",
    category: "performance",
    difficulty: "medium",
  },
  {
    desc: "Use dstat for combined system monitoring.",
    points: 25,
    cmds: ["dstat -cdngy 1 10", "dstat --top-cpu", "dstat --top-mem"],
    verify: ["which dstat", "dstat --version"],
    hint: "dstat shows CPU, disk, network, memory in one view",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Check system load averages.",
    points: 15,
    cmds: ["uptime", "cat /proc/loadavg", "w"],
    verify: ["uptime", "cat /proc/loadavg"],
    hint: "Load averages: 1min, 5min, 15min; should be < number of CPU cores",
    category: "performance",
    difficulty: "easy",
  },
  {
    desc: "Monitor system with nmon.",
    points: 25,
    cmds: [
      "nmon",
      "nmon -f -s 10 -c 60 -m /tmp",
      "sort -rnk3 /tmp/*.nmon | head -20",
    ],
    verify: ["which nmon", "nmon -h"],
    hint: "nmon = Nigel's performance Monitor",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Check disk usage and identify large files.",
    points: 20,
    cmds: [
      "df -h",
      "du -sh /*",
      "find / -type f -size +100M 2>/dev/null | head -20",
      "ncdu /",
    ],
    verify: ["df -h /", "du -sh /var/log"],
    hint: "ncdu = NCurses Disk Usage (interactive)",
    category: "performance",
    difficulty: "medium",
  },
  {
    desc: "Monitor system calls with strace.",
    points: 30,
    cmds: [
      "strace -c ls /",
      "strace -p $(pgrep httpd) -o /tmp/strace.out",
      "strace -e open,read,write ls /",
    ],
    verify: ["strace -c ls / 2>&1 | head -10"],
    hint: "strace -c counts system calls",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Use perf for performance analysis.",
    points: 35,
    cmds: [
      "perf stat ls /",
      "perf record -g -p $(pgrep httpd) sleep 10",
      "perf report",
    ],
    verify: ["which perf", "perf --version"],
    hint: "perf is Linux performance counter tool",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Check kernel parameters affecting performance.",
    points: 30,
    cmds: [
      "sysctl -a | grep -E '(vm|net|kernel)' | head -20",
      "cat /proc/sys/vm/swappiness",
      "cat /proc/sys/fs/file-max",
    ],
    verify: ["sysctl vm.swappiness", "sysctl fs.file-max"],
    hint: "sysctl shows/sets kernel parameters",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Optimize swappiness for database server.",
    points: 25,
    cmds: [
      "echo 'vm.swappiness = 10' >> /etc/sysctl.conf",
      "sysctl -p",
      "sysctl vm.swappiness",
    ],
    verify: ["sysctl vm.swappiness", "cat /etc/sysctl.conf | grep swappiness"],
    hint: "Lower swappiness reduces swap usage (0-100)",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Increase file descriptor limits.",
    points: 25,
    cmds: [
      "echo 'fs.file-max = 65536' >> /etc/sysctl.conf",
      "sysctl -p",
      "ulimit -n 65536",
    ],
    verify: ["sysctl fs.file-max", "ulimit -n"],
    hint: "file-max = system limit, ulimit = per process limit",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Monitor system with mpstat for CPU stats.",
    points: 25,
    cmds: ["mpstat -P ALL 1 5", "mpstat 1 5", "lscpu"],
    verify: ["mpstat 1 1", "lscpu | grep -E 'CPU\\(s\\)|Core'"],
    hint: "mpstat shows per-CPU statistics",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Use iotop for I/O monitoring.",
    points: 25,
    cmds: ["iotop", "iotop -o", "iotop -b -n 5"],
    verify: ["which iotop", "iotop --version"],
    hint: "iotop shows I/O usage by process",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Check memory page faults.",
    points: 30,
    cmds: [
      "ps -eo pid,comm,minflt,majflt | head -20",
      "vmstat -s | grep -i fault",
      "sar -B 1 5",
    ],
    verify: ["ps -eo minflt,majflt | head -5"],
    hint: "minflt = minor faults, majflt = major faults (require disk I/O)",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Monitor context switches.",
    points: 30,
    cmds: ["vmstat 1 5", "pidstat -w 1 5", "cat /proc/stat | grep ctxt"],
    verify: ["vmstat 1 1 | grep cs", "cat /proc/stat | grep ctxt"],
    hint: "High context switching indicates CPU contention",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Check disk queue length.",
    points: 25,
    cmds: [
      "iostat -x 1 5 | grep -E 'Device|sda'",
      "sar -d 1 5",
      "cat /sys/block/sda/queue/nr_requests",
    ],
    verify: ["iostat -x 1 1 | grep sda"],
    hint: "avgqu-sz in iostat shows average queue length",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Monitor network connections with iftop.",
    points: 30,
    cmds: ["iftop", "iftop -n -i eth0", "iftop -F 192.168.1.0/24"],
    verify: ["which iftop", "iftop --help"],
    hint: "iftop shows bandwidth usage per connection",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Check system interrupts.",
    points: 30,
    cmds: [
      "cat /proc/interrupts",
      "mpstat -I SUM 1 5",
      "watch -n 1 'cat /proc/interrupts | head -20'",
    ],
    verify: ["cat /proc/interrupts | head -10"],
    hint: "/proc/interrupts shows interrupt counts",
    category: "performance",
    difficulty: "hard",
  },
  {
    desc: "Monitor system with htop.",
    points: 20,
    cmds: ["htop", "htop -u root", "htop -s PERCENT_CPU"],
    verify: ["which htop", "htop --version"],
    hint: "htop is enhanced version of top",
    category: "performance",
    difficulty: "medium",
  },
  {
    desc: "Check for memory leaks.",
    points: 35,
    cmds: [
      "watch -n 1 'ps aux | grep java'",
      "valgrind --leak-check=yes program",
      "cat /proc/$(pgrep java)/status | grep -E '(VmRSS|VmSize)'",
    ],
    verify: ["ps aux | grep -E '(java|memory)'"],
    hint: "VmRSS = resident set size (actual memory used)",
    category: "performance",
    difficulty: "hard",
  },

  // ========== 16. SELINUX (25 questions) ==========
  {
    desc: "Check SELinux status, change to enforcing mode, and verify.",
    points: 15,
    cmds: ["sestatus", "getenforce", "setenforce 1", "getenforce"],
    verify: ["getenforce", "sestatus | grep mode"],
    hint: "setenforce 1 = enforcing, 0 = permissive, -1 = use config file",
    category: "selinux",
    difficulty: "easy",
  },
  {
    desc: "Change SELinux mode to permissive temporarily, then back to enforcing.",
    points: 15,
    cmds: ["setenforce 0", "getenforce", "setenforce 1", "getenforce"],
    verify: ["getenforce"],
    hint: "Permissive mode logs violations but doesn't block",
    category: "selinux",
    difficulty: "easy",
  },
  {
    desc: "Set SELinux to enforcing permanently in /etc/selinux/config.",
    points: 20,
    cmds: [
      "sed -i 's/SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config",
      "grep SELINUX /etc/selinux/config",
      "cat /etc/selinux/config",
    ],
    verify: ["cat /etc/selinux/config | grep SELINUX="],
    hint: "/etc/selinux/config sets persistent mode",
    category: "selinux",
    difficulty: "medium",
  },
  {
    desc: "Check SELinux context of files and processes.",
    points: 20,
    cmds: ["ls -Z /etc/passwd", "ps auxZ | grep httpd", "id -Z"],
    verify: ["ls -Z /etc/passwd", "ps auxZ | head -5"],
    hint: "ls -Z shows SELinux context, ps auxZ shows process context",
    category: "selinux",
    difficulty: "medium",
  },
  {
    desc: "Change file context with chcon and restore with restorecon.",
    points: 25,
    cmds: [
      "chcon -t httpd_sys_content_t /var/www/html/index.html",
      "ls -Z /var/www/html/index.html",
      "restorecon -v /var/www/html/index.html",
    ],
    verify: ["ls -Z /var/www/html/index.html"],
    hint: "chcon changes context temporarily, restorecon restores default",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Add permanent file context with semanage.",
    points: 30,
    cmds: [
      "semanage fcontext -a -t httpd_sys_content_t '/web(/.*)?'",
      "restorecon -Rv /web",
      "semanage fcontext -l | grep /web",
    ],
    verify: ["semanage fcontext -l | grep httpd_sys_content_t"],
    hint: "semanage makes context changes persistent",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Check and manage SELinux booleans.",
    points: 25,
    cmds: [
      "getsebool -a | grep httpd",
      "setsebool -P httpd_can_network_connect on",
      "getsebool httpd_can_network_connect",
    ],
    verify: ["getsebool httpd_can_network_connect"],
    hint: "-P makes boolean change persistent",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "View SELinux audit logs for denials.",
    points: 25,
    cmds: [
      "ausearch -m avc -ts today",
      "sealert -a /var/log/audit/audit.log",
      "grep 'avc:' /var/log/audit/audit.log | head -10",
    ],
    verify: ["ausearch -m avc | head -5", "which sealert"],
    hint: "ausearch searches audit logs, sealert analyzes denials",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Generate custom policy module for denial.",
    points: 35,
    cmds: [
      "audit2allow -a",
      "audit2allow -a -M mypolicy",
      "semodule -i mypolicy.pp",
    ],
    verify: ["semodule -l | grep mypolicy"],
    hint: "audit2allow creates policy from denials",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Manage SELinux port contexts.",
    points: 30,
    cmds: [
      "semanage port -l | grep http",
      "semanage port -a -t http_port_t -p tcp 8080",
      "semanage port -l | grep 8080",
    ],
    verify: ["semanage port -l | grep 8080"],
    hint: "SELinux controls which ports services can use",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Check and fix SELinux user mappings.",
    points: 30,
    cmds: [
      "semanage login -l",
      "semanage login -a -s user_u myuser",
      "semanage login -l | grep myuser",
    ],
    verify: ["semanage login -l"],
    hint: "SELinux users map Linux users to SELinux roles",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Create custom SELinux policy module.",
    points: 40,
    cmds: [
      "audit2allow -i /var/log/audit/audit.log -M custom",
      "semodule -i custom.pp",
      "semodule -l | grep custom",
    ],
    verify: ["semodule -l | grep custom"],
    hint: "Custom modules allow specific denied actions",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Relabel entire filesystem.",
    points: 35,
    cmds: [
      "touch /.autorelabel",
      "reboot",
      "# Or without reboot:",
      "fixfiles -F restore",
    ],
    verify: ["ls -Z / | head -5"],
    hint: "/.autorelabel triggers relabel on next boot",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Check SELinux policy version.",
    points: 20,
    cmds: ["sestatus | grep policy", "rpm -qa | grep selinux-policy", "seinfo"],
    verify: ["sestatus", "rpm -q selinux-policy"],
    hint: "seinfo shows policy statistics",
    category: "selinux",
    difficulty: "medium",
  },
  {
    desc: "Disable SELinux for troubleshooting.",
    points: 25,
    cmds: [
      "setenforce 0",
      "sed -i 's/SELINUX=.*/SELINUX=disabled/' /etc/selinux/config",
      "reboot",
    ],
    verify: ["getenforce"],
    hint: "Disabled mode turns off SELinux completely",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Check SELinux mount contexts.",
    points: 25,
    cmds: [
      "mount | grep context",
      "tune2fs -l /dev/sda1 | grep context",
      "ls -Zd /mnt",
    ],
    verify: ["mount | grep -E 'context|selinux'"],
    hint: "Filesystems can have default contexts",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Manage SELinux policy modules.",
    points: 30,
    cmds: ["semodule -l", "semodule -r badmodule", "semodule -i goodmodule.pp"],
    verify: ["semodule -l | head -10"],
    hint: "semodule manages policy modules",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Check SELinux MLS/MCS levels.",
    points: 30,
    cmds: ["sestatus | grep -E '(MLS|MCS)'", "id -Z", "ls -Z /etc/passwd"],
    verify: ["id -Z", "sestatus | grep mls"],
    hint: "MLS = Multi-Level Security, MCS = Multi-Category Security",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Fix common SELinux httpd issues.",
    points: 30,
    cmds: [
      "setsebool -P httpd_can_network_connect on",
      "setsebool -P httpd_enable_homedirs on",
      "chcon -R -t httpd_sys_content_t /var/www/html",
    ],
    verify: ["getsebool -a | grep httpd"],
    hint: "httpd booleans control web server permissions",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Fix SELinux for NFS shares.",
    points: 35,
    cmds: [
      "setsebool -P nfs_export_all_rw on",
      "setsebool -P nfs_export_all_ro on",
      "chcon -t public_content_t /shared",
    ],
    verify: ["getsebool -a | grep nfs"],
    hint: "NFS requires specific contexts and booleans",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Fix SELinux for Samba.",
    points: 35,
    cmds: [
      "setsebool -P samba_export_all_rw on",
      "setsebool -P samba_enable_home_dirs on",
      "chcon -t samba_share_t /samba",
    ],
    verify: ["getsebool -a | grep samba"],
    hint: "Samba shares need samba_share_t context",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Check SELinux for containers.",
    points: 35,
    cmds: [
      "getsebool -a | grep container",
      "setsebool -P container_manage_cgroup on",
      "semanage permissive -a container_t",
    ],
    verify: ["getsebool container_manage_cgroup"],
    hint: "container_t is SELinux type for containers",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Fix SELinux for PostgreSQL.",
    points: 35,
    cmds: [
      "semanage permissive -a postgresql_t",
      "setsebool -P postgresql_can_rsync on",
      "restorecon -Rv /var/lib/pgsql",
    ],
    verify: ["getsebool -a | grep postgresql"],
    hint: "postgresql_t is SELinux type for PostgreSQL",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Fix SELinux for email services.",
    points: 35,
    cmds: [
      "setsebool -P postfix_local_write_mail_spool on",
      "chcon -R -t postfix_spool_t /var/spool/postfix",
      "restorecon -Rv /etc/postfix",
    ],
    verify: ["getsebool -a | grep postfix"],
    hint: "postfix_spool_t for mail spool directory",
    category: "selinux",
    difficulty: "hard",
  },
  {
    desc: "Troubleshoot SELinux SSH issues.",
    points: 35,
    cmds: [
      "setsebool -P ssh_keysign on",
      "restorecon -Rv /etc/ssh",
      "ausearch -m avc -c sshd | audit2allow -M sshfix",
    ],
    verify: ["getsebool ssh_keysign"],
    hint: "ssh_keysign allows SSH key signing",
    category: "selinux",
    difficulty: "hard",
  },

  // ========== 17. BASIC STORAGE (25 questions) ==========
  {
    desc: "Create MBR partition on /dev/sdb, format as ext4, and mount at /data.",
    points: 25,
    cmds: [
      "fdisk /dev/sdb",
      "# In fdisk: n, p, 1, enter, enter, w",
      "mkfs.ext4 /dev/sdb1",
      "mkdir -p /data",
      "mount /dev/sdb1 /data",
    ],
    verify: ["lsblk /dev/sdb", "df -h /data", "blkid /dev/sdb1"],
    hint: "fdisk creates partitions, n=new, p=primary, w=write",
    category: "storage-basic",
    difficulty: "medium",
  },
  {
    desc: "Create GPT partition table and partition on /dev/sdc.",
    points: 30,
    cmds: [
      "parted /dev/sdc mklabel gpt",
      "parted /dev/sdc mkpart primary ext4 1MiB 10GiB",
      "parted /dev/sdc print",
      "mkfs.ext4 /dev/sdc1",
    ],
    verify: ["parted /dev/sdc print", "lsblk /dev/sdc"],
    hint: "GPT supports >2TB disks, parted handles GPT better than fdisk",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create swap partition on /dev/sdb2 and enable it.",
    points: 25,
    cmds: [
      "fdisk /dev/sdb",
      "# Create partition 2, type 82 (Linux swap)",
      "mkswap /dev/sdb2",
      "swapon /dev/sdb2",
      "swapon --show",
    ],
    verify: ["swapon --show", "free -h", "blkid /dev/sdb2 | grep swap"],
    hint: "mkswap initializes swap, swapon activates it",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create filesystem with specific parameters.",
    points: 30,
    cmds: [
      "mkfs.ext4 -b 4096 -i 16384 -m 2 /dev/sdb1",
      "tune2fs -c 100 -i 30d /dev/sdb1",
      "tune2fs -l /dev/sdb1 | head -30",
    ],
    verify: ["tune2fs -l /dev/sdb1 | grep -E 'Block size|Inode size|Reserved'"],
    hint: "-b block size, -i bytes per inode, -m reserved percentage",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Check and repair ext4 filesystem.",
    points: 30,
    cmds: [
      "umount /dev/sdb1",
      "fsck.ext4 -f /dev/sdb1",
      "fsck.ext4 -p /dev/sdb1",
      "dumpe2fs /dev/sdb1 | head -50",
    ],
    verify: ["fsck.ext4 -n /dev/sdb1", "dumpe2fs -h /dev/sdb1"],
    hint: "fsck checks and repairs, -f forces check even if clean",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create XFS filesystem with specific features.",
    points: 30,
    cmds: [
      "mkfs.xfs -f -i size=512 /dev/sdb1",
      "xfs_info /dev/sdb1",
      "xfs_admin -l /dev/sdb1",
    ],
    verify: ["xfs_info /dev/sdb1", "blkid /dev/sdb1"],
    hint: "-f forces creation, -i sets inode size",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Check and repair XFS filesystem.",
    points: 35,
    cmds: [
      "xfs_repair /dev/sdb1",
      "xfs_check /dev/sdb1",
      "xfs_db -c 'sb 0' -c 'print' /dev/sdb1",
    ],
    verify: ["xfs_repair -n /dev/sdb1", "xfs_info /dev/sdb1"],
    hint: "xfs_repair repairs XFS, -n dry run",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create Btrfs filesystem and subvolumes.",
    points: 35,
    cmds: [
      "mkfs.btrfs /dev/sdb1",
      "mount /dev/sdb1 /mnt",
      "btrfs subvolume create /mnt/subvol1",
      "btrfs subvolume list /mnt",
    ],
    verify: ["btrfs filesystem show", "btrfs subvolume list /mnt"],
    hint: "Btrfs subvolumes are like separate filesystems",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Use Btrfs snapshots and compression.",
    points: 40,
    cmds: [
      "btrfs subvolume snapshot /mnt/subvol1 /mnt/snapshot1",
      "btrfs property set /mnt/subvol1 compression zstd",
      "btrfs filesystem defragment -r -czstd /mnt",
    ],
    verify: [
      "btrfs subvolume list /mnt",
      "btrfs property get /mnt/subvol1 compression",
    ],
    hint: "zstd compression saves space with good performance",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create encrypted partition with LUKS.",
    points: 40,
    cmds: [
      "cryptsetup luksFormat /dev/sdb1",
      "cryptsetup open /dev/sdb1 cryptvol",
      "mkfs.ext4 /dev/mapper/cryptvol",
      "mount /dev/mapper/cryptvol /secure",
    ],
    verify: ["cryptsetup status cryptvol", "df -h /secure"],
    hint: "LUKS provides full disk encryption",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Manage LUKS encrypted volumes.",
    points: 45,
    cmds: [
      "cryptsetup luksAddKey /dev/sdb1",
      "cryptsetup luksDump /dev/sdb1",
      "cryptsetup resize cryptvol",
      "cryptsetup close cryptvol",
    ],
    verify: ["cryptsetup luksDump /dev/sdb1"],
    hint: "luksAddKey adds additional passphrases",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create RAID 1 mirror with mdadm.",
    points: 45,
    cmds: [
      "mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb1 /dev/sdc1",
      "cat /proc/mdstat",
      "mkfs.ext4 /dev/md0",
      "mount /dev/md0 /raid",
    ],
    verify: ["cat /proc/mdstat", "mdadm --detail /dev/md0"],
    hint: "RAID 1 mirrors data across disks",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create RAID 5 array.",
    points: 50,
    cmds: [
      "mdadm --create /dev/md0 --level=5 --raid-devices=3 /dev/sdb1 /dev/sdc1 /dev/sdd1",
      "mdadm --detail /dev/md0",
      "mkfs.xfs /dev/md0",
      "mount /dev/md0 /raid5",
    ],
    verify: [
      "cat /proc/mdstat",
      "mdadm --detail /dev/md0 | grep -E 'Level|State'",
    ],
    hint: "RAID 5 provides redundancy with parity",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Manage mdadm RAID arrays.",
    points: 45,
    cmds: [
      "mdadm --manage /dev/md0 --add /dev/sde1",
      "mdadm --manage /dev/md0 --remove /dev/sdb1",
      "mdadm --manage /dev/md0 --fail /dev/sdc1",
      "mdadm --detail /dev/md0",
    ],
    verify: ["mdadm --detail /dev/md0 | grep -E 'State|Failed'"],
    hint: "--add adds disk, --remove removes, --fail marks as failed",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create and manage RAID 6.",
    points: 50,
    cmds: [
      "mdadm --create /dev/md0 --level=6 --raid-devices=4 /dev/sdb1 /dev/sdc1 /dev/sdd1 /dev/sde1",
      "echo 'DEVICE /dev/sd[b-e]1' > /etc/mdadm.conf",
      "mdadm --detail --scan >> /etc/mdadm.conf",
      "update-initramfs -u",
    ],
    verify: ["cat /proc/mdstat", "mdadm --detail /dev/md0"],
    hint: "RAID 6 can survive 2 disk failures",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create RAID 10 array.",
    points: 50,
    cmds: [
      "mdadm --create /dev/md0 --level=10 --raid-devices=4 /dev/sdb1 /dev/sdc1 /dev/sdd1 /dev/sde1",
      "mdadm --detail /dev/md0",
      "mkfs.ext4 /dev/md0",
      "mount /dev/md0 /raid10",
    ],
    verify: ["cat /proc/mdstat", "mdadm --detail /dev/md0 | grep Level"],
    hint: "RAID 10 is mirror of stripes (performance + redundancy)",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Monitor RAID array health.",
    points: 40,
    cmds: [
      "watch -n 1 'cat /proc/mdstat'",
      "mdadm --monitor --daemonize --mail=admin@example.com /dev/md0",
      "smartctl -a /dev/sdb | grep -E 'Reallocated|Pending|Uncorrectable'",
    ],
    verify: ["cat /proc/mdstat", "systemctl status mdmonitor"],
    hint: "smartctl checks disk health",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Replace failed RAID disk.",
    points: 45,
    cmds: [
      "mdadm --manage /dev/md0 --fail /dev/sdb1",
      "mdadm --manage /dev/md0 --remove /dev/sdb1",
      "mdadm --manage /dev/md0 --add /dev/sdf1",
      "watch -n 1 'cat /proc/mdstat'",
    ],
    verify: ["mdadm --detail /dev/md0 | grep -E 'State|Rebuild'"],
    hint: "Monitor rebuild progress in /proc/mdstat",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create filesystem with discard (trim) support.",
    points: 35,
    cmds: [
      "mkfs.ext4 -E discard /dev/sdb1",
      "tune2fs -o discard /dev/sdb1",
      "mount -o discard /dev/sdb1 /data",
    ],
    verify: [
      "tune2fs -l /dev/sdb1 | grep 'Default mount options'",
      "mount | grep discard",
    ],
    hint: "discard enables TRIM for SSDs",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Check disk health with smartctl.",
    points: 35,
    cmds: [
      "smartctl -a /dev/sda",
      "smartctl -t short /dev/sda",
      "smartctl -l selftest /dev/sda",
      "smartctl -H /dev/sda",
    ],
    verify: ["smartctl -H /dev/sda", "smartctl -a /dev/sda | head -50"],
    hint: "smartctl monitors disk SMART data",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create GPT partition with parted.",
    points: 35,
    cmds: [
      "parted /dev/sdb mklabel gpt",
      "parted /dev/sdb mkpart primary ext4 1MiB 100GiB",
      "parted /dev/sdb set 1 boot on",
      "parted /dev/sdb print",
    ],
    verify: ["parted /dev/sdb print", "lsblk /dev/sdb"],
    hint: "GPT needed for UEFI boot and disks >2TB",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create hybrid MBR/GPT partition.",
    points: 40,
    cmds: [
      "parted /dev/sdb mklabel gpt",
      "parted /dev/sdb mkpart primary fat32 1MiB 513MiB",
      "parted /dev/sdb set 1 boot on",
      "parted /dev/sdb mkpart primary ext4 513MiB 100%",
      "sgdisk -h 1:2:3 /dev/sdb",
    ],
    verify: ["parted /dev/sdb print", "sgdisk -p /dev/sdb"],
    hint: "Hybrid MBR allows booting on legacy BIOS with GPT",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Align partitions for optimal performance.",
    points: 35,
    cmds: [
      "parted /dev/sdb mklabel gpt",
      "parted /dev/sdb mkpart primary ext4 1MiB 100%",
      "parted /dev/sdb align-check optimal 1",
      "cat /sys/block/sdb/queue/optimal_io_size",
    ],
    verify: ["parted /dev/sdb align-check optimal 1"],
    hint: "Optimal alignment improves SSD/RAID performance",
    category: "storage-basic",
    difficulty: "hard",
  },
  {
    desc: "Create swap file instead of partition.",
    points: 30,
    cmds: [
      "dd if=/dev/zero of=/swapfile bs=1M count=4096",
      "chmod 600 /swapfile",
      "mkswap /swapfile",
      "swapon /swapfile",
    ],
    verify: ["swapon --show", "ls -lh /swapfile"],
    hint: "Swap files are flexible alternative to partitions",
    category: "storage-basic",
    difficulty: "medium",
  },
  {
    desc: "Resize partition with parted.",
    points: 45,
    cmds: [
      "parted /dev/sdb print",
      "parted /dev/sdb resizepart 1 50GiB",
      "parted /dev/sdb print",
      "resize2fs /dev/sdb1",
    ],
    verify: ["parted /dev/sdb print | grep '1 '", "df -h /dev/sdb1"],
    hint: "resizepart changes partition size, resize2fs grows filesystem",
    category: "storage-basic",
    difficulty: "hard",
  },

  // ========== 18. LVM STORAGE (25 questions) ==========
  {
    desc: "Create LVM setup: physical volume on /dev/sdb, volume group vgdata, logical volume lvdata (5GB), format ext4, mount at /data.",
    points: 35,
    cmds: [
      "pvcreate /dev/sdb",
      "vgcreate vgdata /dev/sdb",
      "lvcreate -L 5G -n lvdata vgdata",
      "mkfs.ext4 /dev/vgdata/lvdata",
      "mkdir -p /data",
      "mount /dev/vgdata/lvdata /data",
    ],
    verify: ["pvs", "vgs", "lvs", "df -h /data"],
    hint: "pvcreate initializes PV, vgcreate creates VG, lvcreate creates LV",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Extend logical volume by 2GB and resize filesystem online.",
    points: 35,
    cmds: [
      "lvextend -L +2G /dev/vgdata/lvdata",
      "resize2fs /dev/vgdata/lvdata",
      "df -h /data",
      "lvs",
    ],
    verify: ["lvs | grep lvdata", "df -h /data"],
    hint: "lvextend increases LV size, resize2fs grows ext filesystem",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Add new disk /dev/sdc to existing volume group and extend logical volume.",
    points: 40,
    cmds: [
      "pvcreate /dev/sdc",
      "vgextend vgdata /dev/sdc",
      "lvextend -L +5G /dev/vgdata/lvdata",
      "resize2fs /dev/vgdata/lvdata",
    ],
    verify: ["vgs vgdata", "pvs | grep sdc", "df -h /data"],
    hint: "vgextend adds PV to VG, then extend LV into new space",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create snapshot of logical volume, mount it, and then remove it.",
    points: 45,
    cmds: [
      "lvcreate -L 1G -s -n lvdata_snap /dev/vgdata/lvdata",
      "mkdir -p /snapshot",
      "mount /dev/vgdata/lvdata_snap /snapshot",
      "ls /snapshot",
      "umount /snapshot",
      "lvremove /dev/vgdata/lvdata_snap",
    ],
    verify: ["lvs | grep snap", "ls /snapshot"],
    hint: "lvcreate -s creates snapshot, needs space in VG for changes",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Reduce logical volume size (shrink).",
    points: 50,
    cmds: [
      "umount /data",
      "e2fsck -f /dev/vgdata/lvdata",
      "resize2fs /dev/vgdata/lvdata 4G",
      "lvreduce -L 4G /dev/vgdata/lvdata",
      "mount /dev/vgdata/lvdata /data",
    ],
    verify: ["lvs | grep lvdata", "df -h /data"],
    hint: "Shrink filesystem BEFORE reducing LV, unmount first",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Move physical volume data to another disk.",
    points: 50,
    cmds: [
      "pvmove /dev/sdb /dev/sdc",
      "vgreduce vgdata /dev/sdb",
      "pvremove /dev/sdb",
      "pvs",
    ],
    verify: ["pvs | grep -E 'sdb|sdc'", "vgs vgdata"],
    hint: "pvmove migrates data between PVs, vgreduce removes empty PV",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create striped logical volume for performance.",
    points: 45,
    cmds: [
      "lvcreate -L 10G -i 2 -I 64 -n lvstriped vgdata",
      "mkfs.xfs /dev/vgdata/lvstriped",
      "mount /dev/vgdata/lvstriped /striped",
    ],
    verify: ["lvs -o +stripes,stripe_size", "df -h /striped"],
    hint: "-i stripes across PVs, -I stripe size in KB",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create mirrored logical volume.",
    points: 50,
    cmds: [
      "lvcreate -L 5G -m1 -n lvmirror vgdata",
      "mkfs.ext4 /dev/vgdata/lvmirror",
      "mount /dev/vgdata/lvmirror /mirror",
    ],
    verify: ["lvs -o +mirror_log", "df -h /mirror"],
    hint: "-m1 creates 1 mirror copy (RAID 1 equivalent)",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create thin-provisioned logical volume.",
    points: 55,
    cmds: [
      "lvcreate -L 100G -T vgdata/thinpool",
      "lvcreate -V 20G -T vgdata/thinpool -n thinvol",
      "mkfs.ext4 /dev/vgdata/thinvol",
      "mount /dev/vgdata/thinvol /thin",
    ],
    verify: ["lvs | grep -E 'thinpool|thinvol'", "df -h /thin"],
    hint: "-T creates thin pool, -V creates thin volume from pool",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Extend thin pool.",
    points: 55,
    cmds: ["lvextend -L +50G vgdata/thinpool", "lvs vgdata/thinpool"],
    verify: ["lvs vgdata/thinpool"],
    hint: "Extend thin pool to provide more space for thin volumes",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create cached logical volume.",
    points: 60,
    cmds: [
      "lvcreate -L 100G -n lvdata vgdata",
      "lvcreate -L 10G -n lvcache vgdata",
      "lvconvert --type cache --cachepool vgdata/lvcache vgdata/lvdata",
      "lvs -o +cache_policy,cache_mode",
    ],
    verify: ["lvs | grep cache", "lvs -a"],
    hint: "LV cache uses fast disk (SSD) to cache slow disk (HDD)",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Remove disk from volume group safely.",
    points: 45,
    cmds: [
      "pvmove /dev/sdb",
      "vgreduce vgdata /dev/sdb",
      "pvremove /dev/sdb",
      "vgs vgdata",
    ],
    verify: ["pvs | grep sdb", "vgs vgdata"],
    hint: "pvmove empties disk before removal",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Split mirror logical volume.",
    points: 55,
    cmds: [
      "lvconvert --splitmirrors 1 --name lvsplit vgdata/lvmirror",
      "lvdisplay /dev/vgdata/lvsplit",
      "mount /dev/vgdata/lvsplit /split",
    ],
    verify: ["lvs | grep -E 'lvmirror|lvsplit'", "df -h /split"],
    hint: "Split mirror creates separate LV from mirror copy",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Merge snapshot into original.",
    points: 55,
    cmds: [
      "lvconvert --merge vgdata/lvdata_snap",
      "mount /dev/vgdata/lvdata /data",
    ],
    verify: ["lvs | grep snap", "df -h /data"],
    hint: "Merge applies snapshot changes back to original",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create RAID 5 logical volume.",
    points: 60,
    cmds: [
      "lvcreate --type raid5 -L 20G -n lvraid5 vgdata",
      "mkfs.xfs /dev/vgdata/lvraid5",
      "mount /dev/vgdata/lvraid5 /raid5",
    ],
    verify: ["lvs -o +raid_sync_action,raid_mismatch_count", "df -h /raid5"],
    hint: "--type raid5 creates RAID 5 LV",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create RAID 6 logical volume.",
    points: 60,
    cmds: [
      "lvcreate --type raid6 -L 30G -n lvraid6 vgdata",
      "mkfs.xfs /dev/vgdata/lvraid6",
      "mount /dev/vgdata/lvraid6 /raid6",
    ],
    verify: ["lvs -o +raid_sync_action", "df -h /raid6"],
    hint: "RAID 6 needs at least 4 disks, survives 2 failures",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create RAID 10 logical volume.",
    points: 60,
    cmds: [
      "lvcreate --type raid10 -L 20G -n lvraid10 vgdata",
      "mkfs.xfs /dev/vgdata/lvraid10",
      "mount /dev/vgdata/lvraid10 /raid10",
    ],
    verify: ["lvs -o +raid_sync_action", "df -h /raid10"],
    hint: "RAID 10 is mirror of stripes",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Monitor LVM RAID sync progress.",
    points: 50,
    cmds: [
      "lvs -o +raid_sync_action,sync_percent",
      "watch -n 1 'lvs -o +sync_percent'",
      "lvchange --syncaction check vgdata/lvraid5",
    ],
    verify: ["lvs -o sync_percent | grep -v 0.00"],
    hint: "sync_percent shows RAID rebuild/sync progress",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Replace failed disk in LVM RAID.",
    points: 65,
    cmds: [
      "lvconvert --repair vgdata/lvraid5",
      "vgreduce --removemissing vgdata",
      "pvcreate /dev/sde",
      "vgextend vgdata /dev/sde",
      "lvconvert --repair vgdata/lvraid5",
    ],
    verify: ["lvs -o +raid_sync_action", "pvs | grep -E 'sde|missing'"],
    hint: "--repair replaces failed devices in RAID",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create writeback cached logical volume.",
    points: 60,
    cmds: [
      "lvcreate -L 100G -n lvdata vgdata",
      "lvcreate -L 10G -n lvcache vgdata",
      "lvconvert --type cache --cachepool vgdata/lvcache --cachemode writeback vgdata/lvdata",
      "lvs -o +cache_mode",
    ],
    verify: ["lvs | grep writeback", "lvs -a | grep cache"],
    hint: "writeback cache is faster but risks data loss on power failure",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create LVM with specific extent size.",
    points: 45,
    cmds: [
      "vgcreate -s 8M vgdata /dev/sdb",
      "vgdisplay vgdata | grep 'PE Size'",
      "lvcreate -l 100 -n lvdata vgdata",
    ],
    verify: ["vgdisplay vgdata | grep -E 'PE Size|Total PE'"],
    hint: "-s sets physical extent size (default 4MB)",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Export and import volume group.",
    points: 50,
    cmds: [
      "umount /data",
      "vgchange -an vgdata",
      "vgexport vgdata",
      "# Move disks to new system",
      "vgimport vgdata",
      "vgchange -ay vgdata",
      "mount /dev/vgdata/lvdata /data",
    ],
    verify: ["vgs vgdata", "df -h /data"],
    hint: "vgchange -an deactivates, -ay activates VG",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Backup and restore LVM metadata.",
    points: 50,
    cmds: [
      "vgcfgbackup vgdata",
      "cat /etc/lvm/backup/vgdata",
      "vgcfgrestore vgdata",
      "vgdisplay vgdata",
    ],
    verify: ["ls /etc/lvm/backup/", "vgdisplay vgdata"],
    hint: "vgcfgbackup saves metadata, vgcfgrestore recovers it",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Create LVM with encryption.",
    points: 65,
    cmds: [
      "lvcreate -L 10G -n lvcrypt vgdata",
      "cryptsetup luksFormat /dev/vgdata/lvcrypt",
      "cryptsetup open /dev/vgdata/lvcrypt cryptlv",
      "mkfs.ext4 /dev/mapper/cryptlv",
      "mount /dev/mapper/cryptlv /crypt",
    ],
    verify: ["lvs vgdata/lvcrypt", "cryptsetup status cryptlv"],
    hint: "LUKS encryption on top of LVM",
    category: "storage-lvm",
    difficulty: "hard",
  },
  {
    desc: "Monitor LVM with lvmstat.",
    points: 45,
    cmds: [
      "lvmstat --enable vgdata",
      "lvmstat vgdata",
      "lvmstat --noheadings -a -o +vg_reads,vg_writes",
    ],
    verify: ["lvmstat vgdata", "lvs -o +lv_reads,lv_writes"],
    hint: "lvmstat shows I/O statistics for LVM",
    category: "storage-lvm",
    difficulty: "hard",
  },

  // ========== 19. NAS (25 questions) ==========
  {
    desc: "Mount NFS share server:/share on /mnt/nfs with hard mount and intr option.",
    points: 25,
    cmds: [
      "mkdir -p /mnt/nfs",
      "mount -t nfs -o hard,intr server:/share /mnt/nfs",
      "mount | grep nfs",
      "df -h /mnt/nfs",
    ],
    verify: ["mount | grep nfs", "df -h /mnt/nfs"],
    hint: "hard mount retries indefinitely, intr allows interrupt",
    category: "nas",
    difficulty: "medium",
  },
  {
    desc: "Configure NFS server: export /shared to 192.168.1.0/24 with rw,sync.",
    points: 35,
    cmds: [
      "mkdir -p /shared",
      "echo '/shared 192.168.1.0/24(rw,sync,no_root_squash)' >> /etc/exports",
      "exportfs -rav",
      "systemctl enable --now nfs-server",
      "showmount -e localhost",
    ],
    verify: [
      "cat /etc/exports",
      "showmount -e localhost",
      "systemctl status nfs-server",
    ],
    hint: "exportfs -rav re-exports all, showmount -e shows exports",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount NFSv4 with specific version.",
    points: 30,
    cmds: [
      "mount -t nfs4 -o vers=4.2 server:/share /mnt/nfs",
      "mount | grep nfs4",
      "nfsstat -m",
    ],
    verify: ["mount | grep nfs4", "nfsstat -m | head -10"],
    hint: "vers=4.2 uses NFS version 4.2 features",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure NFS client with soft mount and timeout.",
    points: 30,
    cmds: [
      "echo 'server:/share /mnt/nfs nfs soft,timeo=100,retrans=3 0 0' >> /etc/fstab",
      "mount -a",
      "mount | grep nfs",
    ],
    verify: ["cat /etc/fstab | grep nfs", "mount | grep soft"],
    hint: "soft mount fails after retries, timeo in tenths of seconds",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount CIFS/Samba share.",
    points: 30,
    cmds: [
      "mkdir -p /mnt/samba",
      "mount -t cifs //server/share /mnt/samba -o username=user,password=pass",
      "mount | grep cifs",
      "smbclient -L server -U user",
    ],
    verify: ["mount | grep cifs", "ls /mnt/samba"],
    hint: "CIFS is Samba protocol for Windows shares",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure autofs for NFS.",
    points: 40,
    cmds: [
      "dnf install -y autofs",
      "echo '/net /etc/auto.net' >> /etc/auto.master",
      "systemctl enable --now autofs",
      "ls /net/server/share",
    ],
    verify: ["ls /net/server", "systemctl status autofs"],
    hint: "autofs mounts NFS on demand when accessed",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount NFS with specific mount options.",
    points: 35,
    cmds: [
      "mount -t nfs -o rsize=32768,wsize=32768,noatime,nodiratime server:/share /mnt/nfs",
      "mount | grep 'rsize'",
      "nfsstat -m",
    ],
    verify: ["mount | grep -E 'rsize|wsize'", "nfsstat -m"],
    hint: "rsize/wsize control read/write buffer sizes for performance",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Secure NFS with Kerberos.",
    points: 50,
    cmds: [
      "echo '/shared *.example.com(sec=krb5p,rw,sync)' >> /etc/exports",
      "exportfs -rav",
      "systemctl restart nfs-server",
    ],
    verify: ["cat /etc/exports", "exportfs -v"],
    hint: "sec=krb5p provides encryption and authentication",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Troubleshoot NFS mount issues.",
    points: 40,
    cmds: [
      "rpcinfo -p server",
      "showmount -e server",
      "nfsstat -c",
      "tail -f /var/log/messages",
    ],
    verify: ["rpcinfo -p localhost", "showmount -e localhost"],
    hint: "rpcinfo checks RPC services, nfsstat shows statistics",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure NFS with ACL support.",
    points: 45,
    cmds: [
      "echo '/shared *(rw,sync,no_subtree_check,acl)' >> /etc/exports",
      "exportfs -rav",
      "mount -o acl server:/share /mnt/nfs",
    ],
    verify: ["cat /etc/exports | grep acl", "mount | grep acl"],
    hint: "acl option enables NFSv4 ACL support",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount NFS with specific port.",
    points: 35,
    cmds: [
      "mount -t nfs -o port=2049,mountport=20048 server:/share /mnt/nfs",
      "rpcinfo -p server | grep -E '(nfs|mountd)'",
    ],
    verify: ["mount | grep port=", "rpcinfo -p localhost"],
    hint: "NFS uses port 2049, mountd uses 20048 by default",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure NFS with root squash.",
    points: 35,
    cmds: [
      "echo '/shared *(rw,sync,root_squash)' >> /etc/exports",
      "exportfs -rav",
      "showmount -e",
    ],
    verify: ["cat /etc/exports | grep root_squash"],
    hint: "root_squash maps root to nobody for security",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount NFS with noexec option.",
    points: 30,
    cmds: [
      "mount -t nfs -o noexec server:/share /mnt/nfs",
      "mount | grep noexec",
      "chmod +x /mnt/nfs/test.sh && /mnt/nfs/test.sh",
    ],
    verify: ["mount | grep noexec"],
    hint: "noexec prevents executing binaries from NFS",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure NFS with async writes.",
    points: 35,
    cmds: [
      "echo '/shared *(rw,async,no_subtree_check)' >> /etc/exports",
      "exportfs -rav",
      "systemctl restart nfs-server",
    ],
    verify: ["cat /etc/exports | grep async"],
    hint: "async improves performance but risks data loss",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount CIFS with domain authentication.",
    points: 40,
    cmds: [
      "mount -t cifs //server/share /mnt/samba -o username=user,domain=DOMAIN,password=pass",
      "mount | grep cifs",
      "smbclient -L server -U DOMAIN\\user",
    ],
    verify: ["mount | grep domain", "ls /mnt/samba"],
    hint: "domain option for Windows domain authentication",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure Samba server share.",
    points: 45,
    cmds: [
      "dnf install -y samba",
      "echo '[myshare]' >> /etc/samba/smb.conf",
      "echo 'path = /samba' >> /etc/samba/smb.conf",
      "echo 'valid users = user1' >> /etc/samba/smb.conf",
      "echo 'writable = yes' >> /etc/samba/smb.conf",
      "systemctl enable --now smb",
    ],
    verify: ["testparm", "smbclient -L localhost -U user1"],
    hint: "testparm validates smb.conf",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount WebDAV share.",
    points: 40,
    cmds: [
      "mkdir -p /mnt/webdav",
      "mount -t davfs https://server/webdav /mnt/webdav",
      "mount | grep davfs",
      "ls /mnt/webdav",
    ],
    verify: ["mount | grep davfs", "df -h /mnt/webdav"],
    hint: "davfs mounts WebDAV (HTTP-based file sharing)",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure NFS with UDP protocol.",
    points: 40,
    cmds: [
      "mount -t nfs -o udp,vers=3 server:/share /mnt/nfs",
      "mount | grep udp",
      "nfsstat -c",
    ],
    verify: ["mount | grep udp", "nfsstat -c | head -5"],
    hint: "UDP can be faster for small files, TCP for large files",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount NFS with lockd for file locking.",
    points: 45,
    cmds: [
      "systemctl start rpc-statd",
      "mount -t nfs -o nolock server:/share /mnt/nfs",
      "mount | grep nolock",
      "rpcinfo -p | grep -E '(lockd|statd)'",
    ],
    verify: ["rpcinfo -p | grep lockd", "mount | grep nolock"],
    hint: "nolock disables file locking (use with caution)",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure NFSv4 with pseudo-filesystem.",
    points: 50,
    cmds: [
      "echo '/shared *(fsid=0,rw,sync,no_subtree_check)' >> /etc/exports",
      "echo '/shared/data *(rw,sync,no_subtree_check,nohide)' >> /etc/exports",
      "exportfs -rav",
      "mount -t nfs4 server:/ /mnt/nfs4",
    ],
    verify: ["cat /etc/exports", "mount | grep nfs4"],
    hint: "NFSv4 uses pseudo-filesystem for all exports",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount NFS with background mounting.",
    points: 35,
    cmds: [
      "mount -t nfs -o bg server:/share /mnt/nfs",
      "mount | grep bg",
      "cat /proc/mounts | grep nfs",
    ],
    verify: ["mount | grep bg", "df -h /mnt/nfs"],
    hint: "bg continues trying in background if mount fails",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure NFS with ACL inheritance.",
    points: 50,
    cmds: [
      "nfs4_setfacl -a A::user@domain:rwxtnc /shared/file",
      "nfs4_getfacl /shared/file",
      "echo '/shared *(rw,sync,acl,noacl,nfs4)' >> /etc/exports",
    ],
    verify: ["nfs4_getfacl /shared/file", "cat /etc/exports | grep nfs4"],
    hint: "nfs4 ACLs are more powerful than POSIX ACLs",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount NFS with specific uid/gid mapping.",
    points: 40,
    cmds: [
      "mount -t nfs -o uid=1000,gid=1000 server:/share /mnt/nfs",
      "mount | grep -E 'uid|gid'",
      "ls -n /mnt/nfs",
    ],
    verify: ["mount | grep -E 'uid=1000|gid=1000'", "ls -n /mnt/nfs/file"],
    hint: "uid/gid options map remote users to local IDs",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Configure NFS with mount namespace.",
    points: 55,
    cmds: [
      "unshare -m",
      "mount --make-private /",
      "mount -t nfs server:/share /mnt/nfs",
      "cat /proc/self/mountinfo | grep nfs",
    ],
    verify: ["cat /proc/self/mountinfo | grep nfs"],
    hint: "mount namespaces isolate mount points per process",
    category: "nas",
    difficulty: "hard",
  },
  {
    desc: "Mount NFS with quota support.",
    points: 50,
    cmds: [
      "mount -t nfs -o rquota server:/share /mnt/nfs",
      "quota -u user",
      "repquota -a",
    ],
    verify: ["mount | grep rquota", "quota -u user 2>/dev/null"],
    hint: "rquota enables remote quota checking",
    category: "nas",
    difficulty: "hard",
  },

  // ========== 20. BOOT PROCESS (25 questions) ==========
  {
    desc: "Change default boot target to multi-user (no GUI) and verify.",
    points: 20,
    cmds: [
      "systemctl get-default",
      "systemctl set-default multi-user.target",
      "systemctl get-default",
      "systemctl list-units --type=target",
    ],
    verify: ["systemctl get-default", "systemctl is-active multi-user.target"],
    hint: "multi-user.target = text mode, graphical.target = GUI mode",
    category: "boot",
    difficulty: "medium",
  },
  {
    desc: "Reboot into specific kernel version from GRUB.",
    points: 30,
    cmds: [
      "grub2-editenv list",
      "grub2-reboot 'Red Hat Enterprise Linux (3.10.0-957.el7.x86_64) 7.6 (Maipo)'",
      "reboot",
    ],
    verify: ["uname -r", "grub2-editenv list"],
    hint: "grub2-reboot sets one-time boot entry",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Set kernel boot parameters temporarily and permanently.",
    points: 35,
    cmds: [
      'grubby --update-kernel=ALL --args="console=ttyS0"',
      "cat /proc/cmdline",
      "grubby --info=ALL",
    ],
    verify: ["cat /proc/cmdline", "grubby --info=DEFAULT"],
    hint: "grubby manages kernel command line parameters",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Reset root password using init=/bin/bash boot method.",
    points: 40,
    cmds: [
      "# Reboot and edit kernel line: add init=/bin/bash",
      "mount -o remount,rw /",
      "passwd root",
      "touch /.autorelabel",
      "exec /sbin/init",
    ],
    verify: ["# After reboot: login as root with new password"],
    hint: "init=/bin/bash gives root shell before services start",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Create emergency boot media.",
    points: 35,
    cmds: [
      'mkisofs -o /tmp/rescue.iso -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -R -J -V "RESCUE" /mnt/cdrom',
      "isohybrid /tmp/rescue.iso",
      "dd if=/tmp/rescue.iso of=/dev/sdb bs=4M",
    ],
    verify: ["file /tmp/rescue.iso", "lsblk /dev/sdb"],
    hint: "Emergency media boots system when disk fails",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Repair GRUB bootloader.",
    points: 45,
    cmds: [
      "grub2-install /dev/sda",
      "grub2-mkconfig -o /boot/grub2/grub.cfg",
      "efibootmgr -v",
    ],
    verify: ["ls -l /boot/grub2/grub.cfg", "efibootmgr | grep -i grub"],
    hint: "grub2-install writes bootloader, grub2-mkconfig creates config",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure serial console for boot.",
    points: 40,
    cmds: [
      'grubby --update-kernel=ALL --args="console=ttyS0,115200n8"',
      "systemctl enable serial-getty@ttyS0.service",
      "systemctl start serial-getty@ttyS0.service",
    ],
    verify: [
      "cat /proc/cmdline | grep console",
      "systemctl status serial-getty@ttyS0",
    ],
    hint: "Serial console useful for headless servers",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Analyze systemd boot performance.",
    points: 35,
    cmds: [
      "systemd-analyze",
      "systemd-analyze blame",
      "systemd-analyze critical-chain",
      "systemd-analyze plot > boot.svg",
    ],
    verify: ["systemd-analyze", "systemd-analyze blame | head -10"],
    hint: "systemd-analyze shows boot time breakdown",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure kernel module to load at boot.",
    points: 30,
    cmds: [
      "echo 'modulename' >> /etc/modules-load.d/mymodule.conf",
      "modprobe modulename",
      "lsmod | grep modulename",
    ],
    verify: [
      "cat /etc/modules-load.d/mymodule.conf",
      "lsmod | grep modulename",
    ],
    hint: "/etc/modules-load.d/ loads modules at boot",
    category: "boot",
    difficulty: "medium",
  },
  {
    desc: "Blacklist kernel module.",
    points: 30,
    cmds: [
      "echo 'blacklist modulename' >> /etc/modprobe.d/blacklist.conf",
      "rmmod modulename",
      "modprobe -r modulename",
    ],
    verify: [
      "cat /etc/modprobe.d/blacklist.conf",
      "lsmod | grep modulename || echo 'blacklisted'",
    ],
    hint: "Blacklist prevents module from loading",
    category: "boot",
    difficulty: "medium",
  },
  {
    desc: "Create initrd/initramfs image.",
    points: 40,
    cmds: [
      "dracut --force /boot/initramfs-$(uname -r).img $(uname -r)",
      "ls -lh /boot/initramfs*",
      "mkinitrd --force /boot/initramfs-$(uname -r).img $(uname -r)",
    ],
    verify: ["ls -lh /boot/initramfs*", "dracut --list-modules $(uname -r)"],
    hint: "initrd contains modules needed for early boot",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Extract and examine initramfs.",
    points: 45,
    cmds: [
      "mkdir /tmp/initrd",
      "cd /tmp/initrd",
      "zcat /boot/initramfs-$(uname -r).img | cpio -id",
      "ls -la",
    ],
    verify: ["ls /tmp/initrd/", "file /boot/initramfs*"],
    hint: "initramfs is cpio archive compressed with gzip",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure UEFI Secure Boot.",
    points: 50,
    cmds: [
      "mokutil --sb-state",
      "mokutil --import MOK.der",
      "mokutil --list-enrolled",
      "efibootmgr -v",
    ],
    verify: ["mokutil --sb-state", "efibootmgr | grep -i secure"],
    hint: "MOK = Machine Owner Key for Secure Boot",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Set up PXE boot server.",
    points: 55,
    cmds: [
      "dnf install -y tftp-server dhcp-server syslinux",
      "cp /usr/share/syslinux/pxelinux.0 /var/lib/tftpboot/",
      "systemctl enable --now tftp dhcpd",
    ],
    verify: ["systemctl status tftp", "systemctl status dhcpd"],
    hint: "PXE boots systems over network",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure kdump for kernel crash dumps.",
    points: 45,
    cmds: [
      "dnf install -y kexec-tools",
      "systemctl enable --now kdump",
      "kdumpctl showmem",
      "cat /proc/cmdline | grep crashkernel",
    ],
    verify: ["systemctl status kdump", "kdumpctl status"],
    hint: "kdump captures kernel memory on crash",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Analyze kernel crash dump.",
    points: 50,
    cmds: [
      "crash /usr/lib/debug/lib/modules/$(uname -r)/vmlinux /var/crash/127.0.0.1-2023-01-01-10:00:00/vmcore",
      "# In crash: bt, ps, log, quit",
    ],
    verify: ["ls /var/crash/", "which crash"],
    hint: "crash analyzes kernel core dumps",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure GRUB password.",
    points: 40,
    cmds: [
      "grub2-mkpasswd-pbkdf2",
      "echo 'set superusers=\"root\"' >> /etc/grub.d/40_custom",
      "echo 'password_pbkdf2 root <hashed-password>' >> /etc/grub.d/40_custom",
      "grub2-mkconfig -o /boot/grub2/grub.cfg",
    ],
    verify: [
      "cat /etc/grub.d/40_custom",
      "grep -i password /boot/grub2/grub.cfg",
    ],
    hint: "GRUB password prevents unauthorized boot changes",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Set up boot from USB drive.",
    points: 45,
    cmds: [
      "dd if=/path/to/os.iso of=/dev/sdb bs=4M",
      "parted /dev/sdb print",
      "efibootmgr -c -d /dev/sdb -p 1 -L \"USB Boot\" -l '\\EFI\\BOOT\\BOOTX64.EFI'",
    ],
    verify: ["lsblk /dev/sdb", "efibootmgr | grep USB"],
    hint: "USB boot useful for recovery or installation",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure network boot with iPXE.",
    points: 55,
    cmds: [
      "dnf install -y ipxe-bootimgs",
      "cp /usr/share/ipxe/ipxe.efi /var/lib/tftpboot/",
      "echo '#!ipxe' > /var/lib/tftpboot/menu.ipxe",
      "echo 'chain http://boot.server/menu' >> /var/lib/tftpboot/menu.ipxe",
    ],
    verify: ["ls /var/lib/tftpboot/", "file /var/lib/tftpboot/ipxe.efi"],
    hint: "iPXE is enhanced PXE with HTTP, iSCSI support",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Set up boot from iSCSI.",
    points: 60,
    cmds: [
      "dnf install -y iscsi-initiator-utils",
      "iscsiadm -m discovery -t st -p iscsi.server",
      "iscsiadm -m node -T iqn.target -p iscsi.server -l",
      "echo 'root=/dev/sda1 netroot=iscsi:iscsi.server::3260:1:iqn.target' >> /etc/default/grub",
    ],
    verify: ["iscsiadm -m session", "lsblk | grep -i iscsi"],
    hint: "iSCSI boot loads kernel from network storage",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure early boot with dracut.",
    points: 50,
    cmds: [
      "echo 'add_drivers+=\"mydriver\"' > /etc/dracut.conf.d/mydriver.conf",
      "dracut --force --add-drivers mydriver",
      "lsinitrd /boot/initramfs-$(uname -r).img | grep mydriver",
    ],
    verify: [
      "cat /etc/dracut.conf.d/mydriver.conf",
      "lsinitrd | grep mydriver",
    ],
    hint: "dracut builds initramfs with custom drivers",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Set up boot from NVDIMM (persistent memory).",
    points: 60,
    cmds: [
      "ndctl list",
      "ndctl create-namespace -m fsdax -e namespace0.0",
      "mkfs.ext4 /dev/pmem0",
      "echo '/dev/pmem0 /mnt/pmem ext4 dax 0 0' >> /etc/fstab",
    ],
    verify: ["ndctl list", "mount | grep pmem", "df -h /mnt/pmem"],
    hint: "NVDIMM is persistent memory (like fast storage)",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure boot with TPM (Trusted Platform Module).",
    points: 65,
    cmds: [
      "tpm2_pcrread",
      "systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=7 /dev/sda2",
      "echo 'rd.luks.options=tpm2-device=auto' >> /etc/default/grub",
    ],
    verify: [
      "tpm2_getcap properties-fixed",
      "systemd-cryptenroll --tpm2-device=list",
    ],
    hint: "TPM stores encryption keys securely",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Set up boot from ZFS.",
    points: 65,
    cmds: [
      "dnf install -y zfs",
      "zpool import tank",
      "zfs set mountpoint=/ tank/root",
      "grub2-install --boot-directory=/boot /dev/sda",
    ],
    verify: ["zpool status", "mount | grep zfs", "df -h /"],
    hint: "ZFS boot requires special GRUB support",
    category: "boot",
    difficulty: "hard",
  },
  {
    desc: "Configure boot with systemd-boot.",
    points: 55,
    cmds: [
      "bootctl install",
      "bootctl status",
      "echo 'title RHEL' > /boot/loader/entries/rhel.conf",
      "echo 'linux /vmlinuz-$(uname -r)' >> /boot/loader/entries/rhel.conf",
    ],
    verify: ["bootctl status", "ls /boot/loader/entries/"],
    hint: "systemd-boot is UEFI boot manager (alternative to GRUB)",
    category: "boot",
    difficulty: "hard",
  },

  // ========== 21. FIREWALL (25 questions) ==========
  {
    desc: "Check firewalld status, list all zones, and see default zone.",
    points: 15,
    cmds: [
      "systemctl status firewalld",
      "firewall-cmd --state",
      "firewall-cmd --get-default-zone",
      "firewall-cmd --list-all-zones",
    ],
    verify: ["firewall-cmd --state", "firewall-cmd --get-default-zone"],
    hint: "firewalld is default firewall manager in RHEL 7+",
    category: "firewall",
    difficulty: "easy",
  },
  {
    desc: "Allow HTTP service in default zone permanently and reload.",
    points: 20,
    cmds: [
      "firewall-cmd --add-service=http",
      "firewall-cmd --add-service=http --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --list-services",
    ],
    verify: [
      "firewall-cmd --list-services | grep http",
      "firewall-cmd --list-services --permanent | grep http",
    ],
    hint: "--permanent makes changes survive reboot, --reload applies permanent rules",
    category: "firewall",
    difficulty: "medium",
  },
  {
    desc: "Open port 8080/tcp in public zone permanently.",
    points: 20,
    cmds: [
      "firewall-cmd --zone=public --add-port=8080/tcp",
      "firewall-cmd --zone=public --add-port=8080/tcp --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --zone=public --list-ports",
    ],
    verify: [
      "firewall-cmd --zone=public --list-ports | grep 8080",
      "firewall-cmd --zone=public --list-ports --permanent | grep 8080",
    ],
    hint: "Zones define trust levels (public, internal, dmz, etc.)",
    category: "firewall",
    difficulty: "medium",
  },
  {
    desc: "Block specific IP address 192.168.1.100 in default zone.",
    points: 25,
    cmds: [
      'firewall-cmd --add-rich-rule=\'rule family="ipv4" source address="192.168.1.100" reject\'',
      'firewall-cmd --add-rich-rule=\'rule family="ipv4" source address="192.168.1.100" reject\' --permanent',
      "firewall-cmd --reload",
    ],
    verify: [
      "firewall-cmd --list-rich-rules",
      "firewall-cmd --list-rich-rules --permanent",
    ],
    hint: "Rich rules allow complex firewall rules",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Create custom service definition for myapp on port 9999/tcp.",
    points: 30,
    cmds: [
      'cat > /etc/firewalld/services/myapp.xml << \'EOF\'\n<?xml version="1.0" encoding="utf-8"?>\n<service>\n  <short>My Application</short>\n  <description>My custom application service</description>\n  <port protocol="tcp" port="9999"/>\n</service>\nEOF',
      "firewall-cmd --reload",
      "firewall-cmd --add-service=myapp --permanent",
      "firewall-cmd --reload",
    ],
    verify: [
      "firewall-cmd --get-services | grep myapp",
      "cat /etc/firewalld/services/myapp.xml",
    ],
    hint: "Custom service files in /etc/firewalld/services/",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure masquerading (NAT) for internal zone.",
    points: 35,
    cmds: [
      "firewall-cmd --zone=internal --add-masquerade",
      "firewall-cmd --zone=internal --add-masquerade --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --zone=internal --list-all",
    ],
    verify: ["firewall-cmd --zone=internal --list-all | grep masquerade"],
    hint: "Masquerading allows internal hosts to access external networks (NAT)",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Forward port 80 to internal server 192.168.1.10:8080.",
    points: 40,
    cmds: [
      "firewall-cmd --add-forward-port=port=80:proto=tcp:toport=8080:toaddr=192.168.1.10",
      "firewall-cmd --add-forward-port=port=80:proto=tcp:toport=8080:toaddr=192.168.1.10 --permanent",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-forward-ports", "firewall-cmd --list-all"],
    hint: "Port forwarding redirects traffic to different host/port",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Create custom zone for DMZ.",
    points: 35,
    cmds: [
      "firewall-cmd --new-zone=dmz --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --zone=dmz --add-service=http",
      "firewall-cmd --zone=dmz --add-service=https --permanent",
      "firewall-cmd --reload",
    ],
    verify: [
      "firewall-cmd --get-zones | grep dmz",
      "firewall-cmd --zone=dmz --list-all",
    ],
    hint: "DMZ zone for semi-trusted services exposed to internet",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Assign network interface to specific zone.",
    points: 30,
    cmds: [
      "firewall-cmd --zone=internal --change-interface=eth1",
      "firewall-cmd --zone=internal --change-interface=eth1 --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --get-zone-of-interface=eth1",
    ],
    verify: [
      "firewall-cmd --get-zone-of-interface=eth1",
      "firewall-cmd --get-active-zones",
    ],
    hint: "Interfaces can be assigned to different zones",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure source-based zone assignment.",
    points: 40,
    cmds: [
      "firewall-cmd --zone=trusted --add-source=192.168.2.0/24",
      "firewall-cmd --zone=trusted --add-source=192.168.2.0/24 --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --get-active-zones",
    ],
    verify: [
      "firewall-cmd --zone=trusted --list-sources",
      "firewall-cmd --get-active-zones",
    ],
    hint: "Source-based routing assigns zones by source IP",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Set default zone to drop (block all).",
    points: 25,
    cmds: [
      "firewall-cmd --set-default-zone=drop",
      "firewall-cmd --set-default-zone=drop --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --get-default-zone",
    ],
    verify: [
      "firewall-cmd --get-default-zone",
      "firewall-cmd --zone=drop --list-all",
    ],
    hint: "Drop zone silently discards packets (no reject response)",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure logging for denied packets.",
    points: 35,
    cmds: [
      "firewall-cmd --set-log-denied=all",
      "firewall-cmd --set-log-denied=all --permanent",
      "firewall-cmd --reload",
      "tail -f /var/log/firewalld",
    ],
    verify: ["firewall-cmd --get-log-denied", "ls /var/log/firewalld/"],
    hint: "Logging helps troubleshoot firewall issues",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Create direct rule (bypass firewalld).",
    points: 45,
    cmds: [
      "firewall-cmd --direct --add-rule ipv4 filter INPUT 0 -p tcp --dport 2222 -j ACCEPT",
      "firewall-cmd --direct --add-rule ipv4 filter INPUT 0 -p tcp --dport 2222 -j ACCEPT --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --direct --get-all-rules",
    ],
    verify: [
      "firewall-cmd --direct --get-all-rules",
      "iptables -L INPUT -n | grep 2222",
    ],
    hint: "Direct rules pass commands directly to iptables/ebtables",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure ICMP blocking.",
    points: 30,
    cmds: [
      "firewall-cmd --add-icmp-block=echo-request",
      "firewall-cmd --add-icmp-block=echo-request --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --list-icmp-blocks",
    ],
    verify: ["firewall-cmd --list-icmp-blocks", "ping -c 1 localhost"],
    hint: "Blocking echo-request prevents ping responses",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Set up port range forwarding.",
    points: 45,
    cmds: [
      "firewall-cmd --add-forward-port=port=1000-2000:proto=tcp:toport=3000-4000",
      "firewall-cmd --add-forward-port=port=1000-2000:proto=tcp:toport=3000-4000 --permanent",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-forward-ports", "firewall-cmd --list-all"],
    hint: "Port ranges use start-end syntax",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure IP set (group of IPs).",
    points: 50,
    cmds: [
      "firewall-cmd --new-ipset=blocklist --type=hash:ip --permanent",
      "firewall-cmd --ipset=blocklist --add-entry=10.0.0.1 --permanent",
      "firewall-cmd --reload",
      "firewall-cmd --add-rich-rule='rule source ipset=blocklist drop' --permanent",
      "firewall-cmd --reload",
    ],
    verify: [
      "firewall-cmd --get-ipsets",
      "firewall-cmd --info-ipset=blocklist",
    ],
    hint: "IP sets efficiently match groups of IPs",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Set up panic mode (block all traffic).",
    points: 30,
    cmds: [
      "firewall-cmd --panic-on",
      "firewall-cmd --panic-off",
      "firewall-cmd --query-panic",
    ],
    verify: ["firewall-cmd --query-panic", "ping -c 1 8.8.8.8"],
    hint: "Panic mode immediately blocks all traffic",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure firewall lockdown (restrict management).",
    points: 40,
    cmds: [
      "firewall-cmd --lockdown-on",
      "firewall-cmd --lockdown-off",
      "firewall-cmd --query-lockdown",
    ],
    verify: ["firewall-cmd --query-lockdown", "firewall-cmd --list-all"],
    hint: "Lockdown prevents firewall changes even by root",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Create time-based firewall rule.",
    points: 55,
    cmds: [
      'firewall-cmd --add-rich-rule=\'rule family="ipv4" source address="192.168.1.0/24" service name="ssh" reject\' --timeout=300',
      "# Rule will be removed after 5 minutes",
    ],
    verify: [
      "firewall-cmd --list-rich-rules",
      "sleep 310 && firewall-cmd --list-rich-rules | grep ssh",
    ],
    hint: "Timeout removes rule after specified seconds",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure helper modules.",
    points: 45,
    cmds: [
      "firewall-cmd --add-service=ftp",
      "firewall-cmd --add-service=ftp --permanent",
      "firewall-cmd --add-masquerade",
      "firewall-cmd --reload",
    ],
    verify: [
      "firewall-cmd --list-services | grep ftp",
      "firewall-cmd --list-all | grep masquerade",
    ],
    hint: "FTP helper handles FTP connection tracking",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Set up firewall for Docker containers.",
    points: 50,
    cmds: [
      "firewall-cmd --permanent --zone=trusted --add-interface=docker0",
      "firewall-cmd --permanent --zone=trusted --add-source=172.17.0.0/16",
      "firewall-cmd --reload",
      "firewall-cmd --zone=trusted --list-all",
    ],
    verify: [
      "firewall-cmd --get-zone-of-interface=docker0",
      "firewall-cmd --zone=trusted --list-sources",
    ],
    hint: "Docker uses docker0 bridge with 172.17.0.0/16 by default",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure firewall for OpenVPN.",
    points: 50,
    cmds: [
      "firewall-cmd --add-service=openvpn",
      "firewall-cmd --add-masquerade",
      "firewall-cmd --add-port=1194/udp",
      'firewall-cmd --add-rich-rule=\'rule family="ipv4" source address="10.8.0.0/24" masquerade\' --permanent',
      "firewall-cmd --reload",
    ],
    verify: [
      "firewall-cmd --list-services | grep openvpn",
      "firewall-cmd --list-ports | grep 1194",
    ],
    hint: "OpenVPN typically uses 10.8.0.0/24 for clients",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Set up port knocking.",
    points: 60,
    cmds: [
      'firewall-cmd --add-rich-rule=\'rule family="ipv4" source address="192.168.1.100" port port="1234" protocol="tcp" reject\'',
      'firewall-cmd --add-rich-rule=\'rule family="ipv4" source address="192.168.1.100" port port="5678" protocol="tcp" reject\'',
      "# Use knockd for sequence-based port knocking",
    ],
    verify: ["firewall-cmd --list-rich-rules | grep -E '1234|5678'"],
    hint: "Port knocking requires specific port sequence to open access",
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Configure rate limiting.",
    points: 55,
    cmds: [
      'firewall-cmd --add-rich-rule=\'rule family="ipv4" source address="192.168.1.0/24" service name="ssh" accept\'',
      'firewall-cmd --add-rich-rule=\'rule family="ipv4" source NOT address="192.168.1.0/24" service name="ssh" accept limit value="5/m"\'',
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-rich-rules | grep limit"],
    hint: 'limit value="5/m" allows 5 connections per minute',
    category: "firewall",
    difficulty: "hard",
  },
  {
    desc: "Set up geo-blocking.",
    points: 60,
    cmds: [
      "firewall-cmd --new-ipset=china --type=hash:net --option=family=inet --option=hashsize=4096 --option=maxelem=100000",
      "# Add Chinese IP ranges to ipset",
      "firewall-cmd --add-rich-rule='rule source ipset=china drop' --permanent",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --get-ipsets", "firewall-cmd --info-ipset=china"],
    hint: "Geo-blocking restricts traffic by country",
    category: "firewall",
    difficulty: "hard",
  },

  // ========== 22. CONTAINERS (25 questions) ==========
  {
    desc: "Pull CentOS 8 container image, run it interactively, and execute commands inside.",
    points: 20,
    cmds: [
      "podman pull centos:8",
      "podman run -it --name mycentos centos:8 /bin/bash",
      "# Inside container: cat /etc/redhat-release",
      "podman ps -a",
      "podman rm mycentos",
    ],
    verify: ["podman images | grep centos", "podman ps -a | grep mycentos"],
    hint: "podman run -it runs interactively with terminal",
    category: "containers",
    difficulty: "medium",
  },
  {
    desc: "Create Dockerfile for simple web application and build image.",
    points: 35,
    cmds: [
      'cat > Dockerfile << \'EOF\'\nFROM centos:8\nRUN dnf install -y httpd\nCOPY index.html /var/www/html/\nEXPOSE 80\nCMD ["/usr/sbin/httpd", "-DFOREGROUND"]\nEOF',
      "podman build -t mywebapp .",
      "podman images | grep mywebapp",
    ],
    verify: ["cat Dockerfile", "podman images | grep mywebapp"],
    hint: "Dockerfile instructions: FROM, RUN, COPY, EXPOSE, CMD",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Run container in background, expose port 8080, and map to host port 80.",
    points: 25,
    cmds: [
      "podman run -d --name webserver -p 8080:80 httpd",
      "podman ps",
      "curl http://localhost:8080",
      "podman logs webserver",
    ],
    verify: [
      "podman ps | grep webserver",
      "curl -s http://localhost:8080 | head -5",
      "podman port webserver",
    ],
    hint: "-p host-port:container-port maps ports, -d runs in background",
    category: "containers",
    difficulty: "medium",
  },
  {
    desc: "Mount host directory /data to container /app as volume.",
    points: 30,
    cmds: [
      "podman run -it --name test -v /data:/app centos:8 /bin/bash",
      "# Inside container: touch /app/testfile",
      "ls -l /data/testfile",
      "podman rm test",
    ],
    verify: ["ls -l /data/testfile", "podman ps -a | grep test"],
    hint: "-v host-path:container-path mounts directory",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create pod with multiple containers using Podman pods.",
    points: 40,
    cmds: [
      "podman pod create --name mypod -p 8080:80",
      "podman run -d --pod mypod --name web httpd",
      "podman run -d --pod mypod --name db mariadb",
      "podman pod ps",
      "podman pod inspect mypod",
    ],
    verify: [
      "podman pod ps | grep mypod",
      "podman ps --pod | grep -E 'web|db'",
    ],
    hint: "Pods group containers that share network and storage",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Set container resource limits (CPU, memory).",
    points: 35,
    cmds: [
      "podman run -d --name limited --memory=512m --cpus=1.5 httpd",
      "podman inspect limited | grep -A5 -B5 Memory",
      "podman stats limited",
    ],
    verify: [
      "podman inspect limited | grep -i memory",
      "podman stats --no-stream limited",
    ],
    hint: "--memory limits RAM, --cpus limits CPU cores",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create and use container registry.",
    points: 45,
    cmds: [
      "podman run -d -p 5000:5000 --name registry docker.io/registry:2",
      "podman tag localhost/mywebapp localhost:5000/mywebapp",
      "podman push localhost:5000/mywebapp",
      "podman pull localhost:5000/mywebapp",
    ],
    verify: [
      "curl http://localhost:5000/v2/_catalog",
      "podman images | grep localhost:5000",
    ],
    hint: "Local registry at port 5000 for testing",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use Buildah to build container image.",
    points: 40,
    cmds: [
      "buildah from centos:8",
      "buildah run centos-working-container dnf install -y httpd",
      "buildah config --cmd '/usr/sbin/httpd -DFOREGROUND' centos-working-container",
      "buildah commit centos-working-container myhttpd",
      "buildah images",
    ],
    verify: [
      "buildah images | grep myhttpd",
      "podman run --rm myhttpd httpd -v",
    ],
    hint: "Buildah builds images without daemon",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use Skopeo to inspect remote images.",
    points: 30,
    cmds: [
      "skopeo inspect docker://docker.io/centos:8",
      "skopeo copy docker://docker.io/centos:8 docker-archive:centos8.tar",
      "skopeo list-tags docker://docker.io/centos",
    ],
    verify: [
      "skopeo inspect docker://docker.io/centos:8 | grep Arch",
      "ls -lh centos8.tar",
    ],
    hint: "Skopeo works with container registries",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create systemd service for container.",
    points: 45,
    cmds: [
      "podman generate systemd --name webserver --files",
      "cp container-webserver.service /etc/systemd/system/",
      "systemctl daemon-reload",
      "systemctl enable --now container-webserver.service",
    ],
    verify: [
      "systemctl status container-webserver",
      "podman ps | grep webserver",
    ],
    hint: "podman generate systemd creates service files",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Set up container networking.",
    points: 40,
    cmds: [
      "podman network create mynet",
      "podman run -d --name web1 --network mynet httpd",
      "podman run -it --name web2 --network mynet centos:8 ping web1",
      "podman network inspect mynet",
    ],
    verify: ["podman network ls | grep mynet", "podman exec web1 hostname"],
    hint: "Custom networks allow container name resolution",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use rootless containers.",
    points: 35,
    cmds: [
      "sudo loginctl enable-linger $USER",
      "podman run -d --name rootless httpd",
      "systemctl --user enable --now podman.socket",
      "podman ps",
    ],
    verify: [
      "podman ps | grep rootless",
      "ls -l /run/user/$(id -u)/podman/podman.sock",
    ],
    hint: "Rootless containers run without root privileges",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create container with systemd inside.",
    points: 50,
    cmds: [
      "podman run -d --name systemdctr --systemd=always docker.io/centos/systemd",
      "podman exec systemdctr systemctl status",
      "podman exec systemdctr hostnamectl",
    ],
    verify: [
      "podman exec systemdctr systemctl is-system-running",
      "podman ps | grep systemdctr",
    ],
    hint: "--systemd=always runs systemd as PID 1 in container",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use podman play kube to run Kubernetes YAML.",
    points: 45,
    cmds: [
      "cat > pod.yaml << 'EOF'\napiVersion: v1\nkind: Pod\nmetadata:\n  name: mypod\nspec:\n  containers:\n  - name: web\n    image: httpd\n    ports:\n    - containerPort: 80\nEOF",
      "podman play kube pod.yaml",
      "podman pod ps",
    ],
    verify: ["podman pod ps | grep mypod", "podman ps --pod | grep web"],
    hint: "podman play kube runs Kubernetes pod definitions",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create container with health check.",
    points: 40,
    cmds: [
      'cat > Dockerfile << \'EOF\'\nFROM centos:8\nRUN dnf install -y httpd\nHEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost/ || exit 1\nCMD ["/usr/sbin/httpd", "-DFOREGROUND"]\nEOF',
      "podman build -t healthy .",
      "podman run -d --name healthcheck healthy",
      "podman inspect healthcheck | grep -A10 Healthcheck",
    ],
    verify: [
      "podman inspect healthcheck | grep -i health",
      "podman ps | grep healthy",
    ],
    hint: "Health check monitors container application health",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use container with SELinux labels.",
    points: 45,
    cmds: [
      "podman run -d --name selinuxtest --security-opt label=type:container_t httpd",
      "podman inspect selinuxtest | grep -i selinux",
      "ps auxZ | grep httpd",
    ],
    verify: [
      "podman inspect selinuxtest | grep -i label",
      "ps auxZ | grep container_t",
    ],
    hint: "SELinux provides additional container isolation",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create container with read-only root filesystem.",
    points: 35,
    cmds: [
      "podman run -d --name readonly --read-only httpd",
      "podman exec readonly touch /test 2>&1 | grep -i readonly",
      "podman inspect readonly | grep ReadonlyRootfs",
    ],
    verify: [
      "podman inspect readonly | grep ReadonlyRootfs",
      "podman exec readonly ls /",
    ],
    hint: "--read-only prevents writes to container filesystem",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use container with tmpfs mounts.",
    points: 40,
    cmds: [
      "podman run -it --name tmpfstest --tmpfs /tmp:rw,size=100M centos:8 /bin/bash",
      "# Inside container: df -h /tmp",
      "podman inspect tmpfstest | grep -i tmpfs",
    ],
    verify: [
      "podman inspect tmpfstest | grep -i tmpfs",
      "podman exec tmpfstest mount | grep tmpfs",
    ],
    hint: "--tmpfs mounts tmpfs (RAM disk) in container",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create container with custom capabilities.",
    points: 45,
    cmds: [
      "podman run -d --name caps --cap-add NET_ADMIN --cap-drop ALL centos:8",
      "podman inspect caps | grep -i capabilities",
      "podman exec caps capsh --print",
    ],
    verify: [
      "podman inspect caps | grep -i cap",
      "podman exec caps ip link show 2>&1",
    ],
    hint: "--cap-add adds Linux capabilities, --cap-drop removes",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use container with user namespace mapping.",
    points: 50,
    cmds: [
      "podman run -it --name usermap --user 1000:1000 centos:8 /bin/bash",
      "# Inside container: id",
      "podman inspect usermap | grep -i user",
    ],
    verify: ["podman inspect usermap | grep -i user", "podman exec usermap id"],
    hint: "--user sets UID:GID inside container",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create container with device access.",
    points: 45,
    cmds: [
      "podman run -it --name devicetest --device /dev/ttyUSB0 centos:8 /bin/bash",
      "# Inside container: ls -l /dev/ttyUSB0",
      "podman inspect devicetest | grep -i device",
    ],
    verify: [
      "podman inspect devicetest | grep -i device",
      "podman exec devicetest ls /dev/ttyUSB0",
    ],
    hint: "--device grants access to host devices",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use container with environment variables.",
    points: 35,
    cmds: [
      "podman run -d --name envtest -e MYVAR=value -e DATABASE_URL=postgres://user:pass@host/db httpd",
      "podman exec envtest env | grep MYVAR",
      "podman inspect envtest | grep -i env",
    ],
    verify: [
      "podman inspect envtest | grep -i env",
      "podman exec envtest printenv MYVAR",
    ],
    hint: "-e sets environment variables in container",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create container with log driver.",
    points: 40,
    cmds: [
      "podman run -d --name logtest --log-driver=journald httpd",
      "journalctl -f CONTAINER_NAME=logtest",
      "podman inspect logtest | grep -i log",
    ],
    verify: [
      "podman inspect logtest | grep -i log",
      "journalctl --no-pager CONTAINER_NAME=logtest | head -5",
    ],
    hint: "journald driver sends logs to systemd journal",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Use container with restart policy.",
    points: 40,
    cmds: [
      "podman run -d --name restarttest --restart=always httpd",
      "podman kill restarttest",
      "sleep 2 && podman ps | grep restarttest",
      "podman inspect restarttest | grep -i restart",
    ],
    verify: [
      "podman inspect restarttest | grep -i restart",
      "podman ps | grep restarttest",
    ],
    hint: "--restart=always automatically restarts container",
    category: "containers",
    difficulty: "hard",
  },
  {
    desc: "Create container with resource reservations.",
    points: 45,
    cmds: [
      "podman run -d --name resreserve --memory-reservation=256m --cpu-shares=512 httpd",
      "podman inspect resreserve | grep -i reservation",
      "podman stats resreserve",
    ],
    verify: [
      "podman inspect resreserve | grep -i memoryreservation",
      "podman stats --no-stream resreserve",
    ],
    hint: "Reservations guarantee minimum resources",
    category: "containers",
    difficulty: "hard",
  },
];

// Initialize on page load
window.addEventListener("DOMContentLoaded", function () {
  loadHistory();
  showCheatSheet();
});
