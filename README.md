<p align="center">
  <img src="./banner.jpg" alt="Free Redis — Google Cloud setup banner" width="100%">
</p>

<h1 align="center">🚀 Free Redis on Google Cloud</h1>

<p align="center">
  <b>Deploy • Secure • Connect • Auto-Restart</b><br>
  A step-by-step guide to self-hosting Redis on a Google Cloud Ubuntu VM and testing it from VS Code.
</p>

<p align="center">
  <a href="https://redis.io/"><img src="https://img.shields.io/badge/Redis-Open%20Source-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"></a>
  <a href="https://cloud.google.com/compute"><img src="https://img.shields.io/badge/Google%20Cloud-Compute%20Engine-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Google Cloud"></a>
  <img src="https://img.shields.io/badge/OS-Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white" alt="Ubuntu">
  <img src="https://img.shields.io/badge/Node.js-Optional-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-2EA44F?style=for-the-badge" alt="MIT License">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Setup-Step%20by%20Step-blue?style=flat-square" alt="Step by step">
  <img src="https://img.shields.io/badge/Security-Firewall%20First-success?style=flat-square" alt="Firewall first">
  <img src="https://img.shields.io/badge/Includes-Auto--Start%20%26%20Restart-orange?style=flat-square" alt="Auto start and restart">
</p>

---

## 📌 About

This guide shows how to install and configure Redis on a Google Cloud Compute Engine VM running Ubuntu, keep it running after reboot, and test the connection from a Windows computer using VS Code and Node.js.

> [!IMPORTANT]
> **Redis is not automatically “free” just because Redis software is open source.** Your Google Cloud VM, disk, public IP, and network traffic may incur charges. Check current GCP pricing and free-tier eligibility before deploying.

> [!CAUTION]
> **Never expose Redis port `6379` to everyone (`0.0.0.0/0`).** Restrict access to trusted source IPs and prefer a private network, VPN, SSH tunnel, or correctly configured TLS. A plain `redis://` connection is not encrypted.

## ✨ What you’ll set up

- ☁️ A Google Cloud VM running Ubuntu
- ⚡ Redis installation and service management
- 🔐 Password authentication
- 🧱 GCP firewall configuration
- 🧪 Redis `PING`, `PONG`, and read/write tests
- 💻 VS Code + Node.js connection test
- 🔄 Automatic startup after VM reboot
- 🩺 Troubleshooting for common connection errors

## 📚 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Step 1 — Create a GCP VM](#️-step-1--create-a-gcp-vm)
3. [Step 2 — Install Redis](#-step-2--install-redis)
4. [Step 3 — Configure Redis](#-step-3--configure-redis)
5. [Step 4 — Enable auto-start](#-step-4--enable-auto-start)
6. [Step 5 — Configure firewall safely](#️-step-5--configure-firewall-safely)
7. [Step 6 — Test Redis on the VM](#-step-6--test-redis-on-the-vm)
8. [Step 7 — Test the port from Windows](#-step-7--test-the-port-from-windows)
9. [Step 8 — Test from VS Code](#-step-8--test-from-vs-code)
10. [Step 9 — Enable crash auto-restart](#-step-9--enable-crash-auto-restart)
11. [Troubleshooting](#-troubleshooting)
12. [Security checklist](#-security-checklist)

## 🧰 Prerequisites

- A Google Cloud account and a Compute Engine VM
- Ubuntu 22.04 or another supported Ubuntu release
- SSH access to the VM
- VS Code and Node.js (only for the client test)
- Your client’s public IP address if using direct remote access

---

## ☁️ Step 1 — Create a GCP VM

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Go to **Compute Engine → VM instances**.
3. Create a VM and choose an Ubuntu image.
4. Select a machine type and disk size appropriate for your workload and budget.
5. Create the VM and note its external IP.
6. Connect using the Console’s **SSH** button.

💡 **Tip:** Always check the current GCP Free Tier terms and pricing for your selected region and resources. Do not assume every VM configuration is free.

## 📦 Step 2 — Install Redis

Run these commands in the VM’s SSH terminal:

```bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl status redis-server
redis-server --version
```

If the status screen opens in a pager, press `q` to exit.

## 🔐 Step 3 — Configure Redis

Open the Redis configuration file:

```bash
sudo nano /etc/redis/redis.conf
```

### 🛡️ Recommended default: local-only Redis

For applications running on the same VM, keep Redis bound to localhost (around **Line 70**: `bind 127.0.0.1 ::1`):

```conf
bind 127.0.0.1 ::1
protected-mode yes
port 6379
```

This is the safer default. For remote use, prefer a private network/VPN or an SSH tunnel.

### 🌐 Direct remote access (only with firewall restrictions)

If direct remote access is absolutely required, update **Line 70** (`bind 127.0.0.1 ::1`) so Redis listens on the VM’s network interfaces:

```conf
bind 0.0.0.0
protected-mode yes
port 6379
```

⚠️ `bind 0.0.0.0` makes Redis listen on all IPv4 interfaces. It does **not** configure the GCP firewall. Do not proceed with direct exposure unless the firewall is restricted to trusted client IPs.

### 🔑 Set a strong password

Generate a random secret on the VM:

```bash
openssl rand -hex 32
```

In `redis.conf`, find **Line 792** (`# requirepass foobared`), uncomment it, and configure the generated value:

```conf
requirepass REPLACE_WITH_YOUR_LONG_RANDOM_PASSWORD
```

Replace the placeholder with the generated secret. Never use a sample password from documentation, and never commit credentials to GitHub.

Save Nano: `Ctrl + O` → `Enter` → `Ctrl + X`.

Restart Redis:

```bash
sudo systemctl restart redis-server
sudo systemctl --no-pager status redis-server
```

> **Authentication note:** Redis 6+ supports ACL users. Use the username `default` only if your ACL configuration expects it. A basic `requirepass` setup can use password-only authentication.

## 🔄 Step 4 — Enable auto-start

Make Redis start automatically after a VM reboot:

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Verify:

```bash
sudo systemctl is-enabled redis-server
sudo systemctl is-active redis-server
```

Expected output:

```text
enabled
active
```

## 🧱 Step 5 — Configure firewall safely

In Google Cloud Console, go to **VPC network → Firewall** and create an ingress rule only if direct remote access is needed.

Recommended rule:

| Setting | Value |
|---|---|
| Direction | Ingress |
| Target | Only the Redis VM, preferably via a dedicated network tag |
| Source IPv4 ranges | Your trusted public IP with `/32` |
| Protocol / port | `tcp:6379` |

Example source range format: `203.0.113.10/32` — replace this documentation example with your actual public IP.

🚫 **Do not use `0.0.0.0/0` for port 6379.** The private LAN IP of your computer (for example, `192.168.x.x`) is not the public source IP GCP sees.

### 🔒 Safer option: SSH tunnel

Keep Redis bound to localhost on the VM, then run this from your local computer:

```bash
ssh -L 6379:127.0.0.1:6379 YOUR_SSH_USER@YOUR_VM_EXTERNAL_IP
```

Keep the SSH session open. Your local Redis client can connect to `127.0.0.1:6379`. Adapt the command to your SSH username and key configuration.

## 🧪 Step 6 — Test Redis on the VM

Check the listener:

```bash
sudo ss -lntp | grep 6379
```

Connect locally:

```bash
redis-cli -h 127.0.0.1 -p 6379
```

At the Redis prompt, authenticate. For a basic `requirepass` setup:

```redis
AUTH YOUR_STRONG_PASSWORD
PING
```

Expected response:

```text
OK
PONG
```

If ACL authentication with the `default` user is configured:

```redis
AUTH default YOUR_STRONG_PASSWORD
PING
```

Exit with `EXIT`. Never paste the password into public issues, screenshots, or chat.

## 🖥️ Step 7 — Test the port from Windows

In VS Code’s PowerShell terminal:

```powershell
Test-NetConnection YOUR_VM_EXTERNAL_IP -Port 6379
```

- `TcpTestSucceeded : True` means the TCP port is reachable; it does **not** prove Redis authentication works.
- `TcpTestSucceeded : False` suggests checking the firewall, route, VM IP, listener, and source IP.

If you are using an SSH tunnel, test the forwarded local port instead:

```powershell
Test-NetConnection 127.0.0.1 -Port 6379
```

## 💻 Step 8 — Test from VS Code

Clone this repository, open it in VS Code, and install the dependencies:

```powershell
git clone https://github.com/AmitDas4321/Free-Redis.git
cd Free-Redis
npm install
```

### Create `.env`

For a direct remote connection (only when network access and security are properly configured):

```env
REDIS_URL=redis://default:YOUR_STRONG_PASSWORD@YOUR_VM_EXTERNAL_IP:6379
```

Replace the placeholders with your actual details. The `default` username must match your Redis authentication configuration.

⚠️ `redis://` is unencrypted. For a public network, prefer a properly configured TLS endpoint (`rediss://`) or use the SSH tunnel/private networking approach. With the SSH tunnel, use the local forwarded endpoint and port.

Create a `.gitignore` file:

```gitignore
node_modules/
.env
```

Run the test:

```powershell
npm start
```

Or directly with Node.js:

```powershell
node test-redis.cjs
```

Successful output should include:

```text
🔌 Connecting to Redis...
✅ Redis connected!
PING response: PONG
Read test: Connection successful
🎉 Redis read/write test passed!
Test finished.
```

🔎 If you see `Connection timeout`, test the TCP port first, then inspect the firewall, `bind` setting, authentication, client URL, and TLS configuration.

## 🔁 Step 9 — Enable crash auto-restart

Check the current policy:

```bash
sudo systemctl show redis-server -p Restart -p RestartUSec
```

The service may already have a restart policy. If it does not, and you want systemd to restart Redis after a failure, create an override:

```bash
sudo systemctl edit redis-server
```

Add:

```ini
[Service]
Restart=on-failure
RestartSec=5s
```

Save and exit, then run:

```bash
sudo systemctl daemon-reload
sudo systemctl restart redis-server
sudo systemctl show redis-server -p Restart -p RestartUSec
sudo systemctl is-enabled redis-server
sudo systemctl is-active redis-server
```

Expected settings include `enabled`, `active`, and `Restart=on-failure`. If the service already reports `Restart=always`, an extra override may not be necessary.

ℹ️ This restarts the Redis service process. Recovery of the entire VM after a VM-level failure is a separate Compute Engine setting.

## 🩺 Troubleshooting

| Error / symptom | Likely cause | What to check |
|---|---|---|
| `Connection timeout` | Client connection did not complete | Firewall, route, host/port, TLS, Redis logs |
| `TcpTestSucceeded : False` | TCP port unreachable | GCP firewall, listener, VM IP, source IP |
| `WRONGPASS` / `NOAUTH` | Authentication issue | Password and ACL username |
| `ECONNREFUSED` | Connection actively refused | Redis service, bind address, port |
| `ENOTFOUND` | Hostname lookup failed | Hostname in `REDIS_URL` |
| TLS error | Client/server protocol mismatch | TLS configuration and `redis://` vs `rediss://` |
| Works locally, fails remotely | Local-only binding or network access blocked | `bind`, firewall, route, source IP |
| App health check says Redis unavailable | App may use a different URL/config | Runtime environment variables, deployment and logs |

Useful commands:

```bash
sudo systemctl --no-pager status redis-server
sudo journalctl -u redis-server -n 100 --no-pager
sudo ss -lntp | grep 6379
```

## ✅ Security checklist

- [ ] 🔑 Use a long, unique Redis password or properly configured ACL users.
- [ ] ♻️ Rotate any credential accidentally shared or committed.
- [ ] 🙈 Keep `.env`, private keys, and secrets out of GitHub.
- [ ] 🧱 Never expose port `6379` to `0.0.0.0/0`.
- [ ] 🔒 Prefer a private network, VPN, SSH tunnel, or TLS for remote access.
- [ ] 🔄 Keep Ubuntu and Redis packages updated.
- [ ] 📈 Monitor logs, memory, disk, and CPU.
- [ ] 💾 Configure persistence and backups if your data matters.
- [ ] 💸 Monitor GCP usage and billing.

## 🔗 Official resources

- [Google Cloud firewall rules](https://cloud.google.com/firewall/docs/firewalls)
- [Google Compute Engine](https://cloud.google.com/compute/docs/instances)
- [Redis documentation](https://redis.io/docs/latest/)
- [node-redis documentation](https://redis.io/docs/latest/develop/clients/nodejs/)

---

<p align="center">
  <b>Built for learning. Configured with security in mind. 🚀</b><br>
  <sub>Redis is open source; Google Cloud resources may still incur charges.</sub>
</p>
