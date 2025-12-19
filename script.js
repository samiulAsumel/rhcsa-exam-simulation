let timerInterval = null;
let timeRemaining = 9000;
let tasks = [];
let examSubmitted = false;
let examHistory = [];
let currentExamNumber = 1;
let selectedCategory = "all";

function setPracticeCategory(cat, btn) {
  selectedCategory = cat;
  document.querySelectorAll(".category-btn").forEach((b) => b.classList.remove("active"));
  if (btn && btn.classList) btn.classList.add("active");
}

// Assign lightweight categories based on keywords
function assignCategoriesToPool() {
  const patterns = [
    ["system-access", /\b(login|su\b|sudo\b|root password|grub|boot|rd\.break|boot process)\b/i],
    ["files-directories", /\b(cp\b|mv\b|rm\b|mkdir\b|rmdir\b|link\b|umask\b|chown\b|chgrp\b|permission|chmod|tar|gzip|bzip|archive|compress|find|grep|sed)\b/i],
    ["users-groups", /\b(useradd\b|usermod\b|userdel\b|groupadd\b|groupdel\b|chage\b|passwd\b|chpasswd\b|id\b|getent\b|umask\b|login.defs)\b/i],
    ["acl", /\b(getfacl\b|setfacl\b|\bacl\b|default acl)\b/i],
    ["selinux", /\b(selinux|semanage\b|restorecon\b|getenforce\b|sestatus\b|setsebool\b|chcon\b|ls -Z)\b/i],
    ["networking", /\b(nmcli\b|hostnamectl\b|ipv4\b|gateway\b|dns\b|ip a\b|ss\b|ping\b|ip addr\b|route\b|mtu\b|mac\b|resolv.conf)\b/i],
    ["firewall", /\b(firewall-cmd\b|firewall\b|rich rule|zones|ports)\b/i],
    ["software-management", /\b(dnf\b|repo\b|yum\b|rpm\b|package\b|repolist\b|install\b|remove\b|update)\b/i],
    ["processes-services", /\b(ps\b|top\b|kill\b|pkill\b|nice\b|renice\b|systemctl\b|service\b|targets\b|enable\b|disable\b|start\b|stop\b|restart\b|mask\b)\b/i],
    ["storage-basic", /\b(pvcreate\b|vgcreate\b|lvcreate\b|lvextend\b|lvreduce\b|mkfs\b|lsblk\b|blkid\b|fstab\b|mount\b|umount\b|df\b|du\b|swap\b|mkswap\b|swapon)\b/i],
    ["lvm", /\b(lvm\b|lvcreate\b|vg\b|pv\b|lvextend\b|lvresize\b|lvreduce\b|lvremove\b|vgremove\b|pvs\b|vgs\b|lvs\b)\b/i],
    ["swap", /\b(swap\b|mkswap\b|swapon\b|swapfile|swapoff)\b/i],
    ["boot-kernel", /\b(boot\b|kernel\b|rescue\b|emergency\b|grub2\b|rd\.break)\b/i],
    ["archive-compression", /\b(tar\b|gzip\b|bzip2\b|xz\b|archive\b|compress\b|extract\b)\b/i],
    ["searching-text", /\b(grep\b|find\b|sort\b|cut\b|awk\b|wc\b|sed\b)\b/i],
    ["bash-shell", /\b(shell\b|bash\b|aliases\b|redirection\b|pipes\b|history\b|2>\b|>>\b)\b/i],
    ["scheduling", /\b(cron\b|at\b|anacron\b|timer\b|crontab\b)\b/i],
    ["logging-time", /\b(journalctl\b|rsyslog\b|timedatectl\b|timezone\b|persistent logs|chrony\b|ntp\b)\b/i],
    ["containers-podman", /\b(podman\b|container\b|images\b|volumes\b|pull\b|run\b|ps\b|stop\b|rm\b|rmi\b)\b/i],
    ["exam-environment", /\b(man pages|tab completion|tmux\b|no internet|time management|audit\b|verify\b|validate\b)\b/i],
  ];

  questionPool.forEach((q) => {
    if (q.category && q.category !== "misc") return;

    const textFields = [
      String(q.desc || ""),
      ...(Array.isArray(q.cmds) ? q.cmds : []),
      ...(Array.isArray(q.verify) ? q.verify : []),
    ]
      .join(" \n ")
      .toLowerCase();

    for (const [cat, rx] of patterns) {
      if (rx.test(textFields)) {
        q.category = cat;
        break;
      }
    }

    if (!q.category) q.category = "misc";
  });
}

// Hide category buttons that have zero tasks assigned
function hideEmptyCategoryButtons() {
  assignCategoriesToPool();

  const counts = {};
  questionPool.forEach((q) => {
    counts[q.category] = (counts[q.category] || 0) + 1;
  });

  document.querySelectorAll(".category-btn").forEach((btn) => {
    const cat = btn.dataset.cat || null;
    if (!cat || cat === "all") {
      btn.style.display = "";
      return;
    }
    const count = counts[cat] || 0;
    btn.style.display = count > 0 ? "" : "none";
  });
}

// Run initial UI cleanup on load
window.addEventListener("DOMContentLoaded", () => {
  try {
    hideEmptyCategoryButtons();
    loadHistory();
  } catch (e) {
    console.warn("Initialization notice:", e && e.message);
  }
});

// Sanitize common unsafe command patterns
function sanitizeCommandPatterns() {
  questionPool.forEach((q) => {
    if (!Array.isArray(q.cmds)) return;
    q.cmds = q.cmds.map((cmd) => {
      let c = cmd;
      if (typeof c !== "string") return c;

      c = c.replace(/\s*#\s*variant\b.*$/i, "").trim();

      const m = c.match(/echo\s+-e\s+"([^"]+)"\s*\|\s*passwd\s+([A-Za-z0-9_\-]+)/i);
      if (m) {
        const pwBlock = m[1];
        const username = m[2];
        const pw = pwBlock
          .split(/\\r?\\n/)
          .map((s) => s.trim())
          .filter(Boolean)[0] || pwBlock;
        return `echo "${username}:${pw}" | chpasswd`;
      }

      const mc = c.match(/echo\s+['"]([\s\S]*?\n[\s\S]*?)['"]\s*\|\s*chpasswd/i);
      if (mc) {
        const block = mc[1];
        const firstLine = block
          .split(/\\r?\\n/)
          .map((s) => s.trim())
          .filter(Boolean)[0] || block;
        return `echo "${firstLine}" | chpasswd`;
      }

      const cm = c.match(/^echo\s+"([^"]+)"\s*\|\s*crontab\s+-$/i);
      if (cm) {
        const line = cm[1];
        return `(crontab -l 2>/dev/null; echo "${line}") | crontab -`;
      }

      const cmu = c.match(/^echo\s+"([^"]+)"\s*\|\s*crontab\s+-u\s+([A-Za-z0-9_\-]+)\s+-$/i);
      if (cmu) {
        const line = cmu[1];
        const u = cmu[2];
        return `(crontab -l -u ${u} 2>/dev/null; echo "${line}") | crontab -u ${u} -`;
      }

      if (c.includes("\n") && !/<<\s*[-']?EOF|<<\s*[-']?[A-Z0-9_]+/i.test(c)) {
        const lines = c
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        c = lines.join(" && ");
      }

      return c;
    });
  });
}

// Generate canonical answers
function generateCanonicalAnswers() {
  questionPool.forEach((q) => {
    if (!Array.isArray(q.cmds)) {
      q.canonical = [];
      return;
    }

    q.canonical = q.cmds.map((orig) => {
      let c = String(orig);

      if (/<<\s*[-']?EOF|<<\s*[-']?[A-Z0-9_]+/i.test(c)) return c;

      c = c.replace(/\s*#.*$/, "").trim();

      const passwdMatch = c.match(/^\s*passwd\s+([A-Za-z0-9_\-]+)(\s*\|\|.*)?$/);
      if (passwdMatch) {
        const user = passwdMatch[1];
        return `echo "${user}:redhat" | chpasswd`;
      }

      if (c.includes("\n")) {
        c = c
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .join(" && ");
      }

      return c;
    });

    q.cmds = q.cmds.map((cmd) => {
      if (typeof cmd !== "string") return cmd;
      if (/^\s*passwd\s+[A-Za-z0-9_\-]+(\s*\|\|.*)?$/.test(cmd)) {
        const user = cmd.match(/^\s*passwd\s+([A-Za-z0-9_\-]+)/)[1];
        return `echo "${user}:redhat" | chpasswd`;
      }
      return cmd;
    });
  });
}

// Load history from localStorage
function loadHistory() {
  const saved = localStorage.getItem("rhcsaExamHistory");
  if (saved) {
    examHistory = JSON.parse(saved);
    currentExamNumber = examHistory.length + 1;
    displayHistory();
  }
}

function saveHistory() {
  localStorage.setItem("rhcsaExamHistory", JSON.stringify(examHistory));
}

function resetHistory() {
  if (confirm("⚠️ This will delete all your exam history. Continue?")) {
    localStorage.removeItem("rhcsaExamHistory");
    examHistory = [];
    currentExamNumber = 1;
    document.getElementById("examHistorySection").classList.add("hidden");
    alert("✅ History reset successfully!");
  }
  displayHistory();
}

function displayHistory() {
  if (examHistory.length === 0) {
    document.getElementById("examHistorySection").classList.add("hidden");
    return;
  }

  document.getElementById("examHistorySection").classList.remove("hidden");

  const historyList = document.getElementById("examHistoryList");
  historyList.innerHTML = examHistory
    .slice(-10)
    .reverse()
    .map((exam) => {
      const passClass = exam.score >= 210 ? "passed" : "failed";
      const passText = exam.score >= 210 ? "PASSED" : "FAILED";
      return `
        <div class="history-item">
          <div>
            <strong>Exam #${exam.examNumber}</strong>
            <span style="margin-left: 15px; color: #718096; font-size: 14px;">
              ${new Date(exam.date).toLocaleDateString()}
            </span>
          </div>
          <div class="history-score ${passClass}">
            ${exam.score}/300 (${passText})
          </div>
        </div>
      `;
    })
    .join("");

  const totalAttempts = examHistory.length;
  const highestScore = Math.max(...examHistory.map((e) => e.score));
  const avgScore = Math.round(examHistory.reduce((sum, e) => sum + e.score, 0) / totalAttempts);
  const passCount = examHistory.filter((e) => e.score >= 210).length;
  const passRate = Math.round((passCount / totalAttempts) * 100);

  document.getElementById("totalAttempts").textContent = totalAttempts;
  document.getElementById("highestScore").textContent = `${highestScore}/300`;
  document.getElementById("avgScore").textContent = `${avgScore}/300`;
  document.getElementById("passRate").textContent = `${passRate}%`;

  drawChart();
}

function drawChart() {
  const chart = document.getElementById("scoreChart");
  const lastExams = examHistory.slice(-8);

  chart.innerHTML = lastExams
    .map((exam) => {
      const height = (exam.score / 300) * 150;
      const color = exam.score >= 210 ? "#10b981" : "#ef4444";
      return `
        <div class="chart-bar" style="height: ${height}px; background: ${color};">
          <div class="chart-value">${exam.score}</div>
          <div class="chart-label">#${exam.examNumber}</div>
        </div>
      `;
    })
    .join("");
}

function toggleHint(id, btn) {
  const el = document.getElementById(`hint-${id}`);
  if (!el) return;
  el.classList.toggle("visible");
  if (btn)
    btn.textContent = el.classList.contains("visible") ? "Hide Hint" : "Show Hint";
}

function toggleAnswer(id, btn) {
  const el = document.getElementById(`answer-${id}`);
  if (!el) return;
  el.classList.toggle("visible");
  if (btn)
    btn.textContent = el.classList.contains("visible") ? "Hide Answer" : "Show Answer";
}

// COMPREHENSIVE QUESTION POOL - 400+ QUESTIONS
const questionPool = [
  // ========== 1️⃣ SYSTEM ACCESS & MANAGEMENT (25 questions) ==========
  {
    desc: "Reset root password using rd.break method at boot.",
    points: 20,
    cmds: [
      "mount -o remount,rw /sysroot",
      "chroot /sysroot",
      "passwd root",
      "touch /.autorelabel",
      "exit",
      "reboot"
    ],
    verify: ["whoami"],
    hint: "Use rd.break in GRUB, remount /sysroot as rw, chroot, change password",
  },
  {
    desc: "Configure GRUB2 to boot into emergency mode by default.",
    points: 15,
    cmds: [
      "grubby --update-kernel=ALL --args=\"systemd.unit=emergency.target\""
    ],
    verify: ["grubby --info=ALL | grep emergency"],
    hint: "Use grubby with --args=\"systemd.unit=emergency.target\"",
  },
  {
    desc: "Remove emergency mode from GRUB2 boot parameters.",
    points: 15,
    cmds: [
      "grubby --update-kernel=ALL --remove-args=\"systemd.unit=emergency.target\""
    ],
    verify: ["grubby --info=ALL | grep emergency || echo 'removed'"],
    hint: "Use grubby --remove-args to remove parameters",
  },
  {
    desc: "Set default boot target to multi-user (no GUI).",
    points: 15,
    cmds: ["systemctl set-default multi-user.target"],
    verify: ["systemctl get-default"],
    hint: "systemctl set-default multi-user.target",
  },
  {
    desc: "Switch to rescue target without rebooting.",
    points: 15,
    cmds: ["systemctl isolate rescue.target"],
    verify: ["systemctl is-active rescue.target"],
    hint: "systemctl isolate rescue.target",
  },
  {
    desc: "Switch to multi-user target from graphical.",
    points: 15,
    cmds: ["systemctl isolate multi-user.target"],
    verify: ["systemctl is-active multi-user.target"],
    hint: "systemctl isolate multi-user.target",
  },
  {
    desc: "Allow user 'alex' to run sudo without password for all commands.",
    points: 15,
    cmds: ["echo 'alex ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers.d/alex-nopass"],
    verify: ["sudo -l -U alex"],
    hint: "Add line to /etc/sudoers.d/ directory",
  },
  {
    desc: "Set root password to 'redhat123'.",
    points: 15,
    cmds: ["echo 'root:redhat123' | chpasswd"],
    verify: ["su - -c 'whoami'"],
    hint: "echo 'user:password' | chpasswd",
  },
  {
    desc: "Lock root account to prevent login.",
    points: 10,
    cmds: ["passwd -l root"],
    verify: ["passwd -S root"],
    hint: "passwd -l locks account",
  },
  {
    desc: "Unlock root account.",
    points: 10,
    cmds: ["passwd -u root"],
    verify: ["passwd -S root"],
    hint: "passwd -u unlocks account",
  },
  {
    desc: "Switch to user 'natasha' using su.",
    points: 10,
    cmds: ["su - natasha"],
    verify: ["whoami"],
    hint: "su - username switches user with login shell",
  },
  {
    desc: "Execute 'ls /root' as root using sudo.",
    points: 10,
    cmds: ["sudo ls /root"],
    verify: ["sudo ls /root"],
    hint: "sudo command runs as root",
  },
  {
    desc: "Configure GRUB timeout to 5 seconds.",
    points: 15,
    cmds: ["grubby --update-kernel=ALL --args=\"GRUB_TIMEOUT=5\""],
    verify: ["grubby --info=ALL | grep GRUB_TIMEOUT"],
    hint: "Use grubby to set GRUB parameters",
  },
  {
    desc: "Add kernel parameter 'quiet' to GRUB.",
    points: 15,
    cmds: ["grubby --update-kernel=ALL --args=\"quiet\""],
    verify: ["grubby --info=ALL | grep quiet"],
    hint: "Add quiet parameter to suppress boot messages",
  },
  {
    desc: "Remove 'quiet' parameter from GRUB.",
    points: 15,
    cmds: ["grubby --update-kernel=ALL --remove-args=\"quiet\""],
    verify: ["grubby --info=ALL | grep quiet || echo 'removed'"],
    hint: "Remove kernel parameters with --remove-args",
  },
  {
    desc: "Check current runlevel/target.",
    points: 10,
    cmds: ["systemctl get-default"],
    verify: ["systemctl get-default"],
    hint: "systemctl get-default shows default target",
  },
  {
    desc: "List all available systemd targets.",
    points: 10,
    cmds: ["systemctl list-units --type=target --all"],
    verify: ["systemctl list-units --type=target --all | head -10"],
    hint: "systemctl list-units shows all units",
  },
  {
    desc: "Boot into single-user mode from GRUB.",
    points: 20,
    cmds: [
      "# In GRUB: edit kernel line and add 'single'",
      "# Press Ctrl+X to boot"
    ],
    verify: ["runlevel"],
    hint: "Add 'single' to kernel parameters in GRUB",
  },
  {
    desc: "Recover from read-only root filesystem.",
    points: 20,
    cmds: ["mount -o remount,rw /"],
    verify: ["mount | grep ' / '"],
    hint: "Remount root as read-write",
  },
  {
    desc: "Set console to tty2 during boot.",
    points: 15,
    cmds: ["grubby --update-kernel=ALL --args=\"console=tty2\""],
    verify: ["grubby --info=ALL | grep console"],
    hint: "Set console parameter in GRUB",
  },
  {
    desc: "Enable passwordless sudo for wheel group.",
    points: 15,
    cmds: ["echo '%wheel ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers.d/wheel-nopass"],
    verify: ["sudo -l -U alex"],
    hint: "Configure sudoers for wheel group",
  },
  {
    desc: "Disable passwordless sudo for wheel group.",
    points: 15,
    cmds: ["rm /etc/sudoers.d/wheel-nopass"],
    verify: ["test ! -f /etc/sudoers.d/wheel-nopass && echo 'removed'"],
    hint: "Remove sudoers configuration file",
  },
  {
    desc: "Configure sudo to require password for specific command.",
    points: 15,
    cmds: ["echo 'alex ALL=(ALL) PASSWD: /usr/bin/systemctl' >> /etc/sudoers.d/alex"],
    verify: ["sudo -l -U alex"],
    hint: "Use PASSWD: instead of NOPASSWD:",
  },
  {
    desc: "Check sudo configuration syntax.",
    points: 10,
    cmds: ["visudo -c"],
    verify: ["visudo -c"],
    hint: "visudo -c checks sudoers syntax",
  },
  {
    desc: "Edit sudoers file safely with visudo.",
    points: 15,
    cmds: ["visudo"],
    verify: ["visudo -c"],
    hint: "Always use visudo to edit sudoers",
  },

  // ========== 2️⃣ FILES & DIRECTORIES (30 questions) ==========
  {
    desc: "Create directory /data/projects with permissions 775.",
    points: 10,
    cmds: ["mkdir -p /data/projects", "chmod 775 /data/projects"],
    verify: ["ls -ld /data/projects"],
    hint: "mkdir -p creates parent directories, chmod sets permissions",
  },
  {
    desc: "Set SUID bit on /usr/bin/passwd.",
    points: 15,
    cmds: ["chmod u+s /usr/bin/passwd"],
    verify: ["ls -l /usr/bin/passwd | grep '^...s'"],
    hint: "chmod u+s sets SUID bit",
  },
  {
    desc: "Set SGID bit on directory /shared/team.",
    points: 15,
    cmds: ["chmod g+s /shared/team"],
    verify: ["ls -ld /shared/team | grep '^...s'"],
    hint: "chmod g+s sets SGID bit",
  },
  {
    desc: "Set sticky bit on /tmp directory.",
    points: 15,
    cmds: ["chmod +t /tmp"],
    verify: ["ls -ld /tmp | grep '......t'"],
    hint: "chmod +t sets sticky bit",
  },
  {
    desc: "Set umask to 022 for current session.",
    points: 10,
    cmds: ["umask 022"],
    verify: ["umask"],
    hint: "umask sets default permissions mask",
  },
  {
    desc: "Copy /etc/hosts to /tmp preserving all attributes.",
    points: 10,
    cmds: ["cp -a /etc/hosts /tmp/hosts.bak"],
    verify: ["ls -l /etc/hosts /tmp/hosts.bak"],
    hint: "cp -a preserves all attributes",
  },
  {
    desc: "Move all .txt files from /home to /backup.",
    points: 15,
    cmds: ["mkdir -p /backup", "mv /home/*.txt /backup/"],
    verify: ["ls /backup/*.txt | wc -l"],
    hint: "mv moves files, wildcard * matches patterns",
  },
  {
    desc: "Remove directory /olddata recursively and forcefully.",
    points: 15,
    cmds: ["rm -rf /olddata"],
    verify: ["ls -d /olddata 2>/dev/null || echo 'removed'"],
    hint: "rm -rf removes recursively and forcefully",
  },
  {
    desc: "Create hard link /tmp/hosts.link to /etc/hosts.",
    points: 10,
    cmds: ["ln /etc/hosts /tmp/hosts.link"],
    verify: ["ls -li /etc/hosts /tmp/hosts.link"],
    hint: "ln creates hard links (same inode)",
  },
  {
    desc: "Create symbolic link /etc/hostname.link pointing to /etc/hostname.",
    points: 10,
    cmds: ["ln -s /etc/hostname /etc/hostname.link"],
    verify: ["ls -l /etc/hostname.link"],
    hint: "ln -s creates symbolic links",
  },
  {
    desc: "Change owner of /var/log/messages to root:adm.",
    points: 10,
    cmds: ["chown root:adm /var/log/messages"],
    verify: ["ls -l /var/log/messages"],
    hint: "chown user:group changes owner and group",
  },
  {
    desc: "Change group of /srv/www to www-data.",
    points: 10,
    cmds: ["chgrp www-data /srv/www"],
    verify: ["ls -ld /srv/www"],
    hint: "chgrp changes group ownership",
  },
  {
    desc: "Set permissions 640 on /etc/secret.conf.",
    points: 10,
    cmds: ["chmod 640 /etc/secret.conf"],
    verify: ["ls -l /etc/secret.conf"],
    hint: "chmod 640 = rw-r-----",
  },
  {
    desc: "Set permissions 1777 on /tmp/shared (sticky bit).",
    points: 15,
    cmds: ["chmod 1777 /tmp/shared"],
    verify: ["ls -ld /tmp/shared | grep '......t'"],
    hint: "chmod 1777 = rwxrwxrwt (sticky bit)",
  },
  {
    desc: "Set permissions 2755 on /usr/local/bin (SGID).",
    points: 15,
    cmds: ["chmod 2755 /usr/local/bin"],
    verify: ["ls -ld /usr/local/bin | grep '^...s'"],
    hint: "chmod 2755 = rwxr-sr-x (SGID)",
  },
  {
    desc: "Set permissions 4755 on /usr/bin/sudo (SUID).",
    points: 15,
    cmds: ["chmod 4755 /usr/bin/sudo"],
    verify: ["ls -l /usr/bin/sudo | grep '^...s'"],
    hint: "chmod 4755 = rwsr-xr-x (SUID)",
  },
  {
    desc: "Find files with SUID bit set in /usr/bin.",
    points: 15,
    cmds: ["find /usr/bin -type f -perm /4000"],
    verify: ["find /usr/bin -type f -perm /4000 | wc -l"],
    hint: "find with -perm /4000 finds SUID files",
  },
  {
    desc: "Find files with SGID bit set in /usr/sbin.",
    points: 15,
    cmds: ["find /usr/sbin -type f -perm /2000"],
    verify: ["find /usr/sbin -type f -perm /2000 | wc -l"],
    hint: "find with -perm /2000 finds SGID files",
  },
  {
    desc: "Remove SUID bit from /usr/bin/example.",
    points: 15,
    cmds: ["chmod u-s /usr/bin/example"],
    verify: ["ls -l /usr/bin/example | grep -v '^...s'"],
    hint: "chmod u-s removes SUID bit",
  },
  {
    desc: "Remove SGID bit from directory /shared.",
    points: 15,
    cmds: ["chmod g-s /shared"],
    verify: ["ls -ld /shared | grep -v '^...s'"],
    hint: "chmod g-s removes SGID bit",
  },
  {
    desc: "Set default umask 027 in /etc/bashrc.",
    points: 15,
    cmds: ["echo 'umask 027' >> /etc/bashrc"],
    verify: ["tail -1 /etc/bashrc"],
    hint: "Add umask to shell configuration files",
  },
  {
    desc: "Check file type of /bin/bash.",
    points: 10,
    cmds: ["file /bin/bash"],
    verify: ["file /bin/bash"],
    hint: "file command determines file type",
  },
  {
    desc: "Create nested directories /project/{src,docs,bin}.",
    points: 10,
    cmds: ["mkdir -p /project/{src,docs,bin}"],
    verify: ["ls -ld /project/*"],
    hint: "mkdir with brace expansion creates multiple directories",
  },
  {
    desc: "Copy directory /etc/skel to /home/template preserving all.",
    points: 15,
    cmds: ["cp -ra /etc/skel /home/template"],
    verify: ["ls -la /home/template"],
    hint: "cp -ra preserves all recursively",
  },
  {
    desc: "Rename file oldname.txt to newname.txt.",
    points: 10,
    cmds: ["mv oldname.txt newname.txt"],
    verify: ["ls newname.txt"],
    hint: "mv renames files",
  },
  {
    desc: "Create empty file /tmp/test.txt.",
    points: 10,
    cmds: ["touch /tmp/test.txt"],
    verify: ["ls -l /tmp/test.txt"],
    hint: "touch creates empty files",
  },
  {
    desc: "Update timestamp of file /var/log/lastlog.",
    points: 10,
    cmds: ["touch /var/log/lastlog"],
    verify: ["ls -l /var/log/lastlog"],
    hint: "touch updates file timestamp",
  },
  {
    desc: "Create multiple empty files: file1.txt through file5.txt.",
    points: 10,
    cmds: ["touch file{1..5}.txt"],
    verify: ["ls file*.txt"],
    hint: "Use brace expansion with touch",
  },
  {
    desc: "Remove all files ending with .tmp in /tmp.",
    points: 15,
    cmds: ["rm -f /tmp/*.tmp"],
    verify: ["ls /tmp/*.tmp 2>/dev/null || echo 'cleaned'"],
    hint: "rm -f removes forcefully, wildcard matches patterns",
  },
  {
    desc: "Create directory with parent directories if needed.",
    points: 10,
    cmds: ["mkdir -p /data/logs/2024/01"],
    verify: ["ls -ld /data/logs/2024/01"],
    hint: "mkdir -p creates parent directories",
  },

  // ========== 3️⃣ USERS & GROUPS (30 questions) ==========
  {
    desc: "Create user 'developer' with UID 2001.",
    points: 15,
    cmds: ["useradd -u 2001 developer"],
    verify: ["id developer"],
    hint: "useradd -u sets UID",
  },
  {
    desc: "Create group 'developers' with GID 3001.",
    points: 15,
    cmds: ["groupadd -g 3001 developers"],
    verify: ["getent group developers"],
    hint: "groupadd -g sets GID",
  },
  {
    desc: "Add user 'alex' to secondary group 'wheel'.",
    points: 10,
    cmds: ["usermod -aG wheel alex"],
    verify: ["id alex | grep wheel"],
    hint: "usermod -aG adds to supplementary groups",
  },
  {
    desc: "Change primary group of 'bob' to 'developers'.",
    points: 15,
    cmds: ["usermod -g developers bob"],
    verify: ["id bob"],
    hint: "usermod -g changes primary group",
  },
  {
    desc: "Set password for user 'charlie' to 'RedHat@123'.",
    points: 10,
    cmds: ["echo 'charlie:RedHat@123' | chpasswd"],
    verify: ["su - charlie -c 'whoami'"],
    hint: "Use chpasswd with echo",
  },
  {
    desc: "Lock user account 'inactive'.",
    points: 10,
    cmds: ["passwd -l inactive"],
    verify: ["passwd -S inactive"],
    hint: "passwd -l locks account",
  },
  {
    desc: "Unlock user account 'inactive'.",
    points: 10,
    cmds: ["passwd -u inactive"],
    verify: ["passwd -S inactive"],
    hint: "passwd -u unlocks account",
  },
  {
    desc: "Set password expiration for 'alice' to 60 days.",
    points: 15,
    cmds: ["chage -M 60 alice"],
    verify: ["chage -l alice | grep 'Maximum'"],
    hint: "chage -M sets maximum password age",
  },
  {
    desc: "Force 'bob' to change password at next login.",
    points: 15,
    cmds: ["chage -d 0 bob"],
    verify: ["chage -l bob | grep 'Last password change'"],
    hint: "chage -d 0 forces password change",
  },
  {
    desc: "Set account expiration for 'tempuser' to 2024-12-31.",
    points: 15,
    cmds: ["chage -E 2024-12-31 tempuser"],
    verify: ["chage -l tempuser | grep 'Account expires'"],
    hint: "chage -E sets account expiration date",
  },
  {
    desc: "Create system user 'nginx' without home directory.",
    points: 15,
    cmds: ["useradd -r -s /sbin/nologin nginx"],
    verify: ["id nginx"],
    hint: "useradd -r creates system account, -M no home",
  },
  {
    desc: "Delete user 'olduser' and remove home directory.",
    points: 15,
    cmds: ["userdel -r olduser"],
    verify: ["id olduser 2>/dev/null || echo 'deleted'"],
    hint: "userdel -r removes user and home",
  },
  {
    desc: "Delete group 'oldgroup'.",
    points: 10,
    cmds: ["groupdel oldgroup"],
    verify: ["getent group oldgroup 2>/dev/null || echo 'deleted'"],
    hint: "groupdel removes group",
  },
  {
    desc: "Modify user 'developer' shell to /bin/bash.",
    points: 10,
    cmds: ["usermod -s /bin/bash developer"],
    verify: ["getent passwd developer | cut -d: -f7"],
    hint: "usermod -s changes login shell",
  },
  {
    desc: "Change home directory of 'alex' to /home/newhome.",
    points: 15,
    cmds: ["usermod -d /home/newhome -m alex"],
    verify: ["ls -ld /home/newhome"],
    hint: "usermod -d changes home, -m moves content",
  },
  {
    desc: "Set minimum password length to 12 characters.",
    points: 15,
    cmds: ["sed -i 's/^PASS_MIN_LEN.*/PASS_MIN_LEN 12/' /etc/login.defs"],
    verify: ["grep ^PASS_MIN_LEN /etc/login.defs"],
    hint: "Edit PASS_MIN_LEN in /etc/login.defs",
  },
  {
    desc: "Set password max age to 90 days for all users.",
    points: 15,
    cmds: ["sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS 90/' /etc/login.defs"],
    verify: ["grep ^PASS_MAX_DAYS /etc/login.defs"],
    hint: "Edit PASS_MAX_DAYS in /etc/login.defs",
  },
  {
    desc: "Display password aging info for user 'root'.",
    points: 10,
    cmds: ["chage -l root"],
    verify: ["chage -l root"],
    hint: "chage -l shows password aging info",
  },
  {
    desc: "List all users with UID >= 1000.",
    points: 15,
    cmds: ["awk -F: '$3 >= 1000 {print $1}' /etc/passwd"],
    verify: ["awk -F: '$3 >= 1000' /etc/passwd | wc -l"],
    hint: "awk filters by UID in /etc/passwd",
  },
  {
    desc: "Find users with empty password.",
    points: 20,
    cmds: ["awk -F: '$2 == \"\" {print $1}' /etc/shadow"],
    verify: ["awk -F: '$2 == \"\"' /etc/shadow | wc -l"],
    hint: "Check empty password field in /etc/shadow",
  },
  {
    desc: "Add user to multiple groups: 'wheel' and 'docker'.",
    points: 15,
    cmds: ["usermod -aG wheel,docker username"],
    verify: ["id username"],
    hint: "usermod -aG with comma-separated groups",
  },
  {
    desc: "Remove user from supplementary group 'developers'.",
    points: 15,
    cmds: ["gpasswd -d username developers"],
    verify: ["id username | grep developers || echo 'removed'"],
    hint: "gpasswd -d removes user from group",
  },
  {
    desc: "Create user with specific comment/description.",
    points: 15,
    cmds: ["useradd -c \"Developer Account\" devuser"],
    verify: ["getent passwd devuser | cut -d: -f5"],
    hint: "useradd -c adds comment/GECOS field",
  },
  {
    desc: "Change user comment to 'System Administrator'.",
    points: 15,
    cmds: ["usermod -c \"System Administrator\" username"],
    verify: ["getent passwd username | cut -d: -f5"],
    hint: "usermod -c changes comment field",
  },
  {
    desc: "Set minimum days between password changes to 2.",
    points: 15,
    cmds: ["chage -m 2 username"],
    verify: ["chage -l username | grep 'Minimum'"],
    hint: "chage -m sets minimum password age",
  },
  {
    desc: "Display failed login attempts for user 'alex'.",
    points: 10,
    cmds: ["faillock --user alex"],
    verify: ["faillock --user alex"],
    hint: "faillock shows failed login attempts",
  },
  {
    desc: "Reset failed login attempts for user 'bob'.",
    points: 15,
    cmds: ["faillock --user bob --reset"],
    verify: ["faillock --user bob"],
    hint: "faillock --reset clears failed attempts",
  },
  {
    desc: "List all groups user 'charlie' belongs to.",
    points: 10,
    cmds: ["groups charlie"],
    verify: ["groups charlie"],
    hint: "groups command shows user's groups",
  },
  {
    desc: "Check if user 'david' exists.",
    points: 10,
    cmds: ["id david"],
    verify: ["id david 2>/dev/null && echo 'exists' || echo 'not found'"],
    hint: "id command checks user existence",
  },
  {
    desc: "Create user with specific UID range (5000-6000).",
    points: 15,
    cmds: ["useradd -u 5001 newuser"],
    verify: ["id newuser"],
    hint: "useradd -u with UID in specific range",
  },

  // ========== 4️⃣ ACL (ACCESS CONTROL LISTS) (25 questions) ==========
  {
    desc: "Set ACL for user 'alex' with read/write on /data/file.txt.",
    points: 15,
    cmds: ["setfacl -m u:alex:rw /data/file.txt"],
    verify: ["getfacl /data/file.txt | grep alex"],
    hint: "setfacl -m u:username:permissions",
  },
  {
    desc: "Set ACL for group 'developers' with read-only on /shared/docs.",
    points: 15,
    cmds: ["setfacl -m g:developers:r /shared/docs"],
    verify: ["getfacl /shared/docs | grep developers"],
    hint: "setfacl -m g:groupname:permissions",
  },
  {
    desc: "Set default ACL on directory so new files inherit group read.",
    points: 20,
    cmds: ["setfacl -m d:g:developers:r /shared"],
    verify: ["getfacl /shared | grep default"],
    hint: "setfacl -m d: sets default ACL",
  },
  {
    desc: "Remove specific ACL entry for user 'bob' from /data/file.txt.",
    points: 15,
    cmds: ["setfacl -x u:bob /data/file.txt"],
    verify: ["getfacl /data/file.txt | grep bob || echo 'removed'"],
    hint: "setfacl -x removes specific ACL entry",
  },
  {
    desc: "Remove all ACLs from /data/file.txt.",
    points: 15,
    cmds: ["setfacl -b /data/file.txt"],
    verify: ["getfacl /data/file.txt | head -10"],
    hint: "setfacl -b removes all ACLs",
  },
  {
    desc: "Set ACL mask to rw- on /shared/file.",
    points: 15,
    cmds: ["setfacl -m m::rw /shared/file"],
    verify: ["getfacl /shared/file | grep mask"],
    hint: "setfacl -m m:: sets mask",
  },
  {
    desc: "Display ACL of /etc/passwd.",
    points: 10,
    cmds: ["getfacl /etc/passwd"],
    verify: ["getfacl /etc/passwd"],
    hint: "getfacl displays ACLs",
  },
  {
    desc: "Set recursive ACL on directory /var/www.",
    points: 20,
    cmds: ["setfacl -R -m u:www-data:rx /var/www"],
    verify: ["getfacl /var/www/html"],
    hint: "setfacl -R applies recursively",
  },
  {
    desc: "Remove recursive ACL from /var/www.",
    points: 20,
    cmds: ["setfacl -R -b /var/www"],
    verify: ["getfacl /var/www/html | head -10"],
    hint: "setfacl -R -b removes ACLs recursively",
  },
  {
    desc: "Set ACL for others with execute only.",
    points: 15,
    cmds: ["setfacl -m o:x /usr/local/bin/script.sh"],
    verify: ["getfacl /usr/local/bin/script.sh | grep other"],
    hint: "setfacl -m o: sets others permissions",
  },
  {
    desc: "Copy ACL from one file to another.",
    points: 20,
    cmds: ["getfacl file1 | setfacl --set-file=- file2"],
    verify: ["getfacl file1 file2 | diff"],
    hint: "Use getfacl output as input to setfacl",
  },
  {
    desc: "Set default ACL for new directories in /shared.",
    points: 20,
    cmds: ["setfacl -m d:u:alex:rwx /shared"],
    verify: ["getfacl /shared | grep default"],
    hint: "Default ACL affects newly created items",
  },
  {
    desc: "Remove default ACL from /shared.",
    points: 20,
    cmds: ["setfacl -k /shared"],
    verify: ["getfacl /shared | grep default || echo 'no default'"],
    hint: "setfacl -k removes default ACLs",
  },
  {
    desc: "Set ACL allowing user read/write, group read, others none.",
    points: 20,
    cmds: ["setfacl -m u:alice:rw,g:developers:r,o::--- /data/file"],
    verify: ["getfacl /data/file"],
    hint: "Multiple ACL entries in one command",
  },
  {
    desc: "Check if file has ACL set.",
    points: 10,
    cmds: ["getfacl /path/file | grep -v '^#' | wc -l"],
    verify: ["getfacl /path/file 2>/dev/null | head -5"],
    hint: "getfacl shows ACL if present",
  },
  {
    desc: "Backup ACLs to file.",
    points: 15,
    cmds: ["getfacl -R /shared > /root/acl_backup.txt"],
    verify: ["ls -l /root/acl_backup.txt"],
    hint: "getfacl -R recursively backs up ACLs",
  },
  {
    desc: "Restore ACLs from backup file.",
    points: 20,
    cmds: ["setfacl --restore=/root/acl_backup.txt"],
    verify: ["getfacl /shared"],
    hint: "setfacl --restore loads ACLs from file",
  },
  {
    desc: "Set ACL for effective rights display.",
    points: 15,
    cmds: ["setfacl -m u:testuser:r-- /test/file"],
    verify: ["getfacl /test/file"],
    hint: "Effective rights consider mask",
  },
  {
    desc: "Modify existing ACL entry.",
    points: 20,
    cmds: ["setfacl -m u:alex:rwx /data/file"],
    verify: ["getfacl /data/file | grep alex"],
    hint: "setfacl -m modifies existing or adds new",
  },
  {
    desc: "List files with ACL in /etc.",
    points: 15,
    cmds: ["find /etc -type f -exec getfacl {} \\; 2>/dev/null | grep -l '^[^#]' | head -5"],
    verify: ["find /etc -type f -exec getfacl {} \\; 2>/dev/null | grep '^[^#]' | wc -l"],
    hint: "Find files with non-comment ACL lines",
  },
  {
    desc: "Set ACL using numeric permissions.",
    points: 15,
    cmds: ["setfacl -m u:alex:6 /data/file"],
    verify: ["getfacl /data/file | grep alex"],
    hint: "Numeric: 4=r, 2=w, 1=x, 6=rw",
  },
  {
    desc: "Remove ACL entry for group.",
    points: 15,
    cmds: ["setfacl -x g:developers /data/file"],
    verify: ["getfacl /data/file | grep developers || echo 'removed'"],
    hint: "setfacl -x g: removes group ACL",
  },
  {
    desc: "Set ACL for user by UID.",
    points: 15,
    cmds: ["setfacl -m u:1001:rw /data/file"],
    verify: ["getfacl /data/file | grep 'user:1001'"],
    hint: "Can use UID instead of username",
  },
  {
    desc: "Set ACL for group by GID.",
    points: 15,
    cmds: ["setfacl -m g:1001:r /data/file"],
    verify: ["getfacl /data/file | grep 'group:1001'"],
    hint: "Can use GID instead of groupname",
  },
  {
    desc: "Verify ACL inheritance.",
    points: 20,
    cmds: ["touch /shared/newfile", "getfacl /shared/newfile"],
    verify: ["getfacl /shared/newfile | grep default"],
    hint: "Default ACLs are inherited by new files",
  },

  // ========== 5️⃣ SELINUX (25 questions) ==========
  {
    desc: "Set SELinux to enforcing mode.",
    points: 15,
    cmds: ["setenforce 1"],
    verify: ["getenforce"],
    hint: "setenforce 1 = enforcing, 0 = permissive",
  },
  {
    desc: "Set SELinux to permissive mode.",
    points: 15,
    cmds: ["setenforce 0"],
    verify: ["getenforce"],
    hint: "setenforce 0 sets permissive mode",
  },
  {
    desc: "Check SELinux status.",
    points: 10,
    cmds: ["sestatus"],
    verify: ["sestatus"],
    hint: "sestatus shows detailed SELinux status",
  },
  {
    desc: "Display SELinux context of /var/www/html.",
    points: 10,
    cmds: ["ls -Z /var/www/html"],
    verify: ["ls -Zd /var/www/html"],
    hint: "ls -Z shows SELinux context",
  },
  {
    desc: "Restore default SELinux context on /var/www/html.",
    points: 15,
    cmds: ["restorecon -v /var/www/html"],
    verify: ["ls -Z /var/www/html"],
    hint: "restorecon restores default context",
  },
  {
    desc: "Restore SELinux context recursively on directory.",
    points: 20,
    cmds: ["restorecon -Rv /var/www"],
    verify: ["ls -Z /var/www/html"],
    hint: "restorecon -R recursive, -v verbose",
  },
  {
    desc: "Change SELinux context of file to httpd_sys_content_t.",
    points: 20,
    cmds: ["chcon -t httpd_sys_content_t /var/www/html/index.html"],
    verify: ["ls -Z /var/www/html/index.html"],
    hint: "chcon -t changes type context",
  },
  {
    desc: "Change SELinux user context to system_u.",
    points: 20,
    cmds: ["chcon -u system_u /var/www/html"],
    verify: ["ls -Z /var/www/html"],
    hint: "chcon -u changes user context",
  },
  {
    desc: "Change SELinux role context to object_r.",
    points: 20,
    cmds: ["chcon -r object_r /var/www/html"],
    verify: ["ls -Z /var/www/html"],
    hint: "chcon -r changes role context",
  },
  {
    desc: "Add SELinux port mapping for HTTP on port 8080.",
    points: 20,
    cmds: ["semanage port -a -t http_port_t -p tcp 8080"],
    verify: ["semanage port -l | grep http_port_t"],
    hint: "semanage port -a adds port mapping",
  },
  {
    desc: "Remove SELinux port mapping for port 8080.",
    points: 20,
    cmds: ["semanage port -d -t http_port_t -p tcp 8080"],
    verify: ["semanage port -l | grep 8080 || echo 'removed'"],
    hint: "semanage port -d deletes port mapping",
  },
  {
    desc: "List all SELinux port mappings.",
    points: 10,
    cmds: ["semanage port -l"],
    verify: ["semanage port -l | head -20"],
    hint: "semanage port -l lists port mappings",
  },
  {
    desc: "Add file context mapping for /web directory.",
    points: 20,
    cmds: ["semanage fcontext -a -t httpd_sys_content_t '/web(/.*)?'"],
    verify: ["semanage fcontext -l | grep /web"],
    hint: "semanage fcontext -a adds file context",
  },
  {
    desc: "List file context mappings.",
    points: 10,
    cmds: ["semanage fcontext -l"],
    verify: ["semanage fcontext -l | head -20"],
    hint: "semanage fcontext -l lists mappings",
  },
  {
    desc: "Set SELinux boolean httpd_can_network_connect to on.",
    points: 20,
    cmds: ["setsebool -P httpd_can_network_connect on"],
    verify: ["getsebool httpd_can_network_connect"],
    hint: "setsebool -P makes boolean permanent",
  },
  {
    desc: "List all SELinux booleans.",
    points: 10,
    cmds: ["getsebool -a"],
    verify: ["getsebool -a | head -20"],
    hint: "getsebool -a lists all booleans",
  },
  {
    desc: "Check SELinux boolean value.",
    points: 10,
    cmds: ["getsebool httpd_enable_homedirs"],
    verify: ["getsebool httpd_enable_homedirs"],
    hint: "getsebool checks specific boolean",
  },
  {
    desc: "Generate SELinux policy module from audit log.",
    points: 25,
    cmds: ["grep AVC /var/log/audit/audit.log | audit2allow -M mypolicy"],
    verify: ["ls -l mypolicy.pp"],
    hint: "audit2allow creates policy from denials",
  },
  {
    desc: "Install SELinux policy module.",
    points: 20,
    cmds: ["semodule -i mypolicy.pp"],
    verify: ["semodule -l | grep mypolicy"],
    hint: "semodule -i installs policy module",
  },
  {
    desc: "Remove SELinux policy module.",
    points: 20,
    cmds: ["semodule -r mypolicy"],
    verify: ["semodule -l | grep mypolicy || echo 'removed'"],
    hint: "semodule -r removes policy module",
  },
  {
    desc: "List installed SELinux policy modules.",
    points: 10,
    cmds: ["semodule -l"],
    verify: ["semodule -l | head -20"],
    hint: "semodule -l lists installed modules",
  },
  {
    desc: "Check SELinux mount context.",
    points: 15,
    cmds: ["mount | grep context"],
    verify: ["mount | grep context"],
    hint: "Check if filesystem mounted with context",
  },
  {
    desc: "Mount with SELinux context.",
    points: 20,
    cmds: ["mount -o context=\"system_u:object_r:httpd_sys_content_t:s0\" /dev/sdb1 /web"],
    verify: ["mount | grep context"],
    hint: "mount -o context= sets context during mount",
  },
  {
    desc: "Fix SELinux context on NFS share.",
    points: 20,
    cmds: ["restorecon -R /nfs/share"],
    verify: ["ls -Z /nfs/share"],
    hint: "Use restorecon after NFS mount",
  },
  {
    desc: "Check SELinux denial messages.",
    points: 15,
    cmds: ["ausearch -m avc -ts today"],
    verify: ["ausearch -m avc -ts today | head -20"],
    hint: "ausearch searches audit logs for denials",
  },

  // ========== 6️⃣ NETWORKING (30 questions) ==========
  {
    desc: "Set hostname to server1.example.com.",
    points: 15,
    cmds: ["hostnamectl set-hostname server1.example.com"],
    verify: ["hostnamectl"],
    hint: "hostnamectl set-hostname sets hostname",
  },
  {
    desc: "Configure static IP 192.168.1.100/24 on eth0.",
    points: 20,
    cmds: ["nmcli con mod eth0 ipv4.addresses 192.168.1.100/24 ipv4.method manual"],
    verify: ["nmcli con show eth0 | grep ipv4.addresses"],
    hint: "nmcli con mod with ipv4.method manual",
  },
  {
    desc: "Set gateway 192.168.1.1 for eth0.",
    points: 15,
    cmds: ["nmcli con mod eth0 ipv4.gateway 192.168.1.1"],
    verify: ["nmcli con show eth0 | grep gateway"],
    hint: "nmcli con mod ipv4.gateway",
  },
  {
    desc: "Configure DNS servers 8.8.8.8 and 8.8.4.4.",
    points: 15,
    cmds: ["nmcli con mod eth0 ipv4.dns \"8.8.8.8 8.8.4.4\""],
    verify: ["cat /etc/resolv.conf"],
    hint: "nmcli con mod ipv4.dns with space-separated servers",
  },
  {
    desc: "Set search domain example.com.",
    points: 15,
    cmds: ["nmcli con mod eth0 ipv4.dns-search example.com"],
    verify: ["cat /etc/resolv.conf"],
    hint: "nmcli con mod ipv4.dns-search",
  },
  {
    desc: "Configure connection to start automatically.",
    points: 15,
    cmds: ["nmcli con mod eth0 connection.autoconnect yes"],
    verify: ["nmcli con show eth0 | grep autoconnect"],
    hint: "nmcli con mod connection.autoconnect yes",
  },
  {
    desc: "Bring interface eth0 down.",
    points: 10,
    cmds: ["nmcli con down eth0"],
    verify: ["nmcli con show --active | grep eth0 || echo 'down'"],
    hint: "nmcli con down deactivates connection",
  },
  {
    desc: "Bring interface eth0 up.",
    points: 10,
    cmds: ["nmcli con up eth0"],
    verify: ["nmcli con show --active | grep eth0"],
    hint: "nmcli con up activates connection",
  },
  {
    desc: "Display IP address of eth0.",
    points: 10,
    cmds: ["ip addr show eth0"],
    verify: ["ip addr show eth0 | grep inet"],
    hint: "ip addr show displays interface addresses",
  },
  {
    desc: "Display routing table.",
    points: 10,
    cmds: ["ip route"],
    verify: ["ip route"],
    hint: "ip route shows routing table",
  },
  {
    desc: "Add static route to 10.0.0.0/8 via 192.168.1.1.",
    points: 20,
    cmds: ["ip route add 10.0.0.0/8 via 192.168.1.1"],
    verify: ["ip route | grep 10.0.0.0"],
    hint: "ip route add network via gateway",
  },
  {
    desc: "Remove static route to 10.0.0.0/8.",
    points: 20,
    cmds: ["ip route del 10.0.0.0/8"],
    verify: ["ip route | grep 10.0.0.0 || echo 'removed'"],
    hint: "ip route del removes route",
  },
  {
    desc: "Test connectivity to 8.8.8.8 with 5 packets.",
    points: 10,
    cmds: ["ping -c 5 8.8.8.8"],
    verify: ["ping -c 5 8.8.8.8"],
    hint: "ping -c sends specified number of packets",
  },
  {
    desc: "Trace route to google.com.",
    points: 15,
    cmds: ["traceroute google.com"],
    verify: ["traceroute google.com"],
    hint: "traceroute shows route path",
  },
  {
    desc: "Check DNS resolution for google.com.",
    points: 10,
    cmds: ["nslookup google.com"],
    verify: ["nslookup google.com"],
    hint: "nslookup tests DNS resolution",
  },
  {
    desc: "Display listening TCP ports.",
    points: 10,
    cmds: ["ss -tln"],
    verify: ["ss -tln"],
    hint: "ss -tln shows listening TCP ports",
  },
  {
    desc: "Display all network connections.",
    points: 10,
    cmds: ["ss -tua"],
    verify: ["ss -tua"],
    hint: "ss -tua shows all TCP/UDP connections",
  },
  {
    desc: "Check bandwidth usage on eth0.",
    points: 15,
    cmds: ["nethogs eth0"],
    verify: ["nethogs eth0"],
    hint: "nethogs shows bandwidth per process",
  },
  {
    desc: "Display network interface statistics.",
    points: 10,
    cmds: ["ip -s link show eth0"],
    verify: ["ip -s link show eth0"],
    hint: "ip -s shows statistics",
  },
  {
    desc: "Set MTU to 9000 on eth0.",
    points: 15,
    cmds: ["ip link set eth0 mtu 9000"],
    verify: ["ip link show eth0 | grep mtu"],
    hint: "ip link set mtu changes MTU",
  },
  {
    desc: "Disable IPv6 on eth0.",
    points: 15,
    cmds: ["sysctl -w net.ipv6.conf.eth0.disable_ipv6=1"],
    verify: ["sysctl net.ipv6.conf.eth0.disable_ipv6"],
    hint: "sysctl disables IPv6 per interface",
  },
  {
    desc: "Enable IPv6 on eth0.",
    points: 15,
    cmds: ["sysctl -w net.ipv6.conf.eth0.disable_ipv6=0"],
    verify: ["sysctl net.ipv6.conf.eth0.disable_ipv6"],
    hint: "sysctl enables IPv6",
  },
  {
    desc: "Add secondary IP to eth0.",
    points: 20,
    cmds: ["ip addr add 192.168.1.101/24 dev eth0 label eth0:1"],
    verify: ["ip addr show eth0 | grep 192.168.1.101"],
    hint: "ip addr add with label for secondary IP",
  },
  {
    desc: "Remove secondary IP from eth0.",
    points: 20,
    cmds: ["ip addr del 192.168.1.101/24 dev eth0"],
    verify: ["ip addr show eth0 | grep 192.168.1.101 || echo 'removed'"],
    hint: "ip addr del removes IP address",
  },
  {
    desc: "Display ARP cache.",
    points: 10,
    cmds: ["ip neigh show"],
    verify: ["ip neigh show"],
    hint: "ip neigh shows ARP/neighbor cache",
  },
  {
    desc: "Flush ARP cache.",
    points: 15,
    cmds: ["ip neigh flush all"],
    verify: ["ip neigh show | wc -l"],
    hint: "ip neigh flush clears ARP cache",
  },
  {
    desc: "Check network interface speed.",
    points: 15,
    cmds: ["ethtool eth0"],
    verify: ["ethtool eth0 | grep Speed"],
    hint: "ethtool shows interface details",
  },
  {
    desc: "Set interface to autonegotiation.",
    points: 20,
    cmds: ["ethtool -s eth0 autoneg on"],
    verify: ["ethtool eth0 | grep Auto-negotiation"],
    hint: "ethtool -s sets interface parameters",
  },
  {
    desc: "Display network bonds.",
    points: 10,
    cmds: ["cat /proc/net/bonding/bond0"],
    verify: ["cat /proc/net/bonding/bond0"],
    hint: "Check bonding interface status",
  },
  {
    desc: "Display bridge configuration.",
    points: 10,
    cmds: ["brctl show"],
    verify: ["brctl show"],
    hint: "brctl shows bridge configuration",
  },
  {
    desc: "Display wireless interface information.",
    points: 15,
    cmds: ["iwconfig"],
    verify: ["iwconfig"],
    hint: "iwconfig shows wireless interface info",
  },

  // ========== 7️⃣ FIREWALL (FIREWALLD) (25 questions) ==========
  {
    desc: "Check firewall status.",
    points: 10,
    cmds: ["firewall-cmd --state"],
    verify: ["firewall-cmd --state"],
    hint: "firewall-cmd --state shows if running",
  },
  {
    desc: "List all firewall rules.",
    points: 10,
    cmds: ["firewall-cmd --list-all"],
    verify: ["firewall-cmd --list-all"],
    hint: "firewall-cmd --list-all shows all rules",
  },
  {
    desc: "Open HTTP port 80 permanently.",
    points: 15,
    cmds: ["firewall-cmd --permanent --add-port=80/tcp"],
    verify: ["firewall-cmd --list-ports | grep 80"],
    hint: "--permanent makes changes survive reboot",
  },
  {
    desc: "Close HTTP port 80.",
    points: 15,
    cmds: ["firewall-cmd --permanent --remove-port=80/tcp"],
    verify: ["firewall-cmd --list-ports | grep 80 || echo 'closed'"],
    hint: "--remove-port removes port rule",
  },
  {
    desc: "Allow SSH service.",
    points: 15,
    cmds: ["firewall-cmd --permanent --add-service=ssh"],
    verify: ["firewall-cmd --list-services | grep ssh"],
    hint: "--add-service adds predefined service",
  },
  {
    desc: "Remove SSH service.",
    points: 15,
    cmds: ["firewall-cmd --permanent --remove-service=ssh"],
    verify: ["firewall-cmd --list-services | grep ssh || echo 'removed'"],
    hint: "--remove-service removes service",
  },
  {
    desc: "Reload firewall rules.",
    points: 10,
    cmds: ["firewall-cmd --reload"],
    verify: ["firewall-cmd --list-all"],
    hint: "--reload applies permanent changes",
  },
  {
    desc: "Add rich rule to allow from specific IP.",
    points: 20,
    cmds: ["firewall-cmd --permanent --add-rich-rule='rule family=\"ipv4\" source address=\"192.168.1.100\" accept'"],
    verify: ["firewall-cmd --list-rich-rules"],
    hint: "Rich rules allow complex filtering",
  },
  {
    desc: "Remove rich rule.",
    points: 20,
    cmds: ["firewall-cmd --permanent --remove-rich-rule='rule family=\"ipv4\" source address=\"192.168.1.100\" accept'"],
    verify: ["firewall-cmd --list-rich-rules"],
    hint: "Remove matching rich rule",
  },
  {
    desc: "Set default zone to public.",
    points: 15,
    cmds: ["firewall-cmd --set-default-zone=public"],
    verify: ["firewall-cmd --get-default-zone"],
    hint: "--set-default-zone changes default zone",
  },
  {
    desc: "Add interface to zone.",
    points: 15,
    cmds: ["firewall-cmd --zone=public --add-interface=eth0"],
    verify: ["firewall-cmd --get-zone-of-interface=eth0"],
    hint: "--add-interface assigns interface to zone",
  },
  {
    desc: "Remove interface from zone.",
    points: 15,
    cmds: ["firewall-cmd --zone=public --remove-interface=eth0"],
    verify: ["firewall-cmd --get-zone-of-interface=eth0 || echo 'removed'"],
    hint: "--remove-interface removes assignment",
  },
  {
    desc: "List all zones.",
    points: 10,
    cmds: ["firewall-cmd --get-zones"],
    verify: ["firewall-cmd --get-zones"],
    hint: "--get-zones lists all zones",
  },
  {
    desc: "Show active zones.",
    points: 10,
    cmds: ["firewall-cmd --get-active-zones"],
    verify: ["firewall-cmd --get-active-zones"],
    hint: "--get-active-zones shows zones with interfaces",
  },
  {
    desc: "Add port range 8000-9000/tcp.",
    points: 20,
    cmds: ["firewall-cmd --permanent --add-port=8000-9000/tcp"],
    verify: ["firewall-cmd --list-ports | grep 8000-9000"],
    hint: "Port ranges with hyphen",
  },
  {
    desc: "Add source IP to zone.",
    points: 20,
    cmds: ["firewall-cmd --permanent --zone=trusted --add-source=192.168.1.0/24"],
    verify: ["firewall-cmd --zone=trusted --list-sources"],
    hint: "--add-source adds network to zone",
  },
  {
    desc: "Remove source IP from zone.",
    points: 20,
    cmds: ["firewall-cmd --permanent --zone=trusted --remove-source=192.168.1.0/24"],
    verify: ["firewall-cmd --zone=trusted --list-sources"],
    hint: "--remove-source removes network",
  },
  {
    desc: "Block ICMP (ping).",
    points: 15,
    cmds: ["firewall-cmd --permanent --add-icmp-block=echo-request"],
    verify: ["firewall-cmd --list-icmp-blocks"],
    hint: "--add-icmp-block blocks specific ICMP types",
  },
  {
    desc: "Allow ICMP (ping).",
    points: 15,
    cmds: ["firewall-cmd --permanent --remove-icmp-block=echo-request"],
    verify: ["firewall-cmd --list-icmp-blocks | grep echo || echo 'allowed'"],
    hint: "--remove-icmp-block allows ICMP",
  },
  {
    desc: "Add masquerading to zone.",
    points: 20,
    cmds: ["firewall-cmd --permanent --zone=public --add-masquerade"],
    verify: ["firewall-cmd --zone=public --query-masquerade"],
    hint: "--add-masquerade enables NAT",
  },
  {
    desc: "Remove masquerading.",
    points: 20,
    cmds: ["firewall-cmd --permanent --zone=public --remove-masquerade"],
    verify: ["firewall-cmd --zone=public --query-masquerade || echo 'removed'"],
    hint: "--remove-masquerade disables NAT",
  },
  {
    desc: "Forward port 8080 to 80.",
    points: 25,
    cmds: ["firewall-cmd --permanent --zone=public --add-forward-port=port=8080:proto=tcp:toport=80"],
    verify: ["firewall-cmd --zone=public --list-forward-ports"],
    hint: "--add-forward-port sets port forwarding",
  },
  {
    desc: "Remove port forwarding.",
    points: 25,
    cmds: ["firewall-cmd --permanent --zone=public --remove-forward-port=port=8080:proto=tcp:toport=80"],
    verify: ["firewall-cmd --zone=public --list-forward-ports"],
    hint: "--remove-forward-port removes forwarding",
  },
  {
    desc: "Check if service is allowed.",
    points: 10,
    cmds: ["firewall-cmd --query-service=ssh"],
    verify: ["firewall-cmd --query-service=ssh"],
    hint: "--query-service checks if allowed",
  },
  {
    desc: "Check if port is open.",
    points: 10,
    cmds: ["firewall-cmd --query-port=80/tcp"],
    verify: ["firewall-cmd --query-port=80/tcp"],
    hint: "--query-port checks port status",
  },
  {
    desc: "List predefined services.",
    points: 10,
    cmds: ["firewall-cmd --get-services"],
    verify: ["firewall-cmd --get-services | head -20"],
    hint: "--get-services lists available services",
  },

  // ========== 8️⃣ SOFTWARE MANAGEMENT (25 questions) ==========
  {
    desc: "Install httpd package.",
    points: 15,
    cmds: ["dnf install -y httpd"],
    verify: ["rpm -q httpd"],
    hint: "dnf install -y installs package",
  },
  {
    desc: "Remove telnet package.",
    points: 15,
    cmds: ["dnf remove -y telnet"],
    verify: ["rpm -q telnet || echo 'removed'"],
    hint: "dnf remove -y removes package",
  },
  {
    desc: "Update all packages.",
    points: 15,
    cmds: ["dnf update -y"],
    verify: ["dnf check-update | wc -l"],
    hint: "dnf update updates all packages",
  },
  {
    desc: "Search for package containing 'nginx'.",
    points: 10,
    cmds: ["dnf search nginx"],
    verify: ["dnf search nginx | head -5"],
    hint: "dnf search finds packages",
  },
  {
    desc: "Show info about httpd package.",
    points: 10,
    cmds: ["dnf info httpd"],
    verify: ["dnf info httpd"],
    hint: "dnf info shows package details",
  },
  {
    desc: "List installed packages.",
    points: 10,
    cmds: ["dnf list installed"],
    verify: ["dnf list installed | head -20"],
    hint: "dnf list installed shows installed",
  },
  {
    desc: "List available packages.",
    points: 10,
    cmds: ["dnf list available"],
    verify: ["dnf list available | head -20"],
    hint: "dnf list available shows available",
  },
  {
    desc: "Clean dnf cache.",
    points: 10,
    cmds: ["dnf clean all"],
    verify: ["ls /var/cache/dnf/"],
    hint: "dnf clean all clears cache",
  },
  {
    desc: "Make cache.",
    points: 10,
    cmds: ["dnf makecache"],
    verify: ["ls /var/cache/dnf/"],
    hint: "dnf makecache creates cache",
  },
  {
    desc: "List enabled repositories.",
    points: 10,
    cmds: ["dnf repolist enabled"],
    verify: ["dnf repolist enabled"],
    hint: "dnf repolist enabled shows active repos",
  },
  {
    desc: "List all repositories.",
    points: 10,
    cmds: ["dnf repolist all"],
    verify: ["dnf repolist all"],
    hint: "dnf repolist all shows all repos",
  },
  {
    desc: "Enable repository.",
    points: 15,
    cmds: ["dnf config-manager --set-enabled epel"],
    verify: ["dnf repolist enabled | grep epel"],
    hint: "dnf config-manager enables repos",
  },
  {
    desc: "Disable repository.",
    points: 15,
    cmds: ["dnf config-manager --set-disabled epel"],
    verify: ["dnf repolist enabled | grep epel || echo 'disabled'"],
    hint: "dnf config-manager disables repos",
  },
  {
    desc: "Install package group.",
    points: 20,
    cmds: ["dnf group install -y 'Development Tools'"],
    verify: ["dnf group list installed"],
    hint: "dnf group install installs group",
  },
  {
    desc: "Remove package group.",
    points: 20,
    cmds: ["dnf group remove -y 'Development Tools'"],
    verify: ["dnf group list installed | grep Development || echo 'removed'"],
    hint: "dnf group remove removes group",
  },
  {
    desc: "List package groups.",
    points: 10,
    cmds: ["dnf group list"],
    verify: ["dnf group list"],
    hint: "dnf group lists package groups",
  },
  {
    desc: "Check for updates.",
    points: 10,
    cmds: ["dnf check-update"],
    verify: ["dnf check-update | head -10"],
    hint: "dnf check-update shows available updates",
  },
  {
    desc: "Downgrade package.",
    points: 20,
    cmds: ["dnf downgrade -y httpd"],
    verify: ["rpm -q httpd"],
    hint: "dnf downgrade installs older version",
  },
  {
    desc: "Show transaction history.",
    points: 10,
    cmds: ["dnf history"],
    verify: ["dnf history"],
    hint: "dnf history shows past transactions",
  },
  {
    desc: "Undo last transaction.",
    points: 20,
    cmds: ["dnf history undo last -y"],
    verify: ["dnf history"],
    hint: "dnf history undo reverts transaction",
  },
  {
    desc: "Install local rpm file.",
    points: 20,
    cmds: ["dnf install -y /path/to/package.rpm"],
    verify: ["rpm -q package"],
    hint: "dnf install with local file path",
  },
  {
    desc: "Check package dependencies.",
    points: 15,
    cmds: ["dnf deplist httpd"],
    verify: ["dnf deplist httpd | head -10"],
    hint: "dnf deplist shows dependencies",
  },
  {
    desc: "Find which package provides file.",
    points: 15,
    cmds: ["dnf provides /bin/ls"],
    verify: ["dnf provides /bin/ls"],
    hint: "dnf provides finds package for file",
  },
  {
    desc: "Reinstall package.",
    points: 20,
    cmds: ["dnf reinstall -y httpd"],
    verify: ["rpm -q httpd"],
    hint: "dnf reinstall reinstalls package",
  },
  {
    desc: "Install from specific repository.",
    points: 20,
    cmds: ["dnf install -y --repo=epel nginx"],
    verify: ["rpm -q nginx"],
    hint: "--repo= specifies repository",
  },

  // ========== 9️⃣ PROCESSES & SERVICES (25 questions) ==========
  {
    desc: "List all processes.",
    points: 10,
    cmds: ["ps aux"],
    verify: ["ps aux | head -20"],
    hint: "ps aux shows all processes",
  },
  {
    desc: "List processes in tree format.",
    points: 10,
    cmds: ["pstree"],
    verify: ["pstree | head -20"],
    hint: "pstree shows process hierarchy",
  },
  {
    desc: "Monitor processes interactively.",
    points: 10,
    cmds: ["top"],
    verify: ["top -bn1 | head -20"],
    hint: "top shows real-time process info",
  },
  {
    desc: "Kill process by PID.",
    points: 15,
    cmds: ["kill 1234"],
    verify: ["ps -p 1234 || echo 'killed'"],
    hint: "kill sends TERM signal",
  },
  {
    desc: "Kill process forcefully.",
    points: 15,
    cmds: ["kill -9 1234"],
    verify: ["ps -p 1234 || echo 'killed'"],
    hint: "kill -9 sends KILL signal",
  },
  {
    desc: "Kill process by name.",
    points: 15,
    cmds: ["pkill httpd"],
    verify: ["pgrep httpd || echo 'killed'"],
    hint: "pkill kills by process name",
  },
  {
    desc: "Find process by name.",
    points: 10,
    cmds: ["pgrep httpd"],
    verify: ["pgrep httpd"],
    hint: "pgrep finds PID by name",
  },
  {
    desc: "Change process priority.",
    points: 20,
    cmds: ["renice -n 10 -p 1234"],
    verify: ["ps -o pid,ni -p 1234"],
    hint: "renice changes nice value",
  },
  {
    desc: "Start process with low priority.",
    points: 20,
    cmds: ["nice -n 19 command"],
    verify: ["ps -o pid,ni -p $(pgrep command)"],
    hint: "nice starts process with given priority",
  },
  {
    desc: "Show open files by process.",
    points: 15,
    cmds: ["lsof -p 1234"],
    verify: ["lsof -p 1234 | head -10"],
    hint: "lsof lists open files",
  },
  {
    desc: "Show processes using port 80.",
    points: 15,
    cmds: ["ss -tlnp | grep :80"],
    verify: ["ss -tlnp | grep :80"],
    hint: "ss shows socket statistics",
  },
  {
    desc: "Start service.",
    points: 10,
    cmds: ["systemctl start httpd"],
    verify: ["systemctl is-active httpd"],
    hint: "systemctl start starts service",
  },
  {
    desc: "Stop service.",
    points: 10,
    cmds: ["systemctl stop httpd"],
    verify: ["systemctl is-active httpd || echo 'stopped'"],
    hint: "systemctl stop stops service",
  },
  {
    desc: "Restart service.",
    points: 10,
    cmds: ["systemctl restart httpd"],
    verify: ["systemctl is-active httpd"],
    hint: "systemctl restart restarts service",
  },
  {
    desc: "Reload service.",
    points: 10,
    cmds: ["systemctl reload httpd"],
    verify: ["systemctl is-active httpd"],
    hint: "systemctl reload reloads config",
  },
  {
    desc: "Enable service at boot.",
    points: 10,
    cmds: ["systemctl enable httpd"],
    verify: ["systemctl is-enabled httpd"],
    hint: "systemctl enable enables autostart",
  },
  {
    desc: "Disable service at boot.",
    points: 10,
    cmds: ["systemctl disable httpd"],
    verify: ["systemctl is-enabled httpd || echo 'disabled'"],
    hint: "systemctl disable disables autostart",
  },
  {
    desc: "Check service status.",
    points: 10,
    cmds: ["systemctl status httpd"],
    verify: ["systemctl status httpd"],
    hint: "systemctl status shows service status",
  },
  {
    desc: "List all services.",
    points: 10,
    cmds: ["systemctl list-units --type=service"],
    verify: ["systemctl list-units --type=service | head -20"],
    hint: "systemctl list-units lists services",
  },
  {
    desc: "List failed services.",
    points: 10,
    cmds: ["systemctl --failed"],
    verify: ["systemctl --failed"],
    hint: "systemctl --failed shows failed services",
  },
  {
    desc: "Mask service (prevent start).",
    points: 15,
    cmds: ["systemctl mask httpd"],
    verify: ["systemctl is-enabled httpd"],
    hint: "systemctl mask prevents service start",
  },
  {
    desc: "Unmask service.",
    points: 15,
    cmds: ["systemctl unmask httpd"],
    verify: ["systemctl is-enabled httpd"],
    hint: "systemctl unmask allows service start",
  },
  {
    desc: "Show service dependencies.",
    points: 15,
    cmds: ["systemctl list-dependencies httpd"],
    verify: ["systemctl list-dependencies httpd"],
    hint: "systemctl list-dependencies shows deps",
  },
  {
    desc: "Change systemd target.",
    points: 15,
    cmds: ["systemctl isolate multi-user.target"],
    verify: ["systemctl is-active multi-user.target"],
    hint: "systemctl isolate changes target",
  },
  {
    desc: "Set default target.",
    points: 15,
    cmds: ["systemctl set-default multi-user.target"],
    verify: ["systemctl get-default"],
    hint: "systemctl set-default sets boot target",
  },

  // ========== 🔟 STORAGE - BASIC (25 questions) ==========
  {
    desc: "List block devices.",
    points: 10,
    cmds: ["lsblk"],
    verify: ["lsblk"],
    hint: "lsblk lists block devices",
  },
  {
    desc: "Show disk partitions.",
    points: 10,
    cmds: ["fdisk -l"],
    verify: ["fdisk -l | head -30"],
    hint: "fdisk -l shows partition table",
  },
  {
    desc: "Create partition on /dev/sdb.",
    points: 20,
    cmds: ["parted /dev/sdb mklabel gpt", "parted /dev/sdb mkpart primary ext4 0% 100%"],
    verify: ["parted /dev/sdb print"],
    hint: "parted creates partitions",
  },
  {
    desc: "Create MBR partition table.",
    points: 20,
    cmds: ["parted /dev/sdb mklabel msdos"],
    verify: ["parted /dev/sdb print | grep msdos"],
    hint: "mklabel msdos creates MBR",
  },
  {
    desc: "Create GPT partition table.",
    points: 20,
    cmds: ["parted /dev/sdb mklabel gpt"],
    verify: ["parted /dev/sdb print | grep gpt"],
    hint: "mklabel gpt creates GPT",
  },
  {
    desc: "Format partition as ext4.",
    points: 15,
    cmds: ["mkfs.ext4 /dev/sdb1"],
    verify: ["blkid /dev/sdb1"],
    hint: "mkfs.ext4 creates ext4 filesystem",
  },
  {
    desc: "Format partition as xfs.",
    points: 15,
    cmds: ["mkfs.xfs /dev/sdb1"],
    verify: ["blkid /dev/sdb1"],
    hint: "mkfs.xfs creates XFS filesystem",
  },
  {
    desc: "Check filesystem.",
    points: 15,
    cmds: ["fsck /dev/sdb1"],
    verify: ["fsck -N /dev/sdb1"],
    hint: "fsck checks filesystem integrity",
  },
  {
    desc: "Mount filesystem.",
    points: 10,
    cmds: ["mount /dev/sdb1 /mnt/data"],
    verify: ["mount | grep /mnt/data"],
    hint: "mount attaches filesystem",
  },
  {
    desc: "Unmount filesystem.",
    points: 10,
    cmds: ["umount /mnt/data"],
    verify: ["mount | grep /mnt/data || echo 'unmounted'"],
    hint: "umount detaches filesystem",
  },
  {
    desc: "Mount with specific options.",
    points: 15,
    cmds: ["mount -o noatime,nodiratime /dev/sdb1 /mnt/data"],
    verify: ["mount | grep /mnt/data"],
    hint: "mount -o sets mount options",
  },
  {
    desc: "Show mounted filesystems.",
    points: 10,
    cmds: ["mount"],
    verify: ["mount"],
    hint: "mount shows mounted filesystems",
  },
  {
    desc: "Show disk usage.",
    points: 10,
    cmds: ["df -h"],
    verify: ["df -h"],
    hint: "df -h shows disk usage human readable",
  },
  {
    desc: "Show directory space usage.",
    points: 10,
    cmds: ["du -sh /var"],
    verify: ["du -sh /var"],
    hint: "du -sh shows directory size",
  },
  {
    desc: "Add entry to /etc/fstab.",
    points: 20,
    cmds: ["echo '/dev/sdb1 /mnt/data ext4 defaults 0 0' >> /etc/fstab"],
    verify: ["tail -1 /etc/fstab"],
    hint: "fstab entries auto-mount at boot",
  },
  {
    desc: "Test fstab entries.",
    points: 15,
    cmds: ["mount -a"],
    verify: ["mount | grep /mnt/data"],
    hint: "mount -a mounts all fstab entries",
  },
  {
    desc: "Find filesystem UUID.",
    points: 10,
    cmds: ["blkid /dev/sdb1"],
    verify: ["blkid /dev/sdb1"],
    hint: "blkid shows UUID and filesystem type",
  },
  {
    desc: "Mount by UUID.",
    points: 15,
    cmds: ["mount UUID=xxxx-xxxx /mnt/data"],
    verify: ["mount | grep /mnt/data"],
    hint: "Mount using UUID instead of device name",
  },
  {
    desc: "Create swap partition.",
    points: 20,
    cmds: ["mkswap /dev/sdb2"],
    verify: ["blkid /dev/sdb2 | grep swap"],
    hint: "mkswap creates swap space",
  },
  {
    desc: "Enable swap.",
    points: 15,
    cmds: ["swapon /dev/sdb2"],
    verify: ["swapon --show"],
    hint: "swapon activates swap",
  },
  {
    desc: "Disable swap.",
    points: 15,
    cmds: ["swapoff /dev/sdb2"],
    verify: ["swapon --show | grep sdb2 || echo 'disabled'"],
    hint: "swapoff deactivates swap",
  },
  {
    desc: "Show swap usage.",
    points: 10,
    cmds: ["free -h"],
    verify: ["free -h | grep Swap"],
    hint: "free shows memory and swap usage",
  },
  {
    desc: "Create swap file.",
    points: 25,
    cmds: [
      "fallocate -l 1G /swapfile",
      "chmod 600 /swapfile",
      "mkswap /swapfile",
      "swapon /swapfile"
    ],
    verify: ["swapon --show | grep /swapfile"],
    hint: "Use fallocate to create swap file",
  },
  {
    desc: "Remove swap file.",
    points: 20,
    cmds: ["swapoff /swapfile", "rm -f /swapfile"],
    verify: ["swapon --show | grep swapfile || echo 'removed'"],
    hint: "Disable before removing swap file",
  },
  {
    desc: "Resize filesystem.",
    points: 25,
    cmds: ["resize2fs /dev/sdb1"],
    verify: ["df -h /dev/sdb1"],
    hint: "resize2fs resizes ext filesystem",
  },

  // ========== 1️⃣1️⃣ STORAGE - LVM (30 questions) ==========
  {
    desc: "Create physical volume.",
    points: 15,
    cmds: ["pvcreate /dev/sdb"],
    verify: ["pvs"],
    hint: "pvcreate initializes disk for LVM",
  },
  {
    desc: "Create volume group.",
    points: 15,
    cmds: ["vgcreate vg_data /dev/sdb"],
    verify: ["vgs vg_data"],
    hint: "vgcreate creates volume group",
  },
  {
    desc: "Create logical volume.",
    points: 20,
    cmds: ["lvcreate -L 10G -n lv_home vg_data"],
    verify: ["lvs vg_data/lv_home"],
    hint: "lvcreate creates logical volume",
  },
  {
    desc: "Create LV with all free space.",
    points: 20,
    cmds: ["lvcreate -l 100%FREE -n lv_var vg_data"],
    verify: ["lvs vg_data/lv_var"],
    hint: "-l 100%FREE uses all available space",
  },
  {
    desc: "Extend volume group.",
    points: 20,
    cmds: ["vgextend vg_data /dev/sdc"],
    verify: ["vgs vg_data"],
    hint: "vgextend adds PV to VG",
  },
  {
    desc: "Reduce volume group.",
    points: 25,
    cmds: ["vgreduce vg_data /dev/sdc"],
    verify: ["vgs vg_data"],
    hint: "vgreduce removes PV from VG",
  },
  {
    desc: "Extend logical volume.",
    points: 25,
    cmds: ["lvextend -L +5G /dev/vg_data/lv_home"],
    verify: ["lvs /dev/vg_data/lv_home"],
    hint: "lvextend increases LV size",
  },
  {
    desc: "Reduce logical volume.",
    points: 30,
    cmds: [
      "umount /home",
      "e2fsck -f /dev/vg_data/lv_home",
      "resize2fs /dev/vg_data/lv_home 8G",
      "lvreduce -L 8G /dev/vg_data/lv_home",
      "mount /home"
    ],
    verify: ["lvs /dev/vg_data/lv_home"],
    hint: "Reduce filesystem before LV",
  },
  {
    desc: "Remove logical volume.",
    points: 20,
    cmds: ["lvremove /dev/vg_data/lv_home"],
    verify: ["lvs | grep lv_home || echo 'removed'"],
    hint: "lvremove deletes LV",
  },
  {
    desc: "Remove volume group.",
    points: 20,
    cmds: ["vgremove vg_data"],
    verify: ["vgs | grep vg_data || echo 'removed'"],
    hint: "vgremove deletes VG",
  },
  {
    desc: "Remove physical volume.",
    points: 20,
    cmds: ["pvremove /dev/sdb"],
    verify: ["pvs | grep sdb || echo 'removed'"],
    hint: "pvremove removes LVM metadata",
  },
  {
    desc: "Display physical volumes.",
    points: 10,
    cmds: ["pvs"],
    verify: ["pvs"],
    hint: "pvs shows physical volumes",
  },
  {
    desc: "Display volume groups.",
    points: 10,
    cmds: ["vgs"],
    verify: ["vgs"],
    hint: "vgs shows volume groups",
  },
  {
    desc: "Display logical volumes.",
    points: 10,
    cmds: ["lvs"],
    verify: ["lvs"],
    hint: "lvs shows logical volumes",
  },
  {
    desc: "Display detailed PV info.",
    points: 10,
    cmds: ["pvdisplay"],
    verify: ["pvdisplay | head -20"],
    hint: "pvdisplay shows detailed PV info",
  },
  {
    desc: "Display detailed VG info.",
    points: 10,
    cmds: ["vgdisplay"],
    verify: ["vgdisplay | head -20"],
    hint: "vgdisplay shows detailed VG info",
  },
  {
    desc: "Display detailed LV info.",
    points: 10,
    cmds: ["lvdisplay"],
    verify: ["lvdisplay | head -20"],
    hint: "lvdisplay shows detailed LV info",
  },
  {
    desc: "Create snapshot.",
    points: 30,
    cmds: ["lvcreate -L 1G -s -n snap_home /dev/vg_data/lv_home"],
    verify: ["lvs | grep snap_home"],
    hint: "lvcreate -s creates snapshot",
  },
  {
    desc: "Restore from snapshot.",
    points: 35,
    cmds: [
      "umount /home",
      "lvconvert --merge /dev/vg_data/snap_home",
      "mount /home"
    ],
    verify: ["lvs | grep snap_home || echo 'merged'"],
    hint: "lvconvert --merge restores snapshot",
  },
  {
    desc: "Remove snapshot.",
    points: 20,
    cmds: ["lvremove /dev/vg_data/snap_home"],
    verify: ["lvs | grep snap_home || echo 'removed'"],
    hint: "lvremove deletes snapshot",
  },
  {
    desc: "Activate volume group.",
    points: 15,
    cmds: ["vgchange -ay vg_data"],
    verify: ["vgs vg_data"],
    hint: "vgchange -ay activates VG",
  },
  {
    desc: "Deactivate volume group.",
    points: 15,
    cmds: ["vgchange -an vg_data"],
    verify: ["vgs vg_data"],
    hint: "vgchange -an deactivates VG",
  },
  {
    desc: "Rename volume group.",
    points: 20,
    cmds: ["vgrename vg_data vg_new"],
    verify: ["vgs vg_new"],
    hint: "vgrename changes VG name",
  },
  {
    desc: "Rename logical volume.",
    points: 20,
    cmds: ["lvrename vg_data lv_old lv_new"],
    verify: ["lvs vg_data/lv_new"],
    hint: "lvrename changes LV name",
  },
  {
    desc: "Move physical volume.",
    points: 30,
    cmds: ["pvmove /dev/sdb"],
    verify: ["pvs"],
    hint: "pvmove moves data between PVs",
  },
  {
    desc: "Set PE size.",
    points: 20,
    cmds: ["vgcreate -s 16M vg_data /dev/sdb"],
    verify: ["vgs -o vg_extent_size vg_data"],
    hint: "vgcreate -s sets physical extent size",
  },
  {
    desc: "Create striped LV.",
    points: 25,
    cmds: ["lvcreate -L 10G -i 2 -I 64 -n lv_striped vg_data"],
    verify: ["lvs -o stripes,stripsize vg_data/lv_striped"],
    hint: "-i stripes, -I stripe size",
  },
  {
    desc: "Create mirrored LV.",
    points: 30,
    cmds: ["lvcreate -L 10G -m1 -n lv_mirror vg_data"],
    verify: ["lvs -o mirrors vg_data/lv_mirror"],
    hint: "-m1 creates 1 mirror copy",
  },
  {
    desc: "Create thin pool.",
    points: 35,
    cmds: [
      "lvcreate -L 100G -T vg_data/thinpool",
      "lvcreate -V 10G -T vg_data/thinpool -n thinvol"
    ],
    verify: ["lvs vg_data/thinpool vg_data/thinvol"],
    hint: "-T creates thin pool/volume",
  },
  {
    desc: "Extend thin pool.",
    points: 30,
    cmds: ["lvextend -L +50G vg_data/thinpool"],
    verify: ["lvs vg_data/thinpool"],
    hint: "Extend thin pool like regular LV",
  },

  // ========== 1️⃣2️⃣ SEARCHING & TEXT PROCESSING (25 questions) ==========
  {
    desc: "Search for 'error' in /var/log/messages.",
    points: 10,
    cmds: ["grep error /var/log/messages"],
    verify: ["grep error /var/log/messages | head -5"],
    hint: "grep searches for patterns",
  },
  {
    desc: "Search recursively for 'TODO' in current directory.",
    points: 15,
    cmds: ["grep -r TODO ."],
    verify: ["grep -r TODO . | head -5"],
    hint: "grep -r searches recursively",
  },
  {
    desc: "Case-insensitive search for 'Error'.",
    points: 10,
    cmds: ["grep -i error file.txt"],
    verify: ["grep -i error file.txt | head -5"],
    hint: "grep -i ignores case",
  },
  {
    desc: "Search for whole word 'word'.",
    points: 10,
    cmds: ["grep -w word file.txt"],
    verify: ["grep -w word file.txt | head -5"],
    hint: "grep -w matches whole words",
  },
  {
    desc: "Count occurrences of 'error'.",
    points: 10,
    cmds: ["grep -c error file.txt"],
    verify: ["grep -c error file.txt"],
    hint: "grep -c counts matches",
  },
  {
    desc: "Show line numbers with matches.",
    points: 10,
    cmds: ["grep -n error file.txt"],
    verify: ["grep -n error file.txt | head -5"],
    hint: "grep -n shows line numbers",
  },
  {
    desc: "Find files containing 'pattern'.",
    points: 15,
    cmds: ["find . -type f -exec grep -l pattern {} \\;"],
    verify: ["find . -type f -exec grep -l pattern {} \\; | head -5"],
    hint: "find with exec grep -l",
  },
  {
    desc: "Find files modified in last 7 days.",
    points: 15,
    cmds: ["find . -type f -mtime -7"],
    verify: ["find . -type f -mtime -7 | head -5"],
    hint: "find -mtime -7 finds recent files",
  },
  {
    desc: "Find files larger than 100MB.",
    points: 15,
    cmds: ["find / -type f -size +100M 2>/dev/null"],
    verify: ["find / -type f -size +100M 2>/dev/null | head -5"],
    hint: "find -size +100M finds large files",
  },
  {
    desc: "Find empty files.",
    points: 10,
    cmds: ["find . -type f -empty"],
    verify: ["find . -type f -empty | head -5"],
    hint: "find -empty finds empty files",
  },
  {
    desc: "Find and delete core dump files.",
    points: 20,
    cmds: ["find / -name core -type f -delete 2>/dev/null"],
    verify: ["find / -name core -type f 2>/dev/null | wc -l"],
    hint: "find with -delete removes files",
  },
  {
    desc: "Sort file alphabetically.",
    points: 10,
    cmds: ["sort file.txt"],
    verify: ["sort file.txt | head -10"],
    hint: "sort sorts lines",
  },
  {
    desc: "Sort file numerically.",
    points: 10,
    cmds: ["sort -n numbers.txt"],
    verify: ["sort -n numbers.txt | head -10"],
    hint: "sort -n sorts numerically",
  },
  {
    desc: "Sort in reverse order.",
    points: 10,
    cmds: ["sort -r file.txt"],
    verify: ["sort -r file.txt | head -10"],
    hint: "sort -r reverses sort order",
  },
  {
    desc: "Remove duplicate lines.",
    points: 10,
    cmds: ["sort -u file.txt"],
    verify: ["sort -u file.txt | head -10"],
    hint: "sort -u removes duplicates",
  },
  {
    desc: "Extract first column from CSV.",
    points: 15,
    cmds: ["cut -d, -f1 file.csv"],
    verify: ["cut -d, -f1 file.csv | head -10"],
    hint: "cut -d delimiter -f field",
  },
  {
    desc: "Extract characters 1-10 from each line.",
    points: 15,
    cmds: ["cut -c1-10 file.txt"],
    verify: ["cut -c1-10 file.txt | head -10"],
    hint: "cut -c extracts characters",
  },
  {
    desc: "Count lines, words, characters.",
    points: 10,
    cmds: ["wc file.txt"],
    verify: ["wc file.txt"],
    hint: "wc counts lines, words, characters",
  },
  {
    desc: "Count lines only.",
    points: 10,
    cmds: ["wc -l file.txt"],
    verify: ["wc -l file.txt"],
    hint: "wc -l counts lines",
  },
  {
    desc: "Replace 'old' with 'new' in file.",
    points: 15,
    cmds: ["sed 's/old/new/g' file.txt"],
    verify: ["sed 's/old/new/g' file.txt | head -5"],
    hint: "sed s/old/new/g replaces globally",
  },
  {
    desc: "Replace 'old' with 'new' in place.",
    points: 20,
    cmds: ["sed -i 's/old/new/g' file.txt"],
    verify: ["grep new file.txt | head -5"],
    hint: "sed -i modifies file in place",
  },
  {
    desc: "Print lines 10-20 of file.",
    points: 10,
    cmds: ["sed -n '10,20p' file.txt"],
    verify: ["sed -n '10,20p' file.txt"],
    hint: "sed -n 'start,endp' prints range",
  },
  {
    desc: "Delete lines containing 'pattern'.",
    points: 15,
    cmds: ["sed '/pattern/d' file.txt"],
    verify: ["sed '/pattern/d' file.txt | head -10"],
    hint: "sed '/pattern/d' deletes lines",
  },
  {
    desc: "Print first 10 lines.",
    points: 10,
    cmds: ["head -10 file.txt"],
    verify: ["head -10 file.txt"],
    hint: "head shows first lines",
  },
  {
    desc: "Print last 10 lines.",
    points: 10,
    cmds: ["tail -10 file.txt"],
    verify: ["tail -10 file.txt"],
    hint: "tail shows last lines",
  },

  // ========== 1️⃣3️⃣ SCHEDULING (25 questions) ==========
  {
    desc: "Edit user crontab.",
    points: 15,
    cmds: ["crontab -e"],
    verify: ["crontab -l"],
    hint: "crontab -e edits user's cron jobs",
  },
  {
    desc: "List user crontab.",
    points: 10,
    cmds: ["crontab -l"],
    verify: ["crontab -l"],
    hint: "crontab -l lists cron jobs",
  },
  {
    desc: "Remove user crontab.",
    points: 15,
    cmds: ["crontab -r"],
    verify: ["crontab -l 2>/dev/null || echo 'removed'"],
    hint: "crontab -r removes all cron jobs",
  },
  {
    desc: "Add cron job: run at minute 30 past 2am daily.",
    points: 20,
    cmds: ["(crontab -l; echo '30 2 * * * /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep script.sh"],
    hint: "minute hour * * * command",
  },
  {
    desc: "Add cron job: run every Monday at 3:15am.",
    points: 20,
    cmds: ["(crontab -l; echo '15 3 * * 1 /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep script.sh"],
    hint: "0=Sunday, 1=Monday, etc.",
  },
  {
    desc: "Add cron job: run every 5 minutes.",
    points: 20,
    cmds: ["(crontab -l; echo '*/5 * * * * /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep script.sh"],
    hint: "*/5 means every 5 minutes",
  },
  {
    desc: "Add cron job: run at 4:30am on 1st of month.",
    points: 20,
    cmds: ["(crontab -l; echo '30 4 1 * * /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep script.sh"],
    hint: "day of month field (1-31)",
  },
  {
    desc: "Add system cron job.",
    points: 25,
    cmds: ["echo '30 2 * * * root /path/to/script.sh' >> /etc/crontab"],
    verify: ["tail -5 /etc/crontab"],
    hint: "System cron in /etc/crontab needs user field",
  },
  {
    desc: "Add cron job to /etc/cron.d/.",
    points: 25,
    cmds: ["echo '30 2 * * * root /path/to/script.sh' > /etc/cron.d/myscript"],
    verify: ["cat /etc/cron.d/myscript"],
    hint: "/etc/cron.d/ for custom cron files",
  },
  {
    desc: "Schedule job with at: run at 2:30pm.",
    points: 20,
    cmds: ["echo '/path/to/script.sh' | at 14:30"],
    verify: ["atq"],
    hint: "at schedules one-time jobs",
  },
  {
    desc: "Schedule job with at: run in 1 hour.",
    points: 20,
    cmds: ["echo '/path/to/script.sh' | at now + 1 hour"],
    verify: ["atq"],
    hint: "at now + time schedules relative",
  },
  {
    desc: "List pending at jobs.",
    points: 10,
    cmds: ["atq"],
    verify: ["atq"],
    hint: "atq lists pending at jobs",
  },
  {
    desc: "Remove at job.",
    points: 15,
    cmds: ["atrm 1"],
    verify: ["atq"],
    hint: "atrm removes at job by number",
  },
  {
    desc: "View at job details.",
    points: 15,
    cmds: ["at -c 1"],
    verify: ["at -c 1 | head -20"],
    hint: "at -c shows job content",
  },
  {
    desc: "Check cron service status.",
    points: 10,
    cmds: ["systemctl status crond"],
    verify: ["systemctl status crond"],
    hint: "crond is cron daemon service",
  },
  {
    desc: "Restart cron service.",
    points: 15,
    cmds: ["systemctl restart crond"],
    verify: ["systemctl status crond"],
    hint: "Restart cron after config changes",
  },
  {
    desc: "View cron log.",
    points: 15,
    cmds: ["grep CRON /var/log/cron"],
    verify: ["grep CRON /var/log/cron | head -5"],
    hint: "Cron logs to /var/log/cron",
  },
  {
    desc: "Run job every hour on weekdays.",
    points: 20,
    cmds: ["(crontab -l; echo '0 * * * 1-5 /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep script.sh"],
    hint: "1-5 means Monday through Friday",
  },
  {
    desc: "Run job on weekends at 3am.",
    points: 20,
    cmds: ["(crontab -l; echo '0 3 * * 0,6 /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep script.sh"],
    hint: "0,6 means Sunday and Saturday",
  },
  {
    desc: "Run job every 10 minutes during business hours.",
    points: 25,
    cmds: ["(crontab -l; echo '*/10 9-17 * * 1-5 /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep script.sh"],
    hint: "9-17 for 9am to 5pm",
  },
  {
    desc: "Add MAILTO to crontab.",
    points: 20,
    cmds: ["(crontab -l; echo 'MAILTO=admin@example.com'; echo '30 2 * * * /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep MAILTO"],
    hint: "MAILTO sends cron output via email",
  },
  {
    desc: "Add PATH to crontab.",
    points: 20,
    cmds: ["(crontab -l; echo 'PATH=/usr/local/bin:/usr/bin:/bin'; echo '30 2 * * * script.sh') | crontab -"],
    verify: ["crontab -l | grep PATH"],
    hint: "Set PATH for cron environment",
  },
  {
    desc: "Run job on specific months.",
    points: 20,
    cmds: ["(crontab -l; echo '0 2 * 1,6,12 * /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep script.sh"],
    hint: "1,6,12 means January, June, December",
  },
  {
    desc: "Schedule job to run on reboot.",
    points: 20,
    cmds: ["(crontab -l; echo '@reboot /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep @reboot"],
    hint: "@reboot runs at system startup",
  },
  {
    desc: "Schedule job to run yearly.",
    points: 20,
    cmds: ["(crontab -l; echo '@yearly /path/to/script.sh') | crontab -"],
    verify: ["crontab -l | grep @yearly"],
    hint: "@yearly runs on Jan 1 at 00:00",
  },

  // ========== 1️⃣4️⃣ LOGGING & TIME (25 questions) ==========
  {
    desc: "View system logs.",
    points: 10,
    cmds: ["journalctl"],
    verify: ["journalctl | head -20"],
    hint: "journalctl shows system logs",
  },
  {
    desc: "View logs from current boot.",
    points: 10,
    cmds: ["journalctl -b"],
    verify: ["journalctl -b | head -20"],
    hint: "journalctl -b shows current boot",
  },
  {
    desc: "Follow logs in real time.",
    points: 10,
    cmds: ["journalctl -f"],
    verify: ["journalctl -f &"],
    hint: "journalctl -f follows logs",
  },
  {
    desc: "View logs for specific service.",
    points: 15,
    cmds: ["journalctl -u httpd"],
    verify: ["journalctl -u httpd | head -20"],
    hint: "journalctl -u shows service logs",
  },
  {
    desc: "View logs since yesterday.",
    points: 15,
    cmds: ["journalctl --since yesterday"],
    verify: ["journalctl --since yesterday | head -20"],
    hint: "--since filters by time",
  },
  {
    desc: "View logs with priority error.",
    points: 15,
    cmds: ["journalctl -p err"],
    verify: ["journalctl -p err | head -20"],
    hint: "-p filters by priority",
  },
  {
    desc: "Clear journal logs.",
    points: 20,
    cmds: ["journalctl --vacuum-time=2d"],
    verify: ["journalctl --disk-usage"],
    hint: "--vacuum-time removes old logs",
  },
  {
    desc: "Show journal disk usage.",
    points: 10,
    cmds: ["journalctl --disk-usage"],
    verify: ["journalctl --disk-usage"],
    hint: "--disk-usage shows log size",
  },
  {
    desc: "Enable persistent journal.",
    points: 20,
    cmds: ["mkdir -p /var/log/journal", "systemctl restart systemd-journald"],
    verify: ["ls -ld /var/log/journal"],
    hint: "Create /var/log/journal for persistence",
  },
  {
    desc: "View rsyslog configuration.",
    points: 10,
    cmds: ["cat /etc/rsyslog.conf"],
    verify: ["cat /etc/rsyslog.conf | head -30"],
    hint: "rsyslog config in /etc/rsyslog.conf",
  },
  {
    desc: "Restart rsyslog service.",
    points: 15,
    cmds: ["systemctl restart rsyslog"],
    verify: ["systemctl status rsyslog"],
    hint: "Restart rsyslog after config changes",
  },
  {
    desc: "Add custom log rule to rsyslog.",
    points: 25,
    cmds: ["echo 'local1.* /var/log/myapp.log' >> /etc/rsyslog.d/myapp.conf"],
    verify: ["tail -5 /etc/rsyslog.d/myapp.conf"],
    hint: "Add custom config to /etc/rsyslog.d/",
  },
  {
    desc: "Check system time.",
    points: 10,
    cmds: ["date"],
    verify: ["date"],
    hint: "date shows current time",
  },
  {
    desc: "Set system time.",
    points: 20,
    cmds: ["date -s '2024-01-15 14:30:00'"],
    verify: ["date"],
    hint: "date -s sets system time",
  },
  {
    desc: "Show timezone.",
    points: 10,
    cmds: ["timedatectl"],
    verify: ["timedatectl | grep Time"],
    hint: "timedatectl shows time info",
  },
  {
    desc: "Set timezone to America/New_York.",
    points: 20,
    cmds: ["timedatectl set-timezone America/New_York"],
    verify: ["timedatectl | grep Time"],
    hint: "timedatectl set-timezone",
  },
  {
    desc: "Set hardware clock from system clock.",
    points: 20,
    cmds: ["hwclock --systohc"],
    verify: ["hwclock"],
    hint: "hwclock --systohc syncs hardware clock",
  },
  {
    desc: "Set NTP time synchronization.",
    points: 25,
    cmds: ["timedatectl set-ntp true"],
    verify: ["timedatectl | grep NTP"],
    hint: "timedatectl set-ntp enables NTP",
  },
  {
    desc: "Disable NTP time synchronization.",
    points: 20,
    cmds: ["timedatectl set-ntp false"],
    verify: ["timedatectl | grep NTP"],
    hint: "set-ntp false disables NTP",
  },
  {
    desc: "Configure NTP server.",
    points: 30,
    cmds: [
      "sed -i 's/^#NTP=/NTP=time.server.com/' /etc/systemd/timesyncd.conf",
      "systemctl restart systemd-timesyncd"
    ],
    verify: ["cat /etc/systemd/timesyncd.conf | grep NTP"],
    hint: "Configure in /etc/systemd/timesyncd.conf",
  },
  {
    desc: "Check NTP synchronization.",
    points: 15,
    cmds: ["timedatectl status"],
    verify: ["timedatectl status | grep synchronized"],
    hint: "timedatectl shows sync status",
  },
  {
    desc: "View chrony sources.",
    points: 15,
    cmds: ["chronyc sources"],
    verify: ["chronyc sources"],
    hint: "chronyc sources shows NTP servers",
  },
  {
    desc: "Check chrony tracking.",
    points: 15,
    cmds: ["chronyc tracking"],
    verify: ["chronyc tracking"],
    hint: "chronyc tracking shows sync info",
  },
  {
    desc: "Force chrony time update.",
    points: 20,
    cmds: ["chronyc makestep"],
    verify: ["chronyc tracking"],
    hint: "chronyc makestep forces sync",
  },
  {
    desc: "View log rotation config.",
    points: 15,
    cmds: ["cat /etc/logrotate.conf"],
    verify: ["cat /etc/logrotate.conf | head -30"],
    hint: "logrotate config in /etc/logrotate.conf",
  },
  {
    desc: "Manually run log rotation.",
    points: 20,
    cmds: ["logrotate -f /etc/logrotate.conf"],
    verify: ["ls -l /var/log/*.gz"],
    hint: "logrotate -f forces rotation",
  },

  // ========== 1️⃣5️⃣ CONTAINERS (PODMAN) (25 questions) ==========
  {
    desc: "Pull container image.",
    points: 15,
    cmds: ["podman pull docker.io/library/nginx:latest"],
    verify: ["podman images"],
    hint: "podman pull downloads image",
  },
  {
    desc: "List images.",
    points: 10,
    cmds: ["podman images"],
    verify: ["podman images"],
    hint: "podman images lists local images",
  },
  {
    desc: "Run container.",
    points: 20,
    cmds: ["podman run -d --name mynginx nginx"],
    verify: ["podman ps"],
    hint: "podman run runs container",
  },
  {
    desc: "List running containers.",
    points: 10,
    cmds: ["podman ps"],
    verify: ["podman ps"],
    hint: "podman ps shows running containers",
  },
  {
    desc: "List all containers.",
    points: 10,
    cmds: ["podman ps -a"],
    verify: ["podman ps -a"],
    hint: "podman ps -a shows all containers",
  },
  {
    desc: "Stop container.",
    points: 15,
    cmds: ["podman stop mynginx"],
    verify: ["podman ps | grep mynginx || echo 'stopped'"],
    hint: "podman stop stops container",
  },
  {
    desc: "Start container.",
    points: 15,
    cmds: ["podman start mynginx"],
    verify: ["podman ps | grep mynginx"],
    hint: "podman start starts stopped container",
  },
  {
    desc: "Remove container.",
    points: 15,
    cmds: ["podman rm mynginx"],
    verify: ["podman ps -a | grep mynginx || echo 'removed'"],
    hint: "podman rm removes container",
  },
  {
    desc: "Remove image.",
    points: 15,
    cmds: ["podman rmi nginx"],
    verify: ["podman images | grep nginx || echo 'removed'"],
    hint: "podman rmi removes image",
  },
  {
    desc: "Run container with port mapping.",
    points: 25,
    cmds: ["podman run -d -p 8080:80 --name web nginx"],
    verify: ["podman port web"],
    hint: "-p host_port:container_port",
  },
  {
    desc: "Run container with volume.",
    points: 25,
    cmds: ["podman run -d -v /host/data:/container/data --name app nginx"],
    verify: ["podman inspect app | grep Mounts"],
    hint: "-v host_path:container_path",
  },
  {
    desc: "Execute command in running container.",
    points: 20,
    cmds: ["podman exec mynginx ls /usr/share/nginx/html"],
    verify: ["podman exec mynginx ls /usr/share/nginx/html"],
    hint: "podman exec runs command in container",
  },
  {
    desc: "Get container logs.",
    points: 15,
    cmds: ["podman logs mynginx"],
    verify: ["podman logs mynginx | head -20"],
    hint: "podman logs shows container output",
  },
  {
    desc: "Inspect container.",
    points: 15,
    cmds: ["podman inspect mynginx"],
    verify: ["podman inspect mynginx | head -30"],
    hint: "podman inspect shows container details",
  },
  {
    desc: "Commit container to image.",
    points: 25,
    cmds: ["podman commit mynginx myimage"],
    verify: ["podman images | grep myimage"],
    hint: "podman commit creates image from container",
  },
  {
    desc: "Build image from Dockerfile.",
    points: 30,
    cmds: ["podman build -t myapp ."],
    verify: ["podman images | grep myapp"],
    hint: "podman build builds image",
  },
  {
    desc: "Save image to file.",
    points: 20,
    cmds: ["podman save -o nginx.tar nginx"],
    verify: ["ls -l nginx.tar"],
    hint: "podman save exports image",
  },
  {
    desc: "Load image from file.",
    points: 20,
    cmds: ["podman load -i nginx.tar"],
    verify: ["podman images | grep nginx"],
    hint: "podman load imports image",
  },
  {
    desc: "Create pod.",
    points: 30,
    cmds: ["podman pod create --name mypod -p 8080:80"],
    verify: ["podman pod list"],
    hint: "podman pod creates pod",
  },
  {
    desc: "List pods.",
    points: 10,
    cmds: ["podman pod list"],
    verify: ["podman pod list"],
    hint: "podman pod list shows pods",
  },
  {
    desc: "Run container in pod.",
    points: 30,
    cmds: ["podman run -d --pod mypod --name nginx nginx"],
    verify: ["podman ps | grep nginx"],
    hint: "--pod adds container to pod",
  },
  {
    desc: "Generate systemd service for container.",
    points: 35,
    cmds: ["podman generate systemd --name mynginx --files --new"],
    verify: ["ls /etc/systemd/system/container-mynginx.service"],
    hint: "podman generate systemd creates service",
  },
  {
    desc: "Enable container as systemd service.",
    points: 35,
    cmds: ["systemctl --user enable --now container-mynginx"],
    verify: ["systemctl --user status container-mynginx"],
    hint: "systemctl --user manages user services",
  },
  {
    desc: "Check container resource usage.",
    points: 20,
    cmds: ["podman stats"],
    verify: ["podman stats"],
    hint: "podman stats shows resource usage",
  },
  {
    desc: "Prune unused containers/images.",
    points: 25,
    cmds: ["podman system prune -f"],
    verify: ["podman ps -a | wc -l"],
    hint: "podman system prune cleans up",
  },

  // ========== 1️⃣6️⃣ EXAM ENVIRONMENT SKILLS (25 questions) ==========
  {
    desc: "Search man page for keyword.",
    points: 10,
    cmds: ["man -k useradd"],
    verify: ["man -k useradd | head -5"],
    hint: "man -k searches man pages",
  },
  {
    desc: "Display specific man page section.",
    points: 15,
    cmds: ["man 5 passwd"],
    verify: ["man 5 passwd"],
    hint: "man section page shows specific section",
  },
  {
    desc: "Quick man page lookup.",
    points: 10,
    cmds: ["whatis ls"],
    verify: ["whatis ls"],
    hint: "whatis shows brief description",
  },
  {
    desc: "Use command completion.",
    points: 10,
    cmds: ["# Press Tab twice after typing partial command"],
    verify: ["# Should show completions"],
    hint: "Tab completes commands/filenames",
  },
  {
    desc: "View command history.",
    points: 10,
    cmds: ["history"],
    verify: ["history | tail -20"],
    hint: "history shows command history",
  },
  {
    desc: "Search history.",
    points: 10,
    cmds: ["history | grep apt"],
    verify: ["history | grep apt | head -5"],
    hint: "grep history for specific commands",
  },
  {
    desc: "Re-run previous command.",
    points: 10,
    cmds: ["!!"],
    verify: ["!!"],
    hint: "!! runs last command",
  },
  {
    desc: "Re-run command by number.",
    points: 15,
    cmds: ["!123"],
    verify: ["!123"],
    hint: "!number runs command from history",
  },
  {
    desc: "Create tmux session.",
    points: 20,
    cmds: ["tmux new -s mysession"],
    verify: ["tmux list-sessions"],
    hint: "tmux new -s creates session",
  },
  {
    desc: "Detach from tmux session.",
    points: 15,
    cmds: ["# Ctrl+b then d"],
    verify: ["tmux list-sessions"],
    hint: "Ctrl+b d detaches from tmux",
  },
  {
    desc: "Attach to tmux session.",
    points: 15,
    cmds: ["tmux attach -t mysession"],
    verify: ["tmux list-sessions"],
    hint: "tmux attach connects to session",
  },
  {
    desc: "Split tmux pane horizontally.",
    points: 20,
    cmds: ["# Ctrl+b then \""],
    verify: ["# Should split window"],
    hint: "Ctrl+b \" splits horizontally",
  },
  {
    desc: "Split tmux pane vertically.",
    points: 20,
    cmds: ["# Ctrl+b then %"],
    verify: ["# Should split window"],
    hint: "Ctrl+b % splits vertically",
  },
  {
    desc: "Switch tmux pane.",
    points: 15,
    cmds: ["# Ctrl+b then arrow key"],
    verify: ["# Should switch focus"],
    hint: "Ctrl+b arrow switches panes",
  },
  {
    desc: "Check disk space during exam.",
    points: 10,
    cmds: ["df -h"],
    verify: ["df -h"],
    hint: "Always check disk space",
  },
  {
    desc: "Check memory usage.",
    points: 10,
    cmds: ["free -h"],
    verify: ["free -h"],
    hint: "free shows memory usage",
  },
  {
    desc: "Check CPU load.",
    points: 10,
    cmds: ["uptime"],
    verify: ["uptime"],
    hint: "uptime shows load average",
  },
  {
    desc: "Verify service status.",
    points: 15,
    cmds: ["systemctl --failed"],
    verify: ["systemctl --failed"],
    hint: "Check failed services before submission",
  },
  {
    desc: "Verify firewall rules.",
    points: 15,
    cmds: ["firewall-cmd --list-all"],
    verify: ["firewall-cmd --list-all"],
    hint: "Verify firewall configuration",
  },
  {
    desc: "Verify SELinux status.",
    points: 15,
    cmds: ["getenforce"],
    verify: ["getenforce"],
    hint: "Check SELinux mode",
  },
  {
    desc: "Verify mounts.",
    points: 15,
    cmds: ["mount | grep important"],
    verify: ["mount | grep important"],
    hint: "Verify important mounts",
  },
  {
    desc: "Verify users/groups.",
    points: 15,
    cmds: ["id username"],
    verify: ["id username"],
    hint: "Verify user/group assignments",
  },
  {
    desc: "Test network connectivity.",
    points: 15,
    cmds: ["ping -c 3 8.8.8.8"],
    verify: ["ping -c 3 8.8.8.8"],
    hint: "Test network before submission",
  },
  {
    desc: "Check time sync.",
    points: 15,
    cmds: ["timedatectl status"],
    verify: ["timedatectl status"],
    hint: "Verify time synchronization",
  },
  {
    desc: "Final verification command.",
    points: 20,
    cmds: ["systemctl --failed && getenforce && firewall-cmd --list-all && df -h"],
    verify: ["systemctl --failed"],
    hint: "Run comprehensive check before submit",
  },
];

// ========== REST OF THE FUNCTIONS (same as before) ==========

function selectRandomTasks() {
  const selected = [];
  assignCategoriesToPool();
  sanitizeCommandPatterns();
  generateCanonicalAnswers();

  const poolCopy = selectedCategory === "all"
    ? [...questionPool]
    : questionPool.filter((q) => q.category === selectedCategory);

  const numTarget = 20;
  const shuffled = poolCopy.slice().sort(() => Math.random() - 0.5);
  const seen = new Set();

  for (let i = 0; i < shuffled.length && selected.length < numTarget; i++) {
    const q = shuffled[i];
    const rawDesc = (q.desc || "").trim();
    const normalizedDesc = rawDesc
      .replace(/\s*\((?:variant|cross-cat variant)[^)]+\)/gi, "")
      .trim();
    const canonicalKey = Array.isArray(q.canonical) && q.canonical[0]
      ? q.canonical[0]
      : Array.isArray(q.cmds)
      ? q.cmds.join("||")
      : "";
    const key = `${normalizedDesc}||${canonicalKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(q);
  }

  return selected.map((task, idx) => ({
    id: idx + 1,
    description: task.desc,
    points: task.points,
    expectedCommands: task.cmds,
    verifyCommands: task.verify,
    hint: task.hint,
    submitted: false,
    solution: "",
    score: 0,
    status: "",
  }));
}

function startExam() {
  tasks = selectRandomTasks();
  examSubmitted = false;
  timeRemaining = 9000;

  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("examInterface").classList.remove("hidden");
  document.getElementById("examNumber").textContent = `Exam #${currentExamNumber}`;

  renderTasks();
  startTimer();
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = tasks
    .map(
      (task) => `
        <div class="task-card ${task.submitted ? "submitted" : ""}" id="task-${task.id}">
          <div class="task-number">Task ${task.id}</div>
          <div class="task-description">${task.description}</div>
          <div class="task-points">Points: ${task.points}</div>
          
          <div class="solution-input">
            <textarea 
              class="solution-textarea" 
              id="solution-${task.id}" 
              placeholder="Enter your commands here (one per line)...&#10;Example:&#10;useradd john&#10;passwd john&#10;id john"
              ${task.submitted ? "disabled" : ""}
            >${task.solution || ""}</textarea>
            
            <button 
              class="submit-solution-btn" 
              onclick="submitSolution(${task.id})"
              ${task.submitted ? "disabled" : ""}
            >
              ${task.submitted ? "✓ Submitted" : "📤 Submit Solution"}
            </button>

            <button class="hint-toggle" onclick="toggleHint(${task.id}, this)" style="margin-left:10px;">Show Hint</button>
            <button class="hint-toggle" onclick="toggleAnswer(${task.id}, this)" style="margin-left:8px;">Show Answer</button>
            
            <div class="solution-status ${task.status || ""}" id="status-${task.id}">
              ${task.statusMessage || ""}
            </div>
          </div>
          
          <div class="hint-box" id="hint-${task.id}">
            💡 Hint: ${task.hint}
          </div>
          <div class="answer-box" id="answer-${task.id}">
            ${task.expectedCommands ? task.expectedCommands.join("\n") : ""}
          </div>
        </div>
      `
    )
    .join("");
  updateProgress();
}

function submitSolution(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  const solution = document.getElementById(`solution-${taskId}`).value.trim();

  if (!solution) {
    alert("Please enter your solution commands!");
    return;
  }

  task.solution = solution;
  task.submitted = true;

  const result = checkSolution(task, solution);
  task.score = result.score;
  task.status = result.status;
  task.statusMessage = result.message;

  renderTasks();
}

function checkSolution(task, solution) {
  const solutionLines = solution
    .toLowerCase()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const expectedCommands = task.expectedCommands.map((cmd) => cmd.toLowerCase());

  let matchedCommands = 0;
  let totalRequired = expectedCommands.length;

  expectedCommands.forEach((expected) => {
    const matched = solutionLines.some((line) => {
      const essentialParts = expected
        .split(" ")
        .map((p) => p.trim())
        .filter((part) => part && !part.includes("..."));
      return essentialParts.every((part) => line.includes(part));
    });
    if (matched) matchedCommands++;
  });

  const percentage = matchedCommands / totalRequired;
  let score, status, message;

  if (percentage >= 0.9) {
    score = task.points;
    status = "correct";
    message = `✅ CORRECT! Full marks: ${task.points}/${task.points} points`;
  } else if (percentage >= 0.5) {
    score = Math.floor(task.points * 0.5);
    status = "partial";
    message = `⚠️ PARTIAL: ${score}/${task.points} points. Missing some commands. Matched: ${matchedCommands}/${totalRequired}`;
  } else {
    score = 0;
    status = "incorrect";
    message = `❌ INCORRECT: 0/${task.points} points. Key commands missing. Matched: ${matchedCommands}/${totalRequired}`;
  }

  return { score, status, message };
}

function updateProgress() {
  const submitted = tasks.filter((t) => t.submitted).length;
  const currentScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);

  document.getElementById("submittedCount").textContent = `${submitted}/20`;
  document.getElementById("currentScore").textContent = `${currentScore}/300`;

  const progress = (submitted / 20) * 100;
  document.getElementById("progressBar").style.width = `${progress}%`;
}

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      alert("⏰ Time is up! Exam will be submitted automatically.");
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const display = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const timerEl = document.getElementById("timerDisplay");
  timerEl.textContent = display;

  document.getElementById("timeRemaining").textContent = `${Math.floor(timeRemaining / 60)} min`;

  if (timeRemaining <= 900) {
    timerEl.className = "timer-display critical";
  } else if (timeRemaining <= 1800) {
    timerEl.className = "timer-display warning";
  } else {
    timerEl.className = "timer-display";
  }
}

function submitExam() {
  if (examSubmitted) return;

  const unanswered = tasks.filter((t) => !t.submitted).length;

  if (unanswered > 0) {
    if (!confirm(`⚠️ Warning: ${unanswered} task(s) not submitted!\n\nUnanswered tasks will score 0 points.\n\nSubmit exam anyway?`)) {
      return;
    }
  } else {
    if (!confirm("📤 Submit exam for grading?\n\nYou cannot change answers after submission.")) {
      return;
    }
  }

  examSubmitted = true;
  clearInterval(timerInterval);

  const totalScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
  const timeUsed = 9000 - timeRemaining;

  examHistory.push({
    examNumber: currentExamNumber,
    score: totalScore,
    passed: totalScore >= 210,
    date: new Date().toISOString(),
    timeUsed: timeUsed,
    tasks: tasks.map((t) => ({
      id: t.id,
      description: t.description,
      points: t.points,
      score: t.score || 0,
      status: t.submitted ? t.status : "unanswered",
    })),
  });

  saveHistory();
  currentExamNumber++;

  showResults();
}

function showResults() {
  const totalScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
  const passed = totalScore >= 210;

  document.getElementById("finalScore").textContent = `${totalScore}/300`;
  document.getElementById("finalScore").style.color = passed ? "#059669" : "#dc2626";

  const passBadge = document.getElementById("passBadge");
  if (passed) {
    passBadge.className = "pass-badge passed";
    passBadge.innerHTML = `🎉 PASSED! You scored ${Math.round((totalScore / 300) * 100)}%`;
  } else {
    passBadge.className = "pass-badge failed";
    passBadge.innerHTML = `❌ FAILED. You need 210+ to pass (${Math.round((totalScore / 300) * 100)}%)`;
  }

  const breakdown = document.getElementById("resultBreakdown");
  breakdown.innerHTML = tasks
    .map((task) => {
      let itemClass, icon, scoreText;

      if (!task.submitted) {
        itemClass = "unanswered";
        icon = "○";
        scoreText = `0/${task.points}`;
      } else if (task.status === "correct") {
        itemClass = "correct";
        icon = "✓";
        scoreText = `${task.score}/${task.points}`;
      } else if (task.status === "partial") {
        itemClass = "partial";
        icon = "◐";
        scoreText = `${task.score}/${task.points}`;
      } else {
        itemClass = "incorrect";
        icon = "✗";
        scoreText = `0/${task.points}`;
      }

      return `
        <div class="result-item ${itemClass}">
          <div>
            <strong>${icon} Task ${task.id}:</strong> ${task.description.substring(0, 60)}...
            ${!task.submitted ? '<br><small style="color: #6b7280;">Not answered</small>' : ""}
          </div>
          <div style="font-weight: bold; font-size: 18px;">
            ${scoreText}
          </div>
        </div>
      `;
    })
    .join("");

  const correct = tasks.filter((t) => t.status === "correct").length;
  const partial = tasks.filter((t) => t.status === "partial").length;
  const incorrect = tasks.filter((t) => t.status === "incorrect").length;
  const unanswered = tasks.filter((t) => !t.submitted).length;

  breakdown.innerHTML += `
    <div style="margin-top: 20px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
      <div style="font-weight: bold; margin-bottom: 10px; font-size: 18px;">Summary:</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="color: #059669;">✓ Correct: ${correct}</div>
        <div style="color: #d97706;">◐ Partial: ${partial}</div>
        <div style="color: #dc2626;">✗ Incorrect: ${incorrect}</div>
        <div style="color: #6b7280;">○ Unanswered: ${unanswered}</div>
      </div>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e2e8f0;">
        <div style="font-size: 16px; color: #2d3748;">
          <strong>Time Used:</strong> ${Math.floor((9000 - timeRemaining) / 60)} minutes
        </div>
        <div style="font-size: 14px; color: #718096; margin-top: 5px;">
          Average: ${(() => {
            const submittedCount = tasks.filter((t) => t.submitted).length;
            if (!submittedCount) return "N/A";
            return ((9000 - timeRemaining) / 60 / submittedCount).toFixed(1) + " min/task";
          })()}
        </div>
      </div>
    </div>
  `;

  document.getElementById("resultsModal").classList.add("active");
}

function restartExam() {
  document.getElementById("resultsModal").classList.remove("active");
  document.getElementById("examInterface").classList.add("hidden");
  document.getElementById("welcomeScreen").classList.remove("hidden");
  displayHistory();
}

function reviewExam() {
  document.getElementById("resultsModal").classList.remove("active");

  tasks.forEach((task) => {
    const card = document.getElementById(`task-${task.id}`);
    if (!task.submitted) {
      card.style.border = "3px solid #6b7280";
      card.style.background = "#f9fafb";
    } else if (task.status === "incorrect") {
      card.style.border = "3px solid #f56565";
      card.style.background = "#fff5f5";
    } else if (task.status === "partial") {
      card.style.border = "3px solid #f59e0b";
      card.style.background = "#fffbeb";
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function downloadResults() {
  const totalScore = tasks.reduce((sum, t) => sum + (t.score || 0), 0);
  const passed = totalScore >= 210;
  const timeUsed = Math.floor((9000 - timeRemaining) / 60);

  let report = `RHCSA EX200 Exam Results - Exam #${currentExamNumber - 1}\n`;
  report += `=================================================\n\n`;
  report += `Date: ${new Date().toLocaleString()}\n`;
  report += `Final Score: ${totalScore}/300 (${Math.round((totalScore / 300) * 100)}%)\n`;
  report += `Result: ${passed ? "PASSED ✓" : "FAILED ✗"}\n`;
  report += `Passing Score: 210/300 (70%)\n`;
  report += `Time Used: ${timeUsed} minutes\n\n`;
  report += `Task Breakdown:\n`;
  report += `===============\n\n`;

  tasks.forEach((task) => {
    const status = !task.submitted
      ? "UNANSWERED"
      : task.status === "correct"
      ? "CORRECT"
      : task.status === "partial"
      ? "PARTIAL"
      : "INCORRECT";

    report += `Task ${task.id}: ${status} - ${task.score || 0}/${task.points} points\n`;
    report += `Description: ${task.description}\n`;
    if (task.solution) {
      report += `Your Solution:\n${task.solution}\n`;
    }
    report += `\n`;
  });

  const correct = tasks.filter((t) => t.status === "correct").length;
  const partial = tasks.filter((t) => t.status === "partial").length;
  const incorrect = tasks.filter((t) => t.status === "incorrect").length;
  const unanswered = tasks.filter((t) => !t.submitted).length;

  report += `\nSummary Statistics:\n`;
  report += `===================\n`;
  report += `Correct: ${correct}\n`;
  report += `Partial: ${partial}\n`;
  report += `Incorrect: ${incorrect}\n`;
  report += `Unanswered: ${unanswered}\n`;

  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `RHCSA_Exam_${currentExamNumber - 1}_${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

window.addEventListener("beforeunload", (e) => {
  if (timerInterval && !examSubmitted) {
    e.preventDefault();
    e.returnValue = "Exam in progress! Are you sure you want to leave?";
  }
});

loadHistory();
assignCategoriesToPool();