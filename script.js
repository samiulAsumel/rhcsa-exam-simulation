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

// ONLY EX200 QUESTION POOL - RED HAT STANDARD (200 questions)
const questionPool = [
  // SYSTEM ACCESS, FILES & PERMISSIONS (1–40)
  {
    desc: "Create directory /srv/team with group ownership set to teamgrp, permissions set to 2770 (SGID enabled).",
    points: 15,
    cmds: [
      "mkdir -p /srv/team",
      "groupadd teamgrp",
      "chgrp teamgrp /srv/team",
      "chmod 2770 /srv/team",
    ],
    verify: ["ls -ld /srv/team"],
    hint: "Use chmod 2770 to set SGID, chgrp to set group",
  },
  {
    desc: "Ensure files created in /srv/team inherit group teamgrp ownership.",
    points: 10,
    cmds: [
      "touch /srv/team/testfile",
      "ls -l /srv/team/testfile",
    ],
    verify: ["ls -l /srv/team/testfile | grep teamgrp"],
    hint: "SGID bit (chmod 2770) ensures group inheritance",
  },
  {
    desc: "Create directory /secure/logs with permissions 700 (readable only by owner).",
    points: 10,
    cmds: ["mkdir -p /secure/logs", "chmod 700 /secure/logs"],
    verify: ["ls -ld /secure/logs"],
    hint: "chmod 700 = rwx------ (owner only access)",
  },
  {
    desc: "Copy all lines containing 'nologin' from /etc/passwd to /root/nologin.txt.",
    points: 10,
    cmds: ["grep nologin /etc/passwd > /root/nologin.txt"],
    verify: ["wc -l /root/nologin.txt"],
    hint: "grep filters and copies matching lines",
  },
  {
    desc: "Find all regular files larger than 50MB under /var and save their paths to /root/largefiles.",
    points: 15,
    cmds: ["find /var -type f -size +50M 2>/dev/null > /root/largefiles"],
    verify: ["wc -l /root/largefiles"],
    hint: "find /var -type f -size +50M",
  },
  {
    desc: "Create a symbolic link named /tmp/hosts.sym pointing to /etc/hosts.",
    points: 10,
    cmds: ["ln -s /etc/hosts /tmp/hosts.sym"],
    verify: ["ls -l /tmp/hosts.sym"],
    hint: "ln -s target link_name",
  },
  {
    desc: "Create a hard link named /tmp/hosts.hard pointing to /etc/hosts.",
    points: 10,
    cmds: ["ln /etc/hosts /tmp/hosts.hard"],
    verify: ["ls -li /etc/hosts /tmp/hosts.hard"],
    hint: "ln source destination (without -s)",
  },
  {
    desc: "Remove all empty files under /tmp/testdata directory.",
    points: 10,
    cmds: ["find /tmp/testdata -type f -empty -delete"],
    verify: ["find /tmp/testdata -type f -empty"],
    hint: "find with -empty and -delete options",
  },
  {
    desc: "Set default ACL on /shared directory so others have no access to new files.",
    points: 15,
    cmds: ["setfacl -m d:o::--- /shared"],
    verify: ["getfacl /shared"],
    hint: "setfacl -m d:o::--- sets default no access for others",
  },
  {
    desc: "Set ACL granting user 'alice' read access to /data/report.txt.",
    points: 15,
    cmds: ["setfacl -m u:alice:r /data/report.txt"],
    verify: ["getfacl /data/report.txt"],
    hint: "setfacl -m u:username:permissions file",
  },
  {
    desc: "Remove all ACLs from /data/report.txt.",
    points: 10,
    cmds: ["setfacl -b /data/report.txt"],
    verify: ["getfacl /data/report.txt"],
    hint: "setfacl -b removes all ACL entries",
  },
  {
    desc: "Archive /usr/local directory using gzip compression to /root/local.tgz.",
    points: 15,
    cmds: ["tar -czf /root/local.tgz /usr/local"],
    verify: ["ls -lh /root/local.tgz"],
    hint: "tar -czf creates gzipped tar archive",
  },
  {
    desc: "Extract /root/local.tgz archive to /opt/restore directory.",
    points: 15,
    cmds: ["mkdir -p /opt/restore", "tar -xzf /root/local.tgz -C /opt/restore"],
    verify: ["ls /opt/restore"],
    hint: "tar -xzf archive -C destination",
  },
  {
    desc: "Search recursively for string 'PermitRootLogin' under /etc/ssh directory.",
    points: 10,
    cmds: ["grep -r PermitRootLogin /etc/ssh"],
    verify: ["grep -r PermitRootLogin /etc/ssh | wc -l"],
    hint: "grep -r for recursive search",
  },
  {
    desc: "Redirect only stderr of 'ls /nonexistent' command to /root/err.log.",
    points: 15,
    cmds: ["ls /nonexistent 2> /root/err.log"],
    verify: ["cat /root/err.log"],
    hint: "2> redirects stderr only",
  },
  {
    desc: "Display disk usage of /home directory sorted by size, human readable.",
    points: 10,
    cmds: ["du -sh /home/* | sort -h"],
    verify: ["du -sh /home/* | sort -h | tail -5"],
    hint: "du -sh for human readable, sort -h for human numeric sort",
  },
  {
    desc: "Set immutable attribute on /important/plan.txt file.",
    points: 15,
    cmds: ["chattr +i /important/plan.txt"],
    verify: ["lsattr /important/plan.txt"],
    hint: "chattr +i sets immutable flag",
  },
  {
    desc: "Remove immutable attribute from /important/plan.txt file.",
    points: 15,
    cmds: ["chattr -i /important/plan.txt"],
    verify: ["lsattr /important/plan.txt"],
    hint: "chattr -i removes immutable flag",
  },
  {
    desc: "Find all files owned by user 'natasha' and save their paths to /tmp/natasha.files.",
    points: 15,
    cmds: ["find / -user natasha -type f 2>/dev/null > /tmp/natasha.files"],
    verify: ["wc -l /tmp/natasha.files"],
    hint: "find / -user username -type f",
  },
  {
    desc: "Copy /etc/fstab to /root/fstab.bak preserving all permissions and timestamps.",
    points: 10,
    cmds: ["cp -p /etc/fstab /root/fstab.bak"],
    verify: ["ls -l /etc/fstab /root/fstab.bak"],
    hint: "cp -p preserves permissions and timestamps",
  },
  {
    desc: "Change ownership of all *.log files in /var/log to root:root.",
    points: 15,
    cmds: ["chown root:root /var/log/*.log"],
    verify: ["ls -l /var/log/*.log | head -5"],
    hint: "chown user:group pattern",
  },
  {
    desc: "Create directory /exam/readonly with permissions 755 (readable by everyone, writable only by owner).",
    points: 10,
    cmds: ["mkdir -p /exam/readonly", "chmod 755 /exam/readonly"],
    verify: ["ls -ld /exam/readonly"],
    hint: "chmod 755 = rwxr-xr-x (writable only by owner)",
  },
  {
    desc: "Create directory /exam/private with permissions 700 (accessible only by owner).",
    points: 10,
    cmds: ["mkdir -p /exam/private", "chmod 700 /exam/private"],
    verify: ["ls -ld /exam/private"],
    hint: "chmod 700 = rwx------",
  },
  {
    desc: "Count number of lines in /etc/services and save only the number to /root/services.count.",
    points: 10,
    cmds: ["wc -l /etc/services | awk '{print $1}' > /root/services.count"],
    verify: ["cat /root/services.count"],
    hint: "wc -l counts lines, awk extracts first field",
  },
  {
    desc: "Replace all occurrences of 'localhost' with 'node1' in /tmp/hostsfile.",
    points: 15,
    cmds: ["sed -i 's/localhost/node1/g' /tmp/hostsfile"],
    verify: ["grep localhost /tmp/hostsfile || echo 'none found'"],
    hint: "sed -i 's/old/new/g' file",
  },
  {
    desc: "Display inode usage of root filesystem.",
    points: 10,
    cmds: ["df -i /"],
    verify: ["df -i / | tail -1"],
    hint: "df -i shows inode usage",
  },
  {
    desc: "Find files modified in last 24 hours under /etc directory.",
    points: 15,
    cmds: ["find /etc -type f -mtime -1"],
    verify: ["find /etc -type f -mtime -1 | wc -l"],
    hint: "find -mtime -1 for last 24 hours",
  },
  {
    desc: "Compress /var/log/messages file using bzip2.",
    points: 10,
    cmds: ["bzip2 /var/log/messages"],
    verify: ["ls -lh /var/log/messages.bz2"],
    hint: "bzip2 file creates file.bz2",
  },
  {
    desc: "Restore compressed file /var/log/messages.bz2 into /restore/logs/messages.",
    points: 15,
    cmds: [
      "mkdir -p /restore/logs",
      "bunzip2 -c /var/log/messages.bz2 > /restore/logs/messages",
    ],
    verify: ["ls -lh /restore/logs/messages"],
    hint: "bunzip2 -c decompresses to stdout",
  },
  {
    desc: "Display SELinux context of /var/www/html directory.",
    points: 10,
    cmds: ["ls -Z /var/www/html"],
    verify: ["ls -Zd /var/www/html"],
    hint: "ls -Z shows SELinux context",
  },
  {
    desc: "Restore default SELinux context on /var/www/html recursively.",
    points: 15,
    cmds: ["restorecon -Rv /var/www/html"],
    verify: ["ls -Z /var/www/html"],
    hint: "restorecon -R restores context recursively",
  },
  {
    desc: "Mount /dev/sdb1 filesystem temporarily at /mnt/test.",
    points: 15,
    cmds: ["mount /dev/sdb1 /mnt/test"],
    verify: ["mount | grep /mnt/test"],
    hint: "mount device mountpoint",
  },
  {
    desc: "Unmount /mnt/test filesystem.",
    points: 10,
    cmds: ["umount /mnt/test"],
    verify: ["mount | grep /mnt/test || echo 'not mounted'"],
    hint: "umount mountpoint",
  },
  {
    desc: "Create file /data/sample and set permissions to 640 (rw-r-----).",
    points: 10,
    cmds: ["touch /data/sample", "chmod 640 /data/sample"],
    verify: ["ls -l /data/sample"],
    hint: "chmod 640 = rw-r-----",
  },
  {
    desc: "Show numeric UID and GID for user root.",
    points: 10,
    cmds: ["id -u root", "id -g root"],
    verify: ["id root"],
    hint: "id -u for UID, id -g for GID",
  },
  {
    desc: "Display file system type of root filesystem (/).",
    points: 10,
    cmds: ["df -T / | tail -1 | awk '{print $2}'"],
    verify: ["df -T /"],
    hint: "df -T shows filesystem type",
  },
  {
    desc: "Create directory tree /data/a/b/c in one command.",
    points: 10,
    cmds: ["mkdir -p /data/a/b/c"],
    verify: ["ls -ld /data/a/b/c"],
    hint: "mkdir -p creates parent directories",
  },
  {
    desc: "Remove directory tree /data/a recursively and forcefully.",
    points: 10,
    cmds: ["rm -rf /data/a"],
    verify: ["ls -ld /data/a 2>/dev/null || echo 'removed'"],
    hint: "rm -rf removes recursively and forcefully",
  },
  {
    desc: "Show top 5 largest files under /usr directory.",
    points: 15,
    cmds: [
      "find /usr -type f -exec du -h {} + 2>/dev/null | sort -rh | head -5",
    ],
    verify: ["find /usr -type f -size +100M 2>/dev/null | wc -l"],
    hint: "find with du, sort -rh reverse human numeric",
  },
  {
    desc: "Create SHA256 checksum of /etc/passwd and store result in /root/passwd.sha.",
    points: 15,
    cmds: ["sha256sum /etc/passwd > /root/passwd.sha"],
    verify: ["cat /root/passwd.sha"],
    hint: "sha256sum file > output_file",
  },

  // USERS, GROUPS & AUTHENTICATION (41–80)
  {
    desc: "Create group 'opsgrp' with GID 4000.",
    points: 10,
    cmds: ["groupadd -g 4000 opsgrp"],
    verify: ["getent group opsgrp"],
    hint: "groupadd -g GID groupname",
  },
  {
    desc: "Create user 'alex' with UID 3001, primary group 'opsgrp'.",
    points: 15,
    cmds: ["useradd -u 3001 -g opsgrp alex"],
    verify: ["id alex"],
    hint: "useradd -u UID -g primary_group",
  },
  {
    desc: "Set password for user 'alex' to 'redhat'.",
    points: 10,
    cmds: ["echo 'alex:redhat' | chpasswd"],
    verify: ["su - alex -c 'whoami'"],
    hint: "echo 'user:password' | chpasswd",
  },
  {
    desc: "Configure password aging so user 'alex' password expires in 30 days.",
    points: 15,
    cmds: ["chage -M 30 alex"],
    verify: ["chage -l alex"],
    hint: "chage -M days username",
  },
  {
    desc: "Force user 'alex' to change password at next login.",
    points: 15,
    cmds: ["chage -d 0 alex"],
    verify: ["chage -l alex"],
    hint: "chage -d 0 forces password change",
  },
  {
    desc: "Lock user account 'tempuser'.",
    points: 10,
    cmds: ["passwd -l tempuser"],
    verify: ["passwd -S tempuser"],
    hint: "passwd -l username",
  },
  {
    desc: "Unlock user account 'tempuser'.",
    points: 10,
    cmds: ["passwd -u tempuser"],
    verify: ["passwd -S tempuser"],
    hint: "passwd -u username",
  },
  {
    desc: "Create user 'bob' without interactive shell (use /sbin/nologin).",
    points: 10,
    cmds: ["useradd -s /sbin/nologin bob"],
    verify: ["getent passwd bob"],
    hint: "useradd -s /sbin/nologin",
  },
  {
    desc: "Delete user 'testuser' but keep home directory.",
    points: 10,
    cmds: ["userdel testuser"],
    verify: ["id testuser 2>/dev/null || echo 'user deleted'"],
    hint: "userdel without -r keeps home",
  },
  {
    desc: "Add user 'sara' to secondary group 'wheel'.",
    points: 10,
    cmds: ["usermod -aG wheel sara"],
    verify: ["id sara"],
    hint: "usermod -aG group username",
  },
  {
    desc: "Verify group membership of user 'sara'.",
    points: 10,
    cmds: ["id sara"],
    verify: ["id sara | grep wheel"],
    hint: "id username shows group membership",
  },
  {
    desc: "Set default UMASK to 027 for all new users in /etc/login.defs.",
    points: 15,
    cmds: ["sed -i 's/^UMASK.*/UMASK 027/' /etc/login.defs"],
    verify: ["grep ^UMASK /etc/login.defs"],
    hint: "Edit UMASK in /etc/login.defs",
  },
  {
    desc: "Configure password policy so minimum password length is 10 characters.",
    points: 15,
    cmds: ["sed -i 's/^PASS_MIN_LEN.*/PASS_MIN_LEN 10/' /etc/login.defs"],
    verify: ["grep ^PASS_MIN_LEN /etc/login.defs"],
    hint: "Edit PASS_MIN_LEN in /etc/login.defs",
  },
  {
    desc: "Display last login information for user 'alex'.",
    points: 10,
    cmds: ["last alex"],
    verify: ["last alex | head -5"],
    hint: "last username",
  },
  {
    desc: "Set account expiration date for user 'demo' to December 31, 2025.",
    points: 15,
    cmds: ["chage -E 2025-12-31 demo"],
    verify: ["chage -l demo"],
    hint: "chage -E YYYY-MM-DD username",
  },
  {
    desc: "Create user 'john' with custom home directory /data/john.",
    points: 15,
    cmds: ["useradd -d /data/john -m john"],
    verify: ["ls -ld /data/john"],
    hint: "useradd -d /path -m creates home",
  },
  {
    desc: "Create group 'devgrp' and add users 'harry' and 'natasha' to it.",
    points: 15,
    cmds: [
      "groupadd devgrp",
      "usermod -aG devgrp harry",
      "usermod -aG devgrp natasha",
    ],
    verify: ["getent group devgrp", "id harry", "id natasha"],
    hint: "groupadd then usermod -aG",
  },
  {
    desc: "Change primary group of user 'harry' to 'devgrp'.",
    points: 15,
    cmds: ["usermod -g devgrp harry"],
    verify: ["id harry"],
    hint: "usermod -g new_primary_group username",
  },
  {
    desc: "Remove user 'copper' completely including home directory.",
    points: 15,
    cmds: ["userdel -r copper"],
    verify: ["id copper 2>/dev/null || echo 'user removed'"],
    hint: "userdel -r removes user and home",
  },
  {
    desc: "Verify sudo privileges for members of 'wheel' group.",
    points: 10,
    cmds: ["grep '^%wheel' /etc/sudoers"],
    verify: ["sudo -l -U testuser"],
    hint: "Check /etc/sudoers for wheel group",
  },
  {
    desc: "Configure sudo so members of 'admin' group need no password for sudo commands.",
    points: 15,
    cmds: [
      "echo '%admin ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/admin-nopass",
    ],
    verify: ["sudo -l -U adminuser"],
    hint: "Create file in /etc/sudoers.d/",
  },
  {
    desc: "Test sudo configuration safely without executing commands.",
    points: 10,
    cmds: ["sudo -k", "sudo -l"],
    verify: ["sudo -l"],
    hint: "sudo -l lists user privileges",
  },
  {
    desc: "Display failed login attempts using faillock.",
    points: 10,
    cmds: ["faillock --user"],
    verify: ["faillock"],
    hint: "faillock shows failed attempts",
  },
  {
    desc: "Expire all passwords immediately for users in group 'devgrp'.",
    points: 15,
    cmds: [
      "for user in $(getent group devgrp | cut -d: -f4 | tr ',' ' '); do chage -d 0 $user; done",
    ],
    verify: [
      "for user in $(getent group devgrp | cut -d: -f4 | tr ',' ' '); do chage -l $user | head -1; done",
    ],
    hint: "Loop through group members with chage -d 0",
  },
  {
    desc: "Create system account 'svcbackup' without interactive shell.",
    points: 10,
    cmds: ["useradd -r -s /sbin/nologin svcbackup"],
    verify: ["id svcbackup"],
    hint: "useradd -r creates system account",
  },
  {
    desc: "Prevent user 'svcbackup' from logging in interactively.",
    points: 10,
    cmds: ["usermod -s /sbin/nologin svcbackup"],
    verify: ["getent passwd svcbackup"],
    hint: "usermod -s /sbin/nologin",
  },
  {
    desc: "Set default password expiration for new users to 45 days in /etc/login.defs.",
    points: 15,
    cmds: ["sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS 45/' /etc/login.defs"],
    verify: ["grep ^PASS_MAX_DAYS /etc/login.defs"],
    hint: "Edit PASS_MAX_DAYS in /etc/login.defs",
  },
  {
    desc: "Show password aging information for user 'root'.",
    points: 10,
    cmds: ["chage -l root"],
    verify: ["chage -l root"],
    hint: "chage -l username",
  },
  {
    desc: "Create user 'testuser' without home directory.",
    points: 10,
    cmds: ["useradd -M testuser"],
    verify: [
      "getent passwd testuser",
      "ls -d /home/testuser 2>/dev/null || echo 'no home'",
    ],
    hint: "useradd -M creates no home",
  },
  {
    desc: "Create user 'bashuser' with shell /bin/bash.",
    points: 10,
    cmds: ["useradd -s /bin/bash bashuser"],
    verify: ["getent passwd bashuser"],
    hint: "useradd -s /bin/bash",
  },
  {
    desc: "Change shell of user 'bob' to /bin/bash.",
    points: 10,
    cmds: ["usermod -s /bin/bash bob"],
    verify: ["getent passwd bob"],
    hint: "usermod -s newshell username",
  },
  {
    desc: "List all local users with UID >= 1000 (regular users).",
    points: 15,
    cmds: ["awk -F: '$3 >= 1000 && $3 < 60000 {print $1}' /etc/passwd"],
    verify: ["awk -F: '$3 >= 1000 && $3 < 60000' /etc/passwd | wc -l"],
    hint: "awk to filter UID in /etc/passwd",
  },
  {
    desc: "Verify home directory permissions for user 'alex'.",
    points: 10,
    cmds: ["ls -ld /home/alex"],
    verify: ["ls -ld /home/alex"],
    hint: "ls -ld shows directory permissions",
  },
  {
    desc: "Copy /etc/skel contents to existing user 'existinguser' home directory.",
    points: 15,
    cmds: ["cp -r /etc/skel/. /home/existinguser/"],
    verify: ["ls -la /home/existinguser/"],
    hint: "cp -r /etc/skel/. destination/",
  },
  {
    desc: "Lock root account to prevent direct login.",
    points: 15,
    cmds: ["passwd -l root"],
    verify: ["passwd -S root"],
    hint: "passwd -l root",
  },
  {
    desc: "Unlock root account to allow login.",
    points: 15,
    cmds: ["passwd -u root"],
    verify: ["passwd -S root"],
    hint: "passwd -u root",
  },
  {
    desc: "Create group 'sharegrp' with automatically assigned GID.",
    points: 10,
    cmds: ["groupadd sharegrp"],
    verify: ["getent group sharegrp"],
    hint: "groupadd without -g uses next available GID",
  },
  {
    desc: "Remove user 'username' from secondary group 'groupname'.",
    points: 15,
    cmds: ["gpasswd -d username groupname"],
    verify: ["id username"],
    hint: "gpasswd -d user group",
  },
  {
    desc: "Display group database entry for 'opsgrp'.",
    points: 10,
    cmds: ["getent group opsgrp"],
    verify: ["getent group opsgrp"],
    hint: "getent group groupname",
  },
  {
    desc: "Verify PAM password policy settings in system-auth.",
    points: 15,
    cmds: ["grep pam_pwquality /etc/pam.d/system-auth"],
    verify: ["cat /etc/security/pwquality.conf"],
    hint: "Check /etc/pam.d/system-auth and /etc/security/pwquality.conf",
  },

  // NETWORKING & HOSTNAME (81–110)
  {
    desc: "Set system hostname to 'servera.lab.example.com'.",
    points: 15,
    cmds: ["hostnamectl set-hostname servera.lab.example.com"],
    verify: ["hostnamectl"],
    hint: "hostnamectl set-hostname",
  },
  {
    desc: "Configure static IPv4 address 192.168.1.100/24 with gateway 192.168.1.1 and DNS 8.8.8.8 using nmcli.",
    points: 20,
    cmds: [
      "nmcli con mod 'Wired connection 1' ipv4.addresses 192.168.1.100/24 ipv4.gateway 192.168.1.1 ipv4.dns 8.8.8.8 ipv4.method manual",
    ],
    verify: ["nmcli con show 'Wired connection 1'"],
    hint: "nmcli con mod with ipv4.method manual",
  },
  {
    desc: "Set gateway to 192.168.1.1 for 'Wired connection 1' using nmcli.",
    points: 15,
    cmds: ["nmcli con mod 'Wired connection 1' ipv4.gateway 192.168.1.1"],
    verify: ["nmcli con show 'Wired connection 1' | grep gateway"],
    hint: "nmcli con mod ipv4.gateway",
  },
  {
    desc: "Configure DNS server 172.24.254.254 for 'Wired connection 1'.",
    points: 15,
    cmds: ["nmcli con mod 'Wired connection 1' ipv4.dns 172.24.254.254"],
    verify: ["cat /etc/resolv.conf"],
    hint: "nmcli con mod ipv4.dns",
  },
  {
    desc: "Restart NetworkManager service.",
    points: 10,
    cmds: ["systemctl restart NetworkManager"],
    verify: ["systemctl status NetworkManager"],
    hint: "systemctl restart NetworkManager",
  },
  {
    desc: "Verify active network connections.",
    points: 10,
    cmds: ["nmcli con show --active"],
    verify: ["ip addr show"],
    hint: "nmcli con show --active",
  },
  {
    desc: "Display IP routing table.",
    points: 10,
    cmds: ["ip route"],
    verify: ["ip route"],
    hint: "ip route shows routing table",
  },
  {
    desc: "Disable IPv6 temporarily on all interfaces.",
    points: 15,
    cmds: ["sysctl -w net.ipv6.conf.all.disable_ipv6=1"],
    verify: ["sysctl net.ipv6.conf.all.disable_ipv6"],
    hint: "sysctl net.ipv6.conf.all.disable_ipv6=1",
  },
  {
    desc: "Enable IPv6 permanently by creating configuration file.",
    points: 15,
    cmds: [
      "echo 'net.ipv6.conf.all.disable_ipv6=0' > /etc/sysctl.d/ipv6.conf",
      "sysctl -p /etc/sysctl.d/ipv6.conf",
    ],
    verify: ["sysctl net.ipv6.conf.all.disable_ipv6"],
    hint: "Create /etc/sysctl.d/ file",
  },
  {
    desc: "Add secondary IPv4 address 192.168.1.101/24 to interface eth0 with label eth0:1.",
    points: 15,
    cmds: ["ip addr add 192.168.1.101/24 dev eth0 label eth0:1"],
    verify: ["ip addr show eth0"],
    hint: "ip addr add IP/MASK dev interface",
  },
  {
    desc: "Verify DNS resolution for google.com.",
    points: 10,
    cmds: ["nslookup google.com"],
    verify: ["dig google.com"],
    hint: "nslookup or dig for DNS testing",
  },
  {
    desc: "Configure network interface 'Wired connection 1' to start automatically at boot.",
    points: 15,
    cmds: ["nmcli con mod 'Wired connection 1' connection.autoconnect yes"],
    verify: ["nmcli con show 'Wired connection 1' | grep autoconnect"],
    hint: "nmcli con mod connection.autoconnect yes",
  },
  {
    desc: "Bring network interface 'Wired connection 1' down and then up.",
    points: 15,
    cmds: [
      "nmcli con down 'Wired connection 1'",
      "nmcli con up 'Wired connection 1'",
    ],
    verify: ["nmcli con show --active"],
    hint: "nmcli con down/up",
  },
  {
    desc: "Test connectivity to gateway 192.168.1.1 with 3 ping packets.",
    points: 10,
    cmds: ["ping -c 3 192.168.1.1"],
    verify: ["ping -c 3 192.168.1.1"],
    hint: "ping -c count gateway",
  },
  {
    desc: "Display MAC address of interface eth0.",
    points: 10,
    cmds: ["ip link show eth0"],
    verify: ["ip link show eth0 | grep link/ether"],
    hint: "ip link show interface",
  },
  {
    desc: "Configure multiple DNS servers 8.8.8.8 and 8.8.4.4 for 'Wired connection 1'.",
    points: 15,
    cmds: ["nmcli con mod 'Wired connection 1' ipv4.dns '8.8.8.8 8.8.4.4'"],
    verify: ["cat /etc/resolv.conf"],
    hint: "nmcli con mod ipv4.dns 'server1 server2'",
  },
  {
    desc: "Set search domain 'example.com' for 'Wired connection 1'.",
    points: 15,
    cmds: ["nmcli con mod 'Wired connection 1' ipv4.dns-search example.com"],
    verify: ["cat /etc/resolv.conf"],
    hint: "nmcli con mod ipv4.dns-search",
  },
  {
    desc: "Verify DNS configuration in /etc/resolv.conf.",
    points: 10,
    cmds: ["cat /etc/resolv.conf"],
    verify: ["cat /etc/resolv.conf"],
    hint: "cat /etc/resolv.conf",
  },
  {
    desc: "Check listening TCP ports with process information.",
    points: 10,
    cmds: ["ss -tlnp"],
    verify: ["ss -tlnp"],
    hint: "ss -tlnp shows listening TCP ports",
  },
  {
    desc: "Allow TCP port 82 in firewall permanently.",
    points: 15,
    cmds: ["firewall-cmd --permanent --add-port=82/tcp"],
    verify: ["firewall-cmd --list-ports"],
    hint: "firewall-cmd --permanent --add-port",
  },
  {
    desc: "Reload firewall rules to apply changes.",
    points: 10,
    cmds: ["firewall-cmd --reload"],
    verify: ["firewall-cmd --list-all"],
    hint: "firewall-cmd --reload",
  },
  {
    desc: "Verify firewall configuration and all rules.",
    points: 10,
    cmds: ["firewall-cmd --list-all"],
    verify: ["firewall-cmd --list-all"],
    hint: "firewall-cmd --list-all",
  },
  {
    desc: "Remove firewall rule for TCP port 82 permanently.",
    points: 15,
    cmds: ["firewall-cmd --permanent --remove-port=82/tcp"],
    verify: ["firewall-cmd --list-ports | grep 82 || echo 'port removed'"],
    hint: "firewall-cmd --permanent --remove-port",
  },
  {
    desc: "Allow SSH service only from 192.168.1.0/24 subnet using firewall rich rule.",
    points: 20,
    cmds: [
      'firewall-cmd --permanent --add-rich-rule=\'rule family="ipv4" source address="192.168.1.0/24" service name="ssh" accept\'',
    ],
    verify: ["firewall-cmd --list-rich-rules"],
    hint: "firewall-cmd --add-rich-rule with source address",
  },
  {
    desc: "Verify SSH access control rich rules in firewall.",
    points: 10,
    cmds: ["firewall-cmd --list-rich-rules"],
    verify: ["firewall-cmd --list-rich-rules"],
    hint: "firewall-cmd --list-rich-rules",
  },
  {
    desc: "Display network interface statistics for eth0.",
    points: 10,
    cmds: ["ip -s link show eth0"],
    verify: ["ip -s link show eth0"],
    hint: "ip -s link show",
  },
  {
    desc: "Set MTU to 9000 on interface eth0.",
    points: 15,
    cmds: ["ip link set eth0 mtu 9000"],
    verify: ["ip link show eth0 | grep mtu"],
    hint: "ip link set interface mtu value",
  },
  {
    desc: "Verify MTU setting on interface eth0.",
    points: 10,
    cmds: ["ip link show eth0"],
    verify: ["ip link show eth0 | grep mtu"],
    hint: "ip link show interface",
  },
  {
    desc: "Disable NetworkManager management for interface eth0.",
    points: 15,
    cmds: ["nmcli dev set eth0 managed no"],
    verify: ["nmcli dev status | grep eth0"],
    hint: "nmcli dev set interface managed no",
  },
  {
    desc: "Re-enable NetworkManager management for interface eth0.",
    points: 15,
    cmds: ["nmcli dev set eth0 managed yes"],
    verify: ["nmcli dev status | grep eth0"],
    hint: "nmcli dev set interface managed yes",
  },

  // PACKAGES, SERVICES & SCHEDULING (111–150)
  {
    desc: "Configure YUM repository from URL http://repo.example.com/rhel9 with name 'exam' and no GPG check.",
    points: 20,
    cmds: [
      "cat > /etc/yum.repos.d/exam.repo << EOF\n[exam]\nname=Exam Repo\nbaseurl=http://repo.example.com/rhel9\nenabled=1\ngpgcheck=0\nEOF",
    ],
    verify: ["dnf repolist"],
    hint: "Create .repo file in /etc/yum.repos.d/",
  },
  {
    desc: "Verify repository availability and list enabled repos.",
    points: 10,
    cmds: ["dnf repolist"],
    verify: ["dnf repolist | grep exam"],
    hint: "dnf repolist",
  },
  {
    desc: "Install httpd package using dnf.",
    points: 15,
    cmds: ["dnf install -y httpd"],
    verify: ["rpm -q httpd"],
    hint: "dnf install -y package",
  },
  {
    desc: "Enable and start httpd service to run at boot.",
    points: 15,
    cmds: ["systemctl enable --now httpd"],
    verify: ["systemctl is-enabled httpd", "systemctl is-active httpd"],
    hint: "systemctl enable --now service",
  },
  {
    desc: "Verify httpd is listening on port 80.",
    points: 10,
    cmds: ["ss -tlnp | grep :80"],
    verify: ["curl -I http://localhost"],
    hint: "ss -tlnp shows listening ports",
  },
  {
    desc: "Stop and disable vsftpd service.",
    points: 15,
    cmds: ["systemctl disable --now vsftpd"],
    verify: ["systemctl is-enabled vsftpd", "systemctl is-active vsftpd"],
    hint: "systemctl disable --now service",
  },
  {
    desc: "Mask the 'bluetooth' service to prevent it from being started.",
    points: 15,
    cmds: ["systemctl mask bluetooth"],
    verify: ["systemctl status bluetooth"],
    hint: "systemctl mask prevents starting",
  },
  {
    desc: "Unmask the 'bluetooth' service.",
    points: 15,
    cmds: ["systemctl unmask bluetooth"],
    verify: ["systemctl status bluetooth"],
    hint: "systemctl unmask",
  },
  {
    desc: "Check service dependency tree for 'httpd' service.",
    points: 15,
    cmds: ["systemctl list-dependencies httpd"],
    verify: ["systemctl list-dependencies httpd"],
    hint: "systemctl list-dependencies",
  },
  {
    desc: "Verify 'httpd' service is enabled to start at boot.",
    points: 10,
    cmds: ["systemctl is-enabled httpd"],
    verify: ["systemctl is-enabled httpd"],
    hint: "systemctl is-enabled",
  },
  {
    desc: "Install package group 'Development Tools' using dnf.",
    points: 15,
    cmds: ["dnf group install -y 'Development Tools'"],
    verify: ["dnf group list installed"],
    hint: "dnf group install 'group name'",
  },
  {
    desc: "Remove 'telnet' package safely using dnf.",
    points: 15,
    cmds: ["dnf remove -y telnet"],
    verify: ["rpm -q telnet || echo 'removed'"],
    hint: "dnf remove -y package",
  },
  {
    desc: "Clean DNF cache to free up disk space.",
    points: 10,
    cmds: ["dnf clean all"],
    verify: ["ls /var/cache/dnf/"],
    hint: "dnf clean all",
  },
  {
    desc: "List all enabled repositories.",
    points: 10,
    cmds: ["dnf repolist enabled"],
    verify: ["dnf repolist enabled"],
    hint: "dnf repolist enabled",
  },
  {
    desc: "Roll back the last DNF transaction.",
    points: 20,
    cmds: ["dnf history undo last"],
    verify: ["dnf history"],
    hint: "dnf history undo transaction-id",
  },
  {
    desc: "Configure system as NTP client of classroom.example.com using chrony.",
    points: 20,
    cmds: [
      "dnf install -y chrony",
      "sed -i 's/^pool.*/server classroom.example.com iburst/' /etc/chrony.conf",
      "systemctl enable --now chronyd",
    ],
    verify: ["chronyc sources"],
    hint: "Edit /etc/chrony.conf and enable chronyd",
  },
  {
    desc: "Verify time synchronization status with chronyc.",
    points: 10,
    cmds: ["chronyc tracking"],
    verify: ["timedatectl"],
    hint: "chronyc tracking or timedatectl",
  },
  {
    desc: "Create cron job for user 'natasha' to run '/usr/bin/echo hello' daily at 14:23.",
    points: 15,
    cmds: [
      "(crontab -l -u natasha 2>/dev/null; echo '23 14 * * * /usr/bin/echo hello') | crontab -u natasha -",
    ],
    verify: ["crontab -l -u natasha"],
    hint: "crontab -u user -e or pipe to crontab",
  },
  {
    desc: "Verify cron jobs for user 'natasha'.",
    points: 10,
    cmds: ["crontab -l -u natasha"],
    verify: ["crontab -l -u natasha"],
    hint: "crontab -l -u user",
  },
  {
    desc: "Remove all cron jobs for user 'natasha'.",
    points: 15,
    cmds: ["crontab -r -u natasha"],
    verify: ["crontab -l -u natasha 2>/dev/null || echo 'no crontab'"],
    hint: "crontab -r -u user removes all jobs",
  },
  {
    desc: "Create at job scheduled 5 minutes from now to create file /tmp/at-test.",
    points: 15,
    cmds: ["echo '/usr/bin/touch /tmp/at-test' | at now + 5 minutes"],
    verify: ["atq"],
    hint: "echo 'command' | at time",
  },
  {
    desc: "List pending at jobs in queue.",
    points: 10,
    cmds: ["atq"],
    verify: ["atq"],
    hint: "atq shows pending jobs",
  },
  {
    desc: "Remove at job with job number 1.",
    points: 15,
    cmds: ["atrm 1"],
    verify: ["atq"],
    hint: "atrm job-number",
  },
  {
    desc: "Change tuned profile to 'default'.",
    points: 15,
    cmds: ["tuned-adm profile default"],
    verify: ["tuned-adm active"],
    hint: "tuned-adm profile profile-name",
  },
  {
    desc: "Verify active tuned profile.",
    points: 10,
    cmds: ["tuned-adm active"],
    verify: ["tuned-adm active"],
    hint: "tuned-adm active",
  },
  {
    desc: "Check system uptime and load average.",
    points: 10,
    cmds: ["uptime"],
    verify: ["uptime"],
    hint: "uptime",
  },
  {
    desc: "Display memory usage in human readable format.",
    points: 10,
    cmds: ["free -h"],
    verify: ["free -h"],
    hint: "free -h for human readable",
  },
  {
    desc: "Display CPU load average.",
    points: 10,
    cmds: ["top -bn1 | grep load"],
    verify: ["uptime"],
    hint: "top or uptime shows load average",
  },
  {
    desc: "Verify rsyslog service status.",
    points: 10,
    cmds: ["systemctl status rsyslog"],
    verify: ["systemctl is-active rsyslog"],
    hint: "systemctl status service",
  },
  {
    desc: "Restart rsyslog service.",
    points: 15,
    cmds: ["systemctl restart rsyslog"],
    verify: ["systemctl status rsyslog"],
    hint: "systemctl restart service",
  },
  {
    desc: "Enable persistent journal logging by creating /var/log/journal.",
    points: 15,
    cmds: ["mkdir -p /var/log/journal", "systemctl restart systemd-journald"],
    verify: ["ls -ld /var/log/journal"],
    hint: "Create /var/log/journal and restart journald",
  },
  {
    desc: "Verify log rotation configuration in /etc/logrotate.conf.",
    points: 15,
    cmds: ["cat /etc/logrotate.conf"],
    verify: ["ls /etc/logrotate.d/"],
    hint: "Check /etc/logrotate.conf and /etc/logrotate.d/",
  },
  {
    desc: "Create custom systemd service 'myservice' that runs /usr/local/bin/myscript.sh.",
    points: 20,
    cmds: [
      "cat > /etc/systemd/system/myservice.service << EOF\n[Unit]\nDescription=My Custom Service\n[Service]\nExecStart=/usr/local/bin/myscript.sh\n[Install]\nWantedBy=multi-user.target\nEOF",
    ],
    verify: ["systemctl daemon-reload", "systemctl cat myservice"],
    hint: "Create .service file in /etc/systemd/system/",
  },
  {
    desc: "Enable 'myservice' to start at boot.",
    points: 15,
    cmds: ["systemctl enable myservice"],
    verify: ["systemctl is-enabled myservice"],
    hint: "systemctl enable service",
  },
  {
    desc: "Start 'myservice' immediately.",
    points: 15,
    cmds: ["systemctl start myservice"],
    verify: ["systemctl is-active myservice"],
    hint: "systemctl start service",
  },
  {
    desc: "View logs for 'myservice' using journalctl.",
    points: 15,
    cmds: ["journalctl -u myservice"],
    verify: ["journalctl -u myservice -n 10"],
    hint: "journalctl -u service-name",
  },
  {
    desc: "Stop 'myservice' immediately.",
    points: 15,
    cmds: ["systemctl stop myservice"],
    verify: ["systemctl is-active myservice"],
    hint: "systemctl stop service",
  },
  {
    desc: "Disable 'myservice' from starting at boot.",
    points: 15,
    cmds: ["systemctl disable myservice"],
    verify: ["systemctl is-enabled myservice"],
    hint: "systemctl disable service",
  },
  {
    desc: "Remove 'myservice' completely from system.",
    points: 20,
    cmds: [
      "systemctl stop myservice",
      "systemctl disable myservice",
      "rm /etc/systemd/system/myservice.service",
      "systemctl daemon-reload",
    ],
    verify: [
      "systemctl status myservice 2>/dev/null || echo 'service removed'",
    ],
    hint: "Stop, disable, remove file, daemon-reload",
  },
  {
    desc: "Verify system clean state: check failed services, disk space, and listening ports.",
    points: 20,
    cmds: [
      "systemctl --failed",
      "journalctl -p err",
      "df -h",
      "ss -tlnp",
    ],
    verify: ["systemctl --failed | grep -v '0 loaded'"],
    hint: "Check failed services, errors, disk space, listening ports",
  },

  // STORAGE, LVM, SELINUX & CONTAINERS (151–200)
  {
    desc: "Create 512MiB swap partition on /dev/sdb starting at 1MiB.",
    points: 20,
    cmds: [
      "parted /dev/sdb mkpart primary linux-swap 1MiB 513MiB",
      "mkswap /dev/sdb1",
    ],
    verify: ["lsblk /dev/sdb1", "blkid /dev/sdb1"],
    hint: "Use parted to create swap partition, mkswap to format",
  },
  {
    desc: "Enable swap on /dev/sdb1 and add to /etc/fstab for persistence.",
    points: 15,
    cmds: [
      "swapon /dev/sdb1",
      "echo '/dev/sdb1 swap swap defaults 0 0' >> /etc/fstab",
    ],
    verify: ["swapon --show", "grep sdb1 /etc/fstab"],
    hint: "swapon and add to /etc/fstab",
  },
  {
    desc: "Verify swap usage with free command.",
    points: 10,
    cmds: ["free -h", "swapon --show"],
    verify: ["free -h | grep Swap"],
    hint: "free -h or swapon --show",
  },
  {
    desc: "Create physical volume on /dev/sdc1 and volume group 'datastore'.",
    points: 20,
    cmds: ["pvcreate /dev/sdc1", "vgcreate datastore /dev/sdc1"],
    verify: ["vgs datastore"],
    hint: "pvcreate then vgcreate",
  },
  {
    desc: "Create volume group 'datastore' with PE size 16MiB on /dev/sdc1.",
    points: 15,
    cmds: ["vgcreate -s 16M datastore /dev/sdc1"],
    verify: ["vgs datastore -o vg_extent_size"],
    hint: "vgcreate -s size_in_MB",
  },
  {
    desc: "Create logical volume 'database' with 50 extents in volume group 'datastore'.",
    points: 20,
    cmds: ["lvcreate -l 50 -n database datastore"],
    verify: ["lvs /dev/datastore/database"],
    hint: "lvcreate -l number_of_extents -n name vg_name",
  },
  {
    desc: "Format logical volume /dev/datastore/database with vfat filesystem.",
    points: 15,
    cmds: ["mkfs.vfat /dev/datastore/database"],
    verify: ["blkid /dev/datastore/database"],
    hint: "mkfs.vfat device",
  },
  {
    desc: "Mount logical volume /dev/datastore/database at /mnt/database permanently via /etc/fstab.",
    points: 20,
    cmds: [
      "mkdir -p /mnt/database",
      "echo '/dev/datastore/database /mnt/database vfat defaults 0 0' >> /etc/fstab",
      "mount -a",
    ],
    verify: ["mount | grep database", "df -h /mnt/database"],
    hint: "Add to /etc/fstab and mount -a",
  },
  {
    desc: "Resize logical volume /dev/datastore/database to 850MiB.",
    points: 20,
    cmds: ["lvresize -L 850M /dev/datastore/database"],
    verify: ["lvs /dev/datastore/database"],
    hint: "lvresize -L size device",
  },
  {
    desc: "Resize ext4 filesystem on /dev/datastore/database to use all available space.",
    points: 20,
    cmds: ["resize2fs /dev/datastore/database"],
    verify: ["df -h /mnt/database"],
    hint: "resize2fs for ext filesystems",
  },
  {
    desc: "Verify /mnt/database is mounted after testing fstab with mount -a.",
    points: 15,
    cmds: ["systemctl daemon-reload", "mount -a"],
    verify: ["mount | grep /mnt/database"],
    hint: "mount -a tests fstab entries",
  },
  {
    desc: "Display LVM structure: physical volumes, volume groups, and logical volumes.",
    points: 15,
    cmds: ["pvs", "vgs", "lvs"],
    verify: ["pvs && vgs && lvs"],
    hint: "pvs, vgs, lvs commands",
  },
  {
    desc: "Remove logical volume /dev/datastore/database safely.",
    points: 20,
    cmds: ["umount /mnt/database", "lvremove /dev/datastore/database"],
    verify: ["lvs | grep database || echo 'LV removed'"],
    hint: "Unmount first, then lvremove",
  },
  {
    desc: "Remove volume group 'datastore'.",
    points: 20,
    cmds: ["vgremove datastore"],
    verify: ["vgs | grep datastore || echo 'VG removed'"],
    hint: "vgremove vg_name",
  },
  {
    desc: "Check filesystem integrity on /dev/sda1.",
    points: 15,
    cmds: ["fsck /dev/sda1"],
    verify: ["fsck -N /dev/sda1"],
    hint: "fsck device (unmount first)",
  },
  {
    desc: "Set SELinux to enforcing mode permanently.",
    points: 15,
    cmds: [
      "setenforce 1",
      "sed -i 's/^SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config",
    ],
    verify: ["getenforce", "grep ^SELINUX /etc/selinux/config"],
    hint: "setenforce and edit config file",
  },
  {
    desc: "Verify SELinux mode is enforcing.",
    points: 10,
    cmds: ["getenforce", "sestatus"],
    verify: ["getenforce"],
    hint: "getenforce or sestatus",
  },
  {
    desc: "Allow HTTP service on non-standard TCP port 8080 via SELinux.",
    points: 20,
    cmds: ["semanage port -a -t http_port_t -p tcp 8080"],
    verify: ["semanage port -l | grep http_port_t"],
    hint: "semanage port -a -t type -p protocol port",
  },
  {
    desc: "Verify SELinux port labeling for HTTP ports.",
    points: 15,
    cmds: ["semanage port -l | grep http"],
    verify: ["semanage port -l | grep 8080"],
    hint: "semanage port -l",
  },
  {
    desc: "Restore default SELinux contexts on /var/www/html recursively.",
    points: 15,
    cmds: ["restorecon -Rv /var/www/html"],
    verify: ["ls -Z /var/www/html"],
    hint: "restorecon -R recursively",
  },
  {
    desc: "Create user 'devops' for rootless container operations.",
    points: 15,
    cmds: ["useradd devops", "echo 'devops:redhat' | chpasswd"],
    verify: ["id devops"],
    hint: "useradd and set password",
  },
  {
    desc: "Install podman container runtime.",
    points: 15,
    cmds: ["dnf install -y podman"],
    verify: ["podman --version"],
    hint: "dnf install podman",
  },
  {
    desc: "Pull container image 'ubi8/ubi' from registry.redhat.io.",
    points: 15,
    cmds: ["podman pull registry.redhat.io/ubi8/ubi"],
    verify: ["podman images"],
    hint: "podman pull image:tag",
  },
  {
    desc: "Run container named 'mycontainer' from ubi8 image in detached mode.",
    points: 20,
    cmds: [
      "podman run -d --name mycontainer registry.redhat.io/ubi8/ubi sleep infinity",
    ],
    verify: ["podman ps"],
    hint: "podman run -d --name container_name image command",
  },
  {
    desc: "Run container with host directory /host/path mapped to /container/path with SELinux context.",
    points: 20,
    cmds: [
      "podman run -d -v /host/path:/container/path:Z --name mycontainer registry.redhat.io/ubi8/ubi sleep infinity",
    ],
    verify: ["podman inspect mycontainer | grep Mounts"],
    hint: "podman run -v /host:/container:Z",
  },
  {
    desc: "Run container with two host directories mapped to container paths.",
    points: 20,
    cmds: [
      "podman run -d -v /host1:/container1:Z -v /host2:/container2:Z --name mycontainer registry.redhat.io/ubi8/ubi sleep infinity",
    ],
    verify: ["podman inspect mycontainer | grep -A2 Mounts"],
    hint: "Multiple -v options",
  },
  {
    desc: "Verify container 'mycontainer' is running.",
    points: 10,
    cmds: ["podman ps"],
    verify: ["podman ps | grep mycontainer"],
    hint: "podman ps shows running containers",
  },
  {
    desc: "Generate systemd unit file for container 'mycontainer'.",
    points: 20,
    cmds: ["podman generate systemd --name mycontainer --files --new"],
    verify: ["ls /etc/systemd/system/container-mycontainer.service"],
    hint: "podman generate systemd --name --files --new",
  },
  {
    desc: "Enable and start container 'mycontainer' as user systemd service.",
    points: 20,
    cmds: ["systemctl --user enable --now container-mycontainer.service"],
    verify: ["systemctl --user status container-mycontainer.service"],
    hint: "systemctl --user enable --now",
  },
  {
    desc: "Verify container starts automatically after reboot by enabling user systemd service.",
    points: 20,
    cmds: [
      "systemctl --user daemon-reload",
      "systemctl --user enable container-mycontainer.service",
    ],
    verify: ["systemctl --user is-enabled container-mycontainer.service"],
    hint: "Enable user systemd service",
  },
  {
    desc: "View logs for container 'mycontainer'.",
    points: 15,
    cmds: ["podman logs mycontainer"],
    verify: ["podman logs mycontainer | head -20"],
    hint: "podman logs container_name",
  },
  {
    desc: "Stop container 'mycontainer'.",
    points: 15,
    cmds: ["podman stop mycontainer"],
    verify: ["podman ps -a | grep mycontainer"],
    hint: "podman stop container_name",
  },
  {
    desc: "Remove container 'mycontainer'.",
    points: 15,
    cmds: ["podman rm mycontainer"],
    verify: ["podman ps -a | grep mycontainer || echo 'removed'"],
    hint: "podman rm container_name",
  },
  {
    desc: "Remove container image 'registry.redhat.io/ubi8/ubi'.",
    points: 15,
    cmds: ["podman rmi registry.redhat.io/ubi8/ubi"],
    verify: ["podman images | grep ubi || echo 'removed'"],
    hint: "podman rmi image_id_or_name",
  },
  {
    desc: "Verify no running containers.",
    points: 10,
    cmds: ["podman ps"],
    verify: ["podman ps | wc -l"],
    hint: "podman ps should show empty",
  },
  {
    desc: "Check SELinux labels on container volume directory /host/path.",
    points: 15,
    cmds: ["ls -Z /host/path"],
    verify: ["ls -Z /host/path"],
    hint: "ls -Z shows SELinux context",
  },
  {
    desc: "Adjust SELinux context for container access to /host/path directory.",
    points: 20,
    cmds: [
      "semanage fcontext -a -t container_file_t '/host/path(/.*)?'",
      "restorecon -Rv /host/path",
    ],
    verify: ["ls -Z /host/path"],
    hint: "Set container_file_t context",
  },
  {
    desc: "Verify access inside container 'mycontainer' to /container/path directory.",
    points: 15,
    cmds: ["podman exec mycontainer ls /container/path"],
    verify: ["podman exec mycontainer ls /container/path"],
    hint: "podman exec container_name command",
  },
  {
    desc: "Restart container service 'container-mycontainer.service' for user.",
    points: 15,
    cmds: ["systemctl --user restart container-mycontainer.service"],
    verify: ["systemctl --user status container-mycontainer.service"],
    hint: "systemctl --user restart",
  },
  {
    desc: "Disable container service 'container-mycontainer.service' for user.",
    points: 15,
    cmds: ["systemctl --user disable container-mycontainer.service"],
    verify: ["systemctl --user is-enabled container-mycontainer.service"],
    hint: "systemctl --user disable",
  },
  {
    desc: "Verify clean system state: check failed services, journal errors, listening ports, and disk usage.",
    points: 20,
    cmds: ["systemctl --failed", "journalctl -p 3 -xb", "ss -tlnp", "df -h"],
    verify: ["systemctl --failed | grep '0 loaded'"],
    hint: "Check system health after reboot",
  },
  {
    desc: "Check journal logs for errors in current boot.",
    points: 15,
    cmds: ["journalctl -p err -b"],
    verify: ["journalctl -p err -b | head -20"],
    hint: "journalctl -p priority -b (current boot)",
  },
  {
    desc: "Verify firewall doesn't block container ports and check container status.",
    points: 15,
    cmds: ["firewall-cmd --list-all", "podman ps"],
    verify: ["firewall-cmd --list-ports"],
    hint: "Check firewall rules and container status",
  },
  {
    desc: "Validate NTP time synchronization after reboot.",
    points: 15,
    cmds: ["timedatectl", "chronyc tracking"],
    verify: ["timedatectl | grep synchronized"],
    hint: "timedatectl shows time sync status",
  },
  {
    desc: "Validate all filesystem mounts after reboot.",
    points: 15,
    cmds: ["mount", "df -h"],
    verify: ["mount | grep /mnt/database", "df -h /mnt/database"],
    hint: "Check mounted filesystems",
  },
  {
    desc: "Validate swap is active after reboot.",
    points: 15,
    cmds: ["swapon --show", "free -h"],
    verify: ["swapon --show | grep sdb1"],
    hint: "swapon --show and free -h",
  },
  {
    desc: "Validate SELinux is in enforcing mode after reboot.",
    points: 15,
    cmds: ["getenforce", "sestatus"],
    verify: ["getenforce"],
    hint: "getenforce should show enforcing",
  },
  {
    desc: "Validate user logins for 'alice' and 'bob'.",
    points: 15,
    cmds: ["id alice", "id bob", "su - alice -c 'whoami'"],
    verify: ["id alice", "su - alice -c 'echo success'"],
    hint: "Test user existence and login",
  },
  {
    desc: "Validate sudo access for user 'alice'.",
    points: 15,
    cmds: ["sudo -l -U alice"],
    verify: ["sudo -l -U alice | grep ALL"],
    hint: "sudo -l -U username",
  },
  {
    desc: "Final system audit: check failed services, errors, disk space, ports, firewall, containers, and SELinux.",
    points: 25,
    cmds: [
      "systemctl --failed",
      "journalctl -p err -b",
      "df -h",
      "ss -tlnp",
      "firewall-cmd --list-all",
      "podman ps",
      "getenforce",
    ],
    verify: ["systemctl --failed | grep -v '0 loaded'", "df -h | grep -v 100%"],
    hint: "Comprehensive system check",
  },
];

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