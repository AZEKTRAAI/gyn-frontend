# GYN website: Netcup VPS deployment runbook

A VPS (virtual private server) is a rented Linux computer in a data centre. You connect to it over SSH, install software, and it runs 24/7. The GYN website and registration system run as Docker containers on this machine.

The commands below assume a fresh Debian or Ubuntu server. If the VPS runs a different OS, the package manager commands (`apt`) and package names may differ. We will confirm the OS once Netcup provides the server details.


## What we still need from GYN

Before we can deploy, please confirm:

- [ ] Netcup plan: RAM, CPU count, disk size, and operating system (Debian 12 / Ubuntu 24.04 LTS preferred).
- [ ] Root SSH access or the ability to create a sudo user via the Netcup control panel (SolusVM or Plesk).
- [ ] What is currently running on ports 80 and 443 (old WordPress site: Apache, nginx, or Plesk?).
- [ ] Who controls DNS for thegyn.org and can add or change A/AAAA records.
- [ ] Once we know, we need to point a test subdomain (e.g. new.thegyn.org) at the VPS IP so we can deploy and test before touching the main domain.


## First-time server setup

Run these steps once, in order, as root (or via the Netcup console).

### 1. Create a non-root sudo user

```bash
adduser deploy
usermod -aG sudo deploy
```

### 2. Add your SSH public key

On your local machine, copy your public key:

```bash
ssh-copy-id deploy@YOUR_VPS_IP
```

Or manually paste the contents of `~/.ssh/id_ed25519.pub` (or `id_rsa.pub`) into `/home/deploy/.ssh/authorized_keys` on the server:

```bash
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys  # paste your public key, one per line
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

Verify SSH login works before the next step: open a new terminal and run `ssh deploy@YOUR_VPS_IP`.

### 3. Disable password login and root SSH

```bash
nano /etc/ssh/sshd_config
```

Set or confirm these lines:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:

```bash
systemctl restart sshd
```

From here on, log in as: `ssh deploy@YOUR_VPS_IP`

### 4. Firewall: open only ports 22, 80, and 443

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

Verify: `ufw status` should show three ALLOW rules.

### 5. fail2ban (SSH brute-force protection)

```bash
apt update
apt install -y fail2ban
systemctl enable --now fail2ban
```

The defaults are fine; they ban IPs after 5 failed SSH attempts for 10 minutes.

### 6. Automatic security updates

```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades  # choose "Yes"
```

### 7. Install Docker Engine and the Compose plugin

Follow Docker's official instructions for your OS, not the system package (which is often outdated).

For Debian:

```bash
apt install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

For Ubuntu, replace `debian` with `ubuntu` and `VERSION_CODENAME` stays the same.

Add the deploy user to the docker group so they can run Docker without sudo:

```bash
usermod -aG docker deploy
```

Log out and back in for the group change to take effect. Verify: `docker info` should show the daemon details.


## First deploy

Run these steps as the `deploy` user.

### 8. Clone the repository

```bash
cd /srv
git clone git@github.com:YOUR_ORG/gynwebsite.git gyn
cd gyn
```

If the repo is private, make sure the deploy user's SSH key is added as a deploy key in GitHub (read-only access is enough for the VPS).

### 9. Create .env from the example

```bash
cp .env.production.example .env
nano .env
```

Fill in every value. Pay special attention to:

- `POSTGRES_PASSWORD`: generate with `openssl rand -base64 32`.
- `DATABASE_URL` and `DIRECT_URL`: replace `REPLACE_WITH_STRONG_PASSWORD` with the same password.
- `FIELD_ENCRYPTION_KEYS`: generate with `openssl rand -base64 32`, prepend `1:`.
- `SITE_ADDRESS`: the domain for the public website (e.g. `thegyn.org`).
- `ADMIN_ADDRESS`: the domain for the separate admin app (e.g. `admin.thegyn.org`). It needs its own DNS A/AAAA record pointing at the VPS before the first deploy, or Caddy cannot get its certificate. Both sites are https only: Caddy redirects plain http to https and renews the certificates itself.
- `INTERNAL_API_SECRET`: generate with `openssl rand -base64 32`. The admin uses it to tell the website to refresh pages.
- `ADMIN_ALLOWED_IPS` (optional): limit the admin to office or staff addresses, e.g. `203.0.113.7 198.51.100.0/24`.
- Do not set `ALLOW_DEMO_ACCOUNTS` here. It creates six demo admin accounts with a public password.
- All `STRIPE_*`, `PAYPAL_*`, `SMTP_*`, and `TURNSTILE_*` values from each provider.

Restrict permissions so only the deploy user can read it:

```bash
chmod 600 .env
```

### 10. Run the first deploy

```bash
./deploy/deploy.sh
```

This builds the images, starts all services, and waits for the website and the admin to report healthy.

The first run will also run `prisma migrate deploy`, which creates the database schema.

Then load the starting data once (roles, SISM 2026, FMST 2026 and their registration categories). It is safe to run again; it never creates demo accounts in production:

```bash
docker compose run --rm worker node --experimental-strip-types prisma/seed.ts
```

There is no real admin account yet. Creating the first Super Admin from a one-off command is part of the remaining phase 3 work.


## Deploying an update

Log in to the VPS, go to `/srv/gyn`, and run:

```bash
./deploy/deploy.sh
```

The script checks for uncommitted changes (refuses if any), takes a database dump, pulls the latest code, rebuilds images, and restarts services.

Do not deploy on registration deadline days (the team will mark these in the calendar).


## Checking logs

All services log to stdout; Docker Compose captures them.

```bash
# Follow all services
docker compose logs -f

# Follow just the website (or `admin`, `worker`)
docker compose logs -f web

# Last 100 lines of the worker
docker compose logs --tail=100 worker

# Since a specific time (UTC)
docker compose logs --since 2026-11-01T00:00:00
```


## Restarting a service

```bash
# Restart just the website without rebuilding (or `admin`, `worker`)
docker compose restart web

# Restart all services
docker compose restart

# Full stop and start (use if docker compose restart does not help)
docker compose down
docker compose up -d
```


## Restoring the pre-deploy database dump

Pre-deploy dumps are saved in `backups/` as `.sql.gz` files.

1. Find the dump you want:

```bash
ls -lh backups/
```

2. Restore it (this OVERWRITES the current database):

```bash
# Stop the website, admin and worker so they are not writing during the restore
docker compose stop web admin worker

# Drop and recreate the database, then restore
docker compose exec -T db psql -U gyn -c "DROP DATABASE gyn; CREATE DATABASE gyn;"
gunzip -c backups/pre-deploy-TIMESTAMP.sql.gz | docker compose exec -T db psql -U gyn -d gyn

# Restart
docker compose start web admin worker
```

3. Verify: visit the site and check a few pages work correctly.


## Rolling back to the previous commit

If the new code is broken and the dump restore is not sufficient:

1. Restore the database dump (see above).

2. Roll back the code:

```bash
git log --oneline -5  # find the previous commit hash
git checkout PREVIOUS_COMMIT_HASH
./deploy/deploy.sh
```

Note: `deploy.sh` checks for uncommitted changes. After `git checkout`, the working tree matches the commit, so the check passes.

3. After confirming the rollback is stable, pin the problem in a new commit on main and deploy again normally.


## Checking service health

```bash
docker compose ps
```

All services should show "healthy" or "running". The `migrate` service shows "exited (0)" after a successful run, which is correct.

```bash
# Quick API health check, website and admin
curl https://thegyn.org/api/health
curl https://admin.thegyn.org/api/health
# Expected: {"ok":true,"db":"up"}

# The internal route must NOT be reachable from outside (expected: 404)
curl -i -X POST https://thegyn.org/api/internal/revalidate
```
