# Deployment process

This application is deployed to a pet AWS server. These are the commands I ran to set everything up.

## User

User that will run the web server

```sh
sudo adduser uca_meetings
```

## Postgres

```sh
sudo dnf install postgresql17 postgresql17-server
sudo -u postgres /usr/bin/postgresql-setup --initdb
sudo systemctl start postgresql
systemctl status postgresql
sudo -u postgres psql -c "CREATE DATABASE uca_meetings"
sudo -u postgres psql -c "CREATE ROLE uca_meetings LOGIN"
sudo -u postgres psql -c "GRANT ALL ON DATABASE uca_meetings TO uca_meetings"
sudo -u postgres psql uca_meetings -c "GRANT ALL ON SCHEMA public TO uca_meetings"
# check with:
sudo -u uca_meetings psql uca_meetings
```

### Javascript

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

```

## Python

Already installed but we need to bind to port 80 so:

```sh
sudo setcap 'cap_net_bind_service=+ep' $(realpath $(which python3))
sudo mkdir /var/log/uca_meetings
sudo chown -r uca_meetings:uca_meetings /var/log/uca_meetings
```

## Git

```sh
sudo dnf install git
cd ~
git clone https://github.com/tessereth/uca_meetings.git
# Make home world readable so the uca_meetings user can see the repo
chmod 0755 ~
```