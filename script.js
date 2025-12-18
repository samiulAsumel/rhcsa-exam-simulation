let timerInterval = null;
let timeRemaining = 9000;
let tasks = [];
let examSubmitted = false;
let examHistory = [];
let currentExamNumber = 1;

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

  // Calculate stats
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
    btn.textContent = el.classList.contains("visible")
      ? "Hide Hint"
      : "Show Hint";
}

function toggleAnswer(id, btn) {
  const el = document.getElementById(`answer-${id}`);
  if (!el) return;
  el.classList.toggle("visible");
  if (btn)
    btn.textContent = el.classList.contains("visible")
      ? "Hide Answer"
      : "Show Answer";
}

// MASSIVE QUESTION POOL (150+ unique questions)
// --- User-supplied EX200 tasks (inserted) ---
const questionPool = [
  {
    desc: "[servera] Configure static networking: 172.25.250.10/24 gateway 172.25.250.254 dns 172.24.254.254 hostname servera.lab.example.com",
    points: 15,
    cmds: [
      'nmcli connection modify "Wired connection 1" ipv4.addresses 172.25.250.10/24 ipv4.gateway 172.25.250.254 ipv4.dns 172.24.254.254',
      'nmcli connection modify "Wired connection 1" ipv4.method manual',
      'nmcli connection up "Wired connection 1"',
      "hostnamectl set-hostname servera.lab.example.com",
    ],
    verify: ["ip a", "hostnamectl"],
    hint: "Use nmcli to modify the connection, set ipv4.method to manual and set hostname with hostnamectl",
  },
  {
    desc: "[servera] Configure default repos to content.example.com (rht and errata)",
    points: 10,
    cmds: [
      "cat > /etc/yum.repos.d/exam.repo << EOF\n[demo1]\nname=demo1 repo\nbaseurl=http://content.example.com/rhel9.0/x86_64/rhcsa-practice/rht\nenabled=1\ngpgcheck=0\n\n[demo2]\nname=demo2 repo\nbaseurl=http://content.example.com/rhel9.0/x86_64/rhcsa-practice/errata\nenabled=1\ngpgcheck=0\nEOF",
      "dnf repolist",
    ],
    verify: ["dnf repolist"],
    hint: "Create a .repo file under /etc/yum.repos.d with baseurl entries",
  },
  {
    desc: "[servera] Create group sharegrp and users harry,natasha (secondary sharegrp) and copper (nologin); set password redhat",
    points: 15,
    cmds: [
      "groupadd sharegrp",
      "useradd -G sharegrp harry",
      "useradd -G sharegrp natasha",
      "useradd -s /sbin/nologin copper",
      'echo -e "redhat\nredhat" | passwd harry',
      'echo -e "redhat\nredhat" | passwd natasha',
      'echo -e "redhat\nredhat" | passwd copper',
    ],
    verify: ["getent group sharegrp", "id harry", "id natasha"],
    hint: "Use groupadd, useradd -G for secondary groups and useradd -s /sbin/nologin for no shell",
  },
  {
    desc: "[servera] Create collaborative directory /var/shares owned by sharegrp, perms 2770 (SGID)",
    points: 10,
    cmds: [
      "mkdir -p /var/shares",
      "chown :sharegrp /var/shares",
      "chmod 2770 /var/shares",
    ],
    verify: ["ls -ld /var/shares"],
    hint: "chown :GROUP and chmod 2770 to set SGID and restrict others",
  },
  {
    desc: "[servera] Extract all lines containing 'ich' from /usr/share/mime/packages/freedesktop.org.xml into /root/lines preserving order and no empty lines",
    points: 8,
    cmds: [
      "grep ich /usr/share/mime/packages/freedesktop.org.xml > /root/lines",
    ],
    verify: ["wc -l /root/lines", "head -n1 /root/lines"],
    hint: "Use grep and redirect output; grep preserves original order",
  },
  {
    desc: "[servera] Find files owned by natasha and save list to /tmp/output",
    points: 8,
    cmds: ["find / -user natasha -type f > /tmp/output"],
    verify: ["wc -l /tmp/output"],
    hint: "find / -user USER -type f",
  },
  {
    desc: "[servera] Create user fred with UID 3945 and password iamredhatman",
    points: 8,
    cmds: [
      "useradd -u 3945 fred",
      'echo -e "iamredhatman\niamredhatman" | passwd fred',
    ],
    verify: ["getent passwd fred"],
    hint: "useradd -u UID username and passwd to set password",
  },
  {
    desc: "[servera] Save lines containing 'nologin' from /etc/passwd to /root/strings",
    points: 6,
    cmds: ["grep nologin /etc/passwd > /root/strings"],
    verify: ["wc -l /root/strings"],
    hint: "Use grep and redirect",
  },
  {
    desc: "[servera] Configure chrony to use classroom.example.com as NTP server and enable chronyd",
    points: 10,
    cmds: [
      "dnf install -y chrony",
      "sed -i '/^server /d' /etc/chrony.conf; echo 'server classroom.example.com iburst' >> /etc/chrony.conf",
      "systemctl enable --now chronyd",
    ],
    verify: ["chronyc sources -v"],
    hint: "Add server to /etc/chrony.conf and enable chronyd",
  },
  {
    desc: "[servera] Configure cron for user natasha to run /bin/echo hello daily at 14:23",
    points: 6,
    cmds: [
      "crontab -u natasha -l 2>/dev/null | { cat; echo '23 14 * * * /bin/echo hello'; } | crontab -u natasha -",
    ],
    verify: ["crontab -l -u natasha"],
    hint: "Use crontab -u user -e or programmatically append line",
  },
  {
    desc: "[servera] Create backup /root/backup.tar.bz2 of /usr/local using bzip2 and ensure SELinux is enforcing",
    points: 12,
    cmds: [
      "tar -cjf /root/backup.tar.bz2 /usr/local",
      "setenforce 1 || true",
      "sed -i 's/^SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config",
    ],
    verify: ["ls -lh /root/backup.tar.bz2", "getenforce"],
    hint: "tar -cjf creates bzip2 archive; setenforce and update /etc/selinux/config for persistence",
  },
  {
    desc: "[servera] Create script /root/find.sh to copy files 30K-60K from /etc to /root/data",
    points: 10,
    cmds: [
      'cat > /root/find.sh << "EOF"\n#!/bin/bash\nDEST_DIR="/root/data"\nmkdir -p "$DEST_DIR"\nfind /etc -type f -size +30k -size -60k -exec cp {} "$DEST_DIR" ;\necho "Done"\nEOF',
      "chmod +x /root/find.sh",
    ],
    verify: ["ls -ld /root/find.sh", "wc -l /root/data 2>/dev/null || true"],
    hint: "Use find with -size and -exec cp to copy files to destination",
  },
  {
    desc: "[servera] Allow httpd to serve content on port 82 and open firewall/SELinux accordingly",
    points: 10,
    cmds: [
      "semanage port -a -t http_port_t -p tcp 82 || true",
      "firewall-cmd --permanent --add-port=82/tcp",
      "firewall-cmd --reload",
      "systemctl enable --now httpd",
    ],
    verify: ["ss -ltnp | grep :82", "semanage port -l | grep http"],
    hint: "semanage port -a, firewall-cmd --add-port, then start httpd",
  },
  {
    desc: "[servera] Set default password max days for new users to 30 days",
    points: 6,
    cmds: ["sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS   30/' /etc/login.defs"],
    verify: ["grep PASS_MAX_DAYS /etc/login.defs"],
    hint: "Edit /etc/login.defs PASS_MAX_DAYS to 30",
  },
  {
    desc: "[servera] Configure autofs to automount utility.lab.example.com:/netdir/remoteuser15 at /netdir/remoteuser15",
    points: 12,
    cmds: [
      "dnf install -y autofs",
      'echo "/netdir /etc/auto.ex200" >> /etc/auto.master',
      'echo "remoteuser15 -rw,sync utility.lab.example.com:/netdir/remoteuser15" > /etc/auto.ex200',
      "systemctl enable --now autofs",
    ],
    verify: ["ls /netdir/remoteuser15 || true"],
    hint: "Add an indirect map in /etc/auto.master and proper map file, then enable autofs",
  },
  {
    desc: "[serverb] Add additional 512MiB swap partition and enable at boot (do not remove existing swap)",
    points: 12,
    cmds: [
      "# Use parted to create partition then:",
      "parted /dev/vdb mkpart primary linux-swap 1001MB 1513MB || true",
      "udevadm settle",
      "mkswap /dev/vdb2",
      "swapon /dev/vdb2",
      'echo "/dev/vdb2 swap swap defaults 0 0" >> /etc/fstab',
    ],
    verify: ["swapon --show"],
    hint: "Create new partition, mkswap, swapon and add to /etc/fstab",
  },
  {
    desc: "[serverb] Create LV 'database' in VG 'datastore' with 50 extents and 16MiB extent size, format vfat and mount /mnt/database",
    points: 15,
    cmds: [
      "vgchange -ay datastore || true",
      "lvcreate -n database -l 50 datastore || true",
      "mkfs.vfat /dev/datastore/database || true",
      "mkdir -p /mnt/database",
      'echo "/dev/datastore/database /mnt/database vfat defaults 0 0" >> /etc/fstab',
      "mount -a",
    ],
    verify: ["lsblk", "df -h /mnt/database"],
    hint: "lvcreate -l 50 -n name VG, mkfs.vfat and add to /etc/fstab",
  },
  {
    desc: "[serverb] Resize LV 'database' to approximately 850MB (within 830-865MB)",
    points: 10,
    cmds: ["lvresize -L 850M -r /dev/datastore/database"],
    verify: ["lvdisplay /dev/datastore/database", "df -h /mnt/database"],
    hint: "lvresize -L SIZE -r resizes and resizes filesystem when supported",
  },
  {
    desc: "[serverb] Set tuned profile to default",
    points: 6,
    cmds: ["tuned-adm profile default"],
    verify: ["tuned-adm active"],
    hint: "tuned-adm profile default",
  },
  {
    desc: "[serverb] Configure sudoers: allow members of admin group to sudo without password",
    points: 6,
    cmds: [
      "echo '%admin ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/admin-nopass",
    ],
    verify: ["sudo -l -U someadmin 2>/dev/null || true"],
    hint: "Create /etc/sudoers.d file with %group ALL=(ALL) NOPASSWD: ALL",
  },
  {
    desc: "[container] Create podman container from registry.redhat.io/rsyslog, run as rootless user devops and map /opt/files -> /opt/incoming and /opt/processed -> /opt/outcoming; generate systemd user service container-demo1",
    points: 15,
    cmds: [
      "podman pull registry.redhat.io/rsyslog",
      "podman run -d --name container-demo1 -v /opt/files:/opt/incoming:Z -v /opt/processed:/opt/outcoming:Z --userns keep-id --user devops registry.redhat.io/rsyslog || true",
      "podman generate systemd --name container-demo1 --files --new --uidmap || true",
      "loginctl enable-linger devops || true",
    ],
    verify: ["podman ps -a"],
    hint: "Use podman run with volume mounts and podman generate systemd for user unit",
  },
  // Additional realistic EX200-style tasks added for higher fidelity practice
  {
    desc: "Create persistent /mnt/backup fstab entry using UUID for /dev/sdd1 and mount it",
    points: 12,
    cmds: [
      "blkid /dev/sdd1",
      "mkdir -p /mnt/backup",
      "echo 'UUID=$(blkid -s UUID -o value /dev/sdd1) /mnt/backup ext4 defaults 0 0' >> /etc/fstab",
      "mount -a",
    ],
    verify: ["mount | grep /mnt/backup", "grep /mnt/backup /etc/fstab"],
    hint: "Use blkid to get UUID and add an fstab line referencing UUID",
  },
  {
    desc: "Create systemd service /etc/systemd/system/healthcheck.service to run /usr/local/bin/health-check.sh and enable it",
    points: 12,
    cmds: [
      "cat > /etc/systemd/system/healthcheck.service << 'EOF'\n[Unit]\nDescription=Health Check Service\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/health-check.sh\n[Install]\nWantedBy=multi-user.target\nEOF",
      "chmod +x /usr/local/bin/health-check.sh || true",
      "systemctl daemon-reload",
      "systemctl enable --now healthcheck.service",
    ],
    verify: [
      "systemctl is-enabled healthcheck.service",
      "systemctl status healthcheck.service",
    ],
    hint: "Create a unit file, reload systemd and enable the service",
  },
  {
    desc: "Mount tmpfs at /run/cache with size=100M via /etc/fstab",
    points: 8,
    cmds: [
      "mkdir -p /run/cache",
      "echo 'tmpfs /run/cache tmpfs rw,size=100M 0 0' >> /etc/fstab",
      "mount -a",
    ],
    verify: ["mount | grep /run/cache"],
    hint: "Add a tmpfs line to /etc/fstab and mount -a",
  },
  {
    desc: "Configure firewall masquerading and enable forwarding in the public zone",
    points: 10,
    cmds: [
      "firewall-cmd --permanent --add-masquerade",
      "firewall-cmd --permanent --zone=public --add-forward-port=port=80:proto=tcp:toport=8080",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all | grep masquerade"],
    hint: "Use --add-masquerade and add-forward-port then reload",
  },
  {
    desc: "Add SSH public key to /home/alice/.ssh/authorized_keys for passwordless login (assume key provided)",
    points: 8,
    cmds: [
      "mkdir -p /home/alice/.ssh && chmod 700 /home/alice/.ssh",
      "echo '<public-key>' >> /home/alice/.ssh/authorized_keys && chmod 600 /home/alice/.ssh/authorized_keys",
      "chown -R alice:alice /home/alice/.ssh",
    ],
    verify: ["ls -l /home/alice/.ssh/authorized_keys"],
    hint: "Place the public key in authorized_keys with correct permissions and ownership",
  },
  {
    desc: "Create LUKS encrypted mapping for /dev/sdc1 as cryptdata and add to /etc/crypttab and /etc/fstab (mount at /secure)",
    points: 16,
    cmds: [
      "cryptsetup luksFormat /dev/sdc1 || true",
      "cryptsetup open /dev/sdc1 cryptdata || true",
      "mkfs.xfs /dev/mapper/cryptdata || true",
      "mkdir -p /secure",
      "echo 'cryptdata UUID=$(blkid -s UUID -o value /dev/sdc1) none luks' >> /etc/crypttab",
      "echo '/dev/mapper/cryptdata /secure xfs defaults 0 0' >> /etc/fstab",
      "systemctl daemon-reload",
    ],
    verify: ["lsblk | grep cryptdata", "grep cryptdata /etc/crypttab"],
    hint: "Use cryptsetup to create LUKS and add entry to /etc/crypttab and fstab",
  },
  {
    desc: "Create systemd timer backup.timer to run backup.service daily at 03:00",
    points: 10,
    cmds: [
      "cat > /etc/systemd/system/backup.service << 'EOF'\n[Unit]\nDescription=Daily Backup\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/backup.sh\nEOF",
      "cat > /etc/systemd/system/backup.timer << 'EOF'\n[Unit]\nDescription=Daily Backup Timer\n[Timer]\nOnCalendar=*-*-* 03:00:00\nPersistent=true\n[Install]\nWantedBy=timers.target\nEOF",
      "systemctl daemon-reload",
      "systemctl enable --now backup.timer",
    ],
    verify: ["systemctl list-timers | grep backup.timer"],
    hint: "Create .service and .timer units and enable the timer",
  },
  {
    desc: "Configure NFS export /srv/nfs to allow 192.168.50.0/24 and enable nfs-server",
    points: 12,
    cmds: [
      "mkdir -p /srv/nfs && chown nfsnobody:nfsnobody /srv/nfs",
      "echo '/srv/nfs 192.168.50.0/24(rw,sync,no_root_squash)' >> /etc/exports",
      "systemctl enable --now nfs-server",
      "exportfs -r",
      "firewall-cmd --permanent --add-service=nfs && firewall-cmd --reload",
    ],
    verify: ["exportfs -v | grep /srv/nfs"],
    hint: "Add export to /etc/exports, enable nfs-server and open firewall",
  },
  {
    desc: "Create user 'examuser' with skeleton files from /etc/skel and ensure home exists",
    points: 6,
    cmds: ["useradd -m -k /etc/skel examuser", "passwd examuser || true"],
    verify: ["getent passwd examuser", "ls -la /home/examuser"],
    hint: "useradd -m creates home and -k specify skeleton dir",
  },
  {
    desc: "Ensure SELinux boolean httpd_can_network_connect_db is on persistently",
    points: 6,
    cmds: ["setsebool -P httpd_can_network_connect_db on"],
    verify: ["getsebool httpd_can_network_connect_db"],
    hint: "setsebool -P boolean on",
  },
  // --- end inserted EX200 tasks ---
  // User Management (20 variations)
  {
    desc: "Create user 'john' with UID 2500, primary group 'developers', shell /bin/bash",
    points: 15,
    cmds: [
      "groupadd developers",
      "useradd -u 2500 -g developers -s /bin/bash john",
      "passwd john",
    ],
    verify: ["id john"],
    hint: "groupadd, useradd -u UID -g GROUP -s SHELL",
  },
  {
    desc: "Create user 'alice' with UID 3000, secondary groups 'wheel,sysadmin', home /home/alice",
    points: 15,
    cmds: ["groupadd sysadmin", "useradd -u 3000 -G wheel,sysadmin alice"],
    verify: ["id alice"],
    hint: "useradd -u UID -G groups (comma separated)",
  },
  {
    desc: "Create user 'bob' with password 'redhat123' that expires in 90 days",
    points: 10,
    cmds: ["useradd bob", "chage -M 90 bob"],
    verify: ["chage -l bob"],
    hint: "chage -M days username",
  },
  {
    desc: "Lock user 'tempuser' account so they cannot login",
    points: 10,
    cmds: ["passwd -l tempuser"],
    verify: ["passwd -S tempuser"],
    hint: "passwd -l username",
  },
  {
    desc: "Create user 'dave' with password expiry: max 60 days, min 5 days, warning 10 days",
    points: 15,
    cmds: ["useradd dave", "chage -M 60 -m 5 -W 10 dave"],
    verify: ["chage -l dave"],
    hint: "chage -M max -m min -W warn",
  },
  {
    desc: "Create user 'susan' with no home directory and nologin shell",
    points: 10,
    cmds: ["useradd -M -s /sbin/nologin susan"],
    verify: ["getent passwd susan"],
    hint: "useradd -M -s /sbin/nologin",
  },
  {
    desc: "Change user 'tom' UID to 4500 and home directory to /home/thomas",
    points: 15,
    cmds: ["usermod -u 4500 -d /home/thomas tom"],
    verify: ["id tom"],
    hint: "usermod -u UID -d /path",
  },
  {
    desc: "Create group 'developers' with GID 5000 and add users alice, bob, charlie",
    points: 15,
    cmds: ["groupadd -g 5000 developers", "usermod -aG developers alice"],
    verify: ["getent group developers"],
    hint: "groupadd -g GID, usermod -aG group user",
  },
  {
    desc: "Force user 'newuser' to change password at next login",
    points: 10,
    cmds: ["passwd -e newuser"],
    verify: ["chage -l newuser"],
    hint: "passwd -e username",
  },
  {
    desc: "Create user 'admin1' and add to wheel group for sudo access",
    points: 10,
    cmds: ["useradd admin1", "usermod -aG wheel admin1"],
    verify: ["id admin1"],
    hint: "usermod -aG wheel username",
  },
  {
    desc: "Create user 'operator' with UID 1500, shell /bin/ksh",
    points: 10,
    cmds: ["useradd -u 1500 -s /bin/ksh operator"],
    verify: ["id operator"],
    hint: "useradd -u UID -s SHELL",
  },
  {
    desc: "Delete user 'olduser' including home directory",
    points: 10,
    cmds: ["userdel -r olduser"],
    verify: ["id olduser"],
    hint: "userdel -r username",
  },
  {
    desc: "Create user 'readonly' with account expiring on 2025-12-31",
    points: 15,
    cmds: ["useradd readonly", "chage -E 2025-12-31 readonly"],
    verify: ["chage -l readonly"],
    hint: "chage -E YYYY-MM-DD",
  },
  {
    desc: "Unlock previously locked user 'tempuser'",
    points: 10,
    cmds: ["passwd -u tempuser"],
    verify: ["passwd -S tempuser"],
    hint: "passwd -u username",
  },
  {
    desc: "Create group 'dbadmin' with GID 6000",
    points: 10,
    cmds: ["groupadd -g 6000 dbadmin"],
    verify: ["getent group dbadmin"],
    hint: "groupadd -g GID",
  },
  {
    desc: "Add existing user 'john' to supplementary group 'dbadmin'",
    points: 10,
    cmds: ["usermod -aG dbadmin john"],
    verify: ["id john"],
    hint: "usermod -aG",
  },
  {
    desc: "Change user 'alice' primary group to 'developers'",
    points: 10,
    cmds: ["usermod -g developers alice"],
    verify: ["id alice"],
    hint: "usermod -g GROUP",
  },
  {
    desc: "Set password aging: minimum 3 days, maximum 120 days for user 'webadmin'",
    points: 15,
    cmds: ["useradd webadmin", "chage -m 3 -M 120 webadmin"],
    verify: ["chage -l webadmin"],
    hint: "chage -m MIN -M MAX",
  },
  {
    desc: "Create system user 'nginx' with UID below 1000, no home directory",
    points: 15,
    cmds: ["useradd -r -M -s /sbin/nologin nginx"],
    verify: ["id nginx"],
    hint: "useradd -r (system user)",
  },
  {
    desc: "Disable password aging for user 'root'",
    points: 10,
    cmds: ["chage -M -1 root"],
    verify: ["chage -l root"],
    hint: "chage -M -1 disables expiry",
  },

  // Permissions & ACL (20 variations)
  {
    desc: "Create directory /shared with SGID bit, group 'team', permissions 2770",
    points: 15,
    cmds: [
      "mkdir /shared",
      "groupadd team",
      "chmod 2770 /shared",
      "chgrp team /shared",
    ],
    verify: ["ls -ld /shared"],
    hint: "chmod 2770 (SGID bit)",
  },
  {
    desc: "Set default ACL on /projects: user 'bob' gets rwx on all new files",
    points: 15,
    cmds: ["setfacl -m d:u:bob:rwx /projects"],
    verify: ["getfacl /projects"],
    hint: "setfacl -m d:u:user:rwx",
  },
  {
    desc: "Create /data directory with permissions 755, owner root, group developers",
    points: 10,
    cmds: ["mkdir /data", "chmod 755 /data", "chgrp developers /data"],
    verify: ["ls -ld /data"],
    hint: "chmod, chgrp commands",
  },
  {
    desc: "Set ACL on /backup so group 'admins' has read-write access",
    points: 15,
    cmds: ["setfacl -m g:admins:rw /backup"],
    verify: ["getfacl /backup"],
    hint: "setfacl -m g:group:perms",
  },
  {
    desc: "Create sticky bit directory /tmp/shared (1777 permissions)",
    points: 10,
    cmds: ["mkdir -p /tmp/shared", "chmod 1777 /tmp/shared"],
    verify: ["ls -ld /tmp/shared"],
    hint: "chmod 1777 (sticky bit)",
  },
  {
    desc: "Set default ACL: group 'developers' gets rx on new files in /projects",
    points: 15,
    cmds: ["setfacl -m d:g:developers:rx /projects"],
    verify: ["getfacl /projects"],
    hint: "setfacl -m d:g:group:rx",
  },
  {
    desc: "Recursively change ownership of /var/www to apache:apache",
    points: 10,
    cmds: ["chown -R apache:apache /var/www"],
    verify: ["ls -ld /var/www"],
    hint: "chown -R user:group /path",
  },
  {
    desc: "Create /secure with permissions 700 (owner only access)",
    points: 10,
    cmds: ["mkdir /secure", "chmod 700 /secure"],
    verify: ["ls -ld /secure"],
    hint: "chmod 700 = rwx------",
  },
  {
    desc: "Set SGID on /collab and make group 'team' owner",
    points: 15,
    cmds: ["mkdir /collab", "chgrp team /collab", "chmod 2775 /collab"],
    verify: ["ls -ld /collab"],
    hint: "chmod 2775, chgrp",
  },
  {
    desc: "Remove all ACLs from /test directory",
    points: 10,
    cmds: ["setfacl -b /test"],
    verify: ["getfacl /test"],
    hint: "setfacl -b removes all ACLs",
  },
  {
    desc: "Set permissions 644 on all files in /documents recursively",
    points: 10,
    cmds: ["find /documents -type f -exec chmod 644 {} \\;"],
    verify: ["ls -l /documents"],
    hint: "find with chmod",
  },
  {
    desc: "Create directory /public with sticky bit and 1777 permissions",
    points: 10,
    cmds: ["mkdir /public", "chmod 1777 /public"],
    verify: ["ls -ld /public"],
    hint: "sticky bit prevents deletion",
  },
  {
    desc: "Set default ACL: user 'alice' and 'bob' both get rwx on /shared",
    points: 15,
    cmds: [
      "setfacl -m d:u:alice:rwx /shared",
      "setfacl -m d:u:bob:rwx /shared",
    ],
    verify: ["getfacl /shared"],
    hint: "multiple default ACLs",
  },
  {
    desc: "Change ownership of /opt/app to appuser:appgroup recursively",
    points: 10,
    cmds: ["chown -R appuser:appgroup /opt/app"],
    verify: ["ls -ld /opt/app"],
    hint: "chown -R user:group",
  },
  {
    desc: "Set SUID bit on /usr/local/bin/mytool",
    points: 15,
    cmds: ["chmod u+s /usr/local/bin/mytool"],
    verify: ["ls -l /usr/local/bin/mytool"],
    hint: "chmod u+s for SUID",
  },
  {
    desc: "Remove execute permission for others on all files in /private",
    points: 10,
    cmds: ["chmod -R o-x /private"],
    verify: ["ls -l /private"],
    hint: "chmod -R o-x",
  },
  {
    desc: "Set SGID on /var/shared and ownership to :developers",
    points: 15,
    cmds: ["chgrp developers /var/shared", "chmod g+s /var/shared"],
    verify: ["ls -ld /var/shared"],
    hint: "chmod g+s for SGID",
  },
  {
    desc: "Create /archive with permissions 750 (rwxr-x---)",
    points: 10,
    cmds: ["mkdir /archive", "chmod 750 /archive"],
    verify: ["ls -ld /archive"],
    hint: "chmod 750",
  },
  {
    desc: "Set ACL to give user 'monitor' read-only access to /var/log/app.log",
    points: 15,
    cmds: ["setfacl -m u:monitor:r /var/log/app.log"],
    verify: ["getfacl /var/log/app.log"],
    hint: "setfacl -m u:user:r",
  },
  {
    desc: "Copy ACLs from /source to /destination",
    points: 10,
    cmds: ["getfacl /source | setfacl --set-file=- /destination"],
    verify: ["getfacl /destination"],
    hint: "getfacl | setfacl --set-file=-",
  },

  // Storage & LVM (25 variations)
  {
    desc: "Create LVM: PV /dev/sdb1, VG 'vg_data', LV 'lv_data' 1GB, XFS, mount /data persistent",
    points: 20,
    cmds: [
      "pvcreate /dev/sdb1",
      "vgcreate vg_data /dev/sdb1",
      "lvcreate -L 1G -n lv_data vg_data",
      "mkfs.xfs /dev/vg_data/lv_data",
      "mkdir /data",
      "mount /dev/vg_data/lv_data /data",
      "blkid",
      "fstab",
    ],
    verify: ["df -h /data"],
    hint: "pvcreate, vgcreate, lvcreate, mkfs.xfs, fstab",
  },
  {
    desc: "Extend /data LV by 500MB and resize filesystem",
    points: 15,
    cmds: ["lvextend -r -L +500M /dev/vg_data/lv_data"],
    verify: ["df -h /data"],
    hint: "lvextend -r -L +SIZE",
  },
  {
    desc: "Create 512MB swap on LVM, enable and make persistent",
    points: 15,
    cmds: [
      "lvcreate -L 512M -n swap vg_data",
      "mkswap /dev/vg_data/swap",
      "swapon /dev/vg_data/swap",
      "fstab",
    ],
    verify: ["swapon --show"],
    hint: "lvcreate, mkswap, swapon, fstab",
  },
  {
    desc: "Create partition /dev/sdb1 (2GB) and format as ext4",
    points: 15,
    cmds: ["fdisk /dev/sdb", "mkfs.ext4 /dev/sdb1"],
    verify: ["lsblk"],
    hint: "fdisk (n,p,1,+2G,w), mkfs.ext4",
  },
  {
    desc: "Mount /dev/sdb1 at /archive with ext4, make persistent",
    points: 15,
    cmds: ["mkdir /archive", "mount /dev/sdb1 /archive", "blkid", "fstab"],
    verify: ["df -h /archive"],
    hint: "mount, add to /etc/fstab with UUID",
  },
  {
    desc: "Extend VG 'vg_data' with new PV /dev/sdc1",
    points: 15,
    cmds: ["pvcreate /dev/sdc1", "vgextend vg_data /dev/sdc1"],
    verify: ["vgs", "pvs"],
    hint: "pvcreate, vgextend",
  },
  {
    desc: "Create LV 'lv_backup' 2GB in vg_data, format ext4, mount /backup",
    points: 20,
    cmds: [
      "lvcreate -L 2G -n lv_backup vg_data",
      "mkfs.ext4 /dev/vg_data/lv_backup",
      "mkdir /backup",
      "mount",
      "fstab",
    ],
    verify: ["df -h /backup"],
    hint: "lvcreate, mkfs.ext4, mount, fstab",
  },
  {
    desc: "Reduce LV size is DANGEROUS - Create snapshot instead: lv_data_snap 500MB",
    points: 15,
    cmds: ["lvcreate -L 500M -s -n lv_data_snap /dev/vg_data/lv_data"],
    verify: ["lvs"],
    hint: "lvcreate -L SIZE -s -n snapshot_name /dev/vg/lv",
  },
  {
    desc: "Create 1GB swap partition on /dev/sdb2, enable persistently",
    points: 15,
    cmds: ["fdisk /dev/sdb", "mkswap /dev/sdb2", "swapon /dev/sdb2", "fstab"],
    verify: ["swapon --show"],
    hint: "fdisk (type 82), mkswap, swapon, fstab",
  },
  {
    desc: "Extend LV to 50% of remaining VG free space",
    points: 15,
    cmds: ["lvextend -r -l +50%FREE /dev/vg_data/lv_data"],
    verify: ["df -h"],
    hint: "lvextend -r -l +50%FREE",
  },
  {
    desc: "Create thin pool 'thinpool' 5GB in vg_data",
    points: 20,
    cmds: ["lvcreate -L 5G --thinpool thinpool vg_data"],
    verify: ["lvs"],
    hint: "lvcreate --thinpool",
  },
  {
    desc: "Create 2GB thin volume 'thin_vol1' in thinpool",
    points: 15,
    cmds: ["lvcreate -V 2G --thin -n thin_vol1 vg_data/thinpool"],
    verify: ["lvs"],
    hint: "lvcreate -V size --thin",
  },
  {
    desc: "Create RAID1 LV 'lv_mirror' 1GB using 2 PVs",
    points: 20,
    cmds: ["lvcreate --type raid1 -m 1 -L 1G -n lv_mirror vg_data"],
    verify: ["lvs"],
    hint: "lvcreate --type raid1 -m 1",
  },
  {
    desc: "Format partition as ext4 with label 'BACKUP'",
    points: 10,
    cmds: ["mkfs.ext4 -L BACKUP /dev/sdb1"],
    verify: ["blkid /dev/sdb1"],
    hint: "mkfs.ext4 -L LABEL",
  },
  {
    desc: "Create striped LV across 2 PVs for performance",
    points: 20,
    cmds: ["lvcreate -L 2G -i 2 -n lv_striped vg_data"],
    verify: ["lvs"],
    hint: "lvcreate -i NUM for stripes",
  },
  {
    desc: "Reduce swap from 1GB to 512MB (create new smaller swap)",
    points: 15,
    cmds: [
      "swapoff /dev/vg_data/swap",
      "lvremove /dev/vg_data/swap",
      "lvcreate -L 512M -n swap vg_data",
    ],
    verify: ["swapon --show"],
    hint: "swapoff, lvremove, lvcreate smaller",
  },
  {
    desc: "Mount /dev/sdb1 at /mnt/usb with options nosuid,noexec",
    points: 15,
    cmds: ["mount -o nosuid,noexec /dev/sdb1 /mnt/usb"],
    verify: ["mount | grep /mnt/usb"],
    hint: "mount -o nosuid,noexec",
  },
  {
    desc: "Create 3-way RAID1 mirror for high availability",
    points: 20,
    cmds: ["lvcreate --type raid1 -m 2 -L 1G -n lv_ha vg_data"],
    verify: ["lvs"],
    hint: "-m 2 creates 3 copies",
  },
  {
    desc: "Extend VG by adding /dev/sdc1 and /dev/sdd1",
    points: 15,
    cmds: [
      "pvcreate /dev/sdc1 /dev/sdd1",
      "vgextend vg_data /dev/sdc1 /dev/sdd1",
    ],
    verify: ["vgs", "pvs"],
    hint: "multiple PVs in one command",
  },

  // SELinux (20 variations)
  {
    desc: "Set SELinux context /web to httpd_sys_content_t (persistent)",
    points: 15,
    cmds: [
      'semanage fcontext -a -t httpd_sys_content_t "/web(/.*)?"',
      "restorecon -Rv /web",
    ],
    verify: ["ls -ldZ /web"],
    hint: "semanage fcontext, restorecon",
  },
  {
    desc: "Enable SELinux boolean httpd_can_network_connect persistently",
    points: 10,
    cmds: ["setsebool -P httpd_can_network_connect on"],
    verify: ["getsebool httpd_can_network_connect"],
    hint: "setsebool -P boolean on",
  },
  {
    desc: "Allow httpd to listen on port 8080",
    points: 10,
    cmds: ["semanage port -a -t http_port_t -p tcp 8080"],
    verify: ["semanage port -l | grep 8080"],
    hint: "semanage port -a -t http_port_t -p tcp PORT",
  },
  {
    desc: "Set SELinux to enforcing mode persistently",
    points: 10,
    cmds: [
      "setenforce 1",
      "sed -i s/^SELINUX=.*/SELINUX=enforcing/ /etc/selinux/config",
    ],
    verify: ["getenforce"],
    hint: "setenforce 1, edit /etc/selinux/config",
  },
  {
    desc: "Enable httpd_enable_homedirs boolean persistently",
    points: 10,
    cmds: ["setsebool -P httpd_enable_homedirs on"],
    verify: ["getsebool httpd_enable_homedirs"],
    hint: "setsebool -P boolean on",
  },
  {
    desc: "Set SELinux context for /srv/website to httpd_sys_content_t",
    points: 15,
    cmds: [
      'semanage fcontext -a -t httpd_sys_content_t "/srv/website(/.*)?"',
      "restorecon -Rv /srv/website",
    ],
    verify: ["ls -ldZ /srv/website"],
    hint: "semanage fcontext + restorecon",
  },
  {
    desc: "Allow httpd to connect to port 3306 (MySQL)",
    points: 10,
    cmds: ["semanage port -a -t mysqld_port_t -p tcp 3306"],
    verify: ["semanage port -l | grep 3306"],
    hint: "semanage port -a -t mysqld_port_t",
  },
  {
    desc: "Relabel entire filesystem (schedule on next boot)",
    points: 10,
    cmds: ["touch /.autorelabel"],
    verify: ["ls -l /.autorelabel"],
    hint: "touch /.autorelabel",
  },
  {
    desc: "Set context for NFS share /nfsshare to nfs_t",
    points: 15,
    cmds: [
      'semanage fcontext -a -t nfs_t "/nfsshare(/.*)?"',
      "restorecon -Rv /nfsshare",
    ],
    verify: ["ls -ldZ /nfsshare"],
    hint: "semanage fcontext with nfs_t",
  },
  {
    desc: "Enable SELinux boolean ftpd_full_access",
    points: 10,
    cmds: ["setsebool -P ftpd_full_access on"],
    verify: ["getsebool ftpd_full_access"],
    hint: "setsebool -P",
  },
  {
    desc: "Allow httpd to send mail (httpd_can_sendmail)",
    points: 10,
    cmds: ["setsebool -P httpd_can_sendmail on"],
    verify: ["getsebool httpd_can_sendmail"],
    hint: "setsebool -P httpd_can_sendmail",
  },
  {
    desc: "Set SELinux context for Samba share /samba to samba_share_t",
    points: 15,
    cmds: [
      'semanage fcontext -a -t samba_share_t "/samba(/.*)?"',
      "restorecon -Rv /samba",
    ],
    verify: ["ls -ldZ /samba"],
    hint: "samba_share_t for Samba",
  },
  {
    desc: "Allow httpd scripts to connect to database (httpd_can_network_connect_db)",
    points: 10,
    cmds: ["setsebool -P httpd_can_network_connect_db on"],
    verify: ["getsebool httpd_can_network_connect_db"],
    hint: "httpd_can_network_connect_db",
  },
  {
    desc: "Set SELinux to permissive mode temporarily (testing)",
    points: 10,
    cmds: ["setenforce 0"],
    verify: ["getenforce"],
    hint: "setenforce 0 = permissive",
  },
  {
    desc: "Allow FTP to use port 2121",
    points: 10,
    cmds: ["semanage port -a -t ftp_port_t -p tcp 2121"],
    verify: ["semanage port -l | grep 2121"],
    hint: "semanage port -a -t ftp_port_t",
  },
  {
    desc: "Enable httpd to read user content (httpd_read_user_content)",
    points: 10,
    cmds: ["setsebool -P httpd_read_user_content on"],
    verify: ["getsebool httpd_read_user_content"],
    hint: "httpd_read_user_content boolean",
  },
  {
    desc: "Set context for /var/ftp to public_content_t",
    points: 15,
    cmds: [
      'semanage fcontext -a -t public_content_t "/var/ftp(/.*)?"',
      "restorecon -Rv /var/ftp",
    ],
    verify: ["ls -ldZ /var/ftp"],
    hint: "public_content_t for FTP",
  },
  {
    desc: "Allow named (DNS) to write to master zone files",
    points: 10,
    cmds: ["setsebool -P named_write_master_zones on"],
    verify: ["getsebool named_write_master_zones"],
    hint: "named_write_master_zones",
  },
  {
    desc: "List all custom SELinux port configurations",
    points: 10,
    cmds: ["semanage port -l -C"],
    verify: ["semanage port -l -C"],
    hint: "semanage port -l -C shows custom only",
  },
  {
    desc: "Delete custom SELinux context for /test",
    points: 10,
    cmds: ['semanage fcontext -d "/test(/.*)?"'],
    verify: ["semanage fcontext -l | grep /test"],
    hint: "semanage fcontext -d",
  },
  {
    desc: "Allow httpd to act as reverse proxy (httpd_can_network_relay)",
    points: 10,
    cmds: ["setsebool -P httpd_can_network_relay on"],
    verify: ["getsebool httpd_can_network_relay"],
    hint: "httpd_can_network_relay",
  },

  // Networking (15 variations)
  {
    desc: "Configure static IP 192.168.1.100/24, gateway 192.168.1.1, DNS 8.8.8.8",
    points: 15,
    cmds: [
      "nmcli con mod",
      "ipv4.addresses",
      "ipv4.gateway",
      "ipv4.dns",
      "ipv4.method manual",
    ],
    verify: ["ip a"],
    hint: "nmcli con mod, set method to manual",
  },
  {
    desc: "Set hostname to rhcsa.example.com persistently",
    points: 10,
    cmds: ["hostnamectl set-hostname rhcsa.example.com"],
    verify: ["hostnamectl"],
    hint: "hostnamectl set-hostname",
  },
  {
    desc: "Add secondary IP 192.168.1.101/24 to existing connection",
    points: 15,
    cmds: ["nmcli con mod", "+ipv4.addresses 192.168.1.101/24"],
    verify: ["ip a"],
    hint: "nmcli con mod +ipv4.addresses",
  },
  {
    desc: "Configure static IP 10.0.0.50/24, gateway 10.0.0.1, DNS 1.1.1.1",
    points: 15,
    cmds: ["nmcli con mod", "ipv4.addresses 10.0.0.50/24"],
    verify: ["ip a"],
    hint: "nmcli con mod ipv4.addresses",
  },
  {
    desc: "Set hostname to server1.lab.local",
    points: 10,
    cmds: ["hostnamectl set-hostname server1.lab.local"],
    verify: ["hostname"],
    hint: "hostnamectl set-hostname",
  },
  {
    desc: "Change DNS servers to 8.8.8.8 and 8.8.4.4",
    points: 10,
    cmds: ["nmcli con mod", 'ipv4.dns "8.8.8.8 8.8.4.4"'],
    verify: ["cat /etc/resolv.conf"],
    hint: "nmcli con mod ipv4.dns",
  },
  {
    desc: "Configure connection to use DHCP",
    points: 10,
    cmds: ["nmcli con mod", "ipv4.method auto"],
    verify: ["nmcli con show"],
    hint: "nmcli con mod ipv4.method auto",
  },
  {
    desc: "Set hostname to exam.redhat.com",
    points: 10,
    cmds: ["hostnamectl set-hostname exam.redhat.com"],
    verify: ["hostnamectl"],
    hint: "hostnamectl",
  },
  {
    desc: "Configure IPv4 static route: 10.0.0.0/8 via 192.168.1.1",
    points: 15,
    cmds: ['nmcli con mod "System eth0" +ipv4.routes "10.0.0.0/8 192.168.1.1"'],
    verify: ["ip route"],
    hint: "nmcli con mod +ipv4.routes",
  },
  {
    desc: "Set search domain to example.com for DNS",
    points: 10,
    cmds: ['nmcli con mod "System eth0" ipv4.dns-search example.com'],
    verify: ["cat /etc/resolv.conf"],
    hint: "ipv4.dns-search",
  },
  {
    desc: "Configure connection to never use this as default route",
    points: 15,
    cmds: ['nmcli con mod "System eth0" ipv4.never-default yes'],
    verify: ["nmcli con show"],
    hint: "ipv4.never-default yes",
  },
  {
    desc: "Create new connection profile 'backup-net' with static IP 10.0.0.100/8",
    points: 15,
    cmds: [
      "nmcli con add con-name backup-net ifname eth1 type ethernet ipv4.method manual ipv4.addresses 10.0.0.100/8",
    ],
    verify: ["nmcli con show"],
    hint: "nmcli con add",
  },
  {
    desc: "Set MTU to 9000 (jumbo frames) on connection",
    points: 10,
    cmds: ['nmcli con mod "System eth0" 802-3-ethernet.mtu 9000'],
    verify: ["ip link show"],
    hint: "802-3-ethernet.mtu",
  },
  {
    desc: "Bring connection down and up to apply changes",
    points: 10,
    cmds: ['nmcli con down "System eth0"', 'nmcli con up "System eth0"'],
    verify: ["nmcli con show"],
    hint: "nmcli con down/up",
  },

  // Firewall (15 variations)
  {
    desc: "Configure firewall: allow http, https, port 8080/tcp",
    points: 15,
    cmds: [
      "firewall-cmd --permanent --add-service=http",
      "firewall-cmd --permanent --add-service=https",
      "firewall-cmd --permanent --add-port=8080/tcp",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "--permanent, --reload",
  },
  {
    desc: "Allow SSH and enable firewalld service",
    points: 10,
    cmds: [
      "systemctl enable --now firewalld",
      "firewall-cmd --permanent --add-service=ssh",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "systemctl enable, firewall-cmd --permanent",
  },
  {
    desc: "Block all traffic from 192.168.1.50",
    points: 15,
    cmds: ["firewall-cmd --permanent --add-rich-rule", "firewall-cmd --reload"],
    verify: ["firewall-cmd --list-all"],
    hint: "rich rule: reject source",
  },
  {
    desc: "Allow ports 3000-3005/tcp range",
    points: 10,
    cmds: [
      "firewall-cmd --permanent --add-port=3000-3005/tcp",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "port range with dash",
  },
  {
    desc: "Allow MySQL service (port 3306)",
    points: 10,
    cmds: [
      "firewall-cmd --permanent --add-service=mysql",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "--add-service=mysql",
  },
  {
    desc: "Remove cockpit service from firewall",
    points: 10,
    cmds: [
      "firewall-cmd --permanent --remove-service=cockpit",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "--remove-service",
  },
  {
    desc: "Add trusted zone for 192.168.1.0/24 network",
    points: 15,
    cmds: [
      "firewall-cmd --permanent --zone=trusted --add-source=192.168.1.0/24",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all --zone=trusted"],
    hint: "--zone=trusted --add-source",
  },
  {
    desc: "Allow FTP service on firewall",
    points: 10,
    cmds: [
      "firewall-cmd --permanent --add-service=ftp",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "--add-service=ftp",
  },
  {
    desc: "Open port range 5000-5010/tcp for custom application",
    points: 10,
    cmds: [
      "firewall-cmd --permanent --add-port=5000-5010/tcp",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "port ranges with dash",
  },
  {
    desc: "Block ICMP ping requests (drop all icmp)",
    points: 15,
    cmds: [
      "firewall-cmd --permanent --add-icmp-block=echo-request",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "--add-icmp-block=echo-request",
  },
  {
    desc: "Enable masquerading (NAT) on firewall",
    points: 15,
    cmds: [
      "firewall-cmd --permanent --add-masquerade",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "--add-masquerade for NAT",
  },
  {
    desc: "Forward port 80 to 8080",
    points: 15,
    cmds: [
      "firewall-cmd --permanent --add-forward-port=port=80:proto=tcp:toport=8080",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "--add-forward-port",
  },
  {
    desc: "Allow NFS service (includes multiple ports)",
    points: 10,
    cmds: [
      "firewall-cmd --permanent --add-service=nfs",
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "--add-service=nfs",
  },
  {
    desc: "Create rich rule: allow SSH only from 192.168.1.0/24",
    points: 15,
    cmds: [
      'firewall-cmd --permanent --add-rich-rule=\'rule family="ipv4" source address="192.168.1.0/24" service name="ssh" accept\'',
      "firewall-cmd --reload",
    ],
    verify: ["firewall-cmd --list-all"],
    hint: "rich rule with source",
  },

  // Services (15 variations)
  {
    desc: "Install and enable httpd service, start automatically",
    points: 15,
    cmds: ["dnf install -y httpd", "systemctl enable --now httpd"],
    verify: ["systemctl status httpd"],
    hint: "dnf install, systemctl enable --now",
  },
  {
    desc: "Enable and start sshd service",
    points: 10,
    cmds: ["systemctl enable --now sshd"],
    verify: ["systemctl is-enabled sshd"],
    hint: "systemctl enable --now",
  },
  {
    desc: "Set default target to multi-user (non-graphical)",
    points: 10,
    cmds: ["systemctl set-default multi-user.target"],
    verify: ["systemctl get-default"],
    hint: "systemctl set-default",
  },
  {
    desc: "Mask atd service (prevent from starting)",
    points: 10,
    cmds: ["systemctl mask atd"],
    verify: ["systemctl status atd"],
    hint: "systemctl mask",
  },
  {
    desc: "Install and enable chronyd for time synchronization",
    points: 15,
    cmds: ["dnf install -y chrony", "systemctl enable --now chronyd"],
    verify: ["systemctl status chronyd"],
    hint: "dnf install chrony, systemctl enable",
  },
  {
    desc: "Restart httpd and check if it failed",
    points: 10,
    cmds: ["systemctl restart httpd", "systemctl status httpd"],
    verify: ["systemctl is-active httpd"],
    hint: "systemctl restart, check status",
  },
  {
    desc: "Enable firewalld and ensure it starts at boot",
    points: 10,
    cmds: ["systemctl enable --now firewalld"],
    verify: ["systemctl is-enabled firewalld"],
    hint: "systemctl enable --now",
  },
  {
    desc: "Set default target to graphical.target",
    points: 10,
    cmds: ["systemctl set-default graphical.target"],
    verify: ["systemctl get-default"],
    hint: "systemctl set-default graphical.target",
  },
  {
    desc: "Stop and disable bluetooth service",
    points: 10,
    cmds: ["systemctl stop bluetooth", "systemctl disable bluetooth"],
    verify: ["systemctl is-enabled bluetooth"],
    hint: "systemctl stop/disable",
  },
  {
    desc: "Show all failed systemd units",
    points: 10,
    cmds: ["systemctl --failed"],
    verify: ["systemctl --failed"],
    hint: "systemctl --failed",
  },
  {
    desc: "Install and enable cockpit web console",
    points: 15,
    cmds: ["dnf install -y cockpit", "systemctl enable --now cockpit.socket"],
    verify: ["systemctl status cockpit.socket"],
    hint: "cockpit.socket not cockpit.service",
  },
  {
    desc: "Set service to start after network is online",
    points: 15,
    cmds: ["systemctl edit myservice", "After=network-online.target"],
    verify: ["systemctl cat myservice"],
    hint: "systemctl edit, After=",
  },
  {
    desc: "Reload systemd daemon after editing unit files",
    points: 10,
    cmds: ["systemctl daemon-reload"],
    verify: ["systemctl daemon-reload"],
    hint: "systemctl daemon-reload",
  },
  {
    desc: "View last 50 lines of system journal",
    points: 10,
    cmds: ["journalctl -n 50"],
    verify: ["journalctl -n 50"],
    hint: "journalctl -n NUM",
  },

  // Containers (15 variations)
  {
    desc: "Run nginx container 'webapp' port 8080:80, mount /web:/usr/share/nginx/html:Z, systemd persistent",
    points: 20,
    cmds: [
      "podman run -d --name webapp -p 8080:80 -v /web:/usr/share/nginx/html:Z nginx",
      "podman generate systemd --name webapp --files --new",
      "systemctl enable",
    ],
    verify: ["podman ps"],
    hint: "podman run -v with :Z, generate systemd",
  },
  {
    desc: "Run httpd container 'webserver' on port 8081, enable as systemd service",
    points: 15,
    cmds: [
      "podman run -d --name webserver -p 8081:80 httpd",
      "podman generate systemd",
    ],
    verify: ["podman ps"],
    hint: "podman run, generate systemd --new",
  },
  {
    desc: "Pull nginx image and verify it exists",
    points: 10,
    cmds: ["podman pull nginx", "podman images"],
    verify: ["podman images"],
    hint: "podman pull, podman images",
  },
  {
    desc: "Run mariadb container with persistent storage /var/lib/mysql",
    points: 15,
    cmds: [
      "podman run -d --name database -v /var/lib/mysql:/var/lib/mysql:Z mariadb",
    ],
    verify: ["podman ps"],
    hint: "podman run with volume mount",
  },
  {
    desc: "Stop and remove container 'oldapp'",
    points: 10,
    cmds: ["podman stop oldapp", "podman rm oldapp"],
    verify: ["podman ps -a"],
    hint: "podman stop, podman rm",
  },
  {
    desc: "Run nginx 'web1' port 8082:80, auto-restart with systemd",
    points: 20,
    cmds: [
      "podman run -d --name web1 -p 8082:80 nginx",
      "podman generate systemd --name web1 --files --new",
    ],
    verify: ["systemctl status container-web1"],
    hint: "generate systemd with --new flag",
  },
  {
    desc: "Create pod 'mypod' with two containers: nginx and redis",
    points: 20,
    cmds: [
      "podman pod create --name mypod -p 8080:80",
      "podman run -d --pod mypod nginx",
      "podman run -d --pod mypod redis",
    ],
    verify: ["podman pod ps"],
    hint: "podman pod create, then run containers in pod",
  },
  {
    desc: "Run container with environment variable DB_HOST=localhost",
    points: 15,
    cmds: ["podman run -d --name app -e DB_HOST=localhost myapp"],
    verify: ["podman inspect app"],
    hint: "podman run -e VAR=value",
  },
  {
    desc: "Run container with memory limit 512MB",
    points: 15,
    cmds: ["podman run -d --name limited --memory=512m nginx"],
    verify: ["podman stats limited"],
    hint: "--memory=512m",
  },
  {
    desc: "Export container to tar file for backup",
    points: 10,
    cmds: ["podman export webapp > webapp.tar"],
    verify: ["ls -lh webapp.tar"],
    hint: "podman export NAME > file.tar",
  },
  {
    desc: "Import image from tar file",
    points: 10,
    cmds: ["podman import webapp.tar myimage"],
    verify: ["podman images"],
    hint: "podman import file.tar name",
  },
  {
    desc: "Run container with custom DNS server 8.8.8.8",
    points: 10,
    cmds: ["podman run -d --dns=8.8.8.8 --name custom nginx"],
    verify: ["podman inspect custom"],
    hint: "--dns=IP",
  },
  {
    desc: "List all containers including stopped ones",
    points: 10,
    cmds: ["podman ps -a"],
    verify: ["podman ps -a"],
    hint: "podman ps -a",
  },
  {
    desc: "Remove all stopped containers",
    points: 10,
    cmds: ["podman container prune -f"],
    verify: ["podman ps -a"],
    hint: "podman container prune",
  },

  // Scheduling (12 variations)
  {
    desc: "Create cron job for root: run /usr/local/bin/backup.sh daily at 2 AM",
    points: 10,
    cmds: ['echo "0 2 * * * /usr/local/bin/backup.sh" | crontab -'],
    verify: ["crontab -l"],
    hint: "0 2 * * * command",
  },
  {
    desc: "Schedule cron job every 15 minutes for user alice",
    points: 10,
    cmds: ['echo "*/15 * * * * /home/alice/script.sh" | crontab -u alice -'],
    verify: ["crontab -l -u alice"],
    hint: "*/15 * * * *",
  },
  {
    desc: "Create cron job: weekdays at 9 AM run /usr/local/bin/report.sh",
    points: 10,
    cmds: ['echo "0 9 * * 1-5 /usr/local/bin/report.sh" | crontab -'],
    verify: ["crontab -l"],
    hint: "0 9 * * 1-5 (Mon-Fri)",
  },
  {
    desc: "Schedule at job to run /tmp/test.sh in 10 minutes",
    points: 10,
    cmds: ['echo "/tmp/test.sh" | at now + 10 minutes'],
    verify: ["atq"],
    hint: "at now + 10 minutes",
  },
  {
    desc: "Create cron job: every hour run /usr/local/bin/monitor.sh",
    points: 10,
    cmds: ['echo "0 * * * * /usr/local/bin/monitor.sh" | crontab -'],
    verify: ["crontab -l"],
    hint: "0 * * * *",
  },
  {
    desc: "Schedule job every 30 minutes",
    points: 10,
    cmds: ['echo "*/30 * * * * /usr/local/bin/check.sh" | crontab -'],
    verify: ["crontab -l"],
    hint: "*/30 * * * *",
  },
  {
    desc: "Create cron job: first day of every month at midnight",
    points: 10,
    cmds: ['echo "0 0 1 * * /usr/local/bin/monthly.sh" | crontab -'],
    verify: ["crontab -l"],
    hint: "0 0 1 * *",
  },
  {
    desc: "Create cron job: every Sunday at 3 AM",
    points: 10,
    cmds: ['echo "0 3 * * 0 /usr/local/bin/weekly.sh" | crontab -'],
    verify: ["crontab -l"],
    hint: "0 3 * * 0 (Sunday)",
  },
  {
    desc: "Schedule at job to run command at 15:30 today",
    points: 10,
    cmds: ['echo "command" | at 15:30'],
    verify: ["atq"],
    hint: "at HH:MM",
  },
  {
    desc: "Remove all at jobs for current user",
    points: 10,
    cmds: ["for i in $(atq | cut -f1); do atrm $i; done"],
    verify: ["atq"],
    hint: "atrm job_number",
  },
  {
    desc: "Deny user 'student' from using cron",
    points: 10,
    cmds: ["echo student >> /etc/cron.deny"],
    verify: ["cat /etc/cron.deny"],
    hint: "/etc/cron.deny",
  },

  // AutoFS (8 variations)
  {
    desc: "Configure AutoFS: /remote/data mounts nfs://server.example.com:/exports/data",
    points: 15,
    cmds: [
      "dnf install -y autofs",
      'echo "/remote /etc/auto.remote" >> /etc/auto.master',
      'echo "data -fstype=nfs,rw server.example.com:/exports/data" >> /etc/auto.remote',
      "systemctl enable --now autofs",
    ],
    verify: ["systemctl status autofs"],
    hint: "indirect map in auto.master",
  },
  {
    desc: "Configure AutoFS direct map: /shares/files mounts nfs://nas:/files",
    points: 15,
    cmds: [
      'echo "/- /etc/auto.direct" >> /etc/auto.master',
      'echo "/shares/files -fstype=nfs nas:/files" >> /etc/auto.direct',
    ],
    verify: ["cat /etc/auto.master"],
    hint: "direct map uses /-",
  },
  {
    desc: "Setup AutoFS for home directories /home/guests/*",
    points: 15,
    cmds: [
      'echo "/home/guests /etc/auto.guests" >> /etc/auto.master',
      'echo "* -fstype=nfs server:/home/guests/&" >> /etc/auto.guests',
    ],
    verify: ["cat /etc/auto.guests"],
    hint: "wildcard with &",
  },
  {
    desc: "Configure AutoFS with timeout of 120 seconds",
    points: 15,
    cmds: [
      'sed -i "s/^#*timeout.*/timeout=120/" /etc/autofs.conf',
      "systemctl restart autofs",
    ],
    verify: ["grep timeout /etc/autofs.conf"],
    hint: "edit /etc/autofs.conf",
  },
  {
    desc: "Configure AutoFS to mount /remote/share from nfs://192.168.1.10:/share",
    points: 15,
    cmds: [
      'echo "/remote /etc/auto.remote" >> /etc/auto.master',
      'echo "share -fstype=nfs,rw 192.168.1.10:/share" >> /etc/auto.remote',
    ],
    verify: ["cat /etc/auto.remote"],
    hint: "use IP address directly",
  },
  {
    desc: "Setup AutoFS direct mount for /backup from nfs://backup-server:/backups",
    points: 15,
    cmds: [
      'echo "/- /etc/auto.direct" >> /etc/auto.master',
      'echo "/backup -fstype=nfs backup-server:/backups" >> /etc/auto.direct',
    ],
    verify: ["cat /etc/auto.direct"],
    hint: "direct mount with /-",
  },
  {
    desc: "Configure AutoFS with browsing enabled (browse_mode=yes)",
    points: 10,
    cmds: ['sed -i "s/^#*browse_mode.*/browse_mode=yes/" /etc/autofs.conf'],
    verify: ["grep browse_mode /etc/autofs.conf"],
    hint: "browse_mode in autofs.conf",
  },

  // Package Management (10 variations)
  {
    desc: "Install package group 'Development Tools'",
    points: 10,
    cmds: ['dnf group install -y "Development Tools"'],
    verify: ["dnf group list installed"],
    hint: "dnf group install",
  },
  {
    desc: "Download package without installing it to /tmp",
    points: 10,
    cmds: ["dnf download --destdir=/tmp httpd"],
    verify: ["ls /tmp/*.rpm"],
    hint: "dnf download --destdir",
  },
  {
    desc: "Find which package provides /usr/bin/semanage",
    points: 10,
    cmds: ["dnf provides */semanage"],
    verify: ["dnf provides */semanage"],
    hint: "dnf provides */command",
  },
  {
    desc: "List all available repositories",
    points: 10,
    cmds: ["dnf repolist all"],
    verify: ["dnf repolist all"],
    hint: "dnf repolist all",
  },
  {
    desc: "Enable disabled repository 'optional'",
    points: 10,
    cmds: ["dnf config-manager --enable optional"],
    verify: ["dnf repolist"],
    hint: "dnf config-manager --enable",
  },
  {
    desc: "Update all packages to latest versions",
    points: 10,
    cmds: ["dnf update -y"],
    verify: ["dnf check-update"],
    hint: "dnf update -y",
  },
  {
    desc: "Remove package and all dependencies not needed by other packages",
    points: 10,
    cmds: ["dnf autoremove httpd"],
    verify: ["rpm -qa | grep httpd"],
    hint: "dnf autoremove",
  },
  {
    desc: "Install package from specific repository",
    points: 10,
    cmds: ["dnf --enablerepo=epel install htop"],
    verify: ["rpm -qa | grep htop"],
    hint: "dnf --enablerepo=REPO",
  },
  {
    desc: "List all files installed by package httpd",
    points: 10,
    cmds: ["rpm -ql httpd"],
    verify: ["rpm -ql httpd"],
    hint: "rpm -ql package",
  },
  {
    desc: "Find which package owns file /etc/passwd",
    points: 10,
    cmds: ["rpm -qf /etc/passwd"],
    verify: ["rpm -qf /etc/passwd"],
    hint: "rpm -qf /path/to/file",
  },

  // Misc Advanced (20 variations)
  {
    desc: "Find all files in /etc owned by root, size >1MB, copy to /backup",
    points: 10,
    cmds: [
      "mkdir /backup",
      "find /etc -type f -user root -size +1M -exec cp {} /backup/ \\;",
    ],
    verify: ["ls /backup"],
    hint: "find with -size +1M -exec",
  },
  {
    desc: "Create archive /backup/etc-backup.tar.gz of all .conf files in /etc",
    points: 10,
    cmds: ["tar -czf /backup/etc-backup.tar.gz /etc/*.conf"],
    verify: ["ls -lh /backup"],
    hint: "tar -czf destination source",
  },
  {
    desc: "Find all SUID files in /usr/bin and save list to /root/suid.txt",
    points: 10,
    cmds: ["find /usr/bin -perm -4000 > /root/suid.txt"],
    verify: ["cat /root/suid.txt"],
    hint: "find with -perm -4000",
  },
  {
    desc: "Create compressed archive /tmp/home.tar.bz2 of /home",
    points: 10,
    cmds: ["tar -cjf /tmp/home.tar.bz2 /home"],
    verify: ["ls -lh /tmp/home.tar.bz2"],
    hint: "tar -cjf (bzip2)",
  },
  {
    desc: "Extract /backup/data.tar.gz to /restore directory",
    points: 10,
    cmds: ["mkdir /restore", "tar -xzf /backup/data.tar.gz -C /restore"],
    verify: ["ls /restore"],
    hint: "tar -xzf file -C destination",
  },
  {
    desc: "Find files modified in last 7 days in /var/log",
    points: 10,
    cmds: ["find /var/log -type f -mtime -7"],
    verify: ["find /var/log -mtime -7"],
    hint: "find -mtime -7",
  },
  {
    desc: "Create systemd timer to run backup.service daily at 3 AM",
    points: 15,
    cmds: ["systemd timer creation"],
    verify: ["systemctl list-timers"],
    hint: "create .timer and .service files",
  },
  {
    desc: "Configure tuned profile to throughput-performance",
    points: 10,
    cmds: ["tuned-adm profile throughput-performance"],
    verify: ["tuned-adm active"],
    hint: "tuned-adm profile NAME",
  },
  {
    desc: "Configure rsyslog to log all kernel messages to /var/log/kernel.log",
    points: 15,
    cmds: [
      'echo "kern.* /var/log/kernel.log" >> /etc/rsyslog.conf',
      "systemctl restart rsyslog",
    ],
    verify: ["grep kern.* /etc/rsyslog.conf"],
    hint: "edit /etc/rsyslog.conf",
  },
  {
    desc: "Set system timezone to America/New_York",
    points: 10,
    cmds: ["timedatectl set-timezone America/New_York"],
    verify: ["timedatectl"],
    hint: "timedatectl set-timezone",
  },
  {
    desc: "Enable NTP time synchronization",
    points: 10,
    cmds: ["timedatectl set-ntp true"],
    verify: ["timedatectl"],
    hint: "timedatectl set-ntp true",
  },
  {
    desc: "Create symbolic link /home/shared pointing to /mnt/shared",
    points: 10,
    cmds: ["ln -s /mnt/shared /home/shared"],
    verify: ["ls -l /home/shared"],
    hint: "ln -s target link",
  },
  {
    desc: "Set system locale to en_US.UTF-8",
    points: 10,
    cmds: ["localectl set-locale LANG=en_US.UTF-8"],
    verify: ["localectl"],
    hint: "localectl set-locale",
  },
  {
    desc: "Find all world-writable files in /tmp",
    points: 10,
    cmds: ["find /tmp -type f -perm -002"],
    verify: ["find /tmp -perm -002"],
    hint: "find -perm -002",
  },
  {
    desc: "Create hard link /root/backup pointing to /etc/hosts",
    points: 10,
    cmds: ["ln /etc/hosts /root/backup"],
    verify: ["ls -li /etc/hosts /root/backup"],
    hint: "ln source dest (no -s)",
  },
  {
    desc: "Search for string 'error' in all files under /var/log",
    points: 10,
    cmds: ['grep -r "error" /var/log/'],
    verify: ["grep -r error /var/log/"],
    hint: "grep -r pattern /path",
  },
  {
    desc: "Count number of lines in /etc/passwd",
    points: 10,
    cmds: ["wc -l /etc/passwd"],
    verify: ["wc -l /etc/passwd"],
    hint: "wc -l file",
  },
  {
    desc: "Display disk usage of /var in human-readable format",
    points: 10,
    cmds: ["du -sh /var"],
    verify: ["du -sh /var"],
    hint: "du -sh /path",
  },
  {
    desc: "Show processes consuming most CPU",
    points: 10,
    cmds: ["top", "or ps aux --sort=-%cpu"],
    verify: ["ps aux --sort=-%cpu"],
    hint: "ps aux --sort=-%cpu",
  },
  {
    desc: "Kill all processes owned by user 'baduser'",
    points: 15,
    cmds: ["pkill -u baduser"],
    verify: ["ps -u baduser"],
    hint: "pkill -u username",
  },
  {
    desc: "Change process priority: renice -10 for PID 1234",
    points: 10,
    cmds: ["renice -10 -p 1234"],
    verify: ["ps -p 1234 -o ni"],
    hint: "renice priority -p PID",
  },
  {
    desc: "Mount ISO file /tmp/rhel.iso to /mnt/cdrom",
    points: 10,
    cmds: ["mount -o loop /tmp/rhel.iso /mnt/cdrom"],
    verify: ["mount | grep /mnt/cdrom"],
    hint: "mount -o loop iso /mnt",
  },
  {
    desc: "Create bootable USB: write ISO to /dev/sdc",
    points: 15,
    cmds: ["dd if=/tmp/rhel.iso of=/dev/sdc bs=4M status=progress"],
    verify: ["lsblk"],
    hint: "dd if=iso of=/dev/sdX bs=4M",
  },
  {
    desc: "Generate SSH key pair for user alice (RSA 4096-bit)",
    points: 15,
    cmds: [
      "su - alice -c \"ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ''\"",
    ],
    verify: ["ls -la /home/alice/.ssh/"],
    hint: "ssh-keygen -t rsa -b 4096",
  },
  {
    desc: "Copy SSH public key to remote server for passwordless login",
    points: 10,
    cmds: ["ssh-copy-id user@remotehost"],
    verify: ["cat ~/.ssh/authorized_keys"],
    hint: "ssh-copy-id user@host",
  },
  {
    desc: "Configure system to forward all root emails to admin@example.com",
    points: 15,
    cmds: ['echo "root: admin@example.com" >> /etc/aliases', "newaliases"],
    verify: ["cat /etc/aliases"],
    hint: "/etc/aliases then newaliases",
  },
  {
    desc: "Set kernel parameter vm.swappiness to 10 (persistent)",
    points: 15,
    cmds: ['echo "vm.swappiness = 10" >> /etc/sysctl.conf', "sysctl -p"],
    verify: ["sysctl vm.swappiness"],
    hint: "edit /etc/sysctl.conf, then sysctl -p",
  },
];

function selectRandomTasks() {
  const selected = [];
  const poolCopy = [...questionPool];

  // Shuffle and select 20 unique tasks
  while (selected.length < 20 && poolCopy.length > 0) {
    const randomIndex = Math.floor(Math.random() * poolCopy.length);
    selected.push(poolCopy.splice(randomIndex, 1)[0]);
  }

  // Assign IDs and structure
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
  document.getElementById(
    "examNumber"
  ).textContent = `Exam #${currentExamNumber}`;

  renderTasks();
  startTimer();
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = tasks
    .map(
      (task) => `
                <div class="task-card ${
                  task.submitted ? "submitted" : ""
                }" id="task-${task.id}">
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
                            ${
                              task.submitted
                                ? "✓ Submitted"
                                : "📤 Submit Solution"
                            }
                        </button>

                      <button class="hint-toggle" onclick="toggleHint(${
                        task.id
                      }, this)" style="margin-left:10px;">Show Hint</button>
                      <button class="hint-toggle" onclick="toggleAnswer(${
                        task.id
                      }, this)" style="margin-left:8px;">Show Answer</button>
                        
                        <div class="solution-status ${
                          task.status || ""
                        }" id="status-${task.id}">
                            ${task.statusMessage || ""}
                        </div>
                    </div>
                    
                    <div class="hint-box" id="hint-${task.id}">
                      💡 Hint: ${task.hint}
                    </div>
                    <div class="answer-box" id="answer-${task.id}">
                      ${
                        task.expectedCommands
                          ? task.expectedCommands.join("\n")
                          : ""
                      }
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
  const expectedCommands = task.expectedCommands.map((cmd) =>
    cmd.toLowerCase()
  );

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

  const display = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
  const timerEl = document.getElementById("timerDisplay");
  timerEl.textContent = display;

  document.getElementById("timeRemaining").textContent = `${Math.floor(
    timeRemaining / 60
  )} min`;

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
    if (
      !confirm(
        `⚠️ Warning: ${unanswered} task(s) not submitted!\n\nUnanswered tasks will score 0 points.\n\nSubmit exam anyway?`
      )
    ) {
      return;
    }
  } else {
    if (
      !confirm(
        "📤 Submit exam for grading?\n\nYou cannot change answers after submission."
      )
    ) {
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
  document.getElementById("finalScore").style.color = passed
    ? "#059669"
    : "#dc2626";

  const passBadge = document.getElementById("passBadge");
  if (passed) {
    passBadge.className = "pass-badge passed";
    passBadge.innerHTML = `🎉 PASSED! You scored ${Math.round(
      (totalScore / 300) * 100
    )}%`;
  } else {
    passBadge.className = "pass-badge failed";
    passBadge.innerHTML = `❌ FAILED. You need 210+ to pass (${Math.round(
      (totalScore / 300) * 100
    )}%)`;
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
                            <strong>${icon} Task ${
        task.id
      }:</strong> ${task.description.substring(0, 60)}...
                            ${
                              !task.submitted
                                ? '<br><small style="color: #6b7280;">Not answered</small>'
                                : ""
                            }
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
                            <strong>Time Used:</strong> ${Math.floor(
                              (9000 - timeRemaining) / 60
                            )} minutes
                        </div>
                        <div style="font-size: 14px; color: #718096; margin-top: 5px;">
                            Average: ${(() => {
                              const submittedCount = tasks.filter(
                                (t) => t.submitted
                              ).length;
                              if (!submittedCount) return "N/A";
                              return (
                                (
                                  (9000 - timeRemaining) /
                                  60 /
                                  submittedCount
                                ).toFixed(1) + " min/task"
                              );
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
  report += `Final Score: ${totalScore}/300 (${Math.round(
    (totalScore / 300) * 100
  )}%)\n`;
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

    report += `Task ${task.id}: ${status} - ${task.score || 0}/${
      task.points
    } points\n`;
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
  a.download = `RHCSA_Exam_${currentExamNumber - 1}_${
    new Date().toISOString().split("T")[0]
  }.txt`;
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
