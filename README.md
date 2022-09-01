# telegram-mute-scheduler
Scheduler for muting group & user notifications on Telegram.

## Setup Instructions:

### 1) Set up files

###### Clone repo
```bash
git clone https://github.com/jasbanza/telegram-mute-scheduler.git
```
###### Navigate to project root and install node dependencies
```bash
cd telegram-mute-scheduler
```
```bash
npm install
```

###### Create config.json from template and edit accordingly:
```bash
cp /config/config-template.json /config/config.json
```


###### Set permissions on config folder so that the background service (root) can create and save the Telegram session.json:
```bash
chown root -R config
```
```bash
chmod 766 -R config
```

###### Optional - update path to node executable for the ExecStart property in the service file. _(root's path might differ to the logged in user / nvm's path, and if it's an older version of nodejs, it might break stuff...)_
```bash
which node
```

### 2) Set up background service

###### Copy the .service file into /etc/systemd/system/

```bash
cp telegram-mute-scheduler.service /etc/systemd/system/telegram-mute-scheduler.service
```
###### Make it executable
```bash
sudo chmod 755 /etc/systemd/system/telegram-mute-scheduler.service
```

###### Restart systemctl to register the new service
```bash
systemctl daemon-restart
```

###### Check status of mute scheduler background process:
```bash
systemctl status telegram-mute-scheduler.service
```
###### Any errors can be found in the log: 
```bash
journalctl -u telegram-mute-scheduler.service
```

### 3) Expose web service
###### Allow port 3000 through firewall
```bash
sudo ufw allow 3000
```
###### Check if web server is accessible on port 3000
