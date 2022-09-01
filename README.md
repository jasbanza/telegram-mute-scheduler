# telegram-mute-scheduler
Scheduler for muting group & user notifications on Telegram.

## Setup Instructions:

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

###### Get path to node executable to update the ExecStart in the service file:
```bash
which node
```
###### _root's path might differ to the logged in user / nvm's path, and if it's an older version of nodejs, it might break stuff..._

```bash
cp telegram-mute-scheduler.service /etc/systemd/system/telegram-mute-scheduler.service
```
```bash
sudo chmod 755 /etc/systemd/system/telegram-mute-scheduler.service
```
###### restart systemctl 

```bash
systemctl daemon-restart
```

###### Check status of mute scheduler background process:

```bash
systemctl status telegram-mute-scheduler
```

###### Allow port 3000 through firewall
```bash
sudo ufw allow 3000
```
###### check if web server is running on port 3000
